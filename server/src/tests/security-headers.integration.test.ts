import express from 'express'
import { describe, expect, it } from 'vitest'
import { PERMISSIONS_POLICY, configureExpressSecurity, securityHeaders } from '../security/headers'
import { api } from './helpers/http'

/**
 * En-têtes de sécurité — TC-SEC-034 → 036, TC-SEC-043 (partie en-tête).
 *
 * L'application complète n'existe qu'en phase B : ces tests appliquent le
 * middleware réel à une application Express minimale.
 */
function createApp(production: boolean): express.Express {
  const app = express()
  configureExpressSecurity(app)
  app.use(securityHeaders({ production }))
  app.get('/api/health', (_request, response) => {
    response.status(200).json({ statut: 'ok' })
  })
  return app
}

describe('en-têtes de sécurité — T13-08', () => {
  it('TC-SEC-034 — les en-têtes attendus sont présents', async () => {
    const response = await api(createApp(false)).get('/api/health')

    expect(response.status).toBe(200)
    expect(response.headers['x-content-type-options']).toBe('nosniff')
    expect(response.headers['x-frame-options']).toBe('DENY')
    expect(response.headers['referrer-policy']).toBe('no-referrer')
    expect(response.headers['permissions-policy']).toBe(PERMISSIONS_POLICY)
    expect(response.headers['content-security-policy']).toContain("default-src 'self'")
    expect(response.headers['content-security-policy']).toContain("frame-ancestors 'none'")
    expect(response.headers['cache-control']).toBe('no-store')
  })

  it('TC-SEC-035 — X-Powered-By est absent', async () => {
    const response = await api(createApp(false)).get('/api/health')

    expect(response.headers['x-powered-by']).toBeUndefined()
  })

  it('TC-SEC-036 — HSTS est présent uniquement en production', async () => {
    const developpement = await api(createApp(false)).get('/api/health')
    const production = await api(createApp(true)).get('/api/health')

    expect(developpement.headers['strict-transport-security']).toBeUndefined()
    expect(production.headers['strict-transport-security']).toBe(
      'max-age=31536000; includeSubDomains',
    )
  })

  it('TC-SEC-043 — la CSP de production n’autorise aucun script inline', async () => {
    const developpement = await api(createApp(false)).get('/api/health')
    const production = await api(createApp(true)).get('/api/health')

    expect(developpement.headers['content-security-policy']).toContain("'unsafe-inline'")
    expect(production.headers['content-security-policy']).not.toContain("'unsafe-inline'")
    expect(production.headers['content-security-policy']).toContain('upgrade-insecure-requests')
  })
})
