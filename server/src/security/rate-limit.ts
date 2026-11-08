/**
 * Limitation par adresse IP — T13-06, D78, docs/12 §5.2.
 *
 * Trois limites complémentaires, stockées en mémoire (serveur unique, R7) :
 *  - connexion : 10 tentatives / 15 minutes ;
 *  - API globale : 100 requêtes / minute ;
 *  - écritures : 30 requêtes / minute.
 *
 * La réponse est `429 TROP_DE_TENTATIVES` avec `Retry-After`.
 */

import { rateLimit } from 'express-rate-limit'
import type { Request, RequestHandler, Response } from 'express'
import { ApiError, sendProblem } from './problem'

export interface RateLimitPolicy {
  windowMs: number
  limit: number
}

export const POLITIQUES_LIMITATION = {
  connexion: { windowMs: 15 * 60 * 1000, limit: 10 },
  globale: { windowMs: 60 * 1000, limit: 100 },
  ecritures: { windowMs: 60 * 1000, limit: 30 },
} as const satisfies Record<string, RateLimitPolicy>

interface RequeteLimitee extends Request {
  rateLimit?: { resetTime?: Date }
}

function handlerPour(policy: RateLimitPolicy) {
  return (req: Request, res: Response): void => {
    const resetTime = (req as RequeteLimitee).rateLimit?.resetTime
    const secondes =
      resetTime === undefined
        ? Math.ceil(policy.windowMs / 1000)
        : Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000))
    res.setHeader('Retry-After', String(secondes))
    sendProblem(
      res,
      new ApiError(
        429,
        'TROP_DE_TENTATIVES',
        'Trop de requêtes. Réessayez dans quelques instants.',
      ),
      req.originalUrl,
    )
  }
}

export function createRateLimiter(policy: RateLimitPolicy): RequestHandler {
  return rateLimit({
    windowMs: policy.windowMs,
    limit: policy.limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: handlerPour(policy),
  })
}

export function createLoginRateLimiter(): RequestHandler {
  return createRateLimiter(POLITIQUES_LIMITATION.connexion)
}

export function createGlobalRateLimiter(): RequestHandler {
  return createRateLimiter(POLITIQUES_LIMITATION.globale)
}

export function createWriteRateLimiter(): RequestHandler {
  return createRateLimiter(POLITIQUES_LIMITATION.ecritures)
}
