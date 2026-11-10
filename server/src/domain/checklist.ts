/**
 * Checklist de tâche — workflow BROUILLON → SOUMISE → VALIDEE.
 *
 * Règles pures : structure modifiable par l'exécutant (brouillon) ou
 * l'administrateur (soumise), coche réservée à l'exécutant et à l'admin
 * une fois la checklist validée.
 */

import type { RoleUtilisateur } from '@prisma/client'

export type StatutChecklistCode = 'BROUILLON' | 'SOUMISE' | 'VALIDEE'

export interface ContexteChecklist {
  role: RoleUtilisateur
  estExecutant: boolean
  estAdmin: boolean
  statut: StatutChecklistCode
}

/** Pourcentage arrondi de sous-tâches cochées. */
export function progressionChecklist(cochees: number, total: number): number {
  if (total <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((cochees / total) * 100)))
}

/** Une checklist non validée bloque le démarrage, la progression et la clôture. */
export function checklistBloquante(statut: StatutChecklistCode, total: number): boolean {
  return statut !== 'VALIDEE' && total > 0
}

/** Ajout, renommage, suppression et réordonnancement des sous-tâches. */
export function peutStructurerChecklist(contexte: ContexteChecklist): boolean {
  if (contexte.role === 'CONSULTANT') return false
  if (contexte.statut === 'VALIDEE') return false
  if (contexte.statut === 'BROUILLON') return contexte.estExecutant
  return contexte.estAdmin
}

/** Coche / décoche d'une sous-tâche : seulement après validation. */
export function peutCocherChecklist(contexte: ContexteChecklist): boolean {
  if (contexte.role === 'CONSULTANT') return false
  if (contexte.statut !== 'VALIDEE') return false
  return contexte.estExecutant || contexte.estAdmin
}

export function peutSoumettreChecklist(contexte: ContexteChecklist): boolean {
  return contexte.statut === 'BROUILLON' && contexte.estExecutant
}

/** Seul l'admin valide ; la validation automatique est traitée à la soumission. */
export function peutValiderChecklist(contexte: ContexteChecklist): boolean {
  return contexte.statut === 'SOUMISE' && contexte.estAdmin
}

/** La date de début ne suit la validation que lors de la première validation. */
export function appliquerDateDebutValidation(dateValidationExistante: Date | null): boolean {
  return dateValidationExistante === null
}
