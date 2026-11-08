# Phase B — API métier (socle) et démonstration au directeur

**Projet** : application web interne de suivi des TODO LIST — GD Trading
**Documents de référence** : `docs/07_API.md`, `docs/08_INTERFACE_REACT.md`, `docs/09_ROLES_ET_PERMISSIONS.md`, `docs/12_SECURITE.md` (validés le 02/11/2026)
**Date de livraison** : 02/11/2026
**Statut** : **socle API livré + 5 écrans de démonstration — en attente de validation du directeur**

> Ce document est un **rapport de mise en œuvre**, pas un livrable d'analyse
> numéroté au sens de la règle M8. Il constate ce qui est exécuté et s'arrête au
> point de validation, conformément aux règles « une seule étape à la fois »
> (M1) et « rien n'est fait sans validation » (M2).

---

## 1. Objet et périmètre

La Phase B complète la Phase A (schéma, migrations, seed, moteurs de domaine,
sécurité). Elle livre :

1. le **socle API réel** : authentification, session, CSRF, autorisation par
   rôle et par périmètre, CRUD des tâches, commentaires, historique, audit,
   référentiels ;
2. une **interface React de démonstration** limitée à **5 écrans** pour montrer
   le produit au directeur le plus tôt possible ;
3. un **jeu de données fictif** dans une base **séparée**, sans jamais toucher
   aux bases de développement, de test ou de production (D11).

| Élément | Livré | Renvoyé à |
|---|---|---|
| API d'authentification, sessions, CSRF, verrouillage, limitation | oui | — |
| `/me` et droits calculés par rôle | oui | — |
| Tâches : liste, détail, création, modification, statut, progression, clôture, commentaires, duplication, suppression logique, historique | oui | — |
| Référentiels : employés, départements, partenaires, éléments, urgences, importances, matrice, actions à prendre, jours fériés, paramètres | oui | — |
| Audit append-only branché sur les écritures métier | oui | — |
| Écrans de démonstration | **5 écrans** | 9 écrans restants en Phase C |
| Endpoints restants (comptes, référentiels administrables, exports…) | non | Phase B (suite) |
| Recette E2E Playwright complète | non | Phase C |
| Déploiement, TLS, rôles PostgreSQL, sauvegarde | non | Phase C / D |

**Périmètre exact de la démonstration** : écran de connexion, « Aujourd'hui »,
« Mes tâches », « Toutes les tâches », détail d'une tâche, création d'une tâche.
L'écran de liste est réutilisé pour les trois vues ; cela fait **5 écrans
distincts** au sens fonctionnel.

---

## 2. Environnement de démonstration

### 2.1 Base de données dédiée

| Élément | Valeur |
|---|---|
| Base | `gd_trading_demo` (PostgreSQL 16, port **5433**) |
| Création | base neuve, `prisma migrate deploy`, seed de référence (55 lignes), puis `prisma/seed-demo.ts` |
| Comptes | **11 comptes fictifs** : 1 `ADMIN`, 3 `RESPONSABLE`, 6 `EMPLOYEE`, 1 `CONSULTANT` |
| Tâches | **22 tâches** fictives (datées et quotidiennes), statuts variés : à faire, en cours, en retard, achevée, annulée, suspendue |
| Partenaire | 1 partenaire fictif (`TRANSPORTEUR ATLAS`) |
| Mot de passe | `GdTradingDemo2026!` (commun aux comptes de démonstration) |
| Compte principal | `admin` |
| Compte lecture seule | `demo.consultant` |

Le script `server/prisma/seed-demo.ts` **refuse de s'exécuter** si l'URL de base
ne contient pas `gd_trading_demo`, et refuse d'écraser une base déjà peuplée.
Il est **idempotent par construction** : il exige une base neuve, donc un
deuxième passage échoue sans rien modifier.

### 2.2 Port de l'interface

Le port par défaut **5173** est occupé par l'application Vite de l'ancien projet
« EXCEL TO STOCK MANAGEMENT WEB APP ». Pour garantir une séparation stricte et
éviter toute confusion pendant la démonstration, le serveur de développement de
GD Trading écoute sur **`http://localhost:5273`**, avec `strictPort: true` dans
`client/vite.config.ts`, et `APP_ORIGIN=http://localhost:5273` dans
`server/.env.demo`.

| Service | Adresse |
|---|---|
| Interface | `http://localhost:5273` |
| API | `http://127.0.0.1:3000/api/v1` |
| Santé | `http://127.0.0.1:3000/api/v1/health` |

### 2.3 Commandes

```powershell
# Base de démonstration (une seule fois, base neuve)
$env:DATABASE_URL = 'postgresql://gd_trading@127.0.0.1:5433/gd_trading_demo'
npx --prefix server prisma migrate deploy --schema server/prisma/schema.prisma
npm run db:seed  --workspace @gd-trading/server
npm run demo:seed --workspace @gd-trading/server

# Démarrage
npm run demo:start --workspace @gd-trading/server   # API, port 3000
npm run dev       --workspace @gd-trading/client    # interface, port 5273
```

---

## 3. API exposée

**30 routes** sont branchées sur les **54** du contrat validé : 29 opérationnelles
et 1 refus explicite conforme (`DELETE /employees/:id` → `405`, docs/07 §9).

### 3.1 Santé et authentification

| Méthode | Route | Rôle |
|---|---|---|
| `GET` | `/health` | Disponibilité (publique, sans journal métier) |
| `POST` | `/auth/login` | Ouverture de session (publique, limitée par IP) |
| `POST` | `/auth/logout` | Fermeture de la session courante |
| `GET` | `/auth/csrf` | Jeton CSRF de la session |
| `POST` | `/auth/password` | Changement de mot de passe |
| `GET` | `/me` | Identité, rôle, employé et droits calculés |

### 3.2 Tâches

| Méthode | Route | Rôle |
|---|---|---|
| `GET` | `/tasks` | Liste filtrée, triée, paginée, selon la vue et le rôle |
| `GET` | `/tasks/:id` | Détail complet (statut, progression, rappel, durées recalculés) |
| `POST` | `/tasks` | Création contrôlée par la matrice de priorité |
| `PATCH` | `/tasks/:id` | Modification avec contrôle de version |
| `PATCH` | `/tasks/:id/status` | Suspendre / annuler / rétablir |
| `PATCH` | `/tasks/:id/progress` | Progression manuelle (prioritaire sur les jalons) |
| `POST` | `/tasks/:id/close` | Clôture, motif obligatoire si tardive |
| `GET` | `/tasks/:id/comments` | Commentaires (append-only) |
| `POST` | `/tasks/:id/comments` | Ajout d'un commentaire |
| `POST` | `/tasks/:id/duplicate` | Duplication selon D44 |
| `DELETE` | `/tasks/:id` | Suppression logique + audit |
| `GET` | `/tasks/:id/history` | Historique réduit (type, auteur, date, champs modifiés) |

### 3.3 Référentiels

`GET /employees`, `GET /employees/:id`, `DELETE /employees/:id` (`405`),
`GET /departments`, `GET /partners`, `GET /elements`, `GET /urgencies`,
`GET /importances`, `GET /priority-matrix`, `GET /actions-a-prendre`,
`GET /holidays`, `GET /settings`.

### 3.4 Comportements transverses

- **Autorisation** : périmètres `mes-taches`, `mes-taches-du-jour`,
  `mes-autres-taches`, `service`, `toutes`, calculés côté serveur à chaque
  requête (`docs/09`). Un `EMPLOYEE` ne peut pas forcer une autre vue.
- **Versionnement optimiste** : toute écriture compare `version` ; un écart
  renvoie `409 VERSION_OBSOLETE` sans modifier la donnée.
- **Audit** : chaque écriture métier et son événement partagent la même
  transaction. Le journal est append-only (migration `202611020002`).
- **Erreurs** : `application/problem+json`, codes stables, jamais de détail
  technique ni de secret dans la réponse.
- **CSRF** : jeton exigé sur toute écriture authentifiée ; la route de connexion
  est la seule exemptée, car `/auth/csrf` exige déjà une session.

---

## 4. Écrans livrés

| Écran | Contenu | Capture |
|---|---|---|
| Connexion | Marque, formulaire, message d'erreur générique, encart de démonstration | — |
| Aujourd'hui | Tâches du jour de l'utilisateur, rappels, retards | — |
| Mes tâches | Toutes les tâches dont l'utilisateur est exécutant, pilote ou auteur | — |
| Toutes les tâches | Vue administrateur / consultant, filtres par statut, recherche | `captures/01-liste-taches.jpeg` |
| Détail d'une tâche | Champs complets, progression, actions, commentaires, historique | `captures/02-detail-tache.jpeg` |
| Nouvelle tâche | Formulaire complet contrôlé par le serveur (matrice, dates, pilote) | `captures/03-nouvelle-tache.jpeg` |

Galerie : `docs/rapports/captures/index.html`.

L'interface applique la palette **noir / rouge / blanc** : le rouge est réservé
aux alertes et aux retards ; chaque statut porte un **libellé + une icône +
une position** propres, jamais la couleur seule. Les dates sont affichées au
format `JJ/MM/AAAA` et les horodatages `JJ/MM/AAAA à HH:MM`, en fuseau
`Africa/Algiers`.

Le **consultant** (`demo.consultant`) voit une interface strictement en lecture :
pas de navigation « Aujourd'hui / Mes tâches », pas de création, pas de
commentaire, pas de changement de statut.

En cas de session expirée ou de base réinitialisée, l'interface revient
automatiquement à l'écran de connexion au lieu d'afficher une erreur générique.

---

## 5. Sécurité appliquée

| Décision | Application |
|---|---|
| **D70 / A11-01** | Le compte de production reste nominatif, créé par `admin:create`. La démonstration utilise un compte **fictif** `admin`. |
| **D72** | Dernier administrateur actif protégé (`409 DERNIER_ADMIN`) ; pas d'auto-modification de rôle ni d'auto-désactivation (`403`). |
| **D73 / D74** | Changement de rôle immédiat ; désactivation : annulation des tâches « À faire » avec une entrée d'audit par tâche. |
| **D76** | Mot de passe 12–128 caractères, changement forcé à la première connexion et après réinitialisation. |
| **D77** | Session : 30 min d'inactivité, 10 h absolues ; cookie `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/api`. |
| **D78** | 5 échecs → 15 min de verrouillage ; 10 connexions / 15 min et 100 requêtes / min par IP ; 30 écritures / min. |
| **D79** | Aucun MFA en V1. |
| **D80** | Réactivation : mot de passe conservé, changement forcé. |

**Écart de démonstration assumé** : `doitChangerMotDePasse = false` pour les
comptes de `gd_trading_demo`, afin de montrer directement les écrans. La
production conserve D76 (changement forcé).

---

## 6. Données de démonstration

- 11 comptes, tous rattachés à un employé fictif et à un département réel du
  seed de référence ;
- 22 tâches couvrant la matrice de priorité (13 combinaisons, 3 absentes par
  conception — D31), les natures datée et quotidienne, les acteurs `GD_TRADING`
  et `PARTENAIRE`, les statuts manuels et les clôtures tardives ;
- 1 commentaire initial ;
- **historique pré-rempli** : les insertions directes ne passent pas par les
  routes, donc `seed-demo.ts` écrit lui-même les événements d'audit
  (`22 CREATION`, `3 CLOTURE`, `2 MOTIF`, `1 COMMENTAIRE`,
  `2 CHANGEMENT_STATUT`, `1 CHANGEMENT_PROGRESSION`). L'écran de détail montre
  ainsi un historique non vide dès la première ouverture.

Aucun nom, e-mail ou identifiant réel n'est utilisé. Aucun compte nominatif
réel n'est créé (D70).

---

## 7. Vérifications effectuées

### 7.1 Qualité automatisée

| Contrôle | Résultat |
|---|---|
| `npm run lint` | propre |
| `npm run typecheck` (shared, server, client, outils) | propre |
| `npm test` | **181 tests** : 150 unitaires + 31 d'intégration, tous verts |
| `vite build` | succès (environ 251 kB JS, 12 kB CSS) |

### 7.2 Recette manuelle de l'API (02/11/2026)

Vérifiés sur le serveur réel : santé, connexion, `/me`, jeton CSRF, liste
(22 tâches), vue du jour (6), détail, commentaires, historique, création
(`201`), progression, statut, clôture avec motif, suppression (`204`), liste des
supprimées (23), détail d'une supprimée (`404`), conflit de version (`409`).

### 7.3 Recette manuelle de l'interface (02/11/2026)

Parcours complet sur `http://localhost:5273` :

1. connexion `admin` → atterrissage « Toutes les tâches » (22 cartes) ;
2. filtres (Retard = 2 tâches) et recherche (« stock » = 1 résultat) ;
3. ouverture d'une tâche en retard : champs, actions, commentaires, historique ;
4. création d'une tâche depuis le formulaire → redirection vers le détail ;
5. ajout d'un commentaire, clôture (`Achevée`, 100 %), suppression ;
6. connexion `demo.consultant` → interface en lecture seule, aucune action
   d'écriture exposée.

---

## 8. Écarts, limites et points à valider

### 8.1 Écarts techniques assumés

1. **Prisma 6.19.3** (déjà acté en Phase A) au lieu de la version 8.0.0-rc.
2. **Port 5273** au lieu de 5173 : décision d'exploitation pour ne pas cohabiter
   avec l'ancien projet, qui tourne sur 5173. Aucun impact fonctionnel.
3. **Historique de démonstration écrit par le seed** : nécessaire parce que les
   insertions SQL directes contournent l'audit ; l'API, elle, journalise
   normalement.
4. **Audit `npm audit --omit=dev`** : 3 alertes hautes provenant de la chaîne
   de développement de Prisma CLI, sans exposition en production ; traitement
   reporté en Phase C/D.

### 8.2 Points à valider par le directeur

| Réf. | Point | Position actuelle |
|---|---|---|
| **P1** | Identité du premier compte `ADMIN` nominatif (nom, prénom, identifiant) | Non fournie ; non bloquant pour la démonstration, **obligatoire avant production** (D70). |
| **P2** | Un `CONSULTANT` doit-il apparaître dans la liste des employés assignables ? | Aujourd'hui oui, alors qu'il est en lecture seule. Règle métier **à trancher**. |
| **P3** | Affichage d'une « Durée E. » négative lors d'une clôture en avance (`0 j / -7 j`) | Convention de signe **à valider** ; le calcul est correct. |
| **P5** | Périmètre exact des endpoints restants de la Phase B | Les 24 routes non encore branchées (comptes, référentiels administrables, exports) restent à planifier. |
| **P11** | Recette E2E Playwright | Chromium non téléchargé ; aucune campagne E2E exécutée à ce jour. |

### 8.3 Contradiction documentaire relevée

`docs/09` (T10-14) indique que l'historique administrateur renvoie les valeurs
avant/après ; `docs/07` (§8.9, D53) précise que l'historique est **réduit** et
que les valeurs sont réservées au journal d'audit. **L'implémentation suit
`docs/07`** (type, auteur, date, champs modifiés). La formulation de `docs/09`
sera alignée à la prochaine révision de ce document, sauf avis contraire.

---

## 9. Prochaines étapes proposées

1. Validation de cette démonstration par le directeur.
2. Alignement de `docs/09` sur `docs/07` §8.9 (historique réduit).
3. Décisions sur P2 et P3 (affichage et périmètre d'assignation).
4. Suite de la Phase B : endpoints des comptes et des référentiels
   administrables, puis écrans correspondants.
5. Phase C : recette E2E Playwright, finition des 9 écrans restants, build de
   production et durcissement du déploiement.

---

## 10. Journal des révisions

| Date | Version | Contenu | Statut |
|---|---|---|---|
| 02/11/2026 | 1.0 | Livraison du socle API et des 5 écrans de démonstration ; base `gd_trading_demo` ; recette manuelle API et interface ; tests automatisés verts. | **En attente de validation du directeur** |
