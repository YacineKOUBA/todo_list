/**
 * Middleware de session — docs/12 §4.5, T13-04.
 *
 * Ordre de validation strict :
 *  1. cookie présent ;
 *  2. empreinte HMAC connue en base ;
 *  3. session non révoquée ;
 *  4. durée absolue non dépassée ;
 *  5. inactivité ≤ 30 minutes ;
 *  6. compte existant et actif ;
 *  7. droits recalculés à chaque requête (D73) ;
 *  8. changement de mot de passe vérifié par le middleware suivant ;
 *  9. jeton CSRF vérifié sur les écritures ;
 * 10. autorisation métier appliquée route par route.
 */

import type { RequestHandler } from 'express'
import { ApiError } from '../security/problem'
import {
  hashSessionToken,
  isSessionUsable,
  shouldTouchActivity,
  NOM_COOKIE_SESSION,
} from '../security/session-tokens'
import type { AppContext } from './context'
import { readCookie } from './cookies'
import type { AuthSession } from './types'

export function createSessionMiddleware(ctx: AppContext): RequestHandler {
  return async (req, _res, next) => {
    const jeton = readCookie(req, NOM_COOKIE_SESSION)
    if (jeton === null) {
      next()
      return
    }

    const jetonHash = hashSessionToken(ctx.env.SESSION_SECRET, jeton)
    const session = await ctx.prisma.session.findUnique({
      where: { jetonHash },
      include: {
        utilisateur: {
          include: {
            employe: { include: { departement: true } },
          },
        },
      },
    })

    if (session === null) {
      req.sessionIssue = 'SESSION_EXPIREE'
      next()
      return
    }

    const maintenant = ctx.clock.now()
    if (!isSessionUsable(session, maintenant, ctx.env.SESSION_IDLE_MINUTES)) {
      req.sessionIssue = 'SESSION_EXPIREE'
      next()
      return
    }

    if (!session.utilisateur.actif) {
      req.sessionIssue = 'SESSION_EXPIREE'
      next()
      return
    }

    if (shouldTouchActivity(session.derniereActiviteLe, maintenant)) {
      await ctx.prisma.session.update({
        where: { id: session.id },
        data: { derniereActiviteLe: maintenant },
      })
    }

    const auth: AuthSession = {
      sessionId: session.id,
      utilisateur: {
        id: session.utilisateur.id,
        identifiant: session.utilisateur.identifiant,
        role: session.utilisateur.role,
        organisation: session.utilisateur.organisation,
        serviceId: session.utilisateur.serviceId,
        actif: session.utilisateur.actif,
        doitChangerMotDePasse: session.utilisateur.doitChangerMotDePasse,
      },
      employe:
        session.utilisateur.employe === null
          ? null
          : {
              id: session.utilisateur.employe.id,
              nom: session.utilisateur.employe.nom,
              prenom: session.utilisateur.employe.prenom,
              email: session.utilisateur.employe.email,
              departementId: session.utilisateur.employe.departementId,
              departement:
                session.utilisateur.employe.departement === null
                  ? null
                  : {
                      id: session.utilisateur.employe.departement.id,
                      libelle: session.utilisateur.employe.departement.libelle,
                    },
            },
    }
    req.auth = auth
    next()
  }
}

/** Exige une session utilisable ; sinon 401 avec le code discriminant. */
export const requireAuth: RequestHandler = (req, _res, next) => {
  if (req.auth !== undefined) {
    next()
    return
  }
  if (req.sessionIssue === 'SESSION_EXPIREE') {
    throw new ApiError(401, 'SESSION_EXPIREE', 'La session a expiré. Reconnectez-vous.')
  }
  throw new ApiError(401, 'AUTHENTIFICATION_REQUISE', 'Une authentification est requise.')
}

/** Accès direct à la session dans une route déjà protégée. */
export function authOf(req: { auth?: AuthSession }): AuthSession {
  if (req.auth === undefined) {
    throw new ApiError(401, 'AUTHENTIFICATION_REQUISE', 'Une authentification est requise.')
  }
  return req.auth
}

/** Routes accessibles tant que le mot de passe n'a pas été changé (EF-09). */
export const CHEMINS_SANS_MOT_DE_PASSE_CHANGE = new Set([
  '/auth/logout',
  '/auth/csrf',
  '/auth/password',
  '/me',
])

export function cheminApi(path: string): string {
  const sansPrefixe = path.startsWith('/api/v1') ? path.slice('/api/v1'.length) : path
  return sansPrefixe.length === 0 ? '/' : sansPrefixe.replace(/\/+$/, '')
}

export const requirePasswordChanged: RequestHandler = (req, _res, next) => {
  const auth = req.auth
  if (auth === undefined || !auth.utilisateur.doitChangerMotDePasse) {
    next()
    return
  }
  if (CHEMINS_SANS_MOT_DE_PASSE_CHANGE.has(cheminApi(req.path))) {
    next()
    return
  }
  throw new ApiError(
    403,
    'CHANGEMENT_MOT_DE_PASSE_REQUIS',
    'Vous devez changer votre mot de passe avant de continuer.',
  )
}
