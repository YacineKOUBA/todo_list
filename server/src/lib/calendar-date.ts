/**
 * Dates calendaires métier (RM-15, D30).
 *
 * Une date métier est une **date calendaire** (`AAAA-MM-JJ`), sans heure et
 * sans fuseau. Les horodatages techniques restent des `Date` (instants UTC).
 * Cette séparation évite les décalages d'un jour lors des changements d'heure
 * et rend les moteurs de domaine testables.
 *
 * Le fuseau de l'application est `Africa/Algiers` (D30). Il sert uniquement à
 * transformer un **instant** en date calendaire ou à construire l'instant
 * d'une échéance (16h30).
 */

/** Date calendaire au format `AAAA-MM-JJ`. */
export type CalendarDate = string

const MOTIF_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

function parties(date: CalendarDate): { annee: number; mois: number; jour: number } {
  const correspondance = MOTIF_DATE.exec(date)
  if (correspondance === null) {
    throw new RangeError(`Date calendaire invalide (attendu AAAA-MM-JJ) : ${date}`)
  }
  return {
    annee: Number(correspondance[1]),
    mois: Number(correspondance[2]),
    jour: Number(correspondance[3]),
  }
}

/** Vérifie qu'une chaîne est une date calendaire réelle (`2026-02-30` refusé). */
export function isCalendarDate(value: unknown): value is CalendarDate {
  if (typeof value !== 'string') return false
  const correspondance = MOTIF_DATE.exec(value)
  if (correspondance === null) return false
  const { annee, mois, jour } = parties(value)
  const date = new Date(Date.UTC(annee, mois - 1, jour))
  return (
    date.getUTCFullYear() === annee && date.getUTCMonth() === mois - 1 && date.getUTCDate() === jour
  )
}

export function parseCalendarDate(value: string): CalendarDate {
  if (!isCalendarDate(value)) {
    throw new RangeError(`Date calendaire invalide (attendu AAAA-MM-JJ) : ${value}`)
  }
  return value
}

function versMs(date: CalendarDate): number {
  const { annee, mois, jour } = parties(date)
  return Date.UTC(annee, mois - 1, jour)
}

function depuisMs(ms: number): CalendarDate {
  return new Date(ms).toISOString().slice(0, 10)
}

/** Convertit une date calendaire en `Date` à minuit UTC (usage technique). */
export function calendarDateToUtcDate(date: CalendarDate): Date {
  return new Date(versMs(date))
}

/** Extrait la date calendaire d'une `Date` exprimée en UTC (colonnes `date`). */
export function utcDateToCalendarDate(date: Date): CalendarDate {
  if (Number.isNaN(date.getTime())) {
    throw new RangeError('Date invalide')
  }
  return date.toISOString().slice(0, 10)
}

/** Ajoute (ou retire) des jours calendaires. */
export function addCalendarDays(date: CalendarDate, jours: number): CalendarDate {
  if (!Number.isInteger(jours)) {
    throw new RangeError(`Nombre de jours non entier : ${jours}`)
  }
  return depuisMs(versMs(date) + jours * 86_400_000)
}

/** Nombre de jours calendaires de `depuis` vers `vers` (positif si `vers` est après). */
export function calendarDaysBetween(depuis: CalendarDate, vers: CalendarDate): number {
  return Math.round((versMs(vers) - versMs(depuis)) / 86_400_000)
}

/** Compare deux dates calendaires : -1, 0 ou 1. */
export function compareCalendarDates(a: CalendarDate, b: CalendarDate): -1 | 0 | 1 {
  const msA = versMs(a)
  const msB = versMs(b)
  if (msA < msB) return -1
  if (msA > msB) return 1
  return 0
}

/** Date la plus petite / la plus grande d'une liste non vide. */
export function minCalendarDate(dates: readonly CalendarDate[]): CalendarDate {
  if (dates.length === 0) throw new RangeError('Liste de dates vide')
  return dates.reduce((min, date) => (compareCalendarDates(date, min) < 0 ? date : min))
}

export function maxCalendarDate(dates: readonly CalendarDate[]): CalendarDate {
  if (dates.length === 0) throw new RangeError('Liste de dates vide')
  return dates.reduce((max, date) => (compareCalendarDates(date, max) > 0 ? date : max))
}

/**
 * Décalage (en millisecondes) entre l'heure locale d'un fuseau et UTC à un
 * instant donné. Calculé par `Intl`, sans dépendance externe.
 */
function decalageFuseau(instant: Date, fuseau: string): number {
  const formateur = new Intl.DateTimeFormat('en-US', {
    timeZone: fuseau,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const partiesLocales = new Map(
    formateur.formatToParts(instant).map((partie) => [partie.type, partie.value]),
  )
  const heure = Number(partiesLocales.get('hour'))
  const localeEnUtc = Date.UTC(
    Number(partiesLocales.get('year')),
    Number(partiesLocales.get('month')) - 1,
    Number(partiesLocales.get('day')),
    heure === 24 ? 0 : heure,
    Number(partiesLocales.get('minute')),
    Number(partiesLocales.get('second')),
  )
  return localeEnUtc - instant.getTime()
}

/** Date calendaire d'un instant dans un fuseau donné (D30). */
export function calendarDateInTimeZone(instant: Date, fuseau: string): CalendarDate {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: fuseau,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant)
}

/**
 * Instant correspondant à une date et une heure locales dans un fuseau.
 *
 * L'algorithme tient compte du décalage réel du fuseau à cette date (deux
 * passes), même si `Africa/Algiers` n'applique pas d'heure d'été.
 */
export function zonedDateTimeToInstant(date: CalendarDate, heure: string, fuseau: string): Date {
  const correspondance = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(heure)
  if (correspondance === null) {
    throw new RangeError(`Heure invalide (attendu HH:MM) : ${heure}`)
  }
  const heures = Number(correspondance[1])
  const minutes = Number(correspondance[2])
  const secondes = correspondance[3] === undefined ? 0 : Number(correspondance[3])
  if (heures > 23 || minutes > 59 || secondes > 59) {
    throw new RangeError(`Heure invalide (attendu HH:MM) : ${heure}`)
  }
  const naif = versMs(date) + (heures * 3600 + minutes * 60 + secondes) * 1000
  let instant = naif - decalageFuseau(new Date(naif), fuseau)
  instant = naif - decalageFuseau(new Date(instant), fuseau)
  return new Date(instant)
}

/** Date calendaire « aujourd'hui » pour une horloge et un fuseau. */
export function todayInTimeZone(instant: Date, fuseau: string): CalendarDate {
  return calendarDateInTimeZone(instant, fuseau)
}
