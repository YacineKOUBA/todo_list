import { defineConfig } from 'vitest/config'

/**
 * Tests unitaires : moteurs de domaine, fonctions pures, horloge.
 * Aucun accès réseau, aucune base de données.
 */
export default defineConfig({
  test: {
    name: 'unit',
    root: import.meta.dirname,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['src/**/*.integration.test.ts', '**/node_modules/**'],
  },
})
