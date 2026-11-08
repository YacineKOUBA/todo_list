# Livrable 03 — ÉTAPE 4 : Comparaison Excel / nouvelles exigences

| | |
|---|---|
| **Projet** | Application web de gestion des TODOLIST — GD Trading |
| **Livrable** | 03 (méthode M8) |
| **Étape** | **4 — Comparaison Excel / nouvelles exigences** |
| **Document de référence 1** | `docs\01_ANALYSE_FONCTIONNELLE.md` — ÉTAPES 1 et 2, **validé le 01/11/2026** |
| **Document de référence 2** | `docs\02_EXIGENCES_DIRECTEUR.md` — ÉTAPE 3, **validé le 01/11/2026** ; DÉCISIONS 13 à 25 **validées le 02/11/2026** |
| **Source analysée** | `sources\classeur\ClasseurYD.xlsx` — lecture seule, jamais modifié |
| **Décisions de référence** | **DÉCISIONS 1 à 25** |
| **Date de rédaction** | 02/11/2026 |
| **Statut** | ✅ **VALIDÉE PAR LE DIRECTEUR le 02/11/2026** — comparaison et classement validés en l'état |

> **Règle M2** : ce document n'ajoute **aucune décision**. Il constate ce que devient chaque élément du classeur au regard des décisions **déjà validées**.
> **Règle M3** : **aucune** colonne, **aucune** table, **aucune** règle de l'Excel n'est déclarée inutile sans une décision datée qui le dit explicitement.
> **Règle M6** : les contradictions résiduelles sont signalées en **section 11**, jamais résolues d'office.
> **Aucun code n'a été écrit.**

---

## 1. Objet et méthode

L'ÉTAPE 4 répond à une seule question : **pour chaque élément du classeur, que devient-il dans l'application ?**

Elle croise trois lectures déjà validées :

1. le **comportement constaté** de l'Excel (document 01) ;
2. les **20 exigences** du directeur, **RE-01 à RE-20** (document 02) ;
3. les **25 décisions** arrêtées ensemble (documents 01 et 02).

Chaque élément reçoit **un seul verdict principal** :

| Verdict | Signification | Preuve attendue |
|---|---|---|
| **R — REPRODUIT** | La règle de l'Excel est conservée, avec la même sémantique. | Le comportement est décrit dans le document 01. |
| **M — MODIFIÉ** | La règle est conservée, mais **une caractéristique** change. | Une **décision datée** explique le changement. |
| **A — ABANDONNÉ** | L'élément est **explicitement exclu** du périmètre. | Une **décision datée** l'exclut, **ou** il s'agit d'un **artefact Excel** déjà documenté comme anomalie (jamais une règle métier). |
| **N — NOUVEAU** | L'élément n'a **aucun équivalent** dans l'Excel. | Une **exigence RE-xx** le demande. |

> **Un verdict n'est jamais une opinion du développeur.** Chaque **M** et chaque **A** cite sa justification : une **décision datée**, ou une **anomalie documentée** lorsqu'il s'agit d'un artefact Excel. Un élément sans décision contraire est **reproduit par défaut** (règle M3).

---

## 2. Synthèse

### 2.1 Les objets Excel

| Famille d'objets | Total | **R** reproduits | **M** modifiés | **A** abandonnés |
|---|---:|---:|---:|---:|
| Colonnes de `ACTIONS` | 16 | 12 | 4 | 0 |
| Tables de `BD` | 19 | 9 | 0 | 10 |
| Listes de statuts héritées | 8 | 0 | 0 | 8 |
| Motifs de formules | 7 | 4 | 2 | 1 |
| Règles de présentation et contrôles | 9 | 5 | 1 | 3 |
| **TOTAL** | **59** | **30** | **7** | **22** |

**Lecture** : **30 objets sur 59** sont reproduits tels quels, **7** sont modifiés par une décision, **22** sont abandonnés (décision datée ou artefact documenté). **Aucun objet n'est « oublié »** : les 59 sont classés.

### 2.2 Les 20 exigences du directeur

| Verdict | Nombre | Exigences |
|---|---:|---|
| **R — déjà couvert par l'Excel** | 3 | RE-03 · RE-07 · RE-08 |
| **M — existant modifié** | 2 | RE-10 · RE-17 |
| **N — nouveau** | 15 | RE-01 · RE-02 · RE-04 · RE-05 · RE-06 · RE-09 · RE-11 · RE-12 · RE-13 · RE-14 · RE-15 · RE-16 · RE-18 · RE-19 · RE-20 |
| **A — abandonné** | 0 | — |
| **TOTAL** | **20** | |

### 2.3 Ce que l'ÉTAPE 4 garantit

- les **16 colonnes** de `ACTIONS` sont toutes classées ;
- les **19 tables** de `BD` sont toutes classées ;
- les **8 listes de statuts héritées** sont classées ;
- les **7 motifs de formules** sont classés ;
- les **16 anomalies** constatées sont toutes traitées (section 7) ;
- les **20 exigences** sont toutes reliées à l'Excel ou à une décision (section 8).

---

## 3. Comparaison des 16 colonnes de `ACTIONS`

| # | Col | Libellé | Comportement Excel actuel | Règle retenue dans l'application | Verdict | Réf. |
|---|---|---|---|---|---|---|
| 1 | B | `STATUT` | Formule à 6 états, ordre de test impératif ; `Annulée` / `Suspendue` déclenchés par le texte du commentaire. | 4 états **calculés** dans le **même ordre** ; `Annulée` / `Suspendue` deviennent des **choix manuels prioritaires** ; le commentaire n'a plus d'effet. | **M** | D3 · RE-07 |
| 2 | C | `PRIORITE` | **Choisie** dans une liste de 13 libellés concaténés ; aucune colonne `URGENCE` ni `IMPORTANCE` séparée. | L'admin choisit **urgence + importance** ; la **matrice** compose le libellé, le score et la fréquence. Les 13 libellés restent identiques. | **M** | D14 · RE-17 |
| 3 | D | `PROGRESSION` | Calcul temporel 0→1 ; type **mixte** : 78 nombres, 16 `"En retard"`, 1 `"-"`. | **Pourcentage manuel 0-100** prioritaire ; **repli temporel** si vide ; plus de type mixte ; « En retard » porté par le statut. | **M** | D4 · RE-10 |
| 4 | E | `DATE ACTION` | Date de lancement planifiée, **obligatoire** (95/95) ; vide ou future → `A faire`. | Même rôle pour les tâches **long terme** ; une tâche **quotidienne** est rattachée à **sa journée** (D22). | **R** | D3 · D22 |
| 5 | F | `D.DEBUT` | Date de début réelle, **obligatoire** (95/95) ; base du calcul de progression. | Conservée pour les tâches **long terme**. Le cas des tâches **quotidiennes** est un point de modélisation à trancher (**P4**). | **R** *(réserve P4)* | D4 |
| 6 | G | `DATE RAPPEL` | Calculée en **jours ouvrés** (`WORKDAY.INTL`), week-end **vendredi + samedi** codé en dur, fériés lus dans le **classeur externe**. | Même calcul ; fériés dans une **table locale administrable** ; week-end **paramétrable** ; aucune dépendance externe. | **R** | D5 · D14 |
| 7 | H | `ELEMENT` | Liste imposée `PILIER` : 6 valeurs ; `PERFORMANCE` jamais utilisée. | Référentiel **recréé** ; aucune valeur reprise ; les 6 piliers restent disponibles. | **R** | D8 · Table1089 |
| 8 | I | `ACTION` | Libellé libre, une ligne, **55 caractères** observés. | Libellé libre ; la limite de longueur reste à confirmer (**P6**). | **R** *(réserve P6)* | — |
| 9 | J | `ACTEUR` | `GD_TRADING` (79) ou `PARTENAIRE` (16). | Même discriminateur, conservé. | **R** | D6 |
| 10 | K | `STRUCTURE` | **Départements** pour les internes (9 observés sur 11), **noms de partenaires** pour les externes ; la règle demandée n'était pas respectée. | **Pilote** = **employé** si `GD_TRADING`, **partenaire** si `PARTENAIRE`. Règle appliquée dès le départ. | **M** | D6 · Q2 |
| 11 | L | `ASSIGNE A` | 19 personnes ; **exécutant** de l'action. | Même rôle ; référentiel **Employés** recréé, **aucun nom repris**. | **R** | D6 · R1 |
| 12 | M | `D.FIN PREVUE` | Échéance contractuelle, 94/95 remplie ; une valeur texte aberrante. | Échéance conservée ; **date seule** pour une tâche long terme ; **le jour même à 16h30** pour une tâche quotidienne. | **R** + précision D18 | D18 |
| 13 | N | `D.FIN` | Date de clôture réelle (45/95) ; renseignée → `Achevée`. | Clôture conservée ; une **clôture tardive exige un motif** de non-achèvement. | **R** + précision D15 | D3 · D15 |
| 14 | O | `DUREE G.` | Durée totale : `D.FIN − D.DEBUT`, ou `AUJOURDHUI − D.DEBUT` si non clôturée. | Conservée ; **signification des sigles toujours À VALIDER** (A8). | **R** *(réserve A8)* | A8 |
| 15 | P | `DUREE E.` | Écart de clôture : positif = retard, négatif = avance, `0` = à l'heure, `Erreur` si dates incohérentes. | Conservée avec les mêmes cas ; **signification des sigles toujours À VALIDER** (A8). | **R** *(réserve A8)* | A8 |
| 16 | Q | `COMMENTAIRE` | Texte libre ; **100 % vide** ; sert pourtant à déclencher `Annulée` / `Suspendue`. | Texte **libre, facultatif, sans effet** sur le statut ; le **motif obligatoire** est un **champ distinct**. | **R** | D3 · D15 |

### 3.1 Points sensibles — ordre de test du statut

L'ordre de l'Excel est **conservé** pour les quatre états calculés. Seule la **source** des deux états manuels change :

```text
SI   statut manuel = "Annulée"                 → "Annulée"        (choix manuel, prioritaire)
SI   statut manuel = "Suspendue"               → "Suspendue"      (choix manuel, prioritaire)
SI   D.FIN est renseignée                      → "Achevée"
SI   DATE ACTION est vide
  OU DATE ACTION > AUJOURDHUI                  → "A faire"
SI   D.FIN PREVUE < AUJOURDHUI                 → "Retard"
SINON                                          → "En cours"
```

> Pour une tâche **quotidienne**, la comparaison `D.FIN PREVUE < AUJOURDHUI` est complétée par l'**heure limite de 16h30** (D18). Les tâches long terme restent **à la date**.

### 3.2 `PRIORITE` — d'une liste à deux champs

| Point | Excel | Application |
|---|---|---|
| Champs saisis | **1** : `PRIORITE` | **2** : `URGENCE` + `IMPORTANCE` |
| Libellé | choisi parmi 13 | **composé** par la matrice |
| Score | présent dans `BD!Table31`, non porté par l'action | calculé et disponible pour le tri |
| Fréquence de relance | déduite du libellé | déduite de la matrice, **même barème 1 à 45 jours** |

→ **Les 13 combinaisons, les scores et les fréquences sont reproduits à l'identique.** Seul le **mode de saisie** change (D14).

### 3.3 `STRUCTURE` — ce qui change exactement

| Cas | Excel actuel | Application |
|---|---|---|
| `ACTEUR = GD_TRADING` | département (ex. `COMPTABILITE`) | **employé pilote** (`employeId`) |
| `ACTEUR = PARTENAIRE` | nom du partenaire | **partenaire** (`partenaireId`) |
| `ASSIGNE A` | personne (exécutant) | **employé exécutant**, distinct du pilote |

→ C'est la **règle demandée par le directeur** (D6), et non une interprétation : l'Excel ne l'appliquait pas.

### 3.4 Les dates d'une tâche quotidienne — réserve P4

Le modèle Excel porte **quatre dates** : `DATE ACTION`, `D.DEBUT`, `D.FIN PREVUE`, `D.FIN`. La DÉCISION 18 ajoute une **heure limite** aux tâches quotidiennes ; la DÉCISION 22 en fait des **lignes datées**.

**Aucune décision ne dit** si une tâche quotidienne conserve `D.DEBUT` et `D.FIN PREVUE` **distincts** de `DATE ACTION`, ou si la journée suffit. Le point est **signalé en P4** ; il relève de l'ÉTAPE 5 (cahier des charges) ou de l'ÉTAPE 7 (modèle de données), pas de l'ÉTAPE 4.

### 3.5 `COMMENTAIRE` et motif — deux champs, deux usages

| Champ | Origine | Obligatoire ? | Effet |
|---|---|---|---|
| `COMMENTAIRE` | Excel, colonne Q | Non | **Aucun** effet sur le statut (D3) |
| `motifNonAchevement` | **Nouveau** (RE-09) | **Oui** à la clôture d'une tâche dont l'échéance est dépassée | **Condition de la clôture** (D15) |

> Le champ Excel n'est **ni détourné ni supprimé** : il garde son rôle de commentaire libre. Le motif est **un champ de plus**, ce qui préserve la DÉCISION 3.

---

## 4. Comparaison des 7 motifs de formules

| # | Motif | Comportement Excel | Verdict | Réf. |
|---|---|---|---|---|
| 1 | `STATUT` | 6 états, commentaire prioritaire, puis dates. | **M** | D3 |
| 2 | `PROGRESSION` | Calcul temporel, `"En retard"` et `"-"` en texte, `IFERROR`. | **M** | D4 |
| 3 | `DATE RAPPEL` | Fréquence selon priorité, `WORKDAY.INTL`, week-end 7, fériés externes. | **R** | D5 · D14 |
| 4 | `DUREE G.` | `D.FIN` ou `AUJOURDHUI` − `D.DEBUT`. | **R** *(réserve A8)* | A8 |
| 5 | `DUREE E.` | `D.FIN − D.FIN PREVUE`, cas `Erreur`. | **R** *(réserve A8)* | A8 |
| 6 | `PRIORITE` (concaténation) | `Urgence & " & " & Importance`. | **R** | D14 |
| 7 | `Table25` (`=+I(n-1)`) | Formules pointant sur la ligne précédente, workflow documentaire. | **A** | D2 |

> **Les 494 entrées de formule du classeur se réduisent à ces 7 motifs distincts.** Le motif 7 appartient au workflow `Table25`, **hors périmètre** (D2) : il n'est ni repris ni modélisé. Les motifs 4 et 5 sont conservés dans l'attente de la clarification **A8**.

### 4.1 Détail du calcul de `DATE RAPPEL`

| Élément | Excel | Application |
|---|---|---|
| Base | `D.DEBUT` si `D.DEBUT + fréquence > aujourd'hui`, sinon `DATE ACTION` | **identique** |
| Fréquence | 1 à 45 jours selon les 13 priorités | **identique** (matrice D14) |
| Jours ouvrés | `WORKDAY.INTL(..., 7, ...)` | **identique**, week-end paramétrable (D5) |
| Fériés | `[1]!Table9[FERIE]` — **classeur externe** | **table locale** `jours_feries` (D5) |
| Cas vide / clôturé | `"-"` | **vide** / non calculé |

---

## 5. Comparaison des 19 tables de `BD`

| # | Table | Contenu | Verdict | Réf. |
|---|---|---|---|---|
| 1 | `Table226` | Les **95 actions** | **R** — structure reproduite, **aucune donnée** reprise | D11 |
| 2 | `Tableau3` | 115 articles | **A** — référentiel stock | D8 |
| 3 | `Tableau5` | 10 catégories | **A** — référentiel stock | D8 |
| 4 | `Tableau6` | 18 fournisseurs | **A** — partenaires ≠ fournisseurs | D8 · Q3 |
| 5 | `Tableau9` | 21 marques | **A** — référentiel stock | D8 |
| 6 | `Table1` | 11 départements internes | **R** — référentiel administrable recréé | Q1 · D8 |
| 7 | `Table7` | 19 noms de personnes | **R** — **règle** du rôle seulement, **aucun nom** repris | R1 · D8 |
| 8 | `Table8` | `GD_TRADING` / `PARTENAIRE` | **R** — discriminateur conservé | D6 · D8 |
| 9 | `Table9` | 15 jours fériés 2026 | **R** — table administrable, 15 dates reprises | D5 · D8 |
| 10 | `Table10` | 4 niveaux d'urgence | **R** — référentiel conservé | D14 · D8 |
| 11 | `Table108` | 4 niveaux d'importance | **R** — référentiel conservé | D14 · D8 |
| 12 | `Table1089` | 6 piliers | **R** — référentiel conservé | D8 |
| 13 | `Table108910` | En-têtes, liste vide | **A** — résidu | D8 |
| 14 | `Table14` | En-têtes, liste vide | **A** — résidu | D8 |
| 15 | `Table25` | Workflow documentaire 10 étapes | **A** — hors périmètre | D2 · D8 |
| 16 | `Table430` | 5 structures jamais appliquées | **A** — remplacée par la règle D6 | D6 · D8 |
| 17 | `OFFRE` | 7 offres commerciales | **A** — jamais branchée | D8 |
| 18 | `Table31` | **Matrice priorité** 13 lignes | **R** — règle reproduite | D14 · D8 |
| 19 | `Tableau38` | 16 types d'entretien de véhicules | **A** — parc automobile | D8 |

**Bilan** : **9 tables reproduites** (dont `Table226`) · **10 tables abandonnées**.

### 5.1 Les 8 listes de statuts héritées

| Élément | Contenu | Verdict | Réf. |
|---|---|---|---|
| Listes `BD!B3:F9` | 8 listes métier (« Attente accord », « Attente maquette », « Attente cromalin », « Envoi échantillon », « Réception en attente »…) **reliées à aucune colonne** | **A** — hors périmètre | D2 |

> Ces listes ne sont **pas** des tables Excel, mais elles relèvent du même constat : elles décrivent un **second workflow** jamais raccordé aux actions. Aucune n'est reprise.

---

## 6. Comparaison des règles de présentation et de contrôle

| # | Règle Excel | Comportement actuel | Règle retenue | Verdict | Réf. |
|---|---|---|---|---|---|
| 1 | Couleurs de statut | Retard **rouge**, En cours **bleu**, Achevée **vert**, Suspendue **orange**, Annulée **gris** | Palette **noir / rouge / blanc** uniquement ; états distingués par **libellé + icône** ; rouge réservé à l'alerte | **A** | D23 |
| 2 | Barre de données `PROGRESSION` | Barre **bleue** `#638EC6` | Barre conservée, **rouge**, sur une valeur 0-100 % | **M** | D4 · D23 |
| 3 | Rappel **échu** | `DATE RAPPEL <= AUJOURDHUI` mis en évidence | Signal conservé, en **rouge** | **R** | D5 |
| 4 | Rappel **imminent** | `AUJOURDHUI+1 <= DATE RAPPEL <= AUJOURDHUI+5` | Signal conservé, en **blanc / rouge** selon la charte | **R** | D5 |
| 5 | Doublons d'`ACTION` | Détection active, **0 doublon** sur 95 | Contrôle conservé à la saisie | **R** | — |
| 6 | Volets figés / affichage large | Colonnes B-L figées, conçu pour un écran large | Reproduit comme **exigence d'ergonomie** ; mise en œuvre à l'ÉTAPE 9 | **R** | RE-19 |
| 7 | 43 lignes masquées | Masquage manuel dans le classeur | **A** — artefact Excel, aucune règle métier | Anomalie n°15 |
| 8 | Filtre partiel `J5:Q100` | Filtre incomplet (devrait couvrir `B5:Q100`) | **A** — remplacé par des **filtres complets** *(proposition d'interface, ÉTAPE 9)* | Anomalie n°15 |
| 9 | 7 validations de données | 6 valides ; 1 **erronée** appliquée à `PROGRESSION` | **R** — les 6 valides deviennent des **contraintes de saisie** ; la 7e disparaît avec le type mixte | **R** | D4 |

> **Conséquence de D23** : le code couleur de l'Excel est **abandonné dans son principe** (5 couleurs), pas dans son intention (signaler le retard). Le rouge reste l'**unique** couleur d'alerte ; les autres états sont lisibles par le **texte** et l'**icône**.

---

## 7. Devenir des 16 anomalies constatées

| # | Anomalie (document 01) | Traitement dans l'application |
|---|---|---|
| 1 | `M55` = texte `"06/08/02026"` | **Empêchée** : dates typées et validées à la saisie ; aucune donnée reprise (D11). |
| 2 | `DATE ACTION` antérieure à `D.DEBUT` | **Empêchée** : contrôle croisé des dates à la saisie. |
| 3 | `ELEMENT` vide malgré la liste obligatoire | **Empêchée** : champ obligatoire. |
| 4 | `D.FIN PREVUE` = 2028, `D.FIN` = 2027 | **Sans objet** : aucune donnée reprise ; dates typées. Aucune borne métier n'est fixée par une décision. |
| 5 | « Pas **urgente** » vs « Pas **urgent** » | **Corrigée** : liste normalisée en `Pas urgent`. |
| 6 | Validation de priorité appliquée à `PROGRESSION` | **Disparaît** : `PROGRESSION` devient numérique (D4). |
| 7 | `STRUCTURE` non conforme pour `PARTENAIRE` | **Corrigée** : règle pilote / partenaire appliquée (D6). |
| 8 | 15 fériés 2026 seulement, lus en externe | **Corrigée** : table locale administrable (D5). |
| 9 | `week_end = 7` codé en dur | **Corrigée** : week-end paramétrable (D5). |
| 10 | Aucune validation sur les dates | **Corrigée** : contrôles de saisie (ÉTAPE 7). |
| 11 | 26 plages nommées dupliquées | **Disparaît** : plus de classeur ni de lien externe (D1). |
| 12 | `COMMENTAIRE` déclenche le statut et est vide à 100 % | **Corrigée** : statut manuel explicite (D3). |
| 13 | `Table14` déclarée mais vide | **Hors périmètre** : D8. |
| 14 | 5 lignes vides dans `Action à Prendre` | **Sans objet** : l'action à prendre est **déduite de la priorité calculée** (D14, EF-21) ; aucun libellé de la table n'est repris. |
| 15 | 43 lignes masquées + filtre incomplet | **Disparaît** : aucun masquage ; filtres complets (ÉTAPE 9). |
| 16 | `Table25` : formules `=+I(n-1)` | **Hors périmètre** : D2. |

**Bilan** : **16 anomalies sur 16 traitées** — aucune n'est laissée sans réponse.

---

## 8. Les 20 exigences du directeur face à l'Excel

| # | Exigence (résumé) | Équivalent Excel | Verdict | Réf. |
|---|---|---|---|---|
| **RE-01** | Accès total de l'admin, lecture et écriture | Aucun rôle ; un seul opérateur | **N** | D7 |
| **RE-02** | L'admin ajoute les tâches quotidiennes et « autres » | Un seul saisisseur, sans rôle | **N** *(capacité de saisie existante, rôle nouveau)* | D13 |
| **RE-03** | L'admin crée des tâches pour lui-même et les suit | Possible (titulaire libre), non formalisé | **R** | D20 |
| **RE-04** | L'admin contrôle tous les services et employés | Aucune restriction, mais aucun périmètre de service | **N** | D7 |
| **RE-05** | L'employé voit chaque jour les tâches du jour | Aucune vue par personne | **N** | D18 · D22 |
| **RE-06** | L'employé consulte les autres tâches qui peuvent lui être attribuées | Aucune vue | **N** | D19 |
| **RE-07** | L'employé coche une tâche achevée | `D.FIN` renseignée → `Achevée` | **R** | D3 |
| **RE-08** | L'employé écrit un commentaire | `COMMENTAIRE` libre (0/95 utilisé) | **R** | D3 |
| **RE-09** | Motif obligatoire si la tâche n'est pas achevée au délai | Inexistant | **N** | D15 |
| **RE-10** | L'employé fait évoluer une tâche long terme selon son avancement | Progression **calculée** uniquement | **M** | D4 |
| **RE-11** | L'employé ajoute des tâches supplémentaires | Inexistant (opérateur unique) | **N** | D13 · D24 |
| **RE-12** | L'employé n'accède qu'à son profil, dans son périmètre | Aucune restriction | **N** | D7 · A13 · D16 |
| **RE-13** | Le responsable accède à son profil comme un employé | Aucune notion de responsable | **N** | D7 · D25 |
| **RE-14** | Le responsable accède aux employés de son service et les contrôle | `STRUCTURE` = département, sans vue ni contrôle | **N** | D7 · D17 |
| **RE-15** | Le responsable attribue des tâches aux employés de son service | Aucun rôle | **N** | D13 · D25 |
| **RE-16** | Journée 8h00–16h30, pause 12h00–13h00 | Dates seules, aucune heure | **N** | D18 |
| **RE-17** | Tâche « autre » avec échéance, priorité, importance, urgence, action à prendre | Colonnes existantes, mais priorité choisie dans une liste, sans urgence / importance séparées | **M** | D14 |
| **RE-18** | Les responsables « s'ils existent » | Aucune notion de responsable | **N** *(déjà A12)* | A12 |
| **RE-19** | Interface professionnelle, organisée, facile | Aucune charte | **N** | D23 |
| **RE-20** | Couleurs rouge et noir | Vert / bleu / orange / gris | **N** *(remplace le code couleur)* | D23 |

> **Aucune exigence n'est sans réponse** : 3 sont déjà couvertes par l'Excel, 2 le sont avec une modification décidée, 15 sont entièrement nouvelles.

---

## 9. Ce que l'Excel fait et que le directeur n'a pas mentionné

> Ces éléments **ne sont pas abandonnés** : aucune décision ne les supprime. Conformément à la règle M3, ils sont **reproduits par défaut**. Les signaler ici évite qu'ils disparaissent par simple omission.

| # | Élément Excel | Pourquoi il est conservé | Réf. |
|---|---|---|---|
| 1 | `ELEMENT` / `PILIER` (6 valeurs) | Classement thématique de l'action ; aucune décision ne le supprime. | D8 · `Table1089` |
| 2 | `ACTEUR` = `GD_TRADING` / `PARTENAIRE` | Distingue une action interne d'une action portée par un tiers. | D6 |
| 3 | **Pilote** distinct de l'**exécutant** | Deux rôles différents, conservés. | D6 · Q2 |
| 4 | `DUREE G.` / `DUREE E.` | Mesurent la durée totale et l'écart de clôture. | A8 *(réserve)* |
| 5 | `DATE RAPPEL` et relances | Échéancier de revue en jours ouvrés. | D5 |
| 6 | `FREQUENCE` (1 à 45 jours) | Intervalle de relance déduit de la priorité, **pas** une récurrence de tâche (voir P5). | D14 |
| 7 | Score de priorité (0 à 12) | Calculé par la matrice ; utilisable pour le tri. | D14 |
| 8 | Référentiel des **11 départements** | Structure de l'entreprise, attribut optionnel de l'employé. | Q1 |
| 9 | Jours fériés + week-end **vendredi / samedi** | Calendrier de calcul des délais. | D5 |
| 10 | Détection des **doublons** de libellé | Qualité de données. | — |
| 11 | Affichage large / volets figés | Ergonomie de consultation. | RE-19 |
| 12 | Limite de **55 caractères** du libellé | Contrainte observée, **remplacée** par la borne technique de 255 caractères (**D46**). | **D46** |
| 13 | Barre de progression visuelle | Lecture immédiate de l'avancement, en rouge. | D4 · D23 |

---

## 10. Ce que les exigences ajoutent sans équivalent Excel

| # | Élément nouveau | Origine | Réf. |
|---|---|---|---|
| 1 | **4 rôles** : `ADMIN` · `RESPONSABLE` · `EMPLOYEE` · `CONSULTANT` | RE-01 à RE-15 | D7 · D12 · D21 |
| 2 | **Un compte par employé** | RE-05, RE-11 | D12 |
| 3 | **Périmètre par service** (responsable limité à son service) | RE-14, RE-15 | D7 |
| 4 | **Typologie** `QUOTIDIENNE` / `AUTRE` | RE-02, RE-17 | — |
| 5 | **Échéance à 16h30** pour les tâches quotidiennes | RE-16 | D18 |
| 6 | **Trois sources de création** (admin, responsable, employé) | RE-02, RE-11, RE-15 | D13 |
| 7 | Champ **`creeParId`** | RE-11 | D13 |
| 8 | Champ **`attribueParId`** | RE-15, règle de suppression | D7 · D13 |
| 9 | Champ **`motifNonAchevement`** | RE-09 | D15 |
| 10 | **Consultation** des tâches déjà assignées (pas de file d'attente) | RE-06 | D19 |
| 11 | **Duplication** d'une tâche sur plusieurs jours | RE-02, RE-05 | D22 |
| 12 | **Fiche employé de l'admin** | RE-03 | D20 |
| 13 | **Auto-attribution** du responsable | RE-13 | D25 |
| 14 | **Aucune validation préalable** des tâches créées par un employé | RE-11 | D24 |
| 15 | **Palette noir / rouge / blanc** | RE-20 | D23 |

---

## 11. Points restant à valider après l'ÉTAPE 4

> Aucun de ces points ne bloque la **validation de l'ÉTAPE 4** : ce sont des **précisions** qui seront tranchées à l'ÉTAPE 5, 7 ou 9. Ils sont signalés pour ne pas être découverts plus tard.

| # | Point | Ce qui est établi | Ce qui reste à trancher | Échéance |
|---|---|---|---|---|
| **P1** | **A8 — sigles `DUREE G.` / `DUREE E.`** | Les deux calculs sont reproduits à l'identique. | Que signifient **G** et **E** ? « Globale / écart » n'est qu'une **hypothèse** non validée. | Avant l'ÉTAPE 5 |
| **P2** | **Calendrier 2027-2028** | Les 15 dates 2026 sont reprises (D5) ; la table est administrable. | Les dates 2027 et 2028 doivent être **fournies** par le directeur ou saisies par l'admin. | Avant la mise en service |
| **P3** | **Liste des consultants** | Le rôle `CONSULTANT` est maintenu en lecture seule (D21). | **Qui** doit recevoir ce rôle ? | Avant la création des comptes |
| **P4** | **Dates d'une tâche quotidienne** | Une tâche quotidienne est une **ligne datée** (D22), avec une échéance à **16h30** (D18). | Conserve-t-elle `D.DEBUT` et `D.FIN PREVUE` **distincts** de `DATE ACTION`, ou la journée suffit-elle ? | ÉTAPE 5 / 7 |
| **P5** | **Sémantique de `FREQUENCE`** | La formule montre un **intervalle de relance** de 1 à 45 jours, déduit de la priorité ; ce n'est **pas** une récurrence de tâche (D22). | Le libellé `FREQUENCE` n'est documenté nulle part dans le classeur. **Confirmer cette lecture** et le libellé d'écran. | Validation de l'ÉTAPE 4 |
| **P6** | **Longueur du libellé `ACTION`** | 55 caractères observés dans l'Excel. | ✅ **Tranché le 02/11/2026 (D46)** : 255 caractères pour le libellé, 2 000 pour le commentaire ; la limite Excel de 55 est abandonnée. | **Clos** |

> **Points déjà tranchés, rappelés pour mémoire** : les 11 tensions **C1 à C11** et les points **A14 à A24** sont **tous** traités par les **DÉCISIONS 13 à 25**. Aucune contradiction ouverte ne subsiste entre l'Excel et les exigences.

---

## 12. Ce que l'ÉTAPE 4 ne fait pas

- Elle **ne rédige pas** le cahier des charges fonctionnel → **ÉTAPE 5**.
- Elle **ne conçoit pas** l'architecture → **ÉTAPE 6**.
- Elle **ne définit pas** les tables PostgreSQL ni les champs → **ÉTAPE 7**.
- Elle **ne conçoit ni l'API ni l'interface** → **ÉTAPES 8 et 9**.
- Elle **ne tranche aucun** des points **P1 à P6** : ils sont signalés, pas résolus. *(P4, P6 et la tension P5 ont été tranchés après coup — **D28**, **D46** et **P5** reste ouvert.)*
- Elle **n'écrit aucun code**.

---

## 13. Conclusion et validation demandée

La comparaison est **complète** :

| Contrôle | Résultat |
|---|---|
| Colonnes de `ACTIONS` classées | **16 / 16** |
| Tables de `BD` classées | **19 / 19** |
| Listes de statuts héritées classées | **8 / 8** |
| Motifs de formules classés | **7 / 7** |
| Anomalies traitées | **16 / 16** |
| Exigences reliées à une décision | **20 / 20** |
| Objets Excel sans verdict | **0** |
| Décisions nouvelles prises dans ce document | **0** |

**Validation demandée** : confirmez que :

1. les quatre verdicts (**reproduit / modifié / abandonné / nouveau**) sont correctement appliqués ;
2. les **30 objets reproduits**, **7 modifiés** et **22 abandonnés** le sont pour les bonnes raisons ;
3. les **20 exigences** sont correctement reliées à l'Excel ou à une décision ;
4. les points **P1 à P6** sont les **seuls** points résiduels, et qu'aucun élément du classeur n'a été perdu. *(Depuis, **P4** est clos par **D28** et **P6** par **D46** ; **P1, P2, P3 et P5** restent ouverts et non bloquants.)*

> **Tant que cette validation n'est pas donnée, l'ÉTAPE 5 (cahier des charges fonctionnel) n'est pas engagée** (règle M1).

> ✅ **Validation obtenue le 02/11/2026.** L'ÉTAPE 4 est validée en l'état. L'ÉTAPE 5 a d'abord été **reportée** par la **DÉCISION 26**, puis **reprise par la DÉCISION 27** après validation de l'ÉTAPE 6 ; elle est livrée dans `docs\05_CAHIER_DES_CHARGES_FONCTIONNEL.md`.

---

## 14. Journal des révisions

| Date | Section(s) | Modification | Statut |
|---|---|---|---|
| 02/11/2026 | Document entier | **VALIDATION DU DIRECTEUR** : l'ÉTAPE 4 et ses verdicts (**30 R · 7 M · 22 A**, **20 exigences**) sont validés en l'état. Les points **P1 à P6** restent des précisions non bloquantes. | ✅ **Validé le 02/11/2026** |
| 02/11/2026 | Document entier | Création du livrable 03 (ÉTAPE 4) : comparaison des **16 colonnes**, **19 tables**, **8 listes de statuts**, **7 motifs de formules**, **9 règles de présentation**, **16 anomalies** et **20 exigences** ; verdicts **R / M / A / N** ; 6 points résiduels **P1 à P6**. | ⏳ **En attente de validation** |
