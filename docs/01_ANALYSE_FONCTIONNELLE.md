# ÉTAPE 1 + 2 — ANALYSE FONCTIONNELLE DE L'ANCIEN SYSTÈME

**Projet** : Application web de gestion des TODOLists — GD Trading
**Source analysée** : `C:\Users\Y.DROUICHE\Downloads\ClasseurYD.xlsx`
**Auteur du fichier** : Djamal-Eddine ZOUBA — créé le 28/09/2026 14:35, modifié 28/09/2026 14:37
**Date d'analyse** : 28/09/2026
**Dernière révision** : 01/11/2026 — décisions **Q1 à Q4**, **D1**, **D2**, **D3**, **D4**, **D5**, **D7**, **D8**, **D9**, **D10**, **D11** et **D12** validées ; points **A12** (un responsable par service) et **A13** (les trois notions de « ses actions ») tranchés ; règle `ACTEUR` → `STRUCTURE` figée (B.3.5) ; statuts `Annulée` / `Suspendue` accessibles (B1) ; progression **manuel + repli temporel** (C) ; jours fériés en **table administrable** ; **4 rôles par compte** (ADMIN / RESPONSABLE / EMPLOYEE / CONSULTANT) ; **un compte par employé** ; stack **TypeScript + Prisma de bout en bout** (PostgreSQL) ; projet dans le dossier dédié **`GD Trading - TodoList`** ; aucun nom d'acteur repris ; aucune action reprise ; départements recréés et administrables ; **10 tables de `BD` écartées** ; **workflows orphelins hors périmètre** ; **périmètre modulaire**.
**Statut** : ÉTAPE 1 et ÉTAPE 2 terminées et **validées par le directeur le 01/11/2026**. Toutes les décisions de la révision sont **validées**. Ce document sert de référence aux étapes suivantes. **Aucun code écrit.**

---

## PARTIE A — ÉTAPE 1 : INVENTAIRE EXHAUSTIF DU FICHIER

### A.1 Structure physique

| Caractéristique | Valeur |
|---|---|
| Nombre de feuilles | **2** (`ACTIONS`, `BD`) |
| Nombre de tables Excel (ListObjects) | **19** |
| Nombre de formules | **494** (dans 7 motifs distincts) |
| Plages nommées | **26** (+ doublons pointant sur le classeur externe) |
| Plages fusionnées | 2 |
| Validations de données | 7 |
| Règles de mise en forme conditionnelle | 9 |
| Liens externes | **1 classeur maître à 16 feuilles** |
| Images | 1 (logo, ancré M1:O3) |
| Protection de feuille | aucune |

### A.2 Les 2 feuilles

| Feuille | Rôle | Plage active | Contenu |
|---|---|---|---|
| `ACTIONS` | **Plan d'action opérationnel** — l'unique feuille de travail | `B5:Q100` | 95 actions, 16 colonnes, 5 colonnes calculées |
| `BD` | Base de données référentielle | `B2:T127` | 19 listes de référence + 8 listes de statuts héritées + 1 workflow documentaire |

### A.3 Les 19 tables Excel

> **Constat du directeur (01/11/2026)** : « il existe des tables dans `BD` qui ne nous servent à rien dans notre projet. »
> Vérification faite sur les 19 tables : **10 ne sont utilisées par aucune colonne de `ACTIONS`** et ne se rattachent pas au suivi des actions.
> **✅ Décision 8 = A (validée le 01/11/2026)** : ces 10 tables sont **écartées du périmètre** — ni reprises, ni modélisées.

| # | Nom de table | Plage | Nb valeurs | Contenu réel | Utilisée par `ACTIONS` ? | Dans le projet ? |
|---|---|---|---|---|---|---|
| 1 | `Table226` | `ACTIONS!B5:Q100` | 95 lignes | Les actions | **OUI — cœur du système** | ✅ **OUI** (structure reproduite, aucune donnée reprise) |
| 2 | `Tableau3` | `BD!C13:C127` | 115 | **ARTICLE** — noms de produits (ACETEM E472…) | non | ❌ **NON** — référentiel stock |
| 3 | `Tableau5` | `BD!B13:B22` | 10 | **CATEGORIE** — emballages (Barquette PET, Seau…) | non | ❌ **NON** — référentiel stock |
| 4 | `Tableau6` | `BD!E13:E30` | 18 | **FOURNISSEUR** (AKROUF RIAD…) | non | ❌ **NON** — Q3 : partenaires ≠ fournisseurs |
| 5 | `Tableau9` | `BD!D13:D33` | 21 | **MARQUE** (CHEEZY, TARTINO…) | non | ❌ **NON** — référentiel stock |
| 6 | `Table1` | `BD!N2:N13` | 11 | **Départements** internes | **OUI** (STRUCTURE si ACTEUR=GD_TRADING) | ✅ **OUI** — 11 départements recréés (Q1) |
| 7 | `Table7` | `BD!S2:S21` | 19 | **ACTEUR** — noms de personnes | **OUI** (ASSIGNE A) | ✅ **OUI** — règle du rôle seulement, **aucun nom repris** |
| 8 | `Table8` | `BD!M2:M4` | 2 | `GD_TRADING` / `PARTENAIRE` | **OUI** (ACTEUR) | ✅ **OUI** |
| 9 | `Table9` | `BD!T2:T17` | 15 | **Jours fériés** 2026 | **OUI** (mais lu en version externe) | ✅ **OUI** — calendrier à fournir (DÉCISION 5) |
| 10 | `Table10` | `BD!L2:L6` | 4 | **URGENCE** (Immédiate, Courte échéance…) | **OUI** | ✅ **OUI** |
| 11 | `Table108` | `BD!L9:L13` | 4 | **IMPORTANCE** (Critique, Élevée…) | **OUI** | ✅ **OUI** |
| 12 | `Table1089` | `BD!G36:G42` | 6 | **PILIER** (ÉQUIPE, GOUVERNANCE…) | **OUI** (ELEMENT) | ✅ **OUI** |
| 13 | `Table108910` | `BD!I36:I37` | 2 | En-têtes `Colonne1`, liste vide | non | ❌ **NON** — résidu vide |
| 14 | `Table14` | `BD!H36:H38` | **0** | En-têtes `Colonne1`, liste vide | non | ❌ **NON** — résidu vide |
| 15 | `Table25` | `BD!G47:J57` | 10 | **Workflow documentaire** B.C. / B.R. | non | ❌ **NON** — hors périmètre (DÉCISION 2) |
| 16 | `Table430` | `BD!N25:N30` | 5 | 5 structures (COMMERCIAL, DIRECTION GENERALE…) | **déclaré mais jamais appliqué** | ❌ **NON** — remplacée par la règle Q1 / Q2 |
| 17 | `OFFRE` | `BD!O25:O32` | 7 | Offres commerciales (M2M, AMBITION 1000…) | non | ❌ **NON** — jamais branchée |
| 18 | `Table31` | `BD!G15:L28` | 13 | **Matrice PRIORITÉ** (urgence × importance) | **OUI** | ✅ **OUI** — règle B.3.4 |
| 19 | `Tableau38` | `BD!L34:L50` | 16 | **TYPE ENTRETIEN** — entretien de véhicules (Vidange, Pneumatiques…) | non | ❌ **NON** — parc automobile |

**Bilan** : **9 tables utiles** (dont `Table226`) · **10 tables hors périmètre du projet**.

> **À ne pas oublier** : la feuille `BD` contient en plus **8 listes de statuts héritées** (colonnes B à F, lignes 3 à 9 : « Attente accord », « Attente maquette », « Attente livraison article »…) qui ne sont **reliées à aucune colonne de `ACTIONS`**. Ce ne sont pas des tables Excel, mais elles relèvent du même constat — voir **DÉCISION 2** (workflows orphelins).

### A.4 Le lien externe — point critique

Le classeur référence un **classeur maître externe** dont les feuilles sont :

```
BD · ENTITE · ACTIONS-KPI · ACTIONS · ACTIONS PERIODIQUES · ACTIONS BIS
TELECOMS · FLOTTE · PARC IT · SI · IMPUTATION · PRESTATIONS
DOSSIER · DECHARGE · JOURNAL · DEVELOPPEMENT
```

Conséquences identifiées :
1. `ClasseurYD.xlsx` est un **extrait amputé** du classeur maître (2 feuilles sur 16).
2. La formule `DATE RAPPEL` utilise `[1]!Table9[FERIE]` → elle lit les jours fériés du **fichier externe**, pas la table locale `BD!Table9` qui existe pourtant.
3. 26 plages nommées sont **dupliquées** : une version locale + une version `[1]!...` (ex. `ACTEUR`, `PILIER`, `PRIORITE`).
4. Le classeur maître contient des modules entiers non présents ici : parc informatique, flotte, télécoms, décharge, journal, développement, prestations, dossiers, KPI.

> **Conséquence pour le projet** : il est impossible d'affirmer que `ACTIONS` est le périmètre complet du suivi des TODOLists de GD Trading. Le directeur doit confirmer.
>
> **✅ Réponse du directeur (01/11/2026)** : le **classeur maître n'est pas disponible** — il ne peut pas être fourni. Seul cet extrait de 2 feuilles existe.
> **DÉCISION 1 = C (validée le 01/11/2026)** : conception **modulaire** sur l'extrait disponible. L'option (B) « récupérer le classeur maître » devient **irréalisable**, pas seulement plus longue. Les modules absents (parc informatique, flotte, télécoms, KPI, dossiers…) sont **hors périmètre**, sans préjudice d'un ajout ultérieur.
> **Conséquence directe** : le lien externe est **abandonné** ; les jours fériés devront être saisis dans une table **administrable** de l'application (voir DÉCISION 5).

---

## PARTIE B — ÉTAPE 2 : DOCUMENTATION DU FONCTIONNEMENT ACTUEL

### B.1 Les vraies entités métier (hors feuilles)

Conformément à la règle « ne pas transformer chaque feuille en table », voici les **entités du domaine** identifiées :

| Entité | Origine Excel | Nature |
|---|---|---|
| **Action** | `ACTIONS!B6:Q100` (95 lignes) | Entité centrale, porteuse de 16 attributs |
| **Personne** | `BD!Table7` (19) | Collaborateur GD Trading, cible d'assignation |
| **Structure** | `BD!Table8` + `Table1` + `Table430` | **Validé 29/10/2026** : **pilote** = employé GD Trading (interne) **ou** partenaire non-employé (externe) |
| **Département** | `BD!Table1` (11) | **Référentiel administrable** (ajout / suppression) ; attribut **optionnel** de l'Employé |
| **Pilier** | `BD!Table1089` (6) | Thématique de l'action (EQUIPE, PROCESS…) |
| **Règle de priorité** | `BD!Table31` (13) | Matrice Urgence × Importance → libellé + score + fréquence |
| **Niveau d'urgence** | `BD!Table10` (4) | Referentiel de la matrice |
| **Niveau d'importance** | `BD!Table108` (4) | Referentiel de la matrice |
| **Jour férié** | `BD!Table9` (15) | Calendrier d'entreprise |
| **Fournisseur / Partenaire** | `BD!Tableau6` (18) | Tiers |
| **Statut d'avancement métier** | `BD!B2:I9` (8 listes) | Hérité du classeur maître, non raccordé |
| **Étape de workflow documentaire** | `BD!Table25` (10) | Hérité, non raccordé |
| **Article / Catégorie / Marque** | `BD!Tableau3/5/9` (115/10/21) | Hérité du module stock, non raccordé |
| **Offre commerciale** | `BD!OFFRE` (7) | Hérité, non raccordé |
| **Type d'entretien** | `BD!Tableau38` (16) | Hérité, non raccordé |
| **Historique de modification** | *absent du fichier* | **À créer** (traçabilité) |

> **Révision du 29/10/2026 (validée)** : la liste dépendante de `ACTEUR` contient des **employés** (si `GD_TRADING`) ou des **partenaires non-employés** (si `PARTENAIRE`), et non plus des départements. Détail, modèle et décisions : voir **B.3.5**.

### B.2 Dictionnaire des 16 colonnes de `ACTIONS`

| # | Col | Libellé | Saisi ? | Origine / Règle |
|---|---|---|---|---|
| 1 | B | `STATUT` | **calculé** | Machine à 6 états (B.3.1) |
| 2 | C | `PRIORITE` | saisi | Liste imposée `PRIORITE` = 13 valeurs (B.3.4) |
| 3 | D | `PROGRESSION` | **calculé** | Avancement temporel 0→1 (B.3.2) |
| 4 | E | `DATE ACTION` | saisi | Date de lancement planifiée. **Obligatoire** (95/95) |
| 5 | F | `D.DEBUT` | saisi | Date de début réelle. **Obligatoire** (95/95) |
| 6 | G | `DATE RAPPEL` | **calculé** | Prochaine revue en jours ouvrés (B.3.3) |
| 7 | H | `ELEMENT` | saisi | Liste imposée `PILIER` = 6 valeurs |
| 8 | I | `ACTION` | saisi | Libellé libre, une seule ligne, 55 car. |
| 9 | J | `ACTEUR` | saisi | `GD_TRADING` (79) ou `PARTENAIRE` (16) |
| 10 | K | `STRUCTURE` | saisi | **Dépend de J** (B.3.5) |
| 11 | L | `ASSIGNE A` | saisi | Liste imposée `RESPONSABLE` = 19 personnes |
| 12 | M | `D.FIN PREVUE` | saisi | Échéance contractuelle (94/95) |
| 13 | N | `D.FIN` | saisi | Date de clôture réelle (45/95) |
| 14 | O | `DUREE G.` | **calculé** | Durée totale (B.3.6) |
| 15 | P | `DUREE E.` | **calculé** | Écart de clôture (B.3.6) |
| 16 | Q | `COMMENTAIRE` | saisi | **Champ libre — 100 % vide** |

**Bilan** : 5 colonnes calculées / 11 saisies. 6 champs obligatoires (E, F, H, I, J, K, L) ; M fortement recommandé.

### B.3 Spécification des 5 calculs (pseudo-code)

#### B.3.1 `STATUT` — machine à états (ordre de test impératif)

```
SI   COMMENTAIRE = "Annulée"          → "Annulée"
SI   COMMENTAIRE = "Suspendue"        → "Suspendue"
SI   D.FIN est renseignée            → "Achevée"
SI   DATE ACTION est vide
  OU DATE ACTION > AUJOURDHUI        → "A faire"
SI   D.FIN PREVUE < AUJOURDHUI       → "Retard"
SINON                                → "En cours"
```

6 états : `A faire` · `En cours` · `Retard` · `Achevée` · `Annulée` · `Suspendue`.
Répartition observée : **45 Achevée · 43 Retard · 7 En cours** · 0 A faire · 0 Annulée · 0 Suspendue.

> **Vérification indépendante** : j'ai rejoué la formule sur les 95 lignes → **0 écart**. Le fichier est cohérent avec lui-même.

#### B.3.2 `PROGRESSION` — avancement temporel

```
RÉF = DATE ACTION, ou AUJOURDHUI si DATE ACTION est vide

SI   D.FIN est renseignée                          → 1        (100 %)
SI   RÉF > D.FIN PREVUE                            → "En retard"   (texte)
SI   RÉF < D.DEBUT                                 → 0
SINON  (RÉF − D.DEBUT) / (D.FIN PREVUE − D.DEBUT)
et le tout enveloppé dans IFERROR → "-" en cas d'erreur (division par zéro)
```

**Aucun pourcentage n'est saisi manuellement dans le fichier.**
Répartition : 78 valeurs numériques, 16 valeurs textuelles `"En retard"`, 1 valeur `"-"`.
→ La colonne accepte donc **un nombre OU une chaîne** : c'est un type mixte.

#### B.3.3 `DATE RAPPEL` — échéancier de relance en jours ouvrés

```
FRÉQUENCE = f(PRIORITE) :
   Immédiate  & Critique = 1     Courte échéance & Critique = 6    Planifiable & Critique = 15
   Immédiate  & Elevée   = 2     Courte échéance & Elevée   = 7    Planifiable & Elevée   = 20
   Immédiate  & Modérée  = 4     Courte échéance & Modérée  = 8    Planifiable & Modérée  = 25
   Immédiate  & Faible   = 5     Courte échéance & Faible   = 10   Planifiable & Faible   = 30
                                                        Pas urgent & Faible   = 45
   (toute autre valeur) = 7

BASE = SI (D.DEBUT + FRÉQUENCE) > AUJOURDHUI  ALORS  D.DEBUT  SINON  DATE ACTION

SI DATE ACTION est vide  OU  D.FIN est renseignée  →  "-"
SINON  WORKDAY.INTL(BASE, FRÉQUENCE, week_end = 7, jours_fériés = classeur externe)
```

> `week_end = 7` signifie **vendredi + samedi** (calendrier Algérie/Tunisie), et **non** samedi+dimanche. Règle implicite, jamais documentée dans le fichier.
> Les jours fériés sont lus dans `[1]!Table9[FERIE]` → **le classeur externe**, pas la table locale `BD!T3:T17`.

#### B.3.4 `PRIORITE` — matrice Urgence × Importance (`BD!Table31`)

| Urgence \ Importance | Critique | Elevée | Modérée | Faible |
|---|---|---|---|---|
| **Immédiate** | Score 12 · 1 j | 11 · 2 j | 10 · 4 j | 9 · 5 j |
| **Courte échéance** | 8 · 6 j | 7 · 7 j | 6 · 8 j | 5 · 10 j |
| **Planifiable** | 4 · 15 j | 3 · 20 j | 2 · 25 j | 1 · 30 j |
| **Pas urgent** | *(absente)* | *(absente)* | *(absente)* | 0 · 45 j |

Colonne `Action à Prendre` : `Faire immédiatement` (5) · `Planifier` (4) · `Déléguer si possible` (4) — **5 lignes vides**.
`PRIORITE` est une **chaîne concaténée** : `Urgence & " & " & Importance`.

**Usage réel vs capacité** : 10 des 13 niveaux seulement sont utilisés.
`Immédiate & Elevée` 43 · `Immédiate & Critique` 27 · `Courte échéance & Modérée` 8 · `Courte échéance & Elevée` 7 · `Immédiate & Modérée` 5 · `Courte échéance & Critique` 3 · `Courte échéance & Faible` 1 · `Immédiate & Faible` 1.
→ **3 niveaux jamais utilisés** : `Planifiable & *` (×4) et `Pas urgent & Faible`.

#### B.3.5 `ACTEUR` → `STRUCTURE` : dépendance conditionnelle

> **✅ SECTION RÉVISÉE ET VALIDÉE LE 29/10/2026 — CORRECTION DU DIRECTEUR.**
> La règle ci-dessous remplace l'interprétation initiale (départements internes / liste `Table430`).

**Règle demandée**

```
ACTEUR ∈ { GD_TRADING , PARTENAIRE }

SI ACTEUR = "GD_TRADING"  →  liste des EMPLOYÉS de GD Trading,
                             ajoutés un par un dans le système

SI ACTEUR = "PARTENAIRE"  →  liste des PARTENAIRES,
                             qui ne sont PAS des employés de GD Trading
```

**Conséquences de la règle demandée**

- La liste dépendante n'est plus une liste de **départements** : c'est une liste de **personnes** (employés) ou d'**organisations** (partenaires).
- Les deux listes sont des **référentiels administrés dans l'application**, et non plus des listes figées dans une feuille Excel.
- Un employé est saisi **individuellement** (« un par un ») : le référentiel **Employés** est donc une table à part entière.
- Les partenaires sont saisis dans un **référentiel Partenaires** distinct du référentiel Employés.

**Fonctionnement observé dans l'Excel actuel (conservé pour mémoire)**

| `ACTEUR` | Lignes | Contenu réel de `STRUCTURE` |
|---|---|---|
| `GD_TRADING` | 79 | **Départements** : POLE SUPPORT & PERFORMANCE · POLE DEVELOPPEMENT DES ACTIVITES · COMPTABILITE · M.Gx & LOGISTIQUE · COORDINATION R&I · FINANCES · B.U.INGREDIENTS · ACHATS INTERNATIONAUX · TOP MANAGEMENT (9 observés sur 11 déclarés) |
| `PARTENAIRE` | 16 | **Noms de partenaires** : AKROUF RIAD · ARSHINE · BELDJEBEL BELKACEM · CAGEX · HABITA NEDJLA · MIIP · ONTA · SARL LEADERSOFT · SARL STAR BLX · SPA BNP PARIBAS EL-DJAZAIR · SPA CPA · SPA FALAIT (12 distincts) |

> L'Excel ne respectait donc **pas** la règle demandée : il utilisait les départements pour les internes, et la liste `Table430` (COMMERCIAL, DIRECTION GENERALE, FINANCE & COMPTABILITE, RESSOURCES HUMAINES, SUPPLY CHAIN) n'était **jamais appliquée** aux partenaires. La liste `OFFRE` (M2M, AMBITION 1000, AMBITION 2000, BUSINESS 1500, BUSINESS 2000, DATA PRO 2500, DIMA PRO 2000) reste, elle aussi, branchée nulle part.

**DÉCISIONS RETENUES (29/10 et 01/11/2026 — validées par le directeur)**

| # | Question | Décision retenue |
|---|---|---|
| **Q1** | Les 11 départements internes | Le **département** devient un **attribut optionnel** de la fiche Employé. Les **11 départements sont recréés** dans l'application comme **référentiel administrable** (ajout / suppression par l'admin). |
| **Q2** | Rôle de `STRUCTURE` vs `ASSIGNE A` | **Option 1** : `STRUCTURE` = employé **pilote / responsable** ; `ASSIGNE A` = employé **exécutant**. Les deux rôles sont **distincts et conservés**. |
| **Q3** | Référentiel Partenaires | **Non** aux 18 fournisseurs de `Tableau6`. Référentiel **Partenaires distinct**, **créé de zéro** : **aucun nom repris de l'Excel** *(règle du 29/10/2026)*. |
| **Q4** | Employés actifs / inactifs | **Oui**. Un employé peut être **actif ou inactif** ; il n'est **jamais supprimé** s'il est référencé par une action. |

**Modèle retenu pour l'action**

```
ACTION
├── acteur          : GD_TRADING | PARTENAIRE
├── employeId       → Employé      (si GD_TRADING)   = PILOTE / RESPONSABLE
├── partenaireId    → Partenaire   (si PARTENAIRE)   = ORGANISATION EXTERNE
└── assigneId       → Employé                        = EXÉCUTANT

EMPLOYÉ
└── departementId   → Département  (optionnel)        = attribut de l'employé (Q1)
```

**Règles de cohérence retenues**

- `acteur = GD_TRADING` → `employeId` renseigné, `partenaireId` vide.
- `acteur = PARTENAIRE` → `partenaireId` renseigné, `employeId` vide.
- `assigneId` = toujours un **employé interne** (même pour une action portée par un partenaire : c'est le suivi interne).
- `employeId` est **obligatoire** quand `acteur = GD_TRADING` et `partenaireId` obligatoire quand `acteur = PARTENAIRE` (aucune action héritée : la règle s'applique dès le départ).
- Libellés d'écran proposés : `STRUCTURE` → **« Pilote / Responsable »** ; `ASSIGNE A` → **« Assigné à (exécutant) »**.

**Reprise des données — décisions du 29/10 et du 01/11/2026**

| Donnée Excel | Reprise | Traitement |
|---|---|---|
| **95 actions** (libellé, dates, priorité, statut, durées) | ❌ **Aucune** | **DÉCISION 11 = B** : l'application démarre avec une **liste d'actions vide** |
| `ASSIGNE A` (19 noms) | ❌ Non | Aucun nom d'acteur importé ; les employés sont **nouveaux** |
| `STRUCTURE` = partenaire (12 noms) | ❌ Non | Les partenaires sont **nouveaux** |
| `STRUCTURE` = département (9 valeurs utilisées) | ⚠️ Valeurs non reprises | Les **11 départements** sont **recréés** dans un référentiel administrable |
| Référentiel **Employés** | ✅ Créé dans l'application | Saisie un par un, actifs / inactifs |
| Référentiel **Partenaires** | ✅ Créé dans l'application | Saisie un par un |
| Référentiel **Départements** | ✅ **11 départements recréés** | Ajout / suppression par l'admin |
| **Règles métier** (statuts, priorités, piliers, jours fériés, formules) | ✅ **Reproduites** | Ce sont des règles, pas des noms d'acteurs |

> **Décision 11 retenue (B)** : **aucune action n'est reprise**. L'historique des 95 actions reste consultable dans le **fichier Excel source**, archivé dans `sources\classeur\ClasseurYD.xlsx`.
>
> **Suppression d'un département** : autorisée seulement s'il n'est **référencé par aucun employé ni aucune action** ; sinon, proposer une **réaffectation** avant suppression *(proposition technique)*.

#### B.3.6 `DUREE G.` et `DUREE E.`

```
DUREE G. = SI D.FIN renseignée  ALORS  D.FIN − D.DEBUT
           SINON                 AUJOURDHUI − D.DEBUT

DUREE E. = SI (D.FIN vide) OU (D.FIN PREVUE vide)        → "-"
           SINON SI MIN(D.FIN, D.FIN PREVUE) < D.DEBUT   → "Erreur"
           SINON  D.FIN − D.FIN PREVUE
```

Sémantique de `DUREE E.` : **positif = clôturé en retard**, **négatif = clôturé en avance**, `0` = à l'heure, `Erreur` = une date de clôture précède la date de début.

Observations : 50 × `"-"` (non clôturées) · 10 × `0` · 27 × en retard (max `+349 j`) · 18 × en avance (min `−184 j`).

### B.4 Volumétrie et périodes couvertes

| Colonne | Min | Max | Rempli |
|---|---|---|---|
| `D.DEBUT` | 22/01/2026 | 28/09/2026 | 95/95 |
| `DATE ACTION` | 11/05/2026 | 28/09/2026 | 95/95 |
| `D.FIN PREVUE` | 26/05/2026 | **31/08/2028** | 94/95 |
| `D.FIN` | 25/05/2026 | **15/07/2027** | 45/95 |

`DUREE G.` : min 0 j · max 396 j · moyenne 69 j.
`D.FIN PREVUE` à 2028 et `D.FIN` à 2027 → **valeurs aberrantes** (cf. B.6, anomalie n°4).

Répartition par pilier : RESSOURCES/OUTILS 29 · PROCESS 25 · GOUVERNANCE 19 · REPORTING 14 · EQUIPE 7 · **PERFORMANCE 0**.
Répartition par acteur : GD_TRADING 79 · PARTENAIRE 16.
Charge par personne : D.-E.ZOUBA 25 · M.BENGUERGOURA 16 · R.NAFA 12 · M.MOBARKI 11 · H.ABBOU 10 · N.HABACHI 9 · SUPPLY CHAIN 7 · O.BENREDOUANE 2 · A.KOUT 1 · N.BOUZID 1 · W.GUEZATI 1.

### B.5 Règles de présentation (= charte graphique à reproduire)

**Couleurs de statut** (mise en forme conditionnelle sur `B6:Q100`) :

| Statut | Couleur appliquée |
|---|---|
| `Retard` | rouge |
| `En cours` | bleu |
| `Achevée` | vert |
| `Suspendue` | orange |
| `Annulée` | gris |

**Autres règles** :
- `PROGRESSION` : barre de données (bleu `#638EC6`) pour lecture visuelle de l'avancement.
- `DATE RAPPEL <= AUJOURDHUI` : mise en évidence **rappel en retard**.
- `AUJOURDHUI+1 <= DATE RAPPEL <= AUJOURDHUI+5` : mise en évidence **rappel imminent**.
- `ACTION` : **détection automatique des doublons** (règle active, mais **0 doublon détecté** sur les 95 lignes).
- `BD!S3:S21` (personnes) : détection de doublons.
- `BD!E14:E30` (fournisseurs) : détection de doublons.
- Volets figés en `M6` (lignes 1-5 + colonnes B-L toujours visibles) → l'Excel est conçu pour un affichage large avec action + assigné à gauche.
- 43 lignes masquées + filtre `_FilterDatabase` défini sur `J5:Q100` (**incomplet** : devrait être `B5:Q100`).

### B.6 Anomalies et incohérences relevées

| # | Anomalie | Emplacement | Impact |
|---|---|---|---|
| 1 | `D.FIN PREVUE` contient le **texte** `"06/08/02026"` (double zéro, et stocké comme chaîne et non comme date) | `ACTIONS!M55` | `PROGRESSION` renvoie `"-"` ; `DATE RAPPEL` faux ; `DUREE E.` faux |
| 2 | `DATE ACTION` **antérieure** à `D.DEBUT` | `R22` (16/05 avant 17/05), `R95` (09/06 avant 18/06) | `PROGRESSION` incohérente |
| 3 | `ELEMENT` vide alors que la liste est obligatoire | `R20` — action = `"SGFDSQGGFDFDHDH"` (texte de test manifestement) | Anomalie documentée ; sans impact, aucune action n'est reprise (DÉCISION 11 = B) |
| 4 | `D.FIN PREVUE` = **31/08/2028** (ligne 44) et `D.FIN` = **15/07/2027** (ligne 43) | `R44`, `R43` | Écarts `DUREE E.` = `+349 j` et `-184 j` — saisies erronées |
| 5 | Incohérence de genre dans un libellé de référence | `BD!L6` = « Pas **urgente** » vs `BD!G28` et la formule `DATE RAPPEL` = « Pas **urgent** » | Risque de rejet de la validation |
| 6 | Validation de données **erronée** : une liste de priorités est appliquée à la colonne calculée `PROGRESSION` | `ACTIONS!D6:D100` | Inopérant, mais dégradant l'ergonomie Excel |
| 7 | La liste `STRUCTURE` pour `PARTENAIRE` n'est pas respectée (nom du partenaire saisi) | 16 lignes | Règle métier non écrite |
| 8 | Jours fériés : **15 dates pour 2026 seulement**, et lues depuis le **classeur externe** | `BD!T3:T17` + `[1]!Table9[FERIE]` | Calendrier incomplet et fragile |
| 9 | `week_end = 7` (ven.+sam.) codé en dur, jamais documenté | formule `DATE RAPPEL` | Règle implicite |
| 10 | Aucune validation sur les colonnes de dates `E, F, G, M, N` | `ACTIONS` | Saisie libre, source de l'anomalie n°1 |
| 11 | 26 plages nommées dupliquées (local + `[1]!...`) | `workbook.xml` | Fragilité du classeur |
| 12 | `COMMENTAIRE` servant de porte d'entrée aux états `Annulée`/`Suspendue`, et **100 % vide** | `ACTIONS!Q6:Q100` | États inatteignables en pratique |
| 13 | Table `Table14` déclarée mais **complètement vide** | `BD!H36:H38` | Résidu |
| 14 | 5 lignes vides dans `Action à Prendre` | `BD!G22:G23`, `G27:G28` | Matrice incomplète |
| 15 | 43 lignes masquées + filtre ne couvrant qu'une partie du tableau | `ACTIONS` | Risque de perte de vue |
| 16 | Table `Table25` — 6 valeurs « Statut actuel » sont des **formules `=+I(n-1)`** pointant sur la ligne précédente | `BD!G50,G52,G53,G54,G55,G57` | Fragile si insertion de ligne |

### B.7 Doublons et qualité des données

| Contrôle | Résultat |
|---|---|
| Doublons sur `ACTION` (95 lignes) | **0 doublon** — 95 libellés distincts |
| Doublons sur `ASSIGNE A` | 0 (les 19 personnes de la liste sont toutes distinctes) |
| Doublons sur `STRUCTURE` | 0 |
| Doublons sur `ELEMENT` | 0 |
| Champs `DATE ACTION` / `D.DEBUT` | 95/95 remplis |
| Champ `D.FIN PREVUE` | 94/95 (1 anomalie de type) |
| Champ `COMMENTAIRE` | **0/95 renseigné** |
| Statuts `Annulée` / `Suspendue` | **0 occurrence** |
| Pilier `PERFORMANCE` | **0 occurrence** sur 6 référencés |

### B.8 Ce que l'application doit reproduire à l'identique

Liste de conformité — **état au 01/11/2026** (les écarts sont des décisions validées, pas des oublis) :

1. Les 16 attributs d'une action, avec la même sémantique.
2. La machine à 6 états et son **ordre de test impératif** pour les états calculés. **Écart validé (DÉCISION 3 = B1)** : `Annulée` et `Suspendue` ne sont plus déclenchés par le texte du commentaire mais par un **choix manuel prioritaire** ; les 4 autres états restent calculés.
3. La matrice de priorité 13 lignes (Urgence × Importance) et ses fréquences.
4. L'avancement **temporel**. **Écart validé (DÉCISION 4 = C)** : la progression devient un **pourcentage manuel prioritaire**, le calcul temporel servant de **repli** ; les 3 sorties mixtes (nombre / `"En retard"` / `"-"`) disparaissent — « En retard » est porté par le **statut**.
5. L'échéancier de relance en **jours ouvrés avec week-end vendredi+samedi** et jours fériés d'entreprise. **Précision validée (DÉCISION 5 = A1)** : fériés en **table administrable** (15 dates 2026 reprises), week-end **paramétrable**.
6. La dépendance `ACTEUR` → `STRUCTURE` : **pilote** employé si `GD_TRADING`, **partenaire non-employé** si `PARTENAIRE` ; `ASSIGNE A` reste l'**exécutant** *(validé le 29/10/2026)*.
7. `DUREE G.` et `DUREE E.` avec leur cas `Erreur` — **sémantique des sigles encore À VALIDER (A8)**.
8. Le code couleur des 5 statuts + barre de progression + signaux de rappel (échu / imminent) + détection de doublons d'action.
9. Les **employés GD Trading** (saisis un par un, **actifs/inactifs**), les **partenaires non-employés**, et les **11 départements** recréés dans un **référentiel administrable** (ajout / suppression), attribut **optionnel** de l'employé *(validé le 01/11/2026)*.
10. **Nouveau (DÉCISION 3 / 4)** : un champ de **dérogation manuelle** du statut et un champ de **progression manuelle**, tous deux optionnels et prioritaires sur le calcul.

---

## PARTIE C — CE QUI MANQUE DANS L'ANCIEN SYSTÈME

Éléments **absents** du fichier, que l'application devra probablement apporter :

| Manque | Conséquence |
|---|---|
| **Aucun historique de modification** | Impossible de savoir qui a changé quoi, ni quand. Seule trace : `creator`/`lastModifiedBy` du fichier. |
| **Aucune authentification ni rôle** | Le fichier n'a qu'un auteur ; n'importe qui peut tout modifier. |
| **Aucune alerte** | `DATE RAPPEL` est calculée mais **rien ne previent** que la revue est due. |
| **Aucune pièce jointe** | Impossible de joindre un devis, un PV, un rapport. |
| **Aucun commentaire structuré** | `COMMENTAIRE` est un champ texte unique, non conversationnel. |
| **Aucun KPI ni tableau de bord** | Le classeur maître avait une feuille `ACTIONS-KPI`, absente ici. |
| **Aucune recherche ni filtre multicritère** | Le filtre Excel ne couvre qu'une partie du tableau. |
| **Aucun export** | Ni PDF, ni export Excel, ni impression. |
| **Pas de rattachement à un service pivot** | `STRUCTURE` = département, mais on ne sait pas si l'action concerne ce département ou un autre. |

---

## PARTIE D — AMBIGUÏTÉS ET POINTS « À VALIDER »

| # | Ambiguïté | Pourquoi c'est bloquant |
|---|---|---|
| A1 | Le classeur ne contient que 2 feuilles sur 16 et pointe vers un classeur maître. | On ne sait pas si le périmètre du TODO list est complet (TELECOMS, FLOTTE, PARC IT, SI, DECHARGE, JOURNAL, DEVELOPPEMENT manquent). |
| A2 | Les 8 listes de statuts d'avancement (`Attente accord`, `Attente maquette`, `Attente cromalin`, `Envoi échantillon`, `Réception en attente`…) ne sont reliées à aucune colonne. | Elles sugèrent un **deuxième workflow**, métier plus fin que les 6 statuts. |
| A3 | Le workflow documentaire `Table25` (D.A. refusée → approuvée → B.C. imprimée → Réception → B.R. clôturée, codes 100→999) est orphelin. | Workflow complet à 10 étapes avec 5 rôles. Hors périmètre ou module à part ? |
| A4 | `STRUCTURE` = nom du partenaire quand `ACTEUR = PARTENAIRE`, alors qu'une autre liste existe. | Faut-il un champ « Fournisseur/Partenaire » distinct de « Structure » ? |
| A5 | La liste `OFFRE` (M2M, AMBITION 1000, BUSINESS 2000, DATA PRO 2500…) n'est branchée nulle part. | Classification commerciale des partenaires — wanted ou résidu ? |
| A6 | Les référentiels stock (115 articles, 21 marques, 18 fournisseurs, 10 catégories) sont présents mais inutilisés. | Données de référence du futur module stock, ou champ « objet de l'action » ? |
| A7 | `TYPE ENTRETEIN` (16 valeurs : Filtre (Air), Plaquettes de frein, Vidange, Permutation des pneumatiques…) est orphelin. | Résidu d'un module véhicules, ou catalogue d'actions récurrentes à créer ? |
| A8 | `DUREE G.` et `DUREE E.` : les sigles ne sont explicités nulle part. | Interprétation retenue : G = durée **globale/garantie**, E = durée **d'écart**. À confirmer. |
| A9 | La colonne `PROG` peut contenir un nombre **ou** le texte `"En retard"` **ou** `"-"`. | Type de données à définir proprement en base. |
| A10 | Le régime des jours fériés n'est documenté nulle part et n'est valable que pour 2026. | Quelle autorité fournit le calendrier 2027-2028 ? |
| A11 | **Employé ≠ utilisateur.** L'Excel ne contient que des **noms** (liste `ASSIGNE A`), sans aucun compte ni authentification. L'application, elle, doit avoir des **comptes** avec des rôles. | Personne n'a encore dit **qui doit avoir un compte** : seulement l'admin, les responsables de département, ou tous les employés ? Le rôle est porté par le **compte**, jamais par la fiche employé. |
| A12 | Un **service peut ne pas avoir de responsable** (règle validée), mais un responsable a **obligatoirement** un service. | ✅ **Tranché le 01/11/2026** : **un seul responsable par service** (au plus). |
| A13 | Un `EMPLOYEE` « travaille sur **ses** actions ». | ✅ **Tranché le 01/11/2026** : **les trois** — actions **assignées** à lui, dont il est **pilote**, et qu'il a **créées**. |

---

## PARTIE E — DÉCISIONS À VALIDER

> Format imposé : **problème / options / conséquences / décision attendue**.

### DÉCISION 1 — Périmètre du classeur amputé — ✅ **VALIDÉE le 01/11/2026 (option C)**

- **Problème** : `ClasseurYD.xlsx` ne contient que `ACTIONS` et `BD` sur 16 feuilles, et conserve un lien actif vers un classeur maître.
- **Fait établi (01/11/2026)** : le **classeur maître n'est pas disponible**. L'option (B) est donc **irréalisable**.
- **Décision retenue — option (C)** : **conception modulaire**. Le cœur TODO list est réalisé sur l'extrait disponible (2 feuilles) ; l'architecture est prévue pour accueillir d'autres modules ultérieurement, sans refonte.
- **Conséquences validées** : aucun blocage ; le périmètre livrable est le suivi des actions ; le **lien externe est abandonné** ; les jours fériés seront saisis dans une table **administrable** (DÉCISION 5).
- **Options écartées** : (A) extrait seul sans prévoir d'extension ; (B) classeur maître — **impossible, fichier non disponible**.
- **Référence** : section **A.4** (lien externe).

### DÉCISION 2 — Les workflows orphelins (A2, A3) — ✅ **VALIDÉE le 01/11/2026 (option A)**

- **Problème** : 8 listes de statuts métier (colonnes B à F de `BD`, lignes 3 à 9) et un workflow documentaire à 10 étapes (`Table25`) existent dans le fichier mais ne sont reliés à rien.
- **Décision retenue — option (A)** : **hors périmètre**. Ni les 8 listes de statuts, ni le workflow `Table25` ne sont repris dans l'application de suivi des actions.
- **Conséquences validées** : périmètre centré sur le suivi des actions ; cohérence totale avec **DÉCISION 8 = A** (les 10 tables écartées, dont `Table25`) et **DÉCISION 11 = B** (aucune donnée reprise).
- **Options écartées** : (B) intégrer `Table25` comme module de gestion de dossiers — **contredisait la DÉCISION 8** ; (C) reprendre les 8 listes comme sous-statut avancé d'une action.
- **Référence** : section **A.3** (tableau des 19 tables) et **A.2** (anomalies A2, A3).

### DÉCISION 3 — Statuts `Annulée` et `Suspendue` — ✅ **VALIDÉE le 01/11/2026 (option B1)**

- **Problème** : ces deux états sont déclenchés par la chaîne de caractères « Annulée » / « Suspendue » tapée dans `COMMENTAIRE`. La colonne est vide sur les 95 lignes, donc ces états sont **inatteignables** ; et un simple commentaire peut modifier l'état d'une action.
- **Décision retenue — option (B1)** : **statut explicite + calcul automatique**.
  - `A faire`, `En cours`, `Retard`, `Achevée` restent **calculés à partir des dates**, exactement comme dans l'Excel.
  - `Annulée` et `Suspendue` deviennent des **choix manuels**, prioritaires sur le calcul (équivalent de l'ancien « commentaire = Annulée »).
  - `COMMENTAIRE` redevient un **texte libre**, sans effet sur le statut.
- **Conséquences validées** : comportement actuel conservé pour les 4 états de flux ; les 2 états deviennent réellement accessibles ; le piège du commentaire disparaît.
- **Options écartées** : (A) reproduction stricte de la détection par commentaire — fonctionnalité inutilisable et risquée ; (B2) statut entièrement manuel — perte de l'automatisme `Retard` / `Achevée`.
- **Points techniques à préciser à l'ÉTAPE 7** : nom du champ de dérogation manuelle, et retour possible à l'état calculé (annulation d'un `Annulée` / `Suspendue`).

### DÉCISION 4 — `PROGRESSION` temporelle vs manuelle — ✅ **VALIDÉE le 01/11/2026 (option C)**

- **Problème** : l'avancement est 100 % calculé sur les dates. Une action sans `D.DEBUT` ou sans `D.FIN PREVUE` n'a aucun avancement mesurable, il est impossible de saisir un avancement réel, et la colonne mélange **nombres** (78), **texte « En retard »** (16) et **texte « - »** (1).
- **Décision retenue — option (C)** : **manuel prioritaire, calcul automatique en repli**.
  - L'utilisateur peut saisir un **pourcentage réel** d'avancement.
  - Si le champ est **vide**, le **calcul temporel** de l'Excel s'applique automatiquement.
  - `PROGRESSION` devient un **nombre de 0 à 100 %** ; la valeur texte **« En retard » quitte cette colonne** et reste portée par le **statut**, qui la gère déjà.
- **Conséquences validées** : mesure objective conservée par défaut ; prise de contrôle possible ; fin des types mélangés ; colonne triable et agrégeable.
- **Options écartées** : (A) calcul temporel uniquement — défauts conservés ; (B) saisie manuelle uniquement — perte de l'objectivité du délai.
- **Points techniques à préciser à l'ÉTAPE 7** : nom du champ de saisie, et affichage de la valeur calculée en regard.

### DÉCISION 5 — Jours fériés et jours ouvrés — ✅ **VALIDÉE le 01/11/2026 (option A1)**

- **Problème** : 15 jours fériés pour 2026 seulement, lus depuis un **classeur externe devenu indisponible**, avec un week-end vendredi + samedi codé en dur. Une date de rappel fausse décale les échéances.
- **Décision retenue — option (A1)** : table **`jours_feries` en base**, **administrable** (ajout / suppression par l'admin), **week-end paramétrable** (vendredi + samedi par défaut). Les **15 dates 2026 déjà présentes** dans `BD!Table9` constituent le **jeu initial** :
  `01/01 · 12/01 · 20/03 · 21/03 · 22/03 · 01/05 · 27/05 · 28/05 · 29/05 · 16/06 · 25/06 · 02/07 · 05/07 · 26/08 · 01/11`
- **Conséquences validées** : aucune dépendance externe ; aucune donnée déjà connue perdue ; les années **2027 et 2028 sont à saisir** par l'administrateur.
- **Options écartées** : (A2) table vide au départ — perte des 15 dates connues ; (B) librairie externe — non paramétrable et dépendance hors ligne.
- **Point ouvert résiduel** : l'autorité qui fournit le calendrier des années suivantes (`A10`).

### DÉCISION 6 — Modélisation de `ACTEUR` / `STRUCTURE` — ✅ **VALIDÉE le 29/10/2026**

- **Problème** : le directeur a précisé que la liste dépendante doit contenir les **employés GD Trading** quand `ACTEUR = GD_TRADING`, et les **partenaires non-employés** quand `ACTEUR = PARTENAIRE`. L'Excel actuel fait autre chose : départements pour les internes, noms de partenaires pour les externes.
- **Décision retenue — option (A)** : `STRUCTURE` devient une **référence polymorphe** (`employeId` **ou** `partenaireId`, selon `ACTEUR`) ; `STRUCTURE` = **pilote / responsable**, `ASSIGNE A` = **exécutant** ; le **département** est un attribut **optionnel** de l'employé.
- **Conséquences validées** : deux rôles distincts et conservés ; **aucun nom d'acteur repris de l'Excel** ; les employés et les partenaires sont **créés dans l'application**.
- **Options écartées** : (B) et (C) — perte d'information ou lourdeur de saisie.
- **Référence** : modèle complet, règles de cohérence et reprise des données en **B.3.5**.

### DÉCISION 7 — Rôles et permissions — ✅ **VALIDÉE le 01/11/2026 (4 rôles + matrice)**

- **Problème** : le directeur annonce **un seul type d'utilisateur `ADMIN` (manipulation + consultation)** et **tous les autres en consultation seule**. Le fichier ne contient aucune notion de rôle.
- **Décision retenue — 4 rôles**, portés par le **compte utilisateur** (jamais par la fiche employé — voir A11) :

| Rôle | Nature | Département |
|---|---|---|
| `ADMIN` | Administration complète | Non requis |
| `RESPONSABLE` | Responsable d'un **service** | ✅ **Obligatoire** |
| `EMPLOYEE` | Employé GD Trading qui travaille sur les actions | Facultatif |
| `CONSULTANT` | **Lecture seule** | Facultatif |

**Matrice des droits (validée le 01/11/2026)**

| Opération | `ADMIN` | `RESPONSABLE` | `EMPLOYEE` | `CONSULTANT` |
|---|---|---|---|---|
| Voir les actions | **Tout** | **Son service + ses actions** | **Ses actions** = assignées à lui **+** dont il est pilote **+** créées par lui *(A13)* | **Tout** |
| Créer une action | ✅ | ✅ dans son service | ✅ **ses actions** | ❌ |
| Modifier une action | ✅ | ✅ **son service + ses actions** | ✅ **ses actions** | ❌ |
| Mettre à jour statut / progression / commentaire | ✅ | ✅ | ✅ **ses actions** | ❌ |
| **Supprimer** une action | ✅ **tout** | ✅ **uniquement celles qu'il a lui-même attribuées** | ❌ | ❌ |
| Gérer les référentiels (employés, partenaires, départements, fériés) | ✅ | ❌ | ❌ | ❌ |
| Gérer les comptes et les rôles | ✅ | ❌ | ❌ | ❌ |

**Règles structurelles validées**

- un **responsable** appartient **obligatoirement** à **un** service → `departementId` **requis** ;
- un **service peut ne pas avoir de responsable** → relation **facultative côté département** ;
- les autres rôles peuvent exister **sans** département.

**Conséquences validées**

- Un `RESPONSABLE` qui veut retirer une action **créée par un employé de son service** ne peut pas la supprimer : il peut seulement la passer en **`Annulée`**.
- Un `EMPLOYEE` **ne peut supprimer aucune action**, pas même celles qu'il a créées.
- La règle de suppression du responsable impose de **tracer qui a attribué l'action** → nouveau champ `attribueParId` (voir ÉTAPE 7).

- **Points tranchés le 01/11/2026** :
  - **A12** — **au plus un responsable par service** (un service peut n'en avoir aucun) ;
  - **A13** — « ses actions » = **les trois** : assignées à lui, dont il est pilote, créées par lui.
- **Points techniques à préciser à l'ÉTAPE 7** : lien `compte → employé → département` ; champ `attribueParId` ; devenir du compte d'un responsable dont le département est supprimé.

### DÉCISION 8 — Référentiels stock et tables sans usage (A6, A7) — ✅ **VALIDÉE le 01/11/2026 (option A)**

- **Constat du directeur (01/11/2026)** : « il existe des tables dans `BD` qui ne nous servent à rien dans notre projet. »
- **Problème** : sur les 19 tables de la feuille `BD`, **10 ne sont reliées à aucune colonne de `ACTIONS`** : `Tableau3` (115 articles), `Tableau5` (10 catégories), `Tableau6` (18 fournisseurs), `Tableau9` (21 marques), `Tableau38` (16 types d'entretien de véhicules), `Table25` (workflow documentaire), `Table430` (5 structures jamais appliquées), `OFFRE` (7 offres commerciales), `Table108910` et `Table14` (résidus vides). Détail complet en **A.3**.
- **Décision retenue — option (A)** : ces **10 tables sont écartées du périmètre**. Elles ne sont **ni reprises, ni modélisées** dans l'application de suivi des actions. Seules les **9 tables utiles** (dont `Table226`, les actions) sont reproduites, et uniquement **sous forme de règles** : aucune valeur n'est reprise.
- **Conséquences validées** : périmètre net, aucune donnée inutile en base, aucun référentiel orphelin à maintenir.
- **Options écartées** : (B) conserver des référentiels d'un futur module stock / parc auto ; (C) ajouter un champ « objet de l'action » relié aux articles / fournisseurs.
- **Cohérence** : l'option (A) est cohérente avec **DÉCISION 11 = B** (aucune donnée reprise) et avec **Q3** (partenaires ≠ fournisseurs).
- **Référence** : inventaire complet des 19 tables en **A.3**.

### DÉCISION 9 — Stack technique — ✅ **VALIDÉE le 01/11/2026 (option A)**

- **Problème** : le brief indique « Node.js, Express.js, PostgreSQL, React.js, JavaScript, HTML5, CSS3 ». Une variante **TypeScript + Prisma** avait été évoquée. La stack devait être arrêtée avant l'ÉTAPE 6.
- **Décision retenue — option (A)** : **TypeScript + Prisma de bout en bout**.

| Couche | Technologie retenue |
|---|---|
| Frontend | **React + Vite + TypeScript** |
| Backend | **Node.js + Express + TypeScript** |
| ORM | **Prisma** |
| Base de données | **PostgreSQL** |

- **Conséquences validées** : typage de bout en bout ; modèle relationnel explicite (action ↔ employé pilote / assigné ↔ département ↔ compte ↔ jours fériés) ; **migrations versionnées** ; requêtes paramétrées par l'ORM ; règles de droits et calculs de statuts testables.
- **Options écartées** : (B) HTML/CSS/JS natif sans typage ; (C) React + Express en JavaScript pur, sans typage ni ORM.
- **Point de vigilance technique (à vérifier à l'ÉTAPE 6, pas une décision métier)** : **disponibilité de PostgreSQL** sur le poste ou le serveur cible. Si l'installation s'avère impossible, la question sera rouverte — elle n'est pas présumée acquise.
- **Référence** : journal du 29/10/2026 (clarification de la stack).

### DÉCISION 10 — Emplacement du projet — ✅ **VALIDÉE le 01/11/2026 (option A)**

- **Problème** : le projet Todo List doit être **totalement séparé** de tout autre projet (aucun fichier, dépendance ou base partagé), et son emplacement doit être fixé avant l'ÉTAPE 6.
- **Décision retenue — option (A)** : dossier dédié **`C:\Users\Y.DROUICHE\Documents\GD Trading - TodoList`**. Le code applicatif (`client/`, `server/`, `prisma/`, `package.json`, `.env`) vient s'ajouter **à côté** de `docs\` et `sources\`.
- **Conséquences validées** : séparation totale déjà effective avec `C:\Users\Y.DROUICHE\Documents\Default Project` (ancien projet stock, laissé **intact**) ; aucun fichier, aucune dépendance et aucune base partagés ; analyse et application au même endroit.
- **Option écartée** : (B) autre emplacement — aurait imposé de déplacer le dossier et de corriger les chemins cités dans le document.
- **Conséquence opérationnelle** : la session de travail doit être **déplacée** vers ce dossier avant toute écriture de code, afin qu'aucun fichier ne soit créé dans l'ancien projet.

### DÉCISION 11 — Reprise des 95 actions Excel — ✅ **VALIDÉE le 01/11/2026 (option B)**

- **Problème** : aucune **personne** ni **partenaire** de l'Excel n'est repris (règle du 29/10/2026). Les 95 actions contiennent pourtant du contenu métier (libellé, dates, priorité, pilier, statut, durées).
- **Décision retenue — option (B)** : **aucune action n'est reprise**. L'application démarre avec une **liste d'actions vide** ; seules les **règles de gestion** de l'Excel sont reproduites.
- **Conséquences validées** : démarrage propre, aucune donnée ancienne, aucun acteur orphelin ; l'historique reste consultable dans le fichier Excel source.
- **Options écartées** : (A) 95 actions à réaffecter ; (C) reprise partielle des actions non clôturées.
- **Référence** : reprise des données en **B.3.5**.

### DÉCISION 12 — Politique de comptes utilisateurs (issue de A11) — ✅ **VALIDÉE le 01/11/2026 (option A)**

- **Problème** : l'Excel ne contient **aucun compte** — seulement des noms dans une liste. L'application doit décider **qui peut se connecter**. Cette question n'existe pas dans le fichier source : c'est une **règle entièrement nouvelle**.
- **Décision retenue — option (A)** : **chaque employé du référentiel possède un compte utilisateur**.
  - Rôle **par défaut** à la création : `EMPLOYEE`.
  - Les employés désignés comme chefs de service reçoivent le rôle `RESPONSABLE` (avec `departementId` **obligatoire**).
  - Les comptes en **lecture seule** reçoivent le rôle `CONSULTANT`.
  - Le rôle `ADMIN` est réservé à l'administration de l'application.
- **Conséquences validées** : le rôle `EMPLOYEE` est réellement utilisé ; chaque employé agit sur ses actions sans passer par l'admin ; cohérent avec **DÉCISION 7**.
- **Conséquences pratiques** :
  - la **création d'un employé** s'accompagne de la **création de son compte** ;
  - un employé qui quitte l'entreprise voit son compte **désactivé**, jamais supprimé (cohérent avec **R3**) ;
  - l'admin gère les comptes et l'attribution des rôles.
- **Options écartées** : (B) seuls les employés désignés ; (C) aucun compte employé — aurait rendu le rôle `EMPLOYEE` inutilisable.
- **Point technique à préciser à l'ÉTAPE 7** : politique de mot de passe et procédure de première connexion *(voir ÉTAPE 13 — Sécurité)*.

---

## SUIVI

| Étape | Statut |
|---|---|
| 1 — Analyse complète du fichier Excel | ✅ **TERMINÉE** |
| 2 — Documentation du fonctionnement actuel | ✅ **TERMINÉE** (ce document) — **VALIDÉE PAR LE DIRECTEUR le 01/11/2026** |
| 3 — Analyse des exigences du directeur | ✅ **TERMINÉE ET VALIDÉE le 01/11/2026** → `docs\02_EXIGENCES_DIRECTEUR.md` |
| 4 — Comparaison Excel / exigences | ✅ **TERMINÉE ET VALIDÉE le 02/11/2026** → `docs\03_COMPARAISON_EXCEL_EXIGENCES.md` |
| 5 — Cahier des charges fonctionnel | ✅ **VALIDÉ le 02/11/2026** → `docs\05_CAHIER_DES_CHARGES_FONCTIONNEL.md` (repris après report — **D26 / D27**) ; points **P4, P7, P8, P9, P10** et tension **C12** tranchés — **D28 à D33** |
| 6 — Architecture de l'application | ✅ **TERMINÉE ET VALIDÉE le 02/11/2026** → `docs\04_ARCHITECTURE_APPLICATION.md` |
| 7 — Modèle de données PostgreSQL | ✅ **TERMINÉE ET VALIDÉE le 02/11/2026** → `docs\06_MODELE_DE_DONNEES.md` ; points **M7-01 à M7-09** et **P17** tranchés — **D34 à D43** |
| 8 — API Node.js / Express | ✅ **VALIDÉE le 02/11/2026** → `docs\07_API.md` ; points **A8-01 à A8-14** tranchés — **D44 à D57** |
| 9 — Interface React | ✅ **VALIDÉE le 02/11/2026** → `docs\08_INTERFACE_REACT.md` ; points **A9-01 à A9-12** tranchés — **D58 à D69** |
| 10 — Gestion des rôles et permissions | ✅ **VALIDÉE le 02/11/2026** → `docs\09_ROLES_ET_PERMISSIONS.md` ; aucun point A10 ouvert, 4 zones grises signalées puis **tranchées à l'ÉTAPE 12 (D72 → D75)** |
| 11 — Reprise des données Excel | ✅ **VALIDÉE le 02/11/2026** → `docs\10_REPRISE_DES_DONNEES.md` ; **55 lignes de référence**, 0 donnée métier ; **A11-01 → D70** (compte nominatif), **A11-02 → D71** (saisie manuelle) ; **A11-03 / A11-04** acceptés |
| 12 — Tests | ✅ **VALIDÉE le 02/11/2026** → `docs\11_STRATEGIE_ET_PLAN_DE_TESTS.md` ; **G1 → G4 tranchées (D72 → D75)** ; **62 cas d'autorisation** ; socle technique de test opérationnel, aucun code métier |
| 13 → 15 | ⏸ Non démarrées |

**Aucune règle métier n'a été écrite. Le socle technique de test de l'ÉTAPE 12 est créé ; aucun développement métier tant que l'ÉTAPE 12 n'est pas validée.**

### Pièces encore attendues

1. Le **calendrier des jours fériés** 2027-2028 applicable à GD Trading *(les 15 dates 2026 sont déjà reprises — DÉCISION 5)*.
2. La **liste définitive des consultants** (comptes en lecture seule — DÉCISION 7 / DÉCISION 12 / DÉCISION 21).
3. La **signification des sigles** `DUREE G.` et `DUREE E.` *(A8 — point **P1** du livrable 03)*.
4. La confirmation de la **sémantique de `FREQUENCE`** *(point **P5** du livrable 03)* — la **longueur du libellé** a été tranchée le 02/11/2026 (**D46** : 255 caractères).

> Les documents d'exigences du directeur ont été **reçus le 01/11/2026** et analysés dans le livrable 02.

---

## PARTIE F — JOURNAL DES RÉVISIONS

| Date | Section(s) | Modification | Statut |
|---|---|---|---|
| 02/11/2026 | **SUIVI · journal** | ÉTAPE 11 **livrée le 02/11/2026** (`docs\10_REPRISE_DES_DONNEES.md`) : non-reprise des **95 actions** (D11), **55 lignes de référence**, tables vides, comptes initiaux, ordre et idempotence, procédure, **12 critères d'acceptation** ; **A11-01** et **A11-02** à trancher ; en attente de validation, aucun code écrit. | ⏳ En attente de validation |
| 02/11/2026 | **SUIVI · journal** | ÉTAPE 12 **validée le 02/11/2026** (`docs\11_STRATEGIE_ET_PLAN_DE_TESTS.md`) : plan et socle acceptés en l'état ; **D72 → D75** confirmées ; **D74** précisée — employé **assigné** uniquement, statut calculé **`A faire`** uniquement ; **62 cas d'autorisation** ; ÉTAPE 13 autorisée. Aucun code métier écrit. | ✅ **VALIDÉE** |
| 02/11/2026 | **SUIVI · journal** | ÉTAPE 11 **validée le 02/11/2026** : **A11-01 → D70** (premier compte **nominatif** `ADMIN`, fiche employé, changement de mot de passe obligatoire), **A11-02 → D71** (comptes du personnel créés **manuellement** par l'admin, aucun import nominatif), **A11-03** (seed idempotent, une transaction, exécution manuelle) et **A11-04** (classeur archivé en lecture seule) acceptés. Décisions de référence **D1 → D71**. | ✅ **VALIDÉE** |
| 02/11/2026 | **SUIVI · journal** | ÉTAPE 10 **VALIDÉE le 02/11/2026** (`docs\09_ROLES_ET_PERMISSIONS.md`) : 4 rôles, périmètres, **54 endpoints**, 11 fonctions d'autorisation, cycle de vie des comptes, **54 cas de test** ; **aucun point A10 ouvert** ; **zones grises G1 → G4 reportées avant l'ÉTAPE 13** ; aucun code écrit. | ✅ **Mis à jour le 02/11/2026** |
| 02/11/2026 | **SUIVI · journal** | ÉTAPE 9 **VALIDÉE le 02/11/2026** (`docs\08_INTERFACE_REACT.md`) ; points **A9-01 à A9-12** tranchés (**DÉCISIONS 58 à 69**) ; **P1** et **P5** restent ouverts sur le sens métier ; aucun code écrit. | ✅ **Mis à jour le 02/11/2026** |
| 02/11/2026 | **SUIVI · journal** | ÉTAPE 8 **VALIDÉE le 02/11/2026** (`docs\07_API.md`) ; points **A8-01 à A8-14** tranchés (**DÉCISIONS 44 à 57**) ; **P6, P13, P14, P15 et P16 clos** ; contrat d'API arrêté, aucun code écrit. | ✅ **Mis à jour le 02/11/2026** |
| 02/11/2026 | **SUIVI · journal** | ÉTAPE 7 **validée le 02/11/2026** ; points **M7-01 à M7-09** et **P17** tranchés (**DÉCISIONS 34 à 43**) ; aucune base ni migration créée. | ✅ **Mis à jour le 02/11/2026** |
| 02/11/2026 | **SUIVI · journal** | ÉTAPE 5 **validée le 02/11/2026** ; points **P4, P7, P8, P9, P10** et tension **C12** tranchés (**DÉCISIONS 28 à 33**) ; **plus aucun point bloquant** avant l'ÉTAPE 7. | ✅ **Mis à jour le 02/11/2026** |
| 02/11/2026 | **SUIVI · journal** | ÉTAPE 6 **validée le 02/11/2026** ; ÉTAPE 5 **reprise et livrée** dans `docs\05_CAHIER_DES_CHARGES_FONCTIONNEL.md` (**D27**), en attente de validation ; ÉTAPE 7 non démarrée. | ✅ **Mis à jour le 02/11/2026** |
| 02/11/2026 | **SUIVI · journal** | Mise à jour de cohérence : ÉTAPE 4 **validée le 02/11/2026**, ÉTAPE 5 **reportée (DÉCISION 26)**, ÉTAPE 6 **livrée** dans `docs\04_ARCHITECTURE_APPLICATION.md` (en attente de validation). | ✅ **Mis à jour le 02/11/2026** |
| 02/11/2026 | **En-tête · SUIVI · pièces attendues** | Mise à jour de cohérence : ÉTAPES 1 et 2 **validées**, ÉTAPE 3 **terminée et validée**, ÉTAPE 4 **livrée** dans `docs\03_COMPARAISON_EXCEL_EXIGENCES.md` (en attente de validation) ; pièces encore attendues recentrées sur P1-P3-P5-P6. | ✅ **Mis à jour le 02/11/2026** |
| 01/11/2026 | **Document entier** | **VALIDATION DU DIRECTEUR** : les ÉTAPES 1 et 2 et les DÉCISIONS 1 à 12 sont validées en l'état. Le document devient la référence pour l'ÉTAPE 4. | ✅ **Validé le 01/11/2026** |
| 01/11/2026 | **DÉCISION 10** | Emplacement validé : **`C:\Users\Y.DROUICHE\Documents\GD Trading - TodoList`** — code ajouté à côté de `docs\` et `sources\` ; séparation totale avec l'ancien projet ; session à déplacer avant tout code. | ✅ **Validée le 01/11/2026** |
| 01/11/2026 | **DÉCISION 9** | Stack validée : **option A** — React + Vite + TypeScript · Node + Express + TypeScript · Prisma · PostgreSQL. Point de vigilance : disponibilité de PostgreSQL à vérifier à l'ÉTAPE 6. | ✅ **Validée le 01/11/2026** |
| 01/11/2026 | **PARTIE D · A12 / A13** | **A12** : **au plus un responsable par service**. **A13** : pour un `EMPLOYEE`, « ses actions » = **assignées + pilote + créées**. | ✅ **Tranchés le 01/11/2026** |
| 01/11/2026 | **Q1 · DÉCISION 11** | Départements **recréés** dans un **référentiel administrable** (ajout / suppression) ; **DÉCISION 11 = B** : **aucune action Excel reprise**, démarrage avec une liste vide. | ✅ **Validé le 01/11/2026** |
| 01/11/2026 | **B.8 · DÉCISION 12** | **Chaque employé possède un compte** (option A) ; rôle `EMPLOYEE` par défaut ; `RESPONSABLE` pour les chefs de service ; compte **désactivé** et non supprimé au départ d'un employé. | ✅ **Validée le 01/11/2026** |
| 01/11/2026 | **B.8 · DÉCISION 7** | **4 rôles** (`ADMIN` · `RESPONSABLE` · `EMPLOYEE` · `CONSULTANT`) + **matrice des droits** : responsable = son service + ses actions ; employee = met à jour et **crée ses actions** ; suppression = admin partout, responsable **seulement ses propres attributions**. | ✅ **Validée le 01/11/2026** |
| 01/11/2026 | **B.3 · DÉCISION 5** | Jours fériés : **table administrable** + **15 dates 2026 reprises** de `BD!Table9` ; week-end paramétrable (ven.+sam.) ; aucune dépendance externe. | ✅ **Validée le 01/11/2026** |
| 01/11/2026 | **B.3 · DÉCISION 4** | `PROGRESSION` : **manuel prioritaire + calcul temporel en repli** (option C) ; devient un **nombre 0-100 %** ; « En retard » reste porté par le statut. | ✅ **Validée le 01/11/2026** |
| 01/11/2026 | **B.3 · DÉCISION 3** | Statut **explicite + calcul automatique** (option B1) : les 4 états de flux restent calculés depuis les dates ; `Annulée` / `Suspendue` deviennent des choix manuels prioritaires ; `COMMENTAIRE` redevient un texte libre. | ✅ **Validée le 01/11/2026** |
| 01/11/2026 | **A.2 · DÉCISION 2** | Les **8 listes de statuts** et le **workflow `Table25`** sont **hors périmètre** (option A). Cohérent avec D1, D8 et D11. | ✅ **Validée le 01/11/2026** |
| 01/11/2026 | **A.4 · DÉCISION 1** | Le **classeur maître n'est pas disponible** (réponse du directeur). **Option C retenue** : conception modulaire sur les 2 feuilles ; lien externe abandonné. | ✅ **Validée le 01/11/2026** |
| 01/11/2026 | **A.3 · DÉCISION 8** | Constat du directeur : des tables de `BD` sont inutiles au projet. Inventaire complet des 19 tables (contenu réel + colonne « Dans le projet ? ») : **10 tables hors périmètre**, 9 utiles. **Option A retenue** : aucune des 10 tables n'est reprise ni modélisée. | ✅ **Validée le 01/11/2026** |
| 29/10/2026 | **B.3.5** | `ACTEUR` → `STRUCTURE` : liste des **employés GD Trading** / **partenaires non-employés** ; modèle `pilote` / `partenaire` / `assigné` ; département optionnel ; référentiel Partenaires distinct. | ✅ **Validé le 29/10/2026** |
| 29/10/2026 | B.1, B.8 | Mise en cohérence avec la révision B.3.5. | ✅ **Validé le 29/10/2026** |
| 29/10/2026 | DÉCISION 6 | Option (A) retenue : référence polymorphe `employeId` / `partenaireId` ; rôles distincts pilote / exécutant. | ✅ **Validée le 29/10/2026** |
| 29/10/2026 | DÉCISION 9 | Stack clarifiée : option A = **TypeScript + Prisma** de bout en bout ; suppression de toute référence à un autre projet. | ✅ **Validée le 01/11/2026 (voir ligne dédiée)** |
| 29/10/2026 | DÉCISION 10 | Emplacement aligné sur le dossier dédié `GD Trading - TodoList` (suppression de la référence à un autre projet). | ✅ **Validée le 01/11/2026 (voir ligne dédiée)** |
| 29/10/2026 | **B.3.5 · DÉCISION 6 · DÉCISION 11** | **Aucune migration de noms d'acteurs** depuis l'Excel : employés et partenaires sont **créés dans l'application**. | ✅ **Validé le 29/10/2026** |

### Décisions issues de la révision — Q1 à Q4

| # | Question | Décision retenue | Statut |
|---|---|---|---|
| Q1 | Les 11 départements internes : supprimés, ou attribut de l'employé ? | **Attribut optionnel** de la fiche Employé ; **11 départements recréés** dans un référentiel administrable (ajout / suppression) | ✅ Validé le 01/11/2026 |
| Q2 | Rôle de `STRUCTURE` vs `ASSIGNE A` | `STRUCTURE` = **pilote** · `ASSIGNE A` = **exécutant** (option 1) | ✅ Validé |
| Q3 | Le référentiel Partenaires reprend-il les 18 fournisseurs de `Tableau6` ? | **Non** — référentiel distinct, **créé de zéro** ; **aucun nom repris de l'Excel** | ✅ Validé |
| Q4 | Gestion des employés **actifs / inactifs** ? | **Oui** — jamais de suppression d'un employé référencé | ✅ Validé |
