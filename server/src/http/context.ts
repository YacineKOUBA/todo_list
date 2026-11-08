/**
 * Contexte applicatif — dépendances injectées dans l'application Express.
 *
 * Aucun module HTTP ne lit `process.env`, `new Date()` ni n'instancie Prisma :
 * tout passe par ce contexte, ce qui rend l'application testable avec une base
 * dédiée, une horloge figée et un journal silencieux.
 */

import type { PrismaClient } from '@prisma/client'
import type { Logger } from 'pino'
import type { Env } from '../config/env'
import type { Clock } from '../lib/clock'

export interface AppContext {
  prisma: PrismaClient
  env: Env
  clock: Clock
  logger: Logger
}
