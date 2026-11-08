import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

/**
 * Tests de composants React : environnement jsdom, aucun serveur.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    name: 'client',
    root: import.meta.dirname,
    environment: 'jsdom',
    include: ['src/**/*.test.tsx', 'src/**/*.test.ts'],
    setupFiles: ['src/tests/setup.ts'],
  },
})
