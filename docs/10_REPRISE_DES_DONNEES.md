# Livrable 10 — ÉTAPE 11 : Reprise des données Excel

| | |
|---|---|
| **Projet** | Application web de gestion des TODOLIST — GD Trading |
| **Livrable** | 10 (méthode M8) |
| **Étape** | **11 — Reprise des données Excel** |
| **Documents de référence** | `docs\01_ANALYSE_FONCTIONNELLE.md` · `docs\03_COMPARAISON_EXCEL_EXIGENCES.md` · `docs\05_CAHIER_DES_CHARGES_FONCTIONNEL.md` · `docs\06_MODELE_DE_DONNEES.md` (ÉTAPE 7) · `docs\07_API.md` (ÉTAPE 8) · `docs\09_ROLES_ET_PERMISSIONS.md` (ÉTAPE 10) |
| **Décisions de référence** | **DÉCISIONS 1 à 75** |
| **Périmètre de l'étape** | Inventaire de la reprise, **contenu exact du seed**, comptes initiaux, ordre d'insertion, contrôles et critères d'acceptation. **Aucun fichier de code.** |
| **Date de rédaction** | 02/11/2026 |
| **Statut** | ✅ **VALIDÉE le 02/11/2026** — spécification arrêtée, **aucun code écrit**, aucun script, aucune migration, aucune base |

> **Règle M2** : ce document **formalise** les décisions déjà validées — principalement **D5, D6, D8, D11, D12, D14, D18, D30, D31, D40 et D42**. Il **ne crée aucune règle métier nouvelle**.
> **Règle M5** : les points à trancher sont isolés en **section 11** (`A11-01` et `A11-02`, tranchés le 02/11/2026). Les propositions techniques sont marquées 🔧 ; les zones non tranchées sont marquées ⚠️.
> **Aucun code n'a été écrit. Aucun script d'import, aucune migration, aucune base de données n'ont été créés.**

---

## 1. Objet et périmètre

### 1.1 Objet

Décrire **exactement** ce qui est repris du classeur Excel, ce qui ne l'est pas, **où** et **comment** les données de référence sont initialisées, et **quels contrôles** prouvent que la reprise est conforme.

Le document répond à six questions :

1. **Quelles données** du classeur sont reprises — et lesquelles ne le sont pas ?
2. **Quel contenu exact** est inséré au démarrage (libellés, scores, fréquences, dates, ordre) ?
3. **Quels comptes** existent à la mise en service, et comment sont-ils créés ?
4. **Dans quel ordre** les insertions ont lieu, et comment le seed reste **idempotent** ?
5. **Quelles preuves** montrent qu'aucune donnée métier ou nominative n'a été importée ?
6. **Comment revenir en arrière** en cas d'échec, sans perte ni ambiguïté ?

### 1.2 Ce que cette étape fait — et ne fait pas

**Elle fait** :

- l'**inventaire** source Excel → table PostgreSQL ;
- le **contenu exact** des **55 lignes de référence** à insérer ;
- la liste des tables qui restent **vides** et la justification de chaque vide ;
- les règles d'**ordre**, d'**idempotence** et d'**intégrité** du seed ;
- les **critères d'acceptation** de la reprise ;
- la **procédure de sauvegarde / restauration** préalable.

**Elle ne fait pas** :

- elle **ne crée aucun fichier de code**, aucun script de seed, aucun script d'import ;
- elle **ne crée aucune migration**, aucun `schema.prisma`, aucune base ;
- elle **n'importe aucune des 95 actions** (D11) ;
- elle **n'importe aucune donnée nominative** (D6, D11, D12) ;
- elle **ne définit pas** la politique de mots de passe ni de session → **ÉTAPE 13** ;
- elle **ne définit pas** les tests automatisés → **ÉTAPE 12** (elle fixe les contrôles à couvrir) ;
- elle **ne définit pas** la procédure de déploiement → **ÉTAPE 14** ;
- elle **ne tranche aucun point ouvert** : `A11-01` et `A11-02` sont désormais tranchés (D70, D71), **P2**, **P11** et **P12** restent ouverts (section 11.5).

### 1.3 Statut de chaque énoncé

| Marque | Signification |
|---|---|
| ✅ **DÉCIDÉ** | Découle d'une décision validée (**D1 → D75**), d'une exigence (EF-xx), d'une règle (RM-xx) ou du modèle de données validé. **Applicable tel quel.** |
| 🔧 **PROPOSÉ** | Choix de mise en œuvre technique qui **ne crée aucune règle métier**. Appliqué sauf objection ; **A11-03** et **A11-04** sont acceptés. |
| ⚠️ **ZONE GRISE** | Aucune règle validée ne tranche. **Signalé, non appliqué** (section 11.5). |
| ❓ **À VALIDER** | Dépend d'un arbitrage non rendu. **Aucun point de cette étape** : `A11-01` et `A11-02` sont tranchés (D70, D71). |

> Aucun ❓ n'est appliqué comme s'il était décidé.

### 1.4 Vocabulaire

| Terme | Définition dans ce document |
|---|---|
| **Reprise** | Transfert de données depuis le classeur Excel vers PostgreSQL. |
| **Seed** | Jeu de données initial **de référence**, inséré une fois à la mise en service. |
| **Référentiel** | Liste administrée : urgences, importances, matrice, actions à prendre, éléments, fériés, départements. |
| **Donnée métier** | Tâche, commentaire, progression, date, durée, statut : tout ce qui décrit l'activité. |
| **Donnée nominative** | Nom, prénom, courriel, identifiant d'une personne physique. |
| **Idempotence** | Propriété d'un traitement qui, exécuté plusieurs fois, produit **le même état final** sans doublon ni écrasement. |
| **Seed versionné** | Seed identifié par une version et un journal de déploiement, sans table supplémentaire. |

---

## 2. Principe directeur : une reprise de référentiels, pas une migration du classeur

### 2.1 Le constat

Le classeur Excel contient **95 actions** et **59 objets** analysés à l'ÉTAPE 4. La **DÉCISION 11** a fixé le principe : **aucune des 95 actions n'est reprise** ; la table `tache` est créée **vide**.

La reprise se limite donc à **l'amorçage des référentiels** nécessaires au fonctionnement de l'application, plus la création du **premier compte administrateur**.

> **Conséquence structurante** : au premier démarrage, l'application contient **55 lignes de référence** et **0 donnée métier**. Ce n'est pas une reprise partielle : c'est un **démarrage à vide assumé**.

### 2.2 Ce qui est repris

| Catégorie | Source Excel | Lignes | Destination | Décision |
|---|---|---|---|---|
| Paramètres applicatifs | Valeurs fixées (pas une table Excel) | 1 | `parametre` | D18, D30, EF-22 |
| Urgences | `BD!Table10` | 4 | `urgence` | D8, D14 |
| Importances | `BD!Table108` | 4 | `importance` | D8, D14 |
| Matrice de priorité | `BD!Table31` | 13 | `matrice_priorite` | D14, D31 |
| Actions à prendre | `BD` (liste) | 3 | `action_a_prendre` | EF-21 |
| Éléments / piliers | `BD!Table1089` | 6 | `element` | D8 |
| Jours fériés 2026 | `BD!T3:T17` | 15 | `jour_ferie` | D5 |
| Départements | `ACTIONS!K6:K100` | 9 | `departement` | **D40** (9 observés sur les **11 prévus par R5**) |
| **Total référentiel** | | **55** | | |

### 2.3 Ce qui n'est pas repris

| Catégorie | Source Excel | Volume | Destination | Décision | Raison |
|---|---|---|---|---|---|
| Actions | `ACTIONS!A6:P100`, `Table226` | **95** | `tache` | **D11** | Aucune reprise ; table vide |
| Commentaires | Colonne `COMMENTAIRE` | 95 valeurs potentielles | `commentaire` | D11 | Aucun commentaire importé |
| Progression, dates, durées, statuts | Colonnes `PROGRESSION`, `DATE ACTION`, `D.DEBUT`, `D.FIN PREVUE`, `D.FIN`, `DUREE G.`, `DUREE E.`, `STATUT` | 95 lignes | `tache` | D11 | Aucune donnée métier reprise |
| Employés | Colonne `ASSIGNE A` (19 noms) | **19** | `employe` | D6, D11, D12 | Référentiel recréé, aucun nom repris |
| Partenaires | Colonne `STRUCTURE` (noms externes) | **12 distincts** | `partenaire` | D6, D11 | Aucune reprise |
| Comptes utilisateurs | — | **0 repris** | `utilisateur` | D12 | **1 compte admin initial créé** (section 6), le reste après la mise en service |
| Journal d'audit | — | **0** | `journal_audit` | D42 | Aucun événement métier au démarrage |
| Référentiels stock orphelins | 10 tables écartées | — | — | D8 | Hors périmètre |
| Workflows orphelins | 8 listes + `Table25` | — | — | D2 | Hors périmètre |

### 2.4 Ce que cela implique pour la mise en service

- L'application **démarre sans historique** : aucune tâche, aucun commentaire, aucun partenaire, aucun employé (hors compte administrateur initial).
- Les **premières tâches** seront saisies par les utilisateurs après création de leurs comptes.
- Le **classeur Excel d'origine** reste la seule trace de l'historique ; il est **archivé en lecture seule** (section 11.4).
- Toute demande ultérieure d'importer les 95 actions serait une **décision nouvelle**, contraire à D11 ; elle n'est ni prévue ni préparée ici.

---

## 3. Inventaire source → destination

### 3.1 Sources effectivement lues

| Référence | Feuille / plage | Contenu | Usage dans ce document |
|---|---|---|---|
| `BD!Table10` | Liste `URGENCE` | 4 valeurs | Seed `urgence` |
| `BD!Table108` | Liste `IMPORTANCE` | 4 valeurs | Seed `importance` |
| `BD!Table31` | Table de correspondance | 13 combinaisons, score, fréquence | Seed `matrice_priorite` |
| `BD!Table1089` | Liste `PILIER` | 6 valeurs | Seed `element` |
| `BD` | Liste `ACTION A PRENDRE` | 3 valeurs | Seed `action_a_prendre` |
| `BD!T3:T17` | Calendrier | 15 dates 2026 | Seed `jour_ferie` |
| `ACTIONS!K6:K100` | Colonne `STRUCTURE` (internes) | 9 départements observés | Seed `departement` |
| `ACTIONS!A6:P100` | Table des actions | 95 lignes | **Non repris** (D11) |
| `Table226` | Actions | 95 lignes | **Non repris** (D11) |

### 3.2 Correspondance détaillée

| # | Objet Excel | Traitement | Destination | Décision | Repris ? |
|---|---|---|---|---|---|
| 1 | `Table10` — urgences | Liste recréée à l'identique | `urgence` | D8, D14 | ✅ **Oui — 4 lignes** |
| 2 | `Table108` — importances | Liste recréée à l'identique | `importance` | D8, D14 | ✅ **Oui — 4 lignes** |
| 3 | `Table31` — matrice | 13 combinaisons reprises | `matrice_priorite` | D14, D31 | ✅ **Oui — 13 lignes** |
| 4 | `Table1089` — piliers | 6 valeurs reprises | `element` | D8 | ✅ **Oui — 6 lignes** |
| 5 | Liste `Action à prendre` | 3 valeurs reprises | `action_a_prendre` | EF-21 | ✅ **Oui — 3 lignes** |
| 6 | `BD!T3:T17` — fériés | 15 dates 2026 reprises | `jour_ferie` | D5 | ✅ **Oui — 15 lignes** |
| 7 | `ACTIONS!K6:K100` — départements | 9 observés sur 11 déclarés | `departement` | **D40** | ✅ **Oui — 9 lignes** |
| 8 | `ACTIONS!A6:P100` — actions | Aucune ligne reprise | `tache` | **D11** | ❌ **Non — 0 ligne** |
| 9 | `ASSIGNE A` — 19 noms | Aucun nom repris | `employe` | D6, D11, D12 | ❌ **Non — 0 ligne** |
| 10 | `STRUCTURE` — partenaires | Aucun partenaire repris | `partenaire` | D6, D11 | ❌ **Non — 0 ligne** |
| 11 | `COMMENTAIRE` | Aucun commentaire repris | `commentaire` | D11 | ❌ **Non — 0 ligne** |
| 12 | Statuts, progression, dates, durées | Aucune valeur reprise | `tache` | D11 | ❌ **Non — 0 ligne** |
| 13 | `Table25` et 8 listes de statuts | Workflows orphelins | — | D2 | ❌ **Non** |
| 14 | 10 tables de stock orphelines | Hors périmètre | — | D8 | ❌ **Non** |
| 15 | Paramètres (8h00–16h30, pause, fuseau, week-end) | Valeurs fixées par décision | `parametre` | D18, D30, EF-22 | ✅ **Oui — 1 ligne** |

### 3.3 Points d'attention sur les libellés

| # | Point | Traitement retenu | Source |
|---|---|---|---|
| 1 | L'Excel écrit **`Elevée`** sans accent, alors que le français correct est « Élevée ». | Le libellé **stocké** reprend l'Excel : `Elevée`. La priorité calculée reste **strictement** `Urgence & " & " & Importance`. | D14, RM-03, doc 06 §5.7 |
| 2 | L'Excel contient **`Pas urgent`** (matrice) et **`Pas urgente`** (autre liste non reprise). | Seule la valeur de `Table10` est reprise : **`Pas urgent`**. L'autre liste est hors périmètre. | D14, doc 06 §5.6 |
| 3 | `M.Gx & LOGISTIQUE` contient une esperluette et des majuscules. | Libellé repris **à l'identique**. | D40 |
| 4 | `B.U.INGREDIENTS` contient des points et l'abréviation `B.U.`. | Libellé repris **à l'identique**. | D40 |
| 5 | **11 départements prévus par R5**, **9 libellés observés**. | Les **9 observés** sont insérés (D40). Les **2 autres** ne peuvent pas être insérés : **leurs libellés ne sont pas connus**. Aucun libellé n'est inventé ; ils seront ajoutés par l'admin dans le référentiel administrable (R5). | R5, D40, docs 06 §13 |
| 6 | **`PERFORMANCE`** figure dans `Table1089` mais n'est utilisée par aucune action. | La valeur est **conservée** : le référentiel doit rester complet (6 piliers). | D8 |
| 7 | **3 combinaisons absentes** de la matrice : `Pas urgent` × `Critique`, `Elevée`, `Modérée`. | Elles ne sont **pas créées**. La clé étrangère composée les rend **impossibles en base**. | D31 |

---

## 4. Contenu exact du seed

> Les **55 lignes** ci-dessous sont les **seules** données insérées au démarrage. L'ordre indiqué est un 🔧 **choix d'implémentation** sans effet métier.

### 4.1 `parametre` — 1 ligne

| Champ | Valeur | Source |
|---|---|---|
| `id` | `1` | Contrainte `ck_parametre_singleton` |
| `fuseau` | `Africa/Algiers` | **D30** |
| `weekend_jour_1` | `5` (vendredi) | **D5** |
| `weekend_jour_2` | `6` (samedi) | **D5** |
| `heure_debut_journee` | `08:00` | EF-22 |
| `pause_debut` | `12:00` | EF-22 |
| `pause_fin` | `13:00` | EF-22 |
| `heure_echeance_quotidienne` | `16:30` | **D18** |
| `modifie_par_id` | `NULL` | Aucun utilisateur au moment du seed |

**Contrôle de cohérence** : `08:00 < 12:00 < 13:00 < 16:30` — la contrainte `ck_parametre_horaires` doit être satisfaite.

### 4.2 `urgence` — 4 lignes

| Ordre 🔧 | `libelle` | Source |
|---|---|---|
| 1 | `Immédiate` | `BD!Table10` |
| 2 | `Courte échéance` | `BD!Table10` |
| 3 | `Planifiable` | `BD!Table10` |
| 4 | `Pas urgent` | `BD!Table10` |

> `ordre` est une proposition de mise en œuvre ; aucune décision ne fixe l'ordre d'affichage des urgences.

### 4.3 `importance` — 4 lignes

| Ordre 🔧 | `libelle` | Source |
|---|---|---|
| 1 | `Critique` | `BD!Table108` |
| 2 | `Elevée` | `BD!Table108` — **sans accent**, conformément à l'Excel |
| 3 | `Modérée` | `BD!Table108` |
| 4 | `Faible` | `BD!Table108` |

### 4.4 `matrice_priorite` — 13 lignes

| # | Urgence | Importance | `score` | `frequence_jours` |
|---|---|---|---|---|
| 1 | Immédiate | Critique | 12 | 1 |
| 2 | Immédiate | Elevée | 11 | 2 |
| 3 | Immédiate | Modérée | 10 | 4 |
| 4 | Immédiate | Faible | 9 | 5 |
| 5 | Courte échéance | Critique | 8 | 6 |
| 6 | Courte échéance | Elevée | 7 | 7 |
| 7 | Courte échéance | Modérée | 6 | 8 |
| 8 | Courte échéance | Faible | 5 | 10 |
| 9 | Planifiable | Critique | 4 | 15 |
| 10 | Planifiable | Elevée | 3 | 20 |
| 11 | Planifiable | Modérée | 2 | 25 |
| 12 | Planifiable | Faible | 1 | 30 |
| 13 | Pas urgent | Faible | 0 | 45 |

**Règles** :

- les **3 combinaisons absentes** (`Pas urgent` × `Critique` / `Elevée` / `Modérée`) **ne sont pas insérées** (D31) ;
- la table est **non modifiable par l'utilisateur** (EF-20) ; seule une migration peut la faire évoluer ;
- `score` et `frequence_jours` sont **lus** par la matrice, jamais stockés sur la tâche (AR-05).

### 4.5 `action_a_prendre` — 3 lignes

| Ordre 🔧 | `libelle` | Source |
|---|---|---|
| 1 | `Faire immédiatement` | EF-21 |
| 2 | `Planifier` | EF-21 |
| 3 | `Déléguer si possible` | EF-21 |

### 4.6 `element` — 6 lignes

| Ordre 🔧 | `libelle` | Observé dans les 95 actions ? | Source |
|---|---|---|---|
| 1 | `EQUIPE` | ✅ Oui | `BD!Table1089` |
| 2 | `GOUVERNANCE` | ✅ Oui | `BD!Table1089` |
| 3 | `PERFORMANCE` | ❌ Non (jamais utilisée) | `BD!Table1089` |
| 4 | `PROCESS` | ✅ Oui | `BD!Table1089` |
| 5 | `REPORTING` | ✅ Oui | `BD!Table1089` |
| 6 | `RESSOURCES / OUTILS` | ✅ Oui | `BD!Table1089` |

> Les 6 valeurs sont **conservées** (D8), y compris `PERFORMANCE` non utilisée : le référentiel doit rester complet et administrable (EF-18). Aucune valeur n'est inventée.

### 4.7 `jour_ferie` — 15 lignes (année 2026 uniquement)

| # | Date | `libelle` | Source |
|---|---|---|---|
| 1 | `2026-01-01` | `NULL` | `BD!T3:T17` — D5 |
| 2 | `2026-01-12` | `NULL` | `BD!T3:T17` — D5 |
| 3 | `2026-03-20` | `NULL` | `BD!T3:T17` — D5 |
| 4 | `2026-03-21` | `NULL` | `BD!T3:T17` — D5 |
| 5 | `2026-03-22` | `NULL` | `BD!T3:T17` — D5 |
| 6 | `2026-05-01` | `NULL` | `BD!T3:T17` — D5 |
| 7 | `2026-05-27` | `NULL` | `BD!T3:T17` — D5 |
| 8 | `2026-05-28` | `NULL` | `BD!T3:T17` — D5 |
| 9 | `2026-05-29` | `NULL` | `BD!T3:T17` — D5 |
| 10 | `2026-06-16` | `NULL` | `BD!T3:T17` — D5 |
| 11 | `2026-06-25` | `NULL` | `BD!T3:T17` — D5 |
| 12 | `2026-07-02` | `NULL` | `BD!T3:T17` — D5 |
| 13 | `2026-07-05` | `NULL` | `BD!T3:T17` — D5 |
| 14 | `2026-08-26` | `NULL` | `BD!T3:T17` — D5 |
| 15 | `2026-11-01` | `NULL` | `BD!T3:T17` — D5 |

**Règles** :

- **aucune date 2027 ni 2028** n'est fournie → **P2** reste ouvert (section 11.5) ;
- les libellés ne sont fournis par aucune source : ils restent `NULL` (le modèle les autorise) ;
- la date est **unique** ; un second passage du seed ne doit pas créer de doublon.

### 4.8 `departement` — 9 lignes

| # | `libelle` | Source |
|---|---|---|
| 1 | `POLE SUPPORT & PERFORMANCE` | `ACTIONS!K6:K100` — D40 |
| 2 | `POLE DEVELOPPEMENT DES ACTIVITES` | `ACTIONS!K6:K100` — D40 |
| 3 | `COMPTABILITE` | `ACTIONS!K6:K100` — D40 |
| 4 | `M.Gx & LOGISTIQUE` | `ACTIONS!K6:K100` — D40 |
| 5 | `COORDINATION R&I` | `ACTIONS!K6:K100` — D40 |
| 6 | `FINANCES` | `ACTIONS!K6:K100` — D40 |
| 7 | `B.U.INGREDIENTS` | `ACTIONS!K6:K100` — D40 |
| 8 | `ACHATS INTERNATIONAUX` | `ACTIONS!K6:K100` — D40 |
| 9 | `TOP MANAGEMENT` | `ACTIONS!K6:K100` — D40 |

**Règles** :

- **9 départements observés** insérés au démarrage (D40), sur les **11 prévus par R5** : les **2 libellés manquants** ne sont pas inventés et seront ajoutés par l'admin dans le référentiel administrable ;
- tous sont `actif = true` ;
- aucun responsable n'est affecté au seed : la contrainte « au plus un responsable par département » (D35) n'est pas sollicitée.

### 4.9 Total du seed

| Table | Lignes |
|---|---|
| `parametre` | 1 |
| `urgence` | 4 |
| `importance` | 4 |
| `matrice_priorite` | 13 |
| `action_a_prendre` | 3 |
| `element` | 6 |
| `jour_ferie` | 15 |
| `departement` | 9 |
| **Total** | **55** |

> **Aucune autre ligne** n'est insérée par le seed. Le **premier compte administrateur** visé par `A11-01` (section 6) est créé **juste après le seed**, dans une **transaction distincte** : le seed de référence reste limité aux **55 lignes** ci-dessus et ne contient aucun mot de passe.

---

## 5. Volumes attendus au démarrage

| Table | Lignes au démarrage | Raison | Décision |
|---|---|---|---|
| `tache` | **0** | Aucune des 95 actions n'est reprise | **D11** |
| `commentaire` | **0** | Aucun commentaire importé | D11 |
| `partenaire` | **0** | Aucun partenaire importé | D6, D11 |
| `employe` | **0 ou 1** | Aucun nom repris ; seul l'admin initial peut exister (`A11-01`) | D6, D11, D12 |
| `utilisateur` | **1** | Compte administrateur initial, créé **après le seed** (`A11-01`) | D7, D12 |
| `journal_audit` | **0** | Aucun événement métier au démarrage | D42 |

> **Preuve de non-importation** : après le seed **et** la création du compte administrateur, les requêtes de contrôle de la section 7.3 doivent renvoyer **exactement ces volumes**. Tout écart bloque la mise en service.

### 5.1 Ce que devient le classeur Excel

- Le fichier `sources\classeur\ClasseurYD.xlsx` reste une **copie de travail en lecture seule**.
- Il **n'est jamais modifié** par l'application.
- Il **n'est pas nécessaire au fonctionnement** : aucune liaison externe, aucun classeur référencé, aucun accès réseau.
- Il constitue l'**archive de l'historique** ; sa conservation relève de la procédure de l'ÉTAPE 14.

---

## 6. Comptes initiaux

### 6.1 Principe

- **D12** : un compte par employé ; un compte n'est jamais supprimé, il est désactivé.
- **D11** : aucune donnée nominative n'est **reprise** du classeur.
- Le **premier compte** ne peut donc pas venir d'un import : il est **créé** à la mise en service.
- Le rôle est porté par le **compte** ; un `ADMIN` peut exister **sans fiche employé** (le modèle autorise `employe_id` nullable, comme pour un `CONSULTANT`).

### 6.2 `A11-01` — Premier compte administrateur

| Option | Description | Avantages | Inconvénients / conséquences |
|---|---|---|---|
| **A** | Compte **technique générique** `admin`, **sans fiche employé**, mot de passe temporaire, changement obligatoire | Aucune donnée nominative ; mise en service rapide ; conforme à D11 | L'audit désigne un acteur **générique** ; aucune traçabilité vers une personne ; plusieurs personnes pourraient l'utiliser |
| **B** | Compte **nominatif** du directeur ou du responsable informatique : `employe` + `utilisateur` `ADMIN`, changement obligatoire | Audit nominatif ; responsabilité claire ; conforme à D12 (un compte par employé) | Introduit une donnée nominative **créée** (non reprise) ; nécessite de fournir nom, prénom et identifiant |
| **C** | Compte nominatif **+** compte technique de secours, **désactivé en fonctionnement normal** | Traçabilité + secours en cas de perte d'accès | Deux comptes à gouverner ; le compte de secours doit être surveillé |

> **Ce qui n'est pas tranché** : l'option retenue, l'identité éventuelle (option B ou C), l'identifiant et le mode de communication du mot de passe initial.
> **Ce qui est déjà décidé** : `doit_changer_mot_de_passe = true` (EF-09), hachage **Argon2id** (ÉTAPE 13), aucun mot de passe en clair dans un document ou un dépôt.

### 6.3 `A11-02` — Création des comptes du personnel

| Option | Description | Avantages | Inconvénients / conséquences |
|---|---|---|---|
| **A** | **Saisie manuelle** par l'admin, via l'écran de gestion des comptes, après la mise en service | Strictement conforme à D11/D12 ; aucune donnée nominative importée ; contrôle humain | 19 créations manuelles ; délai de mise en service ; risque d'oubli |
| **B** | **Import d'une liste nominative** fournie par le directeur (nom, prénom, identifiant, rôle, département) | Rapide ; homogène | **Dérogation à D11** pour les comptes ; nouvelle décision nécessaire ; contrôle des doublons et des rôles à prévoir |
| **C** | **Aucun compte** au démarrage, hors admin ; création **à la demande** | Simplicité maximale | Les employés ne peuvent pas travailler le jour de la mise en service ; support accru |

> **Ce qui n'est pas tranché** : l'option retenue et, si l'option B est choisie, le **format** et le **contenu** de la liste.
> **Ce qui est déjà décidé** : un compte par employé (D12), rôle par défaut `EMPLOYEE`, `RESPONSABLE` avec département obligatoire (EF-05), au plus un responsable par département (D35), aucun compte `CONSULTANT` sans décision (D21).

### 6.4 Rôle et département du premier compte

- Si l'option **A** est retenue : `role = ADMIN`, `employe_id = NULL`, `actif = true`.
- Si l'option **B** ou **C** est retenue : `role = ADMIN`, fiche `employe` créée avec `departement_id` **facultatif** (un admin n'a pas besoin de département).
- Aucun `RESPONSABLE` n'est créé au seed : la contrainte « département obligatoire » (EF-05) resterait à satisfaire, et aucun département ne doit être doté d'un responsable sans décision.

### 6.5 Mot de passe et première connexion

- Le mot de passe initial est **temporaire** et **communiqué hors application** (procédure de l'ÉTAPE 13).
- `doit_changer_mot_de_passe = true` : la première connexion impose le changement (EF-09).
- Le **hachage** est réalisé par l'application, jamais par un script de seed en clair.
- **Aucun mot de passe** n'est écrit dans ce document, dans un fichier de configuration versionné ou dans le journal d'audit.

---

## 7. Ordre d'insertion, idempotence et intégrité

### 7.1 Ordre d'insertion

**7.1.1 Seed de référence — 55 lignes, une seule transaction**

| # | Table | Dépendance | Opération |
|---|---|---|---|
| 1 | `parametre` | Aucune | Insérer la ligne `id = 1` si absente |
| 2 | `urgence` | Aucune | Insérer les 4 libellés manquants |
| 3 | `importance` | Aucune | Insérer les 4 libellés manquants |
| 4 | `matrice_priorite` | `urgence`, `importance` | Insérer les 13 combinaisons manquantes |
| 5 | `action_a_prendre` | Aucune | Insérer les 3 libellés manquants |
| 6 | `element` | Aucune | Insérer les 6 libellés manquants |
| 7 | `jour_ferie` | Aucune | Insérer les 15 dates manquantes |
| 8 | `departement` | Aucune | Insérer les 9 libellés manquants |

> L'ordre respecte les **clés étrangères** : aucune insertion ne référence une ligne qui n'existe pas encore.

**7.1.2 Après le seed — création du compte administrateur, transaction distincte**

| # | Table | Dépendance | Opération |
|---|---|---|---|
| 9 | `employe` | `departement` (facultatif) | **Uniquement si `A11-01` = B ou C** |
| 10 | `utilisateur` | `employe` (facultatif) | Insérer le compte administrateur initial, `role = ADMIN`, `doit_changer_mot_de_passe = true` |

> Cette création est **hors seed** : elle intervient après les contrôles du bloc 7.1.1 et après la décision `A11-01`.

### 7.2 Règles d'idempotence

| # | Règle | Conséquence |
|---|---|---|
| 1 | **Insérer seulement ce qui manque** | Un second passage ne crée aucun doublon. |
| 2 | **Ne jamais écraser une valeur existante** | Si l'admin a désactivé un élément, changé un libellé ou modifié un paramètre, le seed **ne le rétablit pas**. |
| 3 | **Clés naturelles** | `parametre.id = 1` ; `lower(libelle)` pour urgence, importance, action, élément, département ; `jour` pour les fériés ; `(urgence_id, importance_id)` pour la matrice. |
| 4 | **Aucun UUID fixe** | Sauf `parametre.id = 1`, les identifiants sont générés par `gen_random_uuid()`. |
| 5 | **Transaction unique** | Les 55 lignes du seed réussissent ou aucune : en cas d'erreur, **rollback** complet. La création du compte admin est une **transaction distincte**. |
| 6 | **Aucune mise à jour de masse** | Le seed ne fait jamais `UPDATE` sur les données existantes. |

### 7.3 Contrôles après le seed

> Les contrôles **1 à 13** s'exécutent à la fin du seed ; le contrôle **14** après la création du compte administrateur.

| # | Contrôle | Attendu |
|---|---|---|
| 1 | `SELECT count(*) FROM parametre` | `1` |
| 2 | `SELECT count(*) FROM urgence` | `4` |
| 3 | `SELECT count(*) FROM importance` | `4` |
| 4 | `SELECT count(*) FROM matrice_priorite` | `13` |
| 5 | `SELECT count(*) FROM action_a_prendre` | `3` |
| 6 | `SELECT count(*) FROM element` | `6` |
| 7 | `SELECT count(*) FROM jour_ferie` | `15` |
| 8 | `SELECT count(*) FROM departement` | `9` |
| 9 | `SELECT count(*) FROM tache` | `0` |
| 10 | `SELECT count(*) FROM commentaire` | `0` |
| 11 | `SELECT count(*) FROM partenaire` | `0` |
| 12 | `SELECT count(*) FROM journal_audit` | `0` |
| 13 | Les 3 combinaisons absentes de la matrice | **0 ligne** ; insertion refusée par la FK composée |
| 14 | `SELECT count(*) FROM utilisateur` | `1` (compte initial) |

> Ces contrôles sont **des exigences de recette** ; leur exécution automatisée relève de l'ÉTAPE 12.

### 7.4 Audit du seed

- Le seed est une opération **technique**, sans utilisateur authentifié : il **ne produit pas** d'événement dans `journal_audit` (D42).
- La trace du seed est portée par le **journal de déploiement** de l'ÉTAPE 14 : date, version du seed, opérateur, nombre de lignes insérées, résultat des contrôles.
- 🔧 **Proposition** : ne pas insérer de ligne d'audit technique ; conserver la preuve dans le journal de déploiement.

---

## 8. Procédure de reprise (à exécuter à l'ÉTAPE 14)

> **Aucune de ces opérations n'est exécutée dans cette étape.** Elles décrivent la séquence que l'ÉTAPE 14 devra appliquer.

| # | Étape | Contenu | Responsable |
|---|---|---|---|
| 1 | **Gel et sauvegarde** | Sauvegarde complète de la base avant toute migration (ENF-14) | Admin / exploitation |
| 2 | **Migrations** | Application des migrations Prisma versionnées | Admin / exploitation |
| 3 | **Seed** | Exécution du seed idempotent, en une transaction | Admin / exploitation |
| 4 | **Contrôles du seed** | Exécution des contrôles **1 à 13** de la section 7.3 | Admin / exploitation |
| 5 | **Compte admin** | Création du compte initial selon `A11-01`, puis **contrôle 14** | Admin / directeur |
| 6 | **Première connexion** | Vérification du changement obligatoire de mot de passe (ÉTAPE 13) | Admin |
| 7 | **Comptes du personnel** | Création selon `A11-02` | Admin |
| 8 | **Journal de déploiement** | Consignation des volumes, de la version et du résultat | Admin / exploitation |
| 9 | **Archivage** | Classeur Excel conservé en lecture seule, hors application | Admin |

**En cas d'échec** : restauration de la sauvegarde de l'étape 1 ; aucune donnée métier n'étant présente, le retour arrière est **sans perte**.

---

## 9. Critères d'acceptation de la reprise

| # | Critère | Attendu | Source |
|---|---|---|---|
| **CA-11-01** | Paramètres | **1 ligne**, fuseau `Africa/Algiers`, week-end vendredi + samedi, 08:00 / 12:00 / 13:00 / 16:30 | D5, D18, D30, EF-22 |
| **CA-11-02** | Urgences | **4 lignes** exactes : `Immédiate`, `Courte échéance`, `Planifiable`, `Pas urgent` | D14 |
| **CA-11-03** | Importances | **4 lignes** exactes, dont `Elevée` **sans accent** | D14 |
| **CA-11-04** | Matrice | **13 lignes**, scores et fréquences exacts ; les **3 combinaisons absentes** sont refusées | D14, D31 |
| **CA-11-05** | Actions à prendre | **3 lignes** exactes | EF-21 |
| **CA-11-06** | Éléments | **6 lignes** exactes, dont `PERFORMANCE` | D8 |
| **CA-11-07** | Jours fériés | **15 dates 2026** exactes ; **aucune** date 2027-2028 | D5, P2 |
| **CA-11-08** | Départements | **9 lignes** exactes, aucun autre département | D40 |
| **CA-11-09** | Tâches | **0 ligne** : aucune des 95 actions reprise | **D11** |
| **CA-11-10** | Données métier et nominatives | **0 commentaire**, **0 partenaire**, **0 employé** hors admin initial, **0 audit métier** | D6, D11, D12, D42 |
| **CA-11-11** | Idempotence | Un **second passage** du seed ne crée aucun doublon et n'écrase aucune valeur | 🔧 |
| **CA-11-12** | Autonomie | L'application démarre **sans le classeur Excel** ; aucune liaison externe | D11, ENF-09 |

> **Recette** : ces 12 critères sont repris par l'ÉTAPE 12 (tests) et l'ÉTAPE 14 (déploiement). Ils ne sont **pas** exécutés ici.

---

## 10. Sauvegarde, restauration et retour arrière

| Sujet | Règle | Source |
|---|---|---|
| **Sauvegarde avant migration** | Obligatoire ; documentée et testée | ENF-14 |
| **Restauration** | Procédure écrite, testée sur un environnement de recette avant la production | ENF-14, ÉTAPE 14 |
| **Rollback du seed** | Restauration de la sauvegarde ; le seed ne modifie pas les données existantes | 🔧 |
| **Données métier** | Aucune au démarrage : un échec ne détruit aucun historique | D11 |
| **Classeur Excel** | Conservé en lecture seule, jamais modifié, jamais supprimé | 🔧 |
| **Emplacement de la sauvegarde** | Défini à l'ÉTAPE 14 (**P11** : environnement serveur) | P11 |

---

## 11. Points tranchés et propositions

### 11.1 `A11-01` — Premier compte administrateur ✅

**Question** : quel compte administrateur existe à la mise en service ?

- **Option A** : compte générique `admin`, sans fiche employé ;
- **Option B** : compte nominatif `ADMIN` (directeur ou responsable informatique) ;
- **Option C** : compte nominatif + compte technique de secours désactivé.

**Éléments à fournir si B ou C** : nom, prénom, identifiant souhaité, adresse électronique éventuelle.

> **Décision du 02/11/2026 — `A11-01` → D70** : **option B retenue** — le premier compte est un **compte nominatif** `ADMIN` (directeur ou responsable informatique), avec fiche `employe` et changement de mot de passe obligatoire.
> **Reste à fournir avant l'ÉTAPE 14** (non bloquant) : le **nom, le prénom et l'identifiant** du titulaire ; aucune donnée nominative n'est inventée.

### 11.2 `A11-02` — Comptes du personnel ✅

**Question** : comment les comptes des employés sont-ils créés après la mise en service ?

- **Option A** : saisie manuelle par l'admin (conforme à D11/D12) ;
- **Option B** : import d'une liste nominative fournie (dérogation à D11 pour les comptes) ;
- **Option C** : création à la demande, aucun compte au démarrage.

**Éléments à fournir si B** : la liste (nom, prénom, identifiant, rôle, département) et le format attendu.

> **Décision du 02/11/2026 — `A11-02` → D71** : **option A retenue** — les comptes du personnel sont créés **manuellement** par l'admin, via l'écran de gestion, **après la mise en service**. Aucun import nominatif ; D11 et D12 restent applicables.

### 11.3 `A11-03` — Mode d'exécution du seed ✅

**Proposition** : seed **idempotent**, exécuté en **une transaction**, **manuellement** par l'exploitant après les migrations, avec contrôles bloquants et journal de déploiement. Aucun déclenchement automatique au démarrage de l'application.

**Justification** : évite qu'un redémarrage inattendu modifie les données ; laisse une trace opérationnelle ; permet de rejouer sans risque.

**Statut** : ✅ **Accepté le 02/11/2026** — ✅ **DÉCIDÉ**, applicable tel quel.

### 11.4 `A11-04` — Archivage et absence de dépendance au classeur ✅

**Proposition** : conserver `sources\classeur\ClasseurYD.xlsx` en **lecture seule**, avec une empreinte de contrôle (checksum) ; ne jamais le référencer depuis l'application ; documenter son emplacement dans la procédure de l'ÉTAPE 14.

**Statut** : ✅ **Accepté le 02/11/2026** — ✅ **DÉCIDÉ**, applicable tel quel.

### 11.5 Zones non tranchées — signalées

| # | Sujet | État | Traitement |
|---|---|---|---|
| **P2** | Jours fériés **2027-2028** | ❓ **Ouvert** — aucune date fournie | Non bloquant : les 15 dates 2026 sont seules insérées ; l'admin les saisira |
| **Départements 11 → 9** | **R5 prévoit 11 départements** ; **9 libellés observés** | ✅ **D40 tranché** : les 9 observés sont insérés | Les **2 libellés manquants** ne sont pas inventés ; l'admin les ajoutera au référentiel (R5) — non bloquant |
| **P11** | Environnement serveur | ❓ **Ouvert** — ÉTAPE 14 | Sans effet sur le seed |
| **P12** | Sessions et mots de passe | ❓ **Ouvert** — ÉTAPE 13 | Le seed fixe seulement `doit_changer_mot_de_passe = true` |
| **G1 → G4** | Zones grises de l'ÉTAPE 10 | ✅ **Tranchées à l'ÉTAPE 12 — D72 à D75** | Aucun effet sur le seed : la création du compte `ADMIN` applique D70 et D72 |

---

## 12. Traçabilité

| Élément du CDC / décision | Traitement dans ce document |
|---|---|
| **D5** (jours fériés, week-end) | §4.1, §4.7, CA-11-01, CA-11-07 |
| **D6** (acteur / structure / partenaire) | §2.3, §3.2, CA-11-10 |
| **D7 / D12** (comptes) | §6, CA-11-10 |
| **D8** (référentiels conservés) | §2.2, §4.2 → §4.8, CA-11-06 |
| **D11** (aucune reprise des actions) | §2.1, §2.3, §3.2, CA-11-09, CA-11-12 |
| **D14** (matrice de priorité) | §4.2 → §4.4, CA-11-02 → CA-11-04 |
| **D18** (échéance 16h30) | §4.1, CA-11-01 |
| **D21** (consultant) | §6.3 |
| **D30** (fuseau `Africa/Algiers`) | §4.1, CA-11-01 |
| **D31** (3 combinaisons absentes) | §3.3, §4.4, CA-11-04 |
| **D35** (un responsable par département) | §4.8, §6.4 |
| **D40** (9 départements au démarrage) | §2.2, §3.3, §4.8, CA-11-08 |
| **R5** (11 départements, référentiel administrable) | §3.3, §4.8, §11.5 |
| **D42** (audit append-only) | §5, §7.4, CA-11-10 |
| **EF-06** (un compte par employé) | §6.1 |
| **EF-09** (changement de mot de passe) | §6.5 |
| **EF-13** (partenaires) | §2.3, CA-11-10 |
| **EF-18** (référentiel éléments) | §4.6 |
| **EF-20** (matrice non modifiable) | §4.4 |
| **EF-21** (actions à prendre) | §4.5, CA-11-05 |
| **EF-22** (paramètres d'affichage) | §4.1, CA-11-01 |
| **ENF-09** (volumétrie) | §2.1, §2.3 |
| **ENF-14** (reprise, sauvegarde, restauration) | §8, §10 |
| **P2 / P11 / P12** | §11.5 |
| **G1 → G4** (ÉTAPE 10) | §11.5 |

---

## 13. Ce que l'ÉTAPE 11 ne fait pas

- Elle **ne crée aucun script** de seed ou d'import.
- Elle **ne crée aucune migration**, aucun `schema.prisma`, aucune base.
- Elle **ne lance aucun seed** et **ne modifie aucun fichier Excel**.
- Elle **n'importe aucune action**, aucun commentaire, aucun employé (hors admin initial), aucun partenaire.
- Elle **ne définit pas** les mots de passe, les sessions ou le verrouillage → **ÉTAPE 13**.
- Elle **ne définit pas** les tests automatisés → **ÉTAPE 12** (elle en fixe les contrôles).
- Elle **ne définit pas** la procédure de déploiement → **ÉTAPE 14**.
- Elle **ne tranche pas** `A11-01` et `A11-02`.
- Elle **ne rouvre pas** D11 : l'absence de reprise des 95 actions est **acquise**.

---

## 14. Validation

### 14.1 Validation obtenue — 02/11/2026

Le directeur a **validé l'ÉTAPE 11** et le livrable `docs\10_REPRISE_DES_DONNEES.md` **en l'état**, et a tranché les points `A11-01` et `A11-02`.

| # | Objet | Décision | Statut |
|---|---|---|---|
| 1 | **`A11-01`** — premier compte administrateur | **Option B** : compte **nominatif** `ADMIN` (directeur ou responsable informatique), avec fiche `employe` et changement de mot de passe obligatoire → **D70** | ✅ Tranché |
| 2 | **`A11-02`** — comptes du personnel | **Option A** : création **manuelle** par l'admin via l'écran de gestion, après la mise en service ; **aucun import nominatif** → **D71** | ✅ Tranché |
| 3 | **`A11-03`** — mode d'exécution du seed | Seed **idempotent**, **une transaction**, exécution **manuelle** après migrations, contrôles bloquants, journal de déploiement, **aucun auto-run** | ✅ Accepté |
| 4 | **`A11-04`** — archivage du classeur | Classeur conservé en **lecture seule** avec checksum, **jamais référencé** à l'exécution | ✅ Accepté |
| 5 | **Livrable `docs\10`** | Validé **en l'état** | ✅ Validé |

**Conséquences** :

- **D70** et **D71** complètent les décisions de référence, portées à **D1 → D71** à l'issue de cette étape, puis à **D1 → D75** après l'ÉTAPE 12.
- Le seed reste **55 lignes** ; la création du compte `ADMIN` est une **transaction distincte**, postérieure aux contrôles 1 à 13.
- **Aucune donnée nominative** n'est inventée : le **nom, le prénom et l'identifiant** du titulaire `ADMIN` restent **à fournir avant l'ÉTAPE 14** (non bloquant).
- **P2**, **P11** et **P12** restent ouverts et **sans effet** sur le contenu du seed.

### 14.2 Points vérifiés lors de la validation

1. l'**inventaire source → destination** (§2 et §3) est exact, et les **55 lignes de référence** sont les seules reprises ;
2. le **contenu exact du seed** (§4) est conforme : libellés, scores, fréquences, dates, ordre et départements ;
3. les **volumes attendus au démarrage** (§5) correspondent à D11, D6 et D12 ;
4. les règles d'**ordre, d'idempotence et d'intégrité** (§7) sont suffisantes ;
5. la **procédure de reprise** (§8) et les **12 critères d'acceptation** (§9) sont complets ;
6. les propositions **`A11-03`** et **`A11-04`** (§11.3 et §11.4) sont acceptées ;
7. **`A11-01`** et **`A11-02`** sont tranchés → **D70**, **D71**.

> **ÉTAPE 11 close le 02/11/2026.** L'**ÉTAPE 12 — Tests** peut être engagée.
> **Aucun code n'a été écrit** pendant l'analyse fonctionnelle (règle M1).

---

## 15. Journal des révisions

| Date | Section(s) | Modification | Statut |
|---|---|---|---|
| 02/11/2026 | Document entier | Création du livrable 10 (ÉTAPE 11) : principe de non-reprise, inventaire source → destination, **55 lignes de référence**, tables vides, comptes initiaux, ordre et idempotence, procédure de reprise, **12 critères d'acceptation**, points **A11-01 à A11-04**, traçabilité. Aucun code écrit. | ⏳ En attente de validation |
| 02/11/2026 | §1.2, §1.3, §3.3, §4.8, §5, §7.1 → §7.4, §11.1 → §11.5, §12, §14, §15 | Précisions de cohérence : volumes attendus après création du compte admin, seed **55 lignes** distinct de la création du compte, contrôles 1→13 puis 14, **R5 (11 départements) vs D40 (9 observés)** explicitée. | ⏳ En attente de validation |
| 02/11/2026 | §11.1, §11.2, §14.1 | Validation de l'ÉTAPE 11 : **`A11-01` → D70** (compte nominatif), **`A11-02` → D71** (saisie manuelle), **`A11-03` / `A11-04` acceptés**, livrable validé **en l'état**. Décisions de référence portées à **D1 → D71**. | ✅ **VALIDÉE** |
