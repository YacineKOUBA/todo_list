/**
 * Moteur de progression — RM-02, D4.
 *
 * La progression manuelle gagne toujours. À défaut, la progression est
 * temporelle et plafonnée à 100 : le retard est porté par le statut.
 */

import { calendarDaysBetween, compareCalendarDates, type CalendarDate } from '../lib/calendar-date'

export interface TaskProgressInput {
  progressionManuelle: number | null
  dateAction: CalendarDate | null
  dateDebut: CalendarDate | null
  dateFinPrevue: CalendarDate | null
  dateFin: CalendarDate | null
  aujourdhui: CalendarDate
}

/** `null` s'affiche « — », jamais 0 (RM-02). */
export function computeTaskProgress(input: TaskProgressInput): number | null {
  // 1. Valeur manuelle bornée 0-100, prioritaire même sur une clôture.
  if (input.progressionManuelle !== null) {
    return Math.min(100, Math.max(0, input.progressionManuelle))
  }

  // 2. Tâche clôturée.
  if (input.dateFin !== null) return 100

  // 3. Données insuffisantes ou intervalle invalide.
  if (input.dateDebut === null || input.dateFinPrevue === null) return null
  if (compareCalendarDates(input.dateFinPrevue, input.dateDebut) <= 0) return null

  // 4. Référence : date d'action, sinon aujourd'hui.
  const reference = input.dateAction ?? input.aujourdhui

  // 5. Avant le début.
  if (compareCalendarDates(reference, input.dateDebut) < 0) return 0

  // 6. Après l'échéance : plafond à 100.
  if (compareCalendarDates(reference, input.dateFinPrevue) > 0) return 100

  // 7. Interpolation linéaire arrondie.
  const total = calendarDaysBetween(input.dateDebut, input.dateFinPrevue)
  const ecoule = calendarDaysBetween(input.dateDebut, reference)
  return Math.round((ecoule / total) * 100)
}
