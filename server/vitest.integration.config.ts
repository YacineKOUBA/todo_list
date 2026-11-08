import { resolve } from 'node:path'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

/**
 * Tests d'intégration : API Express + accès PostgreSQL.
 *
 * La base est fournie par `TEST_DATABASE_URL`. Si la variable est absente,
 * les suites qui l'exigent sont ignorées (voir `hasTestDatabase()`), sans
 * faire échouer la construction.
 *
 * `.env.test` (non versionné) est lu à la racine du projet, que la commande
 * soit lancée depuis la racine ou depuis le workspace serveur. Utiliser
 * `.env.test.example` comme modèle.
 */
const racineProjet = resolve(import.meta.dirname, '..')
const fileEnv = loadEnv('test', racineProjet, '')
const testEnv = Object.fromEntries(
  Object.entries(fileEnv).filter(
    ([key]) => key.startsWith('TEST_') || key.startsWith('E2E_') || key === 'NODE_ENV',
  ),
)

export default defineConfig({
  test: {
    name: 'integration',
    root: import.meta.dirname,
    environment: 'node',
    include: ['src/**/*.integration.test.ts'],
    exclude: ['**/node_modules/**'],
    env: testEnv,
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 20_000,
  },
})
