# Tests de bout en bout

- Outil : **Playwright**, navigateur **Chromium**, viewport 1440 × 900 (desktop-first, D60).
- Fuseau : **Africa/Algiers** (D30), locale `fr-FR`.
- Cible : `E2E_BASE_URL` (par défaut `http://localhost:3000`).

## Commandes

```powershell
npm run test:e2e:install   # une seule fois : télécharge Chromium
npm run test:e2e           # lance les scénarios
```

## État à l'ÉTAPE 12

`smoke.spec.ts` est marqué `fixme` : l'application n'existe pas encore.
Les scénarios seront activés avec le code applicatif, sans changer la configuration.
