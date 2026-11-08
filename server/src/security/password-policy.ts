/**
 * Politique de mot de passe — D76, docs/12 §3.3.
 *
 * 12 à 128 caractères, aucune composition imposée, caractères Unicode
 * imprimables acceptés, mot de passe différent de l'identifiant. La
 * comparaison avec l'ancien mot de passe se fait par Argon2id, jamais en
 * clair (voir `argon2.ts`).
 */

export const LONGUEUR_MIN_MOT_DE_PASSE = 12
export const LONGUEUR_MAX_MOT_DE_PASSE = 128

export interface PasswordFieldError {
  champ: string
  code: 'MOT_DE_PASSE_INVALIDE'
  message: string
}

export interface PasswordPolicyInput {
  motDePasse: string
  identifiant: string
}

/** Nombre de caractères Unicode (points de code), pas d'unités UTF-16. */
export function passwordLength(motDePasse: string): number {
  return Array.from(motDePasse).length
}

/** Retourne la liste des erreurs ; un tableau vide signifie « conforme ». */
export function validatePasswordPolicy(input: PasswordPolicyInput): PasswordFieldError[] {
  const erreurs: PasswordFieldError[] = []
  const longueur = passwordLength(input.motDePasse)

  if (longueur < LONGUEUR_MIN_MOT_DE_PASSE) {
    erreurs.push({
      champ: 'nouveauMotDePasse',
      code: 'MOT_DE_PASSE_INVALIDE',
      message: `Le mot de passe doit contenir au moins ${LONGUEUR_MIN_MOT_DE_PASSE} caractères.`,
    })
  }

  if (longueur > LONGUEUR_MAX_MOT_DE_PASSE) {
    erreurs.push({
      champ: 'nouveauMotDePasse',
      code: 'MOT_DE_PASSE_INVALIDE',
      message: `Le mot de passe ne doit pas dépasser ${LONGUEUR_MAX_MOT_DE_PASSE} caractères.`,
    })
  }

  if (
    longueur > 0 &&
    input.motDePasse.toLocaleLowerCase('fr-FR') === input.identifiant.toLocaleLowerCase('fr-FR')
  ) {
    erreurs.push({
      champ: 'nouveauMotDePasse',
      code: 'MOT_DE_PASSE_INVALIDE',
      message: 'Le mot de passe ne doit pas être identique à l’identifiant.',
    })
  }

  return erreurs
}
