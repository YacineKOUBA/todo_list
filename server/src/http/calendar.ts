/**
 * Chargement du calendrier métier — paramètres + jours fériés.
 *
 * Les moteurs de domaine restent purs : ce module lit la base et leur fournit
 * un `WorkingCalendar`, l'heure d'échéance et la date du jour dans le fuseau
 * `Africa/Algiers` (D5, D30).
 */

import { calendarDateToUtcDate, todayInTimeZone, zonedDateTimeToInstant } from '../lib/calendar-date'
import type { CalendarDate } from '../lib/calendar-date'
import {
  isWorkingDay,
  WEEKEND_DEFAUT,
  type WorkingCalendar,
} from '../domain/working-days'
import type { AppContext } from './context'

export interface ParametresCourants {
  fuseau: string
  weekendJours: [number, number]
  heureDebutJournee: string
  pauseDebut: string
  pauseFin: string
  heureEcheanceQuotidienne: string
  modifieLe: Date
}

export interface ContexteCalendrier {
  maintenant: Date
  aujourdhui: CalendarDate
  fuseau: string
  heureEcheanceQuotidienne: string
  parametres: ParametresCourants
  calendrier: WorkingCalendar
}

/** `Date` (colonne `time`) → `HH:MM`. */
export function heureDepuisDate(valeur: Date): string {
  return valeur.toISOString().slice(11, 16)
}

export const PARAMETRES_PAR_DEFAUT: ParametresCourants = {
  fuseau: 'Africa/Algiers',
  weekendJours: [5, 6],
  heureDebutJournee: '08:00',
  pauseDebut: '12:00',
  pauseFin: '13:00',
  heureEcheanceQuotidienne: '16:30',
  modifieLe: new Date('1970-01-01T00:00:00.000Z'),
}

export async function chargerCalendrier(ctx: AppContext): Promise<ContexteCalendrier> {
  const [parametre, feries] = await Promise.all([
    ctx.prisma.parametre.findUnique({ where: { id: 1 } }),
    ctx.prisma.jourFerie.findMany({ select: { jour: true } }),
  ])

  if (parametre === null) {
    ctx.logger.warn('Paramètres absents : valeurs par défaut appliquées.')
  }

  const parametres: ParametresCourants =
    parametre === null
      ? PARAMETRES_PAR_DEFAUT
      : {
          fuseau: parametre.fuseau,
          weekendJours: [parametre.weekendJour1, parametre.weekendJour2],
          heureDebutJournee: heureDepuisDate(parametre.heureDebutJournee),
          pauseDebut: heureDepuisDate(parametre.pauseDebut),
          pauseFin: heureDepuisDate(parametre.pauseFin),
          heureEcheanceQuotidienne: heureDepuisDate(parametre.heureEcheanceQuotidienne),
          modifieLe: parametre.modifieLe,
        }

  const maintenant = ctx.clock.now()
  const aujourdhui = todayInTimeZone(maintenant, parametres.fuseau)
  const joursFeries = new Set(feries.map((ferie) => ferie.jour.toISOString().slice(0, 10)))

  return {
    maintenant,
    aujourdhui,
    fuseau: parametres.fuseau,
    heureEcheanceQuotidienne: parametres.heureEcheanceQuotidienne,
    parametres,
    calendrier: {
      weekEnd: parametres.weekendJours.length === 2 ? parametres.weekendJours : WEEKEND_DEFAUT,
      joursFeries,
    },
  }
}

export function estJourOuvre(date: CalendarDate, calendrier: WorkingCalendar): boolean {
  return isWorkingDay(date, calendrier)
}

/** Instant de l'échéance quotidienne d'une date donnée (16h30 par défaut). */
export function echeanceQuotidienne(
  date: CalendarDate,
  contexte: Pick<ContexteCalendrier, 'heureEcheanceQuotidienne' | 'fuseau'>,
): Date {
  return zonedDateTimeToInstant(date, contexte.heureEcheanceQuotidienne, contexte.fuseau)
}

/** Jour de la semaine (0 = dimanche) d'une date calendaire. */
export function jourSemaine(date: CalendarDate): number {
  return calendarDateToUtcDate(date).getUTCDay()
}
