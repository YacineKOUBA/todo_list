import { expect, test } from '@playwright/test'

/**
 * Scénario de fumée : il vérifie que l'application répond.
 * Activé dès que le serveur et l'interface existent (ÉTAPE 12, phase code).
 */
test.fixme('l’application répond et affiche son titre', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle(/GD Trading/)
})
