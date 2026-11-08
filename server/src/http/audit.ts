/**
 * Journal d'audit — hooks transverses (`docs/07` §10, D42).
 *
 * Le journal est append-only : aucune fonction de mise à jour ou de suppression
 * n'est exposée. L'écriture métier et son événement partagent la transaction
 * de la route appelante.
 */

import type { Prisma, PrismaClient } from '@prisma/client'

export type ClientTransactionnel = Prisma.TransactionClient | PrismaClient

export interface EvenementAudit {
  acteurId: string | null
  typeOperation: string
  entite: string
  entiteId: string | null
  donneesAvant?: Prisma.InputJsonValue
  donneesApres?: Prisma.InputJsonValue
  contexte?: Prisma.InputJsonValue
}

export async function ecrireAudit(
  client: ClientTransactionnel,
  evenement: EvenementAudit,
): Promise<void> {
  await client.journalAudit.create({
    data: {
      acteurId: evenement.acteurId,
      typeOperation: evenement.typeOperation,
      entite: evenement.entite,
      entiteId: evenement.entiteId,
      ...(evenement.donneesAvant === undefined ? {} : { donneesAvant: evenement.donneesAvant }),
      ...(evenement.donneesApres === undefined ? {} : { donneesApres: evenement.donneesApres }),
      ...(evenement.contexte === undefined ? {} : { contexte: evenement.contexte }),
    },
  })
}

/** `BigInt` n'est pas sérialisable en JSON : l'API expose un nombre. */
export function identifiantAudit(id: bigint): number {
  return Number(id)
}
