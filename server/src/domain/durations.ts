/**
 * Moteur des durées — RM-06, P1.
 *
 * Les calculs Excel sont reproduits ; les sigles `G` et `E` ne sont pas
 * explicités par une décision (P1 reste ouvert) et ne doivent pas être figés
 * dans les libellés d'écran.
 */

import { calendarDaysBetween, compareCalendarDates, type CalendarDate } from '../lib/calendar-date'

/** `null` = donnée absente (« — ») ; `'ERREUR'` = incohérence de dates. */
export type DurationCell = number | null | 'ERREUR'

export interface DurationInput {
  dateDebut: CalendarDate | null
  dateFin: CalendarDate | null
  dateFinPrevue: CalendarDate | null
  aujourdhui: CalendarDate
}

export interface DurationResult {
  dureeG: DurationCell
  dureeE: DurationCell
  /** Vrai si `min(dateFin, dateFinPrevue) < dateDebut` (RM-06). */
  incoherente: boolean
}

export function computeDurations(input: DurationInput): DurationResult {
  if (input.dateDebut === null) {
    return { dureeG: null, dureeE: null, incoherente: false }
  }

  const incoherente =
    (input.dateFin !== null && compareCalendarDates(input.dateFin, input.dateDebut) < 0) ||
    (input.dateFinPrevue !== null && compareCalendarDates(input.dateFinPrevue, input.dateDebut) < 0)

  if (incoherente) {
    return { dureeG: 'ERREUR', dureeE: 'ERREUR', incoherente: true }
  }

  return {
    // DUREE G. = (dateFin ?? aujourd'hui) − dateDebut
    dureeG: calendarDaysBetween(input.dateDebut, input.dateFin ?? input.aujourdhui),
    // DUREE E. = dateFin − dateFinPrevue
    dureeE:
      input.dateFin !== null && input.dateFinPrevue !== null
        ? calendarDaysBetween(input.dateFinPrevue, input.dateFin)
        : null,
    incoherente: false,
  }
}
