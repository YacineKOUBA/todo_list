# Livrable 08 — ÉTAPE 9 : Interface React

| | |
|---|---|
| **Projet** | Application web de gestion des TODOLIST — GD Trading |
| **Livrable** | 08 (méthode M8) |
| **Étape** | **9 — Interface React** |
| **Documents de référence** | `docs\01_ANALYSE_FONCTIONNELLE.md` (ÉTAPES 1-2) · `docs\02_EXIGENCES_DIRECTEUR.md` (ÉTAPE 3) · `docs\03_COMPARAISON_EXCEL_EXIGENCES.md` (ÉTAPE 4) · `docs\05_CAHIER_DES_CHARGES_FONCTIONNEL.md` (ÉTAPE 5) · `docs\04_ARCHITECTURE_APPLICATION.md` (ÉTAPE 6) · `docs\06_MODELE_DE_DONNEES.md` (ÉTAPE 7) · `docs\07_API.md` (ÉTAPE 8) |
| **Décisions de référence** | **DÉCISIONS 1 à 75** · **AR-01 à AR-13** · **T8-01 à T8-15** — D70 et D71 (comptes initiaux) et D72 → D75 (dernier admin, auto-modification, effet immédiat du rôle) sont postérieures à ce document ; elles ajoutent des états d'action sans changer la structure des écrans |
| **Stack** | React + Vite + TypeScript · React Router · TanStack Query · React Hook Form + Zod · CSS Modules (D9, AR-02) |
| **Périmètre de l'étape** | Écrans, parcours, navigation, états et règles d'affichage. **Aucun fichier de code.** |
| **Date de rédaction** | 02/11/2026 |
| **Statut** | ✅ **VALIDÉE le 02/11/2026** — écrans, parcours et états arrêtés, points **A9-01 à A9-12** tranchés (**D58 à D69**), **aucun code écrit**, aucun dossier `client\` créé |

> **Règle M2** : ce document **traduit** les exigences validées, l'architecture validée et le contrat d'API validé en **écrans et comportements d'interface**. Il ne prend **aucune décision métier** nouvelle.
> **Règle M5** : les points qui exigeaient un arbitrage ont été numérotés **A9-01 à A9-12** puis tranchés le 02/11/2026 (**D58 à D69**, section 13).
> **Aucun code n'a été écrit. Aucune dépendance n'a été installée. Aucun dossier `client\`, `server\` ou `prisma\` n'a été créé.**

---

## 1. Objet et périmètre

### 1.1 Objet

Décrire **ce que l'utilisateur voit et fait**, écran par écran, pour les **14 écrans IHM-01 à IHM-14** du cahier des charges, en s'appuyant **exclusivement** sur les **54 endpoints** du contrat d'API validé.

Le document répond à quatre questions :

1. **Où** l'utilisateur arrive et comment il circule (navigation, routes, visibilité selon le rôle) ;
2. **Ce qui est affiché** sur chaque écran, avec quelles données et quelles valeurs calculées ;
3. **Ce qui est actionnable**, sous quelles conditions, et ce qui est volontairement **absent** ;
4. **Ce qui se passe** en cas de vide, de chargement, d'erreur, de conflit de version ou de session expirée.

### 1.2 Ce que ce document ne fait pas

- Il **ne crée aucun fichier de code**, aucun composant, aucun style, aucun `package.json`.
- Il **n'installe aucune dépendance** (React, React Router, TanStack Query, etc.).
- Il **ne crée aucun dossier** `client\`, `server\` ou `prisma\`.
- Il **ne définit pas** les composants serveur, les contrôleurs ou les schémas Prisma → **ÉTAPES 7 et 8, déjà validées**.
- Il **ne définit pas** la politique de mots de passe, de session et de verrouillage → **ÉTAPE 13**.
- Il **ne rédige pas** la procédure d'installation et de déploiement → **ÉTAPE 14**.
- Il **ne définit pas** les tests automatisés, mais il fixe les comportements que l'ÉTAPE 12 devra vérifier.
- Il **ne tranche aucun** point **P1, P2, P3, P5, P11, P12** restés ouverts.

### 1.3 Statut de chaque énoncé

| Marque | Signification |
|---|---|
| ✅ **DÉCIDÉ** | Découle d'une décision validée (D1 → D69), d'une exigence (EF-xx), d'une règle (RM-xx) ou du contrat d'API. **Applicable tel quel.** |
| 🔧 **PROPOSÉ** | Choix d'ergonomie ou de technique d'interface. **Ne crée aucune règle métier.** Appliqué sauf objection. |
| ❓ **À VALIDER** | Dépend d'un arbitrage non rendu. Référence **Pxx**. **Non appliqué tant que non tranché.** |

> **État au 02/11/2026** : plus aucun point **A9-xx** n'est ouvert — ils ont tous été tranchés (**D58 à D69**, section 13). Seuls les points métier **P1, P2, P3, P5, P11, P12** restent ouverts et n'empêchent pas l'implémentation des écrans.

---

## 2. Principes d'interface

### 2.1 Règles non négociables

Ces règles viennent du cahier des charges (§7 et §8) et de la **DÉCISION 23**. Elles ne sont pas des propositions.

| # | Règle | Source |
|---|---|---|
| 1 | Un écran n'affiche **que** ce que le rôle est autorisé à voir. | CDC §7 |
| 2 | Une action non autorisée est **absente ou désactivée** — et de toute façon **refusée par le serveur**. | CDC §3.2, §7, architecture §11 |
| 3 | Les états vides sont **explicites**, jamais un écran blanc. | CDC §7 |
| 4 | Les erreurs de validation s'affichent **près du champ** concerné. | CDC §7 |
| 5 | Toute action destructrice (suppression, annulation, suspension) demande une **confirmation**. | CDC §7 |
| 6 | Palette **strictement** limitée à **noir / rouge / blanc** — aucun vert, jaune, orange, bleu. | D23, CDC §8 |
| 7 | Les statuts sont distingués par **libellé + icône + position**, jamais par la couleur seule. | D23, CDC §8 |
| 8 | Le **rouge** est réservé au **retard** et aux **alertes**. | D23, CDC §8 |
| 9 | Dates au format **`JJ/MM/AAAA`**, heures **`HH:MM`**, langue **française**. | CDC §8 |
| 10 | L'interface **ne calcule jamais** un statut, une priorité ou un droit « de référence » : elle affiche la valeur renvoyée par l'API. | AR-05, architecture §11 |

> **Point d'attention** : la règle 10 est structurante. Des filtres ou des compteurs calculés côté client **à partir d'une page** seraient faux (la pagination ne charge que 50 lignes). Tout compteur affiché provient soit de `pagination.total`, soit d'un appel dédié, jamais d'un `filter()` sur la page courante.

### 2.2 Charte graphique — noir, rouge, blanc

| Élément | Règle | Statut |
|---|---|---|
| Fond principal | **Noir** `#000000` | ✅ D23 |
| Surfaces secondaires | Noir légèrement éclairci pour distinguer les blocs **sans introduire de couleur** (échelle de gris neutre) | 🔧 |
| Zones de lecture dense (tableau) | **Blanc** possible, texte **noir** | ✅ CDC §8 |
| Texte sur fond noir | **Blanc** | ✅ D23 |
| Titres, boutons principaux, alertes, retards | **Rouge** | ✅ D23 |
| Autres couleurs | **Interdites** | ✅ D23 |
| Progression | Barre **rouge** sur 0-100 % | ✅ CDC §8 |
| Rappel échu | Signal **rouge** | ✅ CDC §8 |
| Rappel imminent | Signal **distinct sans couleur supplémentaire** (contour, préfixe « Bientôt », icône différente) | ✅ CDC §8 |

**Jetons de couleur** (noms imposés par l'architecture §12, valeurs proposées) :

| Jeton | Valeur | Usage |
|---|---|---|
| `--gd-noir` | `#000000` | Fond principal, texte sur blanc |
| `--gd-blanc` | `#FFFFFF` | Texte sur noir, surfaces de lecture |
| `--gd-rouge` | `#D32027` | Actions principales, retards, alertes |
| `--gd-rouge-clair` | `#FF4D53` | Rouge sur fond noir (contraste) |
| `--gd-gris-900` | `#121212` | Surface de carte sur fond noir |
| `--gd-gris-700` | `#2A2A2A` | Bordures, séparateurs |
| `--gd-gris-400` | `#8A8A8A` | Texte secondaire sur noir |
| `--gd-gris-200` | `#D6D6D6` | Bordures sur fond blanc |

> Les gris sont **neutres** : ils ne constituent pas une couleur supplémentaire au sens de la D23. Toute nuance doit rester à composantes `R = G = B`.

**Typographie** : une seule famille système sans empattement, suffisamment lisible en 14 px minimum sur tableau. Aucune police décorative.

### 2.3 Statuts — libellé + icône

| Code API | Libellé affiché | Icône | Traitement visuel |
|---|---|---|---|
| `A_FAIRE` | `A faire` | ○ | Blanc sur noir / noir sur blanc, contour neutre |
| `EN_COURS` | `En cours` | ▶ | Blanc sur noir / noir sur blanc, contour neutre |
| `RETARD` | `Retard` | ▲ | **Rouge**, préfixe de ligne rouge, libellé rouge |
| `ACHEVEE` | `Achevée` | ✓ | Blanc, **barré** sur le libellé de la tâche |
| `ANNULEE` | `Annulée` | ✕ | Blanc atténué, libellé **barré** |
| `SUSPENDUE` | `Suspendue` | ⏸ | Blanc atténué, **sans barré** |

> **✅ D58** : ces six glyphes sont repris **tels quels** du CDC §8 ; ils sont validés le 02/11/2026 et applicables.
> **Règle de repli** : si l'icône n'est pas rendue (police, lecteur d'écran), le **libellé texte reste toujours présent**. Aucun statut ne doit être identifiable par la seule icône.

**Ordre d'affichage** : `Retard` → `A faire` → `En cours` → `Suspendue` → `Annulée` → `Achevée` (le travail à faire et le retard d'abord, l'historique à la fin). ✅ **D64**.

### 2.4 Formats

| Donnée | Format | Note |
|---|---|---|
| Date métier | `JJ/MM/AAAA` | `2026-11-02` → `02/11/2026` |
| Horodatage | `JJ/MM/AAAA HH:MM` | Fuseau `Africa/Algiers` (D30) |
| Heure limite | `HH:MM` | `16:30` (D18) |
| Progression | entier + `%` | `null` → `—` |
| Score de priorité | entier 0-12 | Affiché discrètement (D67) |
| Fréquence de rappel | `N jour(s)` | Libellé « Rappel tous les N jours » (D62), sens métier encore ouvert (**P5**) |
| Durées | `N jour(s)` | Libellés `G` / `E` (D61), signification encore ouverte (**P1**) |

> **Aucun calcul de date côté client.** L'API renvoie des dates `YYYY-MM-DD` **déjà exprimées dans le fuseau métier** ; l'interface ne fait que **formater**. Aucun `new Date()` suivi d'un décalage local ne doit produire un jour différent.

### 2.5 Règles générales d'écran

| Sujet | Règle | Statut |
|---|---|---|
| Chargement initial | Squelette de tableau (lignes grises), pas de spinner plein écran | 🔧 |
| Rechargement | Les données précédentes restent affichées, avec un indicateur discret | 🔧 |
| Erreur de chargement | Bandeau d'erreur + bouton « Réessayer » ; les données précédentes restent visibles | 🔧 |
| Pagination | Boutons « Précédent / Suivant » + « Page X sur Y » ; jamais de défilement infini | 🔧 (T8-04) |
| Tri | Clic sur l'en-tête de colonne ; un seul tri actif ; indicateur ▲ / ▼ | 🔧 |
| Sélection multiple | **Aucune** en V1 : chaque action porte sur une tâche | 🔧 |
| Confirmation | Modale nommant **la tâche concernée** et l'effet de l'action | 🔧 |
| Notifications | Bandeau en haut à droite, fermable, une seule à la fois par nature | 🔧 |
| Impression | Non traitée en V1 | 🔧 |

---

## 3. Navigation et structure de la SPA

### 3.1 Routes

Routes **proposées** (React Router). Elles sont **côté client** : elles n'ajoutent aucun endpoint et ne changent pas `/api/v1`.

| Route | Écran | Rôles | Accès direct |
|---|---|---|---|
| `/connexion` | IHM-01 Connexion | Public | Toujours accessible si non authentifié |
| `/` | Redirection vers l'écran d'atterrissage du rôle (D59) | Authentifié | — |
| `/aujourdhui` | IHM-02 Mes tâches du jour | Avec fiche employé | Oui |
| `/autres-taches` | IHM-03 Mes autres tâches | Avec fiche employé | Oui |
| `/mes-taches` | IHM-04 Toutes mes tâches | Avec fiche employé | Oui |
| `/taches/:id` | IHM-05 Détail d'une tâche | Selon visibilité de la tâche | Oui |
| `/taches/nouvelle` | IHM-06 Formulaire — création | `ADMIN`, `RESPONSABLE`, `EMPLOYEE` | Oui |
| `/taches/:id/modifier` | IHM-06 Formulaire — modification | Selon droits d'écriture | Oui |
| `/taches/:id/dupliquer` | IHM-07 Duplication | `ADMIN`, `RESPONSABLE`, `EMPLOYEE` | Oui |
| `/service` | IHM-08 Mon service | `RESPONSABLE` | Oui |
| `/toutes-les-taches` | IHM-09 Tous les services / Toutes les tâches | `ADMIN`, `CONSULTANT` | Oui |
| `/referentiels` | IHM-10 Référentiels | `ADMIN` | Oui |
| `/comptes` | IHM-11 Comptes et rôles | `ADMIN` | Oui |
| `/parametres` | IHM-12 Paramètres | `ADMIN` | Oui |
| `/audit` | IHM-13 Journal d'audit | `ADMIN` | Oui |
| `/profil` | IHM-14 Mon profil | Authentifié | Oui |
| `/interdit` | Écran technique `403` | Authentifié | Oui |
| `*` | Écran technique `404` | Authentifié | Oui |

> **✅ D63** : **IHM-09 est partagé** entre `ADMIN` (écriture) et `CONSULTANT` (lecture seule intégrale, actions d'écriture absentes). C'est la seule lecture cohérente avec EF-46 / EF-07, **UC-17** et `GET /tasks?vue=toutes`.
> **✅ D59** : écran d'atterrissage par rôle — `EMPLOYEE` → `/aujourdhui`, `RESPONSABLE` → `/service`, `ADMIN` → `/toutes-les-taches`, `CONSULTANT` → `/toutes-les-taches`.

### 3.2 Gabarit (layout)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  GD TRADING · TODOLIST                      Jean DUPONT · RESPONSABLE   │  ← en-tête
│                                             COMPTABILITE      [Profil]  │
├──────────────────┬───────────────────────────────────────────────────────┤
│  MES TÂCHES      │                                                       │
│  ▸ Aujourd'hui   │                                                       │
│  ▸ Autres tâches │                  zone de contenu                       │
│  ▸ Toutes        │                                                       │
│                  │                                                       │
│  SERVICE         │                                                       │
│  ▸ Mon service   │                                                       │
│                  │                                                       │
│  ADMINISTRATION  │                                                       │
│  ▸ Référentiels  │                                                       │
│  ▸ Comptes       │                                                       │
│  ▸ Paramètres    │                                                       │
│  ▸ Audit         │                                                       │
│                  │                                                       │
│  [Déconnexion]   │                                                       │
└──────────────────┴───────────────────────────────────────────────────────┘
```

| Zone | Contenu | Statut |
|---|---|---|
| En-tête | Nom du produit, **nom complet + rôle + département** de l'utilisateur connecté, accès au profil | 🔧 |
| Barre latérale | Menu groupé, **filtré par droits** (section 3.3) | 🔧 |
| Zone de contenu | En-tête d'écran (titre + actions principales) puis contenu | 🔧 |
| Pied de page | **Aucun** en V1 | 🔧 |

**Largeur** : conception **desktop-first**, cible **1280 px et plus** (postes du réseau local). À partir de 1024 px, la barre latérale se réduit en icônes avec libellés au survol. En dessous de 1024 px, l'application reste utilisable mais **n'est pas optimisée** (D60).

### 3.3 Visibilité du menu selon `Me.droits`

Le menu est construit **à partir de l'objet `Me`** renvoyé par `GET /me`. Aucune règle de rôle n'est codée en dur dans les composants.

| Entrée de menu | Condition d'affichage |
|---|---|
| Aujourd'hui / Autres tâches / Toutes mes tâches | `Me.employe != null` |
| Nouvelle tâche | `droits.creerPourAutrui || droits.creerPourSonService` |
| Mon service | `droits.voirTachesService` |
| Toutes les tâches (`ADMIN`) | `droits.voirToutesLesTaches && !droits.lectureSeule` |
| Toutes les tâches (`CONSULTANT`) | `droits.voirToutesLesTaches && droits.lectureSeule` |
| Référentiels | `droits.gererReferentiels` |
| Comptes | `droits.gererComptes` |
| Paramètres | `droits.gererReferentiels` |
| Audit | `droits.consulterAudit` |
| Profil | Toujours |

> **Règle** : masquer une entrée **n'est pas** une sécurité. Chaque route refait l'appel API et **affiche l'écran `403`** si le serveur refuse. Un utilisateur qui force une URL ne doit jamais obtenir de données.

### 3.4 Garde de route

| Situation | Comportement |
|---|---|
| Non authentifié, route protégée | Redirection vers `/connexion` **en mémorisant la route demandée** ; retour après connexion |
| Authentifié, route interdite à son rôle | Affichage de `/interdit` (403), **sans** appel API inutile |
| Ressource inexistante ou hors périmètre (`404` API) | Affichage de l'écran `404` de l'application, pas de l'écran d'erreur serveur |
| Session expirée (`401` en cours d'usage) | Modale « Session expirée » → retour à `/connexion` (section 8.6) |
| `doitChangerMotDePasse = true` | Redirection forcée vers `/profil`, changement de mot de passe obligatoire (🔧, détail **ÉTAPE 13**) |

---

## 4. Écrans

> Chaque écran suit le même plan : **objectif · rôles · contenu · données · actions · états · règles d'affichage**.
> Les endpoints cités sont ceux du contrat validé (`docs\07_API.md`). **Aucun endpoint nouveau n'est introduit.**

---

### 4.1 IHM-01 — Connexion

| | |
|---|---|
| **Route** | `/connexion` |
| **Rôles** | Public |
| **Objectif** | Ouvrir une session avec un identifiant et un mot de passe |

**Contenu**

- Nom du produit, rappel « Application interne GD Trading ».
- Champ **Identifiant** (autocomplétion désactivée).
- Champ **Mot de passe** (masqué, œil d'affichage temporaire).
- Bouton principal **Se connecter** (rouge).
- Zone de message d'erreur **générique** au-dessus du bouton.
- Pied discret : version de l'application.

**Données**

| Action | Endpoint |
|---|---|
| Se connecter | `POST /auth/login` |
| Récupérer le jeton CSRF si la stratégie le demande | `GET /auth/csrf` (**ÉTAPE 13**) |

**États**

| État | Affichage |
|---|---|
| Initial | Formulaire vide, focus sur l'identifiant |
| Envoi | Bouton désactivé + libellé « Connexion… » |
| Échec | Message **générique** : « Identifiant ou mot de passe incorrect. » — **jamais** « ce compte n'existe pas » |
| Compte désactivé | **Même message générique** (aucune divulgation) |
| Serveur indisponible | « Service momentanément indisponible. Réessayez dans un instant. » |
| Succès | Chargement de `GET /me`, puis redirection vers la route mémorisée ou l'écran d'atterrissage |

**Règles**

- Aucune inscription, aucun lien « mot de passe oublié » : la remise des mots de passe est **administrative** (**P12**, ÉTAPE 13).
- Le mot de passe n'est **jamais** mémorisé dans le navigateur (`autocomplete="off"`, pas de `localStorage`).
- Le formulaire est soumis par la touche **Entrée**.

---

### 4.2 IHM-02 — Mes tâches du jour

| | |
|---|---|
| **Route** | `/aujourdhui` |
| **Rôles** | `EMPLOYEE`, `RESPONSABLE`, `ADMIN` (avec fiche employé) |
| **Objectif** | Voir et traiter les tâches **quotidiennes du jour** qui me sont assignées |

**Contenu**

1. **Bandeau d'en-tête** : date du jour en français (`lundi 2 novembre 2026`), heure limite `16:30`, nombre de tâches du jour.
2. **Compteurs** (issus de `pagination.total` par appel filtré, jamais d'un comptage local) :
   - à faire,
   - en cours,
   - en retard (rouge),
   - achevées.
3. **Liste** des tâches du jour, **réordonnée à l'affichage** par statut puis échéance (D64) — aucun tri serveur sur un champ calculé (T8-08).
4. **État vide** : « Aucune tâche prévue aujourd'hui. » + bouton **Nouvelle tâche** si l'utilisateur peut créer.

**Données**

| Usage | Endpoint | Paramètres |
|---|---|---|
| Liste | `GET /tasks` | `vue=mes-taches-du-jour`, `page`, `taille=50`, `tri=score:desc` (seul tri serveur autorisé ici : `statut` est calculé et non triable, T8-08) |
| Compteurs | `GET /tasks` | même `vue` + `statut=<code>` avec `taille=1` (lecture de `pagination.total`) |
| Ouverture | navigation vers `/taches/:id` | — |
| Clôture rapide | `POST /tasks/:id/close` | — |
| Commentaire rapide | `POST /tasks/:id/comments` | — |

**Chaque ligne affiche**

| Élément | Source |
|---|---|
| Libellé | `libelle` |
| Statut (icône + libellé) | `statut` |
| Échéance | `16:30` du jour (`dateAction`) |
| Progression | `progression` (0 / 100 pour une quotidienne, **D43**) |
| Priorité | `priorite.libelle` (+ score discret, D67) |
| Pilote / élément | `pilote`, via le détail ou la liste selon le DTO |
| Signal de rappel | `rappelEchu` (rouge) / `rappelImminent` (distinct) |
| Actions | **Ouvrir**, **Clôturer**, **Commenter** |

**Actions**

| Action | Condition | Confirmation |
|---|---|---|
| Ouvrir | Toujours | Non |
| Clôturer | Tâche non clôturée, non annulée, droit d'écriture | Si **retard** : modale exigeant le **motif** (D15, D56) |
| Commenter | Droit d'écriture | Non |
| Créer | Droit de création | Non |

**Règles d'affichage**

- Une tâche quotidienne **non clôturée** à 16:30 devient `Retard` : l'interface ne le calcule pas, elle **affiche** le statut renvoyé. Après 16:30, un rafraîchissement (ou le retour sur l'écran) suffit à voir le changement.
- La **pause 12:00-13:00** est **affichée** dans l'en-tête, sans effet sur les calculs (D18).
- Une tâche `Achevée` reste visible **le jour même** avec son heure de clôture, puis sort de la vue.
- Aucun affichage de pourcentage intermédiaire pour une quotidienne : **0 %** ou **100 %** (**D43**).

---

### 4.3 IHM-03 — Mes autres tâches

| | |
|---|---|
| **Route** | `/autres-taches` |
| **Rôles** | `EMPLOYEE`, `RESPONSABLE`, `ADMIN` (avec fiche employé) |
| **Objectif** | Consulter les tâches **de nature `AUTRE`** qui me sont assignées et suivre leur avancement |

**Contenu**

- Liste des tâches `AUTRE` assignées, **non clôturées et non annulées**.
- Filtres rapides : statut, élément, échéance (`echeanceDu` / `echeanceAu`), rappel échu / imminent.
- Tri par défaut : **échéance croissante** (D64).
- État vide : « Aucune autre tâche ne vous est assignée. » + **Nouvelle tâche**.

**Données** : `GET /tasks?vue=mes-autres-taches&page=1&taille=50`, puis `PATCH /tasks/:id/progress` pour l'avancement, `POST /tasks/:id/close`, `POST /tasks/:id/comments`.

**Chaque ligne** : libellé, statut, échéance (`dateFinPrevue`), progression, priorité, rappel.

**Règles**

- C'est une **consultation de tâches déjà assignées** : aucun « vivier » de tâches libres (D19).
- La progression est **modifiable** ici par un curseur ou un champ 0-100, avec **priorité au manuel** (D4, RM-02). Enregistrement explicite, pas de sauvegarde au vol.
- Une tâche en retard affiche `Retard` en rouge ; la clôture exige un motif.

---

### 4.4 IHM-04 — Toutes mes tâches

| | |
|---|---|
| **Route** | `/mes-taches` |
| **Rôles** | Avec fiche employé (tous rôles concernés) |
| **Objectif** | Vue complète et filtrable de **toutes** mes tâches (assignées + pilotées + créées, A13/D16) |

**Contenu**

1. **Barre de filtres** (repliable) :

| Filtre | Contrôle | Valeurs |
|---|---|---|
| Vue | sélecteur | `mes-taches` (défaut), `mes-taches-du-jour`, `mes-autres-taches` |
| Statut | cases à cocher | 6 codes |
| Nature | sélecteur | `QUOTIDIENNE`, `AUTRE` |
| Élément | sélecteur | `GET /elements` |
| Urgence / Importance | sélecteurs | `GET /urgencies`, `GET /importances` |
| Échéance du / au | deux champs date | — |
| Rappel échu | case | booléen |
| Rappel imminent | case | booléen |
| Libellé | champ texte | recherche « contient » |
| Service porteur | sélecteur | `GET /departments` |

2. **Tableau** paginé : libellé, nature, statut, échéance, progression, priorité, pilote, service porteur, rappel.
3. **Tri** sur les seuls champs autorisés : `dateAction`, `dateDebut`, `dateFinPrevue`, `dateFin`, `libelle`, `creeLe`, `modifieLe`, `score` (T8-03/T8-08). Les en-têtes des champs **calculés non triables** (statut, progression, priorité, rappel) ne sont **pas cliquables**.

**Données** : `GET /tasks` avec les paramètres de la section 6.2 de l'API, `page`, `taille`.

**États**

| État | Affichage |
|---|---|
| Aucun résultat | « Aucune tâche ne correspond à ces filtres. » + **Réinitialiser les filtres** |
| Filtre invalide (`422`) | Message près du filtre concerné |
| Plus de 50 000 tâches ouvertes | Non traité en V1 (limite documentée API §12) |

**Règles**

- Les filtres sont **conservés dans l'URL** (`?statut=RETARD&page=2`) : un rechargement ou un partage de lien restitue la même vue. 🔧
- Aucun tri client : le tri est **serveur**, pour rester exact au-delà de la page.
- Le lien « Nouvelle tâche » n'apparaît que si `creerPourAutrui || creerPourSonService`.

---

### 4.5 IHM-05 — Détail d'une tâche

| | |
|---|---|
| **Route** | `/taches/:id` |
| **Rôles** | Selon la visibilité de la tâche (RM-10) |
| **Objectif** | Voir **tous** les champs, les valeurs calculées, le motif, les commentaires et l'historique ; agir selon les droits |

**Contenu — blocs**

| Bloc | Contenu |
|---|---|
| **En-tête** | Libellé, badge de statut, priorité, actions principales |
| **Identification** | Nature, acteur (`GD_TRADING` / `PARTENAIRE`), élément, date d'action |
| **Dates** | `dateDebut`, `dateFinPrevue` (absente pour une quotidienne), `dateFin`, `clotureLe` |
| **Responsables** | Pilote (employé ou partenaire), exécutant + son département, **service porteur** calculé (D29), créé par, attribué par |
| **Priorité** | Urgence, importance, **score**, **fréquence de rappel**, libellé de priorité, action à prendre (déduite de la priorité) |
| **Avancement** | Progression (manuelle ou calculée), **durées G / E**, anomalie de durée |
| **Clôture** | Motif de non-achèvement (si présent), date et heure de clôture |
| **Retard** | Jours de retard, motif saisi par l'exécutant, date de fin estimée, état de validation ; panneau de justification (exécutant) et de validation (admin) — **D82** |
| **Commentaires** | Fil chronologique, auteur, date, ajout d'un commentaire |
| **Historique** | Événements réduits : type, auteur, date, champs modifiés (D53) |

**Données**

| Usage | Endpoint |
|---|---|
| Détail | `GET /tasks/:id` |
| Commentaires | `GET /tasks/:id/comments` |
| Ajout de commentaire | `POST /tasks/:id/comments` |
| Historique | `GET /tasks/:id/history` |
| Statut manuel | `PATCH /tasks/:id/status` |
| Progression | `PATCH /tasks/:id/progress` |
| Justification du retard | `PATCH /tasks/:id/retard` |
| Validation du retard | `PATCH /tasks/:id/retard/validation` |
| Clôture | `POST /tasks/:id/close` |
| Modification | `PATCH /tasks/:id` |
| Suppression | `DELETE /tasks/:id` |

**Actions et conditions**

| Action | Visible si | Effet / confirmation |
|---|---|---|
| **Modifier** | Droit d'écriture sur la tâche | Ouvre `/taches/:id/modifier` |
| **Clôturer** | Droit d'écriture, tâche non clôturée | Modale de clôture ; **motif obligatoire si tardive** ; le **retard doit être validé** au préalable (D82) |
| **Justifier le retard** | Exécutant (assigné ou pilote employé) ou admin, tâche non clôturée, retard non validé | Saisie du **motif** ; le formulaire disparaît après validation |
| **Valider le retard** | Admin, créateur ou responsable habilité, retard non validé | Saisie de la **date de fin estimée** ; si le motif est absent, alerte et confirmation explicite « Valider sans motif — pénalité conservée » |
| **Annuler** | Droit d'écriture (y compris sur une tâche clôturée : le statut manuel reste prioritaire — CA-12) | Confirmation « La tâche sera marquée Annulée et ne comptera plus comme à traiter. » |
| **Suspendre** | Droit d'écriture (même condition) | Confirmation |
| **Reprendre** | Tâche `SUSPENDUE` | Retire le statut manuel (`statutManuel = null`) |
| **Dupliquer** | Droit de création dans le périmètre | Ouvre `/taches/:id/dupliquer` |
| **Supprimer** | `supprimerTouteTache` ou (`supprimerTachesAttribuees` **et** `attribuePar.id = moi`) | Confirmation **explicite** avec le libellé ; suppression logique, irréversible en V1 (D36, D51) |
| **Commenter** | Droit d'écriture | Ajout immédiat, statut inchangé |

**Règles d'affichage**

- **Aucune réouverture** n'est proposée (D51) : une tâche `Achevée` n'affiche **pas** « Clôturer » et ne peut pas revenir à un statut calculé antérieur. Le statut **manuel** `Annulée` / `Suspendue` reste toutefois possible, car il est prioritaire sur le calcul (CA-12).
- `Annulée` et `Suspendue` sont **manuels** et **prioritaires** : ils masquent le calcul de retard (D3). L'écran affiche le statut tel que renvoyé.
- Le panneau **Retard** suit le workflow **D82** : l'exécutant saisit le motif ; l'admin valide et fixe la date de fin estimée ; une validation **sans motif** demande une confirmation explicite et affiche « Retard validé sans motif : la pénalité de 10 points est conservée ».
- La section **Clôturer** avertit si le retard n'est pas encore validé ; le serveur refuse alors la clôture (`422 RETARD_NON_VALIDE`).
- Le **motif** est visible par **tous les ayants droit**, `CONSULTANT` compris (D52).
- L'historique affiché est **réduit** : jamais de valeurs avant / après pour un non-admin (D53).
- `anomalieDuree = true` affiche un **avertissement rouge** : « La date de fin précède la date de début. » (RM-06).
- Les libellés `Durée G.` / `Durée E.` sont affichés tels quels avec une infobulle « Signification à confirmer » (**D61**) ; la signification métier reste ouverte (**P1**).
- La valeur affichée est `X jours (dont Y jours de retard)` : pour une tâche **clôturée**, `X = date de fin réelle − date de début` (y compris en cas de clôture anticipée) ; pour une tâche **ouverte**, `X = échéance prévue − date de début + Y` (échéance = date d'action pour une tâche quotidienne sans date de fin prévue). La parenthèse n'apparaît que si `Y > 0`.

---

### 4.6 IHM-06 — Formulaire de tâche (création et modification)

| | |
|---|---|
| **Route** | `/taches/nouvelle` · `/taches/:id/modifier` |
| **Rôles** | `ADMIN` partout · `RESPONSABLE` son service + lui-même · `EMPLOYEE` lui-même |
| **Objectif** | Créer ou modifier une tâche sans jamais contourner les règles serveur |

**Structure en sections**

| Section | Champs |
|---|---|
| **Nature** | `nature` — `QUOTIDIENNE` / `AUTRE` — **immuable en modification** (D55) |
| **Identification** | `libelle` (obligatoire, 255 max — D46), `elementId`, `acteur` (`GD_TRADING` / `PARTENAIRE`) |
| **Affectation** | `assigneAEmployeId` (tâche `GD_TRADING`) ou `assigneAPartenaireId` (tâche `PARTENAIRE`), `piloteEmployeId` / `pilotePartenaireId` (D81) |
| **Dates** | `dateAction`, `dateDebut`, `dateFinPrevue` (masquée pour une quotidienne, D28) |
| **Priorité** | `urgenceId`, `importanceId` ; la priorité et l'**action à prendre** sont **affichées en lecture seule** et recalculées à la volée |
| **Commentaire initial** | `commentaire` (facultatif, 2 000 max — D46) |

**Données de référence**

`GET /elements`, `GET /urgencies`, `GET /importances`, `GET /priority-matrix`, `GET /employees`, `GET /partners`, `GET /departments`.

**Comportements**

| Sujet | Comportement |
|---|---|
| Priorité | La **matrice est lue** : dès que urgence + importance sont choisies, l'écran affiche **score**, **fréquence** et **libellé de priorité** en lecture seule. Aucune saisie manuelle du score (D14, D33, RM-03). |
| Combinaison absente | Les 3 couples inexistants (`Pas urgent` × `Critique` / `Elevée` / `Modérée`) ne sont **pas** proposés dans les listes déroulantes dépendantes, et le serveur les refuse (`422 COMBINAISON_PRIORITE_INVALIDE`, D31). |
| Quotidienne | `dateAction` = `dateDebut` = un seul jour ; pas de `dateFinPrevue` (D28). Un jour **non ouvré** est refusé (D32). |
| Quotidienne hors délai | Création après `16:30` ou un jour non ouvré → message explicite (D32). |
| Pilote | `ADMIN` : employé ou partenaire. Non-admin : **employé uniquement**, dans son périmètre (D47). |
| Exécutant | Dans le **périmètre de création** ; un employé **inactif** est refusé (D49). |
| Titulaire en modification | Reste dans le périmètre de création ; sinon refus. |
| Doublon de libellé | **Avertissement**, pas de blocage : encart « Un libellé identique existe déjà sur une tâche active. » avec choix **Continuer** / **Renommer** (D41, T8-11). |
| Enregistrement | Bouton principal **Enregistrer**, secondaire **Annuler**. Quitter avec des modifications non enregistrées demande confirmation. |

**Validation côté client (miroir de l'API §9)**

| Champ | Contrôle client | Message |
|---|---|---|
| `libelle` | non vide après `trim`, ≤ 255 | « Le libellé est obligatoire. » / « 255 caractères maximum. » |
| `commentaire` | ≤ 2 000 | « 2 000 caractères maximum. » |
| `dateAction ≤ dateDebut ≤ dateFinPrevue` | ordre | « Les dates ne sont pas cohérentes. » |
| Quotidienne | jour ouvré, pas de `dateFinPrevue` | « Une tâche quotidienne se déroule sur un seul jour ouvré. » |
| Priorité | couple présent dans la matrice | « Cette combinaison d'urgence et d'importance n'existe pas. » |
| Pilote | un seul, type autorisé | « Ce pilote n'est pas autorisé. » |

> Le client **aide**, le serveur **décide**. Toute valeur refusée par le serveur est affichée **près du champ** concerné lorsque le code d'erreur le permet.

---

### 4.7 IHM-07 — Duplication

| | |
|---|---|
| **Route** | `/taches/:id/dupliquer` |
| **Rôles** | `ADMIN` (partout), `RESPONSABLE` (son service + lui-même), `EMPLOYEE` (lui-même) |
| **Objectif** | Créer des copies indépendantes d'une tâche sur plusieurs dates |

**Contenu**

1. **Rappel de la tâche source** : libellé, nature, pilote, exécutant, élément, priorité.
2. **Sélection des dates** : calendrier multi-sélection ou champ de plage.
   - **Maximum 31 dates** par appel (D44) ; au-delà, le bouton est désactivé et le compteur passe en rouge.
   - Pour une **quotidienne**, seuls les **jours ouvrés** sont sélectionnables ; un jour férié ou un week-end est **désactivé** dans le calendrier (D44, RM-05).
   - Pour une tâche `AUTRE`, la durée est **conservée** : `dateAction` = `dateDebut` = date choisie, `dateFinPrevue` recalculée.
3. **Aperçu** : liste des copies qui seront créées, avec `dateAction`, `dateFinPrevue` et l'état « ouvré / non ouvré ».
4. **Avertissement explicite** : « Les copies n'héritent ni des commentaires ni du motif de non-achèvement. » (D44).
5. Bouton **Dupliquer** + **Annuler**.

**Données**

| Usage | Endpoint |
|---|---|
| Jours ouvrés et fériés | `GET /holidays?annee=…` + `GET /settings` (week-end) |
| Duplication | `POST /tasks/:id/duplicate` → `{ dates: [...] }` |

**États**

| État | Affichage |
|---|---|
| Aucune date choisie | Bouton désactivé |
| Plus de 31 dates | Compteur rouge, bouton désactivé, message « 31 dates maximum. » |
| Jour non ouvré (quotidienne) | Date désactivée dans le calendrier, jamais envoyée |
| Succès | « N copies créées. » + lien vers la liste filtrée sur le libellé |
| Erreur serveur | Aucune copie créée (atomicité, D44) : message « Aucune copie n'a été créée. » |

> **✅ D66** : l'aperçu est **calculé localement** à partir des dates choisies ; il n'existe **aucun** endpoint de prévisualisation et il n'est pas proposé d'en ajouter un. Le serveur reste seul juge : en cas de refus, **rien** n'est créé.

---

### 4.8 IHM-08 — Mon service

| | |
|---|---|
| **Route** | `/service` |
| **Rôles** | `RESPONSABLE` (son département) |
| **Objectif** | Contrôler l'activité de son service : qui fait quoi, où sont les retards |

**Contenu**

1. **En-tête de service** : libellé du département, nombre d'employés actifs, nombre de tâches ouvertes, nombre de retards (rouge).
2. **Onglet « Vue d'ensemble »** : répartition par statut, liste des **retards** en premier.
3. **Onglet « Équipe »** : employés du service (nom, actif, nombre de tâches ouvertes, retards).
4. **Onglet « Tâches »** : tableau filtrable des tâches du service (`vue=service`), mêmes colonnes que IHM-04.
5. **Actions** : **Nouvelle tâche** (pour son service ou lui-même), **Ouvrir**, **Contrôler** (commenter, changer statut / progression).

**Données**

`GET /tasks?vue=service`, `GET /employees?departementId=…&actif=true`, `GET /departments/:id`.

**Règles**

- Un responsable **ne voit pas** les tâches d'un autre service : la vue est limitée par le serveur, l'interface ne propose que son département.
- « Contrôler » = voir + commenter + modifier statut / progression ; **aucune validation préalable** (D17, D24).
- La **suppression** n'est possible que sur une tâche qu'il a **lui-même attribuée** (D7) ; sinon l'action est absente.
- Aucun indicateur calculé localement à partir d'une page : les compteurs viennent de `pagination.total`.

---

### 4.9 IHM-09 — Tous les services / Toutes les tâches

| | |
|---|---|
| **Route** | `/toutes-les-taches` |
| **Rôles** | `ADMIN` (écriture) · `CONSULTANT` (lecture seule) — **D63** |
| **Objectif** | Vue globale : toutes les tâches, tous les services, tous les employés |

**Contenu**

- **Filtres** : service porteur, exécutant, pilote, statut, nature, élément, urgence / importance, échéance, rappel, libellé, **tâches supprimées** (`supprimees`, admin uniquement).
- **Tableau** identique à IHM-04, avec colonne **Service porteur**.
- **Actions** : **Nouvelle tâche** (admin), **Ouvrir**, **Supprimer** (admin).
- Pour le `CONSULTANT` : **aucune** action d'écriture, aucun bouton « Nouvelle tâche », colonne « supprimées » absente.

**Données** : `GET /tasks?vue=toutes`, `GET /departments`, `GET /employees`, `GET /partners`.

**Règles**

- La vue `toutes` est la seule à exposer les tâches de tous les services.
- Le filtre `supprimees=true` est **réservé à l'admin** ; l'interface ne l'affiche pas aux autres rôles.
- Aucun export, aucune impression en V1.

---

### 4.10 IHM-10 — Référentiels

| | |
|---|---|
| **Route** | `/referentiels` |
| **Rôles** | `ADMIN` |
| **Objectif** | Administrer les données de référence sans jamais supprimer une donnée utilisée |

**Onglets**

| Onglet | Endpoints | Actions |
|---|---|---|
| **Employés** | `GET/POST/PATCH /employees` | Ajouter, modifier, **désactiver** ; pas de suppression |
| **Partenaires** | `GET/POST/PATCH/DELETE /partners` | Ajouter, modifier, désactiver, supprimer si non pilote |
| **Départements** | `GET/POST/PATCH/DELETE /departments` | Ajouter, modifier, désactiver, supprimer si non référencé |
| **Éléments / piliers** | `GET/POST/PATCH/DELETE /elements` | Ajouter, modifier, désactiver, supprimer si non utilisé |
| **Jours fériés** | `GET/POST/PATCH/DELETE /holidays` | Ajouter, modifier, supprimer (filtre par année) |
| **Actions à prendre** | `GET/PATCH /actions-a-prendre` | Activer / désactiver |
| **Urgences, importances, matrice** | `GET /urgencies`, `/importances`, `/priority-matrix` | **Lecture seule** |

**Règles d'affichage**

- Un référentiel **désactivé** reste visible avec un badge « Inactif » : il n'est jamais effacé de la liste.
- Les messages de refus sont **explicites** : « Ce département a un responsable : déplacez le rôle avant de le désactiver. » (`409 DEPARTEMENT_AVEC_RESPONSABLE`, D48) ; « Ce partenaire pilote une tâche : la suppression est refusée. » (`409 REFERENTIEL_REFERENCE`).
- Les urgences, importances et la matrice **n'ont aucun bouton d'écriture** : elles sont figées (EF-20).
- La suppression est une action **destructrice** : confirmation obligatoire.

---

### 4.11 IHM-11 — Comptes et rôles

| | |
|---|---|
| **Route** | `/comptes` |
| **Rôles** | `ADMIN` |
| **Objectif** | Créer un compte par employé, attribuer un rôle, désactiver au départ |

**Contenu**

- Tableau : identifiant, employé lié, rôle, état (actif / inactif), dernière connexion (si exposée).
- Formulaire de création : `employeId`, `identifiant`, `role`.
- Modification : `role`, `actif`.
- Action **Réinitialiser le mot de passe** (`POST /accounts/:id/reset-password`) — **détail ÉTAPE 13**.

**Règles**

- **Un compte par employé** : le sélecteur d'employé **grise** ceux déjà liés (`409 COMPTE_DEJA_LIE`).
- `RESPONSABLE` exige un employé **avec département** ; sinon le rôle n'est pas proposé (`422 RESPONSABLE_SANS_DEPARTEMENT`).
- **Au plus un responsable par département** : si le département a déjà un responsable, l'interface prévient avant l'envoi (`409 RESPONSABLE_DEJA_PRESENT`, D35).
- **Aucune suppression** de compte : seulement la désactivation (D12).
- Désactiver un employé **désactive son compte et révoque ses sessions** (D50) : la confirmation le dit explicitement.
- Le mot de passe temporaire n'est **jamais** réaffiché après la création (ÉTAPE 13).

---

### 4.12 IHM-12 — Paramètres

| | |
|---|---|
| **Route** | `/parametres` |
| **Rôles** | `ADMIN` |
| **Objectif** | Régler le week-end, la journée de travail et l'heure limite |

**Contenu**

| Champ | Type | Règle d'affichage |
|---|---|---|
| `fuseau` | lecture seule | `Africa/Algiers` (D30), **non modifiable** |
| `weekendJours` | sélection de 2 jours | exactement 2 jours distincts |
| `heureDebutJournee` | heure | `< pauseDebut` |
| `pauseDebut` | heure | entre début et fin de pause |
| `pauseFin` | heure | `< heureEcheanceQuotidienne` |
| `heureEcheanceQuotidienne` | heure | `16:30` par défaut (D18) |
| `modifieLe` | lecture seule | horodatage |

**Données** : `GET /settings`, `PATCH /settings`.

**Règles**

- L'ordre `début < pauseDebut < pauseFin < échéance` est vérifié **avant** l'envoi et **par le serveur** (`422 PARAMETRE_INVALIDE`).
- La pause est **affichée**, sans effet sur les calculs (D18) : l'écran le précise.
- Un bandeau rappelle que changer le week-end ou l'heure limite **modifie le calcul des retards** des tâches existantes ; confirmation demandée.
- Les jours fériés sont gérés dans **IHM-10**, avec un lien direct.

---

### 4.13 IHM-13 — Journal d'audit

| | |
|---|---|
| **Route** | `/audit` |
| **Rôles** | `ADMIN` |
| **Objectif** | Consulter l'historique complet des opérations, en lecture seule |

**Contenu**

- **Filtres** : acteur, type d'opération, entité, identifiant d'entité, période (du / au).
- **Tableau** paginé : horodatage, type d'opération, acteur, entité, identifiant.
- **Panneau de détail** au clic : `donneesAvant` et `donneesApres`, en JSON lisible (deux colonnes), **sans aucun secret**.

**Données** : `GET /audit-events`.

**Règles**

- **Aucune** action d'écriture : pas de bouton modifier, supprimer, purger (D42, EF-77).
- Aucune valeur de mot de passe, de hash ou de jeton n'est affichée : si le serveur en renvoyait, l'interface les masquerait — le contrat interdit déjà de les journaliser.
- Le journal est **append-only** : l'écran le rappelle.

---

### 4.14 IHM-14 — Mon profil

| | |
|---|---|
| **Route** | `/profil` |
| **Rôles** | Tous |
| **Objectif** | Voir son identité, son rôle, son département ; changer son mot de passe |

**Contenu**

- Identité : nom, prénom, identifiant, rôle, département, état du compte.
- **Changer le mot de passe** : ancien, nouveau, confirmation.
- Si `doitChangerMotDePasse = true` : bandeau rouge « Vous devez changer votre mot de passe avant de continuer. »

**Données** : `GET /me`, `POST /auth/password`.

**Règles**

- Les règles de complexité, de longueur et de verrouillage sont fixées à l'**ÉTAPE 13** (**P12**, D68) : l'écran affichera les critères **une fois décidés**, pas avant.
- L'email n'est modifiable que par l'admin (contrat §8.10) : le champ est **en lecture seule** ici.
- Un changement de mot de passe réussi **invalide les autres sessions** si l'ÉTAPE 13 le décide ; l'écran affichera alors un message adapté.

---

### 4.15 Écrans techniques

| Écran | Route | Contenu | Actions |
|---|---|---|---|
| **403 — Accès refusé** | `/interdit` | « Vous n'avez pas accès à cette page. » + rappel du rôle | Retour à l'accueil |
| **404 — Introuvable** | `*` | « Cette page ou cette tâche n'existe pas, ou ne vous est pas accessible. » | Retour à l'accueil |
| **Session expirée** | modale | « Votre session a expiré. Reconnectez-vous pour continuer. » | Se reconnecter |
| **Erreur serveur** | bandeau | « Une erreur est survenue. Si le problème persiste, contactez l'administrateur. » + code de corrélation si fourni | Réessayer |

> **Règle de non-divulgation** (API §4.4) : l'écran `404` de l'application est utilisé **aussi** lorsqu'une ressource existe mais sort du périmètre. L'interface ne doit jamais distinguer « n'existe pas » de « pas pour vous ».

---

## 5. Parcours utilisateurs → écrans

> Reprise des **UC-01 à UC-18** du cahier des charges, avec l'écran et l'endpoint associés. Aucun parcours nouveau n'est introduit.

| # | Acteur | Parcours | Écrans | Endpoints |
|---|---|---|---|---|
| **UC-01** | Tous | Se connecter | IHM-01 → atterrissage | `POST /auth/login`, `GET /me` |
| **UC-02** | Employé | Voir ses tâches du jour | IHM-02 → IHM-05 | `GET /tasks?vue=mes-taches-du-jour` |
| **UC-03** | Employé | Consulter ses autres tâches | IHM-03 → IHM-05 | `GET /tasks?vue=mes-autres-taches` |
| **UC-04** | Employé | Clôturer à l'heure | IHM-05 → modale de clôture | `POST /tasks/:id/close` |
| **UC-05** | Employé | Clôturer en retard | IHM-05 → modale avec **motif obligatoire** | `POST /tasks/:id/close` |
| **UC-06** | Employé | Commenter | IHM-05 (bloc commentaires) | `POST /tasks/:id/comments` |
| **UC-07** | Employé | Faire avancer une tâche longue | IHM-05 / IHM-03 | `PATCH /tasks/:id/progress` |
| **UC-08** | Employé | Créer sa tâche | IHM-06 (création, soi-même) | `POST /tasks` |
| **UC-09** | Responsable | Attribuer à son service | IHM-06 (création, périmètre service) | `POST /tasks` |
| **UC-10** | Responsable | Contrôler une tâche du service | IHM-08 → IHM-05 | `GET /tasks?vue=service`, `PATCH /tasks/:id/status`, `/progress`, commentaires |
| **UC-11** | Responsable | Supprimer une tâche qu'il a attribuée | IHM-05 → confirmation | `DELETE /tasks/:id` |
| **UC-12** | Admin | Créer pour n'importe qui | IHM-06 (sélecteur d'exécutant complet) | `POST /tasks` |
| **UC-13** | Admin | Dupliquer une quotidienne | IHM-07 | `POST /tasks/:id/duplicate` |
| **UC-14** | Admin | Gérer les référentiels | IHM-10 (7 onglets) | `/employees`, `/partners`, `/departments`, `/holidays`, `/elements`, `/actions-a-prendre` |
| **UC-15** | Admin | Gérer les comptes | IHM-11 | `/accounts` |
| **UC-16** | Admin | Consulter le journal | IHM-13 | `GET /audit-events` |
| **UC-17** | Consultant | Consulter toutes les tâches | IHM-09 (lecture seule) | `GET /tasks?vue=toutes` |
| **UC-18** | Tous | Se déconnecter | En-tête → Déconnexion | `POST /auth/logout` |

### 5.1 Parcours critique — clôture tardive (UC-05)

```
IHM-05 détail
   │  clic « Clôturer »
   ▼
Modale de clôture
   ├─ champ « Date de fin » (aujourd'hui par défaut)
   ├─ si la date est postérieure à l'échéance
   │     ou si l'heure courante > 16:30 le jour dû
   │        → champ « Motif de non-achèvement » OBLIGATOIRE
   │        → bouton « Clôturer » désactivé tant que le motif est vide
   ▼
POST /tasks/:id/close { dateFin, motifNonAchevement, version }
   ├─ 200 → statut devient Achevée, motif affiché dans le détail
   ├─ 422 MOTIF_OBLIGATOIRE → message sous le champ
   ├─ 422 DATE_INCOHERENTE  → message sous la date
   ├─ 409 TACHE_DEJA_CLOTUREE → rechargement du détail
   └─ 409 VERSION_OBSOLETE → section 8.3
```

> Le caractère « tardif » est **déterminé par le serveur** (D56) : l'interface peut **anticiper** l'affichage du champ, mais elle ne décide pas. Si le serveur refuse pour motif manquant, le champ est affiché **même si le client ne l'avait pas prévu**.

### 5.2 Parcours critique — conflit de version

Deux responsables modifient la même tâche. Le second enregistre après le premier.

```
PATCH /tasks/:id { ..., version: 3 }
   └─ 409 VERSION_OBSOLETE
        → bandeau « Cette tâche a été modifiée entre-temps. »
        → bouton « Recharger et comparer »
        → rechargement GET /tasks/:id
        → panneau « Vos modifications » / « Version enregistrée »
        → choix : reprendre la saisie sur la nouvelle version, ou abandonner
```

> **Aucune** écriture n'est faite automatiquement « par-dessus ». L'écrasement silencieux est précisément ce que le verrou optimiste évite (T8-05).

---

## 6. Composants partagés

> Section **synthétique** : le détail d'implémentation relève du code, pas de la spécification. Les composants ci-dessous sont ceux qui portent une **règle d'affichage** et doivent être identiques partout.

### 6.1 Tableau de tâches

| Élément | Règle |
|---|---|
| Colonnes | Libellé, nature, statut, échéance, progression, priorité, pilote, service porteur, rappel |
| En-tête | Cliquable **uniquement** pour les champs triables (T8-03) |
| Ligne | Cliquable → IHM-05 ; le clic sur une action ne déclenche pas l'ouverture |
| Ligne en retard | Bord gauche rouge + libellé rouge, **jamais** un fond coloré |
| Ligne achevée | Libellé barré, opacité réduite |
| Pagination | En pied de tableau ; `total` affiché |
| Vide | Message explicite au centre, pas de tableau vide avec en-têtes seuls |

### 6.2 Badge de statut

Icône + libellé sur une seule ligne, **jamais** uniquement une pastille de couleur (D23). Le rouge n'est utilisé que pour `Retard` et les alertes.

### 6.3 Barre de progression

Barre rouge sur fond neutre, valeur numérique affichée à droite. `null` → « — » sans barre. Pour une quotidienne : 0 % ou 100 % (D43).

### 6.4 Signaux de rappel

| Signal | Condition | Rendu |
|---|---|---|
| Rappel échu | `rappelEchu = true` | Préfixe rouge « Rappel échu » + icône |
| Rappel imminent | `rappelImminent = true` | Contour accentué + « Rappel bientôt » — **sans couleur supplémentaire** |

### 6.5 Formulaire

Libellé au-dessus du champ, astérisque pour les champs obligatoires, message d'erreur **sous le champ**, aide contextuelle à droite si nécessaire. Aucun placeholder utilisé comme libellé.

### 6.6 Modale de confirmation

Titre explicite, **nom de la tâche** rappelé, effet de l'action en une phrase, bouton destructeur en rouge, bouton d'annulation neutre, focus initial sur **Annuler**.

### 6.7 Notifications

Bandeau non bloquant, 5 secondes, fermable. Une erreur **ne disparaît pas** toute seule. Aucune couleur hors palette : le rouge signale l'échec, le blanc la réussite.

### 6.8 États

| État | Rendu |
|---|---|
| Chargement initial | Squelette (3-5 lignes) |
| Rechargement | Données précédentes + indicateur discret |
| Vide | Message + action pertinente |
| Erreur | Bandeau + « Réessayer » |
| Interdit | Écran 403 |
| Introuvable | Écran 404 |

---

## 7. Correspondance écran → endpoints

| Écran | Endpoints utilisés |
|---|---|
| IHM-01 | `POST /auth/login`, `GET /auth/csrf` |
| IHM-02 | `GET /tasks` (`vue=mes-taches-du-jour`), `POST /tasks/:id/close`, `POST /tasks/:id/comments` |
| IHM-03 | `GET /tasks` (`vue=mes-autres-taches`), `PATCH /tasks/:id/progress`, `POST /tasks/:id/close` |
| IHM-04 | `GET /tasks` (`vue=mes-taches`), `GET /elements`, `GET /urgencies`, `GET /importances`, `GET /departments` |
| IHM-05 | `GET /tasks/:id`, `GET/POST /tasks/:id/comments`, `GET /tasks/:id/history`, `PATCH /tasks/:id`, `PATCH /tasks/:id/status`, `PATCH /tasks/:id/progress`, `POST /tasks/:id/close`, `DELETE /tasks/:id` |
| IHM-06 | `POST /tasks`, `PATCH /tasks/:id`, `GET /elements`, `GET /partners`, `GET /employees`, `GET /departments`, `GET /priority-matrix`, `GET /actions-a-prendre` |
| IHM-07 | `POST /tasks/:id/duplicate`, `GET /holidays`, `GET /settings` |
| IHM-08 | `GET /tasks?vue=service`, `GET /employees`, `GET /departments/:id` |
| IHM-09 | `GET /tasks?vue=toutes`, `GET /departments`, `GET /employees`, `GET /partners`, `DELETE /tasks/:id` |
| IHM-10 | `/employees`, `/partners`, `/departments`, `/elements`, `/holidays`, `/actions-a-prendre`, `/urgencies`, `/importances`, `/priority-matrix` |
| IHM-11 | `/accounts`, `GET /employees` |
| IHM-12 | `GET/PATCH /settings` |
| IHM-13 | `GET /audit-events` |
| IHM-14 | `GET /me`, `POST /auth/password` |
| Gabarit | `GET /me`, `POST /auth/logout` |

> **Aucun endpoint n'est ajouté.** Les **54 endpoints** de l'ÉTAPE 8 couvrent l'ensemble des écrans. Le dossier `features\dashboard` prévu par l'architecture sert à l'écran **IHM-02** composé depuis `GET /tasks` : il **ne correspond pas** à un endpoint `/dashboard`, qui n'existe pas (T8-07).

---

## 8. États transverses et gestion des erreurs

### 8.1 Enveloppe d'erreur

Toutes les erreurs suivent `problem+json` (API §5.1). L'interface lit :

| Champ | Usage |
|---|---|
| `status` | Décision de comportement (`401`, `403`, `404`, `409`, `422`, `500`) |
| `code` | Message métier précis, mappé en français |
| `detail` | Complément technique, **non affiché brut** à l'utilisateur |
| `errors[]` | Erreurs par champ pour les `422` |

### 8.2 Mapping des codes

| Code HTTP | Code API | Comportement d'interface |
|---|---|---|
| `400` | `REQUETE_INVALIDE`, `CHAMP_INCONNU` | Bandeau générique + journal technique en console (développement) |
| `401` | `AUTHENTIFICATION_REQUISE` | Modale de session expirée → `/connexion` |
| `403` | `ACCES_REFUSE` | Écran 403 ou message d'action refusée |
| `404` | `RESSOURCE_INTROUVABLE` | Écran 404 (aucune distinction avec le hors-périmètre) |
| `409` | `VERSION_OBSOLETE` | Section 8.3 ci-dessous |
| `409` | `TACHE_DEJA_CLOTUREE` | Rechargement du détail + message « Cette tâche est déjà clôturée. » |
| `409` | `DEPARTEMENT_AVEC_RESPONSABLE` | Message explicite dans IHM-10 |
| `409` | `REFERENTIEL_REFERENCE` | Message explicite dans IHM-10 |
| `409` | `COMPTE_DEJA_LIE`, `RESPONSABLE_DEJA_PRESENT` | Message dans IHM-11, champ concerné |
| `409` | `LIBELLE_DEJA_UTILISE` (avertissement) | Encart non bloquant (D41) |
| `422` | `CHAMP_OBLIGATOIRE`, `VALEUR_INVALIDE` | Message **sous le champ** |
| `422` | `MOTIF_OBLIGATOIRE` | Ouvre / met en évidence le champ motif |
| `422` | `DATE_INCOHERENTE` | Message sous les dates |
| `422` | `COMBINAISON_PRIORITE_INVALIDE` | Message sous urgence / importance |
| `422` | `PILOTE_INVALIDE` | Message sous le sélecteur de pilote |
| `422` | `EMPLOYE_INACTIF` | Message sous le sélecteur d'exécutant |
| `422` | `PARAMETRE_INVALIDE` | Message sous le champ de paramètre |
| `422` | `PROGRESSION_INVALIDE` | Message sous le champ de progression |
| `422` | `NATURE_INVALIDE` | Message sous la nature |
| `422` | `TRI_NON_SUPPORTE` | Ne peut pas arriver si l'interface respecte T8-08 ; message générique sinon |
| `500` | `ERREUR_INTERNE` | Bandeau + code de corrélation |

### 8.3 Conflit de version (`409 VERSION_OBSOLETE`)

| Étape | Comportement |
|---|---|
| 1 | Ne **rien** réécrire |
| 2 | Bandeau « Cette tâche a été modifiée entre-temps par un autre utilisateur. » |
| 3 | Bouton **Recharger et comparer** → `GET /tasks/:id` |
| 4 | Panneau côte à côte : valeurs saisies / valeurs enregistrées |
| 5 | Choix explicite : **Reprendre sur la version à jour** (la saisie est conservée dans le formulaire) ou **Abandonner** |
| 6 | Aucune fusion automatique, aucun écrasement silencieux |

### 8.4 Réseau et indisponibilité

| Cas | Comportement |
|---|---|
| Perte réseau | Bandeau persistant « Connexion perdue. » ; les actions d'écriture sont désactivées |
| Retour réseau | Bandeau « Connexion rétablie. », réactivation, rafraîchissement des données affichées |
| `503` / `502` | « Service momentanément indisponible. » + « Réessayer » |
| Délai dépassé | Message + « Réessayer », jamais de double envoi automatique |

### 8.5 Session expirée

| Cas | Comportement |
|---|---|
| `401` sur un appel de données | Modale **bloquante** ; à la reconnexion, retour à l'écran courant |
| `401` sur une écriture | Le formulaire **conserve la saisie** en mémoire ; après reconnexion, l'utilisateur **revalide** lui-même |
| Déconnexion volontaire | `POST /auth/logout`, purge du cache TanStack Query, retour à `/connexion` |

> **Règle** : aucune saisie utilisateur n'est perdue à cause d'une expiration de session. Aucune écriture n'est rejouée automatiquement.

---

## 9. Accessibilité et contraintes d'usage

| Sujet | Règle | Statut |
|---|---|---|
| Contraste | Texte blanc sur noir et noir sur blanc conformes **AA** ; le rouge sur noir utilise une variante claire (`--gd-rouge-clair`) | 🔧 |
| Couleur seule | Jamais porteuse d'information : toujours doublée par libellé / icône / forme | ✅ D23 |
| Clavier | Toute action accessible au clavier ; ordre de tabulation logique ; focus visible (contour blanc) | 🔧 |
| Modales | Focus piégé, `Échap` ferme, focus rendu à l'élément déclencheur | 🔧 |
| Libellés | Chaque champ a un libellé explicite ; les icônes ont un texte alternatif | 🔧 |
| Langue | `lang="fr"` sur le document | 🔧 |
| Zoom | Utilisable à 150 % sans perte de fonction | 🔧 |
| Densité | Tableaux lisibles à 14 px minimum | 🔧 |
| Impression | Non traitée en V1 | 🔧 |

> **✅ D60** : la cible est **desktop-first ≥ 1280 px**. En dessous de 1024 px, l'application reste fonctionnelle mais non optimisée. Un usage tablette/mobile réel n'est pas prévu par le cahier des charges ; s'il devenait nécessaire, il ferait l'objet d'une demande explicite.

---

## 10. Performance perçue

| Sujet | Règle | Statut |
|---|---|---|
| Pagination | 50 lignes par défaut, 200 maximum (T8-04) | ✅ |
| Cache | TanStack Query : les listes sont mises en cache et **invalidées** après toute écriture sur une tâche | ✅ architecture §12 |
| Invalidation | Après création, modification, clôture, suppression, duplication : invalidation des listes et du détail concernés | 🔧 |
| Préchargement | Ouverture du détail au survol de la ligne (facultatif, sans bloquer) | 🔧 |
| Recherche | Recherche « contient » **envoyée au serveur** après 300 ms d'inactivité, jamais filtrée localement | 🔧 |
| Chargement initial | `GET /me` d'abord, puis l'écran ; le gabarit s'affiche sans attendre les données de contenu | 🔧 |
| Compteurs | Toujours issus de `pagination.total` d'un appel filtré, jamais d'un comptage sur la page | ✅ exigence de justesse |

---

## 11. Ce que l'ÉTAPE 9 ne fait pas

- Elle **ne crée aucun fichier de code**, aucun composant React, aucun style, aucun `package.json`.
- Elle **n'installe aucune dépendance**.
- Elle **ne crée aucun dossier** `client\`, `server\` ou `prisma\`.
- Elle **ne définit pas** les endpoints : ils sont figés par l'ÉTAPE 8.
- Elle **ne définit pas** les règles métier : statut, priorité, rappel, progression et droits sont **calculés par le serveur**.
- Elle **ne tranche pas** la politique de mots de passe et de session → **ÉTAPE 13**.
- Elle **ne rédige pas** la procédure d'installation → **ÉTAPE 14**.
- Elle **ne produit pas** de maquettes graphiques haute fidélité : elle décrit les écrans, les contenus et les comportements. Les wireframes ASCII de la section 3.2 et des parcours en sont la représentation de travail.
- Elle **ne tranche aucun** point **P1, P2, P3, P5, P11, P12**.

---

## 12. Traçabilité

| Élément du CDC | Traitement dans ce document |
|---|---|
| IHM-01 → IHM-14 | Section 4, un sous-chapitre par écran |
| UC-01 → UC-18 | Section 5, tableau de correspondance + 2 parcours critiques |
| EF-41 / EF-42 (vues du jour / autres) | IHM-02, IHM-03 |
| EF-44 / EF-59 (contrôle du service) | IHM-08 |
| EF-46 / EF-07 (consultant) | IHM-09, D63 |
| EF-50 (rappels) | Section 6.4 |
| EF-53 / EF-54 (clôture, motif) | IHM-05, section 5.1 |
| EF-55 (commentaire) | IHM-05 |
| EF-56 / EF-58 (progression) | IHM-03, IHM-05 |
| EF-61 → EF-65 (duplication) | IHM-07 |
| EF-66 → EF-69 (suppression) | IHM-05, IHM-09 |
| EF-76 / EF-77 (audit) | IHM-13 |
| D3 / D23 (charte, statuts) | Sections 2.2, 2.3 |
| D7 / D13 / D21 / D25 / D33 (droits) | Section 3.3, IHM-05, IHM-06 |
| D43 (progression quotidienne) | Section 6.3, IHM-02 |
| D44 → D57 | IHM-05, IHM-06, IHM-07, IHM-10, IHM-11 |
| T8-05 / T8-08 / T8-09 | Sections 8.3, 4.4, 4.9 |

---

## 13. Points tranchés le 02/11/2026

> Les douze points soumis à arbitrage ont tous été **validés le 02/11/2026** et deviennent les **DÉCISIONS 58 à 69**. Aucun n'a été modifié par rapport à la proposition soumise.

| # | Point | Décision retenue | Écran / section | Réf. | Renvoi |
|---|---|---|---|---|---|
| **A9-01** | Icônes des six statuts | Reprendre la proposition du CDC : ○ `A faire`, ▶ `En cours`, ▲ `Retard` (rouge), ✓ `Achevée`, ✕ `Annulée`, ⏸ `Suspendue`, toujours accompagnées du libellé | Section 2.3 | **D58** | CDC §8 |
| **A9-02** | Écran d'atterrissage par rôle | `EMPLOYEE` → `/aujourdhui` ; `RESPONSABLE` → `/service` ; `ADMIN` et `CONSULTANT` → `/toutes-les-taches` | Section 3.4 | **D59** | — |
| **A9-03** | Cible d'affichage | Desktop-first ≥ 1280 px ; dégradation acceptable entre 1024 et 1280 px ; pas d'optimisation mobile en V1 | Section 9 | **D60** | ENF |
| **A9-04** | Libellés `Durée G.` / `Durée E.` | Afficher « Durée G. » et « Durée E. » avec une infobulle « Signification à confirmer », sans masquer les champs ; la signification métier reste ouverte (**P1**) | IHM-05 | **D61** | **P1** |
| **A9-05** | Libellé de `FREQUENCE` | Afficher « Rappel tous les N jours » plutôt que « Fréquence » ; la sémantique métier reste ouverte (**P5**) | IHM-05 | **D62** | **P5** |
| **A9-06** | Écran du `CONSULTANT` | Partager **IHM-09** entre `ADMIN` et `CONSULTANT`, toutes les actions d'écriture étant absentes pour ce dernier | Section 3.1, IHM-09 | **D63** | UC-17, EF-46 |
| **A9-07** | Tri par défaut et ordre d'affichage des statuts | Ordre d'affichage : `Retard` → `A faire` → `En cours` → `Suspendue` → `Annulée` → `Achevée`. Tri **serveur** uniquement sur les champs autorisés (T8-08) : `score:desc` sur IHM-02, `dateFinPrevue:asc` sur IHM-03 / IHM-04 / IHM-08 / IHM-09. Le regroupement visuel par statut se fait sur la page affichée, jamais par un tri serveur sur `statut` (champ calculé) | Section 2.3, IHM-04 | **D64** | T8-03, T8-08 |
| **A9-08** | Résolution du conflit de version | Rechargement + comparaison + reprise explicite ; **aucune** fusion automatique | Section 8.3 | **D65** | T8-05 |
| **A9-09** | Aperçu de duplication | Aperçu **local** des dates choisies ; **aucun** endpoint de prévisualisation ; le serveur reste seul juge et l'opération est atomique | IHM-07 | **D66** | D44 |
| **A9-10** | Affichage du score de priorité | Libellé de priorité en clair (`Immédiate & Critique`) + score 0-12 discret à droite ; jamais le score seul | IHM-04, IHM-05 | **D67** | RM-03 |
| **A9-11** | Critères du mot de passe sur IHM-14 | Ne rien afficher tant que l'ÉTAPE 13 n'a pas fixé la politique ; l'écran affichera ensuite les critères exacts | IHM-14 | **D68** | **P12** |
| **A9-12** | Thème clair | **Aucun** en V1 : noir dominant (D23) ; pas de bascule de thème | Section 2.2 | **D69** | D23 |

> **Rappel** : **D61** et **D62** tranchent la **manière d'afficher**, pas le **sens métier**. **P1** (signification de `DUREE G./E.`) et **P5** (sémantique de `FREQUENCE`) restent ouverts et ne bloquent pas l'implémentation.
> **Rappel** : **P2** (fériés 2027-2028) et **P3** (liste des consultants) restent ouverts et n'ont **aucun impact d'écran** : IHM-10 permet de saisir les fériés, IHM-11 permet de créer les comptes consultants.

---

## 14. Validation obtenue

**ÉTAPE 9 validée le 02/11/2026.** Le directeur a confirmé que :

1. les **14 écrans IHM-01 à IHM-14** sont correctement déclinés, avec leur route, leurs rôles, leur contenu et leurs actions ;
2. la **navigation** et la **visibilité du menu** dérivées de `Me.droits` sont acceptables ;
3. les **18 parcours UC-01 à UC-18** trouvent chacun un écran et un endpoint, sans parcours orphelin ;
4. la **charte noir / rouge / blanc** (D23) est respectée, notamment pour les six statuts et les rappels ;
5. les **états vides, de chargement, d'erreur, de conflit de version et de session expirée** sont couverts ;
6. la **correspondance écran → endpoint** n'introduit aucun endpoint nouveau et n'en laisse aucun inutilisé ;
7. les points **A9-01 à A9-12** sont tranchés (**D58 à D69**) avant l'implémentation.

> **Aucun code n'a été écrit pendant cette étape** (règle M1).
> L'**ÉTAPE 10** (gestion des rôles et permissions) peut être engagée — elle formalise la mise en œuvre des droits déjà décrits ici, sans les modifier.

---

## 15. Journal des révisions

| Date | Section(s) | Modification | Statut |
|---|---|---|---|
| 02/11/2026 | Document entier | **Validation de l'ÉTAPE 9** : points **A9-01 à A9-12** tranchés (**D58 à D69**), section 13 renommée « Points tranchés », section 14 réécrite en « Validation obtenue », tous les marqueurs ❓ remplacés par les décisions. Aucun code écrit. | ✅ **Validée le 02/11/2026** |
| 02/11/2026 | Document entier | Création du livrable 08 (ÉTAPE 9) : principes d'interface, charte noir / rouge / blanc, navigation et routes, **14 écrans**, **18 parcours**, composants partagés, gestion des erreurs et du conflit de version, accessibilité, performance perçue, traçabilité CDC, points **A9-01 à A9-12**. Aucun code écrit. | ⏳ **En attente de validation** → remplacé par la validation du 02/11/2026 |
