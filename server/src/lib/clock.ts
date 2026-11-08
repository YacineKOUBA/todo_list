/**
 * Horloge injectable — utilisée par le socle et les moteurs.
 *
 * Aucune règle dépendant du temps ne lit `new Date()` directement : le temps
 * est fourni par un `Clock` (T12-05).
 */
export interface Clock {
  now(): Date
}

/** Horloge système — utilisée en production. */
export const systemClock: Clock = {
  now: () => new Date(),
}
