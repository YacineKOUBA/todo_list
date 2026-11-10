# Livrable 05 — ÉTAPE 5 : Cahier des charges fonctionnel

| | |
|---|---|
| **Projet** | Application web de gestion des TODOLIST — GD Trading |
| **Livrable** | 05 (méthode M8) |
| **Étape** | **5 — Cahier des charges fonctionnel** |
| **Documents de référence** | `docs\01_ANALYSE_FONCTIONNELLE.md` (ÉTAPES 1-2) · `docs\02_EXIGENCES_DIRECTEUR.md` (ÉTAPE 3) · `docs\03_COMPARAISON_EXCEL_EXIGENCES.md` (ÉTAPE 4) · `docs\04_ARCHITECTURE_APPLICATION.md` (ÉTAPE 6) · `docs\07_API.md` (ÉTAPE 8) · `docs\08_INTERFACE_REACT.md` (ÉTAPE 9) |
| **Décisions de référence** | **DÉCISIONS 1 à 75** |
| **Date de rédaction** | 02/11/2026 |
| **Statut** | ✅ **VALIDÉE PAR LE DIRECTEUR le 02/11/2026** — document validé en l'état ; points **P4, P7, P8, P9, P10** et tension **C12** tranchés le 02/11/2026 (**DÉCISIONS 28 à 33**) |
| **Ordre de production** | L'ÉTAPE 5 avait été reportée par la **DÉCISION 26** ; elle est reprise par la **DÉCISION 27**, après validation de l'ÉTAPE 6 et avant l'ÉTAPE 7. |

> **Règle M2** : ce document **formalise** les règles déjà validées. Il ne prend **aucune décision métier** nouvelle.
> **Règle M5** : tout point qui dépend d'une information non fournie ou d'un arbitrage du directeur est marqué **À VALIDER**.
> **Aucun code n'a été écrit. Aucun dossier `client\`, `server\` ou `prisma\` n'a été créé.**

---

## 1. Objet, périmètre et conventions

### 1.1 Objet

Le présent cahier des charges fonctionnel répond à trois questions :

1. **qui** utilise l'application, avec **quels droits** ;
2. **ce que** l'application doit permettre de faire, fonction par fonction ;
3. **comment** vérifier qu'une fonction est correctement livrée, au moyen de **critères d'acceptation** testables.

Il constitue la référence fonctionnelle des étapes suivantes :

| Étape | Ce qu'elle reprend du présent document |
|---|---|
| **7 — Modèle de données** | Entités, champs obligatoires, contraintes, règles de suppression |
| **8 — API** | Opérations, périmètres d'accès, erreurs attendues |
| **9 — Interface** | Écrans, parcours, états, messages |
| **10 — Rôles et permissions** | Matrice des droits et contrôles serveur |
| **12 — Tests et recette** | Critères d'acceptation **CA-xx** |
| **13 — Sécurité** | Authentification, sessions, mots de passe, journalisation |
| **14 — Déploiement** | Exigences non fonctionnelles et exploitation |
| **15 — Documentation** | Vocabulaire, parcours et règles utilisateur |

### 1.2 Ce que ce document couvre — et ce qu'il ne couvre pas

| Couvert | Non couvert |
|---|---|
| Acteurs, rôles, périmètres | Schéma des tables et index → **ÉTAPE 7** |
| Exigences fonctionnelles **EF-xx** | Contrats d'API et codes HTTP détaillés → **ÉTAPE 8** |
| Règles métier **RM-xx** | Maquettes et composants → **ÉTAPE 9** |
| Parcours utilisateurs **UC-xx** | Politique de mot de passe complète → **ÉTAPE 13** |
| Inventaire des écrans **IHM-xx** | Procédure d'installation → **ÉTAPE 14** |
| Exigences non fonctionnelles **ENF-xx** | Plan de tests détaillé → **ÉTAPE 12** |
| Critères d'acceptation **CA-xx** | Migration de données (aucune reprise, D11) |

### 1.3 Statut de chaque énoncé

Chaque exigence porte un statut explicite :

| Statut | Signification |
|---|---|
| ✅ **VALIDÉ** | Découle d'une **DÉCISION** datée ou d'une **exigence RE-xx** validée. Aucune marge d'interprétation. |
| 🔧 **PROPOSÉ** | Découle de l'architecture validée (ÉTAPE 6), du traitement d'une anomalie Excel, ou d'une nécessité technique. **Ne crée pas de règle métier.** |
| ❓ **À VALIDER** | Dépend d'un arbitrage non rendu. Référence **Pxx** ou **C12**. |

> **Aucun ❓ n'est appliqué comme s'il était validé.** Les critères d'acceptation qui en dépendent sont marqués « à compléter ».

### 1.4 Reprise après report

**DÉCISION 26 (02/11/2026)** : l'ÉTAPE 5 est **reportée**, pas annulée.
**DÉCISION 27 (02/11/2026)** : après validation de l'ÉTAPE 6, l'ÉTAPE 5 est **reprise immédiatement**, avant l'ÉTAPE 7.

Le report n'a **rien changé aux règles** : elles étaient déjà fixées par les DÉCISIONS 1 à 25. Il avait seulement différé leur **formalisation** en parcours, écrans et critères d'acceptation.

### 1.5 Décisions rendues le 02/11/2026

Le directeur a validé le présent document et tranché les **six points bloquants** de la section 12.3.

| # | Point | Décision retenue | Conséquence dans ce document |
|---|---|---|---|
| **D28** | **P4** — dates d'une tâche quotidienne | **Option A** : la **journée suffit**. `dateAction` = `dateDebut` = jour de la tâche ; **pas de `dateFinPrevue` distincte** ; l'échéance est le jour même à **16h30**. | RM-01, RM-08, EF-34, EF-38 |
| **D29** | **P7** — service porteur d'une tâche | **Option A** : **département de l'exécutant**, à défaut **département du pilote** ; aucun champ explicite. | Section 3.3, RM-10, EF-39 |
| **D30** | **P8** — fuseau horaire | **Option A** : **`Africa/Algiers` (UTC+1)** pour toute l'application. | EF-23, ENF-08, RM-01 |
| **D31** | **P9** — 3 combinaisons absentes de la matrice | **Option A** : **refus avec message explicite**. Les combinaisons `Pas urgent` × `Critique` / `Elevée` / `Modérée` sont **invalides** ; aucune fréquence par défaut n'est inventée. | RM-03, CA-22 |
| **D32** | **P10** — quotidienne après 16h30 ou jour non ouvré | **Option A** : **refus avec message explicite**. Aucune création en `Retard`, aucun report automatique. | RM-08, EF-38, CA-32 |
| **D33** | **C12** — priorité des tâches créées par un non-admin | **Option B** : **tout créateur habilité** renseigne urgence et importance **dans son périmètre** ; la matrice calcule la priorité, le score, la fréquence et l'action à prendre. | Section 3.4, RM-09, EF-40, CA-43 |

**Effet sur les points ouverts** : P4, P7, P8, P9 et P10 sont **clos** (D28 à D33). Les points **P6, P13, P14, P15 et P16** ont été **clos le 02/11/2026** lors de la validation de l'**ÉTAPE 8** (**D44 à D57**, section 1.6).

### 1.6 Décisions rendues le 02/11/2026 (validation de l'ÉTAPE 8)

Le directeur a validé le contrat d'API (`docs\07_API.md`) et tranché les **quatorze points A8-01 à A8-14**. Ils portent les **DÉCISIONS 44 à 57** et ferment les derniers points ouverts du présent cahier des charges.

| # | Point d'origine | Décision retenue | Conséquence ici |
|---|---|---|---|
| **D44** | **P14** — duplication | 31 dates maximum ; jours ouvrés obligatoires pour une quotidienne ; aucun commentaire ni motif copié ; atomicité ; aucun avertissement de doublon sur les copies. | EF-61 à EF-65, UC-13, CA-34 |
| **D45** | **P13** — motif de non-achèvement | Non vide après `trim` ; maximum technique 2 000 caractères ; aucune longueur minimale au-delà. | EF-54, RM-07 |
| **D46** | **P6** — longueurs | Libellé 255 caractères, commentaire 2 000 caractères. | EF-25, EF-55 |
| **D47** | **P16** — pilote désigné par un non-admin | Partenaire **interdit** ; pilote employé limité au périmètre de création (lui-même pour un employé ; son département ou lui-même pour un responsable). | Section 3.4, EF-26 |
| **D48** | **P15** — département avec responsable | Suppression et désactivation **refusées** tant qu'un `RESPONSABLE` y est rattaché. | EF-14, EF-15 |
| **D49** | UC-12 — employé inactif | Assignation refusée (`422`). | EF-30, CA-12 |
| **D50** | D12 — désactivation d'un employé | Désactive son compte et révoque ses sessions, dans la même transaction. | EF-11, EF-06 |
| **D51** | — — réouverture | **Aucune** réouverture de tâche clôturée en V1. | EF-53, UC-05 |
| **D52** | RM-07 — visibilité du motif | Visible par tous les ayants droit, `CONSULTANT` compris. | EF-47 |
| **D53** | EF-47 / EF-76 — historique | Historique **réduit** (type, auteur, date, champs modifiés) pour les ayants droit ; valeurs avant/après réservées à l'admin. | EF-47, EF-76 |
| **D54** | D28 / D32 — édition d'une quotidienne | Règles de cohérence applicables ; jour non ouvré refusé ; la règle « avant 16h30 » ne vaut qu'à la **création**. | EF-34, EF-38 |
| **D55** | D28 — `nature` | **Immuable** après création. | EF-24 |
| **D56** | D15 / D38 — retard à la clôture | `dateFin` postérieure à l'échéance **ou** `clotureLe` postérieur à 16h30 le jour dû. | EF-53, EF-54 |
| **D57** | UC-06 — commentaire vide | **Refusé** (`422`) : un commentaire est facultatif, pas vide. | EF-55, UC-06 |

### 1.7 Décisions rendues le 02/11/2026 (validation de l'ÉTAPE 9)

Le directeur a validé la spécification d'interface (`docs\08_INTERFACE_REACT.md`) et tranché les **douze points A9-01 à A9-12**. Ils portent les **DÉCISIONS 58 à 69** ; aucune ne modifie une règle métier.

| # | Point d'origine | Décision retenue | Conséquence ici |
|---|---|---|---|
| **D58** | **A9-01** — icônes des statuts | ○ `A faire`, ▶ `En cours`, ▲ `Retard` (rouge), ✓ `Achevée`, ✕ `Annulée`, ⏸ `Suspendue`, toujours accompagnées du libellé. | Section 8 |
| **D59** | **A9-02** — atterrissage par rôle | `EMPLOYEE` → `/aujourdhui` ; `RESPONSABLE` → `/service` ; `ADMIN` et `CONSULTANT` → `/toutes-les-taches`. | Section 7 |
| **D60** | **A9-03** — cible d'affichage | Desktop-first ≥ 1280 px ; pas d'optimisation mobile en V1. | ENF |
| **D61** | **A9-04** — libellés `Durée G.` / `Durée E.` | Affichés avec infobulle « Signification à confirmer » ; **P1** reste ouvert sur le sens métier. | IHM-05, **P1** |
| **D62** | **A9-05** — libellé de `FREQUENCE` | « Rappel tous les N jours » ; **P5** reste ouvert sur la sémantique. | IHM-05, **P5** |
| **D63** | **A9-06** — écran du consultant | **IHM-09 partagé** entre `ADMIN` (écriture) et `CONSULTANT` (lecture seule). | Section 7, UC-17 |
| **D64** | **A9-07** — ordre et tri | Ordre `Retard` → `A faire` → `En cours` → `Suspendue` → `Annulée` → `Achevée` ; tri serveur uniquement sur les champs autorisés. | Section 8 |
| **D65** | **A9-08** — conflit de version | Rechargement + comparaison + reprise explicite ; aucune fusion automatique. | T8-05 |
| **D66** | **A9-09** — aperçu de duplication | Aperçu local, aucun endpoint de prévisualisation, atomicité serveur. | EF-61 à EF-65 |
| **D67** | **A9-10** — score de priorité | Libellé en clair + score discret, jamais le score seul. | RM-03 |
| **D68** | **A9-11** — critères du mot de passe | Rien n'est affiché avant l'**ÉTAPE 13** ; **P12** reste ouvert. | IHM-14, **P12** |
| **D69** | **A9-12** — thème clair | **Aucun** en V1 ; noir dominant (**D23**). | Section 8 |

**Effet sur les points ouverts** : **P1** et **P5** restent ouverts sur le **sens métier** — les décisions **D61** et **D62** ne fixent que la **manière d'afficher**. Aucun autre point n'est fermé par cette étape.

### 1.8 Décisions rendues le 02/11/2026 (validation de l'ÉTAPE 11)

Le directeur a validé la spécification de reprise (`docs\10_REPRISE_DES_DONNEES.md`) et tranché les **deux points A11-01 et A11-02**. Ils portent les **DÉCISIONS 70 et 71**. Les propositions techniques **A11-03** et **A11-04** sont acceptées et n'ajoutent aucune règle métier.

| # | Point d'origine | Décision retenue | Conséquence ici |
|---|---|---|---|
| **D70** | **A11-01** — premier compte administrateur | **Compte nominatif** `ADMIN` (directeur ou responsable informatique), avec **fiche employé** et **changement de mot de passe obligatoire** à la première connexion. | §6 (comptes initiaux), EF-06, EF-09 ; nom, prénom et identifiant à fournir **avant l'ÉTAPE 14** |
| **D71** | **A11-02** — comptes du personnel | Création **manuelle** par l'admin via l'écran de gestion, **après la mise en service**. **Aucun import nominatif**. | D11, D12, EF-06 ; aucun compte repris du classeur |

> **A11-03** (seed **idempotent**, une transaction, exécution **manuelle** après migrations, contrôles bloquants, journal de déploiement, aucun auto-run) et **A11-04** (classeur **archivé en lecture seule** avec checksum, jamais référencé à l'exécution) sont **acceptés** : ce sont des choix de mise en œuvre 🔧, sans effet sur les règles métier.

**Effet sur les points ouverts** : **P2** (fériés 2027-2028), **P11** (environnement serveur) et **P12** (sessions / mots de passe) restent ouverts et **non bloquants**. **Aucun point A11 ne reste ouvert.**

### 1.9 Décisions rendues le 02/11/2026 (validation de l'ÉTAPE 12)

Les **quatre zones grises G1 à G4** laissées ouvertes par l'ÉTAPE 10 sont tranchées. Elles portent les **DÉCISIONS 72 à 75** et introduisent **trois règles métier nouvelles**, signalées comme telles.

| # | Point d'origine | Décision retenue | Conséquence ici |
|---|---|---|---|
| **D72** | **A12-01 / G1** — dernier administrateur | **Protection** : refus de retirer le rôle `ADMIN` au **dernier compte `ADMIN` actif** et refus de le désactiver. `409 DERNIER_ADMIN`. | RM-12, EF-06 ; tests TC-AUT-055 et TC-AUT-056 |
| **D73** | **A12-02 / G2** — rôle et session ouverte | **Effet immédiat** : les droits sont recalculés à **chaque requête** (D29) ; aucun délai jusqu'à la reconnexion. | RM-12, section 4 |
| **D74** | **A12-03 / G3** — employé désactivé | **Annulation des tâches non commencées** : à la désactivation, les tâches **assignées** à l'employé dont le statut calculé est **`A faire`** passent à **`ANNULEE`**. Les tâches `En cours`, `Retard`, `Achevée` et `Suspendue` restent inchangées. **Règle métier nouvelle.** | RM-01, RM-12, EF-06, EF-52 ; audit par tâche annulée |
| **D75** | **A12-04 / G4** — auto-modification | **Interdiction** pour un `ADMIN` de modifier **son propre rôle** ou de se **désactiver** lui-même. `403 AUTO_MODIFICATION_INTERDITE`. Un autre administrateur doit agir. | RM-12, EF-06 |

> **Deux précisions d'application de D74** ont été **confirmées le 02/11/2026** : seules les tâches où l'employé est **assigné** (`assigne_a_employe_id`) sont concernées, et seules celles au statut calculé **`A faire`** sont annulées (une tâche `Retard` n'est pas annulée). Elles sont portées au livrable 11, §13.2.

**Effet sur les points ouverts** : **G1 → G4 sont closes**. **P1**, **P2**, **P3**, **P5**, **P11** et **P12** restent ouverts et **non bloquants**.

### 1.10 Décision rendue le 05/11/2026 (assignation à un partenaire)

| # | Point d'origine | Décision retenue | Conséquence ici |
|---|---|---|---|
| **D81** | Assignation d'une tâche à un partenaire | L'**assigné** suit l'**acteur** : acteur `GD_TRADING` ⇒ assigné **employé interne** obligatoire ; acteur `PARTENAIRE` ⇒ assigné **partenaire** du référentiel obligatoire. Le **pilote** reste unique : employé pour une tâche `GD_TRADING` ; **employé interne ou partenaire** pour une tâche `PARTENAIRE`. Un même partenaire peut être à la fois assigné et pilote. Seul l'`ADMIN` crée ou modifie une tâche dont l'acteur est `PARTENAIRE`. | §3.3, §3.4, EF-26, D6, D47 ; colonnes `assigne_a_employe_id` / `assigne_a_partenaire_id` |

**Effet sur les points ouverts** : aucun point ouvert n'est refermé ; **D47** est maintenue (partenaire pilote réservé à l'`ADMIN`).

### 1.11 Décision rendue le 08/11/2026 (workflow de validation du retard)

| # | Point d'origine | Décision retenue | Conséquence ici |
|---|---|---|---|
| **D82** | Retard : qui justifie, qui valide, quelle date de fin estimée ? | L'**exécutant** (assigné ou pilote employé) saisit le **motif de retard** ; l'**administrateur** (ou le créateur / responsable habilité) **valide** le retard et fixe la **date de fin estimée**. Si le motif est absent, la validation est **refusée** tant qu'elle n'est pas **explicitement confirmée sans motif** (`sansMotif: true`). Une validation sans motif **conserve la pénalité de 10 points** ; elle n'est jamais réajoutée au score. Après validation, le motif n'est **plus modifiable**. | §5.7, EF-54 bis, EF-52 → EF-54 ; `PATCH /tasks/:id/retard`, `PATCH /tasks/:id/retard/validation` |

**Effet sur les points ouverts** : aucun point ouvert n'est refermé ; D15 et D45 restent inchangées.

---

## 2. Vocabulaire et définitions

> Les termes ci-dessous sont ceux employés dans **tout le projet**. Ils priment sur les libellés de l'Excel lorsqu'ils diffèrent.

| Terme | Définition | Réf. |
|---|---|---|
| **Tâche** | Unité de travail suivie par l'application. Équivalent du mot « action » dans l'Excel. | D1 |
| **Tâche quotidienne** | Tâche à réaliser dans la journée ; échéance le jour même à **16h30**. | RE-05, D18, D22 |
| **Tâche « autre » / long terme** | Tâche avec échéance datée, urgence, importance, priorité et action à prendre. | RE-17 |
| **Pilote** | Personne ou partenaire **responsable** de la tâche (`STRUCTURE` dans l'Excel). | D6, Q2 |
| **Exécutant / assigné** | Employé interne ou partenaire qui **réalise** la tâche (`ASSIGNE A` dans l'Excel) : employé pour une tâche `GD_TRADING`, partenaire pour une tâche `PARTENAIRE`. | D6, Q2, D81 |
| **Créateur** | Utilisateur qui a saisi la tâche (`creeParId`). | D13 |
| **Attributaire** | Utilisateur qui a **attribué** la tâche à son exécutant (`attribueParId`). | D7, D13 |
| **Propres tâches** | Tâches **assignées** à la personne **+** dont elle est **pilote** **+** qu'elle a **créées**. | A13, D16 |
| **Service / département** | Structure interne de GD Trading. Attribut **optionnel** de l'employé ; un service peut ne pas avoir de responsable. | Q1, A12 |
| **Responsable** | Utilisateur de rôle `RESPONSABLE`, rattaché **obligatoirement** à un service. | D7 |
| **Admin** | Utilisateur de rôle `ADMIN` ; le directeur en est le titulaire principal. | RE-01, D20 |
| **Consultant** | Utilisateur de rôle `CONSULTANT`, en **lecture seule**. | D7, D21 |
| **Échéance** | Date à laquelle la tâche doit être achevée. Pour une tâche quotidienne : le jour même à **16h30**. | D18 |
| **Jour ouvré** | Jour qui n'est ni un week-end paramétré (vendredi + samedi par défaut) ni un jour férié. | D5 |
| **Jour férié** | Date du calendrier d'entreprise, administrée par l'admin. | D5 |
| **Retard** | État d'une tâche dont l'échéance est dépassée et qui n'est pas clôturée. | D3, D18 |
| **Clôture** | Saisie de la **date de fin réelle** (`dateFin`). | Excel, D3 |
| **Clôture tardive** | Clôture effectuée **après** l'échéance ; elle exige un **motif**. | D15 |
| **Motif de non-achèvement** | Justification obligatoire d'une clôture tardive. Champ **distinct** du commentaire. | D15 |
| **Commentaire** | Texte **libre, facultatif, sans effet** sur le statut. | D3 |
| **Progression manuelle** | Pourcentage 0-100 saisi par un utilisateur habilité. | D4 |
| **Progression temporelle** | Pourcentage calculé à partir des dates, utilisé **en repli** si aucune valeur manuelle n'existe. | D4 |
| **Urgence** | Niveau saisi : Immédiate · Courte échéance · Planifiable · Pas urgent. | D14 |
| **Importance** | Niveau saisi : Critique · Élevée · Modérée · Faible. | D14 |
| **Priorité** | Libellé **calculé** : `Urgence & " & " & Importance`. | D14 |
| **Score** | Valeur 0-12 calculée par la matrice de priorité. | D14 |
| **Fréquence de relance** | Nombre de jours (1-45) calculé par la matrice ; sert au calcul de la date de rappel. | D14, P5 |
| **Date de rappel** | Prochaine date de revue, calculée en **jours ouvrés**. | Excel, D5 |
| **Duplication** | Création manuelle de plusieurs copies datées d'une tâche ; aucune génération automatique. | D22 |
| **Référentiel** | Liste administrée : employés, partenaires, départements, fériés, éléments, urgences, importances. | D5, D8 |
| **Désactivation** | Retrait de l'accès d'un compte **sans suppression**. | D12 |

### 2.1 Les six statuts

| Statut | Nature | Déclencheur |
|---|---|---|
| `A faire` | **Calculé** | `dateAction` vide ou postérieure à aujourd'hui |
| `En cours` | **Calculé** | Tâche démarrée, échéance non dépassée |
| `Retard` | **Calculé** | Échéance dépassée, tâche non clôturée |
| `Achevée` | **Calculé** | `dateFin` renseignée |
| `Annulée` | **Manuel, prioritaire** | Choix explicite d'un utilisateur habilité |
| `Suspendue` | **Manuel, prioritaire** | Choix explicite d'un utilisateur habilité |

> **Libellés conservés à l'identique de l'Excel**, y compris `A faire` sans accent, pour éviter deux vocabaires. L'interface peut afficher « À faire » à condition que la valeur stockée et les filtres restent `A faire` — **choix d'affichage à l'ÉTAPE 9**.

### 2.2 Les deux natures de tâche

| Nature | Usage | Échéance | Champs spécifiques |
|---|---|---|---|
| `QUOTIDIENNE` | Travail du jour | Le jour même à **16h30** | Date de la journée ; duplication possible |
| `AUTRE` | Travail long terme | **Date** `dateFinPrevue`, sans heure | Urgence, importance, priorité, score, fréquence, action à prendre |

> La nature est **obligatoire**. Son caractère **modifiable après création** n'est pas tranché par une décision : le présent document **ne le fixe pas**. Changer la nature changerait la règle d'échéance ; le point sera traité à l'ÉTAPE 7 s'il devient nécessaire.

---

## 3. Acteurs, rôles et droits

### 3.1 Les quatre rôles

| Rôle | Nature | Département | Compte |
|---|---|---|---|
| `ADMIN` | Administration complète | Non requis | Oui |
| `RESPONSABLE` | Chef de service | ✅ **Obligatoire** | Oui |
| `EMPLOYEE` | Agent GD Trading | Facultatif | Oui |
| `CONSULTANT` | Lecture seule | Facultatif | Oui |

**Règles de comptes** (D7, D12, D21) :

- **un compte par employé** ; le rôle est porté par le **compte**, jamais par la fiche employé ;
- rôle **par défaut** à la création : `EMPLOYEE` ;
- les chefs de service reçoivent `RESPONSABLE` avec un département **obligatoire** ;
- les personnes en lecture seule reçoivent `CONSULTANT` ;
- un employé qui quitte l'entreprise voit son compte **désactivé**, jamais supprimé ;
- le directeur possède une **fiche employé** et un compte `ADMIN` (D20) ;
- **au plus un responsable par service** ; un service peut n'en avoir **aucun** (A12).

### 3.2 Matrice des droits

> **Principe** : l'interface peut masquer une action ; le **serveur refuse** toute action non autorisée. Aucun droit ne repose sur le client.

| Opération | `ADMIN` | `RESPONSABLE` | `EMPLOYEE` | `CONSULTANT` |
|---|---|---|---|---|
| Voir les tâches | **Toutes** | **Son service + ses propres tâches** | **Ses propres tâches** (A13) | **Toutes** |
| Créer une tâche | Pour **tout le monde** | Pour **son service + lui-même** | Pour **lui-même** | ❌ |
| Modifier les champs descriptifs | **Toutes** | **Son service + ses propres tâches** | **Ses propres tâches** | ❌ |
| Changer statut / progression | **Toutes** | **Son service + ses propres tâches** | **Ses propres tâches** | ❌ |
| Commenter | **Toutes** | **Son service + ses propres tâches** | **Ses propres tâches** | ❌ |
| Clôturer | **Toutes** | **Son service + ses propres tâches** | **Ses propres tâches** | ❌ |
| Dupliquer | **Toutes** | **Son service + lui-même** | **Pour lui-même** | ❌ |
| **Supprimer** | **Toutes** | **Uniquement celles qu'il a lui-même attribuées** | ❌ | ❌ |
| Gérer les référentiels | ✅ | ❌ | ❌ | ❌ |
| Gérer les comptes et rôles | ✅ | ❌ | ❌ | ❌ |
| Consulter le journal d'audit | ✅ | ❌ *(proposition)* | ❌ | ❌ *(proposition)* |

**Précisions sur la matrice** :

- « **son service** » ne s'étend **jamais** aux autres services (D17) ;
- « **ses propres tâches** » suit **A13** : assignées + pilote + créées (D16) ;
- la **modification du titulaire** (pilote, assigné) reste limitée au **périmètre de création** de la DÉCISION 13 : un employé ne peut pas réaffecter sa tâche à un collègue, un responsable ne peut pas l'affecter hors de son service ;
- un responsable qui veut retirer une tâche **créée par un employé de son service** ne peut pas la supprimer : il peut la passer en **`Annulée`** (D7) ;
- le `CONSULTANT` voit **toutes** les tâches mais **n'écrit jamais** (D7, D21) ;
- la consultation du journal d'audit par le seul admin est une **proposition** ; le directeur n'a pas fixé ce point.

### 3.3 Périmètres de lecture — cas limites

| Situation | Qui voit la tâche ? |
|---|---|
| Tâche assignée à un employé, pilotée par un autre employé | Les deux, leur responsable respectif **selon P7**, l'admin et le consultant |
| Tâche pilotée par un partenaire, assignée à un employé interne | L'employé, son responsable **selon P7**, l'admin et le consultant |
| Tâche assignée à un partenaire, pilotée par un employé interne (acteur `PARTENAIRE`) | Le pilote, son responsable **selon P7**, l'admin et le consultant |
| Tâche assignée à un partenaire et pilotée par un partenaire | L'admin et le consultant ; **aucun responsable** (aucun département) |
| Tâche sans département (assigné et pilote sans département) | L'assigné, le pilote, le créateur, l'admin et le consultant ; **aucun responsable** |
| Tâche créée par un employé pour lui-même | L'employé, son responsable **selon P7**, l'admin et le consultant |
| Tâche annulée | Reste visible selon les mêmes règles ; elle n'est pas supprimée |

> **Service porteur (P7 → D29)** : le service porteur est le **département de l'exécutant** ; si l'exécutant n'a pas de département (partenaire ou employé sans département), celui du **pilote employé**. Il n'existe **aucun champ « service » saisi** sur la tâche : la valeur est **calculée à chaque lecture**. Le tableau ci-dessus s'entend donc avec cette règle, désormais tranchée.

### 3.4 Qui peut créer pour qui

| Auteur | Peut créer pour | Peut désigner comme pilote | Peut désigner comme exécutant |
|---|---|---|---|
| `ADMIN` | Lui-même, tout employé, tout responsable ; une tâche `PARTENAIRE` assignée à tout partenaire actif | Employé ou partenaire (acteur `PARTENAIRE` : employé **ou** partenaire) | Tout employé ; tout partenaire pour une tâche `PARTENAIRE` |
| `RESPONSABLE` | Les employés de **son service** + lui-même | **D47** : un employé de son service ou lui-même ; **partenaire interdit** | Un employé de son service ou lui-même ; **partenaire interdit** |
| `EMPLOYEE` | **Lui-même uniquement** | **D47** : lui-même ; **partenaire interdit** | Lui-même uniquement |

> **C12 tranchée par la DÉCISION 33 (option B)** : tout **créateur habilité** renseigne urgence et importance **dans son périmètre de création** ; la matrice calcule la priorité, le score, la fréquence et l'action à prendre. « L'admin » de la DÉCISION 14 s'entend donc comme **le créateur habilité**, et la priorité reste **calculée**, jamais saisie.
>
> **P16 tranché par la DÉCISION 47 (02/11/2026)** : un non-admin **ne peut jamais désigner un partenaire** comme pilote ; il ne peut désigner qu'un employé de son périmètre de création. Le partenaire comme pilote reste réservé à l'`ADMIN`.
>
> **Assignation à un partenaire (D81, 05/11/2026)** : seul l'`ADMIN` crée ou modifie une tâche dont l'acteur est `PARTENAIRE`. Pour ces tâches, l'assigné est obligatoirement un partenaire actif du référentiel et le pilote peut être un employé interne ou un partenaire.

---

## 4. Exigences fonctionnelles

> **EF-xx** = exigence fonctionnelle. Chaque exigence est **unique**, **testable** et rattachée à une source.
> Le statut ✅ / 🔧 / ❓ suit la convention de la section 1.3.

### 4.1 Authentification, comptes et sécurité d'accès

| # | Exigence | Statut | Source |
|---|---|---|---|
| **EF-01** | Un utilisateur se connecte avec son compte et un mot de passe ; une session est ouverte ; il peut se déconnecter. | ✅ | D7, D12 |
| **EF-02** | Un compte désactivé ne peut pas se connecter, même avec le bon mot de passe. | ✅ | D12 |
| **EF-03** | Le rôle porté par le compte détermine les droits ; tout contrôle est appliqué **côté serveur**. | ✅ | D7 |
| **EF-04** | L'admin crée un compte, l'associe à un employé, attribue un rôle et le désactive. | ✅ | D7, D12 |
| **EF-05** | Un compte `RESPONSABLE` ne peut pas exister sans département. | ✅ | D7 |
| **EF-06** | Un employé possède **au plus un compte** ; la création d'un second compte est refusée. | ✅ | D12 |
| **EF-07** | Le `CONSULTANT` ne peut effectuer aucune écriture : création, modification, clôture, commentaire, suppression. | ✅ | D21 |
| **EF-08** | Le mot de passe est stocké sous forme de **hash** ; il n'est jamais affiché ni journalisé. | 🔧 | ÉTAPE 13 |
| **EF-09** | À la première connexion, l'utilisateur doit changer son mot de passe temporaire. | 🔧 | ÉTAPE 13 |
| **EF-10** | Toute tentative de connexion échouée est journalisée sans révéler si le compte existe. | 🔧 | ÉTAPE 13 |

### 4.2 Référentiels et paramètres

| # | Exigence | Statut | Source |
|---|---|---|---|
| **EF-11** | L'admin gère le référentiel **Employés** : création, modification, activation / désactivation. Un employé **référencé** n'est jamais supprimé. | ✅ | R3, Q4 |
| **EF-12** | Un employé porte un **département optionnel** et un état **actif / inactif**. | ✅ | Q1, Q4 |
| **EF-13** | L'admin gère le référentiel **Partenaires**, distinct des fournisseurs. | ✅ | D6, Q3 |
| **EF-14** | L'admin gère le référentiel **Départements** : ajout, modification, suppression. | ✅ | Q1 |
| **EF-15** | Un département peut avoir **au plus un responsable** et peut n'en avoir **aucun**. | ✅ | A12 |
| **EF-16** | L'admin gère le calendrier des **jours fériés**. | ✅ | D5 |
| **EF-17** | Le week-end est **paramétrable** ; la valeur par défaut est **vendredi + samedi**. | ✅ | D5 |
| **EF-18** | L'admin gère le référentiel **Élément / Pilier**. | ✅ | D8, Table1089 |
| **EF-19** | Les référentiels **Urgence** (4 valeurs) et **Importance** (4 valeurs) sont disponibles. | ✅ | D14, Table10, Table108 |
| **EF-20** | La **matrice de priorité** de 13 combinaisons est appliquée ; elle n'est pas modifiable par l'utilisateur. | ✅ | D14 |
| **EF-21** | La liste **Action à prendre** contient les valeurs reprises de l'Excel : `Faire immédiatement`, `Planifier`, `Déléguer si possible`. L'action n'est **pas saisie** : elle est **déduite de la priorité calculée** — P1/P2 → `Faire immédiatement`, P3 → `Déléguer si possible`, P4 → `Planifier`. | ✅ | D14 |
| **EF-22** | Les paramètres d'affichage de la journée sont disponibles : **8h00-16h30**, pause **12h00-13h00**. | ✅ | RE-16, D18 |
| **EF-23** | Le **fuseau horaire** de référence est **`Africa/Algiers` (UTC+1)**, paramètre unique de l'application. | ✅ | **P8 → D30** |

### 4.3 Création et attribution des tâches

| # | Exigence | Statut | Source |
|---|---|---|---|
| **EF-24** | Une tâche possède une **nature** : `QUOTIDIENNE` ou `AUTRE`. | ✅ | RE-02, RE-17 |
| **EF-25** | Une tâche possède un **libellé**, un **élément**, un **acteur** (`GD_TRADING` / `PARTENAIRE`), un **pilote** et un **exécutant**. | ✅ | Excel, D6 |
| **EF-26** | Si `acteur = GD_TRADING`, l'assigné et le pilote sont des **employés internes**. Si `acteur = PARTENAIRE`, l'assigné est un **partenaire actif** du référentiel et le pilote est soit un **employé interne**, soit un **partenaire**. Un même partenaire peut cumuler assigné et pilote. | ✅ | D6, D81 |
| **EF-27** | Une tâche porte les dates `dateAction`, `dateDebut`, `dateFinPrevue` et, après clôture, `dateFin`. | ✅ | Excel |
| **EF-28** | Une tâche « autre » porte **urgence**, **importance**, **priorité**, **score**, **fréquence** et **action à prendre**. | ✅ | RE-17, D14 |
| **EF-29** | L'admin peut créer une tâche pour **n'importe quel** employé ou responsable, et pour lui-même. | ✅ | RE-02, RE-03, D13 |
| **EF-30** | Le responsable peut créer une tâche pour les **employés de son service** et pour lui-même. | ✅ | RE-15, D13, D25 |
| **EF-31** | L'employé peut créer une tâche **pour lui-même uniquement**. | ✅ | RE-11, D13 |
| **EF-32** | Une tâche créée par un employé est **active immédiatement**, sans validation préalable. | ✅ | D24 |
| **EF-33** | Le créateur et l'attributaire sont **tracés** (`creeParId`, `attribueParId`). | ✅ | D13, D7 |
| **EF-34** | Les champs **obligatoires** repris de l'Excel sont contrôlés à la saisie : libellé, élément, acteur, pilote, exécutant, `dateAction`, `dateDebut` — pour une tâche quotidienne, `dateAction` et `dateDebut` sont **la même date** (**D28**). | ✅ | Excel, D28 |
| **EF-35** | Les dates sont **cohérentes** : `dateAction ≤ dateDebut ≤ dateFinPrevue` ; `dateFin ≥ dateDebut`. Une date incohérente est refusée. | 🔧 | Anomalies 2 et 10 |
| **EF-36** | Un libellé déjà utilisé par une tâche **active** est signalé à la saisie. | ✅ | Excel, doc 03 §6 |
| **EF-37** | Une tâche quotidienne est une **ligne datée** ; l'application ne crée **jamais** de tâche automatiquement. | ✅ | D22 |
| **EF-38** | Une tâche quotidienne ne peut être créée **qu'un jour ouvré et avant 16h30** ; toute création après 16h30 ou un jour non ouvré est **refusée** avec un message explicite. | ✅ | **P10 → D32** |
| **EF-39** | Le **service porteur** d'une tâche est le **département de l'exécutant** ; à défaut, celui du **pilote** ; il n'est pas saisi. | ✅ | **P7 → D29** |
| **EF-40** | Pour une tâche créée par un non-admin, **urgence et importance** sont saisies par le **créateur habilité, dans son périmètre**, puis la matrice calcule priorité, score, fréquence et action à prendre. | ✅ | **C12 → D33** |

> **Précision (09/11/2026)** : une **tâche supplémentaire** n'est visible que par
> **son créateur**, quel que soit son rôle. Ni l'`ADMIN`, ni le `CONSULTANT`,
> ni le `RESPONSABLE` d'un service ne voient les tâches supplémentaires créées
> par un autre utilisateur.

### 4.4 Consultation et vues

| # | Exigence | Statut | Source |
|---|---|---|---|
| **EF-41** | L'utilisateur dispose d'une vue **« Tableau de bord / Mes tâches du jour »** : tâches dont la **date d'action**, la **date de début** ou la **date de fin prévue** est le **jour même**, dans son périmètre (toutes pour l'admin, service du responsable, tâches propres de l'employé). Seul le filtre **« Date cible »** est proposé (choix du champ comparé à aujourd'hui), sans sélecteur de date. | ✅ | RE-05 |
| **EF-42** | L'employé dispose d'une vue **« Mes autres tâches »** : tâches long terme déjà assignées, sans file d'attente ni prise de tâche. | ✅ | RE-06, D19 |
| **EF-43** | Tout utilisateur dispose d'une vue **« Mes tâches »** couvrant ses tâches assignées, pilotées et créées. | ✅ | A13, D16 |
| **EF-44** | Le responsable dispose d'une vue **« Mon service »** : employés de son service et leurs tâches. | ✅ | RE-14, D17 |
| **EF-45** | L'admin dispose d'une vue **« Tous les services »** : toutes les tâches, tous les employés. | ✅ | RE-04 |
| **EF-46** | Le consultant dispose d'une vue **« Toutes les tâches »**, en lecture seule. | ✅ | D7, D21 |
| **EF-47** | Le détail d'une tâche affiche tous les champs, les valeurs calculées, le motif, les commentaires et l'historique. | ✅ | D3, D15 |
| **EF-48** | Les listes sont filtrables par statut, nature, service, exécutant, pilote, échéance, **date (action / début / fin prévue)**, priorité et rappel. | 🔧 | RE-19 |
| **EF-49** | Les listes sont triables et paginées. | 🔧 | RE-19 |
| **EF-50** | Une date de rappel **échéé** est signalée en rouge ; une date **imminente** (J+1 à J+5) est signalée distinctement. | ✅ | Excel, D23 |
| **EF-51** | Une tâche en retard est signalée par le libellé `Retard`, une icône et le rouge. | ✅ | D3, D23 |

### 4.5 Mise à jour, progression et clôture

| # | Exigence | Statut | Source |
|---|---|---|---|
| **EF-52** | Un utilisateur habilité peut positionner le statut manuel `Annulée` ou `Suspendue`, et revenir à l'état calculé. | ✅ | D3 |
| **EF-53** | Un utilisateur habilité peut **clôturer** une tâche en renseignant `dateFin`. | ✅ | RE-07 |
| **EF-54** | Une **clôture tardive** exige un **motif de non-achèvement** non vide ; le serveur refuse la clôture sans motif. | ✅ | D15 |
| **EF-54 bis** | Le **retard** est justifié par l'exécutant puis **validé** par l'admin, qui fixe la **date de fin estimée**. Une validation **sans motif** exige une confirmation explicite et **conserve la pénalité de 10 points**. | ✅ | D82 |
| **EF-55** | Le **commentaire** est libre, facultatif et **sans effet** sur le statut. | ✅ | D3, RE-08 |
| **EF-56** | La **progression manuelle** est un pourcentage entier de 0 à 100 ; elle est prioritaire sur le calcul temporel. | ✅ | D4 |
| **EF-57** | En l'absence de progression manuelle, la progression est **calculée** à partir des dates. | ✅ | D4 |
| **EF-58** | La progression d'une tâche clôturée vaut **100 %** si aucune valeur manuelle n'est renseignée. | ✅ | D4, Excel |
| **EF-59** | Un utilisateur habilité peut modifier les champs descriptifs d'une tâche **dans son périmètre** ; le changement de titulaire reste limité au périmètre de création. | ✅ | D7, D13 |
| **EF-60** | Aucun **circuit d'approbation** n'existe : le responsable contrôle **a posteriori**. | ✅ | D17, D24 |

### 4.6 Duplication

| # | Exigence | Statut | Source |
|---|---|---|---|
| **EF-61** | Un utilisateur habilité peut **dupliquer** une tâche sur plusieurs dates. | ✅ | D22 |
| **EF-62** | La duplication respecte les **périmètres de création** : admin partout, responsable dans son service, employé pour lui-même. | ✅ | D22, D13 |
| **EF-63** | Les copies sont **indépendantes** : statut, progression, commentaires et motif propres. | ✅ | D22 |
| **EF-64** | La duplication ne crée **aucune occurrence future automatique**. | ✅ | D22 |
| **EF-65** | Plage maximale, jours non ouvrés et copie des commentaires / motif : **D44** — 31 dates maximum, jours ouvrés obligatoires pour une quotidienne, aucun commentaire ni motif copié, atomicité. | ✅ | **D44** (ex-P14) |

### 4.7 Suppression

| # | Exigence | Statut | Source |
|---|---|---|---|
| **EF-66** | L'admin peut supprimer **toute** tâche. | ✅ | D7 |
| **EF-67** | Le responsable peut supprimer **uniquement les tâches qu'il a lui-même attribuées**. | ✅ | D7 |
| **EF-68** | L'employé et le consultant ne peuvent supprimer **aucune** tâche. | ✅ | D7, D21 |
| **EF-69** | Toute suppression est **tracée** dans le journal d'audit. | 🔧 | AR-10 |

### 4.8 Priorité, rappel et durées

| # | Exigence | Statut | Source |
|---|---|---|---|
| **EF-70** | La priorité, le score et la fréquence sont **calculés** à partir de l'urgence et de l'importance. | ✅ | D14 |
| **EF-71** | L'**action à prendre** est **déduite automatiquement** de la priorité calculée ; elle n'est jamais saisie. | ✅ | D14 |
| **EF-72** | La **date de rappel** est calculée en **jours ouvrés** à partir de la fréquence. | ✅ | Excel, D5 |
| **EF-73** | Les **durées G. et E.** sont calculées ; leur signification littérale reste **P1**. | ✅ *(réserve P1)* | Excel, A8 |
| **EF-74** | Les calculs de statut, progression, rappel et durées sont **refaits à chaque lecture**, jamais figés en base. | 🔧 | AR-05 |

### 4.9 Tableau de bord, audit et exploitation

| # | Exigence | Statut | Source |
|---|---|---|---|
| **EF-75** | Les tableaux de bord sont des **vues filtrées** (jour, service, tous les services) ; aucun indicateur supplémentaire n'est imposé par une décision. | 🔧 | RE-04, RE-05, RE-14 |
| **EF-76** | Le journal d'audit enregistre **qui**, **quoi**, **quand**, et les valeurs **avant / après** pour toute écriture. | ✅ | AR-10, D7 |
| **EF-77** | Le journal d'audit est **append-only** : aucune modification ni suppression par l'interface. | ✅ | AR-10 |
| **EF-78** | L'application expose un indicateur de **santé** (processus + base). | 🔧 | AR-12 |
| **EF-79** | L'application est **mono-tenant** : une seule entreprise, un seul espace de données. | ✅ | Contexte |

---

## 5. Règles métier

> **RM-xx** = règle métier. Les règles ci-dessous sont **normatives** : elles s'imposent au serveur, à l'API, à l'interface et aux tests.

### 5.1 RM-01 — Calcul du statut

**Entrées** : statut manuel, nature de la tâche, `dateAction`, `dateFinPrevue`, `dateFin`, heure courante, fuseau.

**Ordre de test — impératif** :

```text
1. statut manuel = "Annulée"                         → Annulée
2. statut manuel = "Suspendue"                       → Suspendue
3. dateFin renseignée                                → Achevée
4. dateAction vide OU dateAction > aujourd'hui       → A faire
5. échéance dépassée                                 → Retard
6. sinon                                             → En cours
```

**Échéance selon la nature** :

| Nature | Échéance | Retard |
|---|---|---|
| `QUOTIDIENNE` | Le jour de la tâche à **16h30** | À partir de **16h30** le jour même |
| `AUTRE` | La **date** `dateFinPrevue` | À partir du **lendemain** de cette date |

**Règles de robustesse** :

- le statut manuel est **prioritaire** sur toutes les dates (D3) ;
- une tâche clôturée **avant** l'échéance est `Achevée` ;
- une tâche dont `dateAction` est vide est `A faire`, même si d'autres dates existent ;
- le calcul est **refait à chaque lecture** ; aucun statut n'est stocké (AR-05).

> **P4 → D28** : une tâche **quotidienne** ne porte qu'**une seule date métier**, qui vaut à la fois `dateAction` et `dateDebut` ; `dateFinPrevue` est **absente** ; l'échéance réelle est le **jour même à 16h30**. Une tâche `AUTRE` conserve `dateAction`, `dateDebut` et `dateFinPrevue`.

### 5.2 RM-02 — Calcul de la progression

```text
1. progression manuelle renseignée          → valeur bornée 0-100
2. dateFin renseignée                        → 100
3. dateDebut ou dateFinPrevue absente,
   ou intervalle invalide                    → null ("—")
4. référence = dateAction, sinon aujourd'hui
5. référence < dateDebut                     → 0
6. référence > dateFinPrevue                 → 100
7. sinon                                     → arrondi((référence − dateDebut)
                                                / (dateFinPrevue − dateDebut) × 100)
```

**Précisions** :

- la progression manuelle **gagne** sur le calcul, même sur une tâche clôturée ; la clôture ne l'écrase pas ;
- le texte `"En retard"` de l'Excel **disparaît** de la colonne : le retard est porté par le statut (D4) ;
- l'absence de valeur s'affiche `—`, pas `-` ni `0` ;
- le calcul est refait à chaque lecture (AR-05).

### 5.3 RM-03 — Matrice de priorité

| Urgence \ Importance | Critique | Élevée | Modérée | Faible |
|---|---|---|---|---|
| **Immédiate** | Score **12** · **1 j** | **11** · **2 j** | **10** · **4 j** | **9** · **5 j** |
| **Courte échéance** | **8** · **6 j** | **7** · **7 j** | **6** · **8 j** | **5** · **10 j** |
| **Planifiable** | **4** · **15 j** | **3** · **20 j** | **2** · **25 j** | **1** · **30 j** |
| **Pas urgent** | ❓ **absente** | ❓ **absente** | ❓ **absente** | **0** · **45 j** |

**Règles** :

- le libellé est **exactement** `Urgence & " & " & Importance` ;
- le score et la fréquence sont ceux du tableau ;
- les **3 combinaisons absentes** (`Pas urgent` × `Critique`, `Elevée`, `Modérée`) sont **refusées** à la saisie avec un message explicite : la tâche ne peut pas être enregistrée tant que le couple urgence / importance n'existe pas dans la matrice (**P9 → D31**) ;
- la matrice est **figée** : l'utilisateur ne peut pas la modifier ;
- l'`ACTION A PRENDRE` est **saisie**, pas calculée (D14).

### 5.4 RM-04 — Date de rappel

```text
SI dateAction est vide OU dateFin est renseignée        → aucune date de rappel
BASE = SI (dateDebut + fréquence) > aujourd'hui
       ALORS dateDebut
       SINON dateAction
DATE RAPPEL = ajouterJoursOuvres(BASE, fréquence, week-end, fériés)
```

**Précisions** :

- le test `dateDebut + fréquence > aujourd'hui` se fait en **jours calendaires**, comme dans l'Excel ;
- seule la **date résultat** est calculée en **jours ouvrés** ;
- `BASE` peut être un jour non ouvré : le décompte commence le jour suivant (comportement `WORKDAY.INTL`) ;
- si la matrice ne fournit pas de fréquence, la tâche ne peut pas être enregistrée (combinaison refusée, **D31**) ;
- une tâche clôturée n'a **pas** de date de rappel.

### 5.5 RM-05 — Jours ouvrés et fériés

| Élément | Règle | Réf. |
|---|---|---|
| Week-end par défaut | **Vendredi + samedi** | D5 |
| Week-end | **Paramétrable** par l'admin | D5 |
| Fériés | Table **locale administrable** ; aucune lecture d'un classeur externe | D5 |
| Fériés 2026 | **15 dates** reprises au démarrage | D5 |
| Fériés 2027-2028 | À saisir par l'admin ; dates non fournies | **P2** |
| Calcul | Équivalent de `WORKDAY.INTL` : le jour de départ n'est pas compté, les week-ends et fériés sont exclus | Excel |
| Fuseau | **`Africa/Algiers` (UTC+1)**, paramètre unique de l'application | D30 |

### 5.6 RM-06 — Durées

| Calcul | Formule | Valeur si donnée manquante |
|---|---|---|
| `DUREE G.` | `(dateFin ?? aujourd'hui) − dateDebut` | `null` → `—` |
| `DUREE E.` | `dateFin − dateFinPrevue` | `null` → `—` |
| Cas d'erreur | `min(dateFin, dateFinPrevue) < dateDebut` | `ERREUR` |

**Interprétation** : `DUREE E.` positive = clôture en retard ; négative = clôture en avance ; zéro = à l'heure. Les sigles **G** et **E** ne sont pas explicités par une décision : **P1**.

### 5.7 RM-07 — Retard, justification, validation et clôture tardive

**Workflow (D82)** :

1. à l'échéance dépassée, le statut calculé devient `Retard` et l'interface signale « Motif de retard requis » ;
2. l'**exécutant** (assigné ou pilote employé) saisit le **motif de retard** ; la justification n'est plus modifiable après validation ;
3. l'**administrateur** — ou le créateur / responsable habilité — **valide le retard** et renseigne la **date de fin estimée** (obligatoire lorsqu'un motif existe) ;
4. si aucun motif n'est présent, le serveur **refuse** la validation (`422 MOTIF_RETARD_ABSENT`) ; l'interface propose alors une **confirmation explicite** « Valider sans motif — pénalité conservée » ;
5. une validation **avec** motif retire le malus de 10 points ; une validation **sans** motif le **conserve** ;
6. la **clôture** d'une tâche tardive reste refusée tant que le retard n'est pas validé (`422 RETARD_NON_VALIDE`) et exige un **motif de non-achèvement** (`422 MOTIF_OBLIGATOIRE`).

| Situation | Motif exigé ? | Effet |
|---|---|---|
| Clôture **avant ou à** l'échéance | Non | `dateFin` enregistrée ; statut `Achevée` |
| Clôture **après** l'échéance | **Oui, non vide** | Sans motif : **refus serveur** ; avec motif : clôture acceptée et motif conservé |
| Validation du retard **avec** motif | Oui | Date de fin estimée requise ; malus de 10 points **retiré** |
| Validation du retard **sans** motif | Non, mais **confirmation explicite** | Date de fin estimée facultative ; malus de 10 points **conservé** |
| Commentaire | Non | Texte libre, aucun effet sur le statut |
| Annulation / suspension | Non | Ne renseigne pas `dateFin` ; ce n'est pas une clôture |

**Règles** :

- le contrôle est **serveur** : l'interface ne peut pas contourner l'obligation ;
- le motif est **distinct** du commentaire (D15) ;
- le motif est visible par l'employé, son responsable et l'admin ;
- la **taille minimale** et l'**historique** des motifs sont fixés par **D45** : non vide après `trim`, maximum technique 2 000 caractères, aucune longueur minimale au-delà ;
- la validation et la date estimée sont **tracées** dans le journal d'audit (`VALIDATION_RETARD`, avec `sansMotif`) — **D82**.

> **Lecture proposée** : l'**annulation** et la **suspension** ne sont pas des clôtures ; elles ne renseignent pas `dateFin` et n'exigent donc pas de motif. Cette distinction découle de D3 et D15, mais n'est pas écrite mot pour mot dans une décision : elle est **soumise à validation avec le présent document**.

### 5.8 RM-08 — Tâches quotidiennes

| Règle | Réf. |
|---|---|
| Une tâche quotidienne est une **ligne indépendante**, rattachée à une date. | D22 |
| L'échéance est **le jour même à 16h30**. | D18 |
| Une tâche non achevée à 16h30 passe **automatiquement** en `Retard`. | D18 |
| La clôture tardive exige un **motif**. | D15 |
| Aucune **génération automatique** : pas de tâche créée le lendemain sans action humaine. | D22 |
| La **duplication** sur plusieurs jours est manuelle et les copies sont indépendantes. | D22 |
| La pause **12h00-13h00** est **affichée**, sans effet sur les calculs. | D18 |
| Création **après 16h30** : **refusée** avec message explicite. | **D32** |
| Création un **jour non ouvré** : **refusée** avec message explicite. | **D32** |
| Une tâche quotidienne ne porte **qu'une seule date métier** (`dateAction` = `dateDebut`) ; pas de `dateFinPrevue`. | **D28** |
| Règles de duplication (jours non ouvrés, copie des commentaires) : **D44**. | ✅ |

### 5.9 RM-09 — Création, attribution et validation

- **trois sources** : admin (tout le monde), responsable (son service + lui-même), employé (lui-même) — D13, D25 ;
- **aucune validation préalable** : la tâche est active dès sa création — D24 ;
- le responsable **contrôle a posteriori** : voir, commenter, modifier statut et progression — D17 ;
- le responsable **ne peut pas** supprimer une tâche qu'il n'a pas attribuée — D7 ;
- le **pilote** et l'**exécutant** sont deux rôles distincts — D6 ;
- la **modification du titulaire** reste dans le périmètre de création — D13 ;
- les champs de priorité d'un non-admin sont **saisis par le créateur habilité** dans son périmètre, puis **calculés** par la matrice (**C12 → D33**) ;

### 5.10 RM-10 — Visibilité et service

| Rôle | Périmètre |
|---|---|
| `ADMIN` | Toutes les tâches, tous les services |
| `CONSULTANT` | Toutes les tâches, en lecture seule |
| `RESPONSABLE` | Son service **+** ses propres tâches |
| `EMPLOYEE` | Ses propres tâches (assignées + pilote + créées) |

**Conséquences** :

- un employé **ne voit jamais** les tâches d'un collègue (RE-12) ;
- un responsable **ne voit jamais** un autre service (D17) ;
- le **service porteur** d'une tâche est le **département de l'exécutant**, à défaut celui du pilote (**P7 → D29**) ;
- une tâche sans département n'est visible que de ses ayants droit directs, de l'admin et du consultant.

### 5.11 RM-11 — Suppression

| Rôle | Peut supprimer | Ne peut pas supprimer |
|---|---|---|
| `ADMIN` | Toute tâche | — |
| `RESPONSABLE` | Les tâches qu'il a **lui-même attribuées** | Celles attribuées par l'admin ou créées par un employé ; il peut les **annuler** |
| `EMPLOYEE` | Aucune | Toutes |
| `CONSULTANT` | Aucune | Toutes |

**Précisions** :

- la suppression est **tracée** dans l'audit (AR-10) ;
- le caractère **physique ou logique** de la suppression est un choix technique de l'ÉTAPE 7 ; il ne change pas les droits ci-dessus ;
- un **employé référencé** n'est jamais supprimé ; il est **désactivé** (R3, Q4, D12).

### 5.12 RM-12 — Comptes, rôles et désactivation

- un compte par employé (D12) ;
- rôle par défaut `EMPLOYEE` (D12) ;
- `RESPONSABLE` avec département obligatoire (D7) ;
- `CONSULTANT` en lecture seule (D21) ;
- désactivation immédiate de l'accès ; **jamais** de suppression (D12) ;
- le directeur possède une fiche employé et un compte `ADMIN` (D20) ;
- le devenir du compte d'un responsable dont le département est supprimé est fixé par **D48** : la suppression et la désactivation du département sont **refusées** tant que le rôle n'a pas été déplacé.

### 5.13 RM-13 — Journal d'audit

**Événements journalisés** : création, modification, changement de statut, changement de progression, commentaire, motif, clôture, suppression, changement de titulaire, création / désactivation de compte, changement de rôle, modification d'un référentiel.

**Contenu minimal** : identifiant de l'événement, date et heure, auteur, type d'opération, entité concernée, valeurs **avant / après** (sans mot de passe ni secret).

**Règles** : journal **append-only**, non modifiable par l'interface, consultable par l'admin (proposition).

### 5.14 RM-14 — Doublons de libellé

- l'Excel détectait les doublons de libellé ; **0 doublon** sur 95 lignes ;
- le contrôle est **conservé à la saisie** ;
- il **signale** un libellé déjà utilisé par une tâche active ;
- il ne bloque pas nécessairement : le caractère bloquant ou seulement avertissant est **à préciser à l'ÉTAPE 9**. Aucun doublon n'est supprimé automatiquement.

### 5.15 RM-15 — Cohérence des dates

| Contrôle | Règle |
|---|---|
| Ordre | `dateAction ≤ dateDebut ≤ dateFinPrevue` |
| Clôture | `dateFin ≥ dateDebut` |
| Échéance | `dateFinPrevue` obligatoire pour une tâche `AUTRE` |
| Format | Date calendaire valide ; aucune date texte |
| Fuseau | Les dates métier sont **calendaires** ; les horodatages techniques sont séparés |

> Ces contrôles traitent les **anomalies 1, 2, 4 et 10** du document 01. Ils ne fixent **aucune borne métier** (pas d'année minimale ou maximale) : aucune décision ne l'a fait.

---

## 6. Parcours utilisateurs

> **UC-xx** = cas d'utilisation. Les parcours décrivent le **comportement attendu**, pas les écrans (ÉTAPE 9).

| # | Acteur | Objectif | Scénario nominal | Variantes / exceptions | Règles |
|---|---|---|---|---|---|
| **UC-01** | Tous | Se connecter | Saisit identifiant + mot de passe → session ouverte → arrive sur sa vue principale | Compte désactivé, mot de passe erroné, compte verrouillé → message générique, pas de session | EF-01, EF-02, EF-10 |
| **UC-02** | Employé | Voir ses tâches du jour | Ouvre « Mes tâches du jour » → voit les tâches du jour non achevées → ouvre le détail | Aucune tâche → état vide explicite | EF-41 |
| **UC-03** | Employé | Consulter ses autres tâches | Ouvre « Mes autres tâches » → voit les tâches long terme déjà assignées | Aucune tâche → état vide | EF-42, D19 |
| **UC-04** | Employé | Clôturer une tâche à l'heure | Ouvre la tâche → coche « achevée » → `dateFin` = aujourd'hui → statut `Achevée` | Déjà clôturée → action désactivée | EF-53, RM-01 |
| **UC-05** | Employé | Clôturer une tâche en retard | Ouvre la tâche → saisit la date de fin → le formulaire exige un motif → saisit le motif → clôture acceptée | Motif vide → refus serveur, aucune écriture | EF-54, RM-07 |
| **UC-06** | Employé | Commenter une tâche | Ouvre la tâche → saisit un commentaire → enregistre → commentaire visible, statut inchangé | Commentaire vide → accepté (facultatif) | EF-55, D3 |
| **UC-07** | Employé | Faire avancer une tâche long terme | Ouvre la tâche → saisit un pourcentage 0-100 → enregistre → progression manuelle affichée | Valeur hors bornes → refus / bornage explicite | EF-56, RM-02 |
| **UC-08** | Employé | Créer sa tâche supplémentaire | Clique « Nouvelle tâche » → choisit la nature → saisit les champs → enregistre → tâche active immédiatement | Tente de choisir un collègue → refus ; champs de priorité selon C12 | EF-31, EF-32, D24 |
| **UC-09** | Responsable | Attribuer une tâche à son service | Clique « Nouvelle tâche » → choisit un employé de son service → saisit les champs → enregistre | Employé d'un autre service → refus | EF-30, D13 |
| **UC-10** | Responsable | Contrôler une tâche de son service | Ouvre « Mon service » → ouvre une tâche → commente, change statut ou progression → enregistre | Tâche d'un autre service → invisible ; suppression interdite si non attribuée | EF-44, EF-59, D17 |
| **UC-11** | Responsable | Supprimer une tâche qu'il a attribuée | Ouvre la tâche → « Supprimer » → confirmation → suppression tracée | Tâche attribuée par l'admin → action absente / refus ; proposer « Annuler » | EF-67, RM-11 |
| **UC-12** | Admin | Créer une tâche pour n'importe qui | Clique « Nouvelle tâche » → choisit le titulaire (tout employé / responsable) → saisit les champs → enregistre | Titulaire inactif → **refus** (`422 EMPLOYE_INACTIF`, **D49**) | EF-29, D13 |
| **UC-13** | Admin | Dupliquer une tâche quotidienne | Ouvre une tâche quotidienne → « Dupliquer » → choisit une plage de dates → confirme → copies indépendantes créées | Plage contenant un jour non ouvré → **refus** ; plage > 31 dates → **refus** (**D44**) | EF-61 à EF-65 |
| **UC-14** | Admin | Gérer les référentiels | Ouvre « Référentiels » → choisit Employés / Partenaires / Départements / Fériés / Éléments → ajoute ou modifie | Suppression d'un élément référencé → refus / désactivation | EF-11 à EF-18 |
| **UC-15** | Admin | Gérer les comptes | Ouvre « Comptes » → crée un compte lié à un employé → attribue un rôle → désactive au départ | Second compte pour le même employé → refus ; responsable sans département → refus | EF-04, EF-05, EF-06 |
| **UC-16** | Admin | Consulter le journal | Ouvre « Audit » → filtre par utilisateur, date, entité → consulte avant / après | Journal non modifiable | EF-76, EF-77 |
| **UC-17** | Consultant | Consulter les tâches | Se connecte → ouvre « Toutes les tâches » → filtre et consulte | Toute action d'écriture → refus serveur | EF-46, EF-07 |
| **UC-18** | Tous | Se déconnecter | Clique « Déconnexion » → session détruite → retour à l'écran de connexion | Session expirée → redirection | EF-01 |

---

## 7. Écrans attendus

> **IHM-xx** = écran. Le présent inventaire fixe le **contenu fonctionnel** ; la mise en page, les routes, les composants et les états d'écran sont fixés par l'**ÉTAPE 9** (`docs\08_INTERFACE_REACT.md`, validée le 02/11/2026).

| # | Écran | Rôles | Contenu attendu | Actions principales |
|---|---|---|---|---|
| **IHM-01** | Connexion | Tous | Identifiant, mot de passe, message d'erreur générique | Se connecter |
| **IHM-02** | Mes tâches du jour | Employé, responsable, admin | Tâches du jour, statut, échéance 16h30, progression, rappel | Ouvrir, clôturer, commenter |
| **IHM-03** | Mes autres tâches | Employé, responsable, admin | Tâches long terme assignées / pilotées / créées | Ouvrir, progresser, commenter |
| **IHM-04** | Toutes mes tâches | Tous | Liste complète avec filtres et tri | Ouvrir, filtrer |
| **IHM-05** | Détail d'une tâche | Selon droits | Tous les champs, valeurs calculées, motif, commentaires, historique | Modifier, clôturer, annuler, suspendre, supprimer |
| **IHM-06** | Formulaire de tâche | Selon droits | Nature, libellé, élément, acteur, pilote, exécutant, dates, urgence, importance, priorité et action à prendre **affichées en lecture seule**, commentaire | Enregistrer, annuler |
| **IHM-07** | Duplication | Admin, responsable, employé (périmètre) | Tâche source, dates de destination, aperçu des copies | Dupliquer |
| **IHM-08** | Mon service | Responsable | Employés du service, tâches, avancement, retards | Ouvrir, contrôler, créer |
| **IHM-09** | Tous les services | **Admin** (écriture) et **consultant** (lecture seule) — **D63** | Toutes les tâches, tous les employés, filtres par service ; aucune action d'écriture pour le consultant | Ouvrir, créer, supprimer (admin) |
| **IHM-10** | Référentiels | Admin | Employés, partenaires, départements, fériés, éléments, urgences, importances | Ajouter, modifier, désactiver |
| **IHM-11** | Comptes et rôles | Admin | Comptes, employé lié, rôle, état | Créer, changer de rôle, désactiver |
| **IHM-12** | Paramètres | Admin | Week-end, fuseau, heure limite, pause, jours fériés | Enregistrer |
| **IHM-13** | Journal d'audit | Admin | Événements filtrables, avant / après | Consulter |
| **IHM-14** | Mon profil | Tous | Identité, rôle, département, mot de passe | Changer le mot de passe |

**Règles d'écran** :

- un écran n'affiche **que** ce que le rôle est autorisé à voir ;
- une action non autorisée est **absente ou désactivée**, et **refusée par le serveur** ;
- les états vides sont explicites (« Aucune tâche pour aujourd'hui »), jamais un écran blanc ;
- les erreurs de validation sont affichées **près du champ** concerné ;
- les actions destructrices (suppression, annulation) demandent une **confirmation**.

---

## 8. Règles d'interface et charte graphique

> **DÉCISION 23** : noir dominant, accents rouges, palette **strictement** limitée à **noir / rouge / blanc**. Aucun vert, jaune, orange ou bleu, y compris pour les statuts et les graphiques.

| Élément | Règle |
|---|---|
| Fond principal | **Noir** |
| Zones de lecture | **Blanc** possible, texte **noir** |
| Texte sur fond noir | **Blanc** |
| Titres, boutons principaux, alertes, retards | **Rouge** |
| Autres couleurs | ❌ **Interdites** |
| Statuts | Distingués par **libellé + icône** ; le rouge est réservé au **retard / à l'alerte** |
| Progression | Barre **rouge** sur valeur 0-100 % |
| Rappel échu | Signal **rouge** |
| Rappel imminent | Signal distinct, sans couleur supplémentaire |
| Dates | Format français `JJ/MM/AAAA` ; heures `HH:MM` |
| Langue | **Français** |
| Accessibilité | Contraste contrôlé, navigation clavier, libellés explicites |

**Icônes monochromes retenues** (validées à l'ÉTAPE 9 — **D58**) :

| Statut | Icône proposée | Couleur |
|---|---|---|
| `A faire` | ○ | blanc / noir |
| `En cours` | ▶ | blanc / noir |
| `Retard` | ▲ | **rouge** |
| `Achevée` | ✓ | blanc / noir |
| `Annulée` | ✕ | blanc / noir |
| `Suspendue` | ⏸ | blanc / noir |

> **Conséquence de D23** : « achevé » et « en cours » ne peuvent pas être distingués par le vert et le bleu. Ils le sont par le **texte**, l'**icône** et la **position**. Chaque écran sera contrôlé en contraste à l'ÉTAPE 9.

---

## 9. Exigences non fonctionnelles

| # | Exigence | Cible proposée | Statut | Réf. |
|---|---|---|---|---|
| **ENF-01** | Performance des listes | 1 000 tâches affichées en **moins de 2 s** sur le serveur local | 🔧 | RE-19 |
| **ENF-02** | Disponibilité | Heures ouvrées 8h00-16h30 ; indisponibilité planifiée hors horaires | 🔧 | Contexte |
| **ENF-03** | Sécurité | Authentification, session, autorisation serveur, CSRF, en-têtes, limitation des tentatives | 🔧 | ÉTAPE 13 |
| **ENF-04** | Sauvegarde | Quotidienne, conservation 30 jours, copie hors machine, restauration testée | 🔧 | ÉTAPE 14 |
| **ENF-05** | Traçabilité | Journal d'audit append-only, consultable par l'admin | ✅ | AR-10 |
| **ENF-06** | Accessibilité | Contraste et navigation clavier ; aucune information portée par la couleur seule | 🔧 | RE-19, D23 |
| **ENF-07** | Navigateurs | Dernières versions de Chrome, Edge et Firefox | 🔧 | Contexte |
| **ENF-08** | Fuseau et localisation | **`Africa/Algiers`** unique ; dates françaises ; semaine selon le calendrier GD Trading | ✅ **D30** | D5, D18 |
| **ENF-09** | Volumétrie | 95 actions historiques, quelques dizaines d'employés, croissance modérée | ✅ | Excel |
| **ENF-10** | Maintenabilité | TypeScript strict, règles isolées, tests unitaires des moteurs | 🔧 | AR-04, AR-13 |
| **ENF-11** | Isolation | Aucun code, dépendance, base ou composant partagé avec l'ancien projet de gestion de stock | ✅ | D10 |
| **ENF-12** | Déploiement | Serveur local, réseau interne, HTTPS, aucune exposition Internet | 🔧 | ÉTAPE 14, P11 |
| **ENF-13** | Journalisation technique | Journaux applicatifs avec rotation ; aucune donnée sensible | 🔧 | AR-12 |
| **ENF-14** | Reprise | Migrations appliquées après sauvegarde ; procédure de restauration documentée | 🔧 | ÉTAPE 14 |

---

## 10. Critères d'acceptation

> **CA-xx** = critère d'acceptation. Chaque critère est **testable** et sera repris à l'**ÉTAPE 12**.
> Les critères dépendant d'un point ❓ sont marqués « **à compléter après décision** ».

### 10.1 Authentification et droits

| # | Critère | Réf. |
|---|---|---|
| **CA-01** | Étant donné un compte actif et le bon mot de passe, quand l'utilisateur se connecte, alors une session est ouverte et sa vue principale s'affiche. | EF-01 |
| **CA-02** | Étant donné un compte désactivé, quand l'utilisateur saisit le bon mot de passe, alors la connexion est refusée et aucun détail n'est révélé. | EF-02 |
| **CA-03** | Étant donné un employé A, quand il tente de lire ou modifier une tâche de l'employé B, alors le serveur refuse et aucune donnée de B n'est renvoyée. | EF-03, RM-10 |
| **CA-04** | Étant donné un consultant, quand il tente une création, une modification, une clôture ou une suppression, alors le serveur refuse. | EF-07 |
| **CA-05** | Étant donné un second compte pour le même employé, quand l'admin tente de le créer, alors la création est refusée. | EF-06 |
| **CA-06** | Étant donné un compte `RESPONSABLE` sans département, quand l'admin tente de l'enregistrer, alors l'enregistrement est refusé. | EF-05 |

### 10.2 Statut

| # | Critère | Réf. |
|---|---|---|
| **CA-07** | Tâche avec `dateFin` renseignée → statut `Achevée`. | RM-01 |
| **CA-08** | Tâche avec `dateAction` future → statut `A faire`. | RM-01 |
| **CA-09** | Tâche avec `dateAction` passée et échéance non dépassée → statut `En cours`. | RM-01 |
| **CA-10** | Tâche long terme dont `dateFinPrevue` est antérieure à aujourd'hui et sans `dateFin` → statut `Retard`, à partir du lendemain de l'échéance. | RM-01 |
| **CA-11** | Tâche quotidienne non clôturée à 16h29 → `En cours` ; à 16h31 → `Retard`. | RM-01, D18 |
| **CA-12** | Tâche avec statut manuel `Annulée` **et** `dateFin` renseignée → statut `Annulée`. | RM-01 |
| **CA-13** | Tâche avec statut manuel `Suspendue` **et** échéance dépassée → statut `Suspendue`. | RM-01 |

### 10.3 Progression

| # | Critère | Réf. |
|---|---|---|
| **CA-14** | Progression manuelle à 40 % → 40 % affiché, quelle que soit la progression temporelle. | RM-02 |
| **CA-15** | Sans valeur manuelle, `dateDebut = 01/11/2026`, `dateFinPrevue = 11/11/2026`, référence `02/11/2026` → 10 %. | RM-02 |
| **CA-16** | Sans valeur manuelle, référence postérieure à `dateFinPrevue` → 100 %, statut `Retard`. | RM-02 |
| **CA-17** | `dateDebut` ou `dateFinPrevue` absente → progression `—`. | RM-02 |
| **CA-18** | Tâche clôturée sans valeur manuelle → progression 100 %. | RM-02 |

### 10.4 Priorité et rappel

| # | Critère | Réf. |
|---|---|---|
| **CA-19** | `Immédiate` + `Critique` → libellé `Immédiate & Critique`, score **12**, fréquence **1 j**. | RM-03 |
| **CA-20** | `Planifiable` + `Faible` → score **1**, fréquence **30 j**. | RM-03 |
| **CA-21** | `Pas urgent` + `Faible` → score **0**, fréquence **45 j**. | RM-03 |
| **CA-22** | `Pas urgent` + `Critique` (ou `Elevée`, ou `Modérée`) → enregistrement **refusé** avec message explicite ; aucune tâche n'est créée. | D31 |
| **CA-23** | Changement d'urgence ou d'importance → libellé, score et fréquence recalculés. | RM-03 |
| **CA-24** | Fréquence 2 j, `dateDebut = 02/11/2026`, référence `02/11/2026` → date de rappel `04/11/2026`. | RM-04 |
| **CA-25** | Base jeudi `05/11/2026`, fréquence 1 j, week-end vendredi + samedi → date de rappel `08/11/2026` (dimanche). | RM-04, RM-05 |
| **CA-26** | Base `25/08/2026`, fréquence 1 j, `26/08/2026` férié → date de rappel `27/08/2026`. | RM-04, RM-05 |
| **CA-27** | Tâche clôturée → aucune date de rappel. | RM-04 |
| **CA-28** | Date de rappel ≤ aujourd'hui → signal rouge ; entre J+1 et J+5 → signal imminent distinct. | EF-50 |

### 10.5 Tâches quotidiennes et duplication

| # | Critère | Réf. |
|---|---|---|
| **CA-29** | Duplication d'une tâche sur 3 dates → 3 lignes indépendantes. | EF-61, EF-63 |
| **CA-30** | Modification de la progression de la copie 2 → copies 1 et 3 inchangées. | EF-63 |
| **CA-31** | Aucune tâche n'est créée automatiquement le lendemain d'une tâche quotidienne. | EF-64, D22 |
| **CA-32** | Création d'une tâche quotidienne après 16h30 → **refusée** avec message ; un jour non ouvré → **refusée** avec message ; aucune tâche créée en `Retard`. | D32 |
| **CA-32 bis** | Une tâche quotidienne enregistrée porte une **seule date métier** (`dateAction` = `dateDebut`) et **aucune `dateFinPrevue`**. | D28 |
| **CA-33** | Un employé tente de dupliquer une tâche pour un collègue → refus. | EF-62 |
| **CA-34** | Une plage de duplication comprenant un jour non ouvré, ou dépassant 31 dates, est **refusée** sans créer aucune copie (**D44**). | **D44** |

### 10.6 Création, visibilité et contrôle

| # | Critère | Réf. |
|---|---|---|
| **CA-35** | Un employé crée une tâche pour lui-même → acceptée ; pour un collègue → refusée. | EF-31 |
| **CA-36** | Un responsable crée pour un employé de son service → acceptée ; pour un autre service → refusée. | EF-30 |
| **CA-37** | L'admin crée pour n'importe quel employé → acceptée. | EF-29 |
| **CA-38** | Une tâche créée par un employé est visible immédiatement, sans validation. | EF-32 |
| **CA-39** | Un employé voit les tâches dont il est assigné, pilote ou créateur ; il ne voit pas celles des autres. | EF-43, RM-10 |
| **CA-40** | Un responsable voit les tâches de son service et les siennes ; il ne voit pas les autres services. | EF-44 |
| **CA-41** | L'admin voit toutes les tâches ; le consultant voit toutes les tâches sans pouvoir écrire. | EF-45, EF-46 |
| **CA-42** | Le responsable commente et modifie le statut / la progression d'une tâche de son service → accepté. | EF-60 |
| **CA-43** | Un employé ou un responsable crée une tâche « autre » **avec** urgence et importance dans son périmètre → tâche acceptée, priorité, score, fréquence et action à prendre **calculés** par la matrice. | D33 |

### 10.7 Clôture tardive et commentaire

| # | Critère | Réf. |
|---|---|---|
| **CA-44** | Clôture après l'échéance sans motif → refus serveur, aucune écriture. | EF-54 |
| **CA-45** | Clôture après l'échéance avec motif → acceptée ; le motif est visible par l'employé, son responsable et l'admin. | EF-54 |
| **CA-46** | Clôture avant l'échéance sans motif → acceptée. | RM-07 |
| **CA-47** | Commentaire vide ou rempli → aucun effet sur le statut. | EF-55 |
| **CA-48** | Tâche annulée ou suspendue → aucun motif exigé ; aucune `dateFin` renseignée par l'annulation. | RM-07 |

### 10.8 Suppression

| # | Critère | Réf. |
|---|---|---|
| **CA-49** | L'admin supprime n'importe quelle tâche → accepté, trace d'audit créée. | EF-66, EF-69 |
| **CA-50** | Un responsable supprime une tâche qu'il a attribuée → accepté. | EF-67 |
| **CA-51** | Un responsable supprime une tâche attribuée par l'admin ou créée par un employé → refusé ; l'annulation reste possible. | EF-67, D7 |
| **CA-52** | Un employé ou un consultant tente une suppression → refusé. | EF-68 |

### 10.9 Référentiels et paramètres

| # | Critère | Réf. |
|---|---|---|
| **CA-53** | Suppression d'un employé référencé par une tâche → refusée ; la désactivation reste possible. | EF-11 |
| **CA-54** | Ajout d'un second responsable à un département → refusé. | EF-15 |
| **CA-55** | Département sans responsable → autorisé. | EF-15 |
| **CA-56** | Au démarrage, les **15 fériés 2026** sont présents. | EF-16 |
| **CA-57** | Week-end par défaut = vendredi + samedi ; l'admin peut le modifier. | EF-17 |
| **CA-58** | Ajout d'un férié → les dates de rappel concernées sont recalculées à la lecture suivante. | EF-72 |

### 10.10 Interface, audit et performance

| # | Critère | Réf. |
|---|---|---|
| **CA-59** | Aucun vert, jaune, orange ou bleu n'est utilisé ; les statuts sont distingués par libellé + icône ; le rouge est réservé au retard / à l'alerte. | D23 |
| **CA-60** | Les dates sont affichées `JJ/MM/AAAA` et les heures `HH:MM`. | Section 8 |
| **CA-61** | Un champ obligatoire vide → message près du champ, aucune écriture partielle. | EF-34 |
| **CA-62** | Une création, modification, clôture ou suppression produit une entrée d'audit avec auteur, date et avant / après. | EF-76 |
| **CA-63** | Le journal d'audit ne peut être ni modifié ni supprimé depuis l'interface. | EF-77 |
| **CA-64** | Une liste de 1 000 tâches est paginée et répond en moins de 2 s sur le serveur cible. | ENF-01 |

---

## 11. Matrice de traçabilité

### 11.1 Les 20 exigences du directeur

| Exigence | Couverture fonctionnelle | Critères |
|---|---|---|
| **RE-01** | EF-03, EF-29, EF-45, EF-66 | CA-05, CA-37, CA-49 |
| **RE-02** | EF-24, EF-25, EF-29, EF-38 | CA-32, CA-37 |
| **RE-03** | EF-29, EF-43 | CA-37, CA-39 |
| **RE-04** | EF-45, EF-75, EF-76 | CA-41, CA-62 |
| **RE-05** | EF-41 | CA-39 |
| **RE-06** | EF-42, D19 | CA-39 |
| **RE-07** | EF-53 | CA-07, CA-44 |
| **RE-08** | EF-55 | CA-47 |
| **RE-09** | EF-54, RM-07 | CA-44, CA-45 |
| **RE-10** | EF-56, EF-57, RM-02 | CA-14 à CA-18 |
| **RE-11** | EF-31, EF-32 | CA-35, CA-38 |
| **RE-12** | EF-43, RM-10 | CA-39 |
| **RE-13** | EF-43, EF-44 | CA-39, CA-40 |
| **RE-14** | EF-44, EF-59, EF-60 | CA-40, CA-42 |
| **RE-15** | EF-30 | CA-36 |
| **RE-16** | RM-01, RM-08, EF-22 | CA-11, CA-32 |
| **RE-17** | EF-28, EF-70, EF-71, RM-03 | CA-19 à CA-23 |
| **RE-18** | EF-15, RM-12 | CA-55 |
| **RE-19** | Section 8, ENF-01, ENF-06 | CA-59, CA-60, CA-64 |
| **RE-20** | Section 8, D23 | CA-59 |

**Bilan** : **20 exigences sur 20** couvertes par au moins une EF et un CA.

### 11.2 Les 16 colonnes de l'Excel

| Col | Libellé | Couverture |
|---|---|---|
| B | `STATUT` | RM-01, EF-52 |
| C | `PRIORITE` | RM-03, EF-70 |
| D | `PROGRESSION` | RM-02, EF-56, EF-57 |
| E | `DATE ACTION` | EF-27, RM-01, P4 |
| F | `D.DEBUT` | EF-27, RM-02, RM-06, P4 |
| G | `DATE RAPPEL` | RM-04, EF-72 |
| H | `ELEMENT` | EF-18, EF-25 |
| I | `ACTION` | EF-25, EF-34 |
| J | `ACTEUR` | EF-25, EF-26 |
| K | `STRUCTURE` | EF-26 (pilote) |
| L | `ASSIGNE A` | EF-25, EF-26 (exécutant) |
| M | `D.FIN PREVUE` | EF-27, RM-01 |
| N | `D.FIN` | EF-53, RM-07 |
| O | `DUREE G.` | RM-06, EF-73 |
| P | `DUREE E.` | RM-06, EF-73 |
| Q | `COMMENTAIRE` | EF-55 |

**Bilan** : **16 colonnes sur 16** couvertes. Aucune n'est supprimée sans décision.

### 11.3 Les décisions de référence

| Décision | Sujet | Application dans ce document |
|---|---|---|
| D1 | Périmètre modulaire | Section 1 |
| D2 | Workflows orphelins hors périmètre | Section 11.2 (aucun statut hérité) |
| D3 | Statut explicite + calcul auto | RM-01, EF-52 |
| D4 | Progression manuelle + repli | RM-02, EF-56 à EF-58 |
| D5 | Fériés et jours ouvrés | RM-05, EF-16, EF-17 |
| D6 | Pilote / partenaire / exécutant | EF-25, EF-26, RM-09 |
| D7 | Rôles et matrice des droits | Section 3, RM-10, RM-11 |
| D8 | Référentiels conservés / écartés | EF-18 à EF-21 |
| D9 | Stack TypeScript / Prisma / PostgreSQL | ENF-10, ÉTAPE 7 |
| D10 | Emplacement et séparation | ENF-11 |
| D11 | Aucune reprise de données | EF-75, ENF-09 |
| D12 | Un compte par employé | EF-04 à EF-06, RM-12 |
| D13 | Trois sources de création | Section 3.4, EF-29 à EF-33 |
| D14 | Priorité calculée par la matrice | RM-03, EF-70, EF-71 |
| D15 | Motif distinct et obligatoire | RM-07, EF-54 |
| D16 | « Propres tâches » = A13 | EF-43, RM-10 |
| D17 | Contrôle du responsable | EF-44, EF-59, EF-60 |
| D18 | Échéance 16h30 | RM-01, RM-08 |
| D19 | Consultation, pas de file d'attente | EF-42 |
| D20 | Fiche employé de l'admin | Section 3.1 |
| D21 | Consultant maintenu | EF-07, EF-46 |
| D22 | Quotidiennes ponctuelles + duplication | EF-37, EF-61 à EF-64 |
| D23 | Palette noir / rouge / blanc | Section 8 |
| D24 | Aucune validation préalable | EF-32, RM-09 |
| D25 | Auto-attribution du responsable | EF-30 |
| D26 | ÉTAPE 5 reportée | Section 1.4 |
| D27 | ÉTAPE 5 reprise avant l'ÉTAPE 7 | Section 1.4 |
| D28 | Tâche quotidienne = journée unique (P4) | RM-01, RM-08, EF-38 |
| D29 | Service porteur = département de l'exécutant (P7) | Section 3.3, RM-10, EF-39 |
| D30 | Fuseau `Africa/Algiers` (P8) | EF-23, ENF-08 |
| D31 | Combinaisons absentes refusées (P9) | RM-03, CA-22 |
| D32 | Quotidienne hors délai / jour non ouvré refusée (P10) | RM-08, EF-38, CA-32 |
| D33 | Priorité saisie par le créateur habilité (C12) | Section 3.4, RM-09, EF-40, CA-43 |

---

## 12. Points ouverts et décisions requises

### 12.1 Tableau des points ouverts

| # | Point | Établi | Reste à trancher | Bloque l'ÉTAPE 7 ? |
|---|---|---|---|---|
| **P1** | Sigles `DUREE G.` / `DUREE E.` | Les calculs sont reproduits à l'identique. | Signification de **G** et **E** ; libellés d'écran. | Non |
| **P2** | Fériés 2027-2028 | 15 dates 2026 reprises ; table administrable. | Fourniture des dates 2027-2028. | Non |
| **P3** | Liste des consultants | Rôle `CONSULTANT` maintenu, lecture seule. | Qui doit recevoir ce rôle ? | Non |
| **P4** | Dates d'une tâche quotidienne | Ligne datée, échéance à 16h30. | ✅ **Tranché le 02/11/2026 (D28)** : journée unique, pas de `dateFinPrevue`. | **Clos** |
| **P5** | Sémantique de `FREQUENCE` | Intervalle de relance 1-45 j, pas une récurrence. | Confirmation et libellé d'écran. | Non |
| **P6** | Longueur du libellé | 55 caractères observés. | ✅ **Tranché le 02/11/2026 (D46)** : 255 caractères pour le libellé, 2 000 pour le commentaire. | **Clos** |
| **P7** | Service porteur d'une tâche | Le responsable est limité à « son service ». | ✅ **Tranché le 02/11/2026 (D29)** : département de l'exécutant, à défaut celui du pilote. | **Clos** |
| **P8** | Fuseau horaire | L'échéance 16h30 suppose un fuseau fixe. | ✅ **Tranché le 02/11/2026 (D30)** : `Africa/Algiers` (UTC+1). | **Clos** |
| **P9** | 3 combinaisons absentes | 13 combinaisons sur 16 dans la matrice. | ✅ **Tranché le 02/11/2026 (D31)** : refus avec message explicite. | **Clos** |
| **P10** | Quotidienne après 16h30 / jour non ouvré | L'échéance est à 16h30. | ✅ **Tranché le 02/11/2026 (D32)** : refus avec message explicite. | **Clos** |
| **P11** | Environnement serveur | Serveur local, réseau interne. | OS, IIS, TLS, DNS interne, sauvegarde. | Non (ÉTAPE 14) |
| **P12** | Session et mots de passe | Session serveur, Argon2id. | Durée, complexité, première connexion, verrouillage. | Non (ÉTAPE 13) |
| **P13** | Motif de non-achèvement | Champ distinct, obligatoire à la clôture tardive. | ✅ **Tranché le 02/11/2026 (D45)** : non vide après `trim`, maximum 2 000 caractères, aucune longueur minimale au-delà. | **Clos** |
| **P14** | Duplication | Copies indépendantes, aucune génération auto. | ✅ **Tranché le 02/11/2026 (D44)** : 31 dates maximum, jours ouvrés obligatoires, aucun commentaire ni motif copié, atomicité. | **Clos** |
| **P15** | Suppression d'un département | Au plus un responsable ; département facultatif. | ✅ **Tranché le 02/11/2026 (D48)** : suppression et désactivation refusées tant qu'un responsable est rattaché. | **Clos** |
| **P16** | Pilote **partenaire** pour un non-admin | Le pilote peut être un employé ou un partenaire (D6). | ✅ **Tranché le 02/11/2026 (D47)** : partenaire interdit aux non-admins ; pilote employé limité au périmètre de création. | **Clos** |

### 12.2 Tension nouvelle **C12** — Priorité des tâches créées par un non-admin

**Constat** :

- **D13** permet au responsable et à l'employé de créer des tâches ;
- **RE-11** permet à l'employé de créer des tâches **quotidiennes ou autres** ;
- **RE-17** attache à une tâche « autre » : échéance, **priorité**, **importance**, **urgence**, **action à prendre** ;
- **D14** réserve la saisie de l'**urgence** et de l'**importance** à l'**admin** ; l'**action à prendre** en découle automatiquement.

**Conséquence** : si seul l'admin peut renseigner urgence et importance, un employé **ne peut pas créer une tâche « autre » complète**, ce qui contredit RE-11. Les trois textes ne peuvent pas s'appliquer littéralement ensemble.

| Option | Règle | Avantage | Inconvénient |
|---|---|---|---|
| **A** | Seul l'admin renseigne urgence, importance et action à prendre. Les tâches créées par un non-admin sont enregistrées **sans priorité** et complétées plus tard par l'admin. | Lecture littérale de D14. | Bloque la création d'une tâche « autre » par un employé (RE-11) ou crée des tâches incomplètes. |
| **B** *(recommandée)* | **Tout créateur habilité** renseigne urgence, importance et action à prendre **dans son périmètre** ; la matrice calcule. | Respecte D13, RE-11, RE-17 et D14 dans son **intention** (la priorité reste calculée). | D14 nomme « l'admin » : il faut acter que « l'admin » signifie « le créateur habilité ». |
| **C** | Les champs sont **facultatifs** pour tous ; l'admin les complète ensuite. | Souple. | Autorise des tâches « autres » sans priorité, contrairement à RE-17. |

> ✅ **Décision rendue le 02/11/2026 — DÉCISION 33, option B.** EF-40 et CA-43 sont désormais complets. La priorité reste **calculée** ; « l'admin » de la DÉCISION 14 s'entend comme **le créateur habilité**.

### 12.3 Décisions rendues avant l'ÉTAPE 7 — ✅ **les six points sont clos**

| # | Question | Décision | Date |
|---|---|---|---|
| **P4** | Dates d'une tâche quotidienne | **A** — journée unique (**D28**) | 02/11/2026 |
| **P7** | Service porteur | **A** — département de l'exécutant, à défaut du pilote (**D29**) | 02/11/2026 |
| **P8** | Fuseau | **A** — `Africa/Algiers` (UTC+1) (**D30**) | 02/11/2026 |
| **P9** | 3 combinaisons absentes | **A** — refus avec message (**D31**) | 02/11/2026 |
| **P10** | Quotidienne après 16h30 / jour non ouvré | **A** — refus avec message (**D32**) | 02/11/2026 |
| **C12** | Priorité des tâches créées par un non-admin | **B** — créateur habilité (**D33**) | 02/11/2026 |

> **Aucun point ne bloque plus l'ÉTAPE 7.** Les points **P6, P13, P14, P15 et P16** ont été **clos le 02/11/2026** par les **DÉCISIONS 44 à 57** (ÉTAPE 8) — détail en section **1.6**. Restent ouverts et **non bloquants** : **P1, P2, P3, P5, P11 et P12**.
### 12.4 Historique des options proposées

Les options ci-dessous sont **conservées pour mémoire** ; elles ne sont plus des questions ouvertes.

| # | Question | Options examinées |
|---|---|---|
| **P4** | Dates d'une tâche quotidienne | **A** : la journée suffit (`dateAction` = jour, `dateDebut` = jour, pas de `dateFinPrevue` distincte) · **B** : conserver les trois dates · **C** : `dateAction` + `dateFinPrevue` seulement |
| **P7** | Service porteur | **A** : département de l'exécutant, à défaut celui du pilote · **B** : département du pilote · **C** : champ explicite |
| **P8** | Fuseau | **A** : `Africa/Algiers` (UTC+1) · **B** : autre fuseau |
| **P9** | 3 combinaisons absentes | **A** : refuser avec message · **B** : compléter la matrice · **C** : fréquence 7 j sans score |
| **P10** | Quotidienne après 16h30 / jour non ouvré | **A** : refuser · **B** : reporter au prochain jour ouvré · **C** : créer pour le jour même, immédiatement `Retard` |
| **C12** | Priorité des tâches créées par un non-admin | **A** : admin seul · **B** : créateur habilité · **C** : facultatif |

> **Rappel** : les options retenues figurent en section 12.3. Les points **P1, P2, P3, P5, P11 et P12** peuvent être tranchés plus tard sans bloquer le modèle de données ; **P6, P13, P14, P15 et P16** sont clos depuis le 02/11/2026 (**D44 à D57**).

---

## 13. Ce que l'ÉTAPE 5 ne fait pas

- Elle **ne crée aucun fichier de code** et aucun dossier applicatif.
- Elle **ne définit pas** les tables, colonnes, clés, contraintes et index → **ÉTAPE 7**.
- Elle **ne définit pas** les endpoints, codes HTTP et DTO → **ÉTAPE 8**.
- Elle **ne dessine pas** les maquettes ni les composants → **ÉTAPE 9**.
- Elle **ne rédige pas** la politique de sécurité complète → **ÉTAPE 13**.
- Elle **ne rédige pas** la procédure de déploiement → **ÉTAPE 14**.
- Elle **ne tranche aucun** des points P1-P16 ni la tension C12 : elle les **formalise** pour qu'ils soient décidés. *(Les points P6, P13, P14, P15 et P16 ont été tranchés après coup, à l'ÉTAPE 8 — **D44 à D57**.)*

---

## 14. Validation obtenue

✅ **Validation obtenue le 02/11/2026.** Le directeur a validé :

1. le **périmètre**, le **vocabulaire** et les **six statuts** ;
2. les **quatre rôles**, la **matrice des droits** et les **périmètres de lecture** ;
3. les **exigences fonctionnelles EF-01 à EF-79** ;
4. les **règles métier RM-01 à RM-15** ;
5. les **parcours UC-01 à UC-18**, les **écrans IHM-01 à IHM-14** et les **critères d'acceptation CA-01 à CA-64** ;
6. les points **P4, P7, P8, P9, P10** et la tension **C12**, tranchés le 02/11/2026 (**DÉCISIONS 28 à 33**) ;
7. le caractère **non bloquant** des points **P1-P3, P5, P11-P12** ; les points **P6, P13, P14, P15 et P16** ont été **tranchés le 02/11/2026** lors de l'ÉTAPE 8 (**DÉCISIONS 44 à 57**).

> L'**ÉTAPE 7** (modèle de données PostgreSQL) peut désormais être engagée.
> **Aucun code ne sera écrit avant la validation de l'ÉTAPE 8** (contrats d'API). — *ÉTAPE 8 validée le 02/11/2026.*

---

## 15. Journal des révisions

| Date | Section(s) | Modification | Statut |
|---|---|---|---|
| 02/11/2026 | Document entier | **VALIDATION DU DIRECTEUR** : document validé en l'état. Points **P4, P7, P8, P9, P10** et tension **C12** tranchés (**DÉCISIONS 28 à 33**) ; EF-23, EF-38, EF-39, EF-40, RM-03, RM-08, RM-09, RM-10, ENF-08, CA-22, CA-32 et CA-43 mis à jour. | ✅ **Validée le 02/11/2026** |
| 02/11/2026 | §1.5, §1.6, §3.4, §4.6, §5.7, §5.8, §5.12, §9.3, §10.5, §12.1, §12.3, §13, §14, §15 | **Validation de l'ÉTAPE 8** : ajout de la section **1.6** et des **DÉCISIONS 44 à 57**. Points **P6, P13, P14, P15 et P16 clos**. EF-65, UC-12, UC-13, CA-34 mis à jour ; référence à `P14`, `P15`, `P16` et `P13` remplacées par les décisions. | ✅ **Mis à jour le 02/11/2026** |
| 02/11/2026 | Document entier | Création du livrable 05 (ÉTAPE 5) : vocabulaire, 4 rôles, matrice des droits, **79 exigences fonctionnelles**, **15 règles métier**, **18 parcours**, **14 écrans**, **14 exigences non fonctionnelles**, **64 critères d'acceptation**, matrice de traçabilité RE / Excel / décisions, points **P1-P16** et tension **C12**. Reprise après report (**D26**, **D27**). | ⏳ **En attente de validation** |
