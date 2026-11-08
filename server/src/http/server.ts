/**
 * Point d'entrée HTTP — démarrage, arrêt propre, fichiers statiques.
 *
 * En développement, Vite sert l'interface et relaie `/api` vers ce serveur.
 * En production, le même processus sert `client/dist` (SPA).
 */

import { existsSync } from 'node:fs'
import { createServer } from 'node:http'
import { resolve } from 'node:path'
import express, { type Request, type Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { loadEnv } from '../config/env'
import { systemClock } from '../lib/clock'
import { createApp } from './app'
import { createLogger } from '../security/logger'

const env = loadEnv()
const logger = createLogger({ level: env.LOG_LEVEL })
const prisma = new PrismaClient()

const app = createApp({ prisma, env, clock: systemClock, logger })

if (env.NODE_ENV === 'production') {
  const dist = resolve(import.meta.dirname, '../../client/dist')
  if (existsSync(dist)) {
    app.use(express.static(dist, { index: false, maxAge: '1h' }))
    app.get(/.*/u, (_req: Request, res: Response) => {
      res.sendFile(resolve(dist, 'index.html'))
    })
  } else {
    logger.warn({ dist }, 'Build client absent : seule l’API est servie.')
  }
}

const serveur = createServer(app)

serveur.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, 'Serveur GD Trading démarré')
})

async function arreter(signal: string): Promise<void> {
  logger.info({ signal }, 'Arrêt demandé')
  serveur.close(() => {
    void prisma.$disconnect().finally(() => {
      process.exit(0)
    })
  })
  setTimeout(() => process.exit(1), 10_000).unref()
}

process.on('SIGINT', () => void arreter('SIGINT'))
process.on('SIGTERM', () => void arreter('SIGTERM'))
