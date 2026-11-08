import { defineConfig, devices } from '@playwright/test'

/**
 * Tests de bout en bout (navigateur réel).
 *
 * L'application n'existe pas encore : les scénarios sont marqués `fixme`
 * et seront activés avec le code applicatif. `E2E_BASE_URL` permet de viser
 * l'environnement de recette sans modifier le fichier.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: process.env['CI'] !== undefined,
  retries: process.env['CI'] !== undefined ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env['E2E_BASE_URL'] ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    locale: 'fr-FR',
    timezoneId: 'Africa/Algiers',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],
})
