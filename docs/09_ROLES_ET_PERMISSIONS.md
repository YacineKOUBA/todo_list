# Livrable 09 — ÉTAPE 10 : Gestion des rôles et permissions

| | |
|---|---|
| **Projet** | Application web de gestion des TODOLIST — GD Trading |
| **Livrable** | 09 (méthode M8) |
| **Étape** | **10 — Gestion des rôles et permissions** |
| **Documents de référence** | `docs\05_CAHIER_DES_CHARGES_FONCTIONNEL.md` §3 (ÉTAPE 5) · `docs\04_ARCHITECTURE_APPLICATION.md` §10-11 (ÉTAPE 6) · `docs\06_MODELE_DE_DONNEES.md` (ÉTAPE 7) · `docs\07_API.md` §3-4 et §8 (ÉTAPE 8) · `docs\08_INTERFACE_REACT.md` §3.3 (ÉTAPE 9) |
| **Décisions de référence** | **DÉCISIONS 1 à 81** — D70 (compte `ADMIN` nominatif), D71 (comptes créés manuellement) et D72 → D75 (zones grises G1 → G4) s'appliquent au cycle de vie des comptes sans modifier la matrice des droits ; **D81** (05/11/2026) ajoute l'assignation polymorphe employé / partenaire |
| **Périmètre de l'étape** | Spécification de la mise en œuvre des **4 rôles**, des **périmètres** et du **contrôle d'accès**. **Aucun fichier de code.** |
| **Date de rédaction** | 02/11/2026 |
| **Statut** | ✅ **VALIDÉE le 02/11/2026** — spécification arrêtée, **aucun code écrit**, aucun dossier `client\` ou `server\` créé |

> **Règle M2** : ce document **formalise** les droits déjà validés (D7, D12, D13, D17, D21, D24, D25, D32, D33, D35, D39, D42, D47, D48, D49, D50, D52, D53, D63). Il **ne crée aucun droit nouveau**.
> **Règle M5** : conformément à votre choix du 02/11/2026, **aucun point A10 n'est ouvert**. Les **zones grises** que la méthode ne permet pas de trancher sont **signalées** (section 13) et **volontairement non appliquées**.
> **Aucun code n'a été écrit. Aucune dépendance n'a été installée. Aucun dossier `client\`, `server\` ou `prisma\` n'a été créé.**

---

## 1. Objet et périmètre

### 1.1 Objet

Décrire **qui peut faire quoi**, **sur quel périmètre**, et **comment le serveur le vérifie** — pour les **4 rôles** validés (`ADMIN`, `RESPONSABLE`, `EMPLOYEE`, `CONSULTANT`) et les **54 endpoints** du contrat d'API validé.

Le document répond à cinq questions :

1. **Quel rôle** donne **quel droit** sur **quelle opération** ;
2. **Quel périmètre** de lecture, d'écriture, de création et de suppression s'applique à chaque rôle ;
3. **Quel endpoint** est ouvert, conditionnel ou fermé pour chaque rôle ;
4. **Quelles fonctions serveur** portent la décision, et dans quel ordre elles s'exécutent ;
5. **Quels tests** l'ÉTAPE 12 devra exécuter pour prouver que le contrôle d'accès tient.

### 1.2 Ce que ce document ne fait pas

- Il **ne crée aucun fichier de code**, aucun middleware, aucun module d'autorisation.
- Il **n'installe aucune dépendance**.
- Il **ne crée aucun dossier** `client\`, `server\` ou `prisma\`.
- Il **ne définit pas** la politique de mots de passe, de session, de verrouillage ou de révocation technique → **ÉTAPE 13**.
- Il **ne définit pas** les écrans ni la navigation → **ÉTAPE 9, validée** (`docs\08_INTERFACE_REACT.md`).
- Il **ne définit pas** les endpoints → **ÉTAPE 8, validée** (`docs\07_API.md`).
- Il **ne tranche aucune zone grise** (section 13) : il les **signale**.
- Il **ne définit pas** les tests automatisés, mais il fixe les **cas d'autorisation** que l'ÉTAPE 12 devra couvrir.

### 1.3 Statut de chaque énoncé

| Marque | Signification |
|---|---|
| ✅ **DÉCIDÉ** | Découle d'une décision validée (D1 → D81), d'une exigence (EF-xx), d'une règle (RM-xx) ou du contrat d'API validé. **Applicable tel quel.** |
| 🔧 **PROPOSÉ** | Choix de mise en œuvre technique qui **ne crée aucun droit**. Appliqué sauf objection. |
| ⚠️ **ZONE GRISE** | Aucune règle validée ne tranche. **Signalé, non appliqué** (section 13). |

> Aucun ⚠️ n'est implémenté comme s'il était décidé.

---

## 2. Le modèle de rôles

### 2.1 Les quatre rôles

| Rôle | Nature | Département | Compte | Source |
|---|---|---|---|---|
| `ADMIN` | Administration complète | Non requis | Oui | D7, D20 |
| `RESPONSABLE` | Chef de service | ✅ **Obligatoire** | Oui | D7, EF-05 |
| `EMPLOYEE` | Agent GD Trading | Facultatif | Oui | D7 |
| `CONSULTANT` | Lecture seule | Facultatif | Oui | D7, D21 |

**Règles de comptes déjà validées** :

- **un compte par employé** (D12, EF-06) ; le rôle est porté par le **compte**, jamais par la fiche employé ;
- rôle **par défaut** à la création : `EMPLOYEE` ;
- un `RESPONSABLE` **ne peut pas exister sans département** (EF-05) ;
- **au plus un responsable par département** (A12 → D35) ;
- un employé qui quitte l'entreprise voit son compte **désactivé**, jamais supprimé (D12) ;
- la désactivation d'un employé **désactive son compte et révoque ses sessions** (D50) ;
- un `CONSULTANT` peut exister **sans fiche employé** (`employeId` nullable, D39).

### 2.2 Le rôle n'est pas la personne

| Élément | Porte le rôle ? | Porte le département ? | Source |
|---|---|---|---|
| `utilisateur` (compte) | ✅ **Oui** | ❌ Non | D7 |
| `employe` (fiche) | ❌ Non | ✅ Oui (facultatif) | EF-12 |

> Conséquence : changer le rôle d'une personne ne modifie **pas** sa fiche employé, et changer son département ne modifie **pas** son rôle. Le seul cas lié est `RESPONSABLE` + département obligatoire (EF-05), contrôlé **à l'attribution du rôle**.

### 2.3 Ce que le rôle ne fait pas

- Il ne **remplace pas** le contrôle serveur : toute route revérifie (EF-03).
- Il ne **modifie pas** le calcul du statut, de la priorité ou de la progression (AR-05).
- Il ne **donne pas** accès à une tâche hors périmètre de lecture, même à un `ADMIN` sur une tâche **supprimée logiquement** (T8-09) : seul `GET /tasks?supprimees=true` la liste.
- Il ne **rend pas** un `EMPLOYEE` propriétaire d'une tâche qu'il n'a ni créée, ni pilotée, ni reçue.

---

## 3. Principes d'autorisation

| # | Principe | Source |
|---|---|---|
| 1 | **Le serveur décide.** L'interface peut masquer une action ; le serveur refuse toute action non autorisée. | EF-03, CDC §3.2, architecture §11 |
| 2 | **Refus par défaut.** Une route non explicitement ouverte à un rôle est fermée (`403`). | 🔧 |
| 3 | **Politique centralisée.** Un module unique applique les décisions ; aucun contrôle dupliqué dans les contrôleurs. | API §4.1 |
| 4 | **Non-divulgation.** Hors périmètre de lecture → `404`, jamais `403` ; action interdite sur une ressource visible → `403`. | API §4.4, EF-03 |
| 5 | **Aucun rôle codé en dur dans l'interface.** Le menu et les actions dérivent de `Me.droits`. | D63, doc 08 §3.3 |
| 6 | **Le périmètre se calcule, il ne se stocke pas.** « Service porteur » et « propres tâches » sont recalculés à chaque lecture. | D29, AR-05 |
| 7 | **Le rôle est lu à chaque requête** sur la session ou le compte ; aucune copie durable côté client. | 🔧 |

### 3.1 Ordre d'évaluation d'une requête

```text
1. Session valide ?                     non → 401 AUTHENTIFICATION_REQUISE / SESSION_EXPIREE
2. Compte actif ?                       non → 401 SESSION_EXPIREE
3. Changement de mot de passe requis ?  oui → 403 CHANGEMENT_MOT_DE_PASSE_REQUIS
4. Rôle autorisé sur la route ?         non → 403 ACTION_NON_AUTORISEE
5. Ressource visible ?                  non → 404 RESSOURCE_INTROUVABLE
6. Action autorisée sur la ressource ?  non → 403 ACTION_NON_AUTORISEE
7. Contrôles métier (validation)        → 422 / 409
```

> **Conséquence** : un `EMPLOYEE` qui appelle une route d'administration reçoit `403` **sans** savoir si la ressource existe. Un `EMPLOYEE` qui ouvre l'URL d'une tâche d'un autre service reçoit `404`. Ces deux comportements sont **distincts et voulus** (API §4.4).

### 3.2 Règle de non-divulgation

| Situation | Réponse | Raison |
|---|---|---|
| Tâche hors du périmètre de lecture | **`404`** | Ne pas révéler l'existence d'une tâche d'un autre service |
| Tâche visible, action interdite | **`403`** | L'utilisateur sait que la tâche existe |
| Route réservée à un rôle (référentiels, comptes, audit) | **`403`** | Le rôle est connu |
| Ressource réellement inexistante | **`404`** | Indistinguable du hors-périmètre, volontairement |

---

## 4. Matrice fonctionnelle des droits

> Reprise **à l'identique** du cahier des charges §3.2 (validé). Aucune ligne n'est ajoutée ni retirée.

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
| Consulter le journal d'audit | ✅ | ❌ | ❌ | ❌ |

**Précisions (validées)** :

- « **son service** » ne s'étend **jamais** aux autres services (D17) ;
- « **ses propres tâches** » suit **A13 → D16** : assignées **ou** pilotées **ou** créées ;
- la **modification du titulaire** (pilote, exécutant) reste limitée au **périmètre de création** (D13) : un employé ne peut pas réaffecter sa tâche à un collègue ; un responsable ne peut pas l'affecter hors de son service ;
- un responsable qui veut retirer une tâche **créée par un employé de son service** ne peut pas la supprimer : il peut la passer en **`Annulée`** (D7, EF-52) ;
- le `CONSULTANT` voit **toutes** les tâches mais **n'écrit jamais** (D7, D21, EF-07) ;
- une **tâche supplémentaire** n'est visible que par **son créateur** : ni l'`ADMIN`, ni le `CONSULTANT`, ni le `RESPONSABLE` d'un service ne voient celles créées par un autre utilisateur (précision du 09/11/2026) ;
- la consultation du journal d'audit est réservée à l'`ADMIN` : la mention « (proposition) » du cahier des charges est **close** par le contrat d'API validé (`GET /audit-events` — Admin) et **EF-77**.

---

## 5. Périmètres

### 5.1 Notion de « propres tâches »

Une tâche est **propre** à un utilisateur si **au moins une** des conditions suivantes est vraie :

| Condition | Champ | Remarque |
|---|---|---|
| Il en est l'**exécutant** | `assigneAEmployeId = employe.id` ou `assigneAPartenaireId = partenaire.id` | Employé pour une tâche `GD_TRADING`, partenaire pour une tâche `PARTENAIRE` (EF-26, D81) |
| Il en est le **pilote interne** | `piloteEmployeId = employe.id` | Un pilote partenaire ne crée pas de « tâche propre » interne |
| Il en est le **créateur** | `creeParId = utilisateur.id` | Même si la tâche a été réattribuée depuis |

> Un `CONSULTANT` **sans fiche employé** n'a aucune « tâche propre » : ses vues personnelles sont **inaccessibles** (D39). Un `CONSULTANT` **avec** fiche employé reste limité à la vue `toutes` : l'API réserve les vues `mes-*` aux rôles non-consultants (API §6.2).

### 5.2 Service porteur

Règle **D29 / D34 / D81** : le service porteur est le **département de l'exécutant** ; si l'exécutant n'a pas de département — notamment lorsque l'assigné est un **partenaire** —, celui du **pilote employé** ; sinon **aucun**. Il est **calculé à chaque lecture**, jamais stocké.

**Conséquence de D81** : une tâche dont l'acteur est `PARTENAIRE` a toujours un assigné partenaire, donc **aucun département d'exécutant**. Son service porteur est celui du pilote s'il est un **employé interne**, et **aucun** si le pilote est lui-même un partenaire.

**Conséquence pour l'autorisation** : un `RESPONSABLE` voit et écrit sur les tâches dont le **service porteur calculé** est **son** département. Il ne suffit pas qu'un employé de son service soit intervenu : c'est bien le service porteur de la tâche qui compte.

### 5.3 Périmètre de lecture (RM-10)

| Rôle | Tâches visibles |
|---|---|
| `ADMIN` | Toutes, **y compris** les tâches supprimées logiquement **via `supprimees=true`** uniquement |
| `CONSULTANT` | Toutes, **lecture seule** |
| `RESPONSABLE` | Tâches dont le **service porteur** = son département **+** ses propres tâches |
| `EMPLOYEE` | Ses propres tâches (assignées **ou** pilotées **ou** créées) |

**Tâches supplémentaires (précision du 09/11/2026)** : quel que soit leur rôle, un
utilisateur ne voit **que les tâches supplémentaires qu'il a lui-même créées**.
Cette règle prime sur les périmètres ci-dessus : ni l'`ADMIN`, ni le
`CONSULTANT`, ni le `RESPONSABLE` d'un service ne voient les tâches
supplémentaires d'un autre utilisateur. Elles n'apparaissent dans aucune vue
(`toutes`, `service`, `mes-*`, `supplementaires`) et leur détail renvoie `404`.

**Cas limites (CDC §3.3, validés)** :

| Situation | Qui voit la tâche |
|---|---|
| Assignée à A, pilotée par B | A, B, leurs responsables respectifs si la tâche est dans leur service porteur, admin, consultant |
| Pilotée par un partenaire, assignée à un interne | L'exécutant, son responsable si la tâche est dans son service porteur, admin, consultant |
| Assignée à un partenaire, pilotée par un employé interne (acteur `PARTENAIRE`) | Le pilote, son responsable **si** son département est le service porteur, admin, consultant ; l'assigné partenaire n'a **aucune vue personnelle** |
| Assignée à un partenaire et pilotée par un partenaire | Admin et consultant ; **aucun responsable** (aucun département) |
| Sans département (ni exécutant ni pilote rattachés) | Exécutant, pilote, créateur, admin, consultant ; **aucun responsable** |
| Créée par un employé pour lui-même | L'employé, son responsable **si** son département est le service porteur, admin, consultant |
| Annulée | Reste visible selon les mêmes règles ; elle n'est pas supprimée |
| Supprimée logiquement | Invisible partout, **sauf** `GET /tasks?supprimees=true` (admin) — T8-09 |

### 5.4 Périmètre d'écriture

« Écrire » couvre : **modifier**, **changer le statut manuel**, **changer la progression**, **clôturer**, **commenter**. Même périmètre que la lecture, **hors `CONSULTANT`** qui n'écrit jamais (EF-07).

| Rôle | Peut écrire sur |
|---|---|
| `ADMIN` | Toutes les tâches visibles |
| `RESPONSABLE` | Service porteur = son département **+** ses propres tâches |
| `EMPLOYEE` | Ses propres tâches |
| `CONSULTANT` | Aucune |

### 5.5 Périmètre de création et de désignation

| Rôle | Peut créer pour | Peut désigner comme exécutant | Peut désigner comme pilote |
|---|---|---|---|
| `ADMIN` | Lui-même, tout employé, tout responsable ; **et toute tâche `PARTENAIRE` assignée à un partenaire actif** | Tout employé **actif** ; tout partenaire **actif** pour une tâche `PARTENAIRE` | Employé **actif** ou partenaire **actif** ; pour une tâche `PARTENAIRE`, employé **ou** partenaire |
| `RESPONSABLE` | Employés de **son département** + lui-même | Membre de son département ou lui-même, **actif** ; **partenaire interdit** | Membre de son département ou lui-même (**partenaire interdit**, D47) |
| `EMPLOYEE` | **Lui-même uniquement** | Lui-même, **actif** | Lui-même (**partenaire interdit**, D47) |
| `CONSULTANT` | Personne | — | — |

> **D49** : un employé **inactif** est refusé comme exécutant (`422 EMPLOYE_INACTIF`), quel que soit le rôle du créateur.
>
> **D81 (05/11/2026)** : une tâche dont l'acteur est `PARTENAIRE` est **réservée à l'`ADMIN`**, en création comme en modification. Son assigné est obligatoirement un **partenaire actif** du référentiel (`422 ASSIGNE_INVALIDE` / `422 PARTENAIRE_INACTIF`). Le pilote est **exactement un** : employé interne **ou** partenaire, les deux champs étant mutuellement exclusifs. Un même partenaire peut être à la fois assigné et pilote.

### 5.6 Périmètre de duplication

La duplication **suit le périmètre de création** (EF-62) :

| Rôle | Peut dupliquer |
|---|---|
| `ADMIN` | Toute tâche |
| `RESPONSABLE` | Tâche de son service ou tâche personnelle, **vers** son service ou lui-même |
| `EMPLOYEE` | Sa propre tâche, **vers** lui-même |
| `CONSULTANT` | Aucune |

**Conséquences D44** : 31 dates maximum par appel, jours ouvrés obligatoires pour une quotidienne, aucun commentaire ni motif copié, opération **atomique**.

### 5.7 Périmètre de suppression

| Rôle | Peut supprimer |
|---|---|
| `ADMIN` | **Toute** tâche |
| `RESPONSABLE` | **Uniquement** les tâches qu'il a **lui-même attribuées** (`attribueParId = lui`) |
| `EMPLOYEE` | Aucune |
| `CONSULTANT` | Aucune |

> La suppression est **logique** (D36) et **irréversible en V1** (D51). Un responsable ne peut pas contourner la règle en supprimant une tâche de son service qu'il n'a pas attribuée : il peut l'**annuler**.

---

## 6. Correspondance droits → endpoints (les 54 endpoints)

> Légende : **✅** ouvert · **✅ c.** ouvert **sous condition** de périmètre · **❌** fermé (`403`) · **404** ressource hors périmètre.
> Les 54 endpoints sont ceux de l'ÉTAPE 8. **Aucun endpoint n'est ajouté, retiré ou renommé.**

### 6.1 Authentification et santé — 6 endpoints

| Endpoint | `ADMIN` | `RESPONSABLE` | `EMPLOYEE` | `CONSULTANT` | Remarque |
|---|---|---|---|---|---|
| `POST /auth/login` | Public | Public | Public | Public | Message d'erreur générique (EF-10) |
| `POST /auth/logout` | ✅ | ✅ | ✅ | ✅ | Sa propre session uniquement |
| `GET /auth/csrf` | ✅ | ✅ | ✅ | ✅ | Jeton anti-CSRF |
| `POST /auth/password` | ✅ | ✅ | ✅ | ✅ | Son propre mot de passe |
| `GET /me` | ✅ | ✅ | ✅ | ✅ | Droits **calculés par le serveur** |
| `GET /health` | Public | Public | Public | Public | Aucune donnée métier |

### 6.2 Tâches — 12 endpoints

| Endpoint | `ADMIN` | `RESPONSABLE` | `EMPLOYEE` | `CONSULTANT` | Condition |
|---|---|---|---|---|---|
| `GET /tasks` | ✅ | ✅ c. | ✅ c. | ✅ c. | Vues : voir §6.10 |
| `GET /tasks/:id` | ✅ | ✅ c. | ✅ c. | ✅ | Visible = RM-10 ; sinon `404` |
| `POST /tasks` | ✅ | ✅ c. | ✅ c. | ❌ | Périmètre de création §5.5 |
| `PATCH /tasks/:id` | ✅ | ✅ c. | ✅ c. | ❌ | Périmètre d'écriture §5.4 ; titulaire = §5.5 |
| `PATCH /tasks/:id/status` | ✅ | ✅ c. | ✅ c. | ❌ | **Autorisé même sur une tâche clôturée** (CA-12) |
| `PATCH /tasks/:id/progress` | ✅ | ✅ c. | ✅ c. | ❌ | 0-100 entier |
| `POST /tasks/:id/close` | ✅ | ✅ c. | ✅ c. | ❌ | Motif obligatoire si tardive (D15, D56) |
| `GET /tasks/:id/comments` | ✅ | ✅ c. | ✅ c. | ✅ | Visible = RM-10 |
| `POST /tasks/:id/comments` | ✅ | ✅ c. | ✅ c. | ❌ | Texte non vide (D57) |
| `POST /tasks/:id/duplicate` | ✅ | ✅ c. | ✅ c. | ❌ | Périmètre de duplication §5.6 |
| `DELETE /tasks/:id` | ✅ | ✅ c. | ❌ | ❌ | Responsable : `attribueParId = lui` |
| `GET /tasks/:id/history` | ✅ | ✅ c. | ✅ c. | ✅ | Historique **réduit** hors admin (D53) |

### 6.3 Employés — 4 endpoints

| Endpoint | `ADMIN` | `RESPONSABLE` | `EMPLOYEE` | `CONSULTANT` | Remarque |
|---|---|---|---|---|---|
| `GET /employees` | ✅ | ✅ | ✅ | ✅ | `email` renvoyé **à l'admin seulement** (API §8.10) |
| `GET /employees/:id` | ✅ | ✅ | ✅ | ✅ | Même règle sur `email` |
| `POST /employees` | ✅ | ❌ | ❌ | ❌ | — |
| `PATCH /employees/:id` | ✅ | ❌ | ❌ | ❌ | Désactivation = D50 |

> `DELETE /employees/:id` **n'est pas exposé** (`405`) : un employé référencé est désactivé, jamais supprimé (EF-11, D12).

### 6.4 Comptes et rôles — 5 endpoints

| Endpoint | `ADMIN` | `RESPONSABLE` | `EMPLOYEE` | `CONSULTANT` | Remarque |
|---|---|---|---|---|---|
| `GET /accounts` | ✅ | ❌ | ❌ | ❌ | Aucun secret renvoyé |
| `GET /accounts/:id` | ✅ | ❌ | ❌ | ❌ | — |
| `POST /accounts` | ✅ | ❌ | ❌ | ❌ | `409 COMPTE_DEJA_LIE` (D12) |
| `PATCH /accounts/:id` | ✅ | ❌ | ❌ | ❌ | Rôle, activation, lien employé |
| `POST /accounts/:id/reset-password` | ✅ | ❌ | ❌ | ❌ | Détail **ÉTAPE 13** (P12) |

> `DELETE /accounts/:id` **n'est pas exposé** (`405`) : un compte est désactivé, jamais supprimé (D12).

### 6.5 Départements — 5 endpoints

| Endpoint | `ADMIN` | `RESPONSABLE` | `EMPLOYEE` | `CONSULTANT` | Remarque |
|---|---|---|---|---|---|
| `GET /departments` | ✅ | ✅ | ✅ | ✅ | — |
| `GET /departments/:id` | ✅ | ✅ | ✅ | ✅ | — |
| `POST /departments` | ✅ | ❌ | ❌ | ❌ | — |
| `PATCH /departments/:id` | ✅ | ❌ | ❌ | ❌ | Désactivation refusée si responsable (D48) |
| `DELETE /departments/:id` | ✅ | ❌ | ❌ | ❌ | Refus si référencé ; `409 DEPARTEMENT_AVEC_RESPONSABLE` (D48) |

### 6.6 Partenaires — 5 endpoints

| Endpoint | `ADMIN` | `RESPONSABLE` | `EMPLOYEE` | `CONSULTANT` | Remarque |
|---|---|---|---|---|---|
| `GET /partners` | ✅ | ✅ | ✅ | ✅ | — |
| `GET /partners/:id` | ✅ | ✅ | ✅ | ✅ | — |
| `POST /partners` | ✅ | ❌ | ❌ | ❌ | — |
| `PATCH /partners/:id` | ✅ | ❌ | ❌ | ❌ | — |
| `DELETE /partners/:id` | ✅ | ❌ | ❌ | ❌ | Refus si pilote d'une tâche (`409 REFERENTIEL_REFERENCE`) |

### 6.7 Éléments / piliers — 5 endpoints

| Endpoint | `ADMIN` | `RESPONSABLE` | `EMPLOYEE` | `CONSULTANT` | Remarque |
|---|---|---|---|---|---|
| `GET /elements` | ✅ | ✅ | ✅ | ✅ | — |
| `GET /elements/:id` | ✅ | ✅ | ✅ | ✅ | — |
| `POST /elements` | ✅ | ❌ | ❌ | ❌ | — |
| `PATCH /elements/:id` | ✅ | ❌ | ❌ | ❌ | — |
| `DELETE /elements/:id` | ✅ | ❌ | ❌ | ❌ | Refus si utilisé (`409 REFERENTIEL_REFERENCE`) |

### 6.8 Priorités — 5 endpoints

| Endpoint | `ADMIN` | `RESPONSABLE` | `EMPLOYEE` | `CONSULTANT` | Remarque |
|---|---|---|---|---|---|
| `GET /urgencies` | ✅ | ✅ | ✅ | ✅ | 4 valeurs figées |
| `GET /importances` | ✅ | ✅ | ✅ | ✅ | 4 valeurs figées |
| `GET /priority-matrix` | ✅ | ✅ | ✅ | ✅ | 13 lignes, lecture seule |
| `GET /actions-a-prendre` | ✅ | ✅ | ✅ | ✅ | 3 valeurs |
| `PATCH /actions-a-prendre/:id` | ✅ | ❌ | ❌ | ❌ | Activation / désactivation |

> Aucun endpoint d'écriture pour urgences, importances et matrice : elles sont **figées** (EF-20).

### 6.9 Jours fériés, paramètres, audit — 7 endpoints

| Endpoint | `ADMIN` | `RESPONSABLE` | `EMPLOYEE` | `CONSULTANT` | Remarque |
|---|---|---|---|---|---|
| `GET /holidays` | ✅ | ✅ | ✅ | ✅ | Filtre `annee` |
| `POST /holidays` | ✅ | ❌ | ❌ | ❌ | — |
| `PATCH /holidays/:id` | ✅ | ❌ | ❌ | ❌ | — |
| `DELETE /holidays/:id` | ✅ | ❌ | ❌ | ❌ | — |
| `GET /settings` | ✅ | ✅ | ✅ | ✅ | `fuseau` non modifiable (D30) |
| `PATCH /settings` | ✅ | ❌ | ❌ | ❌ | Ordre des heures contrôlé |
| `GET /audit-events` | ✅ | ❌ | ❌ | ❌ | **Append-only** (EF-77, D42) |

### 6.10 Détail des vues de `GET /tasks`

| Vue | Contenu | `ADMIN` | `RESPONSABLE` | `EMPLOYEE` | `CONSULTANT` |
|---|---|---|---|---|---|
| `mes-taches-du-jour` | Tâches où je suis assigné, pilote ou créateur ; `dateAction` = aujourd'hui ; non clôturées, non annulées | ✅ si fiche employé | ✅ si fiche employé | ✅ si fiche employé | ❌ |
| `mes-autres-taches` | Tâches `AUTRE` qui me sont assignées, non clôturées, non annulées | ✅ si fiche employé | ✅ si fiche employé | ✅ si fiche employé | ❌ |
| `mes-taches` | Assignées + pilotées + créées (A13) | ✅ si fiche employé | ✅ si fiche employé | ✅ si fiche employé | ❌ |
| `service` | Tâches dont le service porteur est mon département | ✅ (peut préciser `departementId`) | ✅ | ❌ | ❌ |
| `supplementaires` | Tâches supplémentaires **que j'ai créées** | ✅ (les siennes) | ✅ (les siennes) | ✅ (les siennes) | ❌ |
| `toutes` | Toutes les tâches, **hors tâches supplémentaires d'autrui** | ✅ | ❌ | ❌ | ✅ |

> Le `CONSULTANT` n'utilise que `vue=toutes` ; toute autre vue → `403` (API §6.2). Un `ADMIN` sans fiche employé ne peut pas utiliser les vues `mes-*`.
>
> **Tâches supplémentaires** : filtre appliqué à **toutes** les vues — seul le créateur les voit (admin et consultant compris).

**Comptage des endpoints** : 6 + 12 + 4 + 5 + 5 + 5 + 5 + 5 + 7 = **54**. ✅ Aucun endpoint du contrat n'est laissé sans règle d'accès.

---

## 7. Fonctions d'autorisation serveur

> Module **unique** (API §4.1). Les contrôleurs **appellent** ces fonctions ; ils ne réimplémentent pas la logique.

| Fonction | Entrées | Décide | Renvoie |
|---|---|---|---|
| `peutVoirTache` | utilisateur, tâche | Périmètre de lecture §5.3 | booléen |
| `peutCreerTache` | utilisateur, cible (exécutant, pilote) | Périmètre de création §5.5 | booléen |
| `peutModifierTache` | utilisateur, tâche | Écriture descriptive (hors titulaire) §5.4 | booléen |
| `peutChangerTitulaire` | utilisateur, tâche, nouvelle cible | Périmètre de création §5.5 | booléen |
| `peutCloturerTache` | utilisateur, tâche | Écriture + tâche non clôturée | booléen |
| `peutCommenter` | utilisateur, tâche | Même périmètre que la modification | booléen |
| `peutDupliquerTache` | utilisateur, tâche, dates | Périmètre de duplication §5.6 | booléen |
| `peutSupprimerTache` | utilisateur, tâche | D7 / §5.7 | booléen |
| `peutGererReferentiels` | utilisateur | `role = ADMIN` | booléen |
| `peutGererComptes` | utilisateur | `role = ADMIN` | booléen |
| `peutConsulterAudit` | utilisateur | `role = ADMIN` | booléen |

### 7.1 Algorithme de `peutVoirTache`

```text
si utilisateur.role = ADMIN        → vrai
si utilisateur.role = CONSULTANT   → vrai
si tâche.supprimee                 → faux            (sauf admin via supprimees=true)
si utilisateur.role = EMPLOYEE     → tâche est propre à l'utilisateur ? vrai : faux
si utilisateur.role = RESPONSABLE  → (servicePorteur(tâche) = utilisateur.departement) OU tâche propre ? vrai : faux
sinon                              → faux
```

### 7.2 Algorithme de `peutModifierTache`

```text
si utilisateur.role = CONSULTANT   → faux
si non peutVoirTache(tâche)        → faux
si utilisateur.role = ADMIN        → vrai
sinon                              → (servicePorteur(tâche) = utilisateur.departement) OU tâche propre ? vrai : faux
```

> `peutCommenter` **réutilise** `peutModifierTache` : mêmes périmètres, aucune divergence (API §4.1).

### 7.3 Algorithme de `peutSupprimerTache`

```text
si utilisateur.role = ADMIN                          → vrai
si utilisateur.role = RESPONSABLE et tâche.attribueParId = utilisateur.id → vrai
sinon                                                → faux
```

> La suppression du responsable ne dépend **pas** du service porteur : elle dépend de **qui a attribué** la tâche (D7).

### 7.4 Algorithme de `peutCreerTache`

```text
si utilisateur.role = CONSULTANT                    → faux
si exécutant inactif                                → faux (D49)
si utilisateur.role = ADMIN                         → vrai (tout employé actif)
si utilisateur.role = RESPONSABLE                   → exécutant = lui-même OU exécutant.departement = son département
si utilisateur.role = EMPLOYEE                      → exécutant = lui-même
et si pilote est un partenaire                      → vrai seulement pour ADMIN (D47)
```

### 7.5 Ce que les fonctions ne font jamais

- Elles ne **lisent pas** le rôle depuis un paramètre de requête ou un en-tête.
- Elles ne **font pas confiance** au champ `droits` envoyé par le client.
- Elles ne **modifient pas** la ressource : elles **décident**, puis le service métier agit.
- Elles ne **remplacent pas** les validations métier (`422`) ni le verrou optimiste (`409`).

---

## 8. Cycle de vie du compte et du rôle

### 8.1 Création

| Étape | Règle | Erreur |
|---|---|---|
| 1 | L'employé existe et est **actif** | `422 EMPLOYE_INACTIF` / `404` |
| 2 | L'employé n'a **pas déjà** de compte | `409 COMPTE_DEJA_LIE` |
| 3 | L'identifiant est **libre** | `409 IDENTIFIANT_DEJA_UTILISE` |
| 4 | Si `role = RESPONSABLE`, l'employé a un **département** | `422 RESPONSABLE_SANS_DEPARTEMENT` |
| 5 | Si `role = RESPONSABLE`, le département n'a **pas déjà** un responsable | `409 RESPONSABLE_DEJA_PRESENT` |
| 6 | Le compte est créé | `201`, **sans** hash ni secret |

> `employeId` peut être `null` **uniquement** pour un `CONSULTANT` (D39).

### 8.2 Changement de rôle

| Situation | Comportement | Source |
|---|---|---|
| `EMPLOYEE` → `RESPONSABLE` | Exige un département ; refuse si le département a déjà un responsable | EF-05, D35 |
| `RESPONSABLE` → `EMPLOYEE` | Autorisé ; le département de l'employé **n'est pas** modifié | D7 |
| Tout rôle → `CONSULTANT` | Autorisé ; le consultant perd toute écriture **immédiatement** | D7, EF-07 |
| `CONSULTANT` → rôle actif | Autorisé ; les droits de lecture/écriture sont recalculés | D7 |
| Changement de rôle d'un `ADMIN` | ⚠️ **Zone grise G1** — non tranché | — |

**Effet immédiat** : les droits sont recalculés à la requête suivante ; l'interface doit rafraîchir `GET /me` après un changement de son propre rôle. ⚠️ L'effet exact sur une session **ouverte** d'un autre utilisateur est **zone grise G2**.

### 8.3 Désactivation

| Événement | Effet | Source |
|---|---|---|
| `PATCH /accounts/:id { actif: false }` | Connexion refusée ; sessions **révoquées immédiatement** | D12, D50 |
| `PATCH /employees/:id { actif: false }` | **Désactive le compte** et **révoque les sessions**, même transaction | D50 |
| Réactivation | La connexion redevient possible ; aucun droit n'est « rendu » au-delà du rôle courant | D12 |
| Suppression | **Impossible** : `DELETE` non exposé (`405`) | D12 |

**Conséquences** :

- un compte désactivé reçoit `401 SESSION_EXPIREE` à la requête suivante ;
- un employé désactivé **ne peut plus** être désigné comme exécutant (`422 EMPLOYE_INACTIF`, D49) ;
- ⚠️ **Zone grise G3** : le sort des tâches **déjà assignées** à un employé désactivé n'est tranché par aucune décision. **Aucun traitement automatique n'est appliqué** : les tâches restent en l'état.

### 8.4 Le responsable et son département

| Situation | Comportement | Source |
|---|---|---|
| Département avec un responsable | **Suppression refusée** (`409 DEPARTEMENT_AVEC_RESPONSABLE`) | D48 |
| Département avec un responsable | **Désactivation refusée** (même code) | D48 |
| Département sans responsable | Suppression possible **si non référencé** | EF-14, D48 |
| Responsable dont le département est supprimé | **Impossible** par D48 : le département ne peut pas être supprimé tant qu'il porte un responsable | D48 |
| Transfert d'un responsable vers un autre département | Autorisé, sous réserve de l'unicité par département (D35) ; l'ancien département n'a plus de responsable | D35, 🔧 |

> **Conséquence** : aucun responsable ne peut se retrouver « orphelin » de département par suppression. Le cas est **fermé par D48**, ce n'est pas une zone grise.

### 8.5 Le dernier administrateur

⚠️ **Zone grise G1** : aucune décision validée n'interdit à un `ADMIN` de :
- retirer son propre rôle ;
- désactiver son propre compte ;
- rétrograder le dernier `ADMIN` restant.

Le contrat d'API **techniquement** l'autorise (aucune règle contraire). **Aucune protection n'est ajoutée** dans ce document. Point signalé au directeur (section 13).

---

## 9. Droits calculés renvoyés par `GET /me`

`GET /me` renvoie `droits`, **calculés par le serveur** (API §7.5). L'interface les utilise pour **masquer**, jamais pour **autoriser**.

| Droit | Vrai pour | Usage d'interface |
|---|---|---|
| `voirToutesLesTaches` | `ADMIN`, `CONSULTANT` | Entrée « Toutes les tâches » |
| `voirTachesService` | `RESPONSABLE` (et `ADMIN` selon le contrat) | Entrée « Mon service » |
| `creerPourAutrui` | `ADMIN` | Sélecteur d'exécutant complet |
| `creerPourSonService` | `RESPONSABLE` | Sélecteur limité au service |
| `supprimerTouteTache` | `ADMIN` | Bouton Supprimer partout |
| `supprimerTachesAttribuees` | `RESPONSABLE` | Bouton Supprimer sur ses attributions |
| `gererReferentiels` | `ADMIN` | Entrées Référentiels / Paramètres |
| `gererComptes` | `ADMIN` | Entrée Comptes |
| `consulterAudit` | `ADMIN` | Entrée Audit |
| `lectureSeule` | `CONSULTANT` | Masque **toutes** les actions d'écriture |

> **Règle** : masquer une entrée **n'est pas** une sécurité. Chaque route refait l'appel API et affiche `403` si le serveur refuse (doc 08 §3.3).

---

## 10. Journal d'audit et traçabilité des droits

### 10.1 Événements liés aux comptes et aux rôles

| Déclencheur | Type journalisé | Contenu minimal | Interdit |
|---|---|---|---|
| `POST /accounts` | `COMPTE` | Compte créé, rôle, employé lié | Aucun mot de passe, aucun hash |
| `PATCH /accounts/:id` (rôle) | `ROLE` | Rôle avant / après | Aucun secret |
| `PATCH /accounts/:id` (état) | `COMPTE` | `actif` avant / après | Aucun secret |
| `PATCH /employees/:id` | `REFERENTIEL` | Avant / après | — |
| `POST /auth/login` | `CONNEXION` | Identifiant tenté, résultat, IP | **Jamais** le mot de passe |
| `POST /auth/password` | `COMPTE` | Changement, **sans valeur** | Aucun mot de passe |

### 10.2 Événements de contrôle d'accès

| Situation | Journalisé ? | Source |
|---|---|---|
| `403` sur une route | Non (sauf décision contraire de l'ÉTAPE 13) | 🔧 |
| `404` hors périmètre | Non | 🔧 |
| Échec de connexion | **Oui**, sans révéler l'existence du compte | EF-10 (ÉTAPE 13) |
| Suppression d'une tâche | Oui, `SUPPRESSION` | EF-69 |

### 10.3 Règles communes

- l'écriture métier et son événement d'audit sont dans la **même transaction** (API §10) ;
- un échec d'audit **annule** l'écriture ;
- `journal_audit` est **append-only** : aucun `UPDATE`, aucun `DELETE` (D42, EF-77) ;
- aucun secret, hash ou jeton n'est journalisé.

---

## 11. Ce que l'ÉTAPE 10 confirme — et ce qu'elle ne change pas

### 11.1 Confirmations

| # | Confirmation | Source |
|---|---|---|
| 1 | Le rôle est porté par le **compte**, jamais par la fiche employé | D7 |
| 2 | Le **serveur** est seul juge ; l'interface ne fait que masquer | EF-03 |
| 3 | Le `CONSULTANT` **lit tout** et **n'écrit jamais** | D21, EF-07 |
| 4 | Le `RESPONSABLE` est strictement limité à **son service porteur + ses propres tâches** | D17, RM-10 |
| 5 | La **suppression** du responsable est limitée aux tâches **qu'il a attribuées** | D7, EF-67 |
| 6 | Un non-admin **ne peut jamais** désigner un partenaire comme pilote | D47 |
| 7 | Un employé **inactif** est refusé comme exécutant | D49 |
| 8 | La désactivation d'un employé **désactive le compte et révoque les sessions** | D50 |
| 9 | Un département avec responsable **ne peut être ni supprimé ni désactivé** | D48 |
| 10 | IHM-09 est **partagé** `ADMIN` / `CONSULTANT` (lecture seule) | D63 |

### 11.2 Non-modifications

- Aucune règle métier, aucun statut, aucune priorité, aucun calcul ne change.
- Aucun endpoint n'est ajouté, retiré ou renommé.
- Aucun écran n'est modifié.
- Aucune zone grise n'est tranchée.
- **Aucun code n'est écrit.**

---

## 12. Matrice de tests d'autorisation (préparation ÉTAPE 12)

> Chaque ligne est un **cas testable**. Le test vérifie le **code HTTP** et, pour les listes, le **contenu** (aucune ligne hors périmètre).

### 12.1 Lecture

| # | Acteur | Action | Attendu |
|---|---|---|---|
| T10-01 | `EMPLOYEE` | `GET /tasks?vue=mes-taches` | `200`, uniquement ses tâches |
| T10-02 | `EMPLOYEE` | `GET /tasks?vue=toutes` | `403` |
| T10-03 | `EMPLOYEE` | `GET /tasks?vue=service` | `403` |
| T10-04 | `EMPLOYEE` | `GET /tasks/:id` d'une tâche d'un collègue | `404` |
| T10-05 | `RESPONSABLE` | `GET /tasks?vue=service` | `200`, service porteur = son département |
| T10-06 | `RESPONSABLE` | `GET /tasks/:id` d'une tâche d'un autre service | `404` |
| T10-07 | `RESPONSABLE` | `GET /tasks?vue=mes-taches` | `200`, ses propres tâches |
| T10-08 | `ADMIN` | `GET /tasks?vue=toutes` | `200`, toutes |
| T10-09 | `ADMIN` | `GET /tasks?supprimees=true` | `200`, tâches supprimées incluses |
| T10-10 | `CONSULTANT` | `GET /tasks?vue=toutes` | `200`, toutes |
| T10-11 | `CONSULTANT` | `GET /tasks?vue=mes-taches` | `403` |
| T10-12 | `CONSULTANT` | `GET /tasks/:id` | `200` |
| T10-13 | `EMPLOYEE` | `GET /tasks/:id/history` | `200`, **sans** valeurs avant / après (D53) |
| T10-14 | `ADMIN` | `GET /tasks/:id/history` | `200`, **avec** valeurs avant / après |
| T10-15 | Tous | `GET /me` | `200`, droits calculés cohérents avec le rôle |

### 12.2 Écriture

| # | Acteur | Action | Attendu |
|---|---|---|---|
| T10-16 | `CONSULTANT` | `POST /tasks` | `403` |
| T10-17 | `CONSULTANT` | `PATCH /tasks/:id` | `403` |
| T10-18 | `CONSULTANT` | `POST /tasks/:id/comments` | `403` |
| T10-19 | `CONSULTANT` | `POST /tasks/:id/close` | `403` |
| T10-20 | `EMPLOYEE` | `PATCH /tasks/:id` d'une tâche d'un collègue | `404` |
| T10-21 | `EMPLOYEE` | `PATCH /tasks/:id` de sa tâche | `200` |
| T10-22 | `EMPLOYEE` | `POST /tasks` avec `assigneAEmployeId` ≠ lui | `403` |
| T10-23 | `EMPLOYEE` | `POST /tasks` avec pilote partenaire | `422 PILOTE_INVALIDE` (D47) |
| T10-24 | `RESPONSABLE` | `POST /tasks` pour un employé de son service | `201` |
| T10-25 | `RESPONSABLE` | `POST /tasks` pour un employé d'un autre service | `403` |
| T10-26 | `RESPONSABLE` | `POST /tasks` avec pilote partenaire | `422 PILOTE_INVALIDE` (D47) |
| T10-27 | `ADMIN` | `POST /tasks` avec pilote partenaire | `201` |
| T10-28 | Tous non-admin | Assigner un employé **inactif** | `422 EMPLOYE_INACTIF` (D49) |
| T10-29 | `EMPLOYEE` | `PATCH /tasks/:id/status` sur une tâche clôturée | `200` si tâche propre (CA-12) |
| T10-30 | `RESPONSABLE` | `PATCH /tasks/:id/progress` hors service | `404` |
| T10-30b | `ADMIN` | `POST /tasks` acteur `PARTENAIRE`, assigné partenaire actif, pilote employé | `201` (D81) |
| T10-30c | `ADMIN` | `POST /tasks` acteur `PARTENAIRE`, pilote **partenaire** | `201` (D81) |
| T10-30d | `ADMIN` | `POST /tasks` acteur `PARTENAIRE` avec `assigneAEmployeId` | `422 ASSIGNE_INVALIDE` (D81) |
| T10-30e | `ADMIN` | `POST /tasks` acteur `PARTENAIRE` sans pilote | `422 PILOTE_INVALIDE` (D81) |
| T10-30f | `ADMIN` | `POST /tasks` acteur `PARTENAIRE` avec partenaire **inactif** | `422 PARTENAIRE_INACTIF` (D81) |
| T10-30g | `RESPONSABLE` / `EMPLOYEE` | `POST /tasks` acteur `PARTENAIRE` | `403` (D81) |
| T10-30h | `ADMIN` | `PATCH /tasks/:id` acteur `GD_TRADING` → `PARTENAIRE` | `200`, assigné et pilote incompatibles remis à `null` (D81) |

### 12.3 Suppression et duplication

| # | Acteur | Action | Attendu |
|---|---|---|---|
| T10-31 | `ADMIN` | `DELETE /tasks/:id` | `204` |
| T10-32 | `RESPONSABLE` | `DELETE /tasks/:id` attribuée par lui | `204` |
| T10-33 | `RESPONSABLE` | `DELETE /tasks/:id` de son service mais attribuée par un employé | `403` |
| T10-34 | `EMPLOYEE` | `DELETE /tasks/:id` | `403` |
| T10-35 | `CONSULTANT` | `DELETE /tasks/:id` | `403` |
| T10-36 | `RESPONSABLE` | `POST /tasks/:id/duplicate` hors service | `404` |
| T10-37 | `EMPLOYEE` | `POST /tasks/:id/duplicate` vers un collègue | `403` |
| T10-38 | `CONSULTANT` | `POST /tasks/:id/duplicate` | `403` |

### 12.4 Administration

| # | Acteur | Action | Attendu |
|---|---|---|---|
| T10-39 | `RESPONSABLE` | `POST /employees` | `403` |
| T10-40 | `EMPLOYEE` | `PATCH /departments/:id` | `403` |
| T10-41 | `RESPONSABLE` | `GET /accounts` | `403` |
| T10-42 | `CONSULTANT` | `GET /accounts` | `403` |
| T10-43 | `ADMIN` | `GET /accounts` | `200`, aucun secret |
| T10-44 | `RESPONSABLE` | `GET /audit-events` | `403` |
| T10-45 | `ADMIN` | `GET /audit-events` | `200` |
| T10-46 | `ADMIN` | `POST /accounts` avec `RESPONSABLE` sans département | `422 RESPONSABLE_SANS_DEPARTEMENT` |
| T10-47 | `ADMIN` | `POST /accounts` pour un département ayant déjà un responsable | `409 RESPONSABLE_DEJA_PRESENT` |
| T10-48 | `ADMIN` | `POST /accounts` pour un employé ayant déjà un compte | `409 COMPTE_DEJA_LIE` |
| T10-49 | `ADMIN` | `DELETE /employees/:id` | `405` |
| T10-50 | `ADMIN` | `DELETE /accounts/:id` | `405` |

### 12.5 Cycle de vie

| # | Acteur | Action | Attendu |
|---|---|---|---|
| T10-51 | `ADMIN` | Désactiver un employé (`PATCH /employees/:id { actif:false }`) | `200`, compte désactivé, sessions révoquées (D50) |
| T10-52 | Compte désactivé | Toute requête authentifiée | `401 SESSION_EXPIREE` |
| T10-53 | `ADMIN` | `PATCH /departments/:id` d'un département avec responsable | `409 DEPARTEMENT_AVEC_RESPONSABLE` (D48) |
| T10-54 | `ADMIN` | `DELETE /departments/:id` d'un département avec responsable | `409 DEPARTEMENT_AVEC_RESPONSABLE` (D48) |

> Ces **54 cas** ont été repris et complétés à l'**ÉTAPE 12** : **TC-AUT-001 → TC-AUT-054**, puis **8 cas supplémentaires** (TC-AUT-055 → TC-AUT-062) issus des **DÉCISIONS 72 à 75**. Ils ne constituent pas des tests écrits à ce stade du document.

---

## 13. Zones grises — tranchées le 02/11/2026

> **Complément du 02/11/2026 (ÉTAPE 12)** : les quatre zones laissées ouvertes à la validation de l'ÉTAPE 10 sont désormais **tranchées** par les **DÉCISIONS 72 à 75**. Elles ne sont donc **plus des zones grises** et ne sont plus reportées à l'ÉTAPE 13.

| # | Zone grise | Décision | Traitement retenu |
|---|---|---|---|
| **G1** | **Rôle et compte du dernier administrateur** | **D72** | **Protection** : refus de retirer le rôle `ADMIN` au **dernier compte `ADMIN` actif** et refus de le désactiver. `409 DERNIER_ADMIN`. |
| **G2** | **Effet d'un changement de rôle sur une session ouverte** | **D73** | **Effet immédiat** : les droits sont recalculés à **chaque requête** (D29) ; `GET /me` les renvoie. |
| **G3** | **Tâches d'un employé désactivé** | **D74** | **Annulation des tâches non commencées** : statut calculé `A faire` → `ANNULEE`. Les tâches `En cours`, `Retard`, `Achevée` et `Suspendue` restent inchangées. |
| **G4** | **Auto-modification du rôle d'un `ADMIN`** | **D75** | **Interdiction** de modifier son propre rôle ou de se désactiver soi-même. `403 AUTO_MODIFICATION_INTERDITE`. |

> **Précisions de D74 confirmées le 02/11/2026** : seules les tâches où l'employé est **assigné** (`assigne_a_employe_id`) sont concernées ; seules celles au statut calculé **`A faire`** sont annulées. Voir `docs\11_STRATEGIE_ET_PLAN_DE_TESTS.md` §13.2.

---

## 14. Traçabilité

| Élément du CDC / API | Traitement |
|---|---|
| EF-02 (compte désactivé) | §8.3, T10-52 |
| EF-03 (contrôle serveur) | §3, §7 |
| EF-04 (admin crée / attribue / désactive) | §6.4, §8 |
| EF-05 (`RESPONSABLE` + département) | §2.1, §8.2, T10-46 |
| EF-06 (un compte par employé) | §8.1, T10-48 |
| EF-07 (consultant n'écrit jamais) | §4, §6.2, T10-16 → T10-19 |
| EF-11 (employé jamais supprimé) | §6.3, T10-49 |
| EF-12 (département facultatif) | §2.1, §5.2 |
| EF-26 (pilote / exécutant) | §5.1, §5.2, §5.5 |
| EF-29 → EF-31 (création) | §5.5, T10-22 → T10-27 |
| EF-33 (traçabilité créateur / attributaire) | §5.1, §5.7 |
| EF-41 → EF-46 (vues) | §6.10 |
| EF-47 / D53 (historique réduit) | §6.2, T10-13 / T10-14 |
| EF-52 (statut manuel) | §6.2, T10-29 |
| EF-59 (modification dans le périmètre) | §5.4, §7.2 |
| EF-62 (duplication dans le périmètre) | §5.6 |
| EF-66 → EF-68 (suppression) | §5.7, T10-31 → T10-35 |
| EF-76 / EF-77 (audit) | §10 |
| D7 (rôles et permissions) | Sections 2, 4, 5 |
| D12 (comptes) | §8 |
| D13 / D25 / D33 (création) | §5.5 |
| D16 / A13 (propres tâches) | §5.1 |
| D17 (service) | §5.3 |
| D21 (consultant) | §4, §5.4 |
| D35 (un responsable par département) | §8.1, §8.2 |
| D39 (consultant sans fiche) | §2.1, §5.1 |
| D42 (audit append-only) | §10.3 |
| D47 (pilote non-admin) | §5.5 |
| D48 (département avec responsable) | §8.4 |
| D49 (employé inactif) | §5.5, §8.3 |
| D50 (désactivation en cascade) | §8.3 |
| **D81 (assignation à un partenaire)** | §5.1, §5.2, §5.3, §5.5, T10-30b → T10-30h |
| D63 (IHM-09 partagé) | §4, §11.1 |
| API §4.1 → §4.5 | Sections 3, 6, 7 |
| API §8 (54 endpoints) | Section 6 |

---

## 15. Ce que l'ÉTAPE 10 ne fait pas

- Elle **ne crée aucun fichier de code**, aucun middleware, aucun module d'autorisation.
- Elle **n'installe aucune dépendance**.
- Elle **ne crée aucun dossier** `client\`, `server\` ou `prisma\`.
- Elle **ne définit pas** les mots de passe, la session, le verrouillage, la révocation technique ni le CSRF → **ÉTAPE 13**.
- Elle **ne définit pas** les tests automatisés → **ÉTAPE 12** (elle en fixe seulement les cas).
- Elle **ne définit pas** la reprise des données → **ÉTAPE 11**.
- Elle **ne modifie aucun endpoint** ni aucun écran.
- Elle **ne tranche aucune zone grise** à sa propre date ; les zones **G1 → G4** ont été tranchées à l'**ÉTAPE 12** (section 13, **D72 → D75**).

---

## 16. Validation demandée

**Validation demandée** : confirmez que :

1. les **4 rôles** et la **matrice fonctionnelle** (§4) sont conformes à ce qui a été validé aux étapes 5, 8 et 9 ;
2. les **périmètres** de lecture, d'écriture, de création, de duplication et de suppression (§5) sont exacts ;
3. la **correspondance des 54 endpoints** (§6) n'ouvre rien de trop et ne ferme rien d'utile ;
4. les **fonctions d'autorisation** et leur ordre d'évaluation (§3.1, §7) sont la bonne traduction du contrat ;
5. le **cycle de vie** des comptes et des rôles (§8) respecte D7, D12, D35, D39, D48, D49, D50 ;
6. la **matrice de tests** (§12) couvre les cas critiques d'autorisation ;
7. les **quatre zones grises** (§13) sont utiles à signaler, et leur report avant l'ÉTAPE 13 est acceptable.

> **Aucun code ne sera écrit avant la validation de cette étape** (règle M1).
> Après validation, l'**ÉTAPE 11 — Reprise des données Excel** pourra être engagée.

### 16.1 Validation obtenue

| | |
|---|---|
| **Date de validation** | **02/11/2026** |
| **Décision** | ✅ **ÉTAPE 10 VALIDÉE EN L'ÉTAT** |
| **Portée** | Les 7 points de la validation demandée ci-dessus sont acceptés : rôles et matrice fonctionnelle, périmètres, correspondance des 54 endpoints, fonctions et ordre d'évaluation, cycle de vie des comptes, matrice de tests, signalement des zones grises. |
| **Zones grises G1 → G4** | **Signalées, non tranchées le 02/11/2026** ; report avant l'**ÉTAPE 13 (sécurité)** accepté. |
| **Complément du 02/11/2026** | **G1 → G4 tranchées à l'ÉTAPE 12** par les **DÉCISIONS 72 à 75** ; elles sont closes et ne sont plus reportées. **ÉTAPE 12 validée le 02/11/2026** ; **D74** précisée (employé assigné, statut `A faire` uniquement). |
| **Points A10** | **Aucun** — aucune décision nouvelle, aucun droit nouveau. |
| **Suite** | **ÉTAPE 11 — Reprise des données Excel**, à engager après validation explicite de son lancement. |

---

## 17. Journal des révisions

| Date | Section(s) | Modification | Statut |
|---|---|---|---|
| 05/11/2026 | En-tête, §5.1, §5.2, §5.3, §5.5, §12.2, §14 | **D81 — assignation à un partenaire** : l'assigné suit l'acteur (`assigne_a_employe_id` / `assigne_a_partenaire_id`) ; pilote employé **ou** partenaire pour une tâche `PARTENAIRE` ; tâche `PARTENAIRE` réservée à l'`ADMIN` ; service porteur recalculé ; cas de test T10-30b → T10-30h. Aucun droit nouveau hors D81. | ✅ **Appliqué le 05/11/2026** |
| 02/11/2026 | §12, §13, §16.1 | **Complément ÉTAPE 12** : les **zones grises G1 → G4** deviennent les **DÉCISIONS 72 à 75** (dernier admin protégé, effet immédiat du rôle, annulation des tâches non commencées, interdiction d'auto-modification). Les **54 cas** deviennent **TC-AUT-001 → 054**, complétés par **8 cas** (TC-AUT-055 → 062). | ✅ **Complété le 02/11/2026** |
| 02/11/2026 | Document entier | **ÉTAPE 10 VALIDÉE le 02/11/2026 en l'état** : les 7 points de la validation demandée sont acceptés ; **G1 → G4 reportées avant l'ÉTAPE 13** ; aucun point A10, aucun droit nouveau, aucun code écrit. | ✅ **Validée le 02/11/2026** |
| 02/11/2026 | Document entier | Création du livrable 09 (ÉTAPE 10) : modèle de rôles, principes et ordre d'évaluation, matrice fonctionnelle, périmètres de lecture / écriture / création / duplication / suppression, correspondance des **54 endpoints**, fonctions d'autorisation, cycle de vie des comptes et rôles, droits `Me`, audit, **54 cas de test**, **4 zones grises signalées et non tranchées**. Aucun code écrit. | ⏳ **En attente de validation** |
