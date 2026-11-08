# STRATÉGIE ET PLAN DE TESTS

| Rubrique | Valeur |
|---|---|
| **Projet** | Application web de suivi des TODO LIST — GD Trading |
| **Livrable** | **11** — ÉTAPE 12 |
| **Décisions de référence** | **DÉCISIONS 1 à 75** · **AR-01 à AR-13** · **T8-01 à T8-15** · **T12-01 à T12-10** |
| **Périmètre de l'étape** | Stratégie, plan de tests, cas de test, critères de recette **et socle technique de test**. **Aucun code métier.** |
| **Date de rédaction** | 02/11/2026 |
| **Statut** | ✅ **VALIDÉE le 02/11/2026** — stratégie et plan arrêtés, socle technique opérationnel, **aucun code métier écrit** |

> **Règle M1** : cette étape est la seule qui produit du code d'infrastructure. Elle **ne contient aucune règle métier**, aucun modèle Prisma, aucune route, aucun composant d'interface.
>
> **Règle M2** : le plan **formalise** les décisions déjà validées. Les choix de mise en œuvre sont marqués 🔧 et numérotés **T12-xx** ; ils ne créent aucune règle métier.

---

## 1. Objet et périmètre

### 1.1 Objet

Ce document définit **comment l'application sera vérifiée** : quels niveaux de test, quels outils, quelles données, quels critères d'entrée et de sortie, et quelle recette le directeur prononcera.

Il fixe également les **quatre comportements laissés en zone grise à l'ÉTAPE 10** (`G1` à `G4`), désormais tranchés par les **DÉCISIONS 72 à 75**.

### 1.2 Périmètre

**Comprend** :

- la stratégie de test (pyramide, risque, responsabilités) ;
- le plan de test par domaine : moteurs, API, autorisations, interface, reprise, audit, non fonctionnel ;
- la nomenclature et le gabarit des cas de test ;
- les jeux de données et les règles d'isolation ;
- les critères d'entrée, de sortie, de suspension et de reprise ;
- la gestion des anomalies et la recette utilisateur ;
- le **socle technique complet** : configurations Vitest, Supertest, Playwright, base PostgreSQL de test, horloge injectable, scripts npm.

**Ne comprend pas** :

- le code métier (moteurs, routes, composants) → phase de développement ;
- le schéma Prisma et les migrations → phase de développement ;
- la politique de sécurité (sessions, mots de passe, verrouillage) → **ÉTAPE 13** ;
- la procédure de déploiement et la CI/CD → **ÉTAPE 14** ;
- la documentation utilisateur → **ÉTAPE 15**.

### 1.3 Statut de chaque énoncé

| Marque | Signification |
|---|---|
| ✅ **DÉCIDÉ** | Découle d'une décision validée (**D1 → D75**), d'une exigence (EF-xx), d'une règle (RM-xx), d'un critère (CA-xx) ou d'une décision technique (**T12-xx**). **Applicable tel quel.** |
| 🔧 **PROPOSÉ** | Choix de mise en œuvre technique, sans effet métier. Appliqué sauf objection. |
| ⚠️ **ZONE GRISE** | Aucune règle validée ne tranche. **Signalé, non appliqué.** |
| ❓ **À VALIDER** | Dépend d'un arbitrage non rendu. **Non appliqué** tant que la décision n'est pas prise. |

> À la date de ce document, **aucun point A12 ne reste ouvert** : `A12-01` à `A12-04` sont tranchés (**D72 → D75**).

### 1.4 Vocabulaire

| Terme | Définition |
|---|---|
| **Test unitaire** | Vérifie une fonction ou un moteur pur, sans base, sans réseau, sans navigateur. |
| **Test d'intégration** | Vérifie l'API Express et ses accès PostgreSQL réels, sur une base dédiée. |
| **Test de bout en bout (E2E)** | Vérifie un parcours complet dans un navigateur, interface + serveur + base. |
| **Harnais** | Code de support des tests : horloge, pool de base, client HTTP, fabriques. |
| **Fabrique (factory)** | Fonction qui construit un objet de test valide avec des valeurs par défaut surchargeables. |
| **Jeu de données** | Ensemble cohérent de lignes insérées avant une suite de tests. |
| **Couverture** | Proportion du code ou des règles atteinte par les tests ; elle ne prouve pas la qualité à elle seule. |
| **Recette (UAT)** | Validation fonctionnelle par le directeur sur des scénarios métier. |

### 1.5 Références

| Document | Usage |
|---|---|
| `docs\00_METHODE_DE_TRAVAIL.txt` | Méthode en 15 étapes, règles M1 → M5 |
| `docs\02_EXIGENCES_DIRECTEUR.md` | RE-01 → RE-20 |
| `docs\05_CAHIER_DES_CHARGES_FONCTIONNEL.md` | EF-01 → EF-79, RM-01 → RM-15, CA-01 → CA-64 |
| `docs\04_ARCHITECTURE_APPLICATION.md` | AR-01 → AR-13, pyramide de tests |
| `docs\06_MODELE_DE_DONNEES.md` | 14 tables, 4 énumérations, contraintes |
| `docs\07_API.md` | 54 endpoints, enveloppes, erreurs |
| `docs\08_INTERFACE_REACT.md` | 14 écrans, 18 parcours |
| `docs\09_ROLES_ET_PERMISSIONS.md` | 4 rôles, 54 cas T10-01 → T10-54 |
| `docs\10_REPRISE_DES_DONNEES.md` | 55 lignes de seed, 14 contrôles, CA-11-01 → CA-11-12 |

---

## 2. Principes de test

| # | Principe | Conséquence |
|---|---|---|
| **P1** | **Pyramide** | Beaucoup d'unitaires, moins d'intégrations, peu d'E2E. Un défaut se détecte au niveau le plus bas possible. |
| **P2** | **Ciblage sur le risque** | 100 % sur les règles critiques et les autorisations ; pas d'objectif chiffré sur l'interface. |
| **P3** | **Le serveur fait autorité** | Les droits sont testés côté API ; l'interface n'est jamais considérée comme une protection. |
| **P4** | **Déterminisme** | Aucune règle ne lit `new Date()` directement : l'horloge est injectée. Fuseau unique `Africa/Algiers` (D30). |
| **P5** | **Isolation** | Chaque test part d'un état connu ; aucune donnée de production, aucune base partagée avec la recette. |
| **P6** | **Non-régression** | Toute anomalie corrigée donne un test qui échoue avant la correction et passe après. |
| **P7** | **Traçabilité** | Chaque cas de test référence une exigence, une règle ou une décision. |
| **P8** | **Pas de test sur le classeur** | Le classeur est archivé en lecture seule (A11-04) ; les tests utilisent les 55 lignes du seed, jamais `ClasseurYD.xlsx`. |

---

## 3. Niveaux, outils et volumes

### 3.1 Vue d'ensemble

| Niveau | Outil | Cible | Volume prévisionnel 🔧 |
|---|---|---|---|
| **Statique** | TypeScript `strict`, ESLint, Prettier | Tout le code | continu |
| **Unitaire** | Vitest | Moteurs de domaine, horloge, utilitaires | **~180 cas** |
| **Intégration API** | Vitest + Supertest + PostgreSQL de test | 54 endpoints, transactions, autorisations | **~120 cas** |
| **Composants** | Vitest + Testing Library + jsdom | 14 écrans, composants partagés | **~40 cas** |
| **E2E** | Playwright + Chromium | 6 parcours critiques | **~8 scénarios** |
| **Manuel / recette** | Scénarios UAT | Métier, ergonomie, cas limites | **~20 scénarios** |

> Les volumes sont des **estimations de planification** 🔧, pas un engagement. Ils seront ajustés sans modifier la stratégie.

### 3.2 Tests unitaires

**Cibles** :

- `domain/task-status` — ordre d'évaluation du statut (RM-01) ;
- `domain/task-progress` — progression manuelle et repli temporel (RM-02) ;
- `domain/priority` — libellé et score issus de la matrice (RM-03) ;
- `domain/reminder` — date de rappel (RM-04) ;
- `domain/working-days` — week-end vendredi/samedi, fériés (RM-05, D5) ;
- `domain/durations` — durées G./E. (RM-06) ;
- `domain` — cohérence des dates (RM-15) ;
- `lib` — horloge, dates, erreurs.

**Interdits** dans un test unitaire : base de données, requête HTTP, système de fichiers, `new Date()` non injecté.

### 3.3 Tests d'intégration API

Chaque endpoint est couvert par **au moins** :

1. un **cas nominal** avec le rôle autorisé ;
2. un **cas de refus** avec un rôle non autorisé (`403`) ou une ressource hors périmètre (`404`) ;
3. un **cas de validation** (`400` / `422`) sur les champs obligatoires et les contraintes ;
4. un **cas de conflit** (`409`) lorsque la ressource l'exige (version, doublon, dernier admin).

Les tests d'intégration utilisent la **vraie base PostgreSQL** : contraintes `CHECK`, clés étrangères composites, transactions et audit sont ainsi réellement vérifiés.

### 3.4 Tests de bout en bout

Playwright, Chromium, viewport **1440 × 900** (D60), fuseau **Africa/Algiers**, locale `fr-FR`.

**Parcours automatisés retenus** 🔧 :

| # | Parcours | Rôles |
|---|---|---|
| E2E-01 | Connexion, changement de mot de passe imposé, arrivée sur l'écran d'accueil du rôle (D59) | tous |
| E2E-02 | Tâche du jour : consultation, passage en cours, clôture à l'heure | `EMPLOYEE` |
| E2E-03 | Clôture tardive : motif obligatoire, refus si vide (D15, D45) | `EMPLOYEE` |
| E2E-04 | Création et attribution d'une tâche dans son périmètre | `RESPONSABLE` |
| E2E-05 | Duplication : aperçu local, confirmation, copies atomiques (D44, D66) | `RESPONSABLE` |
| E2E-06 | Administration : création de compte, protection du dernier admin, refus d'auto-modification | `ADMIN` |

Les 18 parcours complets restent couverts par la recette manuelle ; les 12 autres ne justifient pas un test navigateur.

### 3.5 Analyse statique

| Contrôle | Commande | Bloquant |
|---|---|---|
| Types | `npm run typecheck` | oui |
| Lint | `npm run lint` | oui |
| Format | `npm run format:check` | oui en CI |

### 3.6 Ce qui n'est pas automatisé en V1

- l'ergonomie et la lisibilité (revue humaine) ;
- l'accessibilité complète (contrôle de base seulement) ;
- les tests de charge au-delà de la volumétrie ENF-09 ;
- la compatibilité multi-navigateurs (Chromium seul, desktop-first) ;
- les tests de sécurité offensive → **ÉTAPE 13**.

---

## 4. Environnements et isolation

### 4.1 Environnements

| Environnement | Usage | Base | Données |
|---|---|---|---|
| **Local** | Développement et tests | `gd_trading_test` | Jeux de test uniquement |
| **CI** | Exécution automatique | Base éphémère | Jeux de test uniquement |
| **Recette** | UAT et démonstration | Base de recette | Seed + jeux de recette |
| **Production** | Exploitation | Base de production | **Jamais utilisée par un test** |

### 4.2 Base de test

- URL fournie par `TEST_DATABASE_URL` (`.env.test.example`).
- Base **dédiée**, distincte de la recette et de la production.
- Réinitialisation par `resetDatabase()` : `TRUNCATE ... RESTART IDENTITY CASCADE` sur toutes les tables du schéma `public`, sauf `_prisma_migrations`.
- **Pas de transaction enveloppante** : les tests doivent pouvoir vérifier de vrais `COMMIT` / `ROLLBACK` métier.
- Les suites qui exigent la base sont **ignorées** si `TEST_DATABASE_URL` est absente : la construction ne casse pas sur un poste non configuré.

### 4.3 Horloge et fuseau

- Aucun moteur ne lit l'heure système : il reçoit un `Clock`.
- `systemClock` en production ; `fixedClock()` ou `TestClock` en test.
- Les dates métier sont calculées en `Africa/Algiers` (D30), jamais dans le fuseau du poste.
- Les tests d'heure limite couvrent **16h29** et **16h31**, jamais 16h30 pile, pour éviter les ambiguïtés de bord.

### 4.4 Données de test

| Jeu | Contenu | Usage |
|---|---|---|
| **Référentiels** | Les 55 lignes du seed (docs\10 §4) | Tous les tests d'intégration |
| **Comptes** | 1 `ADMIN`, 1 `RESPONSABLE`, 2 `EMPLOYEE`, 1 `CONSULTANT` | Autorisations |
| **Départements** | 1 département avec responsable, 1 sans responsable | Périmètres |
| **Tâches** | Quotidiennes, long terme, en retard, annulées, suspendues, clôturées | Moteurs et API |

Les fabriques créent des valeurs **explicites et minimales** ; aucun jeu ne dépend de l'ordre d'exécution.

### 4.5 Secrets

- Aucun mot de passe réel, aucune donnée nominative réelle dans les jeux de test.
- Les identifiants de test sont fictifs et documentés comme tels.
- `.env` et `.env.test` ne sont **jamais** versionnés.

---

## 5. Socle technique livré

### 5.1 Arborescence

```text
GD Trading - TodoList\
├─ package.json                  espaces de travail shared / server / client
├─ package-lock.json
├─ tsconfig.base.json            TypeScript strict partagé
├─ tsconfig.tools.json           vérification des fichiers de tooling (e2e, vitest)
├─ vitest.config.ts              projets unit / integration / client
├─ eslint.config.mjs
├─ .prettierrc.json  .prettierignore  .editorconfig  .gitignore
├─ .env.test.example
├─ shared\
│  ├─ package.json  tsconfig.json
│  └─ src\index.ts               types purs (vide à ce stade)
├─ server\
│  ├─ package.json  tsconfig.json
│  ├─ vitest.unit.config.ts
│  ├─ vitest.integration.config.ts
│  └─ src\tests\
│     ├─ clock.test.ts
│     ├─ db.integration.test.ts
│     ├─ http.integration.test.ts
│     └─ helpers\
│        ├─ clock.ts             horloge injectable
│        ├─ db.ts                pool PostgreSQL de test + réinitialisation
│        └─ http.ts              point d'entrée Supertest
├─ client\
│  ├─ package.json  tsconfig.json
│  ├─ vite.config.ts  vitest.config.ts
│  └─ src\tests\
│     ├─ setup.ts                matchers jest-dom
│     └─ render.test.tsx         preuve de la chaîne de rendu
└─ e2e\
   ├─ playwright.config.ts
   ├─ README.md
   └─ tests\smoke.spec.ts        scénario `fixme` en attente de l'application
```

Aucun dossier `prisma\`, aucune migration, aucune route, aucun composant applicatif n'est créé.

### 5.2 Scripts npm

| Commande | Effet |
|---|---|
| `npm test` | Unitaires + intégration |
| `npm run test:unit` | Projets `unit` et `client` |
| `npm run test:integration` | Projet `integration` |
| `npm run test:watch` | Mode surveillance |
| `npm run test:e2e` | Playwright |
| `npm run test:e2e:install` | Téléchargement de Chromium |
| `npm run typecheck` | Types de tous les espaces de travail + tooling |
| `npm run lint` | ESLint |
| `npm run format` / `format:check` | Prettier |

### 5.3 Configuration

- **Vitest 5**, projets nommés `unit`, `integration`, `client`.
- **Intégration** : exécution séquentielle (`fileParallelism: false`) pour éviter les collisions sur la base partagée ; délai de 20 s.
- **Client** : environnement `jsdom`, plugin React, matchers `jest-dom`.
- **Playwright** : Chromium, locale `fr-FR`, fuseau `Africa/Algiers`, URL `E2E_BASE_URL`.
- **TypeScript** : `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`.

### 5.4 Harnais

| Fichier | Rôle |
|---|---|
| `helpers\clock.ts` | `Clock`, `systemClock`, `fixedClock`, `TestClock` (avance, repositionne) |
| `helpers\db.ts` | `testDatabaseUrl`, `hasTestDatabase`, `createTestPool`, `resetDatabase`, `withTestDatabase` |
| `helpers\http.ts` | `api(app)` : Supertest en mémoire, aucun port ouvert |

### 5.5 Preuve d'exécution au 02/11/2026

| Commande | Résultat |
|---|---|
| `npm run typecheck` | ✅ 3 espaces de travail + tooling, aucune erreur |
| `npm run lint` | ✅ aucune erreur |
| `npm run format:check` | ✅ tous les fichiers conformes |
| `npm run test:unit` | ✅ **2 fichiers, 6 tests** |
| `npm run test:integration` | ✅ **2 tests** (harnais HTTP), **2 tests ignorés** (base absente) |
| `npm run test:e2e -- --list` | ✅ configuration valide, **1 scénario** listé (`fixme`) |

> L'absence de base de test sur le poste ne provoque **aucun échec** : la suite concernée est marquée ignorée, avec un motif explicite.

### 5.6 Limites du socle

- Il **ne teste aucune règle métier** : il prouve que la chaîne de test fonctionne.
- Les fabriques et les jeux de données seront ajoutés **avec le schéma Prisma**, pour ne pas figer des structures non encore codées.
- Playwright n'exécute aucun scénario réel avant l'existence du serveur et de l'interface.

---

## 6. Couverture ciblée sur le risque

### 6.1 Niveaux d'exigence

| Zone | Exigence |
|---|---|
| **Autorisations** (54 cas T10 + extensions D72 → D75) | **100 %** des cas, aucun test ignoré |
| **Règles critiques** (§6.2) | **100 %** des branches |
| **Moteurs de domaine** | **≥ 80 %** lignes, fonctions et branches |
| **API** | **100 %** des 54 endpoints ont au moins un cas nominal et un cas de refus |
| **Interface** | Aucun seuil chiffré : scénarios de parcours et revue visuelle |
| **Code d'infrastructure** (helpers) | Couvert par les tests de harnais |

### 6.2 Règles critiques

| # | Règle | Référence | Niveau |
|---|---|---|---|
| 1 | Ordre d'évaluation du statut | RM-01, D3 | unitaire + intégration |
| 2 | Échéance 16h30 des tâches quotidiennes | D18, RM-08 | unitaire + intégration + E2E |
| 3 | Motif obligatoire à la clôture tardive | RM-07, D15, D45 | unitaire + intégration + E2E |
| 4 | Périmètre de visibilité et de suppression | RM-10, RM-11, D7 | intégration |
| 5 | Jours ouvrés, week-end et fériés | RM-05, D5 | unitaire + intégration |
| 6 | Duplication atomique, sans génération automatique | D22, D44 | intégration + E2E |
| 7 | Matrice de priorité et score | RM-03, D14 | unitaire + intégration |
| 8 | Protection du dernier administrateur | **D72** | intégration + E2E |
| 9 | Effet immédiat d'un changement de rôle | **D73** | intégration |
| 10 | Annulation des tâches non commencées d'un employé désactivé | **D74** | intégration |
| 11 | Interdiction d'auto-modification du rôle | **D75** | intégration + E2E |
| 12 | Journal d'audit append-only | RM-13, D42 | intégration |

### 6.3 Mesure

- Couverture mesurée par **`@vitest/coverage-v8`**, publiée dans `coverage/`.
- Le seuil s'applique **par dossier** (`src/domain`, `src/lib`), pas au projet entier.
- Un seuil non atteint **bloque** l'intégration en CI (ÉTAPE 14), pas l'exécution locale.
- La couverture est un **indicateur**, jamais une preuve : une règle critique doit avoir un test explicite, même si le chiffre est atteint.

---

## 7. Plan de tests par domaine

### 7.1 Moteurs de domaine

| Moteur | Cas à couvrir | Références |
|---|---|---|
| **Statut** | tâche future → `A faire` ; commencée non échue → `En cours` ; échue → `Retard` ; clôturée → `Achevée` ; `ANNULEE` et `SUSPENDUE` prioritaires ; quotidienne à 16h29 / 16h31 ; frontière de fuseau | RM-01, CA-07 → CA-13, D3, D18, D30 |
| **Progression** | valeur manuelle ; repli temporel ; bornes 0 et 100 ; progression absente ; tâche annulée | RM-02, EF-56 |
| **Priorité** | 13 combinaisons de la matrice ; 3 combinaisons impossibles ; libellé exact `Elevée` ; score discret | RM-03, D14, D31 |
| **Rappel** | date calculée ; rappel échu ; rappel imminent ; absence de rappel | RM-04, EF-50, EF-51 |
| **Jours ouvrés** | vendredi et samedi exclus ; férié exclu ; enchaînement sur plusieurs semaines ; année 2027 sans fériés saisis | RM-05, D5, P2 |
| **Durées** | calcul G./E. ; valeurs nulles ; affichage | RM-06, P1 (ouvert) |
| **Dates** | ordre `dateAction ≤ dateDebut ≤ dateFinPrevue` ; cohérence de clôture | RM-15 |

> **P1** (signification de `Durée G./E.`) reste ouvert : les tests couvrent le **calcul existant**, pas une interprétation nouvelle.

### 7.2 API — 54 endpoints

| Module | Endpoints | Tests minimaux |
|---|---|---|
| Auth / santé | 6 | connexion, déconnexion, `me`, changement de mot de passe, `health`, session expirée |
| Tâches | 12 | CRUD, statut, progression, clôture, motif, duplication, pagination, version |
| Employés | 4 | liste, détail, création, modification / désactivation |
| Comptes | 5 | liste, création, modification de rôle, désactivation, `405` sur suppression |
| Départements | 5 | CRUD, responsable unique |
| Partenaires | 5 | CRUD, désactivation |
| Éléments | 5 | CRUD, ordre d'affichage |
| Priorités | 5 | urgences, importances, matrice en lecture |
| Fériés / paramètres / audit | 7 | CRUD fériés, paramètres, lecture audit |

**Pour chaque endpoint** : enveloppe de réponse, code HTTP, format des dates ISO, pagination `page` / `taille` (50, max 200), erreurs `404` vs `403`, `version` sur les tâches (T8-01 → T8-15).

### 7.3 Autorisations

- Les **54 cas T10-01 → T10-54** (docs\09 §12) deviennent **TC-AUT-001 → TC-AUT-054**.
- Ils sont exécutés **côté serveur**, avec de vrais comptes et de vrais rôles.
- Chaque cas vérifie **le code HTTP et l'absence de fuite** (aucun champ hors périmètre, aucun secret).
- Les extensions **D72 → D75** ajoutent 8 cas :

| # | Cas | Attendu |
|---|---|---|
| TC-AUT-055 | Retirer le rôle du **dernier admin actif** | `409 DERNIER_ADMIN` |
| TC-AUT-056 | Désactiver le **dernier admin actif** | `409 DERNIER_ADMIN` |
| TC-AUT-057 | Retirer le rôle d'un admin **quand un autre admin actif existe** | `200` |
| TC-AUT-058 | Changement de rôle pendant une session ouverte | droits recalculés à la requête suivante |
| TC-AUT-059 | Désactivation d'un employé avec tâches `A faire` | `200`, tâches passées à `Annulée` |
| TC-AUT-060 | Désactivation d'un employé avec tâches `En cours` / `Retard` / `Achevée` | `200`, tâches inchangées |
| TC-AUT-061 | Admin modifiant **son propre rôle** | `403 AUTO_MODIFICATION_INTERDITE` |
| TC-AUT-062 | Admin modifiant **son propre compte** (hors rôle) | `200` si l'opération est autorisée par ailleurs |

### 7.4 Interface — 14 écrans, 18 parcours

| Écran | Vérifications |
|---|---|
| Connexion | messages d'erreur, changement de mot de passe imposé, focus |
| Aujourd'hui | tri, statuts, actions disponibles, tâche quotidienne |
| Mes tâches | filtres, pagination, état vide |
| Service | visibilité responsable, affectation |
| Toutes les tâches | filtres, tri serveur `score` / `dateFinPrevue` (D64) |
| Détail tâche | commentaires, historique, actions selon rôle, conflit de version (D65) |
| Création / modification | validation, champs obligatoires, pilote selon périmètre |
| Duplication | aperçu local, dates, confirmation (D66) |
| Comptes | protection dernier admin, auto-modification, rôle |
| Employés | activation, département, responsable |
| Référentiels (4 écrans) | CRUD, ordre, désactivation |
| Fériés / paramètres | saisie, contrôle des horaires |
| Audit | lecture seule, filtres, pagination |
| Erreurs / 403 / 404 | messages non divulgants |

**Vérifications transverses** : absence de rôle codé en dur (D63), statut toujours accompagné de son libellé (D58), score jamais seul (D67), aucune dépendance à un thème clair (D69).

### 7.5 Reprise des données

| Contrôle | Attendu | Source |
|---|---|---|
| 1 → 14 du seed | volumes exacts | docs\10 §7.3 |
| 3 combinaisons absentes | refus par la FK composite | D31 |
| Idempotence | deuxième exécution = aucun doublon | A11-03 |
| Transaction | erreur en cours de seed = rollback complet | A11-03 |
| CA-11-01 → CA-11-12 | 12 critères d'acceptation | docs\10 §9 |
| Compte admin | créé après le seed, nominatif, changement imposé | D70 |

### 7.6 Audit

- Écriture de chaque événement prévu (création, modification, suppression logique, changement de rôle, désactivation, clôture, duplication).
- **Append-only** : aucune route de modification ou de suppression.
- Aucun secret, aucun mot de passe, aucun motif sensible hors champ prévu.
- Pagination et filtres en lecture seule.

### 7.7 Non fonctionnel

| Sujet | Vérification | Référence |
|---|---|---|
| **Volumétrie** | jeu de 5 000 tâches, 500 employés, 50 000 événements d'audit ; temps de réponse des listes | ENF-09 |
| **Performance perçue** | affichage d'une liste de 50 lignes < 1 s sur le réseau local | docs\08 |
| **Accessibilité** | navigation clavier, contrastes de la charte noir / rouge / blanc, libellés | docs\08 |
| **Sécurité** | reportée à l'ÉTAPE 13 | P12, G1 → G4 closes |
| **Sauvegarde / restauration** | procédure testée sur la recette | ENF-14, ÉTAPE 14 |

---

## 8. Cas de test : nomenclature et gabarit

### 8.1 Identifiants

| Préfixe | Domaine |
|---|---|
| `TC-STA-NNN` | Statut |
| `TC-PRG-NNN` | Progression |
| `TC-PRI-NNN` | Priorité |
| `TC-RAP-NNN` | Rappel |
| `TC-JOU-NNN` | Jours ouvrés |
| `TC-DUR-NNN` | Durées |
| `TC-API-NNN` | Endpoint |
| `TC-AUT-NNN` | Autorisation |
| `TC-IHM-NNN` | Interface |
| `TC-SED-NNN` | Seed / reprise |
| `TC-AUD-NNN` | Audit |
| `TC-NFR-NNN` | Non fonctionnel |

### 8.2 Gabarit

| Champ | Contenu |
|---|---|
| **Identifiant** | `TC-<DOMAINE>-<NNN>` |
| **Titre** | verbe + objet, en français |
| **Référence** | EF-xx, RM-xx, CA-xx, D-xx, T12-xx |
| **Niveau** | unitaire / intégration / client / E2E |
| **Préconditions** | état des données et rôle |
| **Jeu de données** | lignes créées, horloge fixée |
| **Étapes** | actions ordonnées |
| **Résultat attendu** | valeur exacte, code HTTP, message |
| **Automatisé** | oui / non / différé |

### 8.3 Exemples

**TC-STA-004 — Une tâche quotidienne non clôturée à 16h31 est en retard**

| Champ | Valeur |
|---|---|
| Référence | RM-01, RM-08, D18, CA-11 |
| Niveau | unitaire |
| Préconditions | tâche `QUOTIDIENNE`, `dateAction = 02/11/2026`, `dateFin = null` |
| Horloge | `2026-11-02T16:31:00+01:00` |
| Attendu | statut calculé = `Retard` |

**TC-PRI-013 — Les 3 combinaisons absentes sont refusées**

| Champ | Valeur |
|---|---|
| Référence | D31, docs\06 |
| Niveau | intégration |
| Préconditions | référentiels du seed |
| Étape | insertion d'une tâche `Pas urgent` + `Critique` |
| Attendu | erreur de clé étrangère, aucune ligne créée |

**TC-AUT-055 — Le dernier administrateur ne peut pas perdre son rôle**

| Champ | Valeur |
|---|---|
| Référence | D72, A12-01 |
| Niveau | intégration |
| Préconditions | un seul compte `ADMIN` actif |
| Étape | `PATCH /api/v1/accounts/:id { role: 'EMPLOYEE' }` |
| Attendu | `409`, code `DERNIER_ADMIN`, rôle inchangé, audit non écrit |

**TC-AUT-059 — Les tâches non commencées sont annulées à la désactivation**

| Champ | Valeur |
|---|---|
| Référence | D74, A12-03 |
| Niveau | intégration |
| Préconditions | employé avec 1 tâche `A faire`, 1 `En cours`, 1 `Retard`, 1 `Achevée` |
| Étape | `PATCH /api/v1/employees/:id { actif: false }` |
| Attendu | `A faire` → `ANNULEE` ; les trois autres inchangées ; une entrée d'audit par tâche annulée |

### 8.4 Volume prévisionnel

| Domaine | Cas |
|---|---|
| Moteurs | ~90 |
| API | ~120 |
| Autorisations | 62 |
| Interface | ~40 |
| Seed / reprise | ~30 |
| Audit | ~10 |
| Non fonctionnel | ~8 |
| **Total** | **~360** |

---

## 9. Critères d'entrée, de sortie et de suspension

### 9.1 Entrée

- Les ÉTAPES 1 à 11 sont validées.
- Le code à tester est compilé sans erreur (`typecheck`, `lint`).
- La base de test est accessible et migrée.
- Les jeux de données sont disponibles.

### 9.2 Sortie

| Critère | Seuil |
|---|---|
| Tests unitaires et d'intégration | **100 %** verts |
| Cas d'autorisation | **62 / 62** verts |
| Règles critiques (§6.2) | **100 %** couvertes |
| Anomalies bloquantes et majeures | **0** ouverte |
| Anomalies mineures | documentées et acceptées par le directeur |
| Recette UAT | **signée** |

### 9.3 Suspension et reprise

- **Suspension** : base indisponible, environnement instable, anomalie bloquante non corrigée.
- **Reprise** : cause levée, jeu de données réinitialisé, exécution complète relancée (jamais partielle).

---

## 10. Gestion des anomalies

| Sévérité | Définition | Délai de correction |
|---|---|---|
| **S1 — Bloquante** | Empêche un parcours essentiel ou viole une règle critique | Avant toute livraison |
| **S2 — Majeure** | Fonctionnement erroné sans contournement acceptable | Avant la recette |
| **S3 — Mineure** | Gêne d'usage, libellé, cosmétique | Planifiée |
| **S4 — Observation** | Amélioration, hors périmètre | Backlog |

**Circuit** : détection → fiche (identifiant, cas de test, gravité, preuve) → correction → **test de non-régression** → clôture.

Aucune anomalie n'est close sans test automatisé lorsque le cas est automatisable.

---

## 11. Recette utilisateur (UAT)

| # | Scénario | Rôle | Critère |
|---|---|---|---|
| UAT-01 | Se connecter et changer son mot de passe | tous | accès à l'écran d'accueil du rôle |
| UAT-02 | Traiter une tâche du jour | `EMPLOYEE` | statut et progression corrects |
| UAT-03 | Clôturer en retard avec motif | `EMPLOYEE` | motif exigé, historique complet |
| UAT-04 | Créer et attribuer une tâche | `RESPONSABLE` | périmètre respecté |
| UAT-05 | Dupliquer une tâche | `RESPONSABLE` | copies conformes, atomicité |
| UAT-06 | Consulter toutes les tâches | `ADMIN` | filtres et tri |
| UAT-07 | Gérer les comptes | `ADMIN` | dernier admin protégé |
| UAT-08 | Consulter en lecture seule | `CONSULTANT` | aucune action d'écriture |
| UAT-09 | Vérifier les référentiels et fériés | `ADMIN` | 55 lignes du seed |
| UAT-10 | Consulter le journal d'audit | `ADMIN` | événements complets, non modifiables |

La recette est prononcée par le **directeur**, sur la base de ce document et du procès-verbal de recette de l'ÉTAPE 14.

---

## 12. Traçabilité

| Source | Couverture |
|---|---|
| **RE-01 → RE-20** | parcours UAT + tests d'intégration |
| **EF-01 → EF-79** | au moins un cas par exigence fonctionnelle |
| **RM-01 → RM-15** | moteurs de domaine + intégration |
| **CA-01 → CA-64** | cas d'acceptation |
| **CA-11-01 → CA-11-12** | seed et reprise |
| **T10-01 → T10-54** | autorisations |
| **D72 → D75** | 8 cas supplémentaires (TC-AUT-055 → 062) |
| **D81** | assignation polymorphe : `TC-DBK-015` (contraintes PostgreSQL) + cas T10-30b → T10-30h (autorisations) |
| **AR-13** | pyramide de tests |
| **T12-01 → T12-10** | socle technique |

---

## 13. Décisions rendues le 02/11/2026

### 13.1 Zones grises de l'ÉTAPE 10 tranchées

| # | Point | Décision | Conséquence |
|---|---|---|---|
| **D72** | **A12-01 / G1** — dernier administrateur | **Protection** : refus de retirer le rôle `ADMIN` au dernier compte `ADMIN` actif et refus de le désactiver. Code `409`, `DERNIER_ADMIN`. | Nouvelle règle métier ; tests TC-AUT-055 et 056 ; l'interface désactive l'action et explique le motif |
| **D73** | **A12-02 / G2** — rôle et session ouverte | **Effet immédiat** : les droits sont recalculés à chaque requête (D29) ; l'interface rafraîchit `GET /me`. | Test TC-AUT-058 ; aucune révocation de session nécessaire |
| **D74** | **A12-03 / G3** — employé désactivé | **Annulation des tâches non commencées** : lors de la désactivation, les tâches assignées dont le statut calculé est `A faire` passent à `ANNULEE`. Les tâches `En cours`, `Retard`, `Achevée` et `Suspendue` restent inchangées. | Nouvelle règle métier ; tests TC-AUT-059 et 060 ; écriture d'audit par tâche annulée |
| **D75** | **A12-04 / G4** — auto-modification | **Interdiction** pour un `ADMIN` de modifier son propre rôle ou de se désactiver lui-même. Code `403`, `AUTO_MODIFICATION_INTERDITE`. Un autre administrateur doit agir. | Tests TC-AUT-061 et 062 ; l'interface masque l'action sur son propre compte |

### 13.2 Précisions d'application de D74 — confirmées le 02/11/2026

| Point | Précision retenue | Statut |
|---|---|---|
| **Périmètre des tâches** | Seules les tâches où l'employé est **assigné** (`assigne_a_employe_id`) sont concernées. Celles dont il est **pilote** sans être assigné ne sont pas annulées. | ✅ **Confirmé** |
| **Définition de « non commencée »** | Statut calculé **`A faire`** uniquement, conformément à RM-01. Une tâche `Retard` n'est **pas** annulée. | ✅ **Confirmé** |
| **Traçabilité** | Une entrée d'audit par tâche annulée, avec l'auteur de la désactivation. | ✅ D42 |
| **Réversibilité** | Aucune réouverture automatique si l'employé est réactivé (D48 : pas de réouverture). | ✅ D48 |

> Ces deux précisions fixent le **périmètre d'application** de D74, sans modifier la décision.

### 13.3 Décision rendue le 05/11/2026 — assignation à un partenaire (D81)

| # | Point | Décision | Conséquence |
|---|---|---|---|
| **D81** | Modèle d'assignation | L'**assigné** suit l'**acteur** : employé interne pour `GD_TRADING`, partenaire du référentiel pour `PARTENAIRE`. Le **pilote** est unique : employé pour `GD_TRADING` ; employé **ou** partenaire pour `PARTENAIRE`. Seul l'`ADMIN` crée ou modifie une tâche `PARTENAIRE`. | Colonnes `assigne_a_employe_id` / `assigne_a_partenaire_id` ; `ck_tache_assigne` ; tests `TC-DBK-015` et T10-30b → T10-30h ; aucun endpoint ajouté |

---

## 14. Décisions techniques du socle

| # | Sujet | Choix | Justification |
|---|---|---|---|
| **T12-01** | Exécuteur de tests | **Vitest 5**, trois projets (`unit`, `integration`, `client`) | Un seul outil pour le serveur et l'interface, compatible TypeScript natif |
| **T12-02** | Espaces de travail | **npm workspaces** `shared`, `server`, `client` | Conforme à l'arborescence validée (docs\04) ; pas d'outil supplémentaire |
| **T12-03** | Base de test | PostgreSQL dédiée via `TEST_DATABASE_URL`, réinitialisation par `TRUNCATE` | Vérifie les vraies contraintes et transactions |
| **T12-04** | Absence de base | Suites **ignorées** avec motif, pas d'échec | Un poste non configuré peut lancer les tests unitaires |
| **T12-05** | Horloge | Interface `Clock` injectée | Déterminisme des règles 16h30 / retard / rappels |
| **T12-06** | HTTP | **Supertest** en mémoire, aucun port ouvert | Rapide, isolé, adapté à Express |
| **T12-07** | E2E | **Playwright**, Chromium, 1440 × 900 | Desktop-first (D60), fuseau `Africa/Algiers` |
| **T12-08** | Couverture | `@vitest/coverage-v8`, seuils par dossier | Évite les moyennes trompeuses |
| **T12-09** | Qualité | TypeScript `strict`, ESLint, Prettier | Bloque les régressions de structure |
| **T12-10** | Nomenclature | `TC-<DOMAINE>-<NNN>` | Traçabilité et recherche |

---

## 15. Ce que l'ÉTAPE 12 ne fait pas

- Elle **n'écrit aucune règle métier**, aucun moteur, aucune route, aucun composant.
- Elle **ne crée pas** `schema.prisma`, les migrations ou la base de production.
- Elle **ne décide pas** de la politique de sessions ou de mots de passe → **ÉTAPE 13**.
- Elle **ne met pas en place** la CI/CD ni les sauvegardes → **ÉTAPE 14**.
- Elle **ne produit pas** la documentation utilisateur → **ÉTAPE 15**.
- Elle **ne modifie pas** les 95 actions du classeur : **aucune reprise** (D11).

---

## 16. Validation

### 16.1 Validation obtenue — 02/11/2026

Le directeur a **validé l'ÉTAPE 12 en l'état** : le plan de tests, le socle technique et les décisions **T12-01 → T12-10** sont acceptés. Les **deux précisions d'application de D74** sont confirmées.

| # | Objet | Décision | Statut |
|---|---|---|---|
| 1 | **Stratégie et niveaux de test** | Pyramide, ciblage sur le risque, déterminisme, isolation | ✅ Validé |
| 2 | **Socle technique** | Vitest, Supertest, Testing Library, Playwright, PostgreSQL de test, horloge injectable | ✅ Validé |
| 3 | **Couverture et seuils** | 100 % critiques et autorisations, ≥ 80 % moteurs, pas de seuil IHM | ✅ Validé |
| 4 | **Plan par domaine et critères de sortie** | Moteurs, 54 endpoints, 62 cas d'autorisation, 14 écrans, seed, audit, non fonctionnel | ✅ Validé |
| 5 | **D72 → D75** | Dernier admin protégé, effet immédiat du rôle, annulation des tâches non commencées, auto-modification interdite | ✅ Validé |
| 6 | **Précisions D74** | Employé **assigné** uniquement ; statut calculé **`A faire`** uniquement | ✅ Confirmé |
| 7 | **T12-01 → T12-10** | Choix techniques du socle | ✅ Validé |

### 16.2 Points vérifiés

1. la **stratégie** et les **niveaux de test** sont adaptés au projet ;
2. le **socle technique** est accepté comme base de travail ;
3. la **couverture ciblée sur le risque** et les **seuils** sont acceptés ;
4. le **plan par domaine** et les **critères de sortie** sont complets ;
5. les **décisions D72 → D75** sont conformes aux arbitrages du directeur ;
6. les **précisions d'application de D74** sont confirmées ;
7. les **décisions techniques T12-01 → T12-10** sont acceptées.

> **ÉTAPE 12 close le 02/11/2026.** L'**ÉTAPE 13 — Sécurité** peut être engagée.
> **Aucun code métier n'a été écrit** : seuls les fichiers de configuration et le harnais de tests existent.

---

## 17. Journal des révisions

| Date | Section(s) | Modification | Statut |
|---|---|---|---|
| 02/11/2026 | Document entier | Création du livrable 11 (ÉTAPE 12) : stratégie, niveaux et outils, environnements, socle technique, couverture ciblée, plan par domaine, nomenclature, critères d'entrée et de sortie, anomalies, UAT, traçabilité, décisions **D72 → D75** et **T12-01 → T12-10**. | ⏳ En attente de validation |
| 02/11/2026 | En-tête, §13.2, §16.1, §16.2, §17 | **Validation du directeur le 02/11/2026** : plan, socle et **T12-01 → T12-10** acceptés en l'état ; **D74** précisée — employé **assigné** uniquement, statut calculé **`A faire`** uniquement. ÉTAPE 13 autorisée. | ✅ **VALIDÉE le 02/11/2026** |
