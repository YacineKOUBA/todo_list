# Livrable 07 — ÉTAPE 8 : API Node.js / Express

| | |
|---|---|
| **Projet** | Application web de gestion des TODOLIST — GD Trading |
| **Livrable** | 07 (méthode M8) |
| **Étape** | **8 — API Node.js / Express** |
| **Documents de référence** | `docs\01_ANALYSE_FONCTIONNELLE.md` (ÉTAPES 1-2) · `docs\02_EXIGENCES_DIRECTEUR.md` (ÉTAPE 3) · `docs\03_COMPARAISON_EXCEL_EXIGENCES.md` (ÉTAPE 4) · `docs\05_CAHIER_DES_CHARGES_FONCTIONNEL.md` (ÉTAPE 5) · `docs\04_ARCHITECTURE_APPLICATION.md` (ÉTAPE 6) · `docs\06_MODELE_DE_DONNEES.md` (ÉTAPE 7) |
| **Décisions de référence** | **DÉCISIONS 1 à 81** — les **D72 à D75** (ÉTAPE 12) complètent les règles de comptes et de désactivation sans modifier les 54 endpoints ; **D81** (05/11/2026) ajoute l'assignation polymorphe employé / partenaire · **AR-01 à AR-13** · **T8-01 à T8-15** |
| **Stack** | Node.js + Express + TypeScript · Prisma · PostgreSQL (D9) |
| **Préfixe d'API** | `/api/v1` |
| **Date de rédaction** | 02/11/2026 |
| **Statut** | ✅ **VALIDÉE le 02/11/2026** — contrats arrêtés, points **A8-01 à A8-14** tranchés (**D44 à D57**), **aucun code écrit**, aucun dossier `client\`, `server\` ou `prisma\` créé |

> **Règle M2** : ce document **traduit** les exigences validées et le modèle validé en contrats HTTP. Il ne prend **aucune décision métier** nouvelle.
> **Règle M5** : les points qui exigeaient un arbitrage ont été numérotés **A8-01 à A8-14** puis tranchés le 02/11/2026 (**D44 à D57**, section 15).
> **Aucun code n'a été écrit. Aucune dépendance n'a été installée. Aucune base n'a été créée.**

---

## 1. Objet et périmètre

### 1.1 Objet

Ce document définit **le contrat d'interface** entre l'interface React (ÉTAPE 9) et le serveur Node.js / Express :

- les **familles d'endpoints**, leurs chemins, méthodes et paramètres ;
- les **objets échangés** (DTO de lecture et d'écriture) ;
- les **règles d'autorisation** appliquées route par route ;
- les **codes HTTP** et le **catalogue d'erreurs** stable ;
- la **pagination**, le **tri** et les **filtres** ;
- les **règles de validation** serveur, y compris celles qui ne peuvent pas être portées par PostgreSQL ;
- les **points d'audit** déclenchés par chaque écriture ;
- les **transactions** et la **concurrence**.

### 1.2 Ce que ce document ne fait pas

| Non couvert | Étape |
|---|---|
| Composants, maquettes, navigation, charte appliquée | ÉTAPE 9 |
| Implémentation détaillée de la politique de droits (code) | ÉTAPE 10 |
| Import de données | ÉTAPE 11 — **aucune reprise Excel** (D11) |
| Tests automatisés et jeux de données | ÉTAPE 12 |
| Mots de passe, sessions, verrouillage, CSRF, en-têtes, limitation | ÉTAPE 13 |
| Installation, sauvegarde, restauration, supervision | ÉTAPE 14 |
| Manuel utilisateur et administration | ÉTAPE 15 |
| Schéma Prisma, migrations, seed, code serveur | **Après validation de cette étape** |

### 1.3 Ce que l'API ne fait pas

- elle **ne recalcule pas** les règles à la place des moteurs de domaine : les moteurs restent **purs** et appelés par la couche service (AR-05) ;
- elle **ne stocke aucun champ calculé** (statut, progression, priorité, score, fréquence, rappel, durées, service porteur) ;
- elle **ne réintroduit aucune donnée Excel** : la table `tache` démarre vide (D11) ;
- elle **n'expose aucun secret** : ni mot de passe, ni hash, ni jeton de session dans un DTO ou un journal.

---

## 2. Conventions

### 2.1 Base, versionnement et média

| Sujet | Convention |
|---|---|
| Base | `/api/v1` |
| Transport | HTTPS en recette et production (ÉTAPE 14) |
| Format | JSON UTF-8, `Content-Type: application/json` |
| Média d'erreur | `application/problem+json` (RFC 9457) |
| Authentification | **Cookie de session opaque** `HttpOnly`, `Secure`, `SameSite=Strict` — jamais de jeton dans `localStorage` (architecture §10) |
| CSRF | Jeton exigé sur toute écriture ; détail et mécanique à l'ÉTAPE 13 (**P12**) |
| CORS | Aucun CORS ouvert : SPA servie par le même serveur ; en développement, proxy Vite |
| Compression | `gzip` / `br` si le client l'accepte |
| Taille maximale du corps | **1 Mo** par défaut (413 au-delà) — valeur technique, ajustable à l'ÉTAPE 14 |

### 2.2 Dates, heures et fuseau

| Type | Format | Exemple | Remarque |
|---|---|---|---|
| **Date métier** | `AAAA-MM-JJ` | `2026-11-02` | Toujours **calendaire**, jamais un instant |
| **Horodatage technique** | ISO 8601 UTC, suffixe `Z` | `2026-11-02T15:30:00Z` | `creeLe`, `modifieLe`, `clotureLe`, audit |
| **Heure de paramètre** | `HH:MM` | `16:30` | Interprétée dans le fuseau de l'application |
| **Fuseau de calcul** | `Africa/Algiers` (UTC+1) | — | **D30** ; toute règle horaire (16h30, jour ouvré) est évaluée **côté serveur** avec ce fuseau |
| **Date affichée** | `JJ/MM/AAAA` | `02/11/2026` | Conversion faite par l'interface (ÉTAPE 9), pas par l'API |

> **Règle** : le client **ne fournit jamais** l'heure courante, le fuseau, ni un indicateur « en retard ». Le serveur les détermine. Un champ d'horodatage envoyé par le client est **rejeté** (`CHAMP_INCONNU`).

### 2.3 Identifiants

- Tous les identifiants métier sont des **UUID v4** sous forme de chaîne (`"9f1c…"`).
- L'identifiant du journal d'audit est un entier (`bigserial`), exposé comme nombre.
- Aucun identifiant technique de séquence n'est exposé pour les entités métier.

### 2.4 Enveloppe des réponses

**Objet unique** : l'objet est renvoyé **directement**, sans enveloppe.

```json
{
  "id": "…",
  "libelle": "…"
}
```

**Liste** : enveloppe `elements` + `pagination`.

```json
{
  "elements": [],
  "pagination": {
    "page": 1,
    "taille": 50,
    "total": 0,
    "nombrePages": 0
  }
}
```

**Avertissements non bloquants** : enveloppe `avertissements` ajoutée à la réponse d'écriture concernée (doublon de libellé, **D41**). Un avertissement **n'empêche jamais** l'enregistrement.

```json
{
  "…": "objet renvoyé",
  "avertissements": [
    { "code": "LIBELLE_DEJA_UTILISE", "message": "Un libellé identique existe déjà sur une tâche active." }
  ]
}
```

> Pour ne pas mélanger objet et métadonnées, les réponses portant un avertissement utilisent l'enveloppe `donnees` + `avertissements`. Les autres réponses d'objet unique restent directes.

### 2.5 Nommage JSON et enums

- JSON en **camelCase** ; la base reste en `snake_case` (mappage Prisma).
- Enums exposés en **MAJUSCULES_SNAKE** : `QUOTIDIENNE`, `AUTRE`, `GD_TRADING`, `PARTENAIRE`, `ANNULEE`, `SUSPENDUE`, `ADMIN`, `RESPONSABLE`, `EMPLOYEE`, `CONSULTANT`.
- Les **libellés français** sont renvoyés **à côté du code** quand l'interface en a besoin (`statut.libelle`, `priorite.libelle`). Ils ne sont jamais la clé de décision.

---

## 3. Authentification et session

### 3.1 Principes

| Sujet | Règle | Référence |
|---|---|---|
| Ouverture | Identifiant + mot de passe → session serveur opaque | EF-01 |
| Compte inactif | Connexion **refusée**, message **générique** | EF-02, EF-10 |
| Message d'échec | Toujours `IDENTIFIANTS_INVALIDES` : ne révèle **jamais** si le compte existe, est inactif ou verrouillé | EF-10 |
| Session | Stockée en base, révocable immédiatement à la désactivation | Architecture §10, D12 |
| Cookie | `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/api` | Architecture §10 |
| Changement forcé | Si `doitChangerMotDePasse = true`, seules `/auth/password`, `/me` et `/auth/logout` sont accessibles ; les autres routes répondent **403** `CHANGEMENT_MOT_DE_PASSE_REQUIS` | EF-09 |
| Déconnexion | Détruit la session serveur et efface le cookie | EF-01, UC-18 |

> **P12 reste ouvert** : durée de session, complexité des mots de passe, première connexion, verrouillage après échecs et mécanique CSRF sont fixés à l'**ÉTAPE 13**. Les contrats ci-dessous n'en dépendent pas.

### 3.2 Endpoints d'authentification

| Méthode | Chemin | Accès | Description | Succès |
|---|---|---|---|---|
| `POST` | `/auth/login` | Public | Ouvre une session | `200` + cookie |
| `POST` | `/auth/logout` | Authentifié | Détruit la session | `204` |
| `GET` | `/auth/csrf` | Authentifié | Fournit un jeton anti-CSRF | `200` |
| `POST` | `/auth/password` | Authentifié | Change le mot de passe | `204` |

#### `POST /auth/login`

```json
{
  "identifiant": "j.dupont",
  "motDePasse": "…"
}
```

**Réponse `200`** : objet `Me` (section 7.5) + cookie de session.

| Code | Erreur | Cas |
|---|---|---|
| `400` | `REQUETE_INVALIDE` | Corps mal formé, champ manquant |
| `401` | `IDENTIFIANTS_INVALIDES` | Identifiant inconnu, mot de passe faux, compte inactif ou verrouillé |
| `429` | `TROP_DE_TENTATIVES` | Limitation (ÉTAPE 13) |
| `503` | `BASE_INDISPONIBLE` | Base inaccessible |

> Le message de `401` est **strictement identique** dans tous les cas. Aucune distinction de délai ou de texte ne doit permettre de deviner l'existence du compte (EF-10).

#### `POST /auth/password`

```json
{
  "ancienMotDePasse": "…",
  "nouveauMotDePasse": "…"
}
```

| Code | Erreur | Cas |
|---|---|---|
| `204` | — | Mot de passe changé ; `doitChangerMotDePasse` repasse à `false` |
| `401` | `AUTHENTIFICATION_REQUISE` | Session absente ou expirée |
| `422` | `MOT_DE_PASSE_INVALIDE` | Règles de complexité non respectées (ÉTAPE 13) |
| `422` | `MOT_DE_PASSE_IDENTIQUE` | Nouveau mot de passe identique à l'ancien |

#### `GET /auth/csrf`

```json
{ "jeton": "…" }
```

> Le jeton est exigé dans l'en-tête `X-CSRF-Token` de toute requête `POST`, `PATCH`, `PUT` ou `DELETE`. La mécanique exacte (double soumission ou jeton lié à la session) est tranchée à l'**ÉTAPE 13**.

### 3.3 Profil courant

#### `GET /me`

| Accès | Succès | Échec |
|---|---|---|
| Authentifié | `200` | `401 AUTHENTIFICATION_REQUISE` |

**Réponse `200`** : objet `Me` (section 7.5). Utilisé au chargement de la SPA pour restaurer la session et obtenir les droits calculés.

> Aucun paramètre. Aucune donnée d'un autre utilisateur n'est accessible par cette route.

---

## 4. Autorisation

### 4.1 Politique centralisée

Un **module unique** applique les décisions ; aucun contrôle n'est dupliqué dans les contrôleurs.

| Fonction | Décide |
|---|---|
| `peutVoirTache(utilisateur, tache)` | Périmètre de lecture (section 4.2) |
| `peutCreerTache(utilisateur, cible)` | Périmètre de création (section 4.3) |
| `peutModifierTache(utilisateur, tache)` | Écriture dans le périmètre |
| `peutSupprimerTache(utilisateur, tache)` | D7 / RM-11 |
| `peutCommenter(utilisateur, tache)` | Même périmètre que la modification |
| `peutGererReferentiels(utilisateur)` | `ADMIN` uniquement |
| `peutGererComptes(utilisateur)` | `ADMIN` uniquement |
| `peutConsulterAudit(utilisateur)` | `ADMIN` uniquement |

### 4.2 Périmètre de lecture (RM-10)

| Rôle | Tâches visibles |
|---|---|
| `ADMIN` | Toutes |
| `CONSULTANT` | Toutes, **lecture seule** |
| `RESPONSABLE` | Tâches dont le **service porteur** est son département **+** ses propres tâches (assignées, pilotées, créées) |
| `EMPLOYEE` | Ses propres tâches : assignées **ou** pilotées **ou** créées (**A13**, D16) |

**Service porteur** = département de l'exécutant ; à défaut, département du pilote ; sinon aucun (**D29**). Il est **calculé**, jamais stocké.

### 4.3 Périmètre d'écriture (D13, D25, D33)

| Rôle | Peut créer pour | Peut désigner comme exécutant | Peut désigner comme pilote |
|---|---|---|---|
| `ADMIN` | Tout le monde | Tout employé | Employé ou partenaire |
| `RESPONSABLE` | Employés de son département + lui-même | Membre de son département ou lui-même | **D47** (membre de son département ou lui-même ; partenaire interdit) |
| `EMPLOYEE` | Lui-même uniquement | Lui-même | **D47** (lui-même ; partenaire interdit) |
| `CONSULTANT` | Personne | — | — |

**Modification du titulaire** : reste dans le **périmètre de création**. Un employé ne peut pas réaffecter sa tâche à un collègue ; un responsable ne peut pas l'affecter hors de son département (CDC §3.2).

**Modification / commentaire / clôture** : mêmes périmètres que la lecture, **hors** `CONSULTANT` qui n'écrit jamais (EF-07).

**Suppression** :

| Rôle | Peut supprimer |
|---|---|
| `ADMIN` | Toute tâche |
| `RESPONSABLE` | **Uniquement** les tâches qu'il a **lui-même attribuées** (`attribueParId = lui`) |
| `EMPLOYEE` | Aucune |
| `CONSULTANT` | Aucune |

### 4.4 `403` ou `404` — règle de non-divulgation

| Situation | Réponse | Raison |
|---|---|---|
| La tâche **n'est pas dans le périmètre de lecture** | **`404` `RESSOURCE_INTROUVABLE`** | Ne pas révéler l'existence d'une tâche d'un autre service |
| La tâche est **visible**, mais l'action est interdite (ex. employé qui supprime sa tâche, consultant qui commente) | **`403` `ACTION_NON_AUTORISEE`** | L'utilisateur sait que la tâche existe |
| Route réservée à un rôle (référentiels, comptes, audit) | **`403` `ACTION_NON_AUTORISEE`** | Le rôle est connu |

> Un `404` ne signifie donc pas nécessairement « inexistant » : il signifie « inexistant **ou** hors périmètre ». C'est volontaire (EF-03, CA-03).

### 4.5 Matrice route × rôle

| Route | `ADMIN` | `RESPONSABLE` | `EMPLOYEE` | `CONSULTANT` |
|---|---|---|---|---|
| `GET /tasks` | ✅ toutes | ✅ service + propres | ✅ propres | ✅ toutes |
| `POST /tasks` | ✅ | ✅ périmètre | ✅ lui-même | ❌ |
| `GET /tasks/:id` | ✅ | ✅ si visible | ✅ si visible | ✅ |
| `PATCH /tasks/:id` | ✅ | ✅ si éditable | ✅ si éditable | ❌ |
| `DELETE /tasks/:id` | ✅ | ✅ si attribuée par lui | ❌ | ❌ |
| `PATCH /tasks/:id/status` | ✅ | ✅ si éditable | ✅ si éditable | ❌ |
| `PATCH /tasks/:id/progress` | ✅ | ✅ si éditable | ✅ si éditable | ❌ |
| `POST /tasks/:id/close` | ✅ | ✅ si éditable | ✅ si éditable | ❌ |
| `POST /tasks/:id/duplicate` | ✅ | ✅ périmètre | ✅ lui-même | ❌ |
| `GET/POST /tasks/:id/comments` | ✅ | ✅ si visible | ✅ si visible | ✅ / ❌ |
| `GET /tasks/:id/history` | ✅ | ✅ si visible | ✅ si visible | ✅ |
| `GET /employees` | ✅ | ✅ | ✅ | ✅ |
| `POST/PATCH /employees` | ✅ | ❌ | ❌ | ❌ |
| `GET /departments`, `/partners`, `/elements`, `/holidays`, `/settings` | ✅ | ✅ | ✅ | ✅ |
| Écriture référentiels | ✅ | ❌ | ❌ | ❌ |
| `GET /accounts`, écriture comptes | ✅ | ❌ | ❌ | ❌ |
| `GET /audit-events` | ✅ | ❌ | ❌ | ❌ |
| `GET /me` | ✅ | ✅ | ✅ | ✅ |
| `GET /health` | Public | Public | Public | Public |

---

## 5. Erreurs

### 5.1 Format `problem+json`

```json
{
  "type": "https://gd-trading.local/erreurs/COMBINAISON_PRIORITE_INVALIDE",
  "title": "Combinaison de priorité invalide",
  "status": 422,
  "code": "COMBINAISON_PRIORITE_INVALIDE",
  "detail": "La combinaison « Pas urgent » × « Critique » n'existe pas dans la matrice.",
  "instance": "/api/v1/tasks",
  "erreurs": [
    { "champ": "importanceId", "code": "VALEUR_NON_AUTORISEE", "message": "Combinaison absente de la matrice." }
  ]
}
```

| Champ | Rôle |
|---|---|
| `type` | URI stable dérivée du code (documentation) |
| `title` | Libellé court et stable |
| `status` | Code HTTP, répété pour les clients qui ne lisent que le corps |
| `code` | **Code stable** utilisé par l'interface — ne change jamais sans version d'API |
| `detail` | Message lisible en français, sans donnée sensible |
| `instance` | Chemin appelé |
| `erreurs` | Liste facultative de champs fautifs (validation) |

> Le champ `code` est **la seule clé de traitement** côté interface. Un `detail` peut être reformulé ; un `code` non.

### 5.2 Catalogue d'erreurs

#### Authentification et session

| Code | HTTP | Sens |
|---|---|---|
| `AUTHENTIFICATION_REQUISE` | `401` | Aucune session valide |
| `SESSION_EXPIREE` | `401` | Session expirée, révoquée ou compte désactivé |
| `IDENTIFIANTS_INVALIDES` | `401` | Échec de connexion — message générique (EF-10) |
| `CHANGEMENT_MOT_DE_PASSE_REQUIS` | `403` | Première connexion non finalisée (EF-09) |
| `JETON_CSRF_INVALIDE` | `403` | Jeton absent ou invalide |
| `TROP_DE_TENTATIVES` | `429` | Limitation de tentatives (ÉTAPE 13) |
| `MOT_DE_PASSE_INVALIDE` | `422` | Complexité non respectée |
| `MOT_DE_PASSE_IDENTIQUE` | `422` | Ancien et nouveau identiques |

#### Autorisation et ressource

| Code | HTTP | Sens |
|---|---|---|
| `ACTION_NON_AUTORISEE` | `403` | Rôle ou droit insuffisant sur une ressource visible |
| `RESSOURCE_INTROUVABLE` | `404` | Inexistante **ou** hors périmètre (section 4.4) |
| `METHODE_NON_AUTORISEE` | `405` | Méthode non exposée (ex. `DELETE /employees/:id`) |

#### Validation d'entrée

| Code | HTTP | Sens |
|---|---|---|
| `REQUETE_INVALIDE` | `400` | JSON mal formé, type incorrect, paramètre de requête invalide |
| `CHAMP_INCONNU` | `400` | Champ non prévu par le contrat (rejet strict) |
| `CHAMP_OBLIGATOIRE` | `422` | Champ requis absent |
| `VALEUR_INVALIDE` | `422` | Valeur hors bornes autorisées (longueur, format, énumération) |
| `DATE_INCOHERENTE` | `422` | Ordre des dates invalide (RM-15) |
| `NATURE_INVALIDE` | `422` | `QUOTIDIENNE` sans date unique, ou `AUTRE` sans `dateFinPrevue` (D28) |
| `PILOTE_INVALIDE` | `422` | Acteur et type de pilote incohérents (EF-26) |
| `COMBINAISON_PRIORITE_INVALIDE` | `422` | Couple urgence × importance absent de la matrice (D31) |
| `TACHE_QUOTIDIENNE_HORS_DELAI` | `422` | Création après 16h30 (D32) |
| `TACHE_QUOTIDIENNE_JOUR_NON_OUVRE` | `422` | Création un vendredi, samedi ou jour férié (D32) |
| `MOTIF_OBLIGATOIRE` | `422` | Clôture tardive sans motif (D15) |
| `PROGRESSION_INVALIDE` | `422` | Valeur hors 0-100 ou non entière |
| `TACHE_DEJA_CLOTUREE` | `409` | Clôture d'une tâche déjà clôturée |
| `VERSION_OBSOLETE` | `409` | Écriture concurrente détectée |
| `TRI_NON_SUPPORTE` | `422` | Tri demandé sur un champ calculé (section 6.3) |
| `EMPLOYE_INACTIF` | `422` | Titulaire inactif — **D49** |
| `ASSIGNE_INVALIDE` | `422` | Assigné absent, des deux types à la fois, ou incompatible avec l'acteur — **D81** |
| `PARTENAIRE_INACTIF` | `422` | Partenaire référencé inactif — **D81** |

#### Unicité et intégrité

| Code | HTTP | Sens |
|---|---|---|
| `IDENTIFIANT_DEJA_UTILISE` | `409` | Identifiant de connexion déjà pris |
| `COMPTE_DEJA_LIE` | `409` | Cet employé possède déjà un compte (D12) |
| `RESPONSABLE_DEJA_PRESENT` | `409` | Département ayant déjà un responsable (A12, D35) |
| `RESPONSABLE_SANS_DEPARTEMENT` | `422` | Rôle `RESPONSABLE` sans département (EF-05) |
| `REFERENTIEL_REFERENCE` | `409` | Suppression refusée : élément utilisé par une tâche |
| `DEPARTEMENT_AVEC_RESPONSABLE` | `409` | Suppression ou désactivation refusée — **D48** |
| `DERNIER_ADMIN` | `409` | Retrait du rôle ou désactivation du **dernier compte `ADMIN` actif** — **D72** |
| `AUTO_MODIFICATION_INTERDITE` | `403` | Un `ADMIN` ne peut pas modifier son propre rôle ni se désactiver — **D75** |
| `FERIE_DEJA_PRESENT` | `409` | Date déjà présente dans le calendrier |
| `PARAMETRE_INVALIDE` | `422` | Paramètres incohérents (ordre des heures, week-end) |

#### Technique

| Code | HTTP | Sens |
|---|---|---|
| `CHARGE_TROP_VOLUMINEUSE` | `413` | Corps supérieur à la limite |
| `TYPE_MEDIA_NON_SUPPORTE` | `415` | `Content-Type` autre que JSON |
| `ERREUR_INTERNE` | `500` | Erreur non prévue — **aucun détail technique** renvoyé |
| `BASE_INDISPONIBLE` | `503` | PostgreSQL injoignable |

> **Aucune trace technique, requête SQL, nom de table ou secret** n'apparaît dans une réponse d'erreur. Les détails partent dans les journaux serveur, jamais dans le corps HTTP.

---

## 6. Pagination, tri et filtres

### 6.1 Pagination

| Paramètre | Défaut | Bornes | Remarque |
|---|---|---|---|
| `page` | `1` | ≥ 1 | Numérotation à partir de 1 |
| `taille` | `50` | 1 à 200 | Au-delà : `400 REQUETE_INVALIDE` |

La réponse contient `pagination.page`, `pagination.taille`, `pagination.total`, `pagination.nombrePages`.

> **Décision technique T8-04** : la pagination **`page` / `taille`** de l'architecture validée est retenue. Le document 06 mentionnait une pagination `keyset` comme objectif de performance : elle est **différée** ; si le volume l'exige (section 12), elle sera introduite sans changer les DTO, via un paramètre `curseur` optionnel.

### 6.2 Filtres communs aux listes de tâches

| Paramètre | Type | Effet |
|---|---|---|
| `vue` | enum | `mes-taches-du-jour` · `mes-autres-taches` · `mes-taches` · `service` · `toutes` (défaut `mes-taches`) |
| `statut` | liste de codes | `A_FAIRE`, `EN_COURS`, `RETARD`, `ACHEVEE`, `ANNULEE`, `SUSPENDUE` |
| `nature` | enum | `QUOTIDIENNE` · `AUTRE` |
| `departementId` | uuid | Service porteur |
| `assigneAId` | uuid | Exécutant : employé **ou** partenaire (filtre générique sur les deux colonnes — D81) |
| `piloteEmployeId` | uuid | Pilote interne |
| `pilotePartenaireId` | uuid | Pilote externe |
| `elementId` | uuid | Élément / pilier |
| `urgenceId`, `importanceId` | uuid | Filtres de priorité |
| `echeanceDu`, `echeanceAu` | date | Borne sur `dateFinPrevue` (ou `dateAction` pour une quotidienne) |
| `rappelEchu` | booléen | Date de rappel dépassée (EF-50) |
| `rappelImminent` | booléen | Rappel dans J+1 à J+5 (EF-50) |
| `libelle` | texte | Recherche « contient », insensible à la casse et aux accents |
| `supprimees` | booléen | Tâches supprimées logiquement — **`ADMIN` uniquement** |

**Définition des vues** :

| `vue` | Contenu | Rôles |
|---|---|---|
| `mes-taches-du-jour` | Tâches où je suis assigné, pilote ou créateur ; `dateAction` = aujourd'hui ; non clôturées ; non annulées (EF-41) | Tous avec fiche employé |
| `mes-autres-taches` | Tâches `AUTRE` **qui me sont assignées**, non clôturées, non annulées (EF-42, D19) | Tous avec fiche employé |
| `mes-taches` | Assignées + pilotées + créées (A13, EF-43) | Tous avec fiche employé |
| `service` | Tâches dont le service porteur est mon département (EF-44) ; l'admin peut préciser `departementId` | `RESPONSABLE`, `ADMIN` |
| `toutes` | Toutes les tâches (EF-45, EF-46) | `ADMIN`, `CONSULTANT` |

> Un `CONSULTANT` qui demande une autre vue reçoit `403`. Un `EMPLOYEE` qui demande `service` ou `toutes` reçoit `403`. Un `ADMIN` sans fiche employé (**D20** l'exclut) ne peut pas utiliser les vues `mes-*`.

### 6.3 Tri

| Paramètre | Format | Défaut |
|---|---|---|
| `tri` | `champ:asc` ou `champ:desc`, répétable | `dateAction:asc`, puis `libelle:asc` |

**Champs triables** : `dateAction`, `dateDebut`, `dateFinPrevue`, `dateFin`, `libelle`, `creeLe`, `modifieLe`, `score`.

> `score` n'est pas stocké sur `tache` (AR-05) : le tri s'appuie sur une **jointure** `tache.urgence_id, tache.importance_id → matrice_priorite` (clé primaire composite), donc entièrement indexé et compatible avec la pagination. Aucun tri n'est fait en mémoire.

**Champs non triables** (calculés) : `statut`, `progression`, `dateRappel`, `dureeGJours`, `dureeEJours`, `servicePorteur`. Un tri sur ces champs renvoie `422 TRI_NON_SUPPORTE`.

> **Décision technique T8-08** : autoriser un tri serveur sur une valeur calculée donnerait une pagination **fausse** (le statut change le lendemain, le rappel dépend de l'heure). Le tri sur ces champs est donc refusé, et non simulé en mémoire.

### 6.4 Filtre par statut et pagination — limite connue

Le statut est **calculé** (AR-05). Un filtre `statut=RETARD` ne peut pas être un `WHERE` indexé pur :

1. le serveur sélectionne les candidates avec des prédicats de **dates** et `statutManuel` (index partiels du modèle) ;
2. il calcule le statut des candidates ;
3. il filtre, trie et pagine **après** calcul.

**Conséquences** : le `total` est exact pour le périmètre filtré, mais le coût croît avec le nombre de candidates. Au-delà de **50 000 tâches ouvertes**, une colonne de statut recalculée par tâche planifiée ou une vue matérialisée sera nécessaire. Aucune décision ne l'impose aujourd'hui (volume estimé : section 12 du livrable 06).

---

## 7. Contrats de données (DTO)

### 7.1 `TacheListe`

| Champ | Type | Null | Remarque |
|---|---|---|---|
| `id` | uuid | non | — |
| `libelle` | string | non | — |
| `nature` | enum | non | `QUOTIDIENNE` / `AUTRE` |
| `statut` | objet | non | `{ code, libelle, manuel }` |
| `progression` | entier | oui | 0-100, `null` = « — » |
| `priorite` | objet | non | `{ libelle, score, frequenceJours }` |
| `dateAction` | date | non | — |
| `dateFinPrevue` | date | oui | `null` pour une quotidienne (D28) |
| `dateFin` | date | oui | — |
| `assigneA` | objet | non | `{ type: 'EMPLOYE' \| 'PARTENAIRE', id, libelle, departement }` — `departement` toujours `null` pour un partenaire (D81) |
| `pilote` | objet | non | `{ type, id, libelle }` |
| `servicePorteur` | objet | oui | `{ id, libelle }` — calculé (D29) |
| `dateRappel` | date | oui | Calculée (RM-04) |
| `estEnRetard` | booléen | non | — |
| `rappelEchu` | booléen | non | EF-50 |
| `rappelImminent` | booléen | non | EF-50 |
| `version` | entier | non | Verrouillage optimiste |

### 7.2 `TacheDetail`

`TacheListe` **plus** :

| Champ | Type | Null | Remarque |
|---|---|---|---|
| `element` | objet | non | `{ id, libelle }` |
| `acteur` | enum | non | `GD_TRADING` / `PARTENAIRE` |
| `dateDebut` | date | non | — |
| `clotureLe` | horodatage | oui | Horodatage réel (D38) |
| `urgence` | objet | non | `{ id, libelle }` |
| `importance` | objet | non | `{ id, libelle }` |
| `actionAPrendre` | objet | oui | `{ id, libelle }` |
| `statutManuel` | enum | oui | `ANNULEE` / `SUSPENDUE` / `null` |
| `progressionManuelle` | entier | oui | 0-100 |
| `progressionSurchargee` | booléen | non | `true` si la progression manuelle prime sur le calcul |
| `dateMiseAJour` | horodatage | oui | Dernière mise à jour technique, automatique |
| `dateControle` | date | oui | Date réelle de l'entretien / contrôle de progression (saisie manuelle) |
| `motifNonAchevement` | string | oui | Visible par tous les ayants droit (**D52**) |
| `dureeGJours` | entier | oui | RM-06 |
| `dureeEJours` | entier | oui | RM-06 ; `null` pour une quotidienne |
| `anomalieDuree` | booléen | non | `min(dateFin, dateFinPrevue) < dateDebut` |
| `creePar` | objet | non | `{ id, nomComplet }` |
| `attribuePar` | objet | non | `{ id, nomComplet }` |
| `creeLe` | horodatage | non | — |
| `modifieLe` | horodatage | non | — |
| `supprimeLe` | horodatage | oui | `null` sauf vue admin des supprimées |

### 7.3 Codes et libellés de statut

| Code | Libellé | Origine |
|---|---|---|
| `A_FAIRE` | `A faire` | Calculé (RM-01) |
| `EN_COURS` | `En cours` | Calculé |
| `RETARD` | `Retard` | Calculé |
| `ACHEVEE` | `Achevée` | Calculé |
| `ANNULEE` | `Annulée` | Manuel (D3) |
| `SUSPENDUE` | `Suspendue` | Manuel (D3) |

> `A faire` reste **sans accent**, conformément à l'Excel et au CDC. L'interface peut l'afficher tel quel ; elle ne doit pas s'en servir comme clé.

### 7.4 Objets de référence

| Objet | Champs |
|---|---|
| `Departement` | `id`, `libelle`, `actif`, `responsable` (`{id, nomComplet}` ou `null`) |
| `Employe` | `id`, `nom`, `prenom`, `nomComplet`, `email` (admin uniquement), `departement` (objet ou `null`), `actif` |
| `Partenaire` | `id`, `libelle`, `actif` |
| `Element` | `id`, `libelle`, `ordre`, `actif` |
| `Urgence` / `Importance` | `id`, `libelle`, `ordre` |
| `LigneMatrice` | `urgence`, `importance`, `score`, `frequenceJours`, `priorite` (libellé) |
| `ActionAPrendre` | `id`, `libelle`, `actif` |
| `JourFerie` | `id`, `jour`, `libelle` |
| `Parametres` | `fuseau`, `weekendJours`, `heureDebutJournee`, `pauseDebut`, `pauseFin`, `heureEcheanceQuotidienne`, `modifieLe` |
| `Commentaire` | `id`, `tacheId`, `auteur` (`{id, nomComplet}`), `texte`, `creeLe` |
| `EvenementAudit` | `id`, `horodatage`, `typeOperation`, `acteur`, `entite`, `entiteId`, `donneesAvant`, `donneesApres` |
| `EvenementHistorique` | `id`, `horodatage`, `typeOperation`, `acteur`, `champsModifies` — **sans valeurs avant/après** (**D53**) |

### 7.5 `Me`

```json
{
  "utilisateur": {
    "id": "…",
    "identifiant": "j.dupont",
    "role": "EMPLOYEE",
    "actif": true,
    "doitChangerMotDePasse": false
  },
  "employe": {
    "id": "…",
    "nom": "DUPONT",
    "prenom": "Jean",
    "nomComplet": "Jean DUPONT",
    "email": "j.dupont@…",
    "departement": { "id": "…", "libelle": "COMPTABILITE" }
  },
  "droits": {
    "voirToutesLesTaches": false,
    "voirTachesService": false,
    "creerPourAutrui": false,
    "creerPourSonService": false,
    "supprimerTouteTache": false,
    "supprimerTachesAttribuees": false,
    "gererReferentiels": false,
    "gererComptes": false,
    "consulterAudit": false,
    "lectureSeule": false
  }
}
```

> `employe` peut être `null` pour un `CONSULTANT` sans fiche employé (**D39**). Les `droits` sont **calculés par le serveur** ; l'interface les utilise pour masquer des actions, jamais pour les autoriser.

---

## 8. Endpoints

### 8.1 Santé

#### `GET /health`

| Accès | Succès | Échec |
|---|---|---|
| Public | `200` | `503` |

```json
{ "statut": "ok", "base": "ok", "version": "1.0.0" }
```

> Aucune donnée métier, aucun nom de base, aucun identifiant d'infrastructure. `503` avec `{ "statut": "degrade", "base": "indisponible" }` si PostgreSQL ne répond pas (EF-78).

---

### 8.2 Tâches — lecture

#### `GET /tasks`

Paramètres : section 6 (vue, filtres, tri, pagination).

**Réponse `200`** :

```json
{
  "elements": [ { "id": "…", "libelle": "…", "statut": { "code": "RETARD", "libelle": "Retard", "manuel": false } } ],
  "pagination": { "page": 1, "taille": 50, "total": 1, "nombrePages": 1 }
}
```

| Code | Cas |
|---|---|
| `400` | Paramètre inconnu, `taille` hors bornes, `vue` inconnue |
| `401` | Session absente |
| `403` | Vue non autorisée pour le rôle (ex. `EMPLOYEE` + `vue=toutes`) |
| `422` | `TRI_NON_SUPPORTE` |

> **Note** : `vue=service` sans département (responsable sans département, impossible par D7) → `403`. `vue=service` pour un admin sans `departementId` → `400 REQUETE_INVALIDE`.

#### `GET /tasks/:id`

**Réponse `200`** : `TacheDetail`.

| Code | Cas |
|---|---|
| `404` | Inexistante, supprimée logiquement, ou hors périmètre (section 4.4) |

> **Décision technique T8-09** : une tâche supprimée logiquement est **invisible** par défaut, y compris par son URL. Seul `GET /tasks?supprimees=true` (admin) la liste. Aucun endpoint de restauration n'est exposé (**D51**).

---

### 8.3 Tâches — création

#### `POST /tasks`

**Corps** :

```json
{
  "nature": "QUOTIDIENNE",
  "libelle": "Relancer les factures fournisseurs",
  "elementId": "…",
  "acteur": "GD_TRADING",
  "piloteEmployeId": "…",
  "pilotePartenaireId": null,
  "assigneAEmployeId": "…",
  "assigneAPartenaireId": null,
  "dateAction": "2026-11-02",
  "dateDebut": "2026-11-02",
  "dateFinPrevue": null,
  "urgenceId": "…",
  "importanceId": "…",
  "commentaireInitial": "Texte libre facultatif"
}
```

**Champs et règles** :

| Champ | Obligatoire | Règle |
|---|---|---|
| `nature` | Oui | `QUOTIDIENNE` ou `AUTRE` |
| `libelle` | Oui | Non vide après `trim` ; longueur maximale **D46** (255) |
| `elementId` | Oui | Élément existant et actif |
| `acteur` | Oui | `GD_TRADING` ou `PARTENAIRE` |
| `piloteEmployeId` | Si `GD_TRADING` ; optionnel si `PARTENAIRE` | Employé existant ; interdit avec `pilotePartenaireId`. Une tâche `PARTENAIRE` exige **exactement un** pilote, employé **ou** partenaire |
| `pilotePartenaireId` | Si `PARTENAIRE` et pilote partenaire | Partenaire existant et actif ; interdit si `piloteEmployeId` est renseigné |
| `assigneAEmployeId` | Si `GD_TRADING` | Employé existant et actif ; périmètre de création (section 4.3) |
| `assigneAPartenaireId` | Si `PARTENAIRE` | Partenaire existant et actif ; **réservé à l'`ADMIN`** (D81) |
| `dateAction` | Oui | Date valide |
| `dateDebut` | Oui | `= dateAction` si `QUOTIDIENNE` (**D28**) |
| `dateFinPrevue` | Si `AUTRE` | Interdite si `QUOTIDIENNE` ; `dateDebut ≤ dateFinPrevue` |
| `urgenceId`, `importanceId` | Oui | Couple **présent dans la matrice** (D31) |
| `actionAPrendreId` | — | **Interdit** : l'action à prendre est **déduite par le serveur** de la priorité calculée (P1/P2 → `Faire immédiatement`, P3 → `Déléguer si possible`, P4 → `Planifier`). Envoyer ce champ produit `400 CHAMP_INCONNU` |
| `commentaireInitial` | Non | Crée un commentaire initial, tracé séparément |
| `statutManuel`, `progressionManuelle`, `dateFin`, `motifNonAchevement` | — | **Refusés** à la création : passer par les endpoints dédiés (`CHAMP_INCONNU`) |

**Contrôles serveur, dans cet ordre** :

1. validation de forme (Zod) et rejet des champs inconnus ;
2. autorisation de création pour `assigneAEmployeId` / `assigneAPartenaireId` et pour le pilote (section 4.3) ; une tâche `PARTENAIRE` est **réservée à l'`ADMIN`** (D81) ;
3. existence et activation des références (élément, employé, partenaire) ;
4. cohérence des dates (RM-15) et règles de nature (D28) ;
5. **si `QUOTIDIENNE`** : jour ouvré et heure < 16h30 **dans `Africa/Algiers`** (D32) ;
6. présence du couple urgence × importance dans la matrice (D31) ;
7. lecture de la priorité, du score et de la fréquence depuis la matrice (moteur pur), sans stockage sur la tâche ; résolution de l'**action à prendre** à partir de la priorité calculée ;
8. insertion + audit dans une **transaction** ;
9. calcul des champs dérivés pour la réponse.

**Réponse `201`** : `TacheDetail` + en-tête `Location: /api/v1/tasks/{id}`. **Sans avertissement**, l'objet est renvoyé **directement** ; **avec** un avertissement (doublon de libellé), il est placé sous `donnees` (T8-02).

```json
{
  "donnees": { "id": "…", "statut": { "code": "EN_COURS", "libelle": "En cours", "manuel": false } },
  "avertissements": [
    { "code": "LIBELLE_DEJA_UTILISE", "message": "Un libellé identique existe déjà sur une tâche active." }
  ]
}
```

| Code | Erreur | Cas |
|---|---|---|
| `400` | `CHAMP_INCONNU` | Champ non exposé (ex. `statutManuel`) |
| `403` | `ACTION_NON_AUTORISEE` | Création hors périmètre, consultant |
| `422` | `CHAMP_OBLIGATOIRE` | Champ requis absent |
| `422` | `DATE_INCOHERENTE` | Ordre des dates |
| `422` | `NATURE_INVALIDE` | Règles D28 |
| `422` | `PILOTE_INVALIDE` | Acteur / pilote incohérents |
| `422` | `COMBINAISON_PRIORITE_INVALIDE` | Couple absent de la matrice |
| `422` | `TACHE_QUOTIDIENNE_HORS_DELAI` | Après 16h30 |
| `422` | `TACHE_QUOTIDIENNE_JOUR_NON_OUVRE` | Vendredi, samedi, férié |
| `422` | `EMPLOYE_INACTIF` | Titulaire inactif (**D49**) |

> **Doublon de libellé** : la recherche porte sur **toutes** les tâches actives, pas seulement celles visibles par le créateur. Le message **ne révèle ni l'auteur ni le service** ; il signale seulement l'existence du libellé (D41, EF-36).

> **Quotidienne après 16h30** : le serveur compare l'heure **serveur** à `heureEcheanceQuotidienne` (paramètre, défaut 16:30) dans le fuseau de l'application. Aucune heure client n'est acceptée (**D30**, **D32**).

---

### 8.4 Tâches — modification

#### `PATCH /tasks/:id`

**Corps** : uniquement les champs à modifier, plus `version` **obligatoire**.

```json
{
  "libelle": "Relancer les factures — fournisseurs étrangers",
  "assigneAEmployeId": "…",
  "assigneAPartenaireId": null,
  "dateFinPrevue": "2026-11-10",
  "urgenceId": "…",
  "importanceId": "…",
  "version": 3
}
```

**Champs modifiables** : `libelle`, `elementId`, `acteur`, `piloteEmployeId`, `pilotePartenaireId`, `assigneAEmployeId`, `assigneAPartenaireId`, `dateAction`, `dateDebut`, `dateFinPrevue`, `urgenceId`, `importanceId`. L'`actionAPrendreId` n'est **pas modifiable** : elle est déduite de la priorité et recalculée par le serveur dès que `urgenceId` ou `importanceId` change.

**Champs non modifiables par cette route** :

| Champ | Raison |
|---|---|
| `nature` | Immuable après création (**D55**) |
| `statutManuel` | Endpoint dédié (audit distinct) |
| `progressionManuelle` | Endpoint dédié |
| `dateFin`, `clotureLe`, `motifNonAchevement` | Endpoint de clôture |
| `creeParId`, `attribueParId` | Système, jamais modifiables |

**Règles** :

- `version` différente de la valeur en base → `409 VERSION_OBSOLETE` ;
- changement de titulaire ou de pilote → **périmètre de création** (section 4.3), sinon `403` ;
- un **changement d'acteur** remet automatiquement à `null` l'assigné et le pilote devenus incompatibles ; le client doit fournir les nouveaux titulaires du bon type (D81) ;
- une tâche `PARTENAIRE` et ses titulaires ne peuvent être modifiés que par un **`ADMIN`** (D81) ;
- les dates sont revalidées (RM-15, D28) ;
- une quotidienne dont la date est modifiée vers un **jour non ouvré** est refusée (**D54**) ;
- la priorité, le score et la fréquence sont **recalculés** si urgence ou importance change ; l'**action à prendre** est recalculée dans le même temps ;
- l'audit enregistre **avant / après** (RM-13).

**Réponse `200`** : `TacheDetail` avec `version` incrémentée.

| Code | Erreur |
|---|---|
| `403` | Hors périmètre d'écriture |
| `404` | Inexistante ou hors périmètre |
| `409` | `VERSION_OBSOLETE` |
| `422` | `DATE_INCOHERENTE`, `NATURE_INVALIDE`, `PILOTE_INVALIDE`, `ASSIGNE_INVALIDE`, `COMBINAISON_PRIORITE_INVALIDE`, `EMPLOYE_INACTIF`, `PARTENAIRE_INACTIF` |

---

### 8.5 Tâches — statut, progression, clôture

#### `PATCH /tasks/:id/status`

Positionne ou retire le **statut manuel** (D3, EF-52).

```json
{ "statutManuel": "SUSPENDUE", "version": 4 }
```

| Valeur | Effet |
|---|---|
| `ANNULEE` | Statut calculé = `Annulée`, prioritaire sur toutes les dates |
| `SUSPENDUE` | Statut calculé = `Suspendue`, prioritaire sur toutes les dates |
| `null` | Retour à l'état calculé |

- Ne renseigne **jamais** `dateFin` : annuler ou suspendre **n'est pas clôturer** (RM-07).
- Autorisé même sur une tâche clôturée : le statut manuel reste prioritaire (CA-12).
- Audit : `CHANGEMENT_STATUT`.

**Réponse `200`** : `TacheDetail`.

| Code | Erreur |
|---|---|
| `403` / `404` | Périmètre |
| `409` | `VERSION_OBSOLETE` |
| `422` | Valeur inconnue |

#### `PATCH /tasks/:id/progress`

```json
{ "progressionManuelle": 40, "dateControle": "2026-11-03", "version": 5 }
```

| Valeur | Effet |
|---|---|
| `0` à `100` | Progression manuelle prioritaire sur le calcul (EF-56, D4) |
| `null` | Retour au calcul temporel (RM-02) |

- `dateControle` (facultatif) : date réelle de l'entretien / contrôle de progression. Omise, la date existante est conservée ; `null` l'efface.
- Valeur non entière ou hors bornes → `422 PROGRESSION_INVALIDE`.
- Une tâche clôturée **conserve** la progression manuelle ; la clôture ne l'écrase pas (RM-02).
- Le **créateur de la tâche** peut enregistrer la progression, même s'il ne dispose pas du droit général de modification.
- Audit : `CHANGEMENT_PROGRESSION` (avant/après `progressionManuelle` et `dateControle`).

**Réponse `200`** : `TacheDetail`.

#### `POST /tasks/:id/close`

```json
{
  "dateFin": "2026-11-02",
  "motifNonAchevement": "Pièces justificatives manquantes",
  "version": 6
}
```

**Règles** :

| Situation | Motif | Effet |
|---|---|---|
| Clôture **avant ou à** l'échéance | Facultatif | `dateFin` enregistrée, statut `Achevée` |
| Clôture **après** l'échéance | **Obligatoire, non vide** | Sans motif : `422 MOTIF_OBLIGATOIRE`, aucune écriture |
| Tâche déjà clôturée | — | `409 TACHE_DEJA_CLOTUREE` |
| `dateFin < dateDebut` | — | `422 DATE_INCOHERENTE` |

**Détermination du « retard » à la clôture** (traduction de D15 + D38, **D56**) :

- pour une `AUTRE` : `dateFin > dateFinPrevue` ;
- pour une `QUOTIDIENNE` : `dateFin > jour de la tâche` **ou** `clotureLe` postérieur à l'échéance du jour à 16h30.

> Autrement dit, une clôture **saisie le lendemain** avec une `dateFin` antidatée reste **tardive** au sens réel : `clotureLe` fait foi pour l'heure. C'est la raison d'être des deux colonnes (D38).

- `clotureLe` est posé par le **serveur** (`now()`), jamais par le client.
- Audit : `CLOTURE` (et `MOTIF` si un motif est fourni).

**Réponse `200`** : `TacheDetail`.

| Code | Erreur |
|---|---|
| `403` / `404` | Périmètre |
| `409` | `TACHE_DEJA_CLOTUREE`, `VERSION_OBSOLETE` |
| `422` | `MOTIF_OBLIGATOIRE`, `DATE_INCOHERENTE` |

> **Aucune réouverture** n'est exposée en V1 (**D51**). Une clôture erronée ne peut pas être annulée par l'application ; aucune route ne l'autorise.

---

### 8.6 Commentaires

#### `GET /tasks/:id/comments`

| Accès | Pagination | Tri |
|---|---|---|
| Selon visibilité de la tâche | Oui (`page`, `taille`) | `creeLe:asc` imposé |

```json
{
  "elements": [
    {
      "id": "…",
      "tacheId": "…",
      "auteur": { "id": "…", "nomComplet": "Jean DUPONT" },
      "texte": "Relance envoyée.",
      "creeLe": "2026-11-02T09:12:00Z"
    }
  ],
  "pagination": { "page": 1, "taille": 50, "total": 1, "nombrePages": 1 }
}
```

#### `POST /tasks/:id/comments`

```json
{ "texte": "Relance envoyée." }
```

- Texte **non vide** après `trim` ; longueur maximale **D46** (2 000).
- Commentaire **libre, facultatif, sans effet sur le statut** (D3, EF-55).
- **Aucune** route `PATCH` ou `DELETE` : la table est **append-only** (D37).
- Audit : `COMMENTAIRE`.

**Réponse `201`** : `Commentaire` + `Location`.

| Code | Erreur |
|---|---|
| `403` | Consultant, ou tâche non éditable |
| `404` | Tâche non visible |
| `422` | `CHAMP_OBLIGATOIRE` (texte vide) |

> Un commentaire vide est refusé (`422`). Le CDC (UC-06) indiquait « commentaire vide → accepté (facultatif) » : cela signifie que **le commentaire lui-même est facultatif**, pas qu'un commentaire vide doit être créé. Un envoi vide n'a aucun sens et serait une ligne d'historique inutile. **Tranché : D57.**

---

### 8.7 Duplication

#### `POST /tasks/:id/duplicate`

**Corps** :

```json
{
  "dates": ["2026-11-03", "2026-11-04", "2026-11-05"],
  "assigneAEmployeId": "…",
  "assigneAPartenaireId": null
}
```

| Champ | Obligatoire | Règle |
|---|---|---|
| `dates` | Oui | 1 à **31** dates (**D44**) ; aucun doublon dans la liste |
| `assigneAEmployeId` | Non | Tâche `GD_TRADING` : par défaut, l'exécutant de la tâche source ; sinon, périmètre de création |
| `assigneAPartenaireId` | Non | Tâche `PARTENAIRE` : par défaut, le partenaire de la tâche source ; sinon, partenaire actif (D81, `ADMIN` uniquement) |

> Les deux champs d'assignation sont **mutuellement exclusifs**. Leur type doit correspondre à l'`acteur` de la tâche source (D81).

**Règles** :

- chaque copie est une **ligne indépendante** (D22) : statut calculé, progression, commentaires et motif **propres** ;
- **aucun commentaire ni motif** n'est copié ; `statutManuel`, `progressionManuelle`, `dateFin` et `clotureLe` sont **vides** (EF-63) ;
- la tâche source doit être **visible et dupliquable** par l'utilisateur (périmètre de création, EF-62) ;
- `nature`, `libelle`, `element`, `acteur`, `pilote`, `urgence`, `importance` sont recopiés ; l'`actionAPrendre` est **recalculée** depuis la priorité ;
- pour une `QUOTIDIENNE`, chaque date doit être un **jour ouvré** et la requête doit être faite **avant 16h30** (D32, **D44**) ;
- pour une `AUTRE`, `dateAction` = `dateDebut` = date demandée, et `dateFinPrevue` est recalculée **en conservant la durée** de la tâche source (**D44**) ;
- opération **atomique** : une seule date invalide → **aucune** copie créée (`422`) ;
- audit : un événement `CREATION` **par copie** ;
- **aucune génération future automatique** (EF-64).

**Réponse `201`** :

```json
{
  "donnees": {
    "creees": [ { "id": "…", "dateAction": "2026-11-03" } ],
    "nombre": 3
  }
}
```

> Réponse **composite** (liste de copies + compteur), ce n'est pas un DTO unique : l'enveloppe `donnees` est utilisée même sans avertissement. **Aucun** avertissement `LIBELLE_DEJA_UTILISE` n'est émis ici, car la copie du libellé est **volontaire** (**D44**).

| Code | Erreur |
|---|---|
| `403` / `404` | Périmètre |
| `422` | `DATE_INCOHERENTE`, `TACHE_QUOTIDIENNE_JOUR_NON_OUVRE`, `TACHE_QUOTIDIENNE_HORS_DELAI`, `NATURE_INVALIDE` |
| `422` | Plus de 31 dates ou doublon dans `dates` (**D44**) |

> **D44 (02/11/2026)** fixe la duplication : 31 dates maximum, jours ouvrés obligatoires pour une quotidienne, aucun commentaire ni motif copié, atomicité, et aucun avertissement de doublon sur les copies. Ces règles sont **applicables telles quelles**.

---

### 8.8 Suppression

#### `DELETE /tasks/:id`

**Suppression logique** (D36) : la ligne n'est jamais effacée physiquement.

| Rôle | Droit |
|---|---|
| `ADMIN` | Toute tâche |
| `RESPONSABLE` | **Uniquement** une tâche qu'il a lui-même attribuée (`attribueParId = lui`) |
| `EMPLOYEE` | Aucune |
| `CONSULTANT` | Aucune |

**Règles** :

- renseigne `supprime_le` (horodatage serveur) et `supprime_par_id` (utilisateur courant) ;
- la tâche disparaît des listes et de `GET /tasks/:id` (T8-09) ;
- une seconde suppression de la même tâche → `404 RESSOURCE_INTROUVABLE` ;
- **aucune restauration** n'est exposée en V1 (**D51**) ;
- aucune donnée fille n'est effacée : commentaires et événements d'audit restent en base (D37, D42) ;
- audit : `SUPPRESSION` (identifiant, libellé, auteur).

**Réponse `204`** — sans corps.

| Code | Erreur |
|---|---|
| `403` | Tâche visible mais suppression non autorisée (employé, responsable non attributaire) |
| `404` | Inexistante, déjà supprimée, ou hors périmètre (section 4.4) |

---

### 8.9 Historique d'une tâche

#### `GET /tasks/:id/history`

Retourne les événements **liés à la tâche**, visibles par toute personne qui voit la tâche (EF-47).

```json
{
  "elements": [
    {
      "id": 1042,
      "horodatage": "2026-11-02T09:12:00Z",
      "typeOperation": "CHANGEMENT_STATUT",
      "acteur": { "id": "…", "nomComplet": "Jean DUPONT" },
      "champsModifies": ["statutManuel"]
    }
  ],
  "pagination": { "page": 1, "taille": 50, "total": 1, "nombrePages": 1 }
}
```

- **Aucune valeur avant / après** dans cet endpoint : uniquement le type, l'auteur, la date et les champs touchés.
- Le journal complet (avec `donneesAvant` / `donneesApres`) reste réservé à l'admin via `/audit-events` (**D53**).

| Code | Cas |
|---|---|
| `404` | Tâche non visible |

---

### 8.10 Employés

| Méthode | Chemin | Accès | Description | Succès |
|---|---|---|---|---|
| `GET` | `/employees` | Tous | Liste filtrable | `200` |
| `GET` | `/employees/:id` | Tous | Détail | `200` |
| `POST` | `/employees` | Admin | Création | `201` |
| `PATCH` | `/employees/:id` | Admin | Modification, activation / désactivation | `200` |
| `DELETE` | `/employees/:id` | — | **Non exposé** (`405`) | — |

**Filtres** : `actif`, `departementId`, `recherche` (nom, prénom), pagination.

**Création** :

```json
{
  "nom": "DUPONT",
  "prenom": "Jean",
  "email": "j.dupont@…",
  "departementId": "…"
}
```

**Modification** :

```json
{
  "departementId": "…",
  "actif": false
}
```

**Règles** :

- `email` facultatif, non unique (aucune décision ne l'impose) ;
- `departementId` facultatif (EF-12) ;
- aucun `DELETE` : un employé référencé est **désactivé**, jamais supprimé (EF-11, D12) ;
- la désactivation d'un employé **révoque ses sessions** et **désactive son compte** (**D50**) ;
- la désactivation **annule les tâches non commencées** de l'employé (**D74**) : les tâches dont il est **assigné** et dont le statut calculé est **`A faire`** passent à `ANNULEE` ; les tâches `En cours`, `Retard`, `Achevée` et `Suspendue` restent inchangées ; une entrée d'audit est écrite par tâche annulée ;
- l'`email` n'est renvoyé qu'à l'**admin** ; les autres rôles reçoivent `null` ;
- **pas de verrou optimiste** : la table `employe` ne porte pas de colonne `version` au modèle validé (ÉTAPE 7) ; la dernière écriture s'applique ;
- audit : `REFERENTIEL` (création, modification, désactivation).

| Code | Erreur |
|---|---|
| `403` | Non admin pour l'écriture |
| `404` | Employé inconnu |
| `422` | `CHAMP_OBLIGATOIRE`, `PARAMETRE_INVALIDE` |

> **D49** : l'assignation d'une tâche à un employé **inactif** est refusée (`422 EMPLOYE_INACTIF`). UC-12 laissait le choix entre refus et avertissement ; le refus évite de créer une tâche que personne ne traitera.

---

### 8.11 Comptes et rôles

| Méthode | Chemin | Accès | Description | Succès |
|---|---|---|---|---|
| `GET` | `/accounts` | Admin | Liste des comptes | `200` |
| `GET` | `/accounts/:id` | Admin | Détail | `200` |
| `POST` | `/accounts` | Admin | Création | `201` |
| `PATCH` | `/accounts/:id` | Admin | Rôle, activation, lien employé | `200` |
| `POST` | `/accounts/:id/reset-password` | Admin | Réinitialisation | `200` — **détail ÉTAPE 13** |
| `DELETE` | `/accounts/:id` | — | **Non exposé** (`405`) | — |

**Création** :

```json
{
  "employeId": "…",
  "identifiant": "j.dupont",
  "role": "EMPLOYEE"
}
```

**Réponse `201`** : compte créé, sans hash ni secret. Le **mot de passe temporaire** et sa remise relèvent de l'**ÉTAPE 13** ; le contrat réservera un champ `motDePasseTemporaire` renvoyé **une seule fois** si cette option est retenue.

**Modification** :

```json
{ "role": "RESPONSABLE", "actif": true }
```

**Règles** :

- **un compte par employé** : `409 COMPTE_DEJA_LIE` (D12, EF-06) ;
- `employeId` peut être `null` pour un `CONSULTANT` sans fiche employé (**D39**) ;
- `RESPONSABLE` exige un employé **avec département** : sinon `422 RESPONSABLE_SANS_DEPARTEMENT` (EF-05) ;
- **au plus un responsable par département** : `409 RESPONSABLE_DEJA_PRESENT` (A12, **D35**) — contrôle dans une transaction `SERIALIZABLE` ;
- un compte n'est **jamais supprimé**, seulement désactivé (D12) ;
- la désactivation **révoque immédiatement** les sessions (architecture §10) ;
- **pas de verrou optimiste** : la table `utilisateur` ne porte pas de colonne `version` au modèle validé (ÉTAPE 7) ; la dernière écriture s'applique ;
- **dernier administrateur protégé** : retirer le rôle `ADMIN` au **dernier compte `ADMIN` actif** ou le désactiver est refusé — `409 DERNIER_ADMIN` (**D72**) ;
- **auto-modification interdite** : un `ADMIN` ne peut ni modifier **son propre rôle** ni **se désactiver** lui-même — `403 AUTO_MODIFICATION_INTERDITE` (**D75**) ; un autre administrateur doit agir ;
- **effet immédiat d'un changement de rôle** : les droits sont recalculés à **chaque requête** ; aucune reconnexion n'est nécessaire (**D73**) ;
- audit : `COMPTE`, `ROLE`.

| Code | Erreur |
|---|---|
| `403` | `AUTO_MODIFICATION_INTERDITE` (**D75**) |
| `409` | `DERNIER_ADMIN` (**D72**), `COMPTE_DEJA_LIE`, `RESPONSABLE_DEJA_PRESENT` |
| `422` | `RESPONSABLE_SANS_DEPARTEMENT` |

> **D35** : l'unicité du responsable n'est **pas** garantie par une contrainte PostgreSQL (deux tables). L'API doit donc la garantir dans une transaction sérialisable et renvoyer `409` en cas de conflit. Le test d'intégration correspondant est prévu à l'ÉTAPE 12.

---

### 8.12 Départements

| Méthode | Chemin | Accès | Description | Succès |
|---|---|---|---|---|
| `GET` | `/departments` | Tous | Liste | `200` |
| `GET` | `/departments/:id` | Tous | Détail | `200` |
| `POST` | `/departments` | Admin | Création | `201` |
| `PATCH` | `/departments/:id` | Admin | Modification, activation / désactivation | `200` |
| `DELETE` | `/departments/:id` | Admin | Suppression **si non référencé** | `204` |

**Règles** :

- `libelle` non vide, unique (insensible à la casse) ;
- suppression refusée si un employé est rattaché : `409 REFERENTIEL_REFERENCE` ;
- suppression ou désactivation refusée si un `RESPONSABLE` est rattaché : `409 DEPARTEMENT_AVEC_RESPONSABLE` (**D48**) ;
- la réponse inclut le **responsable** courant (`{id, nomComplet}` ou `null`) ;
- audit : `REFERENTIEL`.

> **D48** : tant qu'un `RESPONSABLE` est rattaché à un département, sa suppression et sa désactivation sont **refusées**. Le rôle doit d'abord être déplacé ou le compte désactivé ; c'est la seule option qui préserve l'invariant « `RESPONSABLE` ⇒ département » (D7) sans décision nouvelle.

---

### 8.13 Partenaires

| Méthode | Chemin | Accès | Description | Succès |
|---|---|---|---|---|
| `GET` | `/partners` | Tous | Liste filtrable (`actif`, `recherche`) | `200` |
| `GET` | `/partners/:id` | Tous | Détail | `200` |
| `POST` | `/partners` | Admin | Création | `201` |
| `PATCH` | `/partners/:id` | Admin | Modification, désactivation | `200` |
| `DELETE` | `/partners/:id` | Admin | Suppression si non pilote | `204` |

**Règles** :

- `libelle` non vide, unique (insensible à la casse) ;
- suppression refusée si le partenaire est **pilote** d'une tâche : `409 REFERENTIEL_REFERENCE` ;
- référentiel **distinct des fournisseurs** (D6, EF-13) ;
- audit : `REFERENTIEL`.

---

### 8.14 Éléments / piliers

| Méthode | Chemin | Accès | Description | Succès |
|---|---|---|---|---|
| `GET` | `/elements` | Tous | Liste (`actif`, `ordre`) | `200` |
| `GET` | `/elements/:id` | Tous | Détail | `200` |
| `POST` | `/elements` | Admin | Création | `201` |
| `PATCH` | `/elements/:id` | Admin | Modification, désactivation | `200` |
| `DELETE` | `/elements/:id` | Admin | Suppression si non utilisé | `204` |

**Règles** :

- `libelle` non vide, unique ;
- suppression refusée si l'élément est utilisé par une tâche : `409 REFERENTIEL_REFERENCE` ;
- 6 valeurs initiales (**D8**, `BD!Table1089`) ;
- audit : `REFERENTIEL`.

---

### 8.15 Priorités : urgences, importances, matrice, actions à prendre

| Méthode | Chemin | Accès | Description | Succès |
|---|---|---|---|---|
| `GET` | `/urgencies` | Tous | 4 valeurs | `200` |
| `GET` | `/importances` | Tous | 4 valeurs | `200` |
| `GET` | `/priority-matrix` | Tous | 13 lignes | `200` |
| `GET` | `/actions-a-prendre` | Tous | 3 valeurs, actives par défaut | `200` |
| `PATCH` | `/actions-a-prendre/:id` | Admin | Activation / désactivation | `200` |

**Réponse `/priority-matrix`** :

```json
{
  "elements": [
    {
      "urgence": { "id": "…", "libelle": "Immédiate" },
      "importance": { "id": "…", "libelle": "Critique" },
      "score": 12,
      "frequenceJours": 1,
      "priorite": "Immédiate & Critique"
    }
  ]
}
```

**Règles** :

- **aucune** route d'écriture sur `urgence`, `importance` et `matrice` : elles sont **figées** (EF-20) ;
- les 3 combinaisons absentes **n'existent pas** dans la réponse ; une tentative de création avec l'une d'elles est refusée par `POST /tasks` (D31) ;
- `action_a_prendre` peut être **désactivée**, jamais supprimée si utilisée (modèle §10.1) ;
- audit : `REFERENTIEL` pour la désactivation d'une action.

---

### 8.16 Jours fériés

| Méthode | Chemin | Accès | Description | Succès |
|---|---|---|---|---|
| `GET` | `/holidays` | Tous | Liste, filtre `annee` | `200` |
| `POST` | `/holidays` | Admin | Ajout | `201` |
| `PATCH` | `/holidays/:id` | Admin | Modification | `200` |
| `DELETE` | `/holidays/:id` | Admin | Suppression | `204` |

**Corps** :

```json
{ "jour": "2027-01-01", "libelle": "Jour de l'an" }
```

**Règles** :

- `jour` **unique** : `409 FERIE_DEJA_PRESENT` ;
- `libelle` facultatif ; aucune liste de libellés n'a été fournie (**P2**) ;
- suppression **libre** : aucune tâche ne référence un férié en base, le calcul est dynamique (modèle §5.10) ;
- les **15 dates 2026** sont présentes au démarrage (D5) ;
- **2027-2028** restent à saisir (**P2**) ;
- audit : `REFERENTIEL`.

---

### 8.17 Paramètres

| Méthode | Chemin | Accès | Description | Succès |
|---|---|---|---|---|
| `GET` | `/settings` | Tous | Paramètres courants | `200` |
| `PATCH` | `/settings` | Admin | Modification | `200` |

**Réponse `200`** :

```json
{
  "fuseau": "Africa/Algiers",
  "weekendJours": [5, 6],
  "heureDebutJournee": "08:00",
  "pauseDebut": "12:00",
  "pauseFin": "13:00",
  "heureEcheanceQuotidienne": "16:30",
  "modifieLe": "2026-11-02T08:00:00Z"
}
```

**Modification** : `weekendJours`, `heureDebutJournee`, `pauseDebut`, `pauseFin`, `heureEcheanceQuotidienne`.

**Règles** :

- `fuseau` est **lecture seule** : `Africa/Algiers` est fixé par **D30** ; le changer exigerait une nouvelle décision ;
- ordre obligatoire : `heureDebutJournee < pauseDebut < pauseFin < heureEcheanceQuotidienne` → sinon `422 PARAMETRE_INVALIDE` ;
- `weekendJours` : exactement **2 jours distincts** entre 0 et 6 ;
- la pause est **affichée**, sans effet sur les calculs (D18) ;
- audit : `REFERENTIEL` (paramètres).

---

### 8.18 Journal d'audit

#### `GET /audit-events`

| Accès | Pagination | Écriture |
|---|---|---|
| **Admin uniquement** | Oui | **Aucune** (`POST`, `PATCH`, `DELETE` → `405`) |

**Filtres** : `acteurId`, `typeOperation`, `entite`, `entiteId`, `du`, `au`, `page`, `taille`.

**Réponse `200`** :

```json
{
  "elements": [
    {
      "id": 1042,
      "horodatage": "2026-11-02T09:12:00Z",
      "typeOperation": "CHANGEMENT_STATUT",
      "acteur": { "id": "…", "nomComplet": "Jean DUPONT" },
      "entite": "tache",
      "entiteId": "…",
      "donneesAvant": { "statutManuel": null },
      "donneesApres": { "statutManuel": "SUSPENDUE" }
    }
  ],
  "pagination": { "page": 1, "taille": 50, "total": 1, "nombrePages": 1 }
}
```

**Règles** :

- journal **append-only** (EF-77, D42) : aucune route d'écriture, aucune purge ;
- aucune donnée de mot de passe, hash, jeton ou secret dans `donneesAvant` / `donneesApres` ;
- l'acteur peut être `null` (événement système) ;
- `entiteId` est une chaîne, y compris pour les entités à identifiant entier ;
- conservation **sans purge** (D42).

---

## 9. Règles de validation transverses

| Règle | Contrôle serveur | Erreur |
|---|---|---|
| Rejet des champs inconnus | Schéma Zod **strict** | `400 CHAMP_INCONNU` |
| Types JSON | Validation de type avant toute logique | `400 REQUETE_INVALIDE` |
| Libellé non vide | `trim().length > 0` | `422 CHAMP_OBLIGATOIRE` |
| Longueur du libellé | **D46** (255) | `422 VALEUR_INVALIDE` |
| Commentaire non vide | `trim().length > 0` | `422 CHAMP_OBLIGATOIRE` |
| Longueur du commentaire | **D46** (2 000) | `422 VALEUR_INVALIDE` |
| Motif non vide si tardif | `trim().length > 0` | `422 MOTIF_OBLIGATOIRE` |
| Bornes de progression | Entier 0-100 | `422 PROGRESSION_INVALIDE` |
| Ordre des dates | `dateAction ≤ dateDebut ≤ dateFinPrevue` | `422 DATE_INCOHERENTE` |
| Date de clôture | `dateFin ≥ dateDebut` | `422 DATE_INCOHERENTE` |
| Nature | Quotidienne : dates uniques, pas de `dateFinPrevue` | `422 NATURE_INVALIDE` |
| Acteur / pilote | Un seul pilote, du bon type | `422 PILOTE_INVALIDE` |
| Matrice | Couple présent | `422 COMBINAISON_PRIORITE_INVALIDE` |
| Jour ouvré | Week-end paramétré + fériés | `422 TACHE_QUOTIDIENNE_JOUR_NON_OUVRE` |
| Heure limite | `now()` dans `Africa/Algiers` < 16h30 | `422 TACHE_QUOTIDIENNE_HORS_DELAI` |
| Titulaire actif | `employe.actif = true` | `422 EMPLOYE_INACTIF` |
| Version d'une tâche | Égalité stricte avec la base (tâches uniquement) | `409 VERSION_OBSOLETE` |
| Identifiant unique | Index `lower(identifiant)` | `409 IDENTIFIANT_DEJA_UTILISE` |
| Compte unique par employé | Index partiel | `409 COMPTE_DEJA_LIE` |
| Responsable unique par département | Transaction sérialisable | `409 RESPONSABLE_DEJA_PRESENT` |
| Responsable avec département | Vérification avant écriture | `422 RESPONSABLE_SANS_DEPARTEMENT` |

> **Aucune validation ne repose uniquement sur le client.** L'interface peut pré-valider pour l'ergonomie ; le serveur revalide intégralement (architecture §10).

---

## 10. Audit — hooks par endpoint

| Endpoint | Type(s) journalisé(s) | Contenu minimal |
|---|---|---|
| `POST /tasks` | `CREATION` (+ `COMMENTAIRE` si commentaire initial) | Tâche créée, acteur, valeurs |
| `PATCH /tasks/:id` | `MODIFICATION`, `CHANGEMENT_TITULAIRE` si pilote / exécutant change | Avant / après |
| `PATCH /tasks/:id/status` | `CHANGEMENT_STATUT` | `statutManuel` avant / après |
| `PATCH /tasks/:id/progress` | `CHANGEMENT_PROGRESSION` | Valeur avant / après |
| `POST /tasks/:id/close` | `CLOTURE`, `MOTIF` si motif | `dateFin`, `clotureLe`, motif |
| `DELETE /tasks/:id` | `SUPPRESSION` | Identifiant, libellé, auteur |
| `POST /tasks/:id/comments` | `COMMENTAIRE` | Texte, auteur |
| `POST /tasks/:id/duplicate` | `CREATION` **par copie** | Source, date, identifiant créé |
| `POST/PATCH /employees` | `REFERENTIEL` | Avant / après |
| `POST/PATCH /departments`, `/partners`, `/elements`, `/holidays`, `/settings` | `REFERENTIEL` | Avant / après |
| `PATCH /actions-a-prendre/:id` | `REFERENTIEL` | `actif` avant / après |
| `POST/PATCH /accounts` | `COMPTE`, `ROLE` | Rôle et état — **jamais** de mot de passe |
| `POST /auth/login` (succès et échec) | `CONNEXION` | Identifiant tenté, résultat, IP — **jamais** de mot de passe |
| `POST /auth/password` | `COMPTE` | Changement de mot de passe, **sans valeur** |

**Règles communes** :

- l'écriture métier et son événement d'audit sont dans la **même transaction** ;
- un échec d'audit **annule** l'écriture ;
- `journal_audit` est **append-only** : aucun `UPDATE`, aucun `DELETE` (D42) ;
- aucun secret, hash ou jeton n'est journalisé.

---

## 11. Transactions et concurrence

| Opération | Transaction | Isolation | Raison |
|---|---|---|---|
| Création / modification / clôture d'une tâche | Écriture + audit | `READ COMMITTED` + verrou optimiste `version` | Volume, simplicité |
| Duplication | Toutes les copies + audits | `READ COMMITTED` | Atomicité « tout ou rien » |
| Attribution du rôle `RESPONSABLE` | Vérification + écriture + audit | **`SERIALIZABLE`** | Unicité par département non exprimable en base (**D35**) |
| Création de compte | Vérifications d'unicité + écriture + audit | `READ COMMITTED` + index uniques | Les index garantissent l'unicité |
| Désactivation d'un employé | Employé + compte + sessions + audit | `SERIALIZABLE` | Cohérence employé / compte (**D50**) |
| Référentiels | Écriture + audit | `READ COMMITTED` | — |

**Verrouillage optimiste** (tâches uniquement) :

- `version` est renvoyée dans `TacheListe` / `TacheDetail` et **exigée** par toute écriture sur une tâche (`PATCH`, `status`, `progress`, `close`) ;
- si la valeur en base diffère → `409 VERSION_OBSOLETE`, **aucune** écriture ;
- l'interface recharge la tâche et présente le conflit à l'utilisateur (ÉTAPE 9).

> **Pourquoi `version`** : deux responsables peuvent modifier la même tâche depuis deux postes. Sans verrou, la dernière écriture écraserait silencieusement la première. `version` est déjà au modèle validé (colonne 26 de `tache`).
> **Portée** : seule la table `tache` porte une colonne `version` au modèle validé. Les référentiels (employés, départements, partenaires, éléments, comptes, paramètres) ne l'ont pas : leurs `PATCH` ne l'exigent pas et la dernière écriture s'applique.

---

## 12. Performance et limites connues

| Sujet | Limite | Parade |
|---|---|---|
| Filtre par statut calculé | Non indexable directement | Prédicats de dates + calcul en mémoire (section 6.4) |
| Tri par champ calculé | Refusé (`422`) | Tri sur champs stockés uniquement |
| Volume de tâches | > 50 000 ouvertes | Vue matérialisée ou colonne de statut recalculée (à décider à l'ÉTAPE 14) |
| Pagination profonde | `page` élevée coûteuse | `taille` max 200 ; `keyset` différé (**T8-04**) |
| Journal d'audit | Croissance non purgée (D42) | Index `(entite, entite_id)` et `horodatage` ; archivage à l'ÉTAPE 14 |
| Duplication | 31 dates par appel (**D44**) | Appels successifs, chaque appel atomique |
| Recherche `libelle` | `ILIKE` non indexé au-delà de quelques milliers | Index trigramme à évaluer à l'ÉTAPE 14 |

**Objectifs repris de l'architecture (ENF-01)** : « mes tâches du jour » < 200 ms, « mon service » < 500 ms, « retards » < 500 ms, liste paginée de 1 000 tâches < 2 s.

---

## 13. Traçabilité exigences → endpoints

| Exigences | Endpoints | Remarque |
|---|---|---|
| EF-01, EF-02, EF-10 | `/auth/login`, `/auth/logout`, `/auth/password` | Message d'échec générique |
| EF-03, EF-07 | Politique centralisée + toutes les routes | Contrôle serveur |
| EF-04, EF-05, EF-06 | `/accounts` | Unicité, rôle, département |
| EF-08, EF-09 | `/auth/password`, `/me` | Détail ÉTAPE 13 |
| EF-11, EF-12 | `/employees` | Désactivation, jamais suppression |
| EF-13 | `/partners` | — |
| EF-14, EF-15 | `/departments` | Responsable unique (D35) |
| EF-16, EF-17 | `/holidays`, `/settings` | — |
| EF-18 | `/elements` | — |
| EF-19, EF-20, EF-21 | `/urgencies`, `/importances`, `/priority-matrix`, `/actions-a-prendre` | Lecture ; matrice figée |
| EF-22, EF-23 | `/settings` | Fuseau lecture seule (D30) |
| EF-24 à EF-28 | `POST /tasks`, `PATCH /tasks/:id` | Nature, champs, priorité |
| EF-29 à EF-33 | `POST /tasks` | Périmètres D13, traçabilité |
| EF-34 à EF-36 | `POST/PATCH /tasks`, avertissement de doublon | Validation |
| EF-37, EF-38 | `POST /tasks` | Quotidienne, D32 |
| EF-39 | DTO `servicePorteur` | Calculé (D29) |
| EF-40 | `POST/PATCH /tasks` | Urgence / importance par le créateur (D33) |
| EF-41 à EF-43 | `GET /tasks?vue=…` | Vues personnelles |
| EF-44, EF-45, EF-46 | `GET /tasks?vue=service`, `vue=toutes` | Périmètres |
| EF-47 | `GET /tasks/:id`, `/comments`, `/history` | Détail complet |
| EF-48, EF-49 | `GET /tasks` | Filtres, tri, pagination |
| EF-50, EF-51 | DTO `rappelEchu`, `rappelImminent`, `estEnRetard` | Signaux d'interface |
| EF-52 | `PATCH /tasks/:id/status` | — |
| EF-53, EF-54 | `POST /tasks/:id/close` | Motif obligatoire |
| EF-55 | `POST /tasks/:id/comments` | Append-only |
| EF-56 à EF-58 | `PATCH /tasks/:id/progress`, DTO `progression` | Manuel prioritaire |
| EF-59 | `PATCH /tasks/:id` | Périmètre |
| EF-60 | — | Aucun circuit d'approbation : rien à exposer |
| EF-61 à EF-65 | `POST /tasks/:id/duplicate` | **D44** |
| EF-66 à EF-69 | `DELETE /tasks/:id` | Suppression logique + audit |
| EF-70 à EF-72 | DTO `priorite`, `dateRappel`, `/priority-matrix` | Calculs |
| EF-73 | DTO `dureeGJours`, `dureeEJours`, `anomalieDuree` | **P1** (libellés) |
| EF-74 | Tous les DTO de lecture | Recalcul à chaque lecture |
| EF-75 | `GET /tasks?vue=…` | Aucun endpoint `/dashboard` (**T8-07**) |
| EF-76, EF-77 | `/audit-events`, hooks | Append-only |
| EF-78 | `/health` | — |
| EF-79 | — | Mono-tenant : aucun paramètre d'entreprise |

---

## 14. Décisions techniques de l'ÉTAPE 8

> Ces décisions sont **techniques** : elles ne modifient aucune règle métier et n'attendent pas d'arbitrage du directeur. Elles sont listées pour être contestées si nécessaire.

| # | Décision | Justification |
|---|---|---|
| **T8-01** | REST JSON sous `/api/v1`, cookie de session | Architecture §11 |
| **T8-02** | Objet unique renvoyé directement ; liste `{elements, pagination}` ; avertissements dans `{donnees, avertissements}` | Lisibilité, compatibilité |
| **T8-03** | Dates métier `AAAA-MM-JJ`, horodatages UTC `Z`, calculs serveur en `Africa/Algiers` | D30, éviter toute ambiguïté |
| **T8-04** | Pagination `page` / `taille` (50, max 200), `keyset` différé | Architecture validée ; le `keyset` du livrable 06 reste un objectif de performance, pas un contrat |
| **T8-05** | Verrouillage optimiste par `version`, `409 VERSION_OBSOLETE` | Colonne validée au modèle |
| **T8-06** | Hors périmètre → `404` ; action interdite sur ressource visible → `403` | Non-divulgation (EF-03) |
| **T8-07** | Pas d'endpoint `/dashboard` : les vues passent par `GET /tasks?vue=…` | EF-75 (aucun indicateur supplémentaire) et flux §9.1 de l'architecture |
| **T8-08** | Tri refusé sur les champs calculés | Éviter une pagination fausse |
| **T8-09** | Suppression logique invisible par défaut ; admin peut lister les supprimées, sans restauration | D36 |
| **T8-10** | Duplication atomique (tout ou rien) | Éviter des copies partielles |
| **T8-11** | Doublon de libellé = **avertissement**, jamais un blocage | D41, EF-36 |
| **T8-12** | `nature` immuable après création | Changer la nature invaliderait les règles de dates (D28) |
| **T8-13** | `fuseau` en lecture seule dans `/settings` | D30 : le changer exigerait une décision |
| **T8-14** | `email` des employés visible par l'admin uniquement | Minimisation des données |
| **T8-15** | `actionAPrendreId` **déduit** de la priorité, jamais fourni par le client | La priorité est calculée ; l'action en découle (P1/P2 → `Faire immédiatement`, P3 → `Déléguer si possible`, P4 → `Planifier`). Le champ est retiré des schémas d'écriture (`400 CHAMP_INCONNU` s'il est envoyé) |

---

## 15. Points tranchés le 02/11/2026

> Les quatorze points ci-dessous ont été **arbitrés le 02/11/2026**. Ils deviennent les **DÉCISIONS 44 à 57** et s'appliquent à l'implémentation des endpoints concernés. Ils ferment en même temps les points **P6, P13, P14, P15 et P16** restés ouverts depuis les ÉTAPES 4 et 5.

| # | Point | Décision retenue | Décision | Bloque | Renvoi |
|---|---|---|---|---|---|
| **A8-01** | Duplication : plage maximale, jours non ouvrés, copie des commentaires et du motif, avertissement de doublon | 31 dates maximum ; jours ouvrés obligatoires pour une quotidienne ; aucun commentaire ni motif copié ; atomicité ; **aucun** avertissement `LIBELLE_DEJA_UTILISE` sur les copies (libellé copié volontairement) | **D44** | `POST /tasks/:id/duplicate` | **P14**, EF-65 |
| **A8-02** | Taille minimale du motif de non-achèvement | Non vide après `trim` ; maximum technique 2 000 caractères ; aucune longueur minimale au-delà | **D45** | Clôture tardive | **P13** |
| **A8-03** | Longueur maximale du libellé et du commentaire | Libellé 255, commentaire 2 000 (bornes techniques) | **D46** | Création / modification | **P6** |
| **A8-04** | Pilote désigné par un non-admin | Partenaire interdit ; pilote employé limité au périmètre de création (soi-même pour un employé, son département ou lui-même pour un responsable) | **D47** | Création / modification | **P16** |
| **A8-05** | Département ayant un responsable : suppression ou désactivation | Refus `409 DEPARTEMENT_AVEC_RESPONSABLE` tant que le rôle n'a pas été déplacé | **D48** | `DELETE/PATCH /departments` | **P15** |
| **A8-06** | Tâche assignée à un employé inactif | Refus `422 EMPLOYE_INACTIF` | **D49** | Création / réaffectation | UC-12 |
| **A8-07** | Désactivation d'un employé : effet sur son compte et ses sessions | Désactivation automatique du compte + révocation des sessions, dans la même transaction | **D50** | `PATCH /employees/:id` | D12 |
| **A8-08** | Réouverture d'une tâche clôturée | Non exposée en V1 ; aucune route de réouverture | **D51** | `POST /tasks/:id/close` | — |
| **A8-09** | Visibilité du motif de non-achèvement pour le `CONSULTANT` | Visible par tous les ayants droit, consultant compris, puisqu'il voit tout le détail | **D52** | `GET /tasks/:id` | RM-07 |
| **A8-10** | Historique de tâche vs journal d'audit réservé à l'admin | Historique **réduit** (type, auteur, date, champs modifiés) visible aux ayants droit ; valeurs avant/après réservées à l'admin | **D53** | `GET /tasks/:id/history` | EF-47, EF-76 |
| **A8-11** | Édition de la date d'une tâche quotidienne | Les règles de cohérence s'appliquent ; le passage à un jour non ouvré est refusé ; la règle « avant 16h30 » ne s'applique qu'à la **création** | **D54** | `PATCH /tasks/:id` | D28, D32 |
| **A8-12** | `nature` modifiable après création | Immuable | **D55** | `PATCH /tasks/:id` | D28 |
| **A8-13** | Détermination du retard à la clôture | `dateFin` postérieure à l'échéance **ou** `clotureLe` postérieur à 16h30 le jour dû | **D56** | `POST /tasks/:id/close` | D15, D38 |
| **A8-14** | Commentaire vide | Refusé (`422`) : un commentaire est facultatif, pas vide | **D57** | `POST /tasks/:id/comments` | UC-06 |

> **Rappel** : les points **P11** (environnement serveur) et **P12** (session, mots de passe) restent ouverts et sont traités aux **ÉTAPES 13 et 14**. Ils ne bloquent pas la validation des contrats.

---

## 16. Ce que l'ÉTAPE 8 ne fait pas

- Elle **ne crée aucun fichier de code**, aucun `package.json`, aucun contrôleur, aucun middleware.
- Elle **n'installe aucune dépendance** (Express, Zod, Prisma, etc.).
- Elle **ne crée aucun dossier** `client\`, `server\` ou `prisma\`.
- Elle **ne génère aucun document OpenAPI** : l'architecture le prévoit comme optionnel ; le présent contrat Markdown fait foi à ce stade.
- Elle **ne définit pas** les composants, écrans ou maquettes → **ÉTAPE 9**.
- Elle **ne définit pas** la politique détaillée de mots de passe et de sessions → **ÉTAPE 13**.
- Elle **ne crée aucune base** et **n'exécute aucune migration**.
- Elle **a formalisé** les points **A8-01 à A8-14**, désormais tranchés le 02/11/2026 (**D44 à D57**, section 15).

---

## 17. Validation

**L'ÉTAPE 8 a été validée le 02/11/2026.** Les points soumis au directeur étaient :

1. les **familles d'endpoints** et leurs chemins couvrent l'ensemble des **EF-01 à EF-79** ;
2. les **DTO** exposent les champs nécessaires à l'interface sans exposer de donnée sensible ;
3. les **règles d'autorisation** (section 4) reproduisent exactement la matrice des droits (D7, D13, D21, D25, D33) ;
4. le **catalogue d'erreurs** (section 5.2) est stable et exploitable par l'interface ;
5. la **pagination, le tri et les filtres** (section 6) sont acceptables, y compris le refus de trier sur les champs calculés ;
6. les **règles de validation serveur** (section 9) couvrent toutes les règles métier validées ;
7. les **hooks d'audit** (section 10) et les **transactions** (section 11) sont conformes à AR-10 et D35 ;
8. les **décisions techniques T8-01 à T8-15** sont acceptables ;
9. les points **A8-01 à A8-14** sont tranchés (**D44 à D57**) et applicables à l'implémentation.

> **Le contrat est arrêté.** L'**ÉTAPE 9** (interface React) peut être engagée.
> **Aucun code ne sera écrit avant la validation de l'ÉTAPE 9.**

---

## 18. Journal des révisions

| Date | Section(s) | Modification | Statut |
|---|---|---|---|
| 02/11/2026 | Document entier | Création du livrable 07 (ÉTAPE 8) : conventions, authentification, autorisation route par route, catalogue d'erreurs, pagination / tri / filtres, DTO, **54 endpoints**, règles de validation, hooks d'audit, transactions, performance, traçabilité EF, décisions **T8-01 à T8-15** et points **A8-01 à A8-14**. Aucun code écrit. | ✅ **Validé le 02/11/2026** |
| 02/11/2026 | §3.3, §7.4, §7.5, §8.7, §8.8, §8.16, §9, §11, §18 | Ajout de `GET /me` et de `DELETE /tasks/:id` (section 8.8, renumérotation des sections suivantes) ; retrait du champ `version` des DTO de référentiel et des `PATCH` employés / comptes (absent du modèle validé) ; correction de l'exemple `Me.droits` pour un `EMPLOYEE` ; exemple de jour férié déplacé en 2027 (les 15 dates 2026 sont déjà semées) ; précision de l'enveloppe `201` en cas d'avertissement ; **54 endpoints** au lieu de 58. | ✅ **Validé le 02/11/2026** |
| 02/11/2026 | En-tête, §4.3, §5.2, §7.2, §7.4, §8.2 à §8.14, §9, §11, §12, §13, §15, §16, §17 | **Validation du directeur** : points **A8-01 à A8-14** tranchés → **D44 à D57** ; **P6, P13, P14, P15, P16 clos**. Les mentions « proposition / à confirmer » sont remplacées par les décisions. Contrat arrêté ; ÉTAPE 9 autorisée. | ✅ **Validé le 02/11/2026** |
| 02/11/2026 | En-tête, §5.4, §8.10, §8.11, §18 | **Compléments ÉTAPE 12** : **D72** (`409 DERNIER_ADMIN`), **D73** (effet immédiat du rôle), **D74** (annulation des tâches `A faire` à la désactivation d'un employé), **D75** (`403 AUTO_MODIFICATION_INTERDITE`). Aucun endpoint ajouté : **54 endpoints** inchangés. **ÉTAPE 12 validée le 02/11/2026** ; D74 précisée (employé assigné, statut `A faire`). | ✅ **Validé le 02/11/2026** |
| 05/11/2026 | En-tête, §5.1, §5.2, §6.2, §7.1, §8.3, §8.4, §8.7, §18 | **D81 — assignation à un partenaire** : `assigneAId` remplacé par `assigneAEmployeId` / `assigneAPartenaireId` (création, modification, duplication) ; DTO `assigneA = { type, id, libelle, departement }` ; filtre `assigneAId` conservé comme filtre générique ; erreurs `ASSIGNE_INVALIDE` et `PARTENAIRE_INACTIF`. Aucun endpoint ajouté. | ✅ **Appliqué le 05/11/2026** |
