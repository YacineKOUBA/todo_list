/**
 * Moteur de date de rappel — RM-04, EF-50, EF-51.
 *
 * Le test `dateDebut + fréquence > aujourd'hui` est calendaire (comme Excel) ;
 * seule la date résultat est calculée en jours ouvrés.
 */

import {
  addCalendarDays,
  compareCalendarDates,
  calendarDaysBetween,
  type CalendarDate,
} from '../lib/calendar-date'
import { addWorkingDays, type WorkingCalendar } from './working-days'

export interface ReminderInput {
  dateAction: CalendarDate | null
  dateDebut: CalendarDate | null
  dateFin: CalendarDate | null
  /** Fréquence issue de la matrice, 1 à 45 jours. */
  frequenceJours: number
  aujourdhui: CalendarDate
  calendrier: WorkingCalendar
}

export function computeReminderDate(input: ReminderInput): CalendarDate | null {
  if (input.dateAction === null || input.dateFin !== null) return null
  if (input.dateDebut === null) return null
  if (!Number.isInteger(input.frequenceJours) || input.frequenceJours < 1) {
    throw new RangeError(`Fréquence de rappel invalide : ${input.frequenceJours}`)
  }

  const debutPlusFrequence = addCalendarDays(input.dateDebut, input.frequenceJours)
  const base =
    compareCalendarDates(debutPlusFrequence, input.aujourdhui) > 0
      ? input.dateDebut
      : input.dateAction

  return addWorkingDays(base, input.frequenceJours, input.calendrier)
}

export interface ReminderSignals {
  /** `DATE RAPPEL <= AUJOURDHUI` (EF-50). */
  echue: boolean
  /** `AUJOURDHUI+1 <= DATE RAPPEL <= AUJOURDHUI+5` (EF-50). */
  imminent: boolean
}

export function computeReminderSignals(
  dateRappel: CalendarDate | null,
  aujourdhui: CalendarDate,
): ReminderSignals {
  if (dateRappel === null) return { echue: false, imminent: false }
  const ecart = calendarDaysBetween(aujourdhui, dateRappel)
  return {
    echue: compareCalendarDates(dateRappel, aujourdhui) <= 0,
    imminent: ecart >= 1 && ecart <= 5,
  }
}
