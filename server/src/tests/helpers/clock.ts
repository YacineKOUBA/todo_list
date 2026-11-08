/**
 * Horloge injectable — réexports depuis `src/lib/clock.ts` pour les tests.
 *
 * Règle : aucun moteur de domaine ne lit `new Date()` directement.
 * Le temps est toujours fourni par un `Clock`, ce qui rend déterministes
 * les règles dépendant de l'heure (échéance 16h30, retard, rappels) et du
 * fuseau `Africa/Algiers` (D30).
 */

import { systemClock } from '../../lib/clock'
import type { Clock } from '../../lib/clock'

export { systemClock }
export type { Clock }

function toDate(instant: string | Date): Date {
  const date = instant instanceof Date ? new Date(instant.getTime()) : new Date(instant)
  if (Number.isNaN(date.getTime())) {
    throw new RangeError(`Instant invalide : ${String(instant)}`)
  }
  return date
}

/** Horloge figée sur un instant précis. */
export function fixedClock(instant: string | Date): Clock {
  const date = toDate(instant)
  return {
    now: () => new Date(date.getTime()),
  }
}

/** Horloge de test que l'on peut déplacer explicitement. */
export class TestClock implements Clock {
  #instant: Date

  constructor(instant: string | Date = '2026-01-01T08:00:00Z') {
    this.#instant = toDate(instant)
  }

  now(): Date {
    return new Date(this.#instant.getTime())
  }

  set(instant: string | Date): void {
    this.#instant = toDate(instant)
  }

  advance(milliseconds: number): void {
    this.#instant = new Date(this.#instant.getTime() + milliseconds)
  }
}
