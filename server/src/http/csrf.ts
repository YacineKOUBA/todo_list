/**
 * Contrôles transverses des écritures : origine et jeton CSRF.
 *
 * Le cookie de session est `SameSite=Strict` ; le jeton CSRF le complète
 * (défense en profondeur, docs/12 §4.6). La connexion est la seule route
 * d'écriture exemptée : elle ne dispose pas encore de session.
 */

import type { RequestHandler } from 'express'
import { ApiError } from '../security/problem'
import { ENTETE_CSRF, verifyCsrfToken } from '../security/session-tokens'
import type { AppContext } from './context'

const METHODES_SURES = new Set(['GET', 'HEAD', 'OPTIONS'])
const CHEMINS_EXEMPTES = new Set(['/api/v1/auth/login'])

function cheminSansRequete(url: string): string {
  const index = url.indexOf('?')
  return index < 0 ? url : url.slice(0, index)
}

export function createOriginCheck(ctx: AppContext): RequestHandler {
  const origineAttendue = ctx.env.APP_ORIGIN.replace(/\/+$/, '')
  return (req, _res, next) => {
    if (METHODES_SURES.has(req.method)) {
      next()
      return
    }
    const origine = req.get('origin')
    if (origine !== undefined && origine.replace(/\/+$/, '') !== origineAttendue) {
      throw new ApiError(
        403,
        'ACTION_NON_AUTORISEE',
        'L’origine de la requête n’est pas autorisée.',
      )
    }
    next()
  }
}

export function createCsrfCheck(ctx: AppContext): RequestHandler {
  return (req, _res, next) => {
    if (METHODES_SURES.has(req.method)) {
      next()
      return
    }
    if (CHEMINS_EXEMPTES.has(cheminSansRequete(req.originalUrl))) {
      next()
      return
    }
    const auth = req.auth
    // Sans session utilisable, le contrôle d'authentification renverra 401.
    if (auth === undefined) {
      next()
      return
    }
    if (!verifyCsrfToken(ctx.env.SESSION_SECRET, auth.sessionId, req.get(ENTETE_CSRF))) {
      throw new ApiError(
        403,
        'JETON_CSRF_INVALIDE',
        'Le jeton CSRF est absent ou invalide. Rechargez la page.',
      )
    }
    next()
  }
}
