import { defineConfig } from 'vitest/config'

/**
 * Racine des projets de test.
 *
 * - `unit`        : moteurs de domaine, fonctions pures, horloge (serveur)
 * - `integration` : API + base PostgreSQL de test (serveur)
 * - `client`      : composants React (jsdom)
 *
 * Les tests de bout en bout (Playwright) sont lancés séparément : `npm run test:e2e`.
 */
export default defineConfig({
  test: {
    projects: [
      'server/vitest.unit.config.ts',
      'server/vitest.integration.config.ts',
      'client/vitest.config.ts',
    ],
  },
})
