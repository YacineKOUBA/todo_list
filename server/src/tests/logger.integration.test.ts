import express from 'express'
import type { DestinationStream } from 'pino'
import { describe, expect, it } from 'vitest'
import { createLogger, createRequestLogger } from '../security/logger'
import { api } from './helpers/http'

/**
 * Journal technique — TC-SEC-045, T13-09.
 *
 * Le flux est capturé en mémoire pour inspecter les lignes réellement écrites.
 */
function createCapture(): { lignes: string[]; destination: DestinationStream } {
  const lignes: string[] = []
  return {
    lignes,
    destination: {
      write(message: string) {
        lignes.push(message)
      },
    },
  }
}

async function vider(): Promise<void> {
  await new Promise((resolve) => setImmediate(resolve))
}

describe('journal technique — T13-09', () => {
  it('TC-SEC-045 — aucun secret n’est écrit, même imbriqué', async () => {
    const { lignes, destination } = createCapture()
    const logger = createLogger({ level: 'info', destination })

    logger.info(
      {
        motDePasse: 'secret-plat',
        cookie: 'cookie-sensible',
        authorization: 'Bearer jeton-sensible',
        utilisateur: {
          motDePasseHash: 'hash-sensible',
          jeton: 'jeton-imbrique',
        },
      },
      'événement de test',
    )
    await vider()

    const journal = lignes.join('')
    expect(journal).toContain('[MASQUE]')
    for (const secret of [
      'secret-plat',
      'cookie-sensible',
      'jeton-sensible',
      'hash-sensible',
      'jeton-imbrique',
    ]) {
      expect(journal).not.toContain(secret)
    }
  })

  it('TC-LOG-001 — chaque requête reçoit un X-Request-Id et une ligne corrélée', async () => {
    const { lignes, destination } = createCapture()
    const logger = createLogger({ level: 'info', destination })
    const app = express()
    app.use(createRequestLogger(logger))
    app.get('/api/health', (_request, response) => {
      response.status(200).json({ statut: 'ok' })
    })

    const response = await api(app).get('/api/health')
    await vider()

    const identifiant = response.headers['x-request-id']
    expect(identifiant).toMatch(/^[0-9a-f-]{36}$/)

    const journal = lignes.join('')
    expect(journal).toContain(identifiant)
    expect(journal).toContain('/api/health')
    expect(journal).toContain('"statusCode":200')
  })

  it('TC-LOG-002 — cookie et en-tête d’autorisation ne sont jamais journalisés', async () => {
    const { lignes, destination } = createCapture()
    const logger = createLogger({ level: 'info', destination })
    const app = express()
    app.use(createRequestLogger(logger))
    app.get('/api/health', (_request, response) => {
      response.status(200).json({ statut: 'ok' })
    })

    await api(app)
      .get('/api/health')
      .set('Cookie', 'gd_session=cookie-tres-secret')
      .set('Authorization', 'Bearer jeton-tres-secret')
    await vider()

    const journal = lignes.join('')
    expect(journal).not.toContain('cookie-tres-secret')
    expect(journal).not.toContain('jeton-tres-secret')
  })

  it('TC-LOG-003 — une erreur client est journalisée en avertissement', async () => {
    const { lignes, destination } = createCapture()
    const logger = createLogger({ level: 'info', destination })
    const app = express()
    app.use(createRequestLogger(logger))
    app.get('/api/inconnue', (_request, response) => {
      response.status(404).json({ code: 'RESSOURCE_INTROUVABLE' })
    })

    await api(app).get('/api/inconnue')
    await vider()

    const lignesJson = lignes
      .join('')
      .split('\n')
      .filter((ligne) => ligne.trim().length > 0)
      .map((ligne) => JSON.parse(ligne) as { level: number; res?: { statusCode: number } })

    const ligneRequete = lignesJson.find((entree) => entree.res?.statusCode === 404)
    expect(ligneRequete?.level).toBe(40)
  })
})
