/**
 * Validation des entrées HTTP avec Zod.
 *
 * Correspondance avec le catalogue d'erreurs (`docs/07` §5.2 et §9) :
 *  - propriété non prévue      → `400 CHAMP_INCONNU` ;
 *  - champ requis absent       → `422 CHAMP_OBLIGATOIRE` ;
 *  - type ou valeur invalide   → `422 VALEUR_INVALIDE` ;
 *  - paramètre de requête      → `400 REQUETE_INVALIDE`.
 *
 * Les messages restent génériques : aucune valeur envoyée par le client n'est
 * recopiée dans la réponse d'erreur.
 */

import type { Request } from 'express'
import { z } from 'zod'
import { ApiError, type FieldError } from '../security/problem'

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const schemaDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'format attendu AAAA-MM-JJ')
  .refine((valeur) => {
    const date = new Date(`${valeur}T00:00:00.000Z`)
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === valeur
  }, 'date inexistante')

export const schemaUuid = z.string().regex(uuid, 'UUID attendu')

export const schemaHeure = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'heure attendue HH:MM')

/** Identifiant d'URL : une valeur invalide est une requête invalide, pas un 500. */
export function lireUuid(valeur: unknown, champ = 'id'): string {
  const resultat = schemaUuid.safeParse(valeur)
  if (!resultat.success) {
    throw new ApiError(400, 'REQUETE_INVALIDE', 'Identifiant invalide.', [
      { champ, code: 'VALEUR_INVALIDE', message: 'UUID attendu.' },
    ])
  }
  return resultat.data
}

/** Chaîne obligatoire : vide après `trim` → CHAMP_OBLIGATOIRE. */
export function texteObligatoire(max: number) {
  return z
    .string()
    .max(max, `longueur maximale ${String(max)}`)
    .refine((valeur) => valeur.trim().length > 0, 'CHAMP_OBLIGATOIRE')
}

/** Chaîne facultative : `null` et absence sont équivalents côté API. */
export function texteFacultatif(max: number) {
  return z
    .string()
    .max(max, `longueur maximale ${String(max)}`)
    .nullable()
    .optional()
}

export const schemaCorpsVide = z.strictObject({})

function estIssueObligatoire(issue: z.core.$ZodIssue): boolean {
  if (issue.code === 'custom' && issue.message === 'CHAMP_OBLIGATOIRE') return true
  if (issue.code === 'invalid_type' && 'input' in issue && issue.input === undefined) return true
  return false
}

function versErreurs(issues: readonly z.core.$ZodIssue[]): FieldError[] {
  return issues.map((issue) => {
    const champ = issue.path.length > 0 ? issue.path.map(String).join('.') : '(corps)'
    if (estIssueObligatoire(issue)) {
      return { champ, code: 'CHAMP_OBLIGATOIRE', message: 'Champ obligatoire.' }
    }
    return { champ, code: 'VALEUR_INVALIDE', message: 'Valeur invalide.' }
  })
}

export function parseBody<T>(schema: z.ZodType<T>, req: Request): T {
  const resultat = schema.safeParse(req.body)
  if (resultat.success) return resultat.data

  const champsInconnus = resultat.error.issues.filter((issue) => issue.code === 'unrecognized_keys')
  if (champsInconnus.length > 0) {
    const erreurs: FieldError[] = []
    for (const issue of champsInconnus) {
      if (issue.code !== 'unrecognized_keys') continue
      for (const cle of issue.keys) {
        erreurs.push({
          champ: cle,
          code: 'CHAMP_INCONNU',
          message: 'Champ non prévu par le contrat.',
        })
      }
    }
    throw new ApiError(
      400,
      'CHAMP_INCONNU',
      'Le corps de la requête contient un ou plusieurs champs non prévus.',
      erreurs,
    )
  }

  const erreurs = versErreurs(resultat.error.issues)
  const obligatoire = erreurs.some((erreur) => erreur.code === 'CHAMP_OBLIGATOIRE')
  throw new ApiError(
    422,
    obligatoire ? 'CHAMP_OBLIGATOIRE' : 'VALEUR_INVALIDE',
    obligatoire ? 'Un champ obligatoire est absent.' : 'Une ou plusieurs valeurs sont invalides.',
    erreurs,
  )
}

export function parseQuery<T>(schema: z.ZodType<T>, req: Request): T {
  const source = Object.fromEntries(
    Object.entries(req.query).map(([cle, valeur]) => [
      cle,
      Array.isArray(valeur) ? valeur.map(String) : valeur,
    ]),
  )
  const resultat = schema.safeParse(source)
  if (resultat.success) return resultat.data

  const champsInconnus = resultat.error.issues.filter((issue) => issue.code === 'unrecognized_keys')
  if (champsInconnus.length > 0) {
    const erreurs: FieldError[] = []
    for (const issue of champsInconnus) {
      if (issue.code !== 'unrecognized_keys') continue
      for (const cle of issue.keys) {
        erreurs.push({
          champ: cle,
          code: 'CHAMP_INCONNU',
          message: 'Paramètre non prévu.',
        })
      }
    }
    throw new ApiError(400, 'CHAMP_INCONNU', 'Un ou plusieurs paramètres sont inconnus.', erreurs)
  }

  throw new ApiError(
    400,
    'REQUETE_INVALIDE',
    'Un ou plusieurs paramètres de requête sont invalides.',
    versErreurs(resultat.error.issues),
  )
}

/** Convertit un booléen de requête (`true` / `false` uniquement). */
export const schemaBooleen = z
  .enum(['true', 'false'])
  .transform((valeur) => valeur === 'true')

export const schemaPagination = {
  page: z.coerce.number().int().min(1).default(1),
  taille: z.coerce.number().int().min(1).max(200).default(50),
}
