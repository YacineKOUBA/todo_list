# Livrable 06 — ÉTAPE 7 : Modèle de données PostgreSQL

| | |
|---|---|
| **Projet** | Application web de gestion des TODOLIST — GD Trading |
| **Livrable** | 06 (méthode M8) |
| **Étape** | **7 — Modèle de données PostgreSQL** |
| **Documents de référence** | `docs\01_ANALYSE_FONCTIONNELLE.md` (ÉTAPES 1-2) · `docs\02_EXIGENCES_DIRECTEUR.md` (ÉTAPE 3) · `docs\03_COMPARAISON_EXCEL_EXIGENCES.md` (ÉTAPE 4) · `docs\05_CAHIER_DES_CHARGES_FONCTIONNEL.md` (ÉTAPE 5) · `docs\04_ARCHITECTURE_APPLICATION.md` (ÉTAPE 6) |
| **Décisions de référence** | **DÉCISIONS 1 à 43** · **AR-01 à AR-13** |
| **SGBD cible** | **PostgreSQL** (version 15 ou supérieure) — disponibilité à confirmer avant l'ÉTAPE 8 |
| **ORM prévu** | **Prisma** (D9) — aucune migration n'est créée à ce stade |
| **Date de rédaction** | 02/11/2026 |
| **Statut** | ✅ **VALIDÉE PAR LE DIRECTEUR le 02/11/2026** — modèle validé en l'état ; points **M7-01 à M7-09** et **P17** tranchés le 02/11/2026 (**DÉCISIONS 34 à 43**) ; aucun code, aucune migration, aucune base créés |

> **Règle M2** : ce document **traduit** les règles validées en tables, colonnes, contraintes et index. Il ne prend **aucune décision métier** nouvelle.
> **Règle M5** : tout point qui exige un arbitrage est marqué **À VALIDER** et numéroté **M7-xx** ou **Pxx**.
> **Aucun code n'a été écrit. Aucun dossier `client\`, `server\`, `prisma\` n'a été créé. Aucune base n'a été initialisée.**

---

## 1. Objet et périmètre

### 1.1 Objet

Ce document définit le **modèle de données relationnel** de l'application :

- les **tables**, leurs **colonnes**, leurs **types** et leurs **nullités** ;
- les **clés primaires**, **clés étrangères** et **contraintes d'intégrité** ;
- les **index** nécessaires aux lectures prévues ;
- les **règles de suppression** et de **désactivation** ;
- le **journal d'audit** et les **paramètres** applicatifs ;
- les **données initiales** (référentiels et matrice) ;
- la **stratégie de migration**.

### 1.2 Ce que ce document ne fait pas

| Non couvert | Étape |
|---|---|
| Endpoints, DTO, codes HTTP, validation d'entrée détaillée | ÉTAPE 8 |
| Maquettes, composants, navigation | ÉTAPE 9 |
| Contrôles d'accès détaillés par opération | ÉTAPE 10 (matrice déjà fixée par D7) |
| Politique de mots de passe, sessions, verrouillage | ÉTAPE 13 |
| Procédure d'installation, sauvegarde, restauration | ÉTAPE 14 |
| Manuel utilisateur et administration | ÉTAPE 15 |
| Requêtes SQL, code Prisma, fichiers de migration | **Après validation de cette étape** |

### 1.3 Ce qui n'est pas repris de l'Excel

**DÉCISION 11 (option B)** : **aucune des 95 actions** n'est reprise. La table `tache` est créée **vide**.
Les **référentiels** (départements, éléments, urgences, importances, matrice, jours fériés) sont, eux, **recréés** — ils ne contiennent aucune donnée nominative et sont nécessaires au fonctionnement.

### 1.4 Décisions rendues le 02/11/2026

Le directeur a validé le présent modèle et tranché les **dix points** de la section 16.

| # | Point | Décision retenue |
|---|---|---|
| **D34** | **M7-01** — service porteur | **Calculé à chaque lecture** ; aucune colonne. Confirme **D29** et **AR-05**. |
| **D35** | **M7-02** — un responsable par service | **Contrôle applicatif transactionnel** (`SERIALIZABLE`), sans dénormalisation. |
| **D36** | **M7-03** — suppression d'une tâche | **Logique** (`supprime_le`, `supprime_par_id`) ; aucune suppression physique par l'interface. |
| **D37** | **M7-04** — commentaires | **Table `commentaire` historisée**, append-only. |
| **D38** | **M7-05** — clôture | **`date_fin`** (date métier) **+ `cloture_le`** (horodatage réel), nécessaire à la règle 16h30. |
| **D39** | **M7-06** — consultant sans fiche employé | **`utilisateur.employe_id` nullable**, avec unicité partielle quand renseigné. |
| **D40** | **M7-07** — départements initiaux | **Insertion des 9 départements observés** au démarrage ; aucune donnée nominative reprise. |
| **D41** | **M7-08** — doublon de libellé | **Avertissement applicatif**, aucune contrainte d'unicité. |
| **D42** | **M7-09** — journal d'audit | **Aucune purge** ; conservation sans limite décidée. |
| **D43** | **P17** — progression d'une quotidienne | **Option A** : **0 %** tant que la tâche n'est pas clôturée, **100 %** après clôture ; aucun calcul intra-journalier. |

**Effet** : aucun point du modèle ne reste ouvert. Les points **P6, P13 et P15** ont été **clos le 02/11/2026** par les **DÉCISIONS 46, 45 et 48** (validation de l'ÉTAPE 8).

---

## 2. Conventions de modélisation

| Sujet | Convention retenue | Justification |
|---|---|---|
| **Langue** | Tables et colonnes en **français**, `snake_case` ; modèles Prisma en `PascalCase` | Cohérence avec le vocabulaire métier validé |
| **Identifiants** | `uuid` généré par la base (`gen_random_uuid()`) pour toutes les entités métier | Identifiants non devinables, exposition sûre dans les URL, fusion/export sans collision |
| **Journal d'audit** | `bigserial` | Volume élevé, aucune exposition externe |
| **Dates métier** | type `date` (sans heure), **fuseau `Africa/Algiers`** (D30) | Une échéance est une date calendaire, pas un instant |
| **Horodatages techniques** | type `timestamptz`, toujours en UTC côté base | Création, modification, clôture, audit |
| **Heures de journée** | paramètres (`time`) : 08:00, 12:00, 13:00, 16:30 | D18, EF-22 |
| **Booléens** | `boolean NOT NULL DEFAULT` | Jamais de `NULL` ambigu |
| **Textes** | `text` avec contrainte `length(btrim(x)) > 0` pour les libellés obligatoires | Les bornes de longueur (**D46** : libellé 255, commentaire 2 000) sont contrôlées par l'API ; la base garde `text` pour rester indépendante de l'interface |
| **Suppression** | **logique** pour les entités historisées, **désactivation** pour les référentiels, **refus** pour les entités référencées | Voir section 10 |
| **Nommage des contraintes** | `pk_`, `fk_`, `uq_`, `ck_`, `ix_` + table + colonnes | Lisibilité des erreurs de migration |
| **Calculs** | statut, progression, priorité, score, fréquence, rappel, durées et service porteur **ne sont jamais stockés** | **AR-05** : recalcul à chaque lecture |
| **Monnaie / unités** | aucun champ monétaire | Hors périmètre (D2, D8) |

---

## 3. Vue d'ensemble

### 3.1 Diagramme des entités

```text
                        ┌──────────────┐
                        │  departement │
                        └──────┬───────┘
                               │ 0..n
                        ┌──────┴───────┐          ┌──────────────┐
                        │   employe    │ 1 ─── 0..1│  utilisateur │
                        └──────┬───────┘          └──────┬───────┘
                               │                         │
             ┌─────────────────┼─────────────┐           │ crée / attribue
             │ exécutant       │ pilote      │           │
             │                 │             │           │
        ┌────┴─────────────────┴─────────────┴───────────┴────┐
        │                        tache                         │
        └──┬──────────┬───────────┬────────────┬──────────────┘
           │          │           │            │
     ┌─────┴───┐ ┌────┴─────┐ ┌───┴──────┐ ┌───┴──────────┐
     │ element │ │ urgence  │ │importance│ │action_aprendre│
     └─────────┘ └────┬─────┘ └───┬──────┘ └──────────────┘
                      └─────┬─────┘
                    ┌───────┴────────┐
                    │ matrice_priorite│
                    └────────────────┘

     tache 1 ─── 0..n commentaire
     tache 1 ─── 0..n journal_audit (référence logique)
     partenaire 1 ─── 0..n tache (pilote externe)
     jour_ferie, parametre : tables autonomes
```

### 3.2 Liste des tables

| # | Table | Rôle | Volume attendu |
|---|---|---|---|
| 1 | `departement` | Référentiel des services | 10 à 20 |
| 2 | `employe` | Personnes GD Trading | 20 à 100 |
| 3 | `utilisateur` | Comptes, rôles, authentification | 20 à 100 |
| 4 | `partenaire` | Tiers pilotes externes | 10 à 100 |
| 5 | `element` | Pilier / thématique (ex-`Table1089`) | 6 |
| 6 | `urgence` | Référentiel de la matrice | 4 |
| 7 | `importance` | Référentiel de la matrice | 4 |
| 8 | `matrice_priorite` | 13 combinaisons figées | 13 |
| 9 | `action_a_prendre` | Liste des actions à prendre | 3 |
| 10 | `tache` | Entité centrale | quelques milliers / an |
| 11 | `commentaire` | Commentaires libres d'une tâche | 0 à 10 / tâche |
| 12 | `jour_ferie` | Calendrier d'entreprise | 15 / an |
| 13 | `parametre` | Paramètres uniques de l'application | 1 ligne |
| 14 | `journal_audit` | Traçabilité append-only | 10 à 50 / tâche |

> **Non incluse à cette étape** : `session` (sessions serveur), qui relève de l'**ÉTAPE 13**. Le modèle la prévoit comme table séparée, sans la détailler ici.

---

## 4. Types, énumérations et domaines

### 4.1 Énumérations PostgreSQL

| Type | Valeurs | Usage | Source |
|---|---|---|---|
| `role_utilisateur` | `ADMIN` · `RESPONSABLE` · `EMPLOYEE` · `CONSULTANT` | `utilisateur.role` | D7, D21 |
| `nature_tache` | `QUOTIDIENNE` · `AUTRE` | `tache.nature` | RE-02, RE-17 |
| `acteur_tache` | `GD_TRADING` · `PARTENAIRE` | `tache.acteur` | D6 |
| `statut_manuel` | `ANNULEE` · `SUSPENDUE` | `tache.statut_manuel` | D3 |

> **Le statut calculé** (`A faire`, `En cours`, `Retard`, `Achevée`) n'est **pas** un type énuméré stocké : il est **calculé** (RM-01). Les libellés affichés restent ceux de l'Excel, y compris `A faire` sans accent.

### 4.2 Domaines et conventions de valeur

| Domaine | Règle |
|---|---|
| `progression_manuelle` | entier 0-100, `NULL` = aucune valeur manuelle |
| `score` | entier 0-12 (matrice) |
| `frequence_jours` | entier 1-45 (matrice) |
| `jour_semaine` | entier 0-6 (0 = dimanche … 6 = samedi) ; défaut **5 et 6** = vendredi + samedi |
| `heure` | `time` sans fuseau, interprétée dans `Africa/Algiers` |
| `date` | calendaire, sans heure |
| `uuid` | `uuid` v4 généré par `gen_random_uuid()` |
| `jsonb` | uniquement pour l'audit (valeurs avant / après) |

---

## 5. Tables de référentiel et de compte

### 5.1 `departement`

| Colonne | Type | Null | Défaut | Contrainte / règle |
|---|---|---|---|---|
| `id` | `uuid` | non | `gen_random_uuid()` | PK |
| `libelle` | `text` | non | — | `ck_departement_libelle` : non vide ; `uq_departement_libelle` (insensible à la casse via index `lower(libelle)`) |
| `actif` | `boolean` | non | `true` | Un département inactif n'est plus proposé à la création |
| `cree_le` | `timestamptz` | non | `now()` | — |
| `modifie_le` | `timestamptz` | non | `now()` | Mis à jour à chaque écriture |

**Règles** : référentiel **administrable** (Q1, D8). Au plus **un responsable** par département (A12) — contrainte traitée en section 9.
**Suppression** : **refusée** si le département est référencé par un employé ; sinon **désactivation** recommandée.

### 5.2 `employe`

| Colonne | Type | Null | Défaut | Contrainte / règle |
|---|---|---|---|---|
| `id` | `uuid` | non | `gen_random_uuid()` | PK |
| `nom` | `text` | non | — | non vide |
| `prenom` | `text` | non | — | non vide |
| `email` | `text` | oui | `NULL` | non vide si renseigné ; **non unique** (aucune décision ne l'impose) |
| `departement_id` | `uuid` | oui | `NULL` | FK → `departement(id)` `ON DELETE RESTRICT` |
| `actif` | `boolean` | non | `true` | Un employé inactif n'est plus proposé ; **jamais supprimé** (R3, Q4, D12) |
| `cree_le` | `timestamptz` | non | `now()` | — |
| `modifie_le` | `timestamptz` | non | `now()` | — |

**Règles** :
- le **département est optionnel** (Q1, EF-12) ; un employé sans département ne rend aucune tâche visible à un responsable ;
- un employé **référencé** (tâche, commentaire, audit) n'est **jamais supprimé** — il est **désactivé** (EF-11, CA-53) ;
- aucune contrainte d'unicité sur `(nom, prenom)` : deux homonymes sont possibles, aucune décision n'interdit ce cas ;
- les **19 noms** de l'Excel ne sont **pas repris** (D6, D11).

### 5.3 `utilisateur`

| Colonne | Type | Null | Défaut | Contrainte / règle |
|---|---|---|---|---|
| `id` | `uuid` | non | `gen_random_uuid()` | PK |
| `employe_id` | `uuid` | oui | `NULL` | FK → `employe(id)` `ON DELETE RESTRICT` ; **unique** quand renseigné |
| `identifiant` | `text` | non | — | **unique**, insensible à la casse ; 3 à 64 caractères |
| `mot_de_passe_hash` | `text` | non | — | Argon2id (ÉTAPE 13) ; jamais affiché ni journalisé |
| `role` | `role_utilisateur` | non | `EMPLOYEE` | D7, D12 |
| `actif` | `boolean` | non | `true` | D12 |
| `doit_changer_mot_de_passe` | `boolean` | non | `true` | EF-09 (ÉTAPE 13) |
| `tentatives_echouees` | `smallint` | non | `0` | ≥ 0 |
| `verrouille_jusqua` | `timestamptz` | oui | `NULL` | ÉTAPE 13 |
| `derniere_connexion_le` | `timestamptz` | oui | `NULL` | — |
| `cree_le` | `timestamptz` | non | `now()` | — |
| `modifie_le` | `timestamptz` | non | `now()` | — |

**Contraintes** :
- `uq_utilisateur_employe` : **index unique partiel** sur `employe_id WHERE employe_id IS NOT NULL` → **un compte par employé** (D12, EF-06, CA-05) ;
- `uq_utilisateur_identifiant` : index unique sur `lower(identifiant)` ;
- `ck_utilisateur_identifiant` : longueur entre 3 et 64, sans espace ;
- **`RESPONSABLE` sans département** : non exprimable par une simple contrainte (le département est sur `employe`) → section 9 ;
- un compte **n'est jamais supprimé**, il est **désactivé** (D12).

> **M7-06 — ✅ tranché le 02/11/2026 (D39)** : `employe_id` reste **nullable** pour permettre un compte `CONSULTANT` **sans fiche employé** (consultant externe). L'unicité « un compte par employé » est assurée par un **index unique partiel** `WHERE employe_id IS NOT NULL`.

### 5.4 `partenaire`

| Colonne | Type | Null | Défaut | Contrainte / règle |
|---|---|---|---|---|
| `id` | `uuid` | non | `gen_random_uuid()` | PK |
| `libelle` | `text` | non | — | non vide ; unique (insensible à la casse) |
| `actif` | `boolean` | non | `true` | — |
| `cree_le` / `modifie_le` | `timestamptz` | non | `now()` | — |

**Règles** : référentiel distinct des fournisseurs (D6, EF-13) ; seuls les partenaires **non-employés** y figurent ; jamais supprimé s'il est pilote d'une tâche.

### 5.5 `element`

| Colonne | Type | Null | Défaut | Contrainte / règle |
|---|---|---|---|---|
| `id` | `uuid` | non | `gen_random_uuid()` | PK |
| `libelle` | `text` | non | — | non vide ; unique (insensible à la casse) |
| `ordre` | `smallint` | non | `0` | ≥ 0 |
| `actif` | `boolean` | non | `true` | — |
| `cree_le` / `modifie_le` | `timestamptz` | non | `now()` | — |

**Règles** : reprend le référentiel `BD!Table1089` (**6 valeurs** : EQUIPE, PROCESS, GOUVERNANCE et 3 autres observées), conservé par D8. Administrable par l'admin (EF-18).

### 5.6 `urgence`

| Colonne | Type | Null | Défaut | Contrainte |
|---|---|---|---|---|
| `id` | `uuid` | non | `gen_random_uuid()` | PK |
| `libelle` | `text` | non | — | unique |
| `ordre` | `smallint` | non | `0` | — |

**Données** : `Immédiate`, `Courte échéance`, `Planifiable`, `Pas urgent` (`BD!Table10`).

### 5.7 `importance`

Même structure que `urgence`.

**Données** : `Critique`, `Elevée`, `Modérée`, `Faible` (`BD!Table108`).

> **Note de libellé** : l'Excel écrit `Elevée` sans accent. Le libellé **stocké** reprend l'Excel ; l'affichage pourra être corrigé à l'ÉTAPE 9. La priorité calculée doit rester **strictement** `Urgence & " & " & Importance` (RM-03).

### 5.8 `matrice_priorite`

| Colonne | Type | Null | Défaut | Contrainte |
|---|---|---|---|---|
| `urgence_id` | `uuid` | non | — | PK composée (1/2), FK → `urgence(id)` |
| `importance_id` | `uuid` | non | — | PK composée (2/2), FK → `importance(id)` |
| `score` | `smallint` | non | — | 0 ≤ score ≤ 12 |
| `frequence_jours` | `smallint` | non | — | 1 ≤ fréquence ≤ 45 |

**Données** : **13 lignes** reprises de `BD!Table31`, insérées au démarrage :

| Urgence | Importance | Score | Fréquence (j) |
|---|---|---|---|
| Immédiate | Critique | 12 | 1 |
| Immédiate | Elevée | 11 | 2 |
| Immédiate | Modérée | 10 | 4 |
| Immédiate | Faible | 9 | 5 |
| Courte échéance | Critique | 8 | 6 |
| Courte échéance | Elevée | 7 | 7 |
| Courte échéance | Modérée | 6 | 8 |
| Courte échéance | Faible | 5 | 10 |
| Planifiable | Critique | 4 | 15 |
| Planifiable | Elevée | 3 | 20 |
| Planifiable | Modérée | 2 | 25 |
| Planifiable | Faible | 1 | 30 |
| Pas urgent | Faible | 0 | 45 |

**Règles** :
- table **non modifiable par l'utilisateur** (EF-20) ; seule une migration peut la faire évoluer ;
- les **3 combinaisons absentes** (`Pas urgent` × `Critique` / `Elevée` / `Modérée`) **n'existent pas** : la **clé étrangère composée** de `tache` vers cette table les rend **impossibles en base** — c'est la traduction structurelle de **P9 → D31** ;
- `libelle`, `score` et `frequence` ne sont **pas** stockés sur la tâche : ils sont **lus** via la matrice (AR-05).

### 5.9 `action_a_prendre`

| Colonne | Type | Null | Défaut | Contrainte |
|---|---|---|---|---|
| `id` | `uuid` | non | `gen_random_uuid()` | PK |
| `libelle` | `text` | non | — | unique |
| `actif` | `boolean` | non | `true` | — |

**Données** : `Faire immédiatement`, `Planifier`, `Déléguer si possible` (`BD`, EF-21).

**Usage** : cette liste **n'est pas saisie** par l'utilisateur. Le serveur choisit la ligne à partir de la **priorité calculée** (EF-71) : P1/P2 → `Faire immédiatement`, P3 → `Déléguer si possible`, P4 → `Planifier`. La colonne `tache.action_a_prendre_id` est alimentée à la création, à la modification de l'urgence ou de l'importance, à la duplication et à la génération des occurrences.

### 5.10 `jour_ferie`

| Colonne | Type | Null | Défaut | Contrainte |
|---|---|---|---|---|
| `id` | `uuid` | non | `gen_random_uuid()` | PK |
| `jour` | `date` | non | — | **unique** |
| `libelle` | `text` | oui | `NULL` | ex. « Aïd el-Fitr » ; aucune liste de libellés n'est fournie |
| `cree_le` | `timestamptz` | non | `now()` | — |

**Données initiales** : les **15 dates 2026** de `BD!T3:T17` (D5) :
`01/01`, `12/01`, `20/03`, `21/03`, `22/03`, `01/05`, `27/05`, `28/05`, `29/05`, `16/06`, `25/06`, `02/07`, `05/07`, `26/08`, `01/11`.
**2027-2028** : aucune date fournie → **P2**, à saisir par l'admin.
**Suppression** : libre (aucune tâche ne référence un férié en base : le calcul est dynamique).

### 5.11 `parametre`

Table **à une seule ligne** (`id = 1`), contrainte `ck_parametre_singleton`.

| Colonne | Type | Null | Défaut | Contrainte |
|---|---|---|---|---|
| `id` | `smallint` | non | `1` | PK ; `CHECK (id = 1)` |
| `fuseau` | `text` | non | `'Africa/Algiers'` | D30 |
| `weekend_jour_1` | `smallint` | non | `5` | 0-6 (5 = vendredi) |
| `weekend_jour_2` | `smallint` | non | `6` | 0-6 (6 = samedi) ; `<> weekend_jour_1` |
| `heure_debut_journee` | `time` | non | `'08:00'` | EF-22 |
| `pause_debut` | `time` | non | `'12:00'` | EF-22 |
| `pause_fin` | `time` | non | `'13:00'` | EF-22 |
| `heure_echeance_quotidienne` | `time` | non | `'16:30'` | D18 |
| `modifie_le` | `timestamptz` | non | `now()` | — |
| `modifie_par_id` | `uuid` | oui | `NULL` | FK → `utilisateur(id)` |

**Règles** :
- `heure_debut_journee < pause_debut < pause_fin < heure_echeance_quotidienne` (contrainte de cohérence) ;
- la pause est **affichée**, sans effet sur les calculs (D18) ;
- toute modification est **journalisée** (RM-13).

---

## 6. Table centrale `tache`

### 6.1 Colonnes

| # | Colonne | Type | Null | Défaut | Contrainte / règle |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | non | `gen_random_uuid()` | PK |
| 2 | `nature` | `nature_tache` | non | — | `QUOTIDIENNE` ou `AUTRE` (EF-24) |
| 3 | `libelle` | `text` | non | — | `length(btrim(libelle)) > 0` |
| 4 | `element_id` | `uuid` | non | — | FK → `element(id)` `RESTRICT` (EF-25) |
| 5 | `acteur` | `acteur_tache` | non | — | `GD_TRADING` ou `PARTENAIRE` (EF-26) |
| 6 | `pilote_employe_id` | `uuid` | oui | `NULL` | FK → `employe(id)` `RESTRICT` |
| 7 | `pilote_partenaire_id` | `uuid` | oui | `NULL` | FK → `partenaire(id)` `RESTRICT` |
| 8 | `assigne_a_employe_id` | `uuid` | oui | `NULL` | FK → `employe(id)` `RESTRICT` — exécutant interne d'une tâche `GD_TRADING` |
| 8 bis | `assigne_a_partenaire_id` | `uuid` | oui | `NULL` | FK → `partenaire(id)` `RESTRICT` — exécutant partenaire d'une tâche `PARTENAIRE` |
| 9 | `date_action` | `date` | non | — | EF-27 |
| 10 | `date_debut` | `date` | non | — | EF-27 |
| 11 | `date_fin_prevue` | `date` | oui | `NULL` | **obligatoire si `AUTRE`**, **interdite si `QUOTIDIENNE`** (D28) |
| 12 | `date_fin` | `date` | oui | `NULL` | date de clôture métier (EF-53) |
| 13 | `cloture_le` | `timestamptz` | oui | `NULL` | horodatage réel de la clôture (**M7-05**) |
| 14 | `urgence_id` | `uuid` | non | — | FK → `urgence(id)` ; 1/2 de la FK composée vers la matrice |
| 15 | `importance_id` | `uuid` | non | — | FK → `importance(id)` ; 2/2 de la FK composée |
| 16 | `action_a_prendre_id` | `uuid` | oui | `NULL` | FK → `action_a_prendre(id)` `RESTRICT` ; **déduite de la priorité** par le serveur (EF-71), jamais saisie |
| 17 | `statut_manuel` | `statut_manuel` | oui | `NULL` | `NULL` = état calculé ; `ANNULEE` / `SUSPENDUE` prioritaires (D3) |
| 18 | `progression_manuelle` | `smallint` | oui | `NULL` | 0-100 (EF-56) |
| 19 | `motif_non_achevement` | `text` | oui | `NULL` | **obligatoire à la clôture tardive** (D15) ; non vide, maximum 2 000 caractères (**D45**) |
| 20 | `cree_par_id` | `uuid` | non | — | FK → `utilisateur(id)` `RESTRICT` (D13) |
| 21 | `attribue_par_id` | `uuid` | non | — | FK → `utilisateur(id)` `RESTRICT` (D7, D13) |
| 22 | `supprime_le` | `timestamptz` | oui | `NULL` | suppression **logique** (**M7-03**) |
| 23 | `supprime_par_id` | `uuid` | oui | `NULL` | FK → `utilisateur(id)` `RESTRICT` |
| 24 | `cree_le` | `timestamptz` | non | `now()` | — |
| 25 | `modifie_le` | `timestamptz` | non | `now()` | — |
| 26 | `version` | `integer` | non | `1` | verrouillage optimiste (≥ 1) |

> **Aucune** des colonnes suivantes n'existe : `statut`, `priorite`, `score`, `frequence_jours` (sur la tâche), `date_rappel`, `duree_g`, `duree_e`, `service_porteur`, `progression` calculée. Toutes sont **calculées** (section 8).

### 6.2 Contraintes `CHECK`

| Nom | Expression | Traduction |
|---|---|---|
| `ck_tache_assigne` | `(acteur = 'GD_TRADING' AND assigne_a_employe_id IS NOT NULL AND assigne_a_partenaire_id IS NULL) OR (acteur = 'PARTENAIRE' AND assigne_a_partenaire_id IS NOT NULL AND assigne_a_employe_id IS NULL)` | D81, EF-26 : **un seul** assigné, du type de l'acteur |
| `ck_tache_pilote` | `(acteur = 'GD_TRADING' AND pilote_employe_id IS NOT NULL AND pilote_partenaire_id IS NULL) OR (acteur = 'PARTENAIRE' AND ((pilote_employe_id IS NOT NULL) <> (pilote_partenaire_id IS NOT NULL)))` | D6, D81, EF-26 : **un seul** pilote ; employé pour `GD_TRADING`, employé **ou** partenaire pour `PARTENAIRE` |
| `ck_tache_dates_ordre` | `date_action <= date_debut AND (date_fin_prevue IS NULL OR date_debut <= date_fin_prevue)` | EF-35, RM-15 |
| `ck_tache_date_fin` | `date_fin IS NULL OR date_fin >= date_debut` | EF-35 |
| `ck_tache_nature` | `(nature = 'QUOTIDIENNE' AND date_fin_prevue IS NULL AND date_debut = date_action) OR (nature = 'AUTRE' AND date_fin_prevue IS NOT NULL)` | **D28** : journée unique pour une quotidienne ; échéance obligatoire pour une autre |
| `ck_tache_progression` | `progression_manuelle IS NULL OR progression_manuelle BETWEEN 0 AND 100` | EF-56 |
| `ck_tache_motif` | `date_fin IS NULL OR date_fin <= COALESCE(date_fin_prevue, date_debut) OR (motif_non_achevement IS NOT NULL AND length(btrim(motif_non_achevement)) > 0)` | D15 — **filet de sécurité** ; la règle 16h30 est dans le moteur |
| `ck_tache_cloture` | `(date_fin IS NULL AND cloture_le IS NULL) OR (date_fin IS NOT NULL AND cloture_le IS NOT NULL)` | cohérence de la clôture |
| `ck_tache_suppression` | `(supprime_le IS NULL AND supprime_par_id IS NULL) OR (supprime_le IS NOT NULL AND supprime_par_id IS NOT NULL)` | cohérence de la suppression logique |
| `ck_tache_libelle` | `length(btrim(libelle)) > 0` | EF-34 |

> **Limite assumée de `ck_tache_motif`** : la base ne connaît pas l'heure de clôture. Une tâche quotidienne clôturée **le même jour après 16h30** n'est **pas** arrêtée par cette contrainte — c'est le **moteur de domaine** (RM-01, RM-07) qui exige le motif, sur la base de `cloture_le` et du paramètre `heure_echeance_quotidienne`. La contrainte couvre les cas de clôture **à une date postérieure**.

### 6.3 Clé étrangère composée vers la matrice

```text
FK (urgence_id, importance_id) → matrice_priorite (urgence_id, importance_id)
```

**Effet** : il est **impossible d'enregistrer** une tâche dont le couple urgence × importance n'existe pas dans la matrice. Les trois combinaisons absentes sont donc **refusées par la base**, pas seulement par l'interface → **P9 → D31** garanti structurellement.

### 6.4 Index

| Nom | Colonnes | Type | Usage |
|---|---|---|---|
| `ix_tache_assigne_employe` | `assigne_a_employe_id` | btree | « mes tâches » |
| `ix_tache_assigne_partenaire` | `assigne_a_partenaire_id` | btree | tâches assignées à un partenaire (D81) |
| `ix_tache_pilote_employe` | `pilote_employe_id` | btree | « tâches dont je suis pilote » |
| `ix_tache_pilote_partenaire` | `pilote_partenaire_id` | btree | tâches pilotées par un partenaire (D47) |
| `ix_tache_cree_par` | `cree_par_id` | btree | « tâches que j'ai créées » (A13) |
| `ix_tache_attribue_par` | `attribue_par_id` | btree | suppression par le responsable (D7) |
| `ix_tache_element` | `element_id` | btree | filtres |
| `ix_tache_matrice` | `(urgence_id, importance_id)` | btree | jointure matrice |
| `ix_tache_jour` | `(nature, date_action)` | btree | vue du jour |
| `ix_tache_echeance_ouverte` | `date_fin_prevue` | **partiel** `WHERE date_fin IS NULL AND supprime_le IS NULL` | retards et rappels |
| `ix_tache_ouvertes` | `date_action` | **partiel** `WHERE date_fin IS NULL AND supprime_le IS NULL` | listes actives |
| `ix_tache_libelle` | `lower(libelle)` | btree, **non unique** | détection de doublon (EF-36, avertissement) |
| `ix_tache_supprime` | `supprime_le` | **partiel** `WHERE supprime_le IS NOT NULL` | corbeille / audit |

> **Pourquoi pas d'index sur le statut** : le statut est **calculé** (AR-05) ; il dépend de `now()` et du fuseau. Les listes filtrent donc sur les **dates** et sur `statut_manuel`, puis le statut est calculé en mémoire. Un index sur une valeur calculée serait faux dès le lendemain.
>
> **Conséquence de performance** : le filtre « Retard » ne peut pas être un `WHERE` indexé pur. Il s'appuie sur `date_fin_prevue < aujourd'hui` (index partiel) **et** sur `statut_manuel`. Ce point est repris à l'ÉTAPE 8 pour la pagination.

### 6.5 Points de vigilance sur la table `tache`

| # | Sujet | Règle retenue |
|---|---|---|
| **M7-01** | **Service porteur** | **Non stocké** : calculé à chaque lecture — département de `assigne_a_employe_id`, à défaut `pilote_employe_id` (D29, D81). Un assigné partenaire n'a pas de département. **Conséquence assumée** : si un employé change de département, l'historique de visibilité du responsable change aussi. Une colonne figée à la création serait plus stable mais **contredirait AR-05** et créerait une seconde source de vérité. ✅ **Tranché (D34)**. |
| **M7-03** | **Suppression** | **Logique** (`supprime_le`) : la tâche disparaît des listes, reste auditable, les commentaires sont conservés. ✅ **Tranché (D36)**. |
| **M7-05** | **Clôture** | Deux colonnes : `date_fin` (date métier, affichée) **et** `cloture_le` (horodatage réel). Sans `cloture_le`, la règle « 16h30 » d'une tâche quotidienne n'est **pas** vérifiable. ✅ **Tranché (D38)**. |
| **M7-08** | **Doublon de libellé** | **Aucune contrainte d'unicité** : EF-36 demande un **signalement**, pas un blocage, et le statut « active » est calculé. Un index `lower(libelle)` permet la recherche ; l'avertissement est applicatif. ✅ **Tranché (D41)**. |

---

## 7. Commentaires et journal d'audit

### 7.1 `commentaire`

**Proposition** : les commentaires sont **historisés** dans une table dédiée plutôt que dans une colonne unique de `tache`.

| Colonne | Type | Null | Défaut | Contrainte |
|---|---|---|---|---|
| `id` | `uuid` | non | `gen_random_uuid()` | PK |
| `tache_id` | `uuid` | non | — | FK → `tache(id)` `ON DELETE RESTRICT` |
| `auteur_id` | `uuid` | non | — | FK → `utilisateur(id)` `RESTRICT` |
| `texte` | `text` | non | — | non vide |
| `cree_le` | `timestamptz` | non | `now()` | — |

**Règles** : commentaire **libre, facultatif, sans effet sur le statut** (D3, EF-55) ; jamais modifié ni supprimé par l'interface ; **append-only** comme l'audit.

> **M7-04 — ✅ tranché le 02/11/2026 (D37)** : l'Excel n'avait **qu'une seule cellule** `COMMENTAIRE` par action, mais le CDC (EF-47) mentionne « les commentaires » et « l'historique ». La table **conserve chaque commentaire** ; une colonne unique serait plus proche de l'Excel mais perdrait l'historique. Le champ `COMMENTAIRE` de l'Excel reste **entièrement couvert** (aucune donnée perdue, aucune colonne supprimée).

### 7.2 `journal_audit`

| Colonne | Type | Null | Défaut | Contrainte |
|---|---|---|---|---|
| `id` | `bigserial` | non | auto | PK |
| `horodatage` | `timestamptz` | non | `now()` | — |
| `acteur_id` | `uuid` | oui | `NULL` | FK → `utilisateur(id)` `ON DELETE SET NULL` (système = `NULL`) |
| `type_operation` | `text` | non | — | `CREATION`, `MODIFICATION`, `CHANGEMENT_STATUT`, `CHANGEMENT_PROGRESSION`, `COMMENTAIRE`, `MOTIF`, `CLOTURE`, `SUPPRESSION`, `CHANGEMENT_TITULAIRE`, `COMPTE`, `ROLE`, `REFERENTIEL`, `CONNEXION` |
| `entite` | `text` | non | — | nom de la table concernée |
| `entite_id` | `text` | oui | `NULL` | identifiant sous forme texte (uuid ou `1`) |
| `donnees_avant` | `jsonb` | oui | `NULL` | valeurs avant écriture — **sans mot de passe ni secret** |
| `donnees_apres` | `jsonb` | oui | `NULL` | valeurs après écriture |
| `contexte` | `jsonb` | oui | `NULL` | ex. `{ "ip": "…", "role": "ADMIN" }` — aucune donnée sensible |

**Règles** (AR-10, EF-76, EF-77, RM-13) :
- **append-only** : `UPDATE` et `DELETE` sont **interdits** — révoqués au niveau du rôle base et bloqués par un déclencheur qui lève une exception ;
- consultable uniquement par l'**admin** (proposition, section 3.2 du CDC) ;
- aucune valeur de mot de passe, de jeton ni de secret n'y est écrite ;
- **conservation** : **aucune purge automatique** — ✅ **tranché le 02/11/2026 (D42)** ; la durée de conservation définitive sera revue à l'ÉTAPE 14.

---

## 8. Champs calculés — jamais stockés

Conformément à **AR-05**, les valeurs suivantes sont **recalculées à chaque lecture** et ne figurent dans aucune colonne.

| Valeur | Règle | Dépend de |
|---|---|---|
| `statut` (`A faire`, `En cours`, `Retard`, `Achevée`, `Annulée`, `Suspendue`) | RM-01 | `statut_manuel`, `date_action`, `date_fin`, `date_fin_prevue`, `nature`, `cloture_le`, `now()`, fuseau |
| `progression` (0-100 ou `—`) | RM-02 | `progression_manuelle`, `date_fin`, `date_action`, `date_debut`, `date_fin_prevue` |
| `priorite` (libellé) | RM-03 | `urgence.libelle`, `importance.libelle` |
| `score` | RM-03 | `matrice_priorite.score` |
| `frequence_jours` | RM-03 | `matrice_priorite.frequence_jours` |
| `date_rappel` | RM-04 | `date_action`, `date_debut`, `date_fin`, fréquence, week-end, fériés |
| `duree_g` | RM-06 | `date_debut`, `date_fin`, `now()` |
| `duree_e` | RM-06 | `date_fin`, `date_fin_prevue` — **`—` pour une tâche quotidienne** (pas de `date_fin_prevue`, D28) |
| `service_porteur` | D29, D81 | `assigne_a_employe_id → employe.departement_id`, à défaut `pilote_employe_id → employe.departement_id` |
| `est_en_retard` / `rappel_echu` / `rappel_imminent` | EF-50, EF-51 | `statut`, `date_rappel`, `now()` |

> **Conséquence de P4 → D28, tranchée par D43** : une tâche **quotidienne** n'a **pas** de `date_fin_prevue`. Sa progression temporelle **n'utilise pas** la formule `(référence − début) / (échéance − début)` : elle vaut **0 %** tant que `date_fin` est vide, **100 %** dès la clôture, sauf progression manuelle qui reste prioritaire (RM-02).

---

## 9. Contraintes transversales

PostgreSQL **ne peut pas** exprimer directement deux règles qui portent sur **deux tables** (`employe` et `utilisateur`) :

| Règle | Source | Pourquoi la base ne peut pas l'exprimer seule | Traitement proposé |
|---|---|---|---|
| **Au plus un `RESPONSABLE` par département** | A12, EF-15, CA-54 | Le rôle est sur `utilisateur`, le département sur `employe` | **M7-02** : contrôle applicatif dans une **transaction `SERIALIZABLE`** au moment de l'attribution du rôle + test d'intégration. Alternative refusée : dénormaliser `departement_id` sur `utilisateur` (deux sources de vérité) ou dénormaliser `role` sur `employe` (contredit D7). |
| **`RESPONSABLE` ⇒ département non nul** | D7, EF-05, CA-06 | Même raison | Contrôle applicatif **avant** écriture + contrôle au chargement ; documenté comme invariants d'intégrité. |
| **Clôture tardive ⇒ motif** | D15, EF-54 | Dépend de l'heure courante et du paramètre 16h30 | `ck_tache_motif` en filet + règle serveur (RM-07). |

> **M7-02 — ✅ tranché le 02/11/2026 (D35)** : contrôle **applicatif transactionnel** (`SERIALIZABLE`) au moment de l'attribution du rôle, avec test d'intégration. Les options **B** (déclencheur PostgreSQL) et **C** (colonne dénormalisée) sont écartées : la première complique la maintenance Prisma, la seconde crée deux sources de vérité.

---

## 10. Règles de suppression et intégrité référentielle

### 10.1 Politique par table

| Table | Suppression physique | Suppression logique | Désactivation | Justification |
|---|---|---|---|---|
| `tache` | ❌ (sauf maintenance) | ✅ `supprime_le` | ❌ | AR-10, RM-11, **D36** |
| `commentaire` | ❌ | ❌ | ❌ | Historique, append-only |
| `journal_audit` | ❌ | ❌ | ❌ | AR-10 |
| `employe` | ❌ | ❌ | ✅ `actif = false` | R3, Q4, D12, EF-11, CA-53 |
| `utilisateur` | ❌ | ❌ | ✅ `actif = false` | D12 |
| `departement` | ❌ si référencé | ❌ | ✅ `actif = false` | EF-14 ; suppression / désactivation refusées si un responsable est rattaché (**D48**) |
| `partenaire` | ❌ si pilote | ❌ | ✅ | D6, EF-13 |
| `element` | ❌ si utilisé | ❌ | ✅ | EF-18 |
| `urgence` / `importance` | ❌ si utilisé | ❌ | ❌ | Matrice figée, EF-20 |
| `matrice_priorite` | ❌ | ❌ | ❌ | Figée, EF-20 |
| `action_a_prendre` | ❌ si utilisé | ❌ | ✅ | EF-21 |
| `jour_ferie` | ✅ | ❌ | ❌ | Aucune référence en base |
| `parametre` | ❌ | ❌ | ❌ | Singleton |

### 10.2 Comportement des clés étrangères

| FK | `ON DELETE` | `ON UPDATE` | Raison |
|---|---|---|---|
| `employe.departement_id` → `departement` | `RESTRICT` | `CASCADE` | Ne jamais perdre le rattachement d'un employé |
| `utilisateur.employe_id` → `employe` | `RESTRICT` | `CASCADE` | Un compte ne survit pas à la suppression de son employé (qui n'arrive jamais) |
| `tache.assigne_a_employe_id` → `employe` | `RESTRICT` | `CASCADE` | Une tâche `GD_TRADING` référence toujours un exécutant interne |
| `tache.assigne_a_partenaire_id` → `partenaire` | `RESTRICT` | `CASCADE` | Une tâche `PARTENAIRE` référence toujours un exécutant partenaire (D81) |
| `tache.pilote_employe_id` / `pilote_partenaire_id` | `RESTRICT` | `CASCADE` | — |
| `tache.element_id`, `urgence_id`, `importance_id`, `action_a_prendre_id` | `RESTRICT` | `CASCADE` | Référentiels non supprimables s'ils sont utilisés |
| `tache.cree_par_id`, `attribue_par_id`, `supprime_par_id` → `utilisateur` | `RESTRICT` | `CASCADE` | Traçabilité |
| `commentaire.tache_id` → `tache` | `RESTRICT` | `CASCADE` | La suppression logique évite le `CASCADE` destructeur |
| `journal_audit.acteur_id` → `utilisateur` | `SET NULL` | `CASCADE` | L'audit **survit** à son auteur |

> **Aucun `CASCADE` descendant** n'est utilisé sur les données métier : une suppression ne doit jamais effacer en silence des tâches ou des commentaires. Le seul `SET NULL` concerne l'auteur d'un événement d'audit.

---

## 11. Index et performance

### 11.1 Index par table

| Table | Index |
|---|---|
| `employe` | `departement_id` ; `actif` (partiel `WHERE actif`) |
| `utilisateur` | unique `lower(identifiant)` ; unique partiel `employe_id WHERE employe_id IS NOT NULL` ; `role` |
| `partenaire` | unique `lower(libelle)` |
| `element` | unique `lower(libelle)` ; `(actif, ordre)` |
| `urgence`, `importance` | unique `lower(libelle)` |
| `matrice_priorite` | PK `(urgence_id, importance_id)` |
| `action_a_prendre` | unique `lower(libelle)` |
| `jour_ferie` | unique `jour` |
| `tache` | voir section 6.4 (11 index) |
| `commentaire` | `(tache_id, cree_le)` |
| `journal_audit` | `(entite, entite_id)` ; `horodatage` ; `acteur_id` |

### 11.2 Objectifs de performance (ENF-01)

| Requête | Cible | Appui |
|---|---|---|
| « Mes tâches du jour » | < 200 ms | `ix_tache_assigne` + `ix_tache_jour` |
| « Tâches de mon service » | < 500 ms | `employe.departement_id` + `ix_tache_assigne`, jointure |
| « Tâches en retard » | < 500 ms | `ix_tache_echeance_ouverte` |
| Liste paginée 1 000 tâches | < 2 s | pagination `keyset`, index partiels |

> **Réserve** : le statut et la progression étant calculés, un tri **par statut** ou **par progression** s'effectue après calcul. Au-delà d'un seuil (à fixer à l'ÉTAPE 8), une vue matérialisée ou une colonne de statut recalculée par tâche planifiée serait nécessaire. **Aucune décision ne l'impose aujourd'hui** ; le volume attendu (section 12) ne le justifie pas.

---

## 12. Volumétrie

| Objet | Démarrage | Croissance estimée | Seuil de vigilance |
|---|---|---|---|
| `tache` | **0** (D11) | ~90 / jour ouvré, ~23 000 / an (30 employés × 3 tâches) | > 500 000 lignes |
| `commentaire` | 0 | 1 à 3 / tâche | > 1 000 000 |
| `journal_audit` | 0 | 3 à 10 / tâche | > 2 000 000 |
| `employe` / `utilisateur` | 0 | quelques unités / an | > 500 |
| Référentiels | seeds | quasi stable | — |

> Aucun partitionnement n'est nécessaire au démarrage. Le point serait réévalué à l'ÉTAPE 14.

---

## 13. Données initiales (seed)

| Ordre | Table | Lignes | Source | Statut |
|---|---|---|---|---|
| 1 | `parametre` | 1 | D18, D30, EF-22 | ✅ décidé |
| 2 | `urgence` | 4 | `BD!Table10` | ✅ décidé (D8, D14) |
| 3 | `importance` | 4 | `BD!Table108` | ✅ décidé (D8, D14) |
| 4 | `matrice_priorite` | 13 | `BD!Table31` | ✅ décidé (D14, D31) |
| 5 | `action_a_prendre` | 3 | `BD` | ✅ décidé (EF-21) |
| 6 | `element` | 6 | `BD!Table1089` | ✅ décidé (D8) |
| 7 | `jour_ferie` | 15 | `BD!T3:T17` | ✅ décidé (D5) |
| 8 | `departement` | 9 observés | `ACTIONS!K6:K100` | ✅ **décidé (D40)** — insertion au démarrage |
| 9 | `employe` / `utilisateur` | **0** | — | ✅ aucune reprise (D11, D12) |
| 10 | `partenaire` | **0** | — | ✅ aucune reprise (D6, D11) |
| 11 | `tache` | **0** | — | ✅ D11 |

**Départements observés** (9 sur 11 déclarés) : `POLE SUPPORT & PERFORMANCE`, `POLE DEVELOPPEMENT DES ACTIVITES`, `COMPTABILITE`, `M.Gx & LOGISTIQUE`, `COORDINATION R&I`, `FINANCES`, `B.U.INGREDIENTS`, `ACHATS INTERNATIONAUX`, `TOP MANAGEMENT`.

> **M7-07 — ✅ tranché le 02/11/2026 (D40)** : les **9 départements observés** sont **insérés au démarrage** (option A). La **DÉCISION 11** interdit de reprendre les **actions**, pas les **référentiels** ; aucune donnée nominative n'est reprise. Le devenir du responsable en cas de suppression d'un département est fixé par **D48** : l'opération est **refusée** tant qu'un responsable y est rattaché.

Le seed est **idempotent** : une seconde exécution ne duplique ni férié, ni matrice, ni référentiel.

---

## 14. Stratégie de migration

| Sujet | Règle |
|---|---|
| **Outil** | Prisma Migrate (D9, AR-08) — migrations **versionnées**, jamais éditées après application |
| **Sens** | **forward-only** ; pas de `down` automatique ; restauration par sauvegarde (ENF-04, ENF-14) |
| **Nommage** | `AAAAJJMM_HHMM_description` généré par Prisma |
| **Ordre proposé** | `0001` types + référentiels → `0002` employé / utilisateur → `0003` tache + contraintes → `0004` commentaire + audit → `0005` index partiels + déclencheur d'audit |
| **Seed** | script séparé, idempotent, exécuté après les migrations |
| **Environnements** | développement, recette, production — même schéma, données différentes |
| **Contrôle** | `migrate diff` et `migrate status` en recette avant production |
| **Sauvegarde** | obligatoire avant toute migration en production (ÉTAPE 14) |
| **Aucune reprise Excel** | D11 — aucun script d'import d'actions |

### 14.1 Prérequis à vérifier avant l'ÉTAPE 8

| # | Point | Pourquoi |
|---|---|---|
| 1 | **PostgreSQL ≥ 15 installé et accessible** | D9 ; risque n° 5 de l'architecture |
| 2 | Droit `CREATE EXTENSION pgcrypto` ou `gen_random_uuid()` disponible (natif ≥ 13) | Identifiants |
| 3 | Fuseau `Africa/Algiers` présent dans `pg_timezone_names` | D30 |
| 4 | Encodage `UTF8`, collation adaptée au français | Accents, tri |
| 5 | Accès en écriture pour `migrate` et lecture/écriture pour l'application | Déploiement |
| 6 | Sauvegarde et restauration testées sur une base vide | ENF-14 |

---

## 15. Traçabilité

### 15.1 Tables ← décisions

| Table | Décisions | Exigences |
|---|---|---|
| `departement` | Q1, D6, D7, A12 | EF-14, EF-15 |
| `employe` | Q1, Q4, D6, D12, D20 | EF-11, EF-12 |
| `utilisateur` | D7, D12, D21 | EF-01 à EF-07 |
| `partenaire` | D6, Q3 | EF-13 |
| `element` | D8 | EF-18 |
| `urgence` / `importance` | D8, D14 | EF-19 |
| `matrice_priorite` | D14, D31 | EF-20, EF-70, RM-03 |
| `action_a_prendre` | D14, D33 | EF-21, EF-71 |
| `tache` | D3, D4, D6, D13, D15, D18, D22, D28, D29, D33 | EF-24 à EF-40, EF-52 à EF-60 |
| `commentaire` | D3 | EF-55, EF-47 |
| `jour_ferie` | D5 | EF-16, RM-05 |
| `parametre` | D5, D18, D30 | EF-17, EF-22, EF-23 |
| `journal_audit` | AR-10 | EF-69, EF-76, EF-77 |

### 15.2 Colonnes de l'Excel ← modèle

| Col | Libellé Excel | Colonne / calcul |
|---|---|---|
| B | `STATUT` | `statut_manuel` + **calcul** RM-01 |
| C | `PRIORITE` | **calcul** RM-03 (via matrice) |
| D | `PROGRESSION` | `progression_manuelle` + **calcul** RM-02 |
| E | `DATE ACTION` | `date_action` |
| F | `D.DEBUT` | `date_debut` |
| G | `DATE RAPPEL` | **calcul** RM-04 |
| H | `ELEMENT` | `element_id` |
| I | `ACTION` | `libelle` |
| J | `ACTEUR` | `acteur` |
| K | `STRUCTURE` | `pilote_employe_id` **ou** `pilote_partenaire_id` |
| L | `ASSIGNE A` | `assigne_a_employe_id` **ou** `assigne_a_partenaire_id` (selon l'acteur — D81) |
| M | `D.FIN PREVUE` | `date_fin_prevue` (`NULL` si quotidienne — D28) |
| N | `D.FIN` | `date_fin` (+ `cloture_le`) |
| O | `DUREE G.` | **calcul** RM-06 |
| P | `DUREE E.` | **calcul** RM-06 |
| Q | `COMMENTAIRE` | `commentaire.texte` |

**Bilan** : **16 colonnes sur 16** conservées ou reproduites par un calcul. **Aucune** n'est supprimée.

---

## 16. Points tranchés le 02/11/2026

Les **dix points** du modèle ont été tranchés lors de la validation du 02/11/2026 (**DÉCISIONS 34 à 43**).

| # | Point | Proposition | Décision | Bloque l'ÉTAPE 8 ? |
|---|---|---|---|---|
| **M7-01** | Service porteur calculé ou figé | **Calculé** (D29 + AR-05) ; conséquence documentée | ✅ **D34** | Non (règle fixée) |
| **M7-02** | Un responsable par service | **Contrôle applicatif transactionnel** | ✅ **D35** | Non (règle fixée) |
| **M7-03** | Suppression des tâches | **Logique** (`supprime_le`) | ✅ **D36** | Non (règle fixée) |
| **M7-04** | Commentaires | **Table d'historique** | ✅ **D37** | Non (règle fixée) |
| **M7-05** | Clôture : `date_fin` + `cloture_le` | **Deux colonnes** | ✅ **D38** | Non (règle fixée) |
| **M7-06** | `CONSULTANT` sans fiche employé | **`employe_id` nullable** | ✅ **D39** | Non |
| **M7-07** | Seed des 9 départements | **Insérer au démarrage** | ✅ **D40** | Non |
| **M7-08** | Doublon de libellé | **Avertissement**, pas de blocage | ✅ **D41** | Non (message à l'ÉTAPE 9) |
| **M7-09** | Conservation du journal d'audit | **Aucune purge** décidée | ✅ **D42** | Non |
| **P17** | Progression d'une tâche **quotidienne** | **0 / 100** seulement | ✅ **D43** | Non (règle fixée) |

> **Points restant ouverts et non bloquants pour l'ÉTAPE 8** : **aucun**. **P6**, **P13** et **P15** ont été clos le 02/11/2026 par les **DÉCISIONS 46, 45 et 48** (validation de l'ÉTAPE 8).

### 16.1 Progression d'une tâche quotidienne — ✅ **tranché (D43, option A)**

**Constat** : la DÉCISION 28 supprime `date_fin_prevue` pour une tâche quotidienne. La règle RM-02 calcule la progression entre `date_debut` et `date_fin_prevue` : elle **ne s'applique plus** à une quotidienne.

| Option | Règle | Avantage | Inconvénient |
|---|---|---|---|
| **A** ✅ **retenue** | Progression **0 %** tant que la tâche n'est pas clôturée, **100 %** après clôture | Simple, fidèle au comportement de l'Excel sur une tâche d'un jour, aucun calcul horaire | Pas de pourcentage intermédiaire |
| **B** | Pourcentage **intra-journalier** entre 08:00 et 16:30 | Plus fin | Invente une règle que l'Excel n'avait pas |
| **C** | Progression toujours `—` tant qu'aucune valeur manuelle n'existe | Très prudent | Perte d'information par rapport à l'Excel |

> **Conséquence pour l'ÉTAPE 8** : RM-02 s'applique telle quelle aux tâches `AUTRE` (formule temporelle sur `date_fin_prevue`) et devient **binaire** pour les tâches `QUOTIDIENNE`. La **progression manuelle reste prioritaire** dans les deux cas (D4).

---

## 17. Ce que l'ÉTAPE 7 ne fait pas

- Elle **ne crée aucune base**, aucun fichier `schema.prisma`, aucune migration, aucun script de seed.
- Elle **ne crée aucun dossier** `client\`, `server\` ou `prisma\`.
- Elle **ne définit pas** les endpoints, DTO, codes HTTP et validations d'entrée → **ÉTAPE 8**.
- Elle **ne définit pas** les composants d'interface → **ÉTAPE 9**.
- Elle **ne détaille pas** les sessions, mots de passe et verrouillages → **ÉTAPE 13**.
- Elle **ne reprend aucune donnée** de l'Excel → **D11**.
- Elle **ne tranche aucun point** : les points **M7-01 à M7-09** et **P17** ont été tranchés **par le directeur** le 02/11/2026 (DÉCISIONS 34 à 43), pas par ce document.

---

## 18. Validation obtenue

✅ **Validation obtenue le 02/11/2026.** Le directeur a validé le modèle et tranché les points ouverts :

1. les **14 tables**, leurs **colonnes**, **types** et **nullités** ;
2. les **contraintes** (notamment `ck_tache_nature`, `ck_tache_pilote`, `ck_tache_motif` et la **clé étrangère composée** vers la matrice) ;
3. le principe que les **champs calculés** (section 8) ne sont **jamais stockés** ;
4. les **règles de suppression et de désactivation** (section 10) ;
5. les **index** et la stratégie de performance ;
6. le **journal d'audit** append-only et la table de **commentaires** ;
7. les **données initiales** (section 13), notamment les **13 lignes de la matrice** et les **15 fériés 2026** ;
8. les points **M7-01 à M7-09** et **P17**, tranchés le 02/11/2026 (**DÉCISIONS 34 à 43**) ;
9. les **prérequis PostgreSQL** (section 14.1), à vérifier au démarrage de l'ÉTAPE 8.

> L'**ÉTAPE 8** (API Node.js / Express) peut désormais être engagée.
> **Aucun code, aucune migration, aucune base ne sera créé avant la validation de l'ÉTAPE 8.**
> Points restant ouverts et **non bloquants** : **aucun** — **P6**, **P13** et **P15** sont clos depuis le 02/11/2026 (**D46, D45, D48**).

---

## 19. Journal des révisions

| Date | Section(s) | Modification | Statut |
|---|---|---|---|
| 02/11/2026 | §1.4, §5.3, §6.5, §7, §8, §9, §10.1, §13, §16, §17, §18 | **VALIDATION DU DIRECTEUR** : modèle validé ; points **M7-01 à M7-09** et **P17** tranchés (**DÉCISIONS 34 à 43**) ; service porteur calculé, contrôle applicatif du responsable unique, suppression logique, commentaires historisés, `date_fin` + `cloture_le`, consultant sans fiche, seed des 9 départements, avertissement de doublon, audit sans purge, progression binaire des quotidiennes. | ✅ **Validée le 02/11/2026** |
| 02/11/2026 | §1.5, §2, §5.3, §10, §13, §16, §18 | **Validation de l'ÉTAPE 8** : **P6**, **P13** et **P15** clos par les **DÉCISIONS 46** (longueurs), **45** (motif) et **48** (département avec responsable). Aucune modification du schéma : les bornes de longueur restent contrôlées par l'API et le `text` est conservé en base. | ✅ **Mis à jour le 02/11/2026** |
| 02/11/2026 | Document entier | Création du livrable 06 (ÉTAPE 7) : conventions, 14 tables, énumérations, contraintes, clé étrangère composée vers la matrice (**D31**), index, règles de suppression, audit append-only, données initiales, stratégie de migration, traçabilité, points **M7-01 à M7-09** et nouveau point **P17**. Prise en compte de **D28** (journée unique) et **D29** (service porteur calculé). | ✅ **Validée le 02/11/2026** |
