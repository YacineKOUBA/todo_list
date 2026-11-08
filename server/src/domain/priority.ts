/**
 * Moteur de priorité — RM-03, D14, D31.
 *
 * La matrice est une donnée administrée (13 combinaisons figées, seed). Le
 * moteur ne la duplique pas : il reçoit les entrées lues en base. Les trois
 * combinaisons absentes ne peuvent pas exister en base (clé étrangère
 * composite, migration 0001) et sont donc refusées à la saisie.
 */

export interface PriorityEntry {
  urgenceId: string
  importanceId: string
  urgenceLibelle: string
  importanceLibelle: string
  score: number
  frequenceJours: number
}

export interface PriorityResult {
  libelle: string
  score: number
  frequenceJours: number
}

/** Libellé exact : `Urgence & " & " & Importance` (RM-03). */
export function priorityLabel(urgenceLibelle: string, importanceLibelle: string): string {
  return `${urgenceLibelle} & ${importanceLibelle}`
}

export function computePriority(entry: PriorityEntry): PriorityResult {
  return {
    libelle: priorityLabel(entry.urgenceLibelle, entry.importanceLibelle),
    score: entry.score,
    frequenceJours: entry.frequenceJours,
  }
}

/** Retourne `null` si le couple n'existe pas dans la matrice (D31). */
export function findPriority(
  entries: readonly PriorityEntry[],
  urgenceId: string,
  importanceId: string,
): PriorityEntry | null {
  return (
    entries.find((entry) => entry.urgenceId === urgenceId && entry.importanceId === importanceId) ??
    null
  )
}

/** Résout une priorité ou signale la combinaison absente. */
export function resolvePriority(
  entries: readonly PriorityEntry[],
  urgenceId: string,
  importanceId: string,
): PriorityResult | null {
  const entry = findPriority(entries, urgenceId, importanceId)
  return entry === null ? null : computePriority(entry)
}
