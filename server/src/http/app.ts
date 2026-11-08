/**
 * Application Express — assemblage des middlewares et des routes.
 *
 * Ordre imposé (docs/04 §9, docs/12 §10, docs/07 §9) :
 *  HTTPS → journal → en-têtes → corps JSON → session → origine → CSRF →
 *  routes publiques → authentification → mot de passe → routes métier →
 *  404 → gestionnaire d'erreurs.
 *
 * `createApp` ne lit ni `process.env` ni l'horloge système : tout est injecté.
 */

import express, { type ErrorRequestHandler, type Express, type RequestHandler } from 'express'
import type { PrismaClient } from '@prisma/client'
import type { Logger } from 'pino'
import { Prisma } from '@prisma/client'
import type { Env } from '../config/env'
import type { Clock } from '../lib/clock'
import {
  createGlobalRateLimiter,
  createLoginRateLimiter,
  createWriteRateLimiter,
} from '../security/rate-limit'
import { configureExpressSecurity, securityHeaders } from '../security/headers'
import { createRequestLogger } from '../security/logger'
import { ApiError, sendProblem } from '../security/problem'
import { createAccountsRouter } from './accounts'
import { createAuditEventsRouter } from './audit-events'
import { createAuthRouter, createMeRouter } from './auth'
import { createCsrfCheck, createOriginCheck } from './csrf'
import type { AppContext } from './context'
import { createHealthRouter } from './health'
import { createReferentialsRouter } from './referentials'
import { createSessionMiddleware, requireAuth, requirePasswordChanged } from './session'
import { masquerScore } from './score-masque'
import { createTasksRouter } from './tasks'

export interface CreateAppOptions {
  prisma: PrismaClient
  env: Env
  clock: Clock
  logger: Logger
  /** Désactivé dans les tests, sauf pour le test dédié (TC-SEC-009). */
  rateLimit?: boolean
}

const METHODES_ECRITURE = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

/** `http://` → `https://` en production (TC-SEC-037). */
function httpsRedirect(): RequestHandler {
  return (req, res, next) => {
    const proto = req.get('x-forwarded-proto')?.split(',')[0]?.trim() ?? req.protocol
    if (proto === 'https') {
      next()
      return
    }
    const hote = req.get('host')
    if (hote === undefined) {
      next()
      return
    }
    res.redirect(301, `https://${hote}${req.originalUrl}`)
  }
}

/** Refuse un corps non JSON plutôt que de l'ignorer silencieusement. */
function requireJsonBody(): RequestHandler {
  return (req, _res, next) => {
    if (!METHODES_ECRITURE.has(req.method)) {
      next()
      return
    }
    const longueur = req.get('content-length')
    const aUnCorps = longueur !== undefined && longueur !== '0'
    if (!aUnCorps) {
      next()
      return
    }
    const type = req.get('content-type') ?? ''
    if (!/^application\/(?:[\w.+-]+\+)?json(?:;|$)/i.test(type)) {
      throw new ApiError(
        415,
        'TYPE_MEDIA_NON_SUPPORTE',
        'Le corps de la requête doit être au format JSON.',
      )
    }
    next()
  }
}

function estErreurPrismaConnexion(erreur: unknown): boolean {
  return (
    erreur instanceof Prisma.PrismaClientInitializationError ||
    erreur instanceof Prisma.PrismaClientRustPanicError
  )
}

function erreurAnalyseJson(erreur: unknown): ApiError | null {
  if (typeof erreur !== 'object' || erreur === null) return null
  const type = (erreur as { type?: unknown }).type
  if (type === 'entity.too.large') {
    return new ApiError(413, 'CHARGE_TROP_VOLUMINEUSE', 'Le corps de la requête est trop volumineux.')
  }
  if (type === 'entity.parse.failed' || type === 'encoding.unsupported') {
    return new ApiError(400, 'REQUETE_INVALIDE', 'Le corps JSON est mal formé.')
  }
  return null
}

export function createApp(options: CreateAppOptions): Express {
  const { env, logger } = options
  const ctx: AppContext = {
    prisma: options.prisma,
    env,
    clock: options.clock,
    logger,
  }
  const avecLimitation = options.rateLimit ?? true
  const production = env.NODE_ENV === 'production'

  const app = express()
  configureExpressSecurity(app)
  app.set('trust proxy', env.TRUST_PROXY)

  if (production) app.use(httpsRedirect())
  if (env.LOG_LEVEL !== 'silent') app.use(createRequestLogger(logger))
  app.use(securityHeaders({ production }))
  app.use(requireJsonBody())
  app.use(express.json({ limit: '1mb' }))

  const api = express.Router()
  if (avecLimitation) api.use(createGlobalRateLimiter())
  api.use(createSessionMiddleware(ctx))
  api.use(createOriginCheck(ctx))
  api.use(createCsrfCheck(ctx))

  api.use('/health', createHealthRouter(ctx))

  if (avecLimitation) {
    api.use('/auth/login', createLoginRateLimiter())
    api.use('/auth', createWriteRateLimiter())
    // Un limiteur est un état partagé : il doit être créé une seule fois,
    // à l'initialisation de l'application (sinon le quota est réinitialisé
    // à chaque requête et n'a plus aucun effet).
    const limiteurEcriture = createWriteRateLimiter()
    api.use('/tasks', (req, res, next) => {
      if (METHODES_ECRITURE.has(req.method)) {
        limiteurEcriture(req, res, next)
        return
      }
      next()
    })
  }

  // Connexion publique ; les autres routes d'authentification se protègent.
  api.use('/auth', createAuthRouter(ctx))

  // À partir d'ici, une session utilisable est obligatoire.
  api.use(requireAuth)
  api.use(requirePasswordChanged)
  api.use(masquerScore)

  api.use('/me', createMeRouter(ctx))
  api.use('/tasks', createTasksRouter(ctx))
  api.use('/accounts', createAccountsRouter(ctx))
  api.use('/audit-events', createAuditEventsRouter(ctx))
  api.use('/', createReferentialsRouter(ctx))

  api.use((_req, _res, next) => {
    next(new ApiError(404, 'RESSOURCE_INTROUVABLE', 'La ressource demandée est introuvable.'))
  })

  app.use('/api/v1', api)

  app.use((_req, _res, next) => {
    next(new ApiError(404, 'RESSOURCE_INTROUVABLE', 'La ressource demandée est introuvable.'))
  })

  const gestionnaire: ErrorRequestHandler = (erreur, req, res, _next) => {
    const analyse = erreurAnalyseJson(erreur)
    if (analyse !== null) {
      sendProblem(res, analyse, req.originalUrl)
      return
    }
    if (erreur instanceof ApiError) {
      sendProblem(res, erreur, req.originalUrl)
      return
    }
    if (estErreurPrismaConnexion(erreur)) {
      logger.error({ erreur }, 'Base de données indisponible')
      sendProblem(
        res,
        new ApiError(503, 'BASE_INDISPONIBLE', 'Le service est momentanément indisponible.'),
        req.originalUrl,
      )
      return
    }
    logger.error({ erreur }, 'Erreur non prévue')
    sendProblem(
      res,
      new ApiError(500, 'ERREUR_INTERNE', 'Une erreur interne est survenue.'),
      req.originalUrl,
    )
  }
  app.use(gestionnaire)

  return app
}
