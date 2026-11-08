/**
 * Journal d'audit — IHM-13 (docs/07 §8.18).
 *
 * Lecture seule, réservée à l'administrateur. Le journal est append-only :
 * aucune route d'écriture n'est exposée.
 */

import { Router } from 'express'
import type { Prisma } from '@prisma/client'
import { z } from 'zod'
import { ApiError } from '../security/problem'
import { identifiantAudit } from './audit'
import type { AppContext } from './context'
import { authOf, requireAuth } from './session'
import {
  parseQuery,
  schemaDate,
  schemaPagination,
  schemaUuid,
} from './validation'

const schemaListe = z.strictObject({
  acteurId: schemaUuid.optional(),
  typeOperation: z.string().max(50).optional(),
  entite: z.string().max(50).optional(),
  entiteId: z.string().max(64).optional(),
  du: schemaDate.optional(),
  au: schemaDate.optional(),
  ...schemaPagination,
})

function pagination(page: number, taille: number, total: number) {
  return { page, taille, total, nombrePages: total === 0 ? 0 : Math.ceil(total / taille) }
}

export function createAuditEventsRouter(ctx: AppContext): Router {
  const routeur = Router()
  routeur.use(requireAuth)

  routeur.get('/', async (req, res) => {
    const auth = authOf(req)
    if (auth.utilisateur.role !== 'ADMIN') {
      throw new ApiError(403, 'ACTION_NON_AUTORISEE', 'Le journal d’audit est réservé à l’administrateur.')
    }
    const parametres = parseQuery(schemaListe, req)

    const where: Prisma.JournalAuditWhereInput = {}
    if (parametres.acteurId !== undefined) where.acteurId = parametres.acteurId
    if (parametres.typeOperation !== undefined) where.typeOperation = parametres.typeOperation
    if (parametres.entite !== undefined) where.entite = parametres.entite
    if (parametres.entiteId !== undefined) where.entiteId = parametres.entiteId
    if (parametres.du !== undefined) {
      where.horodatage = { gte: new Date(`${parametres.du}T00:00:00.000Z`) }
    }
    if (parametres.au !== undefined) {
      where.horodatage = {
        ...(where.horodatage as Prisma.DateTimeFilter | undefined),
        lte: new Date(`${parametres.au}T23:59:59.999Z`),
      }
    }

    const total = await ctx.prisma.journalAudit.count({ where })
    const evenements = await ctx.prisma.journalAudit.findMany({
      where,
      include: { acteur: { include: { employe: true } } },
      orderBy: { horodatage: 'desc' },
      skip: (parametres.page - 1) * parametres.taille,
      take: parametres.taille,
    })

    res.status(200).json({
      elements: evenements.map((evenement) => ({
        id: identifiantAudit(evenement.id),
        horodatage: evenement.horodatage.toISOString(),
        typeOperation: evenement.typeOperation,
        acteur:
          evenement.acteur === null
            ? null
            : {
                id: evenement.acteur.id,
                nomComplet:
                  evenement.acteur.employe === null
                    ? evenement.acteur.identifiant
                    : `${evenement.acteur.employe.prenom} ${evenement.acteur.employe.nom}`,
              },
        entite: evenement.entite,
        entiteId: evenement.entiteId,
        donneesAvant: evenement.donneesAvant,
        donneesApres: evenement.donneesApres,
        contexte: evenement.contexte,
      })),
      pagination: pagination(parametres.page, parametres.taille, total),
    })
  })

  routeur.all('/', (_req, _res) => {
    throw new ApiError(405, 'METHODE_NON_AUTORISEE', 'Le journal est en lecture seule.')
  })

  return routeur
}
