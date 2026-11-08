# GD Trading — Application de gestion des TODOLIST

**Dossier racine du projet.** Aucun fichier de ce projet n'est stocké dans `Documents\Default Project`
(projet de gestion de stock, strictement séparé).

| | |
|---|---|
| Projet | Application web interne de suivi des TODOLIST des services et personnels de GD Trading |
| Accès | Réseau local de GD Trading, hébergée sur le serveur local de l'entreprise |
| Rôles | `ADMIN` · `RESPONSABLE` · `EMPLOYEE` · `CONSULTANT` (lecture seule) — un compte par employé (DÉCISION 7 / 12) |
| Directeur | Admin principal de l'application |
| Stack | React + Vite + TypeScript · Node + Express + TypeScript · Prisma · PostgreSQL (DÉCISION 9) |
| Sources | SOURCE 1 : l'ancien classeur Excel · SOURCE 2 : règles métier du directeur · SOURCE 3 : décisions techniques ensemble |

---

## Structure du dossier

```
GD Trading - TodoList\
├── README.md                          ← ce fichier
├── docs\
│   ├── 00_METHODE_DE_TRAVAIL.txt      ← brief du projet + méthode imposée (ÉTAPE 1 → 15)
│   ├── 01_ANALYSE_FONCTIONNELLE.md    ← ÉTAPE 1 + ÉTAPE 2 : ✅ validées le 01/11/2026
│   ├── 02_EXIGENCES_DIRECTEUR.md      ← ÉTAPE 3 : ✅ validée le 01/11/2026
│   ├── 03_COMPARAISON_EXCEL_EXIGENCES.md ← ÉTAPE 4 : ✅ validée le 02/11/2026
│   ├── 04_ARCHITECTURE_APPLICATION.md ← ÉTAPE 6 : ✅ validée le 02/11/2026
│   ├── 05_CAHIER_DES_CHARGES_FONCTIONNEL.md ← ÉTAPE 5 : ✅ validée le 02/11/2026
│   ├── 06_MODELE_DE_DONNEES.md        ← ÉTAPE 7 : ✅ validée le 02/11/2026
│   ├── 07_API.md                      ← ÉTAPE 8 : ✅ validée le 02/11/2026
│   ├── 08_INTERFACE_REACT.md          ← ÉTAPE 9 : ✅ validée le 02/11/2026
│   ├── 09_ROLES_ET_PERMISSIONS.md     ← ÉTAPE 10 : ✅ validée le 02/11/2026
│   ├── 10_REPRISE_DES_DONNEES.md      ← ÉTAPE 11 : ✅ validée le 02/11/2026
│   └── 11_STRATEGIE_ET_PLAN_DE_TESTS.md ← ÉTAPE 12 : ✅ validée le 02/11/2026
├── sources\
│   ├── classeur\ClasseurYD.xlsx       ← SOURCE 1 : classeur Excel d'origine (copie, ne pas modifier)
│   └── analyse\                       ← traces techniques de l'analyse OOXML
│       ├── full-report.txt            ← dump complet : cellules, validations, formats, tables, formules
│       ├── actions-data.txt           ← les 95 actions + fréquences + anomalies
│       ├── formulas.txt               ← les 7 motifs de formules dédupliqués
│       └── stats.txt                  ← volumétrie, doublons, contrôle de cohérence
├── shared\                            ← types purs partagés (socle vide à ce stade)
├── server\                            ← Express + harnais de tests (aucun code métier)
├── client\                            ← React + harnais de tests (aucun composant métier)
└── e2e\                               ← configuration Playwright (scénario `fixme`)
```

**Convention** : numérotation **séquentielle** des livrables (méthode M8) — `01` couvre les étapes 1 et 2, `02` l'étape 3, `03` l'étape 4, etc. Chaque fichier indique en en-tête l'étape qu'il traite.
**Exception assumée** : `04` correspond à l'**ÉTAPE 6** et `05` à l'**ÉTAPE 5**, car l'ÉTAPE 5 a été reportée (D26) puis reprise (D27) après l'ÉTAPE 6.

---

## Méthode imposée — suivi

| # | Étape | Statut |
|---|---|---|
| 1 | Analyse complète du fichier Excel | ✅ Terminée |
| 2 | Documentation du fonctionnement actuel | ✅ Terminée → `docs\01_ANALYSE_FONCTIONNELLE.md` |
| 3 | Analyse des exigences du directeur | ✅ **Validée par le directeur le 01/11/2026** → `docs\02_EXIGENCES_DIRECTEUR.md` |
| 4 | Comparaison Excel / nouvelles exigences | ✅ **Validée par le directeur le 02/11/2026** → `docs\03_COMPARAISON_EXCEL_EXIGENCES.md` |
| 5 | Cahier des charges fonctionnel | ✅ **Validée par le directeur le 02/11/2026** (reprise après report, D26/D27) → `docs\05_CAHIER_DES_CHARGES_FONCTIONNEL.md` |
| 6 | Architecture de l'application | ✅ **Validée par le directeur le 02/11/2026** → `docs\04_ARCHITECTURE_APPLICATION.md` |
| 7 | Modèle de données PostgreSQL | ✅ **Validé par le directeur le 02/11/2026** → `docs\06_MODELE_DE_DONNEES.md` |
| 8 | API Node.js / Express | ✅ **Validée par le directeur le 02/11/2026** → `docs\07_API.md` |
| 9 | Interface React | ✅ **Validée par le directeur le 02/11/2026** → `docs\08_INTERFACE_REACT.md` |
| 10 | Gestion des rôles et permissions (4 rôles) | ✅ **Validée par le directeur le 02/11/2026** → `docs\09_ROLES_ET_PERMISSIONS.md` |
| 11 | Migration des données Excel → PostgreSQL | ✅ **Validée par le directeur le 02/11/2026** → `docs\10_REPRISE_DES_DONNEES.md` |
| 12 | Tests | ✅ **Validée par le directeur le 02/11/2026** → `docs\11_STRATEGIE_ET_PLAN_DE_TESTS.md` |
| 13 | Sécurité | ⏸ |
| 14 | Déploiement sur le serveur local de GD Trading | ⏸ |
| 15 | Documentation utilisateur et administration | ⏸ |

> **Règle en vigueur : aucun code métier tant que l'analyse fonctionnelle n'est pas validée.**
> Les ÉTAPES 1 à 12 sont validées. Seuls les **fichiers de configuration et le harnais de tests** existent ; **aucune règle métier, aucune route, aucun composant, aucun schéma Prisma** n'est encore écrit.

---

## Points ouverts (détail dans `docs\01_ANALYSE_FONCTIONNELLE.md`, partie E)

Les **DÉCISIONS 1 à 12** sont **toutes tranchées** au 01/11/2026 :

1. Périmètre du classeur amputé — ✅ **validée le 01/11/2026 (conception modulaire ; classeur maître indisponible)**
2. Workflows orphelins (8 listes de statuts + `Table25`) — ✅ **validée le 01/11/2026 (hors périmètre)**
3. Statuts `Annulée` / `Suspendue` — ✅ **validée le 01/11/2026 (statut explicite + calcul auto)**
4. `PROGRESSION` temporelle vs manuelle — ✅ **validée le 01/11/2026 (manuel + repli temporel)**
5. Jours fériés et jours ouvrés (week-end ven.+sam.) — ✅ **validée le 01/11/2026 (table administrable + 15 dates 2026)**
6. Modélisation `ACTEUR` / `STRUCTURE` / partenaire — ✅ **validée le 29/10/2026**
7. Rôles et permissions — ✅ **validée le 01/11/2026 (4 rôles : ADMIN / RESPONSABLE / EMPLOYEE / CONSULTANT)**
8. Référentiels stock orphelins — ✅ **validée le 01/11/2026 (10 tables écartées)**
9. Stack technique — ✅ **validée le 01/11/2026 (TypeScript + Prisma de bout en bout, PostgreSQL)**
10. Emplacement du projet — ✅ **validée le 01/11/2026 (`GD Trading - TodoList`)**
11. Reprise des 95 actions — ✅ **validée le 01/11/2026 (aucune reprise)**
12. Politique de comptes utilisateurs — ✅ **validée le 01/11/2026 (un compte par employé)**

### Décisions issues de l'ÉTAPE 3 (`docs\02_EXIGENCES_DIRECTEUR.md`)

13. Création des tâches — ✅ **02/11/2026** (admin + responsable dans son service + employé pour lui-même)
14. Priorité — ✅ **02/11/2026** (l'admin choisit urgence + importance ; la matrice calcule)
15. Justification — ✅ **02/11/2026** (champ distinct, obligatoire à la clôture tardive)
16. « Ses propres tâches » — ✅ **02/11/2026** (A13 confirmée : assignées + pilote + créées)
17. Contrôle du responsable — ✅ **02/11/2026** (voir + commenter + modifier, D7 inchangée)
18. Horaires 8h00–16h30 — ✅ **02/11/2026** (échéance des tâches quotidiennes à 16h30)
19. « Autres tâches » — ✅ **02/11/2026** (consultation des tâches déjà assignées)
20. Admin et fiche employé — ✅ **02/11/2026** (fiche employé + compte ADMIN)
21. Rôle `CONSULTANT` — ✅ **02/11/2026** (maintenu, lecture seule)
22. Tâches quotidiennes — ✅ **02/11/2026** (ponctuelles + duplication, aucune génération automatique)
23. Charte graphique — ✅ **02/11/2026** (noir dominant, accents rouges, palette noir/rouge/blanc uniquement)
24. Validation des tâches créées par un employé — ✅ **02/11/2026** (aucune validation préalable)
25. Auto-attribution du responsable — ✅ **02/11/2026** (oui, comme tout employé)
26. Report de l'ÉTAPE 5 — ✅ **02/11/2026** (cahier des charges reporté, non annulé ; non bloquant pour l'ÉTAPE 6)
27. Reprise de l'ÉTAPE 5 — ✅ **02/11/2026** (reprise immédiatement après validation de l'ÉTAPE 6, avant l'ÉTAPE 7)
28. Dates d'une tâche quotidienne (P4) — ✅ **02/11/2026** (journée unique : `dateAction` = `dateDebut`, pas de `dateFinPrevue`)
29. Service porteur d'une tâche (P7) — ✅ **02/11/2026** (département de l'exécutant, à défaut celui du pilote)
30. Fuseau horaire (P8) — ✅ **02/11/2026** (`Africa/Algiers`, UTC+1)
31. Combinaisons absentes de la matrice (P9) — ✅ **02/11/2026** (refus avec message explicite)
32. Tâche quotidienne hors délai / jour non ouvré (P10) — ✅ **02/11/2026** (refus avec message explicite)
33. Priorité des tâches créées par un non-admin (C12) — ✅ **02/11/2026** (créateur habilité, matrice calculée)

### Décisions issues de l'ÉTAPE 7 (`docs\06_MODELE_DE_DONNEES.md`)

34. Service porteur (M7-01) — ✅ **02/11/2026** (calculé à chaque lecture, aucune colonne)
35. Un responsable par service (M7-02) — ✅ **02/11/2026** (contrôle applicatif transactionnel `SERIALIZABLE`)
36. Suppression des tâches (M7-03) — ✅ **02/11/2026** (logique : `supprime_le`, `supprime_par_id`)
37. Commentaires (M7-04) — ✅ **02/11/2026** (table `commentaire` historisée, append-only)
38. Clôture (M7-05) — ✅ **02/11/2026** (`date_fin` métier + `cloture_le` réel)
39. Consultant sans fiche employé (M7-06) — ✅ **02/11/2026** (`employe_id` nullable, unicité partielle)
40. Départements initiaux (M7-07) — ✅ **02/11/2026** (insertion des 9 départements observés)
41. Doublon de libellé (M7-08) — ✅ **02/11/2026** (avertissement applicatif, aucune contrainte unique)
42. Journal d'audit (M7-09) — ✅ **02/11/2026** (aucune purge)
43. Progression d'une tâche quotidienne (P17) — ✅ **02/11/2026** (0 % avant clôture, 100 % après ; manuel prioritaire)

### Décisions issues de l'ÉTAPE 8 (`docs\07_API.md`)

44. Duplication (A8-01 / P14) — ✅ **02/11/2026** (31 dates max ; jours ouvrés pour une quotidienne ; aucun commentaire ni motif copié ; atomicité ; pas d'avertissement de doublon sur les copies)
45. Motif de non-achèvement (A8-02 / P13) — ✅ **02/11/2026** (non vide après `trim`, maximum 2 000 caractères, aucune longueur minimale au-delà)
46. Longueurs (A8-03 / P6) — ✅ **02/11/2026** (libellé 255, commentaire 2 000)
47. Pilote désigné par un non-admin (A8-04 / P16) — ✅ **02/11/2026** (partenaire interdit ; pilote employé limité au périmètre de création)
48. Département avec responsable (A8-05 / P15) — ✅ **02/11/2026** (suppression et désactivation refusées tant qu'un responsable est rattaché)
49. Employé inactif (A8-06) — ✅ **02/11/2026** (assignation refusée, `422 EMPLOYE_INACTIF`)
50. Désactivation d'un employé (A8-07) — ✅ **02/11/2026** (désactive le compte et révoque les sessions, même transaction)
51. Réouverture d'une tâche (A8-08) — ✅ **02/11/2026** (aucune en V1)
52. Motif visible par le consultant (A8-09) — ✅ **02/11/2026** (oui, comme tout ayant droit)
53. Historique de tâche (A8-10) — ✅ **02/11/2026** (réduit pour les ayants droit, valeurs avant/après réservées à l'admin)
54. Édition de la date d'une quotidienne (A8-11) — ✅ **02/11/2026** (cohérence ; jour non ouvré refusé ; règle 16h30 à la création seulement)
55. `nature` immuable (A8-12) — ✅ **02/11/2026**
56. Retard à la clôture (A8-13) — ✅ **02/11/2026** (`dateFin` au-delà de l'échéance ou `clotureLe` après 16h30 le jour dû)
57. Commentaire vide (A8-14) — ✅ **02/11/2026** (refusé)

### Décisions issues de l'ÉTAPE 9 (`docs\08_INTERFACE_REACT.md`)

58. Icônes des six statuts (A9-01) — ✅ **02/11/2026** (○ `A faire`, ▶ `En cours`, ▲ `Retard` rouge, ✓ `Achevée`, ✕ `Annulée`, ⏸ `Suspendue`, toujours avec le libellé)
59. Écran d'atterrissage par rôle (A9-02) — ✅ **02/11/2026** (`EMPLOYEE` → `/aujourdhui`, `RESPONSABLE` → `/service`, `ADMIN` et `CONSULTANT` → `/toutes-les-taches`)
60. Cible d'affichage (A9-03) — ✅ **02/11/2026** (desktop-first ≥ 1280 px ; pas d'optimisation mobile en V1)
61. Libellés `Durée G.` / `Durée E.` (A9-04) — ✅ **02/11/2026** (affichés avec infobulle ; **P1** reste ouvert sur le sens métier)
62. Libellé de `FREQUENCE` (A9-05) — ✅ **02/11/2026** (« Rappel tous les N jours » ; **P5** reste ouvert sur la sémantique)
63. Écran du `CONSULTANT` (A9-06) — ✅ **02/11/2026** (IHM-09 partagé `ADMIN` écriture / `CONSULTANT` lecture seule)
64. Ordre d'affichage et tri par défaut (A9-07) — ✅ **02/11/2026** (ordre `Retard` → `A faire` → `En cours` → `Suspendue` → `Annulée` → `Achevée` ; tri serveur uniquement sur les champs autorisés)
65. Conflit de version (A9-08) — ✅ **02/11/2026** (rechargement + comparaison + reprise explicite, aucune fusion automatique)
66. Aperçu de duplication (A9-09) — ✅ **02/11/2026** (aperçu local, aucun endpoint de prévisualisation, atomicité serveur)
67. Affichage du score de priorité (A9-10) — ✅ **02/11/2026** (libellé en clair + score discret, jamais le score seul)
68. Critères du mot de passe (A9-11) — ✅ **02/11/2026** (rien affiché avant l'ÉTAPE 13 ; **P12** reste ouvert)
69. Thème clair (A9-12) — ✅ **02/11/2026** (aucun en V1, noir dominant — D23)

### ÉTAPE 4

- Livrable : `docs\03_COMPARAISON_EXCEL_EXIGENCES.md` — **validé par le directeur le 02/11/2026**.
- Résultat : **59 objets Excel classés** (30 reproduits · 7 modifiés · 22 abandonnés) et **20 exigences reliées** (3 reproduites · 2 modifiées · 15 nouvelles).
- Points résiduels : **P1 à P6** (A8, fériés 2027-2028, liste des consultants, dates des tâches quotidiennes, sémantique de `FREQUENCE`, longueur du libellé) — **P4** clos par **D28**, **P6** clos par **D46**.

### ÉTAPE 5 — validée le 02/11/2026

- Le **cahier des charges fonctionnel** avait été reporté par la **DÉCISION 26** ; il a été **repris par la DÉCISION 27** après validation de l'ÉTAPE 6, avant l'ÉTAPE 7.
- Livrable : `docs\05_CAHIER_DES_CHARGES_FONCTIONNEL.md` — ✅ **validé le 02/11/2026**.
- Contenu : **79 exigences fonctionnelles**, **15 règles métier**, **18 parcours utilisateurs**, **14 écrans**, **14 exigences non fonctionnelles**, **64 critères d'acceptation**.
- Décisions rendues le 02/11/2026 : **P4 → D28 · P7 → D29 · P8 → D30 · P9 → D31 · P10 → D32 · C12 → D33**.
- Points restant ouverts et **non bloquants** : **P1, P2, P3, P5, P11, P12** — **P6, P13, P14, P15 et P16** ont été clos le 02/11/2026 (**D44 à D57**).

### ÉTAPE 6 — validée le 02/11/2026

- Livrable : `docs\04_ARCHITECTURE_APPLICATION.md`.
- Contenu : couches, arborescence, modules, **6 moteurs de domaine purs**, flux de lecture / écriture, sécurité, API, interface, persistance, déploiement (Windows natif ou Linux/Docker), tests, risques.
- Décisions techniques : **AR-01 à AR-13** — ✅ **validées**.
- Points techniques résiduels : **P11 et P12** (environnement serveur, politique de session et mot de passe) ; **P7, P8, P9, P10 ont été tranchés le 02/11/2026** (D29 à D32).

### ÉTAPE 7 — validée le 02/11/2026

- Livrable : `docs\06_MODELE_DE_DONNEES.md` — ✅ **validé le 02/11/2026**.
- Contenu : **14 tables** (référentiels, comptes, `tache`, commentaires, audit, paramètres), **4 énumérations**, contraintes `CHECK`, **clé étrangère composée** vers la matrice de priorité (traduction de **D31**), index (dont 3 partiels), règles de suppression et de désactivation, journal d'audit append-only, données initiales, stratégie de migration Prisma.
- Choix structurants : suppression **logique** des tâches, **commentaires historisés**, `date_fin` **+** `cloture_le`, **service porteur calculé** (jamais stocké, **D29**), **aucun statut stocké** (AR-05).
- Décisions rendues le 02/11/2026 : **M7-01 → D34 · M7-02 → D35 · M7-03 → D36 · M7-04 → D37 · M7-05 → D38 · M7-06 → D39 · M7-07 → D40 · M7-08 → D41 · M7-09 → D42 · P17 → D43**.
- Points restant ouverts et **non bloquants** : **aucun** — **P6**, **P13** et **P15** ont été clos le 02/11/2026 (**D46, D45, D48**).
- **Aucun code, aucune migration, aucune base créés.**

### ÉTAPE 8 — validée le 02/11/2026

- Livrable : `docs\07_API.md` — ✅ **validé le 02/11/2026**.
- Contenu : conventions (dates, fuseau, enveloppes), authentification et session, **politique d'autorisation route par route**, catalogue d'erreurs `problem+json`, pagination / tri / filtres, **DTO** de lecture et d'écriture, **54 endpoints**, règles de validation transverses, **hooks d'audit**, transactions et concurrence, limites de performance, **traçabilité EF-01 → EF-79**.
- Choix structurants : REST `/api/v1` (**T8-01**), hors périmètre → `404` et action interdite → `403` (**T8-06**), pas d'endpoint `/dashboard` (**T8-07**), tri refusé sur les champs calculés (**T8-08**), suppression logique invisible par défaut (**T8-09**), duplication atomique (**T8-10**), doublon de libellé = avertissement (**T8-11**).
- Décisions techniques rendues le 02/11/2026 : **T8-01 à T8-15** (techniques, sans impact métier).
- Points **A8-01 à A8-14** tranchés le 02/11/2026 → **D44 à D57** ; **P6, P13, P14, P15 et P16 clos**.
- Restent ouverts et **non bloquants** : **P1, P2, P3, P5** (métier) et **P11, P12** (ÉTAPES 13-14).
- **Aucun code, aucune dépendance, aucun dossier `client\`, `server\` ou `prisma\`, aucune base créés.**

### ÉTAPE 9 — validée le 02/11/2026

- Livrable : `docs\08_INTERFACE_REACT.md` — ✅ **validé le 02/11/2026**.
- Contenu : principes d'interface et charte **noir / rouge / blanc** (D23), navigation et **18 routes**, visibilité du menu dérivée de `Me.droits`, **14 écrans IHM-01 à IHM-14**, **18 parcours UC-01 à UC-18**, deux parcours critiques (clôture tardive, conflit de version), composants partagés, mapping `problem+json` → messages, accessibilité, performance perçue, traçabilité CDC.
- Choix structurants : aucun endpoint nouveau (les **54** de l'ÉTAPE 8 suffisent), aucune règle métier recalculée côté client (AR-05), aucun écrasement silencieux en cas de `409 VERSION_OBSOLETE` (T8-05), pagination 50 / 200 (T8-04), tri serveur uniquement (T8-08).
- Points **A9-01 à A9-12** tranchés le 02/11/2026 → **D58 à D69** ; **P1** et **P5** restent ouverts sur le **sens métier** (l'affichage est décidé, pas la signification).
- Restent ouverts et **non bloquants** : **P1, P2, P3, P5** (métier) et **P11, P12** (ÉTAPES 13-14).
- **Aucun code, aucune dépendance, aucun dossier `client\`, `server\` ou `prisma\`, aucune base créés.**

### ÉTAPE 10 — validée le 02/11/2026

- Livrable : `docs\09_ROLES_ET_PERMISSIONS.md` — ✅ **validé le 02/11/2026**.
- Contenu : les **4 rôles** et le modèle compte / fiche employé, les **principes d'autorisation** et l'ordre d'évaluation d'une requête, la **matrice fonctionnelle** des droits, les **périmètres** de lecture / écriture / création / duplication / suppression, la **correspondance des 54 endpoints** avec les 4 rôles, les **11 fonctions d'autorisation** serveur et leurs algorithmes, le **cycle de vie** des comptes et des rôles, les droits `Me`, les **événements d'audit**, **54 cas de test** d'autorisation pour l'ÉTAPE 12.
- Choix structurants : le **serveur décide** et l'interface ne fait que masquer (EF-03), **refus par défaut**, **politique centralisée**, **non-divulgation** `404` / `403`, **aucun rôle codé en dur** dans l'interface (D63), périmètres **recalculés** à chaque lecture (D29).
- **Aucun point A10 ouvert** : conformément au choix du 02/11/2026, seules les règles déjà validées sont appliquées. **Quatre zones grises** sont signalées et **non tranchées** (dernier administrateur, effet d'un changement de rôle sur une session ouverte, tâches d'un employé désactivé, auto-modification du rôle d'un admin) ; leur report **avant l'ÉTAPE 13 (sécurité)** est accepté.
- Validation du 02/11/2026 : les **7 points** de la validation demandée sont acceptés → **ÉTAPE 11 — Reprise des données Excel** peut être engagée.
- **Aucun code, aucune dépendance, aucun dossier `client\`, `server\` ou `prisma\`, aucune base créés.**

### ÉTAPE 11 — validée le 02/11/2026

- Livrable : `docs\10_REPRISE_DES_DONNEES.md` — ✅ **validé le 02/11/2026**.
- Contenu : le principe de **non-reprise des 95 actions** (D11), l'**inventaire source → destination**, le **contenu exact des 55 lignes de référence** (paramètre 1, urgences 4, importances 4, matrice 13, actions à prendre 3, éléments 6, fériés 15, départements 9), les **volumes attendus au démarrage**, les **comptes initiaux**, l'**ordre et l'idempotence** du seed, la **procédure de reprise**, **12 critères d'acceptation**, la **sauvegarde / restauration** et la traçabilité.
- Choix structurants : **0 tâche**, **0 commentaire**, **0 partenaire**, **0 employé** (hors admin initial) au démarrage ; **55 lignes de référence** seulement ; seed **idempotent** et transactionnel ; **aucune dépendance au classeur Excel** à l'exécution ; **aucun mot de passe en clair**.
- Points tranchés le 02/11/2026 : **A11-01 → D70** — premier compte **nominatif** `ADMIN` (directeur ou responsable informatique), fiche employé et changement de mot de passe obligatoire ; **A11-02 → D71** — comptes du personnel créés **manuellement** par l'admin après la mise en service, **aucun import nominatif** ; **A11-03** (seed idempotent, une transaction, exécution manuelle, contrôles bloquants) et **A11-04** (classeur archivé en lecture seule avec checksum) **acceptés**.
- **P2** (fériés 2027-2028) reste ouvert ; **R5 (11 départements) vs D40 (9 observés)** est explicitée : les **2 libellés manquants** ne sont pas inventés et seront ajoutés par l'admin au référentiel.
- **Reste à fournir avant l'ÉTAPE 14** (non bloquant) : nom, prénom et identifiant du titulaire du compte `ADMIN`.
- **Aucun code, aucun script, aucune migration, aucun dossier `client\`, `server\` ou `prisma\`, aucune base créés.**

### ÉTAPE 12 — validée le 02/11/2026

- Livrable : `docs\11_STRATEGIE_ET_PLAN_DE_TESTS.md` — ✅ **validé le 02/11/2026**.
- Contenu : la **stratégie de test** (pyramide, ciblage sur le risque, déterminisme, isolation), les **niveaux et outils** (Vitest, Supertest, Testing Library, Playwright), les **environnements**, le **socle technique**, la **couverture ciblée**, le **plan par domaine** (moteurs, 54 endpoints, 62 cas d'autorisation, 14 écrans, seed, audit, non fonctionnel), la **nomenclature** et le **gabarit des cas**, les **critères d'entrée et de sortie**, la **gestion des anomalies**, la **recette utilisateur** et la **traçabilité**.
- **Socle technique opérationnel** : `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run test:unit` (6 tests) et `npm run test:integration` (2 tests + 2 ignorés sans base) **passent** ; Playwright est configuré avec un scénario `fixme`.
- **Décisions D72 → D75** : **D72** — le **dernier administrateur actif** ne peut pas perdre son rôle ni être désactivé (`409 DERNIER_ADMIN`) ; **D73** — un changement de rôle prend effet **immédiatement** à la requête suivante ; **D74** — la désactivation d'un employé **annule ses tâches non commencées** ; **D75** — un `ADMIN` ne peut pas modifier **son propre rôle** ni se désactiver (`403 AUTO_MODIFICATION_INTERDITE`).
- **D74 précisée et confirmée** : seules les tâches où l'employé est **assigné** et dont le statut calculé est **`A faire`** sont annulées ; les tâches `Retard`, `En cours`, `Achevée` et `Suspendue` restent inchangées.
- **Aucune règle métier, aucune route, aucun composant, aucun schéma Prisma, aucune migration, aucune base de production créés.**
#   t o d o  
 #   t o d o  
 #   t o d o _ l i s t  
 