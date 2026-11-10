import { calendarDaysBetween, compareCalendarDates, type CalendarDate } from '../lib/calendar-date'

export type PrioriteCode = 'P1_CRITIQUE' | 'P2_HAUTE' | 'P3_MOYENNE' | 'P4_BASSE'
export type NiveauEisenhower = 'HAUTE' | 'BASSE'

export interface Priorite {
  code: PrioriteCode
  libelle: string
  poids: number
}

export const SCORING_CONFIG = {
  /** Note de départ : une tâche terminée à l'échéance vaut 80/100. */
  scoreDeBase: 80,
  penaliteParJour: 5,
  malusSansJustification: 10,
  bonusAvanceParJour: 2,
  plafondProgression: 95,
  poids: {
    P1_CRITIQUE: 3,
    P2_HAUTE: 2,
    P3_MOYENNE: 1.5,
    P4_BASSE: 1,
  } satisfies Record<PrioriteCode, number>,
} as const

export function normaliserUrgence(libelle: string): NiveauEisenhower {
  const texte = libelle.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
  return texte.includes('immediat') || texte.includes('courte') ? 'HAUTE' : 'BASSE'
}

export function normaliserImportance(libelle: string): NiveauEisenhower {
  const texte = libelle.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
  return texte.includes('critique') || texte.includes('eleve') ? 'HAUTE' : 'BASSE'
}

export function calculerPriorite(
  urgence: NiveauEisenhower,
  importance: NiveauEisenhower,
): Priorite {
  if (urgence === 'HAUTE' && importance === 'HAUTE') {
    return { code: 'P1_CRITIQUE', libelle: 'P1 — Critique', poids: SCORING_CONFIG.poids.P1_CRITIQUE }
  }
  if (urgence === 'BASSE' && importance === 'HAUTE') {
    return { code: 'P2_HAUTE', libelle: 'P2 — Haute', poids: SCORING_CONFIG.poids.P2_HAUTE }
  }
  if (urgence === 'HAUTE' && importance === 'BASSE') {
    return { code: 'P3_MOYENNE', libelle: 'P3 — Moyenne', poids: SCORING_CONFIG.poids.P3_MOYENNE }
  }
  return { code: 'P4_BASSE', libelle: 'P4 — Basse', poids: SCORING_CONFIG.poids.P4_BASSE }
}

/** Libellés du référentiel `action_a_prendre` (seed) — l'action découle de la priorité. */
export const ACTIONS_A_PRENDRE = {
  faireImmediatement: 'Faire immédiatement',
  deleguerSiPossible: 'Déléguer si possible',
  planifier: 'Planifier',
} as const

export function actionAPrendrePourPriorite(code: PrioriteCode): string {
  switch (code) {
    case 'P1_CRITIQUE':
    case 'P2_HAUTE':
      return ACTIONS_A_PRENDRE.faireImmediatement
    case 'P3_MOYENNE':
      return ACTIONS_A_PRENDRE.deleguerSiPossible
    case 'P4_BASSE':
      return ACTIONS_A_PRENDRE.planifier
  }
}

export interface ProgressionInput {
  progressionSurchargee: boolean
  progressionManuelle: number | null
  progressionChecklist?: number | null
  dateDebut: CalendarDate
  dateFinPrevue: CalendarDate | null
  dateFin: CalendarDate | null
  aujourdhui: CalendarDate
}

export function calculerProgression(input: ProgressionInput): number {
  if (input.progressionSurchargee && input.progressionManuelle !== null) {
    return Math.min(100, Math.max(0, input.progressionManuelle))
  }
  if (input.progressionChecklist !== undefined && input.progressionChecklist !== null) {
    return Math.min(100, Math.max(0, input.progressionChecklist))
  }
  if (input.dateFin !== null) return 100

  const echeance = input.dateFinPrevue ?? input.dateDebut
  if (compareCalendarDates(input.aujourdhui, input.dateDebut) < 0) return 0
  const total = calendarDaysBetween(input.dateDebut, echeance)
  if (total <= 0) return 0
  const ecoule = calendarDaysBetween(input.dateDebut, input.aujourdhui)
  const valeur = Math.round((Math.min(total, Math.max(0, ecoule)) / total) * 100)
  return Math.min(SCORING_CONFIG.plafondProgression, Math.max(0, valeur))
}

export interface RetardInput {
  echeance: CalendarDate | null
  dateFin: CalendarDate | null
  aujourdhui: CalendarDate
  joursSuspension?: number
  isSupplementaire: boolean
  motifRetard: string | null
  retardValideLe: Date | null
}

export interface Retard {
  enRetard: boolean
  joursRetard: number
  justificationRequise: boolean
  validationRequise: boolean
}

export function calculerRetard(input: RetardInput): Retard {
  if (input.echeance === null) {
    return { enRetard: false, joursRetard: 0, justificationRequise: false, validationRequise: false }
  }

  let jours = 0
  if (input.dateFin !== null) {
    jours = Math.max(0, calendarDaysBetween(input.echeance, input.dateFin))
  } else if (compareCalendarDates(input.echeance, input.aujourdhui) < 0) {
    jours = Math.max(0, calendarDaysBetween(input.echeance, input.aujourdhui))
  }
  jours = Math.max(0, jours - Math.max(0, input.joursSuspension ?? 0))

  const enRetard = jours > 0
  const sansMotif = input.motifRetard === null || input.motifRetard.trim().length === 0
  return {
    enRetard,
    joursRetard: jours,
    justificationRequise: enRetard && !input.isSupplementaire && sansMotif,
    validationRequise: enRetard && !input.isSupplementaire && input.retardValideLe === null,
  }
}

export interface ScoreTacheInput extends RetardInput {
  priorite: PrioriteCode
  /** Une tâche récurrente est notée sur son occurrence : pas de bonus d’avance. */
  recurrente?: boolean
}

export interface ScoreTache {
  valeur: number
  provisoire: boolean
}

export function calculerScoreTache(input: ScoreTacheInput): ScoreTache | null {
  if (input.isSupplementaire) return null

  const retard = calculerRetard(input)
  if (input.dateFin === null && !retard.enRetard) {
    return { valeur: SCORING_CONFIG.scoreDeBase, provisoire: false }
  }

  const avance =
    input.recurrente !== true && input.dateFin !== null && input.echeance !== null
      ? calendarDaysBetween(input.dateFin, input.echeance)
      : 0

  let valeur =
    SCORING_CONFIG.scoreDeBase +
    (avance > 0 ? avance * SCORING_CONFIG.bonusAvanceParJour : 0) -
    retard.joursRetard * SCORING_CONFIG.penaliteParJour

  if (
    retard.joursRetard > 0 &&
    (retard.justificationRequise || retard.validationRequise)
  ) {
    valeur -= SCORING_CONFIG.malusSansJustification
  }

  return {
    valeur: Math.min(100, Math.max(0, Math.round(valeur))),
    provisoire: input.dateFin === null && retard.enRetard,
  }
}

export interface ScorePondere {
  score: number | null
  poids: number
}

export function agregerScores(items: readonly ScorePondere[]): number | null {
  const retenus = items.filter((item): item is { score: number; poids: number } => item.score !== null)
  const totalPoids = retenus.reduce((total, item) => total + item.poids, 0)
  if (totalPoids <= 0) return null
  const total = retenus.reduce((somme, item) => somme + item.score * item.poids, 0)
  return Math.round((total / totalPoids) * 100) / 100
}
