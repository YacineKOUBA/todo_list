/**
 * Moteur de statut — RM-01, D3, D18, D28, D30.
 *
 * Fonction pure : elle reçoit toutes ses données, y compris l'instant courant.
 * Aucun statut n'est stocké (AR-05) : il est recalculé à chaque lecture.
 */

import {
  compareCalendarDates,
  todayInTimeZone,
  zonedDateTimeToInstant,
  type CalendarDate,
} from '../lib/calendar-date'

/** Codes exposés par l'API (`docs/07` §8.3). */
export type StatutCode = 'A_FAIRE' | 'EN_COURS' | 'RETARD' | 'ACHEVEE' | 'ANNULEE' | 'SUSPENDUE'

export type StatutManuelCode = 'ANNULEE' | 'SUSPENDUE'

/** Libellés d'affichage — `A faire` reste sans accent (CDC). */
export const LIBELLES_STATUT: Readonly<Record<StatutCode, string>> = {
  A_FAIRE: 'A faire',
  EN_COURS: 'En cours',
  RETARD: 'Retard',
  ACHEVEE: 'Achevée',
  ANNULEE: 'Annulée',
  SUSPENDUE: 'Suspendue',
}

export interface TaskStatusInput {
  statutManuel: StatutManuelCode | null
  nature: 'QUOTIDIENNE' | 'AUTRE'
  dateAction: CalendarDate | null
  dateFinPrevue: CalendarDate | null
  dateFin: CalendarDate | null
  /** Instant courant, fourni par l'horloge injectée. */
  maintenant: Date
  /** Fuseau de l'application (D30). */
  fuseau: string
  /** Heure d'échéance des tâches quotidiennes, `HH:MM` (défaut 16:30). */
  heureEcheanceQuotidienne: string
}

export interface TaskStatusResult {
  code: StatutCode
  libelle: string
  /** Vrai lorsque le statut vient d'une décision manuelle (D3). */
  manuel: boolean
  estEnRetard: boolean
}

function resultat(code: StatutCode, manuel = false): TaskStatusResult {
  return {
    code,
    libelle: LIBELLES_STATUT[code],
    manuel,
    estEnRetard: code === 'RETARD',
  }
}

export function computeTaskStatus(input: TaskStatusInput): TaskStatusResult {
  // 1. Statut manuel prioritaire sur toutes les dates (D3).
  if (input.statutManuel === 'ANNULEE') return resultat('ANNULEE', true)
  if (input.statutManuel === 'SUSPENDUE') return resultat('SUSPENDUE', true)

  // 2. Toute date de fin renseignée vaut achèvement, même en avance.
  if (input.dateFin !== null) return resultat('ACHEVEE')

  const aujourdhui = todayInTimeZone(input.maintenant, input.fuseau)

  // 3. Sans date d'action, ou action future : A faire.
  if (input.dateAction === null || compareCalendarDates(input.dateAction, aujourdhui) > 0) {
    return resultat('A_FAIRE')
  }

  // 4. Échéance dépassée.
  if (input.nature === 'QUOTIDIENNE') {
    const echeance = zonedDateTimeToInstant(
      input.dateAction,
      input.heureEcheanceQuotidienne,
      input.fuseau,
    )
    if (input.maintenant.getTime() >= echeance.getTime()) return resultat('RETARD')
  } else if (
    input.dateFinPrevue !== null &&
    compareCalendarDates(input.dateFinPrevue, aujourdhui) < 0
  ) {
    // Tâche « autre » : le retard commence le lendemain de l'échéance.
    return resultat('RETARD')
  }

  return resultat('EN_COURS')
}
