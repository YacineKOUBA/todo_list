/**
 * Mot de passe temporaire — T13-02, docs/12 §3.6.
 *
 * 16 caractères, alphabet sans caractères ambigus
 * (`A-HJ-NP-Z`, `a-km-z`, `2-9`), générés par `crypto.randomInt`.
 * Le mot de passe en clair n'est jamais stocké ni journalisé.
 */

import { randomInt } from 'node:crypto'

export const ALPHABET_MOT_DE_PASSE_TEMPORAIRE =
  'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'

export const LONGUEUR_MOT_DE_PASSE_TEMPORAIRE = 16

export type RandomInt = (min: number, max: number) => number

/** Génère un mot de passe temporaire ; `randomInt` est injectable pour les tests. */
export function generateTemporaryPassword(
  random: RandomInt = randomInt,
  longueur: number = LONGUEUR_MOT_DE_PASSE_TEMPORAIRE,
): string {
  if (!Number.isInteger(longueur) || longueur < 1) {
    throw new RangeError(`Longueur de mot de passe invalide : ${longueur}`)
  }
  let resultat = ''
  for (let index = 0; index < longueur; index += 1) {
    resultat += ALPHABET_MOT_DE_PASSE_TEMPORAIRE.charAt(
      random(0, ALPHABET_MOT_DE_PASSE_TEMPORAIRE.length),
    )
  }
  return resultat
}
