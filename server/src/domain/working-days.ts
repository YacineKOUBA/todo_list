/**
 * Moteur de jours ouvrés — RM-05, D5.
 *
 * Reproduit `WORKDAY.INTL` : le jour de départ n'est pas compté, les jours de
 * week-end paramétrés et les jours fériés administrés sont exclus. Aucune
 * librairie externe : la fonction est écrite et testée dans le projet.
 */

import { addCalendarDays, calendarDateToUtcDate, type CalendarDate } from '../lib/calendar-date'

/** 0 = dimanche … 6 = samedi. Défaut : vendredi + samedi (D5). */
export const WEEKEND_DEFAUT: readonly number[] = [5, 6]

export interface WorkingCalendar {
  /** Jours de week-end, au format `getUTCDay()` (0-6), deux valeurs distinctes. */
  weekEnd: readonly number[]
  joursFeries: ReadonlySet<CalendarDate>
}

export function validateWeekend(jours: readonly number[]): void {
  if (jours.length !== 2) {
    throw new RangeError('Le week-end doit comporter exactement deux jours')
  }
  for (const jour of jours) {
    if (!Number.isInteger(jour) || jour < 0 || jour > 6) {
      throw new RangeError(`Jour de week-end invalide : ${String(jour)}`)
    }
  }
  if (jours[0] === jours[1]) {
    throw new RangeError('Les deux jours de week-end doivent être distincts')
  }
}

export function isWeekend(date: CalendarDate, weekEnd: readonly number[]): boolean {
  return weekEnd.includes(calendarDateToUtcDate(date).getUTCDay())
}

export function isWorkingDay(date: CalendarDate, calendrier: WorkingCalendar): boolean {
  if (isWeekend(date, calendrier.weekEnd)) return false
  return !calendrier.joursFeries.has(date)
}

/**
 * Ajoute `jours` jours ouvrés à `date`.
 *
 * `jours = 0` renvoie la date de départ. Les valeurs négatives remontent le
 * calendrier (utile aux écrans), les fréquences métier étant toujours
 * positives (1 à 45).
 */
export function addWorkingDays(
  date: CalendarDate,
  jours: number,
  calendrier: WorkingCalendar,
): CalendarDate {
  validateWeekend(calendrier.weekEnd)
  if (!Number.isInteger(jours)) {
    throw new RangeError(`Nombre de jours ouvrés non entier : ${jours}`)
  }
  if (jours === 0) return date

  const pas = jours > 0 ? 1 : -1
  let restants = Math.abs(jours)
  let curseur = date
  let iterations = 0

  while (restants > 0) {
    curseur = addCalendarDays(curseur, pas)
    if (isWorkingDay(curseur, calendrier)) restants -= 1
    iterations += 1
    if (iterations > 100_000) {
      throw new RangeError('Calendrier ouvré invalide : aucun jour ouvré trouvé')
    }
  }

  return curseur
}

/** Premier jour ouvré strictement après `date`. */
export function nextWorkingDay(date: CalendarDate, calendrier: WorkingCalendar): CalendarDate {
  return addWorkingDays(date, 1, calendrier)
}

/** Dernier jour ouvré strictement avant `date`. */
export function previousWorkingDay(date: CalendarDate, calendrier: WorkingCalendar): CalendarDate {
  return addWorkingDays(date, -1, calendrier)
}
