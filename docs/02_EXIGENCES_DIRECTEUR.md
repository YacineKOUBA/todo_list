# Livrable 02 — ÉTAPE 3 : Analyse des exigences du directeur

| | |
|---|---|
| **Projet** | Application web de gestion des TODOLIST — GD Trading |
| **Livrable** | 02 (méthode M8) |
| **Étape** | **3 — Analyse des exigences du directeur** |
| **Source** | Instructions transmises par le directeur le **01/11/2026** (texte intégral en **Annexe A**) |
| **Document de référence** | `docs\01_ANALYSE_FONCTIONNELLE.md` (ÉTAPES 1 et 2 — **validé par le directeur le 01/11/2026**) |
| **Date de rédaction** | 01/11/2026 |
| **Statut** | ✅ **VALIDÉE PAR LE DIRECTEUR le 01/11/2026** — tensions **C1 à C11** et points **A14 à A24** **tranchés le 02/11/2026** (DÉCISIONS **13 à 25**) |

> **Règle appliquée (M2)** : ce document **analyse** les exigences, il ne les tranche pas.
> Chaque point incertain est marqué **À VALIDER**. Chaque contradiction est signalée, jamais résolue d'office.
> **Aucun code n'a été écrit.**

---

## 1. Objet et méthode

L'ÉTAPE 3 consiste à **reformuler fidèlement** les exigences du directeur, à les **confronter au fonctionnement Excel déjà documenté**, puis à isoler :

1. ce qui est **nouveau** (n'existe pas dans le classeur) ;
2. ce qui est **déjà couvert** par l'Excel ou par une décision validée ;
3. ce qui **contredit** une décision antérieure — ces points sont les plus sensibles ;
4. ce qui reste **ambigu** et doit être tranché par le directeur.

**Vocabulaire employé dans tout le document**

| Terme | Sens retenu ici |
|---|---|
| **Tâche quotidienne** | Tâche à réaliser dans la journée de travail (8h00–16h30) |
| **Tâche « autre » / long terme** | Tâche avec échéance, priorité, importance, urgence, action à prendre |
| **Admin** | Le directeur, administrateur principal |
| **Responsable** | Chef de service (`RESPONSABLE`) |
| **Employé** | Agent GD Trading (`EMPLOYEE`) |
| **Propres tâches** | Tâches assignées à la personne, dont elle est pilote, ou qu'elle a créées (A13) |

---

## 2. Exigences reformulées

> Chaque exigence est numérotée **RE-xx** pour être citée sans ambiguïté dans les étapes 4 à 15.
> La colonne « Nature » distingue : **NOUVEAU** (absent de l'Excel), **EXCEL** (comportement déjà présent), **PRÉCISION** (existant à formaliser).

### 2.1 Administration

| # | Exigence reformulée | Nature |
|---|---|---|
| **RE-01** | L'**admin** (le directeur) dispose d'un **accès total** en lecture et en écriture sur l'ensemble de l'application. | NOUVEAU (aucun rôle dans l'Excel) |
| **RE-02** | L'admin **ajoute les tâches quotidiennes et les tâches « autres »** destinées aux employés et aux responsables. | NOUVEAU (l'Excel n'a qu'un seul opérateur, sans rôle) |
| **RE-03** | L'admin peut **créer des tâches pour lui-même** et en suivre l'avancement. | PRÉCISION (`STRUCTURE` / `ASSIGNE A` peuvent désigner n'importe qui) |
| **RE-04** | L'admin a le **contrôle de tous les services et de tous les employés**. | NOUVEAU |

### 2.2 Employé

| # | Exigence reformulée | Nature |
|---|---|---|
| **RE-05** | L'employé se connecte **chaque jour** pour voir **les tâches du jour à achever** que l'admin lui a attribuées. | NOUVEAU (aucun accès dans l'Excel) |
| **RE-06** | L'employé consulte également **les autres tâches** qui peuvent lui être attribuées. | NOUVEAU — **ambigu (A14)** |
| **RE-07** | L'employé peut **cocher une tâche du jour comme achevée**. | EXCEL (équivalent : `D.FIN` renseignée → `Achevée`) |
| **RE-08** | L'employé peut **écrire un commentaire** sur une tâche. | EXCEL (`COMMENTAIRE`) mais **0/95 utilisé** |
| **RE-09** | Si une tâche **n'est pas achevée au délai**, l'employé **doit écrire le motif** (justification). | NOUVEAU — **contredit partiellement D3 (C3)** |
| **RE-10** | L'employé peut **faire évoluer l'état d'une tâche à long terme selon son avancement**, et y laisser des commentaires. | PRÉCISION de **D4** (progression manuelle) |
| **RE-11** | L'employé peut **ajouter des tâches supplémentaires** (quotidiennes ou autres) et **en marquer l'avancement**. | NOUVEAU — **élargit D7 (C1)** |
| **RE-12** | L'employé n'accède **qu'à son propre profil** : ses propres tâches, en **lecture totale**, et en **écriture** dans les cas ci-dessus, dans **son périmètre**. | PRÉCISION de **A13** (C4) |

### 2.3 Responsable

| # | Exigence reformulée | Nature |
|---|---|---|
| **RE-13** | Le responsable accède **à son propre profil** — les tâches attribuées par l'admin (quotidiennes ou autres) — **exactement comme un employé** : lecture et écriture sur ses propres tâches. | PRÉCISION de **D7** |
| **RE-14** | Le responsable accède **au profil des employés de son service uniquement**, voit leur avancement et **les contrôle**. | NOUVEAU — **« contrôler » non défini (C5)** |
| **RE-15** | Le responsable peut **attribuer de nouvelles tâches aux employés de son service uniquement**. | NOUVEAU — **élargit D7 (C1)** |

### 2.4 Organisation du travail

| # | Exigence reformulée | Nature |
|---|---|---|
| **RE-16** | La **journée de travail** va de **8h00 à 16h30**, avec une **pause de 12h00 à 13h00**. | NOUVEAU — **usage à préciser (C6)** |
| **RE-17** | Une tâche « autre » (long terme) est attribuable à **tout employé ou responsable**, avec **échéance, priorité, importance, urgence, action à prendre**, **déterminées par l'admin**. | NOUVEAU — **contredit la matrice de priorité automatique (C2)** |
| **RE-18** | Les **responsables « s'ils existent »** : un service peut donc ne pas en avoir. | ✅ **Déjà validé (A12)** |

### 2.5 Interface

| # | Exigence reformulée | Nature |
|---|---|---|
| **RE-19** | L'interface doit être **professionnelle, très bien organisée et facile à manipuler**. | NOUVEAU (aucune charte dans l'Excel) |
| **RE-20** | Les couleurs exigées sont **ROUGE et NOIR**. | NOUVEAU — **point d'accessibilité (C11)** |

---

## 3. Détail par acteur

### 3.1 Admin

| Voit | Écrit |
|---|---|
| Toutes les tâches, tous les services, tous les employés | Tout : création, modification, affectation, statut, progression, commentaire, référentiels, comptes |
| Les tâches qu'il s'est attribuées | Comme n'importe quel utilisateur sur ses propres tâches |

### 3.2 Employé

| Voit | Écrit |
|---|---|
| **Ses** tâches uniquement (assignées + pilote + créées — A13) | Cocher achevé · commenter · justifier un dépassement · faire avancer une tâche long terme · **créer ses tâches supplémentaires** |
| Les tâches du jour à achever | — |

### 3.3 Responsable

| Voit | Écrit |
|---|---|
| **Ses** tâches (comme un employé) | Sur ses propres tâches : mêmes droits qu'un employé |
| **Les tâches des employés de son service** | **Contrôle** de ces tâches *(portée à définir — C5)* |
| — | **Création et attribution** de tâches aux employés de **son** service |

---

## 4. Les notions réellement nouvelles

### 4.1 Deux natures de tâche

L'Excel ne connaît **qu'un seul type d'action**. Le directeur introduit une **typologie** :

| Type | Caractéristiques données par le directeur | Échéance |
|---|---|---|
| **Quotidienne** | À achever dans la journée (8h00–16h30) | Le jour même |
| **Autre / long terme** | Échéance, priorité, importance, urgence, action à prendre | Date fixée par l'admin |

> ⚠️ L'Excel possède une colonne `FREQUENCE` (1 à 45 jours) qui **pourrait** s'en rapprocher, mais **rien ne le prouve** : elle exprime une périodicité, pas une nature de tâche. **Aucune conclusion n'est tirée** — voir **A18**.

### 4.2 La journée de travail

**8h00 → 12h00** = 4h00 · **13h00 → 16h30** = 3h30 → **7h30 de travail effectif (450 minutes)**.

Le directeur ne précise **pas** à quoi sert cette plage. Trois usages possibles, **incompatibles entre eux** :

| Usage possible | Conséquence |
|---|---|
| Simple **information** affichée | Aucun impact sur le modèle |
| **Échéance des tâches quotidiennes** (à 16h30) | Toute tâche du jour non achevée à 16h30 devient « en retard » |
| **Calcul de charge** (capacité de 7h30/jour) | Chaque tâche doit porter une durée estimée |

→ **A15** (à trancher), **C6**.

### 4.3 La justification obligatoire

Nouvelle règle : **une tâche non achevée au délai doit porter un motif**.

| Point | Constat |
|---|---|
| Dans l'Excel | `COMMENTAIRE` est **libre** et **vide sur 95 lignes** |
| Dans la DÉCISION 3 (validée) | `COMMENTAIRE` = texte libre, **sans effet** sur le statut |
| Exigence du directeur | Le motif devient **obligatoire** en cas de dépassement |

→ Ces deux règles **ne sont pas incompatibles** si le motif est un **champ distinct** ou si le commentaire devient **obligatoire dans ce seul cas**. Les deux lectures sont proposées en **C3** — **aucune n'est retenue d'office**.

### 4.4 L'affectation par le responsable

L'Excel ne connaît **qu'un seul saisisseur**. Le directeur introduit **trois sources de création** :

| Auteur | Peut créer pour | Périmètre |
|---|---|---|
| **Admin** | Lui-même, tout employé, tout responsable | Tous les services |
| **Responsable** | Les employés de **son** service (+ lui-même ?) | Son service |
| **Employé** | **Lui-même** (tâches supplémentaires) | Lui seul |

→ **C1** (cohérence avec RE-02) et **C8** (le responsable peut-il s'attribuer une tâche ?).

### 4.5 L'auto-création par l'employé

| Question | Statut |
|---|---|
| L'employé crée-t-il **pour lui-même** ou peut-il viser un collègue ? | Le texte dit « ajouter des tâches supplémentaires […] et marquer son état d'avancement **sur cette tâche** » → lecture naturelle : **pour lui-même**. **À CONFIRMER (A23)** |
| Sa tâche doit-elle être **validée** par le responsable ou l'admin ? | **Non précisé — A23** |

---

## 5. Comparaison avec le fonctionnement Excel

| Notion | Excel (ÉTAPES 1-2) | Exigence du directeur | Verdict |
|---|---|---|---|
| Nature de tâche | Inexistante | Quotidienne / autre | **NOUVEAU** |
| Horaires de travail | Inexistants (dates seules) | 8h00–16h30, pause 12h–13h | **NOUVEAU** |
| Rôles | Aucun | Admin / Responsable / Employé (+ Consultant, D7) | **NOUVEAU** (déjà D7) |
| Création de tâche | Un seul opérateur | Admin + responsable (son service) + employé (lui-même) | **NOUVEAU** |
| Vue par service | `STRUCTURE` = département, sans restriction de vue | Responsable limité à son service | **NOUVEAU** |
| Priorité | **Calculée** par la matrice Urgence × Importance (13 lignes) | **Déterminée par l'admin** | **CONFLIT — C2** |
| Commentaire | Libre, vide à 100 % | Libre **+ justification obligatoire** au dépassement | **ÉLARGI — C3** |
| Avancement | Calculé sur les dates (types mélangés) | Saisi selon l'avancement réel | ✅ **Cohérent avec D4** |
| Achèvement | `D.FIN` renseignée → `Achevée` | Case « achevée » cochée | ✅ **Cohérent avec D3** |
| Tâche pour soi-même | Possible mais non formalisé | Explicite pour l'admin | **PRÉCISION** |
| Attribution à un service sans responsable | Impossible à garantir | « les responsables **s'ils existent** » | ✅ **Cohérent avec A12** |
| Charte graphique | Aucune | Rouge et noir | **NOUVEAU — C11** |

---

## 6. Contradictions et tensions à trancher

> Aucune n'est résolue ici. Chacune attend une décision explicite du directeur.

| # | Tension | Pourquoi c'est important | Lecture proposée (non retenue) |
|---|---|---|---|
| **C1** | **RE-02** dit que « c'est l'admin qui ajoute les tâches », mais **RE-11** (employé) et **RE-15** (responsable) leur donnent aussi un droit de création. | Détermine qui peut créer quoi, et donc tout le modèle de permissions. | L'admin crée les tâches **officielles** ; le responsable et l'employé créent dans leur **périmètre**, comme indiqué plus loin. |
| **C2** | **RE-17** : priorité, importance, urgence « déterminées par l'admin » — alors que l'Excel **calcule** la priorité à partir de l'urgence et de l'importance (matrice 13 lignes). | Soit la matrice disparaît, soit elle devient une **aide à la saisie**. Change une règle centrale (B.8, point 3). | Conserver la matrice comme **proposition automatique**, que l'admin peut **forcer** manuellement. |
| **C3** | **RE-09** : justification **obligatoire** au dépassement — alors que **D3** fait de `COMMENTAIRE` un texte **libre et sans effet**. | Une obligation de saisie bloque la clôture d'une tâche : c'est une règle métier forte. | Champ **`motifNonAchevement` distinct**, obligatoire **uniquement** si la tâche est clôturée après son échéance. |
| **C4** | **RE-12** : l'employé n'accède qu'à « ses propres tâches » — **A13** les définit comme assignées + pilote + créées. | Si « propres » est plus restrictif, la règle A13 est annulée. | « Propres » = **les trois** (A13) : cohérent, rien à changer. |
| **C5** | **RE-14** : le responsable « contrôle » les employés de son service. Le mot **contrôle** n'est pas défini. | « Voir » ≠ « commenter » ≠ « changer le statut » ≠ « valider ». Le modèle de droits en dépend entièrement. | Lecture minimale : **voir + commenter**. Toute modification du travail d'autrui serait une décision supplémentaire. |
| **C6** | **RE-16** : la plage 8h00–16h30 n'a **aucun usage précisé**. | Change le modèle : simple affichage, échéance quotidienne, ou calcul de charge. | **Affichage seul** tant que l'usage n'est pas tranché. |
| **C7** | **RE-06** : « visiter s'il y a des tâches qui peuvent lui être attribuées ». | Deux modèles opposés : **file d'attente** de tâches non assignées que l'employé peut prendre, ou simple **consultation** de ce que l'admin a déjà assigné. | **Consultation** de ses tâches « autres » déjà assignées — la file d'attente serait un choix lourd et non demandé explicitement. |
| **C8** | **RE-03** : l'admin se crée des tâches. | Un compte admin est-il aussi une **fiche employé** ? Sinon, à qui la tâche est-elle rattachée ? | Le compte admin porte une **fiche employé** interne, pour que la tâche ait un titulaire. |
| **C9** | Le directeur ne mentionne **pas** le rôle `CONSULTANT`, validé en **D7 / D12**. | Faut-il le supprimer ou le conserver ? | **Conserver** : il a été validé, son absence du texte n'est pas une révocation. |
| **C10** | **RE-02/05** parlent de « tâches quotidiennes » sans dire si elles sont **ponctuelles** ou **récurrentes**. | Une tâche quotidienne répétée chaque jour est un **modèle** qui génère des occurrences ; une tâche ponctuelle est une ligne unique. Modèles très différents. | **Ponctuelles** au départ ; la récurrence serait une évolution. |
| **C11** | **RE-20** : rouge et noir. Rouge sur noir pour du texte long est **peu lisible** (contraste insuffisant). | Une charte illisible nuirait à RE-19 (facilité d'usage). | **Noir en fond dominant, rouge en accent** (actions, alertes, en-têtes), texte clair pour la lecture. |

> **✅ Toutes les tensions ont été tranchées le 02/11/2026** :
> C1 → **D13** · C2 → **D14** · C3 → **D15** · C4 → **D16** · C5 → **D17** · C6 → **D18**
> C7 → **D19** · C8 → **D20** · C9 → **D21** · C10 → **D22** · C11 → **D23**.
> Le détail figure en **section 10**.

---

## 7. Conséquences prévisibles sur le modèle (sans décision)

> Liste **indicative**, destinée à préparer l'ÉTAPE 7. Rien n'est arrêté.

| Élément pressenti | Origine | Remarque |
|---|---|---|
| `typeTache` = `QUOTIDIENNE` \| `AUTRE` | RE-02, RE-05, RE-17 | Nouveau champ obligatoire |
| `echeance` (date) | RE-17 | Existe déjà sous `D.FIN PREVUE` |
| `echeanceHeure` *(si C6 tranché)* | RE-16 | À ne créer que si l'horaire a un usage |
| `motifNonAchevement` | RE-09 | Champ **distinct** du commentaire *(si C3 retenu)* |
| `attribueParId` | RE-15 / D7 | Déjà identifié : nécessaire à la règle de suppression du responsable |
| `creeParId` | RE-11 | Distingue une tâche officielle d'une tâche ajoutée par l'employé |
| `serviceId` sur l'employé | RE-14 / D7 | Un seul responsable par service (A12) |
| `progressionManuelle` | RE-10 / D4 | Déjà validé (D4) |
| `derogationStatut` | D3 | Déjà validé (D3) |
| Vue « **Mes tâches du jour** » | RE-05 | Écran principal de l'employé |
| Vue « **Mon service** » | RE-14 | Écran du responsable |
| Vue « **Tous les services** » | RE-04 | Écran de l'admin |
| **Journal des modifications** | RE-04 + « contrôle » | Permet à l'admin de savoir qui a changé quoi |

**Garanties d'isolation à respecter** (déduites de RE-12 et RE-14) :

- un employé **ne voit jamais** les tâches d'un autre employé ;
- un responsable **ne voit que** son service (hors ses propres tâches) ;
- seul l'admin voit l'ensemble.

---

## 8. Points À VALIDER

| # | Question | Pourquoi elle est bloquante |
|---|---|---|
| **A14** | « Autres tâches qui peuvent lui être attribuées » = **file d'attente** à prendre, ou **consultation** de ses tâches déjà assignées ? | Deux modèles de données différents (C7) |
| **A15** | La plage **8h00–16h30** sert-elle à **afficher**, à **fixer l'échéance du jour**, ou à **calculer une charge** ? | Détermine si les tâches portent une durée / une heure |
| **A16** | « **Contrôler** » les employés de son service = voir ? commenter ? changer le statut ? valider ? | Cœur de la matrice des droits (C5) |
| **A17** | La **justification** est-elle un **champ distinct** ou le commentaire rendu obligatoire ? Bloque-t-elle la clôture ? | Change la règle D3 et le formulaire (C3) |
| **A18** | Les tâches **quotidiennes** sont-elles **ponctuelles** (une ligne par jour) ou **récurrentes** (modèle + occurrences) ? | Modèle de données radicalement différent (C10) |
| **A19** | L'**admin** doit-il avoir une **fiche employé** pour porter ses propres tâches ? | Sinon, une tâche ne peut pas lui être rattachée (C8) |
| **A20** | Le rôle **`CONSULTANT`** (D7/D12) est-il **maintenu** ? | Un rôle validé mais absent du texte du directeur (C9) |
| **A21** | La **priorité** reste-t-elle **calculée** (matrice Excel) ou devient-elle **choisie** par l'admin ? | Règle centrale de l'Excel (C2) |
| **A22** | Les tâches ajoutées par un **employé** doivent-elles être **validées** par son responsable ou l'admin ? | Détermine s'il existe un circuit d'approbation (C1) |
| **A23** | Un **responsable** peut-il **s'attribuer** une tâche à lui-même ? | Complète le périmètre de RE-15 |
| **A24** | **Rouge et noir** : fond noir + accents rouges (lisible), ou rouge dominant (risque de lisibilité) ? | Charte graphique de l'ÉTAPE 9 (C11) |

> **✅ Tous ces points ont été tranchés le 02/11/2026** :
> A14 → **D19** · A15 → **D18** · A16 → **D17** · A17 → **D15** · A18 → **D22** · A19 → **D20**
> A20 → **D21** · A21 → **D14** · A22 → **D24** · A23 → **D25** · A24 → **D23**.

**Points déjà couverts par une décision validée — aucune question posée**

| Sujet | Référence |
|---|---|
| Un service peut ne pas avoir de responsable | A12 (01/11/2026) |
| Un seul responsable par service | A12 (01/11/2026) |
| « Ses tâches » = assignées + pilote + créées | A13 (01/11/2026) |
| Progression manuelle avec repli temporel | D4 |
| Statut explicite + calcul automatique | D3 |
| Un compte par employé | D12 |
| Suppression : admin partout, responsable sur ses propres attributions | D7 |

---

## 9. Ce que l'ÉTAPE 3 ne fait pas

- Elle **ne compare pas** ligne à ligne l'Excel et les exigences → **ÉTAPE 4**.
- Elle **ne rédige pas** le cahier des charges → **ÉTAPE 5**.
- Elle **ne conçoit pas** l'architecture, le modèle de données, l'API ni l'interface → **ÉTAPES 6 à 9**.
- Elle **ne tranche aucune** des tensions C1 à C11 : elles attendent le directeur.

---

## 10. DÉCISIONS ISSUES DE L'ÉTAPE 3

> Les **11 tensions** (C1 à C11) et les **2 points restants** (A22, A23) deviennent des décisions numérotées à la suite des DÉCISIONS 1 à 12.
> **Elles sont traitées une par une** et ne sont inscrites comme validées qu'après accord explicite du directeur.

| # | Tension / point | Sujet | Statut |
|---|---|---|---|
| **DÉCISION 13** | C1 | Qui crée les tâches : admin seul, ou admin + responsable + employé ? | ✅ **Validée le 01/11/2026 — option A** |
| **DÉCISION 14** | C2 | Priorité : calculée par la matrice Excel, ou choisie par l'admin ? | ✅ **Validée le 01/11/2026 — option A** |
| **DÉCISION 15** | C3 | Justification obligatoire au dépassement : champ distinct, ou commentaire obligatoire ? | ✅ **Validée le 01/11/2026 — option A** |
| **DÉCISION 16** | C4 | « Ses propres tâches » = A13 (assignées + pilote + créées) ? | ✅ **Validée le 01/11/2026 — option A** |
| **DÉCISION 17** | C5 | Portée du « contrôle » d'un responsable sur son service | ✅ **Validée le 01/11/2026 — option A (D7 inchangée)** |
| **DÉCISION 18** | C6 | Usage de la plage 8h00–16h30 | ✅ **Validée le 01/11/2026 — option B (échéance à 16h30)** |
| **DÉCISION 19** | C7 | « Autres tâches » : file d'attente ou consultation | ✅ **Validée le 01/11/2026 — option A (consultation)** |
| **DÉCISION 20** | C8 | L'admin porte-t-il une fiche employé pour ses propres tâches ? | ✅ **Validée le 01/11/2026 — option A** |
| **DÉCISION 21** | C9 | Maintien du rôle `CONSULTANT` | ✅ **Validée le 02/11/2026 — option A** |
| **DÉCISION 22** | C10 | Tâches quotidiennes : ponctuelles ou récurrentes | ✅ **Validée le 02/11/2026 — option C (ponctuelles + duplication)** |
| **DÉCISION 23** | C11 | Charte rouge et noir : fond noir + accents, ou rouge dominant | ✅ **Validée le 02/11/2026 — noir dominant, accents rouges, palette limitée à noir / rouge / blanc** |
| **DÉCISION 24** | A22 | Les tâches créées par un employé doivent-elles être validées ? | ✅ **Validée le 02/11/2026 — option A (aucune validation)** |
| **DÉCISION 25** | A23 | Un responsable peut-il s'attribuer une tâche à lui-même ? | ✅ **Validée le 02/11/2026 — option A (oui)** |

### DÉCISION 13 — Qui crée les tâches (C1) — ✅ **VALIDÉE le 01/11/2026 (option A)**

- **Problème** : RE-02 attribue la création à l'admin seul, tandis que RE-11 (employé) et RE-15 (responsable) autorisent aussi la création. Les trois passages ne peuvent pas être lus à la lettre simultanément.
- **Décision retenue — option (A)** : **trois sources de création**, chacune dans son périmètre.

| Auteur | Peut créer pour | Périmètre |
|---|---|---|
| `ADMIN` | Lui-même, tout employé, tout responsable | Tous les services |
| `RESPONSABLE` | Les employés de **son** service *(et lui-même — DÉCISION 25)* | Son service |
| `EMPLOYEE` | **Lui-même uniquement** | Son propre profil |

- **Conséquences validées** :
  - `creeParId` et `attribueParId` deviennent nécessaires ;
  - deux catégories de tâches coexistent : **officielles** (créées par l'admin) et **ajoutées** (par un responsable ou un employé) ; leur éventuelle distinction visuelle relève de la **DÉCISION 24** ;
  - le responsable voit les tâches ajoutées par les employés de son service.
- **Options écartées** : (B) admin seul — annulait RE-11 et RE-15 ; (C) admin + responsable — annulait RE-11.
- **Référence** : section 6, tension **C1** ; section 4.4.

### DÉCISION 14 — Détermination de la priorité (C2) — ✅ **VALIDÉE le 01/11/2026 (option A)**

- **Problème** : le directeur écrit que « priorité, importance, urgence, action à prendre » sont **déterminées par l'admin**, alors que l'Excel **calcule** la priorité à partir de l'urgence et de l'importance (`BD!Table31`, 13 lignes), et que cette même matrice fournit la **fréquence de relance** (1 à 45 jours) utilisée par `DATE RAPPEL`.
- **Décision retenue — option (A)** : l'admin **choisit l'urgence et l'importance** ; la **priorité**, le **score** et la **fréquence de relance** sont **calculés** par la matrice, à l'identique de l'Excel.

| Élément | Qui le détermine | Mode |
|---|---|---|
| `URGENCE` | Admin (saisie) | Liste : Immédiate · Courte échéance · Planifiable · Pas urgent |
| `IMPORTANCE` | Admin (saisie) | Liste : Critique · Élevée · Modérée · Faible |
| `PRIORITE` | **Matrice** | Calculée : `Urgence & " & " & Importance` |
| Score et fréquence de relance | **Matrice** | Calculés (1 à 45 jours) |
| `ACTION A PRENDRE` | Admin (saisie) | Faire immédiatement · Planifier · Déléguer si possible *(5 lignes vides dans la table source)* |

- **Conséquences validées** : aucune incohérence possible entre priorité, urgence et importance ; `DATE RAPPEL` conserve sa source ; les 13 niveaux restent disponibles, y compris les 3 jamais utilisés dans l'Excel.
- **Options écartées** : (B) priorité saisie directement — divergence possible avec urgence/importance ; (C) tout saisir librement — perte de la règle Excel et risque d'incohérence.
- **Référence** : **B.3.3** et **B.3.4** du document 01 ; section 6, tension **C2**.

### DÉCISION 15 — Justification du dépassement (C3) — ✅ **VALIDÉE le 01/11/2026 (option A)**

- **Problème** : RE-09 rend la justification **obligatoire** en cas de dépassement, alors que la **DÉCISION 3** fait de `COMMENTAIRE` un **texte libre sans effet**. Une obligation a besoin d'un **moment déclencheur**, sinon elle est inapplicable.
- **Décision retenue — option (A)** : **champ distinct** `motifNonAchevement`, **obligatoire pour clôturer** une tâche dont l'**échéance est dépassée**. Le `COMMENTAIRE` reste **libre, facultatif et sans effet** (DÉCISION 3 inchangée).

| Champ | Obligatoire ? | Quand | Effet |
|---|---|---|---|
| `COMMENTAIRE` | Non | À tout moment | Aucun effet sur le statut |
| `motifNonAchevement` | **Oui** | **Clôture d'une tâche dont l'échéance est passée** | **Condition de la clôture** |

- **Conséquences validées** : la DÉCISION 3 est préservée ; le retard est **tracé et expliqué** ; le responsable et l'admin voient le motif dans le cadre de leur contrôle ; la clôture tardive devient **impossible sans justification**.
- **Options écartées** : (B) rendre `COMMENTAIRE` obligatoire — aurait modifié la DÉCISION 3 et mélangé deux usages ; (C) blocage dès le dépassement — contrainte d'usage excessive.
- **Précisions techniques pour l'ÉTAPE 7** : taille minimale du motif ; historique des justifications successives sur une même tâche ; affichage du motif dans la vue du responsable.
- **Référence** : section 4.3 ; section 6, tension **C3**.

### DÉCISION 16 — Définition de « ses propres tâches » (C4) — ✅ **VALIDÉE le 01/11/2026 (option A)**

- **Problème** : RE-12 dit que l'employé n'accède qu'à « ses propres tâches », sans les définir. **A13** (01/11/2026) les définit comme **assignées + pilote + créées**.
- **Décision retenue — option (A)** : **A13 est confirmée et s'applique**. « Ses propres tâches » = tâches **assignées** à la personne **+** celles dont elle est **pilote** **+** celles qu'elle a **créées**.
- **Conséquences validées** :
  - cohérence totale avec **A13** et avec la matrice de la **DÉCISION 7** ;
  - le rôle de **pilote** reste utile : `STRUCTURE` (pilote) et `ASSIGNE A` (exécutant) peuvent être **deux personnes distinctes**, comme dans l'Excel ;
  - **remarque** : depuis la **DÉCISION 13**, un employé ne crée que pour lui-même, donc « créées par lui » est **inclus** dans « assignées à lui » ; le critère reste inscrit pour ne pas figer le modèle si les droits évoluent.
- **Options écartées** : (B) assignées seules et (C) assignées + créées — toutes deux privaient l'employé de la vue des tâches **pilotées** et exécutées par un collègue.
- **Référence** : section 6, tension **C4** ; **A13** du document 01.

### DÉCISION 17 — Portée du « contrôle » du responsable (C5) — ✅ **VALIDÉE le 01/11/2026 (option A)**

- **Problème** : RE-14 dit que le responsable « voit leur avancement et **les contrôle** », sans définir « contrôler ». La **DÉCISION 7** lui accorde déjà la **modification** dans son service.
- **Décision retenue — option (A)** : « contrôler » = **voir + commenter + modifier** le statut et la progression des tâches de son service, **conformément à la DÉCISION 7, inchangée**.
- **Conséquences validées** : **aucune règle nouvelle** ; le responsable peut corriger ou faire avancer une tâche de son service sans circuit d'approbation ; il **ne peut pas** supprimer une tâche qu'il n'a pas attribuée (D7).
- **Options écartées** : (B) circuit de validation employé → responsable — **workflow complet absent de l'Excel et non décrit par le directeur** ; (C) lecture + commentaire seuls — aurait **restreint** D7 sans demande.
- **Précision** : le « contrôle » ne s'étend **jamais** aux autres services.
- **Référence** : section 6, tension **C5** ; **DÉCISION 7** du document 01.

### DÉCISION 18 — Usage de la plage 8h00–16h30 (C6) — ✅ **VALIDÉE le 01/11/2026 (option B)**

- **Problème** : RE-16 fixe une plage horaire précise (8h00–16h30, pause 12h–13h) **sans en préciser l'usage**. L'Excel ne contient **aucune notion d'heure**.
- **Décision retenue — option (B)** : **échéance des tâches quotidiennes à 16h30**.
  - une tâche **quotidienne** non achevée à **16h30** passe **automatiquement** en **`Retard`** ;
  - sa **clôture tardive** exige le `motifNonAchevement` (DÉCISION 15) ;
  - la pause **12h00–13h00** ne crée aucune tâche et ne modifie aucun calcul : elle est **affichée** comme information.
- **Conséquences validées** : les tâches quotidiennes portent une **échéance horaire** (le jour même à 16h30) ; le calcul de statut combine **date + heure** pour ce type de tâche ; les tâches « autres » conservent une échéance **à la date**, sans heure.
- **Options écartées** : (A) affichage seul — la plage horaire n'aurait **aucun effet** ; (C) calcul de charge — exige une **durée estimée** par tâche, que ni l'Excel ni le directeur ne prévoient.
- **Précisions techniques pour l'ÉTAPE 7** : fuseau horaire de référence ; comportement si 16h30 tombe un jour non ouvré (férié / week-end — DÉCISION 5) ; tâche quotidienne créée après 16h30.
- **Référence** : section 4.2 ; section 6, tension **C6** ; **Annexe B**.

### DÉCISION 19 — « Autres tâches qui peuvent lui être attribuées » (C7) — ✅ **VALIDÉE le 01/11/2026 (option A)**

- **Problème** : RE-06 peut désigner soit une **consultation** des tâches déjà assignées, soit une **file d'attente** de tâches libres que l'employé prendrait lui-même.
- **Décision retenue — option (A)** : **consultation des tâches déjà assignées**. L'employé voit les tâches « autres » que l'**admin** ou son **responsable** lui ont **nominativement attribuées**.
- **Conséquences validées** : aucun module de prise de tâche ; aucun verrou de concurrence ; l'affectation reste **nominative**, conformément à RE-02, RE-15 et à la **DÉCISION 13** ; un employé **ne peut pas** s'attribuer une tâche qu'il n'a pas créée.
- **Options écartées** : (B) file d'attente libre — imposait un verrou de prise, une gestion de conflits et une remise à disposition, **non décrits par le directeur** ; (C) file avec validation — ajoutait un circuit de demande non demandé.
- **Référence** : section 6, tension **C7** ; **DÉCISION 13**.

### DÉCISION 20 — Fiche employé de l'admin (C8) — ✅ **VALIDÉE le 01/11/2026 (option A)**

- **Problème** : RE-03 permet à l'admin de créer des tâches **pour lui-même**, mais une tâche est portée par une **personne** (`STRUCTURE` / `ASSIGNE A` → employé ou partenaire, DÉCISION 6). Un **compte** n'est pas une personne.
- **Décision retenue — option (A)** : **le directeur possède une fiche employé** et un **compte de rôle `ADMIN`**. Il peut **piloter** et **exécuter** ses propres tâches comme tout employé.
- **Conséquences validées** :
  - modèle **uniforme** : tout titulaire de tâche est un **employé** (ou un partenaire, selon DÉCISION 6) ;
  - aucune exception de type « compte sans fiche » ;
  - le directeur apparaît dans la liste des employés ; **sans département**, il n'apparaît pas dans la vue d'un responsable de service ;
  - cohérent avec **DÉCISION 12** (un compte par employé) et **DÉCISION 7** (rôle porté par le compte).
- **Options écartées** : (B) tâches rattachées au compte — deux natures de titulaires, source d'incohérences ; (C) pas de tâche pour l'admin — contraire à RE-03.
- **Référence** : section 6, tension **C8** ; **DÉCISION 6**, **DÉCISION 7**, **DÉCISION 12**.

### DÉCISION 21 — Maintien du rôle `CONSULTANT` (C9) — ✅ **VALIDÉE le 02/11/2026 (option A)**

- **Problème** : les instructions du directeur ne citent que **3 rôles** (admin, employé, responsable), alors que la **DÉCISION 7** en a validé **4** le même jour. L'absence du `CONSULTANT` n'est pas une révocation, mais elle devait être confirmée.
- **Décision retenue — option (A)** : le rôle **`CONSULTANT` est maintenu**, en **lecture seule**.
- **Conséquences validées** : aucune modification du modèle de la **DÉCISION 7** ; le rôle reste **inutilisé tant que personne ne l'attribue** ; il peut servir à la direction, à un audit ou à un remplaçant.
- **Options écartées** : (B) suppression — aurait conduit à donner des comptes `EMPLOYEE` (donc un **droit d'écriture**) à des personnes devant seulement lire ; (C) maintien sans effet — deux noms pour un même droit.
- **Point ouvert inchangé** : la **liste définitive des consultants** reste à fournir *(document 01, pièces à transmettre)*.
- **Référence** : section 6, tension **C9** ; **DÉCISION 7** et **DÉCISION 12**.

### DÉCISION 22 — Tâches quotidiennes : ponctuelles ou récurrentes (C10) — ✅ **VALIDÉE le 02/11/2026 (option C)**

- **Problème** : le directeur parle de « tâches quotidiennes » sans dire si elles sont **ponctuelles** (une ligne par jour) ou **récurrentes** (modèle générant des occurrences). Les deux modèles sont incompatibles.
- **Décision retenue — option (C)** : **ponctuelles + duplication**.
  - chaque tâche quotidienne reste **une ligne indépendante**, rattachée à **une date** ;
  - l'admin peut **dupliquer** une tâche sur **plusieurs jours** pour alléger la saisie ;
  - **aucune génération automatique** : l'application ne crée jamais de tâche sans action humaine.
- **Conséquences validées** :
  - les copies issues d'une duplication sont **indépendantes** (statut, progression et commentaires propres) ;
  - la duplication relève de la **création** et respecte donc les périmètres de la **DÉCISION 13** (admin partout ; responsable dans son service ; employé pour lui-même) ;
  - aucune règle de report ou de rattrapage d'occurrence manquée n'est nécessaire.
- **Options écartées** : (A) ponctuelles sans duplication — saisie quotidienne lourde ; (B) récurrence automatique — imposait des règles non demandées (fériés, occurrences manquées, mise à jour du modèle).
- **Précisions techniques pour l'ÉTAPE 7** : choix des jours de duplication ; comportement si la plage comprend un jour non ouvré (DÉCISION 5) ; copie ou non des commentaires et du motif de non-achèvement.
- **Référence** : section 4.1 ; section 6, tension **C10**.

### DÉCISION 23 — Charte graphique « rouge et noir » (C11) — ✅ **VALIDÉE le 02/11/2026**

- **Problème** : le directeur exige « ROUGE et NOIR » sans préciser la répartition, alors qu'un texte rouge sur fond noir est fatigant et qu'un rouge dominant est agressif.
- **Décision retenue** : **noir dominant**, **accents rouges**, avec une **palette strictement limitée à trois couleurs**.

| Élément | Couleur |
|---|---|
| Fond principal / barre latérale | **Noir** (ou blanc pour les zones de lecture) |
| Texte | **Blanc** (sur noir) ou **noir** (sur blanc) |
| Titres, boutons principaux, alertes, statuts en retard, barre de progression | **Rouge** |
| **Toute autre couleur** | ❌ **Interdite** |

- **Décision complémentaire du directeur (02/11/2026)** : « le texte et le fond peuvent être en blanc, mais **pas de couleur en plus** que le noir, le rouge et le blanc ».
- **Conséquences validées** :
  - la palette ne comporte **que trois couleurs** : `noir`, `rouge`, `blanc` ;
  - **aucun vert, jaune, orange ni bleu** — y compris pour les statuts, les graphiques et les KPI ;
  - les statuts doivent donc être distingués par le **libellé**, une **icône** et le **rouge réservé au retard / à l'alerte** ;
  - la teinte exacte du rouge et les variantes (survol, désactivé) seront fixées à l'**ÉTAPE 9**.
- **Options écartées** : (B) texte rouge sur fond noir — fatigue visuelle ; (C) rouge dominant — agressif sur de grandes surfaces.
- **Point d'attention pour l'ÉTAPE 9** : sans couleur supplémentaire, la lisibilité des états « achevé » et « en cours » reposera sur le **texte et les icônes** ; chaque écran sera contrôlé en contraste.
- **Référence** : section 6, tension **C11** ; **RE-19**, **RE-20**.

### DÉCISION 24 — Validation des tâches créées par un employé (A22) — ✅ **VALIDÉE le 02/11/2026 (option A)**

- **Problème** : RE-11 autorise l'employé à créer des tâches supplémentaires, **sans préciser** si elles doivent être approuvées avant d'être actives.
- **Décision retenue — option (A)** : **aucune validation préalable**. La tâche créée est **active immédiatement**.
- **Conséquences validées** :
  - l'employé n'est **pas bloqué** ;
  - le **contrôle existe néanmoins** : le responsable de son service voit la tâche et peut la **commenter ou la modifier** (**DÉCISION 17**) ;
  - aucune règle d'approbation n'est ajoutée au modèle.
- **Options écartées** : (B) validation par le responsable — circuit d'approbation **non demandé** ; (C) validation par l'admin — ferait de l'admin un **goulot d'étranglement** pour chaque tâche personnelle.
- **Référence** : section 4.5 ; **DÉCISION 13** et **DÉCISION 17**.

### DÉCISION 25 — Auto-attribution d'une tâche par le responsable (A23) — ✅ **VALIDÉE le 02/11/2026 (option A)**

- **Problème** : RE-13 présente les tâches du responsable comme **attribuées par l'admin**, alors que RE-11 permet à tout **employé** de créer ses propres tâches — et un responsable est lui-même un employé de son service.
- **Décision retenue — option (A)** : le responsable **peut s'attribuer une tâche à lui-même**, comme tout employé.
- **Conséquences validées** :
  - aucune incohérence hiérarchique : le responsable a **au moins** les droits d'un employé sur son propre profil ;
  - cette auto-attribution reste **limitée à lui-même** ;
  - il ne peut **jamais** attribuer une tâche à un employé d'un **autre** service (DÉCISION 7).
- **Options écartées** : (B) uniquement l'admin — aurait donné au responsable **moins de droits qu'un employé** sur ses propres tâches ; (C) seulement les tâches long terme — distinction que **rien** dans le texte ne justifie.
- **Référence** : **RE-11**, **RE-13** ; **DÉCISION 13** et **DÉCISION 7**.

---

## 11. Journal des révisions

| Date | Section(s) | Modification | Statut |
|---|---|---|---|
| 01/11/2026 | Document entier | Création du livrable 02 : reformulation des 20 exigences du directeur (RE-01 à RE-20), comparaison avec l'Excel, 11 tensions (C1 à C11), 11 points à valider (A14 à A24). | ✅ **Validée par le directeur le 01/11/2026** |
| 02/11/2026 | Section 10 | **DÉCISIONS 13 à 25** tranchées une par une : création à 3 sources, priorité calculée, justification à la clôture tardive, A13 confirmée, contrôle = D7, échéance du jour à 16h30, consultation (pas de file d'attente), fiche employé de l'admin, `CONSULTANT` maintenu, quotidiennes ponctuelles + duplication, palette noir/rouge/blanc, aucune validation préalable, auto-attribution du responsable. | ✅ **Validées le 02/11/2026** |

---

## Annexe A — Texte intégral des instructions du directeur (01/11/2026)

> Reproduction fidèle, sans correction de forme.

```text
l'application doit fonctionner de la maniere suivante (instructions du directeur):

-l'admin (le directeur) doit avoir un acces totale a l'application en lecture et en
 ecriture ou modification et c'est lui qui qjoute les taches cotidiennes et autres
 pour les employees et les responsables si ils existent.

-les employes doivent acceder cotidiennement pour voir les taches du jour a achever
 (de 8h j'usqu'a 16h30 avec une pause de 12h a 13h) que l'admin les ont attribuees,
 et aussi pour visiter si il y'a des taches (autres taches) qui peuvent lui etre
 attribuer aussi par l'admin

-une tache du type autre taches ( ou tache a long terme) peuvent etre attribuer par
 l'admin pour n'importe quel employees ou un responsable avec (une duree (echeance),
 prioritee, importance, urgence, action a prendre..., qui sont determinees par l'admin.

-un employee peut avoir des droits en ecriture comme (cocher les taches du jour
 achevees, ecrire un commentaire sur une tache, si une tache n'est achevee au delai
 il faut ecrire le motif (justification), modifier l'etat des tache a long terme selon
 sont avancement avec possibiliter de laisser des commentaires aussi)

-un employee peut aussi ajouter des taches suplementaires (que se soit cotidienne ou
 autre) et marquer sont etat d'avencement sur cette tache

-un employee a acces seulement a son profil ( ses propres taches )en lecture totale et
 en ecriture dans les cas deja citees (acces dans sont perimetres)

-un responsable a acces a son propre profil (les taches qui lui en ete attribuer par
 l'admin (cotidienne ou autre)exactement comme le cas des employees pour la lecture et
 l'ecriture dans ses propres taches) et aussi il a acces au profil des employees de son
 service seulement et voir leurs avancement et les controler comme il peut aussi
 attribuer de nouvelles taches aux employees de son service seulement.

-l'admin a l'acces totale et le controls de tout les services et tout les employees.et
 aussi il peut creer des taches pour lui meme et les suivres

-l'interface (API) doit etre professionnel , tres bien organiser et facile a manipuler ,
 les couleurs exiger sont ROUGE et NOIR
```

## Annexe B — Calcul de la journée de travail

| Plage | Durée |
|---|---|
| 08h00 → 12h00 | 4h00 |
| 12h00 → 13h00 | *pause* |
| 13h00 → 16h30 | 3h30 |
| **Travail effectif** | **7h30 = 450 minutes** |

> Ce calcul est une **constatation arithmétique**, pas une décision. Son usage est en **A15**.
