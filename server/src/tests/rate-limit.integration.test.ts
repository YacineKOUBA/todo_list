import express from 'express'
import { describe, expect, it } from 'vitest'
import {
  POLITIQUES_LIMITATION,
  createLoginRateLimiter,
  createRateLimiter,
  createWriteRateLimiter,
} from '../security/rate-limit'
import { api } from './helpers/http'

/**
 * Limitation par IP — TC-SEC-009, D78.
 *
 * Une politique courte (2 requêtes) est utilisée pour ne pas rendre la suite
 * lente ; les valeurs de production sont vérifiées séparément.
 */
function createApp(limit: number): express.Express {
  const app = express()
  app.use('/api', createRateLimiter({ windowMs: 60_000, limit }))
  app.get('/api/health', (_request, response) => {
    response.status(200).json({ statut: 'ok' })
  })
  return app
}

describe('limitation par adresse IP — T13-06', () => {
  it('TC-SEC-009 — au-delà de la limite, la réponse est 429 problem+json', async () => {
    const app = createApp(2)

    expect((await api(app).get('/api/health')).status).toBe(200)
    expect((await api(app).get('/api/health')).status).toBe(200)

    const refusee = await api(app).get('/api/health')

    expect(refusee.status).toBe(429)
    expect(refusee.headers['content-type']).toContain('application/problem+json')
    expect(refusee.body).toMatchObject({
      status: 429,
      code: 'TROP_DE_TENTATIVES',
      title: 'Trop de tentatives',
    })
    expect(Number(refusee.headers['retry-after'])).toBeGreaterThanOrEqual(1)
  })

  it('TC-RTL-001 — les politiques par défaut sont celles de D78', () => {
    expect(POLITIQUES_LIMITATION).toEqual({
      connexion: { windowMs: 15 * 60 * 1000, limit: 10 },
      globale: { windowMs: 60 * 1000, limit: 100 },
      ecritures: { windowMs: 60 * 1000, limit: 30 },
    })
  })

  it('TC-RTL-002 — les trois fabriques produisent des middlewares', () => {
    expect(typeof createLoginRateLimiter()).toBe('function')
    expect(typeof createRateLimiter(POLITIQUES_LIMITATION.globale)).toBe('function')
    expect(typeof createWriteRateLimiter()).toBe('function')
  })

  it('TC-RTL-003 — deux applications distinctes ne partagent pas leur compteur', async () => {
    const premiere = createApp(1)
    const seconde = createApp(1)

    expect((await api(premiere).get('/api/health')).status).toBe(200)
    expect((await api(premiere).get('/api/health')).status).toBe(429)
    expect((await api(seconde).get('/api/health')).status).toBe(200)
  })
})
