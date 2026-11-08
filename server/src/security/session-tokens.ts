/**
 * Jetons de session et CSRF — D77, T13-04, T13-05, T13-11.
 *
 * Le jeton de session est opaque (32 octets base64url) et n'est **jamais**
 * stocké en clair : seule son empreinte HMAC-SHA-256 est conservée. Le jeton
 * CSRF est dérivé de l'identifiant de session, sans stockage supplémentaire.
 */

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import type { CookieOptions } from 'express'

export const NOM_COOKIE_SESSION = 'gd_session'
export const ENTETE_CSRF = 'x-csrf-token'

export const DUREE_INACTIVITE_MINUTES = 30
export const DUREE_ABSOLUE_HEURES = 10
export const COOKIE_MAX_AGE_SECONDES = DUREE_ABSOLUE_HEURES * 3600
export const INTERVALLE_ACTIVITE_MS = 60_000
export const MAX_SESSIONS_ACTIVES = 5
export const PURGE_SESSIONS_JOURS = 7

/** 32 octets aléatoires encodés en base64url (43 caractères). */
export function generateSessionToken(): string {
  return randomBytes(32).toString('base64url')
}

/** Empreinte HMAC-SHA-256 hexadécimale du jeton (unicité en base). */
export function hashSessionToken(secret: string, jeton: string): string {
  return createHmac('sha256', secret).update(jeton, 'utf8').digest('hex')
}

/** Jeton CSRF = base64url(HMAC-SHA-256(secret, "csrf:" + id)). */
export function generateCsrfToken(secret: string, sessionId: string): string {
  return createHmac('sha256', secret).update(`csrf:${sessionId}`, 'utf8').digest('base64url')
}

export function timingSafeEqualStrings(a: string, b: string): boolean {
  const tamponA = Buffer.from(a, 'utf8')
  const tamponB = Buffer.from(b, 'utf8')
  if (tamponA.length !== tamponB.length) return false
  return timingSafeEqual(tamponA, tamponB)
}

export function verifyCsrfToken(
  secret: string,
  sessionId: string,
  jetonRecu: string | null | undefined,
): boolean {
  if (jetonRecu === null || jetonRecu === undefined || jetonRecu.length === 0) return false
  return timingSafeEqualStrings(generateCsrfToken(secret, sessionId), jetonRecu)
}

/** Expiration absolue d'une session créée à `creeLe`. */
export function sessionExpiryFrom(creeLe: Date, heures = DUREE_ABSOLUE_HEURES): Date {
  return new Date(creeLe.getTime() + heures * 3600 * 1000)
}

export interface SessionTimestamps {
  creeLe: Date
  derniereActiviteLe: Date
  expireLe: Date
  revoqueLe: Date | null
}

/** Vérifie révocation, expiration absolue puis inactivité (docs/12 §4.5). */
export function isSessionUsable(
  session: SessionTimestamps,
  maintenant: Date,
  minutesInactivite = DUREE_INACTIVITE_MINUTES,
): boolean {
  if (session.revoqueLe !== null) return false
  if (maintenant.getTime() > session.expireLe.getTime()) return false
  const inactiviteMs = maintenant.getTime() - session.derniereActiviteLe.getTime()
  return inactiviteMs <= minutesInactivite * 60 * 1000
}

/**
 * L'activité n'est écrite qu'au plus une fois par minute, pour limiter les
 * écritures en base (D77).
 */
export function shouldTouchActivity(derniereActiviteLe: Date, maintenant: Date): boolean {
  return maintenant.getTime() - derniereActiviteLe.getTime() >= INTERVALLE_ACTIVITE_MS
}

export function sessionCookieOptions(secure: boolean): CookieOptions {
  return {
    httpOnly: true,
    secure,
    sameSite: 'strict',
    path: '/api',
    maxAge: COOKIE_MAX_AGE_SECONDES * 1000,
    priority: 'high',
  }
}

export function clearedSessionCookieOptions(secure: boolean): CookieOptions {
  return {
    httpOnly: true,
    secure,
    sameSite: 'strict',
    path: '/api',
    maxAge: 0,
  }
}
