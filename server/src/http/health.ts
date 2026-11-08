/**
 * Sonde de santé — `GET /api/v1/health` (docs/07 §8.1, EF-78).
 *
 * Aucune donnée métier ni nom d'infrastructure n'est exposé.
 */

import { Router } from 'express'
import type { AppContext } from './context'

export const VERSION_API = '1.0.0'

export function createHealthRouter(ctx: AppContext): Router {
  const routeur = Router()

  routeur.get('/', async (_req, res) => {
    try {
      await ctx.prisma.$queryRaw`SELECT 1`
      res.status(200).json({ statut: 'ok', base: 'ok', version: VERSION_API })
    } catch (erreur) {
      ctx.logger.error({ erreur }, 'Base de données indisponible')
      res.status(503).json({ statut: 'degrade', base: 'indisponible' })
    }
  })

  return routeur
}
