/**
 * Erreurs applicatives au format `application/problem+json` (RFC 9457).
 *
 * Source : docs/07 §5. Le champ `code` est la seule clé de traitement côté
 * interface ; `detail` est un message français sans donnée sensible.
 */

import type { Request, Response } from 'express'

export interface FieldError {
  champ: string
  code: string
  message: string
}

export interface ProblemDetails {
  type: string
  title: string
  status: number
  code: string
  detail: string
  instance?: string
  erreurs?: FieldError[]
}

const BASE_TYPE = 'https://gd-trading.local/erreurs/'

export const TITRES: Readonly<Record<string, string>> = {
  AUTHENTIFICATION_REQUISE: 'Authentification requise',
  SESSION_EXPIREE: 'Session expirée',
  IDENTIFIANTS_INVALIDES: 'Identifiants invalides',
  CHANGEMENT_MOT_DE_PASSE_REQUIS: 'Changement de mot de passe requis',
  JETON_CSRF_INVALIDE: 'Jeton CSRF invalide',
  TROP_DE_TENTATIVES: 'Trop de tentatives',
  MOT_DE_PASSE_INVALIDE: 'Mot de passe invalide',
  MOT_DE_PASSE_IDENTIQUE: 'Mot de passe identique',
  ACTION_NON_AUTORISEE: 'Action non autorisée',
  RESSOURCE_INTROUVABLE: 'Ressource introuvable',
  METHODE_NON_AUTORISEE: 'Méthode non autorisée',
  REQUETE_INVALIDE: 'Requête invalide',
  CHAMP_INCONNU: 'Champ inconnu',
  CHAMP_OBLIGATOIRE: 'Champ obligatoire',
  VALEUR_INVALIDE: 'Valeur invalide',
  DATE_INCOHERENTE: 'Dates incohérentes',
  NATURE_INVALIDE: 'Nature de tâche invalide',
  PILOTE_INVALIDE: 'Pilote invalide',
  COMBINAISON_PRIORITE_INVALIDE: 'Combinaison de priorité invalide',
  TACHE_QUOTIDIENNE_HORS_DELAI: 'Tâche quotidienne hors délai',
  TACHE_QUOTIDIENNE_JOUR_NON_OUVRE: 'Tâche quotidienne un jour non ouvré',
  MOTIF_OBLIGATOIRE: 'Motif obligatoire',
  DERNIER_ADMIN: 'Dernier administrateur',
  AUTO_MODIFICATION_INTERDITE: 'Auto-modification interdite',
  EMPLOYE_INACTIF: 'Employé inactif',
  TACHE_DEJA_CLOTUREE: 'Tâche déjà clôturée',
  VERSION_OBSOLETE: 'Version obsolète',
  PROGRESSION_INVALIDE: 'Progression invalide',
  TRI_NON_SUPPORTE: 'Tri non supporté',
  IDENTIFIANT_DEJA_UTILISE: 'Identifiant déjà utilisé',
  COMPTE_DEJA_LIE: 'Compte déjà lié',
  RESPONSABLE_DEJA_PRESENT: 'Responsable déjà présent',
  RESPONSABLE_SANS_DEPARTEMENT: 'Responsable sans département',
  REFERENTIEL_REFERENCE: 'Référentiel référencé',
  DEPARTEMENT_AVEC_RESPONSABLE: 'Département avec responsable',
  FERIE_DEJA_PRESENT: 'Jour férié déjà présent',
  PARAMETRE_INVALIDE: 'Paramètre invalide',
  CHARGE_TROP_VOLUMINEUSE: 'Charge trop volumineuse',
  TYPE_MEDIA_NON_SUPPORTE: 'Type de média non supporté',
  BASE_INDISPONIBLE: 'Base indisponible',
  ERREUR_INTERNE: 'Erreur interne',
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly detail: string
  readonly erreurs: readonly FieldError[] | undefined

  constructor(status: number, code: string, detail: string, erreurs?: readonly FieldError[]) {
    super(detail)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.detail = detail
    this.erreurs = erreurs
  }

  get title(): string {
    return TITRES[this.code] ?? this.code
  }
}

export function toProblemDetails(error: ApiError, instance?: string): ProblemDetails {
  const problem: ProblemDetails = {
    type: `${BASE_TYPE}${error.code}`,
    title: error.title,
    status: error.status,
    code: error.code,
    detail: error.detail,
  }
  if (instance !== undefined) problem.instance = instance
  if (error.erreurs !== undefined && error.erreurs.length > 0) {
    problem.erreurs = [...error.erreurs]
  }
  return problem
}

/** Écrit une erreur applicative dans la réponse HTTP. */
export function sendProblem(res: Response, error: ApiError, instance?: string): void {
  const problem = toProblemDetails(error, instance)
  res.status(error.status).type('application/problem+json').json(problem)
}

/** Construit une instance depuis la requête courante. */
export function instanceOf(req: Request): string {
  return req.originalUrl
}
