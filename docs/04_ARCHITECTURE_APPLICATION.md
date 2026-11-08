# Livrable 04 — ÉTAPE 6 : Architecture de l'application

| | |
|---|---|
| **Projet** | Application web de gestion des TODOLIST — GD Trading |
| **Livrable** | 04 (méthode M8) |
| **Étape** | **6 — Architecture de l'application** |
| **Documents de référence** | `docs\01_ANALYSE_FONCTIONNELLE.md` (ÉTAPES 1-2) · `docs\02_EXIGENCES_DIRECTEUR.md` (ÉTAPE 3) · `docs\03_COMPARAISON_EXCEL_EXIGENCES.md` (ÉTAPE 4) |
| **Décisions de référence** | **DÉCISIONS 1 à 26** |
| **Date de rédaction** | 02/11/2026 |
| **Statut** | ✅ **VALIDÉE PAR LE DIRECTEUR le 02/11/2026** — principes, couches, arborescence, modules et décisions **AR-01 à AR-13** validés ; **P7, P8, P9, P10 tranchés le 02/11/2026 (D29 à D32)** ; **P11 et P12** restent ouverts |
| **Étape 5** | ⏸ **Reportée par la DÉCISION 26** — voir section 2 |

> **Règle M2** : ce document propose une architecture technique. Il ne prend **aucune décision métier** nouvelle.
> **Règle M5** : chaque point qui dépend d'une information non fournie est marqué **À VALIDER**.
> **Aucun code n'a été écrit. Aucun dossier `client\`, `server\` ou `prisma\` n'a été créé.**

---

## 1. Objet et périmètre

L'ÉTAPE 6 définit **comment l'application sera construite**, et non **ce qu'elle doit faire** (déjà couvert par les livrables 01 à 03).

| Ce que ce document couvre | Ce qu'il ne couvre pas |
|---|---|
| Les couches logiques et leurs responsabilités | Le modèle de données détaillé → **ÉTAPE 7** |
| L'arborescence du code | Les contrats d'API détaillés → **ÉTAPE 8** |
| Les modules applicatifs | Les écrans et parcours UI → **ÉTAPE 9** |
| Le placement des règles métier | La politique de sécurité complète → **ÉTAPE 13** |
| Le modèle de sécurité (principes) | La procédure de déploiement → **ÉTAPE 14** |
| Le modèle de déploiement (principes) | Les tests détaillés → **ÉTAPE 12** |

**Contraintes structurantes déjà validées** :

- application **interne**, réseau local, serveur local de GD Trading ;
- **quatre rôles** : `ADMIN`, `RESPONSABLE`, `EMPLOYEE`, `CONSULTANT` (D7, D12, D21) ;
- **deux natures de tâche** : quotidienne et « autre » / long terme (RE-02, RE-17, D18, D22) ;
- **statuts** : 4 calculés + 2 manuels prioritaires (D3) ;
- **progression** manuelle avec repli temporel (D4) ;
- **priorité** calculée par la matrice (D14) ;
- **jours ouvrés** avec week-end paramétrable et fériés administrables (D5) ;
- **échéance à 16h30** pour les tâches quotidiennes (D18) ;
- **palette noire / rouge / blanche** uniquement (D23) ;
- **TypeScript + Prisma + PostgreSQL** de bout en bout (D9) ;
- **séparation totale** avec l'ancien projet de gestion de stock (D10).

---

## 2. Décision préalable — report de l'ÉTAPE 5 (D26)

### 2.1 Décision

Le directeur a **validé l'ÉTAPE 4 le 02/11/2026** et demandé de **passer l'ÉTAPE 5 pour l'instant**, afin d'avancer sur l'architecture.

**DÉCISION 26 — Report de l'ÉTAPE 5 (02/11/2026)** :

- l'ÉTAPE 5 (**cahier des charges fonctionnel**) est **reportée**, pas annulée ;
- l'ÉTAPE 6 s'appuie sur les **livrables 01, 02 et 03** comme référence fonctionnelle ;
- le report est **non bloquant pour l'ÉTAPE 6** ;
- l'ÉTAPE 5 devra être réalisée **avant l'ÉTAPE 9** (interface) et **avant l'ÉTAPE 12** (tests et recette), afin de formaliser les parcours, les écrans et les critères d'acceptation.

### 2.2 Ce que le report change — et ce qu'il ne change pas

| Point | Effet du report |
|---|---|
| Règles métier | **Aucun** : elles sont fixées par les DÉCISIONS 1 à 25. |
| Architecture technique | **Aucun** : elle dépend des règles, pas de la forme du document. |
| Parcours utilisateurs | **Moins formalisés** : les écrans seront précisés à l'ÉTAPE 9. |
| Critères d'acceptation | **Moins formalisés** : ils seront précisés à l'ÉTAPE 12. |
| Cas limites | **Plusieurs points restent ouverts** : voir la section 18. |

> **Recommandation** : ne pas repousser l'ÉTAPE 5 au-delà de l'ÉTAPE 8. Sans elle, l'ÉTAPE 9 devra reconstituer les parcours à partir des seules exigences, avec un risque de reprise.

---

## 3. Principes d'architecture

| # | Principe | Conséquence |
|---|---|---|
| **P-01** | **Séparation des responsabilités** | Le client n'accède jamais directement à la base ; le serveur est l'unique point d'entrée. |
| **P-02** | **Règles métier côté serveur** | Le client affiche et valide pour l'ergonomie ; il n'est **jamais** l'autorité. |
| **P-03** | **Moteurs de domaine purs** | Les calculs (statut, progression, priorité, jours ouvrés, durées) sont des fonctions testables sans base ni HTTP. |
| **P-04** | **Données dérivées calculées à la lecture** | Aucun statut périmé en base ; pas de tâche planifiée pour basculer les statuts. |
| **P-05** | **Autorisation centralisée** | Une seule politique d'accès, appliquée à chaque requête, jamais dupliquée dans les contrôleurs. |
| **P-06** | **Même origine** | L'API et l'interface sont servies par le même domaine : pas de CORS, cookie de session protégé. |
| **P-07** | **PostgreSQL, source de vérité unique** | Migrations versionnées ; aucune donnée métier dans des fichiers. |
| **P-08** | **Configuration validée au démarrage** | Une variable manquante ou invalide empêche le démarrage, plutôt que de produire un comportement silencieux. |
| **P-09** | **Simplicité d'exploitation** | Un seul processus applicatif, une seule base ; pas de microservices, pas de file de messages. |
| **P-10** | **Isolation totale de l'ancien projet** | Aucun code, aucune dépendance, aucune base, aucun composant partagé avec `Default Project`. |

---

## 4. Vue d'ensemble

```text
┌────────────────────────────────────────────────────────────────────┐
│  Poste de travail GD Trading — navigateur                          │
│  React + Vite + TypeScript (SPA)                                   │
└───────────────────────────────┬────────────────────────────────────┘
                                │ HTTPS (réseau local)
┌───────────────────────────────▼────────────────────────────────────┐
│  Serveur local GD Trading                                          │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Reverse proxy (IIS ARR ou Nginx) — TLS, fichiers statiques  │  │
│  └──────────────────┬───────────────────────────┬───────────────┘  │
│                     │ /                         │ /api/v1          │
│                     ▼                           ▼                  │
│            build React (`dist`)        Node.js + Express + TS      │
│                                        ├─ middlewares              │
│                                        ├─ services / use cases     │
│                                        ├─ moteurs de domaine       │
│                                        └─ repositories Prisma      │
│                                                   │                │
│                                                   ▼                │
│                                        PostgreSQL (localhost)      │
└────────────────────────────────────────────────────────────────────┘
```

**Variante simplifiée** : si aucun reverse proxy n'est disponible, **Express sert lui-même** le build React et l'API sur le même port. Le reverse proxy reste recommandé pour TLS, la compression et la journalisation d'accès.

> **Conséquence de P-06** : l'interface appelle `/api/v1/...` en **relatif**. Aucune URL d'API codée en dur, aucun CORS.

---

## 5. Architecture logique — les couches

| Couche | Responsabilité | Dépend de | Ne doit jamais |
|---|---|---|---|
| **Présentation** | Écrans React, routage, formulaires, affichage des états, design system | API HTTP | Recalculer le statut, la priorité ou les droits de façon autoritaire |
| **HTTP / API** | Routes REST, contrôleurs, validation d'entrée, sérialisation, codes d'erreur | Application | Contenir une règle métier |
| **Application** | Cas d'usage, orchestration, transactions, contrôle d'accès | Domaine, persistance | Connaître React ou Express |
| **Domaine** | Types métier, moteurs de calcul, politiques pures | Rien | Importer Prisma, Express ou React |
| **Persistance** | Repositories, requêtes Prisma, migrations, seed | PostgreSQL | Décider d'une règle métier |
| **Infrastructure** | Configuration, horloge, fuseau, sessions, journalisation | Bibliothèques techniques | Exposer des détails techniques au domaine |

**Règle de dépendance** : `Présentation → HTTP → Application → Domaine`. La persistance **implémente** des interfaces utilisées par l'application ; le domaine ne dépend de personne.

---

## 6. Arborescence proposée

> **Proposition** : aucun dossier n'est créé avant la **validation de l'ÉTAPE 6** (obtenue le 02/11/2026) ; les dossiers applicatifs seront créés après la **validation de l'ÉTAPE 7** et de son modèle de données.

```text
GD Trading - TodoList\
├─ package.json                    workspaces npm : shared, client, server
├─ .env.example                    variables attendues, sans secret
├─ README.md
├─ docs\
├─ sources\
│
├─ shared\                         contrats partagés, sans Prisma ni React
│  └─ src\
│     ├─ enums.ts                  rôles, types, statuts, urgences, importances
│     ├─ dto\                      types de requêtes et de réponses
│     └─ schemas\                  schémas Zod partagés client / serveur
│
├─ client\                         React + Vite + TypeScript
│  └─ src\
│     ├─ app\                      bootstrap, routeur, providers
│     ├─ features\
│     │  ├─ auth\
│     │  ├─ tasks\
│     │  ├─ employees\
│     │  ├─ partners\
│     │  ├─ departments\
│     │  ├─ holidays\
│     │  ├─ accounts\
│     │  └─ dashboard\
│     ├─ components\               design system (boutons, champs, badges, icônes)
│     ├─ lib\                      client API, React Query, formatage des dates
│     └─ styles\                   jetons de couleur noir / rouge / blanc
│
├─ server\                         Node.js + Express + TypeScript
│  ├─ prisma\
│  │  ├─ schema.prisma
│  │  ├─ migrations\
│  │  └─ seed.ts                   référentiels initiaux, aucun nom d'acteur Excel
│  └─ src\
│     ├─ config\                   validation des variables d'environnement
│     ├─ http\
│     │  ├─ app.ts
│     │  ├─ server.ts
│     │  ├─ routes\
│     │  └─ middlewares\           session, autorisation, validation, erreurs
│     ├─ modules\
│     │  ├─ auth\
│     │  ├─ accounts\
│     │  ├─ employees\
│     │  ├─ partners\
│     │  ├─ departments\
│     │  ├─ holidays\
│     │  ├─ tasks\
│     │  ├─ dashboard\
│     │  └─ audit\
│     ├─ domain\
│     │  ├─ task-status.ts
│     │  ├─ task-progress.ts
│     │  ├─ priority.ts
│     │  ├─ working-days.ts
│     │  ├─ durations.ts
│     │  └─ authorization\
│     ├─ repositories\
│     ├─ lib\                      horloge, erreurs, journalisation, dates
│     └─ tests\
│
└─ prisma\                         (facultatif : schéma à la racine si souhaité)
```

**Règles d'organisation** :

- `shared\` ne contient **que** des types, énumérations et schémas purs — **aucun** import Prisma, React ou Express ;
- `client\` ne contient **aucune** règle de calcul métier autoritaire ;
- `server\src\domain\` ne contient **aucun** import de base de données ;
- un module (`tasks`, `employees`…) regroupe **routes, contrôleur, service, repository** de son domaine ;
- aucun fichier de `Default Project` n'est copié ou référencé.

---

## 7. Les modules applicatifs

| Module | Responsabilité | Règles de référence |
|---|---|---|
| **Auth** | Connexion, déconnexion, session, changement de mot de passe | D7, D12 |
| **Comptes** | Création, rôle, activation / désactivation, lien avec l'employé | D7, D12, D21 |
| **Employés** | Référentiel, actif / inactif, département optionnel, suppression interdite si référencé | R3, Q1, Q4, D8 |
| **Partenaires** | Référentiel distinct des fournisseurs | R4, Q3 |
| **Départements** | Référentiel administrable, au plus un responsable | Q1, A12 |
| **Jours fériés / paramètres** | Fériés administrables, week-end, fuseau, heure limite | D5, D18 |
| **Tâches** | Création, consultation, modification, suppression, duplication, affectation | D3, D4, D7, D13, D14, D15, D17, D18, D22, D24, D25 |
| **Commentaires / motif** | Commentaire libre, motif obligatoire à la clôture tardive | D3, D15 |
| **Tableau de bord** | Vues « mes tâches du jour », « mon service », « tous les services » | RE-04, RE-05, RE-14 |
| **Audit** | Historique des modifications et des connexions | D7, D17 *(proposition)* |
| **Santé** | `GET /api/health` : processus et base | Exploitation |

---

## 8. Les moteurs de domaine

> Tous les moteurs sont des **fonctions pures** : ils reçoivent leurs données et leur horloge, et retournent un résultat. Ils ne lisent ni la base ni la requête HTTP. C'est ce qui les rend testables à l'ÉTAPE 12.

### 8.1 Moteur de statut

**Entrées** : statut manuel, type de tâche, `dateAction`, `dateDebut`, `dateFinPrevue`, `dateFin`, heure d'échéance, date et heure courantes, fuseau.

**Ordre de test — impératif** :

```text
1. statut manuel = "Annulée"                    → Annulée
2. statut manuel = "Suspendue"                  → Suspendue
3. dateFin renseignée                           → Achevée
4. dateAction vide ou dateAction > aujourd'hui  → A faire
5. échéance dépassée                            → Retard
6. sinon                                        → En cours
```

**Différence selon le type** :

| Type | Échéance |
|---|---|
| **Quotidienne** | Le jour de `dateAction` (ou `dateFinPrevue`) à **16h30** |
| **Autre / long terme** | La **date** `dateFinPrevue`, sans heure ; le retard commence le lendemain |

**Règles de robustesse** :

- `dateFin` renseignée **avant** l'échéance → `Achevée`, même si la tâche est en avance ;
- statut manuel **prioritaire** sur toutes les dates (D3) ;
- une tâche quotidienne créée **après 16h30** ou un **jour non ouvré** est **refusée** avec un message explicite (**P10 → D32**) ;
- le calcul ne **persiste** rien : il est refait à chaque lecture (P-04).

### 8.2 Moteur de progression

**Entrées** : progression manuelle, `dateAction`, `dateDebut`, `dateFinPrevue`, `dateFin`, date courante.

```text
1. progression manuelle renseignée → valeur bornée 0-100
2. dateFin renseignée             → 100
3. dateDebut ou dateFinPrevue absente, ou intervalle invalide → null ("—")
4. référence = dateAction, sinon aujourd'hui
5. référence < dateDebut          → 0
6. référence > dateFinPrevue      → 100 (le retard est porté par le statut)
7. sinon                          → arrondi de (référence − dateDebut) / (dateFinPrevue − dateDebut) × 100
```

> **Point de vigilance** : l'Excel renvoyait le texte `"En retard"` au-delà de l'échéance. La DÉCISION 4 sort ce texte de la colonne ; la valeur numérique est donc **plafonnée à 100**. Le statut `Retard` porte l'information. *(Proposition technique.)*

### 8.3 Moteur de priorité

**Entrées** : urgence, importance.

**Sorties** : libellé, score, fréquence de relance.

- la matrice reprend les **13 combinaisons** de `BD!Table31` (D14) ;
- le libellé est la concaténation `Urgence & " & " & Importance` ;
- le score et la fréquence sont ceux de la matrice ;
- `ACTION A PRENDRE` reste **saisie par l'admin** (D14) ; la matrice peut seulement **proposer** une valeur quand elle existe.

> **Point tranché (P9 → D31)** : les 13 lignes ne couvrent pas les **16 combinaisons** urgence × importance. Trois combinaisons sont absentes (`Pas urgent` avec `Critique`, `Elevée` ou `Modérée`) : elles sont **refusées** à la saisie avec un message explicite.

### 8.4 Moteur de jours ouvrés

**Entrées** : date de départ, nombre de jours, week-end paramétré, ensemble des fériés.

**Sorties** : date en jours ouvrés.

- week-end par défaut : **vendredi + samedi** (D5) ;
- fériés lus dans la table administrable, jamais dans un fichier externe ;
- le calcul reproduit `WORKDAY.INTL` de l'Excel ;
- aucune dépendance à une librairie de jours ouvrés non maîtrisée : la fonction est **écrite et testée** dans le projet.

### 8.5 Moteur de date de rappel

**Entrées** : fréquence issue de la priorité, `dateAction`, `dateDebut`, `dateFin`, fériés, week-end, date courante.

```text
si dateAction vide ou dateFin renseignée → aucune date de rappel
base = (dateDebut + fréquence > aujourd'hui) ? dateDebut : dateAction
dateRappel = ajouterJoursOuvres(base, fréquence, week-end, fériés)
```

> Le test `dateDebut + fréquence > aujourd'hui` se fait en **jours calendaires**, comme dans la formule Excel ; seule la date résultat est calculée en **jours ouvrés**. Cette subtilité est reproduite à l'identique.

### 8.6 Moteur des durées

| Calcul | Règle | Sortie si donnée manquante |
|---|---|---|
| `DUREE G.` | `(dateFin ?? aujourd'hui) − dateDebut` | `null` |
| `DUREE E.` | `dateFin − dateFinPrevue` | `null` |
| Cas d'erreur | `min(dateFin, dateFinPrevue) < dateDebut` | `ERREUR` |

> Les **sigles** `G` et `E` restent à expliciter (**P1**, A8). Les calculs sont reproduits, les libellés d'écran ne sont pas figés.

---

## 9. Flux d'une requête

### 9.1 Lecture d'une liste de tâches

```text
1. Le navigateur appelle GET /api/v1/tasks?vue=mes-taches&statut=Retard
2. Middleware de session      → utilisateur, employé, département
3. Middleware d'autorisation  → construit le périmètre autorisé
4. Service de tâches          → interroge le repository avec ce périmètre
5. Repository Prisma          → tâches + pilote + exécutant + département
6. Moteurs de domaine         → statut, progression, rappel, durées
7. Service                    → filtre, trie, pagine
8. Contrôleur                 → DTO de réponse (aucun champ sensible)
9. React Query                → met en cache et affiche
```

**Périmètre de lecture** (D7, A13) :

| Rôle | Tâches visibles |
|---|---|
| `ADMIN` | Toutes |
| `CONSULTANT` | Toutes, en lecture seule |
| `RESPONSABLE` | Son service **+** ses propres tâches (assignées, pilotées, créées) |
| `EMPLOYEE` | Ses propres tâches (assignées, pilotées, créées) |

> **Point tranché (P7 → D29)** : le service porteur est le **département de l'exécutant**, à défaut celui du pilote. La règle est appliquée dans un moteur de domaine pur, calculée à chaque lecture.

### 9.2 Écriture d'une tâche

```text
1. Requête POST /api/v1/tasks
2. Validation Zod du corps
3. Autorisation : peut-on créer pour ce titulaire ?
4. Transaction Prisma :
   ├─ insertion de la tâche
   ├─ calcul et stockage des champs déterministes (priorité, score, fréquence)
   ├─ insertion dans le journal d'audit
   └─ commit
5. Réponse : tâche complète, champs dérivés calculés
6. React Query : invalidation des listes concernées
```

**Règles d'écriture** :

- l'employé ne crée que pour **lui-même** (D13) ;
- le responsable crée pour **son service** et pour **lui-même** (D13, D25) ;
- l'admin crée pour **tout le monde** (D13) ;
- aucune validation préalable n'est requise (D24) ;
- une clôture tardive **exige** `motifNonAchevement` (D15) — contrôle **serveur**, pas seulement client.

---

## 10. Sécurité — principes

| Sujet | Proposition | Référence |
|---|---|---|
| **Authentification** | Session opaque, cookie `HttpOnly` + `Secure` + `SameSite=Strict` | D7, D12 |
| **Stockage de session** | Table PostgreSQL, révocation immédiate à la désactivation d'un compte | D12 |
| **Mots de passe** | **Argon2id**, mot de passe temporaire, changement forcé à la première connexion | ÉTAPE 13 |
| **Autorisation** | Politique centralisée : `canView`, `canCreate`, `canEdit`, `canDelete`, `canManageReferentials`, `canManageAccounts` | D7 |
| **CSRF** | Jeton anti-CSRF sur toute requête d'écriture, en plus de `SameSite` | ÉTAPE 13 |
| **Validation** | Zod à chaque frontière ; rejet des champs inconnus | — |
| **Injection SQL** | Prisma, requêtes paramétrées, aucune concaténation SQL | — |
| **En-têtes** | Helmet, politique de contenu adaptée à une SPA | ÉTAPE 13 |
| **Limitation** | Limitation des tentatives de connexion | ÉTAPE 13 |
| **Journal** | Journal d'audit append-only : qui, quoi, quand, avant / après | D7, D17 |
| **Données sensibles** | Aucun mot de passe, hash ou jeton dans les DTO ni dans les logs | — |
| **Consultant** | Lecture seule **vérifiée côté serveur**, pas seulement masquée dans l'interface | D21 |

> **Principe** : l'interface peut **cacher** un bouton, mais le serveur doit **refuser** l'action. Aucun contrôle d'accès ne repose sur le client.

---

## 11. API — principes

| Sujet | Choix proposé |
|---|---|
| Style | **REST**, JSON, préfixe `/api/v1` |
| Authentification | Cookie de session (pas de jeton dans `localStorage`) |
| Erreurs | Format **problem+json** : code stable, message lisible, détails de validation |
| Pagination | `page` / `taille` (50 par défaut), total et nombre de pages |
| Tri | Liste blanche de champs, ordre `asc` / `desc` |
| Filtres | Statut, type, service, assigné, pilote, échéance, priorité |
| Validation | Schémas Zod partagés avec le client |
| Idempotence | Non requise pour ce volume |
| Documentation | Contrats décrits à l'ÉTAPE 8 ; OpenAPI optionnel |

**Familles d'endpoints prévues** (détail à l'ÉTAPE 8) :

```text
/api/v1/auth/*            connexion, déconnexion, session, mot de passe
/api/v1/me                profil et droits de l'utilisateur connecté
/api/v1/tasks             liste, création, détail, modification, suppression
/api/v1/tasks/:id/...     statut, progression, commentaires, duplication
/api/v1/employees         référentiel
/api/v1/partners          référentiel
/api/v1/departments       référentiel
/api/v1/holidays          calendrier
/api/v1/settings          week-end, fuseau, heure limite
/api/v1/accounts          comptes et rôles
/api/v1/dashboard         indicateurs et vues
/api/v1/health            santé
```

---

## 12. Interface — principes

| Sujet | Choix proposé |
|---|---|
| Framework | **React + Vite + TypeScript** (D9) |
| Routage | React Router |
| État serveur | **TanStack Query** (cache, invalidation, rechargement) |
| État local | React uniquement ; pas de Redux |
| Formulaires | React Hook Form + Zod |
| Styles | CSS Modules + **jetons de couleur** `noir`, `rouge`, `blanc` |
| Composants | Design system interne ; primitives accessibles (Radix UI) si nécessaire |
| Icônes | Bibliothèque d'icônes monochromes ; **aucune couleur supplémentaire** |
| Accessibilité | Contraste contrôlé, navigation clavier, libellés explicites |
| Dates | Format français `JJ/MM/AAAA`, fuseau d'affichage configuré |

**Conséquence de D23** : les statuts ne peuvent pas être distingués par le vert, l'orange ou le bleu. Chaque statut combine :

1. un **libellé** explicite ;
2. une **icône** propre ;
3. le **rouge** réservé au retard et aux alertes.

> Les maquettes et parcours détaillés relèvent de l'**ÉTAPE 9**. L'ÉTAPE 6 fixe seulement les contraintes techniques.

---

## 13. Persistance — principes

| Sujet | Proposition |
|---|---|
| SGBD | **PostgreSQL 16+** (D9) |
| Accès | **Prisma** uniquement ; aucun SQL brut dans les contrôleurs |
| Migrations | Versionnées, appliquées par `prisma migrate` |
| Identifiants | UUID |
| Dates métier | Type `DATE` (pas d'horodatage UTC pour une échéance calendaire) |
| Heure limite | Type `TIME` (16h30) pour les tâches quotidiennes |
| Horodatages techniques | `TIMESTAMPTZ` pour création, modification, audit |
| Suppression | Employés **jamais** supprimés s'ils sont référencés (R3, Q4) ; tâches supprimables selon D7, avec trace d'audit |
| Index | `assigneId`, `employeId`, `creeParId`, `attribueParId`, `dateFin`, `dateFinPrevue`, `departementId`, `statutManuel` |
| Transactions | Toute écriture multi-tables (tâche + audit) dans une transaction |
| Données de démonstration | Aucune donnée Excel reprise (D11) ; seed limité aux référentiels |

**Champs dérivés** : `priorite`, `score` et `frequence` sont **déterministes** à partir de l'urgence et de l'importance ; ils peuvent être stockés pour le tri et recalculés à chaque modification. `statut`, `progression`, `dateRappel`, `dureeG` et `dureeE` sont **calculés à la lecture** (P-04).

> Le schéma détaillé, les contraintes d'unicité et les relations exactes sont livrés à l'**ÉTAPE 7**.

---

## 14. Modèle de déploiement

### 14.1 Topologie cible

```text
Postes GD Trading ── HTTPS ──► Serveur local
                               ├─ Reverse proxy (TLS)
                               ├─ Node.js (service)
                               └─ PostgreSQL (service)
```

### 14.2 Deux variantes

| Variante | Quand la choisir | Composants |
|---|---|---|
| **A — Windows natif** | Le serveur local est sous Windows (hypothèse la plus probable) | PostgreSQL Windows, Node via **NSSM**, IIS + ARR ou Nginx, certificat interne |
| **B — Linux / Docker** | Le serveur local est sous Linux ou Docker est maîtrisé | PostgreSQL, Node, Nginx, `docker compose` |

> **Point à trancher (P11)** : système d'exploitation du serveur, présence d'IIS, politique de certificat, nom DNS interne.

### 14.3 Exigences d'exploitation

- **PostgreSQL disponible** — point de vigilance de la DÉCISION 9, à vérifier **avant l'ÉTAPE 7** ;
- sauvegarde **quotidienne** (`pg_dump`), conservation 30 jours, copie hors machine ;
- test de **restauration** documenté ;
- service Node relancé automatiquement en cas d'arrêt ;
- journaux applicatifs avec rotation ;
- `GET /api/health` pour la supervision ;
- migrations appliquées **après** sauvegarde ;
- secrets dans `.env`, permissions restreintes, jamais dans le dépôt ;
- fuseau horaire du serveur **identique** à celui de l'application ;
- accès limité au réseau local, aucune exposition Internet.

---

## 15. Tests et qualité

| Niveau | Outil proposé | Cible |
|---|---|---|
| **Unitaire** | Vitest | Moteurs de statut, progression, priorité, jours ouvrés, durées, politiques d'accès |
| **Intégration** | Vitest + Supertest + base de test | API, transactions, périmètre par rôle, clôture tardive, duplication |
| **Bout en bout** | Playwright | Connexion, tâche du jour, clôture, motif, responsable, admin |
| **Statique** | TypeScript `strict`, ESLint, Prettier | Tout le code |
| **Base de test** | Base PostgreSQL dédiée, réinitialisée par transaction | Aucune donnée de production |

**Règles critiques à couvrir à 100 %** :

1. ordre de test du statut (D3) ;
2. échéance 16h30 des tâches quotidiennes (D18) ;
3. motif obligatoire à la clôture tardive (D15) ;
4. périmètre de visibilité et de suppression (D7) ;
5. calcul des jours ouvrés et des fériés (D5) ;
6. duplication sans génération automatique (D22).

---

## 16. Risques et parades

| # | Risque | Impact | Parade |
|---|---|---|---|
| 1 | **ÉTAPE 5 reportée** | Parcours et critères d'acceptation moins formalisés | ✅ **Levé** : ÉTAPE 5 livrée et validée le 02/11/2026 |
| 2 | **Périmètre de service ambigu (P7)** | Un responsable voit trop ou pas assez | ✅ **Levé (D29)** : département de l'exécutant, à défaut du pilote ; politique centralisée |
| 3 | **Fuseau horaire (P8)** | Échéance 16h30 fausse | ✅ **Levé (D30)** : `Africa/Algiers`, paramètre unique `APP_TIMEZONE` |
| 4 | **Combinaisons absentes de la matrice (P9)** | Priorité incohérente | ✅ **Levé (D31)** : combinaisons absentes refusées à la saisie |
| 5 | **PostgreSQL indisponible** | Blocage de l'ÉTAPE 7 | Vérifier l'installation dès maintenant (D9) |
| 6 | **Serveur non qualifié (P11)** | Déploiement retardé | Inventaire OS / IIS / TLS avant l'ÉTAPE 14 |
| 7 | **Volume de tâches élevé** | Listes lentes | Index, pagination, calcul en mémoire avec seuil documenté |
| 8 | **Contournement des droits** | Faille de confidentialité | Autorisation serveur, tests d'intégration par rôle |
| 9 | **Élargissement du périmètre** | Dérive | Toute nouvelle fonctionnalité passe par une décision datée |

---

## 17. Décisions d'architecture proposées

> Ces décisions sont **techniques**. Elles sont soumises à validation avec l'ÉTAPE 6 ; aucune n'est appliquée avant accord.

| ID | Décision proposée | Alternatives écartées | Justification |
|---|---|---|---|
| **AR-01** | Monorepo npm workspaces : `shared`, `client`, `server` | Deux dépôts séparés | Types et schémas partagés, un seul versionnement |
| **AR-02** | Même origine : Express sert l'API et le build React | API sur un sous-domaine séparé | Pas de CORS, cookie de session simplifié |
| **AR-03** | Session serveur en base + cookie `HttpOnly` | JWT dans `localStorage` | Révocation immédiate, pas de jeton exposé au JavaScript |
| **AR-04** | Moteurs de domaine purs, sans Prisma ni Express | Règles dans les contrôleurs | Testabilité, une seule source de vérité |
| **AR-05** | Champs dérivés calculés à la lecture | Colonne `statut` mise à jour par tâche planifiée | Toujours exact, pas de job à maintenir |
| **AR-06** | Dates métier en `DATE`, heure limite en `TIME` | Tout stocker en `TIMESTAMPTZ` | Une échéance est une date calendaire, pas un instant |
| **AR-07** | Autorisation centralisée par politiques | Contrôles dispersés par route | Cohérence, auditabilité |
| **AR-08** | Prisma + repositories | SQL brut | Typage, migrations, sécurité des requêtes |
| **AR-09** | Validation Zod aux frontières, schémas partagés | Validation uniquement côté client | Le serveur reste l'autorité |
| **AR-10** | Journal d'audit append-only | Aucun historique | Traçabilité du contrôle (D7, D17) |
| **AR-11** | Déploiement natif derrière un reverse proxy | Docker par défaut | Simplicité sur un serveur local unique |
| **AR-12** | Journalisation structurée + `GET /api/health` | Journalisation fichier non structurée | Diagnostic et supervision |
| **AR-13** | Pyramide de tests unitaires / intégration / E2E | Tests manuels uniquement | Sécurise les règles critiques |

---

## 18. Points tranchés et points ouverts

> Ces points ne bloquaient pas la **validation de l'architecture**. Les points **P7 à P10** ont été **tranchés le 02/11/2026** (DÉCISIONS 29 à 32) ; **P11 et P12** restent ouverts et ne bloquent pas l'ÉTAPE 7.

### P7 — Quel service porte une tâche ? — ✅ **tranché (D29, option A)**

La DÉCISION 7 limite le responsable à « son service ». Une tâche possède un **pilote** (`employeId`) et un **exécutant** (`assigneId`), chacun pouvant avoir un département.

| Option | Règle | Effet |
|---|---|---|
| **A** ✅ **retenue** | La tâche appartient au département de l'**exécutant** ; à défaut, celui du **pilote** | Cohérent avec RE-14 (« les employés de son service ») |
| **B** | La tâche appartient au département du **pilote** | Plus proche de l'ancien `STRUCTURE` |
| **C** | Champ `departementId` explicite sur la tâche, choisi à la création | Plus souple, mais nouvelle règle métier |

> **Conséquence** : la valeur est **calculée à chaque lecture**, jamais stockée. La visibilité du responsable, les filtres, les droits de modification et les tests d'intégration en découlent directement.

### P8 — Quel fuseau horaire ? — ✅ **tranché (D30, option A)**

**`Africa/Algiers` (UTC+1)** est le fuseau unique de l'application, porté par le paramètre `APP_TIMEZONE`.

- impact : calcul du statut à 16h30, affichage des dates, tests aux changements d'heure ;
- aucune autre valeur n'est admise sans nouvelle décision.

### P9 — Les trois combinaisons absentes de la matrice — ✅ **tranché (D31, option A)**

La matrice `BD!Table31` contient **13 lignes** pour **16 combinaisons** urgence × importance. Trois combinaisons `Pas urgent` + `Critique` / `Elevée` / `Modérée` n'existent pas.

| Option | Règle |
|---|---|
| **A** ✅ **retenue** | Seules les 13 combinaisons sont sélectionnables ; les trois autres sont refusées avec un message explicite |
| **B** | Le directeur complète la matrice avec les trois lignes manquantes (score, fréquence) |
| **C** | Les trois combinaisons sont acceptées avec la fréquence par défaut de l'Excel (7 jours) et sans score |

### P10 — Tâche quotidienne créée après 16h30 ou un jour non ouvré — ✅ **tranché (D32, option A)**

La DÉCISION 18 fixe l'échéance à 16h30, sans dire ce qui se passe si la tâche est créée **après** cette heure, ou un **vendredi / samedi / jour férié**.

| Option | Règle |
|---|---|
| **A** ✅ **retenue** | La tâche est refusée avec un message : une tâche quotidienne se crée avant 16h30, un jour ouvré |
| **B** | La tâche est reportée au **prochain jour ouvré** |
| **C** | La tâche est créée pour le jour même et passe immédiatement en `Retard` |

### P11 — Environnement serveur — ❓ **ouvert**

À qualifier avant l'ÉTAPE 14 : système d'exploitation, présence d'IIS, certificat TLS, nom DNS interne, politique de sauvegarde.

### P12 — Session et mots de passe — ❓ **ouvert**

À fixer à l'ÉTAPE 13 : durée de session, complexité des mots de passe, procédure de première connexion, verrouillage après échecs.

### Points restants du livrable 03

> **P1** (signification de `DUREE G./E.`), **P2** (fériés 2027-2028), **P3** (liste des consultants) et **P5** (sémantique de `FREQUENCE`) restent ouverts et **non bloquants**.
> **P4** (dates d'une tâche quotidienne) est **tranché** par la **DÉCISION 28** : journée unique, `dateAction` = `dateDebut`, aucune `dateFinPrevue`.
> **P6** (longueur du libellé) est **tranché** par la **DÉCISION 46** : 255 caractères (libellé) et 2 000 (commentaire). **P16** (pilote partenaire désigné par un non-admin) est **tranché** par la **DÉCISION 47** : partenaire interdit aux non-admins.

---

## 19. Ce que l'ÉTAPE 6 ne fait pas

- Elle **ne crée aucun fichier de code** ni aucun dossier applicatif.
- Elle **ne définit pas** les tables, colonnes, clés et index → **ÉTAPE 7**.
- Elle **ne définit pas** les endpoints, codes HTTP et DTO détaillés → **ÉTAPE 8**.
- Elle **ne dessine pas** les écrans ni les parcours → **ÉTAPE 9**.
- Elle **ne rédige pas** la politique de sécurité complète → **ÉTAPE 13**.
- Elle **ne rédige pas** la procédure de déploiement → **ÉTAPE 14**.
- Elle **ne remplace pas** l'ÉTAPE 5, désormais livrée dans `docs\05_CAHIER_DES_CHARGES_FONCTIONNEL.md` : parcours, écrans et critères d'acceptation y sont formalisés.

---

## 20. Validation demandée

**Validation demandée** : confirmez que :

1. les **principes** (P-01 à P-10) et les **couches** correspondent à l'application attendue ;
2. l'**arborescence** et le découpage en **modules** sont acceptables ;
3. le placement des **règles métier** dans des moteurs purs est retenu ;
4. le modèle de **sécurité** (session serveur, autorisation centralisée, audit) est retenu ;
5. le modèle de **déploiement** (variante A ou B) peut être étudié ;
6. les **décisions AR-01 à AR-13** sont validées ou corrigées ;
7. les points **P7 à P12** sont les seuls points techniques résiduels.

> **Tant que cette validation n'est pas donnée, l'ÉTAPE 7 (modèle de données) n'est pas engagée** (règle M1).
> **L'ÉTAPE 5 est désormais livrée** dans `docs\05_CAHIER_DES_CHARGES_FONCTIONNEL.md` (reprise par la **DÉCISION 27**), après validation de l'ÉTAPE 6 et avant l'ÉTAPE 7.

> ✅ **Validation obtenue le 02/11/2026** : les principes **P-01 à P-10**, les couches, l'arborescence, les modules, le placement des règles métier, le modèle de sécurité, le modèle de déploiement et les décisions **AR-01 à AR-13** sont validés.
> ⚠️ **Les points P7 à P12 n'ont pas été tranchés le 02/11/2026 lors de la validation de l'architecture.** Depuis, **P7, P8, P9 et P10 ont été tranchés** (DÉCISIONS 29 à 32) et la tension **C12** a été tranchée (DÉCISION 33, livrable 05). **P11 et P12 restent ouverts** et ne bloquent pas l'ÉTAPE 7.

---

## 21. Journal des révisions

| Date | Section(s) | Modification | Statut |
|---|---|---|---|
| 02/11/2026 | §16, §18, en-tête | **P7, P8, P9, P10 tranchés** (DÉCISIONS 29 à 32) ; risques 1 à 4 levés ; options retenues consignées ; **P11 et P12 restent ouverts**. | ✅ **Mis à jour le 02/11/2026** |
| 02/11/2026 | Document entier | **VALIDATION DU DIRECTEUR** : principes **P-01 à P-10**, couches, arborescence, modules, moteurs de domaine, sécurité, déploiement et **AR-01 à AR-13** validés. Les points **P7 à P12** restent ouverts. | ✅ **Validée le 02/11/2026** |
| 02/11/2026 | Document entier | Création du livrable 04 (ÉTAPE 6) : architecture logique, arborescence, modules, moteurs de domaine, flux, sécurité, API, interface, persistance, déploiement, tests, risques, décisions **AR-01 à AR-13**, points **P7 à P12**. Prise en compte du report de l'ÉTAPE 5 (**D26**). | ⏳ **En attente de validation** |
