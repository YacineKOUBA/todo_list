# Phase A — Socle technique, base de données et sécurité

**Projet** : application web interne de suivi des TODO LIST — GD Trading
**Document de référence** : `docs/12_SECURITE.md` (validé le 02/11/2026), phases A → D
**Date de livraison** : 02/11/2026
**Statut** : **Phase A livrée — en attente de validation du directeur**

> Ce document est un **rapport de mise en œuvre**, pas un livrable d'analyse
> numéroté au sens de la règle M8. Il prouve que la Phase A est exécutée et
> s'arrête au point de validation, conformément à la règle « une seule étape à
> la fois » (M1) et « rien n'est fait sans validation » (M2).

---

## 1. Objet et périmètre

La Phase A couvre **uniquement le socle** : schéma de données, migrations,
seed, moteurs de domaine purs et briques de sécurité. **Aucun endpoint métier
n'est exposé** : l'API complète (54 endpoints, 62 cas d'autorisation) relève de
la Phase B.

| Élément | Inclus en Phase A | Renvoyé à |
|---|---|---|
| Schéma Prisma (15 modèles, 4 énumérations) | oui | — |
| Migrations SQL (CHECK, index fonctionnels/partiels, FK composite, trigger) | oui | — |
| Seed des 55 lignes de référence | oui | — |
| Moteurs de domaine purs (statut, progression, priorité, jours ouvrés, rappel, durées, service porteur) | oui | — |
| Socle sécurité (Argon2id, politique mot de passe, sessions, CSRF, verrouillage, problem+json, en-têtes, journal, limitation) | oui | — |
| Scripts `admin:create` / `admin:reset` | oui | — |
| Routes HTTP, authentification, autorisation, CRUD | non | Phase B |
| Recette complète TC-SEC-001 → 056 sur l'application réelle | partielle | Phase B / C |
| Rôles PostgreSQL, TLS, sauvegarde, déploiement | non | Phase C / D |
| Interface React | non | Phase C |

---

## 2. Décisions appliquées

| Décision | Application concrète |
|---|---|
| **D70 / A11-01** | `prisma/create-admin.ts` crée un compte **nominatif** (`nom`, `prenom`, `identifiant` fournis), rôle `ADMIN`, changement de mot de passe forcé. |
| **D76** | Politique 12–128 caractères, aucune composition imposée, mot de passe différent de l'identifiant. |
| **D77** | Session 30 min d'inactivité, 10 h absolues. |
| **D78** | 5 échecs → 15 min de verrouillage ; 10 connexions / 15 min et 100 requêtes / min par IP ; écritures 30 / min. |
| **D79** | Aucun MFA en V1 (risque R1 accepté). |
| **D80** | Réactivation : ancien mot de passe conservé, `doitChangerMotDePasse = true` (le script de réactivation sera branché en Phase B). |
| **T13-01** | Argon2id `m=65536`, `t=3`, `p=1`, sortie 32 octets, sel 16 octets, re-hachage si paramètres obsolètes. |
| **T13-02** | Mot de passe temporaire de 16 caractères, alphabet sans `I`, `O`, `l`, `0`, `1`. |
| **T13-04** | Jeton de session 32 octets base64url, seul le HMAC-SHA-256 est stocké, cookie `HttpOnly` + `Secure` + `SameSite=Strict` + `Path=/api`. |
| **T13-05** | CSRF = `HMAC(secret, "csrf:" + session.id)`, comparaison à temps constant. |
| **T13-06** | `express-rate-limit`, stockage mémoire (serveur unique, R7). |
| **T13-08** | Helmet, CSP stricte en production, HSTS en production, `X-Powered-By` supprimé. |
| **T13-09** | `pino` + `pino-http`, `X-Request-Id`, masquage des secrets. |
| **T13-10** | Validation Zod de 15 variables au démarrage, refus des secrets faibles en production. |
| **T13-11** | Purge à 7 jours, maximum 5 sessions actives (constantes posées ; application en Phase B). |
| **D5 / D14 / D28 / D29 / D30 / D31** | Moteurs de jours ouvrés, priorité, nature de tâche, service porteur, fuseau `Africa/Algiers`, matrice à 13 combinaisons. |

### Écarts techniques assumés

1. **Prisma 6.19.3** au lieu de la version 8.0.0-rc : version stable, compatible
   avec le client généré et les migrations. À documenter comme décision
   technique si le directeur le souhaite.
2. **Migrations SQL écrites à la main** : Prisma ne sait pas exprimer les
   `CHECK`, index fonctionnels/partiels, FK composites ni les déclencheurs.
   Application par `prisma migrate deploy` uniquement, **forward-only**.

---

## 3. Base de données

### 3.1 Schéma

`server/prisma/schema.prisma` décrit **15 modèles** et **4 énumérations** :

`departement`, `employe`, `utilisateur`, `partenaire`, `element`, `urgence`,
`importance`, `matrice_priorite`, `action_a_prendre`, `tache`, `commentaire`,
`journal_audit`, `parametre`, `jour_ferie`, `session`.

Énumérations : `role_utilisateur`, `nature_tache`, `acteur_tache`,
`statut_manuel`.

### 3.2 Migrations

| Migration | Contenu | État dev | État test |
|---|---|---|---|
| `202611020001_init` | Types, 15 tables, `CHECK`, FK composites, index fonctionnels et partiels | appliquée | appliquée |
| `202611020002_audit_append_only` | Trigger refusant `UPDATE` / `DELETE` sur `journal_audit` | appliquée | appliquée |

Preuve : `prisma migrate status` → **« Database schema is up to date! »** sur
`gd_trading_dev`. Les deux migrations ont été appliquées sur `gd_trading_test`
pendant cette livraison.

### 3.3 Seed

`server/prisma/seed.ts` est **idempotent**, exécuté dans **une seule
transaction**, et contrôlé par 13 assertions. Troisième exécution consécutive
le 02/11/2026 :

```
OK  parametre                      attendu=1  obtenu=1
OK  urgence                        attendu=4  obtenu=4
OK  importance                     attendu=4  obtenu=4
OK  matrice_priorite               attendu=13 obtenu=13
OK  action_a_prendre               attendu=3  obtenu=3
OK  element                        attendu=6  obtenu=6
OK  jour_ferie                     attendu=15 obtenu=15
OK  departement                    attendu=9  obtenu=9
OK  tache                          attendu=0  obtenu=0
OK  commentaire                    attendu=0  obtenu=0
OK  partenaire                     attendu=0  obtenu=0
OK  journal_audit                  attendu=0  obtenu=0
OK  matrice_combinaisons_absentes  attendu=0  obtenu=0

Seed conforme : 55 lignes de référence.
```

**55 lignes** = 1 paramètre + 4 urgences + 4 importances + 13 combinaisons +
3 actions + 6 piliers + 15 fériés 2026 + 9 départements. **0 donnée métier.**

### 3.4 Contraintes vérifiées contre PostgreSQL

Le fichier `server/src/tests/db-constraints.integration.test.ts` vérifie les
règles que Prisma ne peut pas porter :

- journal d'audit **append-only** (`TC-SEC-051`, code `42501`) ;
- unicité de l'identifiant **insensible à la casse** ;
- un seul compte par employé ;
- **FK composite** : combinaison absente de la matrice refusée (D31) ;
- progression manuelle bornée 0–100 ;
- cohérence du pilote selon l'acteur (D6) ;
- nature de tâche et ordre des dates (D28, RM-15) ;
- clôture tardive avec motif (D15) ;
- paramètre singleton et week-end à deux jours distincts ;
- expiration de session postérieure à la création ;
- unicité des jours fériés et refus d'un nom d'employé vide.

---

## 4. Moteurs de domaine

Fonctions **pures**, sans accès réseau ni base, temps fourni par un `Clock`
injectable (`server/src/lib/clock.ts`) :

| Fichier | Règle | Exemple de couverture |
|---|---|---|
| `domain/task-status.ts` | RM-01, D3, D18, D28, D30 | échéance quotidienne 16h30 à Alger, annulation, suspension |
| `domain/task-progress.ts` | RM-02, D4 | valeur manuelle prioritaire, plafond, `null` → « — » |
| `domain/priority.ts` | RM-03, D14, D31 | 13 combinaisons, libellé exact, 3 combinaisons absentes |
| `domain/working-days.ts` | RM-05, D5 | week-end vendredi + samedi, fériés, ajout négatif |
| `domain/reminder.ts` | RM-04, EF-50/51 | base calendaire, résultat ouvré, signaux J+1 → J+5 |
| `domain/durations.ts` | RM-06, P1 | durées G./E., incohérence → `ERREUR` |
| `domain/service-porteur.ts` | P7 → D29, RM-10 | exécutant puis pilote |
| `lib/calendar-date.ts` | D30 | conversion `Africa/Algiers`, 16h30 = 15h30 UTC |

---

## 5. Socle de sécurité

| Fichier | Rôle | Décision |
|---|---|---|
| `config/env.ts` | Validation Zod des 15 variables, refus des secrets faibles en production | T13-10 |
| `security/argon2.ts` | Argon2id, hash factice anti-énumération, re-hachage | T13-01 |
| `security/password-policy.ts` | 12–128 caractères, pas de composition, ≠ identifiant | D76 |
| `security/temporary-password.ts` | 16 caractères, alphabet non ambigu | T13-02 |
| `security/session-tokens.ts` | Jeton opaque, HMAC, CSRF, expiration, cookie | T13-04 / 05 / 11 |
| `security/lockout.ts` | 5 échecs → 15 min, remise à zéro | D78 |
| `security/problem.ts` | `application/problem+json` (RFC 9457) | docs/07 §5 |
| `security/rate-limit.ts` | 3 limites par IP, `429` + `Retry-After` | T13-06 |
| `security/headers.ts` | Helmet, CSP stricte, HSTS, Permissions-Policy | T13-08 |
| `security/logger.ts` | `pino`, `X-Request-Id`, masquage des secrets | T13-09 |

---

## 6. Scripts d'administration

### 6.1 `npm run admin:create`

Exécuté sur `gd_trading_test` :

```
Compte administrateur créé.
  identifiant          : admin.test
  rôle                 : ADMIN
  changement forcé     : oui
```

Vérifications en base : employé créé, rôle `ADMIN`, `actif = true`,
`doit_changer_mot_de_passe = true`, hash `$argon2id$...`, une entrée d'audit
`COMPTE` avec acteur système. Une seconde création avec `ADMIN.TEST` est
**refusée** (unicité insensible à la casse).

### 6.2 `npm run admin:reset`

Exécuté ensuite après création d'une session de test :

```
Réinitialisation d’urgence effectuée.
  identifiant          : admin.test
  changement forcé     : oui
  sessions révoquées   : oui
```

Vérifications en base : mot de passe remplacé, `doit_changer_mot_de_passe = true`,
compteur d'échecs remis à 0, session marquée `revoque_le`, audit
`MOT_DE_PASSE` avec acteur `NULL` (`source = admin:reset`). Un identifiant
`EMPLOYEE` est **refusé** (« Aucun compte ADMIN ne correspond… »).

La base de test a été entièrement purgée après ces vérifications
(0 utilisateur, 0 employé, 0 session, 0 audit).

---

## 7. Preuves de qualité

### 7.1 Tests

| Suite | Fichiers | Tests | Résultat |
|---|---:|---:|---|
| Unitaires serveur | 16 | 149 | **149 / 149** |
| Unitaires client | 1 | 1 | **1 / 1** |
| Intégration | 6 | 31 | **31 / 31** |
| **Total** | **23** | **181** | **181 / 181** |

Couverture (unitaires + intégration) :

| Périmètre | Statements | Branches | Fonctions | Lignes |
|---|---:|---:|---:|---:|
| `config` | 100 % | 94,11 % | 100 % | 100 % |
| `domain` | 98,90 % | 98,93 % | 100 % | 98,68 % |
| `lib` | 98,43 % | 86,84 % | 100 % | 98,21 % |
| `security` | 95,68 % | 84,61 % | 97,67 % | 97,65 % |
| **Ensemble** | **97,55 %** | **91,62 %** | **98,87 %** | **98,27 %** |

Objectif T12 (≥ 80 % sur les moteurs et bibliothèques) : **atteint**.

### 7.2 Portail qualité

| Commande | Résultat |
|---|---|
| `npm run typecheck` | ✅ shared, server, client, outils |
| `npm run lint` | ✅ aucune erreur |
| `npm run format:check` | ✅ tous les fichiers conformes |
| `npm test` | ✅ 181 tests verts |
| `npm audit --omit=dev` | ⚠️ **3 vulnérabilités hautes** (voir §8) |

### 7.3 Cas `TC-SEC` couverts dès la Phase A

`TC-SEC-006`, `007`, `008`, `009`, `010`, `011`, `019`, `020`, `021`, `022`,
`026`, `028`, `029`, `030`, `032`, `034`, `035`, `036`, `039`, `040`, `041`,
`043` (partie en-tête), `045`, `051`.

Les **32 autres cas** (`TC-SEC-001 → 005`, `012 → 018`, `023 → 025`,
`027`, `031`, `033`, `037`, `038`, `042`, `044`, `046 → 050`,
`052 → 056`) nécessitent l'application HTTP complète ou le déploiement :
ils sont planifiés en Phase B, C et D.

---

## 8. Points ouverts et risques

| Réf. | Point | Impact | Traitement proposé |
|---|---|---|---|
| **P1** | Signification des sigles `G` et `E` des durées | Libellés d'écran | Rester neutre ; ne pas figer `G`/`E` dans l'interface |
| **P2** | Jours fériés des années suivantes | Rappels futurs | Saisie administrateur ; aucune année inventée |
| **P3** | Départements réellement retenus | Référentiel | 9 départements seedés, conformes au document validé |
| **P5 / P11** | Points résiduels d'analyse | Non bloquant | Suivi inchangé |
| **D70** | Nom, prénom et identifiant du premier `ADMIN` | Bloque la création du compte réel | À fournir avant l'ÉTAPE 14 |
| **TC-SEC-042** | `npm audit --omit=dev` : 3 vulnérabilités hautes | Chaîne **de développement** `prisma` → `@prisma/config` → `deepmerge-ts` ; absente du runtime applicatif | À traiter avant la sortie de Phase C/D : montée Prisma 7.10.1 (rupture) **ou** acceptation de risque documentée |
| **T13-12** | Rôles PostgreSQL séparés (application / migration) | Défense en profondeur | Phase D |
| **Playwright** | Chromium non installé | Tests navigateur | `npm run test:e2e:install` avant la Phase C |
| **Tests navigateur** | Non exécutés | TC-SEC-037/043 complets | Phase C |

> **Aucune décision métier n'est prise dans ce rapport.** Les points ci-dessus
> sont des constats techniques ou des rappels de décisions déjà validées.

---

## 9. Ce que la Phase B devra livrer

Après validation de la Phase A :

- application Express réelle (`src/http/app.ts`) et démarrage serveur ;
- **54 endpoints** documentés dans `docs/07_API.md` ;
- authentification, sessions, CSRF, changement forcé, déconnexion ;
- **62 cas d'autorisation** de `docs/09_ROLES_ET_PERMISSIONS.md` ;
- CRUD tâches, référentiels, comptes, commentaires, audit ;
- raccordement effectif des moteurs de domaine et du socle sécurité ;
- tests d'intégration `TC-SEC-001 → 056` et `TC-AUT-001 → 062`.

---

## 10. Validation demandée

La Phase A est terminée. **Aucune ligne de la Phase B ne sera écrite sans
validation explicite.**

Merci d'indiquer votre choix :

- [ ] **Phase A validée** — passer à la Phase B (API, 54 endpoints).
- [ ] **Phase A validée avec réserves** — préciser les points à corriger avant la Phase B.
- [ ] **Phase A à revoir** — préciser les éléments attendus.

---

## Journal des révisions

| Date | Sections | Nature | Statut |
|---|---|---|---|
| 02/11/2026 | Toutes | **Création.** Livraison de la Phase A : schéma, migrations, seed, moteurs, socle sécurité, scripts admin, tests (181) et couverture (97,55 %). | **En attente de validation** |
