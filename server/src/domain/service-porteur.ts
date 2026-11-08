/**
 * Service porteur d'une tâche — P7 → D29, RM-10.
 *
 * Le service porteur est le département de l'exécutant ; à défaut, celui du
 * pilote. Règle pure, recalculée à chaque lecture, jamais stockée (AR-05).
 */

export interface ServicePorteurInput {
  departementAssigneId: string | null
  departementPiloteId: string | null
}

export function resolveServicePorteur(input: ServicePorteurInput): string | null {
  return input.departementAssigneId ?? input.departementPiloteId
}
