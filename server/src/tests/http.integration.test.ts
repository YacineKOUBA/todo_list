import express from 'express'
import { describe, expect, it } from 'vitest'
import { api } from './helpers/http'

/**
 * Vérifie le harnais HTTP (Supertest) sans aucun code applicatif :
 * l'application est construite dans le test.
 */
function createHarnessApp(): express.Express {
  const app = express()
  app.use(express.json())
  app.get('/api/health', (_request, response) => {
    response.status(200).json({ statut: 'ok' })
  })
  return app
}

describe('harnais HTTP (Supertest)', () => {
  it('interroge une route et lit la réponse JSON', async () => {
    const response = await api(createHarnessApp()).get('/api/health')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ statut: 'ok' })
  })

  it('retourne 404 sur une route inconnue', async () => {
    const response = await api(createHarnessApp()).get('/api/inconnue')

    expect(response.status).toBe(404)
  })
})
