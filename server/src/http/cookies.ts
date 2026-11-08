/**
 * Lecture et écriture du cookie de session.
 *
 * `cookie-parser` n'est pas nécessaire : une seule valeur est lue, avec un
 * analyseur minimal qui ne décode rien (le jeton est en base64url, sans
 * caractère réservé). Le cookie reste `HttpOnly`, `SameSite=Strict`,
 * `Path=/api` (docs/12 §4.2).
 */

import type { Request, Response } from 'express'
import {
  clearedSessionCookieOptions,
  NOM_COOKIE_SESSION,
  sessionCookieOptions,
} from '../security/session-tokens'

export function readCookie(req: Request, nom: string): string | null {
  const entete = req.headers.cookie
  if (typeof entete !== 'string' || entete.length === 0) return null

  for (const morceau of entete.split(';')) {
    const separateur = morceau.indexOf('=')
    if (separateur < 0) continue
    const cle = morceau.slice(0, separateur).trim()
    if (cle !== nom) continue
    const valeur = morceau.slice(separateur + 1).trim()
    return valeur.length > 0 ? valeur : null
  }
  return null
}

export function setSessionCookie(res: Response, jeton: string, secure: boolean): void {
  res.cookie(NOM_COOKIE_SESSION, jeton, sessionCookieOptions(secure))
}

export function clearSessionCookie(res: Response, secure: boolean): void {
  res.clearCookie(NOM_COOKIE_SESSION, clearedSessionCookieOptions(secure))
}
