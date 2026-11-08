/**
 * Hachage des mots de passe — T13-01, docs/12 §3.4.
 *
 * Argon2id uniquement : 64 Mio, 3 passes, parallélisme 1, sel de 16 octets
 * généré par la bibliothèque, sortie de 32 octets. Aucun poivre en V1.
 */

import { hash, parseOptions, verify } from '@node-rs/argon2'
import type { Options } from '@node-rs/argon2'

/**
 * `Algorithm.Argon2id` vaut 2 dans `@node-rs/argon2`. La constante est écrite
 * en clair car le paquet la déclare en `const enum` (incompatible avec
 * `isolatedModules`).
 */
const ARGON2ID = 2 as const

export const PARAMETRES_ARGON2: Readonly<Options> = {
  algorithm: ARGON2ID,
  memoryCost: 65_536,
  timeCost: 3,
  parallelism: 1,
  outputLen: 32,
}

export function hashPassword(motDePasse: string): Promise<string> {
  return hash(motDePasse, PARAMETRES_ARGON2)
}

export function verifyPassword(hashStocke: string, motDePasse: string): Promise<boolean> {
  return verify(hashStocke, motDePasse)
}

/**
 * Vrai si le hash stocké utilise des paramètres inférieurs à la politique
 * courante : il doit alors être recalculé à la connexion réussie (T13-01).
 */
export function needsRehash(hashStocke: string): boolean {
  let parametres
  try {
    parametres = parseOptions(hashStocke)
  } catch {
    return true
  }
  return (
    parametres.memoryCost < (PARAMETRES_ARGON2.memoryCost ?? 0) ||
    parametres.timeCost < (PARAMETRES_ARGON2.timeCost ?? 0) ||
    parametres.parallelism < (PARAMETRES_ARGON2.parallelism ?? 0) ||
    parametres.outputLen < (PARAMETRES_ARGON2.outputLen ?? 0)
  )
}

let hashFactice: Promise<string> | null = null

/**
 * Hash factice calculé une seule fois, avec les mêmes paramètres.
 *
 * Pour un identifiant inconnu, le serveur vérifie le mot de passe fourni
 * contre ce hash : le temps de réponse devient comparable à celui d'un compte
 * existant (EF-10).
 */
export function dummyPasswordHash(): Promise<string> {
  hashFactice ??= hashPassword('mot-de-passe-factice-pour-egaliser-le-temps-de-reponse')
  return hashFactice
}
