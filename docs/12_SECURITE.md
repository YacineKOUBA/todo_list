# Livrable 12 — ÉTAPE 13 : Sécurité

| Rubrique | Valeur |
|---|---|
| **Projet** | Application web de suivi des TODO LIST — GD Trading |
| **Livrable** | **12** — ÉTAPE 13 |
| **Étape** | **13 — Sécurité** |
| **Décisions de référence** | **DÉCISIONS 1 à 80** · **AR-01 à AR-13** · **T8-01 à T8-15** · **T12-01 à T12-10** · **T13-01 à T13-13** |
| **Périmètre de l'étape** | Spécification de sécurité **et implémentation complète de l'application** : schéma Prisma, migrations, seed, moteurs, API, interface, durcissement |
| **Documents de référence** | `docs\04_ARCHITECTURE_APPLICATION.md` §10 · `docs\05_CAHIER_DES_CHARGES_FONCTIONNEL.md` (EF-01 → EF-10, ENF-03) · `docs\06_MODELE_DE_DONNEES.md` §5.3 · `docs\07_API.md` §2-3 · `docs\08_INTERFACE_REACT.md` IHM-01 / IHM-14 · `docs\09_ROLES_ET_PERMISSIONS.md` · `docs\10_REPRISE_DES_DONNEES.md` · `docs\11_STRATEGIE_ET_PLAN_DE_TESTS.md` |
| **Date de rédaction** | 02/11/2026 |
| **Statut** | ✅ **VALIDÉE le 02/11/2026** — spécification arrêtée, **phase A engagée** ; **A13-14 tranché** (D80) |

> **Règle M1** : l'analyse fonctionnelle est close (ÉTAPES 1 à 12 validées). Le développement de l'application **commence à cette étape**, après validation de la présente spécification.
>
> **Règle M2** : ce document **formalise** les décisions déjà validées (D12, D29, D42, D48, D50, D63, D70, D72 → D75) et fixe les **règles de sécurité** qui manquaient (**D76 → D79**). Les choix de mise en œuvre sans effet métier sont marqués 🔧 et numérotés **T13-xx**.
>
> **Règle M5** : les points qui exigent un arbitrage sont isolés en **section 14**. Un point non tranché n'est **pas appliqué**.
>
> **Aucun code, aucune dépendance, aucune migration, aucune base n'a été créé pour cette étape à la date de rédaction.**

---

## 1. Objet et périmètre

### 1.1 Objet

Ce document répond à cinq questions :

1. **Quelles menaces** pèsent sur l'application, compte tenu de son contexte (réseau local, aucune exposition Internet) ;
2. **Comment l'utilisateur s'authentifie** : politique de mot de passe, hachage, première connexion, réinitialisation ;
3. **Comment la session est protégée** : cookie, stockage serveur, durées, rotation, révocation, CSRF ;
4. **Comment les attaques courantes sont bloquées** : force brute, injection, XSS, détournement de session, fuite de secrets ;
5. **Comment l'application est développée, testée et maintenue** pour que ces protections tiennent dans le temps.

Il fixe également le **plan d'implémentation** de l'application complète, puisque la méthode ne comporte pas d'étape de développement distincte (votre choix du 02/11/2026).

### 1.2 Périmètre

**Comprend** :

- le **modèle de menaces** et les **risques acceptés** en V1 ;
- la **politique de mot de passe** et le **hachage Argon2id** ;
- l'**authentification**, la **première connexion**, la **réinitialisation administrative** ;
- les **sessions serveur**, le **cookie**, les **durées**, la **rotation**, la **révocation**, la **purge** ;
- la **protection CSRF** et le **contrôle d'origine** ;
- le **verrouillage des comptes** et la **limitation de débit** ;
- la **validation des entrées**, les **injections**, le **XSS**, le **mass assignment**, l'**IDOR** ;
- la **gestion des secrets** et la **validation de la configuration** ;
- le **transport HTTPS**, les **en-têtes de sécurité**, la **CSP** ;
- la **journalisation technique**, le **journal d'audit** et les **événements de sécurité** ;
- les **exigences de sauvegarde, de restauration et de chiffrement** ;
- la **procédure de réponse à incident** ;
- les **tests de sécurité** (`TC-SEC-NNN`) et les **critères de sortie** ;
- le **plan d'implémentation** en **quatre phases** et les **portes de validation**.

**Ne comprend pas** :

- l'installation du serveur, le certificat, les sauvegardes exécutées, la supervision → **ÉTAPE 14** ;
- le manuel utilisateur et le manuel d'administration → **ÉTAPE 15** ;
- l'authentification multifacteur (MFA) → **hors V1** (D79) ;
- l'audit de sécurité externe, le test d'intrusion, le WAF, le SIEM → hors périmètre V1 ;
- l'exposition Internet → **interdite** (ENF-12, D10).

### 1.3 Ce que cette étape ne change pas

- Les **4 rôles**, les **périmètres** et les **54 endpoints** validés ne changent pas.
- Les **règles métier** RM-01 → RM-15 ne changent pas.
- Les **55 lignes du seed** ne changent pas.
- Les **décisions D1 → D75** restent applicables ; **D76 → D79** les complètent.
- L'**interface** garde ses 14 écrans et ses 18 parcours ; seuls les états liés à la sécurité sont précisés (verrouillage, expiration, mot de passe temporaire).

### 1.4 Statut de chaque énoncé

| Marque | Signification |
|---|---|
| ✅ **DÉCIDÉ** | Découle d'une décision validée (**D1 → D79**), d'une exigence (EF-xx), d'une règle (RM-xx), d'un critère (CA-xx) ou d'une décision technique (**T13-xx**). **Applicable tel quel.** |
| 🔧 **PROPOSÉ** | Choix de mise en œuvre technique, sans effet métier. Appliqué sauf objection ; validé avec le plan du 02/11/2026. |
| ⚠️ **ZONE GRISE** | Aucune règle validée ne tranche. **Signalé, non appliqué.** |
| ❓ **À VALIDER** | Dépend d'un arbitrage non rendu. **Non appliqué** tant que la décision n'est pas prise. |

> Au 02/11/2026, **aucun point de sécurité ne reste ouvert** : `A13-14` est tranché par **D80**.

### 1.5 Vocabulaire

| Terme | Définition |
|---|---|
| **Authentification** | Vérifier l'identité déclarée (identifiant + mot de passe). |
| **Autorisation** | Vérifier qu'une identité authentifiée a le droit d'accomplir une action (ÉTAPE 10). |
| **Session** | État serveur associé à un cookie, qui représente un utilisateur connecté. |
| **Jeton de session** | Valeur aléatoire opaque transportée par le cookie ; sa copie en base est **hachée**. |
| **CSRF** | *Cross-Site Request Forgery* : faire exécuter une écriture à un utilisateur connecté, depuis un autre site. |
| **Jeton CSRF** | Valeur dérivée de la session, exigée dans un en-tête sur toute écriture. |
| **Verrouillage** | Blocage temporaire d'un compte après plusieurs échecs de connexion. |
| **Limitation de débit** | Plafonnement du nombre de requêtes par adresse IP sur une fenêtre de temps. |
| **Hachage** | Transformation irréversible d'un mot de passe (Argon2id), avec sel aléatoire. |
| **HMAC** | Empreinte cryptographique avec clé secrète, utilisée pour vérifier un jeton sans le stocker. |
| **CSP** | *Content Security Policy* : liste des sources autorisées pour les scripts, styles, images. |
| **HSTS** | *HTTP Strict Transport Security* : impose HTTPS au navigateur. |
| **MFA** | Authentification multifacteur (non retenue en V1 — D79). |
| **ASVS** | *Application Security Verification Standard* (OWASP) : référentiel de contrôle. |
| **Incident** | Événement compromettant ou susceptible de compromettre la confidentialité, l'intégrité ou la disponibilité. |

### 1.6 Références

| Document | Usage |
|---|---|
| `docs\00_METHODE_DE_TRAVAIL.txt` | Méthode en 15 étapes, règles M1 → M5 |
| `docs\05_CAHIER_DES_CHARGES_FONCTIONNEL.md` | EF-01 → EF-10, ENF-03, ENF-12, ENF-13, RM-12, CA-01 → CA-06 |
| `docs\06_MODELE_DE_DONNEES.md` | `utilisateur`, `journal_audit`, contraintes |
| `docs\07_API.md` | 54 endpoints, enveloppes, catalogue d'erreurs |
| `docs\08_INTERFACE_REACT.md` | IHM-01 (connexion), IHM-14 (profil), états d'erreur |
| `docs\09_ROLES_ET_PERMISSIONS.md` | 4 rôles, périmètres, 62 cas d'autorisation |
| `docs\11_STRATEGIE_ET_PLAN_DE_TESTS.md` | Pyramide, socle, 62 cas, critères de sortie |

---

## 2. Contexte et modèle de menaces

### 2.1 Contexte d'exploitation

| Élément | Valeur | Conséquence de sécurité |
|---|---|---|
| **Réseau** | Réseau local de GD Trading, **aucune exposition Internet** | Surface d'attaque limitée ; le risque interne (employé curieux, poste compromis) domine |
| **Serveur** | Un serveur local unique, PostgreSQL sur la même machine ou le même réseau | Point unique de défaillance ; la compromission du serveur compromet la base |
| **Utilisateurs** | Quelques dizaines de comptes, un par employé (D12) | Volume faible : le verrouillage et la limitation peuvent être simples |
| **Navigateurs** | Chrome, Edge, Firefox récents, desktop 1440 × 900 (D60) | Pas de contrainte de compatibilité ancienne |
| **Données** | Tâches, priorités, partenaires, commentaires, journal d'audit | Données internes sensibles mais non réglementées (pas de santé, pas de paiement) |
| **Comptes** | Créés manuellement par l'admin (D71), aucun import nominatif | Pas de mot de passe par défaut commun à plusieurs comptes |
| **Administrateur** | Compte nominatif unique au départ (D70) | Risque de perte d'accès ; procédure de secours hors ligne nécessaire |

### 2.2 Actifs à protéger

| # | Actif | Pourquoi | Protection principale |
|---|---|---|---|
| 1 | **Mots de passe** | Accès direct à l'application | Argon2id, jamais journalisés, jamais renvoyés |
| 2 | **Sessions** | Usurpation d'identité sans mot de passe | Jeton opaque, cookie `HttpOnly`, stockage haché, expiration |
| 3 | **Comptes et rôles** | Élévation de privilèges | Autorisation serveur, D72 → D75, audit |
| 4 | **Données métier** | Confidentialité interne | Autorisation par périmètre, HTTPS, base protégée |
| 5 | **Journal d'audit** | Preuve et investigation | Append-only, accès admin, aucun secret |
| 6 | **Sauvegardes** | Reprise après incident | Chiffrement, accès restreint, restauration testée |
| 7 | **Secrets de configuration** | Forge de sessions, accès base | `.env` non versionné, permissions, rotation |
| 8 | **Disponibilité** | Travail quotidien | Limitation raisonnable, verrouillage temporaire, supervision |

### 2.3 Acteurs et capacités

| Acteur | Accès | Capacités supposées |
|---|---|---|
| **Utilisateur légitime** | Compte actif, rôle | Peut se tromper de mot de passe, partager son poste, laisser une session ouverte |
| **Employé curieux** | Compte `EMPLOYEE` ou `CONSULTANT` | Peut tenter d'accéder aux tâches d'un collègue, de modifier une URL, d'appeler l'API directement |
| **Responsable** | Compte `RESPONSABLE` | Peut tenter de sortir de son département |
| **Administrateur** | Compte `ADMIN` | Accès étendu ; peut être la cible d'un vol de session ; peut se tromper de cible |
| **Ancien employé** | Compte désactivé | Peut conserver un mot de passe, un cookie ou des notes |
| **Attaquant sur le réseau local** | Poste compromis ou branché au réseau | Peut écouter le trafic non chiffré, usurper une IP, lancer des tentatives automatisées |
| **Personne avec accès physique au serveur** | Console, disque | Peut lire les fichiers, la base, les sauvegardes ; hors périmètre logiciel (chiffrement disque, ÉTAPE 14) |

### 2.4 Surface d'attaque

| Surface | Exposition | Contrôles |
|---|---|---|
| **`POST /auth/login`** | Publique | Verrouillage, limitation IP, Argon2id, message générique, délai constant |
| **API `/api/v1`** | Authentifiée | Session, autorisation serveur, validation, CSRF sur écriture |
| **SPA** | Publique (fichiers statiques) | CSP, aucun secret embarqué, aucun rôle codé en dur |
| **Base PostgreSQL** | Réseau interne / localhost | Rôle applicatif à privilèges limités, mot de passe, sauvegardes chiffrées |
| **Fichiers de configuration** | Serveur | Permissions, `.env` non versionné, secrets générés |
| **Sauvegardes** | Support externe | Chiffrement, accès restreint, checksum |
| **Poste utilisateur** | Navigateur | Cookie `HttpOnly`, expiration, déconnexion, pas de `localStorage` |

### 2.5 Menaces et parades

Modèle **STRIDE** simplifié, adapté au contexte.

| # | Menace | Scénario concret | Parade | Réf. |
|---|---|---|---|---|
| 1 | **Usurpation** | Un employé devine le mot de passe d'un collègue | Argon2id, politique de longueur, verrouillage, limitation IP | D76, D78 |
| 2 | **Usurpation** | Vol d'un cookie de session | Cookie `HttpOnly` + `Secure` + `SameSite=Strict`, expiration courte, révocation | D77, T13-04 |
| 3 | **Usurpation** | Fixation de session | Jeton généré côté serveur, rotation à la connexion | T13-04 |
| 4 | **Altération** | Un employé modifie une tâche hors périmètre via l'API | Autorisation serveur, refus par défaut, 404 non divulgant | ÉTAPE 10 |
| 5 | **Altération** | Requête forgée depuis un autre site (CSRF) | Jeton CSRF lié à la session, `SameSite=Strict`, contrôle d'origine | T13-05 |
| 6 | **Répudiation** | Un utilisateur conteste une suppression | Journal d'audit append-only, qui / quoi / quand / avant / après | D42, D17 |
| 7 | **Divulgation** | Un `EMPLOYEE` lit les tâches d'un autre service | Périmètres RM-10, filtres serveur, aucun rôle codé en dur | D16, D63 |
| 8 | **Divulgation** | Un message d'erreur révèle l'existence d'un compte | Message unique `IDENTIFIANTS_INVALIDES`, délai constant | EF-10 |
| 9 | **Divulgation** | Un mot de passe ou un jeton apparaît dans un journal | Interdiction stricte, filtre de log, tests de non-fuite | T13-09 |
| 10 | **Divulgation** | La base est copiée | Mots de passe Argon2id, jetons de session hachés, sauvegardes chiffrées | T13-01, T13-04 |
| 11 | **Déni de service** | Tentatives massives de connexion | Verrouillage par compte, limitation par IP | D78 |
| 12 | **Déni de service** | Verrouillage malveillant d'un compte | Durée limitée à 15 min, déverrouillage par l'admin, limitation IP | D78 |
| 13 | **Élévation de privilèges** | Un admin se retire son propre rôle par erreur | D72 (dernier admin) et D75 (auto-modification interdite) | D72, D75 |
| 14 | **Élévation de privilèges** | Un changement de rôle reste sans effet jusqu'à la reconnexion | Recalcul des droits à chaque requête (D73) | D73 |
| 15 | **Injection** | Requête SQL forgée via un champ | Prisma paramétré, aucune concaténation SQL, validation Zod | T13-08 |
| 16 | **XSS** | Commentaire contenant du script | Échappement React, aucun `dangerouslySetInnerHTML`, CSP | T13-08 |
| 17 | **Clickjacking** | Intégration de l'application dans une iframe | `frame-ancestors 'none'`, `X-Frame-Options: DENY` | T13-08 |
| 18 | **Fuite de secrets** | `.env` versionné ou lisible par tous | `.gitignore`, permissions, aucun secret dans le client | T13-10 |
| 19 | **Compromission du serveur** | Accès au système d'exploitation | Chiffrement disque, compte de service, mises à jour (ÉTAPE 14) | ENF-12 |
| 20 | **Erreur humaine** | Suppression accidentelle d'une tâche | Suppression logique, audit, sauvegardes | D42, ENF-14 |

### 2.6 Risques acceptés en V1

| # | Risque | Justification | Contre-mesure résiduelle |
|---|---|---|---|
| **R1** | **Pas de MFA** | Réseau local sans exposition Internet ; population interne ; simplicité d'usage (D79) | Mot de passe long, verrouillage, limitation, sessions courtes, audit |
| **R2** | **Pas de WAF ni de SIEM** | Coût et complexité disproportionnés | Journaux, audit, revue manuelle, supervision ÉTAPE 14 |
| **R3** | **Serveur unique** | Contrainte matérielle | Sauvegardes quotidiennes, restauration testée |
| **R4** | **Accès physique au serveur** | Locaux de l'entreprise | Chiffrement disque, local fermé, comptes système restreints (ÉTAPE 14) |
| **R5** | **Pas de test d'intrusion externe** | Hors budget V1 | Liste de contrôle ASVS, tests automatisés, revue de code |
| **R6** | **Verrouillage malveillant possible** | Conséquence inhérente au verrouillage | Durée de 15 min, limitation IP, déverrouillage admin |
| **R7** | **Limitation en mémoire** | Un seul serveur, pas de répartition | Redémarrage remet les compteurs à zéro ; acceptable à cette échelle |
| **R8** | **Pas de notification par courriel** | Aucun SMTP validé | Remise du mot de passe temporaire en main propre par l'admin |

> Ces risques sont **acceptés** au titre de la V1. Ils sont réexaminés à l'ÉTAPE 14 (exploitation) et pourront être réduits ultérieurement.

---

## 3. Authentification

### 3.1 Principes

| Sujet | Règle | Réf. |
|---|---|---|
| **Ouverture** | Identifiant + mot de passe → session serveur opaque | EF-01 |
| **Compte inactif** | Connexion refusée, message générique | EF-02, EF-10 |
| **Message d'échec** | Toujours `IDENTIFIANTS_INVALIDES`, quel que soit le motif | EF-10 |
| **Délai** | Le temps de réponse ne doit pas distinguer un compte existant d'un compte inconnu | EF-10 |
| **Stockage** | Argon2id uniquement ; aucun mot de passe en clair, aucun chiffrement réversible | EF-08 |
| **Première connexion** | Changement obligatoire avant tout autre accès | EF-09, D70 |
| **Journalisation** | Chaque connexion, échec et verrouillage est audité, sans secret | D42 |

### 3.2 Identifiant

| Règle | Valeur | Réf. |
|---|---|---|
| Longueur | 3 à 64 caractères | `docs\06` §5.3 |
| Espaces | Interdits | `docs\06` §5.3 |
| Unicité | Insensible à la casse (`lower(identifiant)`) | `docs\06` §5.3 |
| Format | Chaîne libre (pas nécessairement un courriel) | D71 |
| Affichage | Jamais dans une URL, jamais dans un journal technique | T13-09 |
| Changement | Possible par l'admin uniquement ; journalisé | `docs\07` §8.11 |

> L'identifiant n'est **pas** une donnée secrète : il peut être connu. Seul le mot de passe protège l'accès.

### 3.3 Politique de mot de passe — **D76**

**Décision du 02/11/2026 (A13-01, option A)** : longueur minimale de **12 caractères**, **sans composition imposée**.

| Règle | Valeur | Motif |
|---|---|---|
| **Longueur minimale** | **12 caractères** | Résistance à la force brute ; recommandation ANSSI / NIST |
| **Longueur maximale** | **128 caractères** | Borne le coût de hachage et les entrées abusives |
| **Composition** | **Aucune** exigence de majuscule, minuscule, chiffre ou symbole | La longueur prime ; évite les mots de passe prévisibles du type `Password1!` |
| **Caractères** | Tout caractère Unicode imprimable ; espaces autorisés à l'intérieur | Les espaces augmentent l'entropie |
| **Identifiant** | Le mot de passe ne doit pas être **égal** à l'identifiant (insensible à la casse) | Empêche le cas le plus trivial |
| **Ancien mot de passe** | Le nouveau doit être **différent** de l'ancien | `MOT_DE_PASSE_IDENTIQUE` |
| **Expiration périodique** | **Aucune** | Une rotation forcée pousse à des mots de passe faibles |
| **Changement forcé** | À la **première connexion** et après **réinitialisation administrative** | EF-09, D70 |
| **Historique** | Aucun historique de mots de passe en V1 | Le changement forcé et la longueur suffisent à cette échelle |
| **Liste de mots de passe courants** | **Aucune liste externe en V1** | Dépendance et maintenance disproportionnées ; risque accepté (R1) |
| **Affichage** | Jamais affiché, jamais renvoyé, jamais journalisé | EF-08 |
| **Saisie** | Deux champs masqués + confirmation côté interface ; l'API ne reçoit que l'ancien et le nouveau | `docs\08` IHM-14 |

**Contrôles serveur** (dans cet ordre) :

1. présence des champs ;
2. longueur entre 12 et 128 ;
3. mot de passe différent de l'identifiant (comparaison insensible à la casse) ;
4. mot de passe différent de l'ancien (comparaison via Argon2id, pas en clair) ;
5. hachage Argon2id ;
6. écriture transactionnelle + audit.

> **Aucune règle de composition** n'est ajoutée. Un mot de passe de 12 caractères sans majuscule est accepté s'il n'est pas l'identifiant.

### 3.4 Hachage Argon2id — **T13-01**

| Paramètre | Valeur | Justification |
|---|---|---|
| **Algorithme** | **Argon2id** | Résistant aux attaques GPU et side-channel ; recommandé par l'OWASP |
| **Bibliothèque** | **`@node-rs/argon2`** | Binaires précompilés, compatible Node 24, aucune compilation native à installer |
| **Mémoire** | **65 536 Kio (64 Mio)** | Coût mémoire élevé, adapté à un serveur local |
| **Itérations** | **3** | Compromis sécurité / latence |
| **Parallélisme** | **1** | Un seul cœur sollicité ; suffisant pour quelques dizaines d'utilisateurs |
| **Longueur du hash** | **32 octets** | Standard |
| **Sel** | **16 octets aléatoires par mot de passe**, généré par la bibliothèque | Deux mots de passe identiques donnent des hash différents |
| **Encodage** | Chaîne PHC (`$argon2id$v=19$m=65536,t=3,p=1$…`) | Contient sel et paramètres ; migration future possible |
| **Vérification** | `verify(hash, motDePasse)` | Comparaison à temps constant intégrée |
| **Re-hachage** | Si les paramètres du hash stocké sont **inférieurs** aux paramètres courants, le mot de passe est re-haché **à la connexion réussie** | Monte en charge sans imposer de rotation |
| **Poivre (pepper)** | **Aucun** en V1 | Complexité de rotation ; la clé `SESSION_SECRET` ne sert pas au hachage |

**Point d'implémentation** : un **hash factice** est calculé au démarrage avec les mêmes paramètres. Pour un identifiant inconnu, le serveur vérifie le mot de passe fourni **contre ce hash factice** avant de répondre. Le temps de réponse devient comparable à celui d'un compte existant (EF-10).

> **Interdits** : MD5, SHA-1, SHA-256 seul, chiffrement réversible, mot de passe en clair, hash global partagé entre comptes.

### 3.5 Première connexion — EF-09

| Étape | Comportement |
|---|---|
| 1 | L'admin crée le compte : `doit_changer_mot_de_passe = true`, mot de passe temporaire généré (T13-02) |
| 2 | L'utilisateur se connecte avec l'identifiant et le mot de passe temporaire |
| 3 | La session est ouverte, mais **seules** les routes `/auth/password`, `/auth/csrf`, `/me` et `/auth/logout` sont accessibles |
| 4 | Toute autre route répond `403 CHANGEMENT_MOT_DE_PASSE_REQUIS` |
| 5 | Après changement réussi : `doit_changer_mot_de_passe = false`, session **renouvelée**, autres sessions révoquées |
| 6 | L'utilisateur accède à son écran d'accueil selon son rôle (D59) |

> **Correction de cohérence** : `docs\07` §3.1 autorise `/auth/password`, `/me` et `/auth/logout`. **`/auth/csrf` est ajouté** à cette liste, sans quoi le client ne peut pas obtenir le jeton nécessaire au `POST /auth/password`. Aucun endpoint nouveau : il existait déjà.

### 3.6 Création de compte et mot de passe temporaire — **T13-02**

| Sujet | Règle |
|---|---|
| **Génération** | Le serveur génère un mot de passe de **16 caractères** avec `crypto.randomInt`, alphabet sans caractères ambigus (`A-HJ-NP-Z`, `a-km-z`, `2-9`) |
| **Retour** | Le mot de passe temporaire est renvoyé **une seule fois** dans la réponse `201` de `POST /accounts`, champ `motDePasseTemporaire` |
| **Stockage** | Jamais stocké en clair ; seul le hash Argon2id est conservé |
| **Affichage** | L'interface l'affiche dans une fenêtre modale avec un bouton « Copier », puis l'efface définitivement à la fermeture |
| **Perte** | Si l'admin ferme la fenêtre sans noter le mot de passe, il utilise la **réinitialisation** (`POST /accounts/:id/reset-password`) |
| **Journalisation** | Aucune trace du mot de passe temporaire dans les journaux ni dans l'audit |
| **Première connexion** | `doit_changer_mot_de_passe = true` (EF-09) |
| **Compte admin initial** | Créé par la procédure de déploiement (ÉTAPE 14) avec le même mécanisme ; nom, prénom et identifiant **à fournir par le directeur** avant l'ÉTAPE 14 (D70) |

> **Aucune donnée nominative n'est inventée.** Les tests utilisent des comptes fictifs dans la base de test uniquement.

### 3.7 Réinitialisation par l'administrateur — **T13-03**

`POST /accounts/:id/reset-password`

| Sujet | Règle |
|---|---|
| **Accès** | `ADMIN` uniquement |
| **Cible** | Un **autre** compte ; la réinitialisation de **son propre** compte est refusée (`403 AUTO_MODIFICATION_INTERDITE`, cohérent avec D75) |
| **Effet** | Nouveau mot de passe temporaire généré, `doit_changer_mot_de_passe = true`, `tentatives_echouees = 0`, `verrouille_jusqua = NULL` |
| **Sessions** | **Toutes** les sessions du compte cible sont révoquées (D50 par analogie) |
| **Retour** | `200` avec `motDePasseTemporaire`, **une seule fois** |
| **Audit** | `COMPTE` / `MOT_DE_PASSE` avec l'auteur, la cible, l'IP ; aucun secret |
| **Cas d'erreur** | compte introuvable `404` ; auto-réinitialisation `403 AUTO_MODIFICATION_INTERDITE` |

**Procédure de secours hors ligne** (si l'unique administrateur a perdu son mot de passe) :

1. accès physique ou SSH au serveur par le responsable informatique ;
2. exécution d'un script d'exploitation `npm run admin:reset` (ÉTAPE 14) avec l'identifiant admin ;
3. génération d'un mot de passe temporaire affiché **une seule fois** dans la console du serveur ;
4. `doit_changer_mot_de_passe = true`, toutes les sessions révoquées, audit avec acteur `NULL` (système) ;
5. changement obligatoire à la connexion suivante.

> Ce script **n'est pas un endpoint** : il n'augmente pas la surface d'attaque réseau. Il est documenté et son usage est journalisé.

### 3.8 Changement de mot de passe

`POST /auth/password`

| Sujet | Règle |
|---|---|
| **Accès** | Authentifié, y compris quand `doit_changer_mot_de_passe = true` |
| **Corps** | `ancienMotDePasse`, `nouveauMotDePasse` |
| **Vérification** | L'ancien mot de passe est vérifié avec Argon2id |
| **Ancien incorrect** | `422 MOT_DE_PASSE_INVALIDE` avec `erreurs: [{ champ: "ancienMotDePasse", code: "VALEUR_INCORRECTE" }]` — aucun nouveau code global |
| **Politique** | D76 ; sinon `422 MOT_DE_PASSE_INVALIDE` |
| **Identique** | `422 MOT_DE_PASSE_IDENTIQUE` |
| **Effet** | Nouveau hash, `doit_changer_mot_de_passe = false`, **rotation** de la session courante, **révocation des autres sessions** |
| **Audit** | `COMPTE` / `MOT_DE_PASSE`, sans ancien ni nouveau mot de passe |
| **Réponse** | `204` |

> Le changement de mot de passe est **la seule** opération qui permet de sortir de l'état « changement obligatoire ».

### 3.9 Échec de connexion : message et délai — EF-10

| Situation | Réponse | Détail |
|---|---|---|
| Identifiant inconnu | `401 IDENTIFIANTS_INVALIDES` | Hash factice vérifié pour égaliser le temps |
| Mot de passe faux | `401 IDENTIFIANTS_INVALIDES` | Compteur incrémenté |
| Compte inactif | `401 IDENTIFIANTS_INVALIDES` | Aucun compteur incrémenté |
| Compte verrouillé | `401 IDENTIFIANTS_INVALIDES` | Aucun compteur incrémenté ; verrouillage audité |
| Compte actif, mot de passe correct | `200` + cookie | Compteur remis à zéro |
| Limitation IP dépassée | `429 TROP_DE_TENTATIVES` | En-tête `Retry-After` |

> **Le corps de la réponse `401` est strictement identique** dans les quatre premiers cas : même `code`, même `detail`, même `status`. Aucune durée, taille de réponse ou en-tête ne doit permettre de distinguer les cas.

### 3.10 Cycle de vie du mot de passe

| Étape | Déclencheur | `doit_changer_mot_de_passe` | Sessions | Audit |
|---|---|---|---|---|
| Création | `POST /accounts` | `true` | Aucune | `COMPTE` |
| Première connexion | `POST /auth/login` | reste `true` | 1 session limitée | `CONNEXION` |
| Changement | `POST /auth/password` | `false` | Courante renouvelée, autres révoquées | `MOT_DE_PASSE` |
| Réinitialisation | `POST /accounts/:id/reset-password` | `true` | Toutes révoquées | `MOT_DE_PASSE` |
| Désactivation | `PATCH /employees/:id { actif:false }` | inchangé | Toutes révoquées (D50) | `COMPTE` |
| Réactivation | `PATCH /employees/:id { actif:true }` | **`true` (D80)** | Aucune (toutes révoquées à la désactivation) | `COMPTE` |
| Secours hors ligne | `npm run admin:reset` | `true` | Toutes révoquées | `MOT_DE_PASSE` (acteur `NULL`) |

---

## 4. Sessions

### 4.1 Modèle de session — **T13-04**

La table `session` est **prévue par `docs\06` §3** mais non détaillée. Elle est définie ici et sera ajoutée au modèle lors de la phase A.

| Colonne | Type | Null | Défaut | Contrainte / règle |
|---|---|---|---|---|
| `id` | `uuid` | non | `gen_random_uuid()` | PK ; sert aussi de base au jeton CSRF |
| `utilisateur_id` | `uuid` | non | — | FK → `utilisateur(id)` `ON DELETE CASCADE` |
| `jeton_hash` | `text` | non | — | **HMAC-SHA-256** du jeton, hexadécimal ; **unique** |
| `cree_le` | `timestamptz` | non | `now()` | Début de la durée absolue |
| `derniere_activite_le` | `timestamptz` | non | `now()` | Base de la durée d'inactivité |
| `expire_le` | `timestamptz` | non | — | `cree_le + 10 h` (D77) |
| `revoque_le` | `timestamptz` | oui | `NULL` | Révocation explicite |
| `ip` | `inet` | oui | `NULL` | Adresse de connexion |
| `user_agent` | `text` | oui | `NULL` | Tronqué à 512 caractères |

**Index** : `utilisateur_id`, `expire_le`, `jeton_hash` (unique).

**Règles** :

- le **jeton en clair n'est jamais stocké** ;
- une session révoquée ou expirée n'est **jamais** réactivée ;
- la suppression d'un compte (jamais réalisée en pratique) supprime ses sessions ;
- la table est **purgée** des lignes expirées ou révoquées depuis plus de **7 jours** (T13-11).

### 4.2 Cookie de session

| Attribut | Valeur | Rôle |
|---|---|---|
| **Nom** | `gd_session` | Préfixe applicatif ; pas de préfixe `__Host-` car `Path=/api` |
| **Contenu** | Jeton aléatoire de **32 octets**, encodé en base64url (43 caractères) | Opaque, aucune information d'utilisateur |
| **`HttpOnly`** | **oui** | Inaccessible au JavaScript : protège du XSS |
| **`Secure`** | **oui** en recette et production ; **non** en développement local | Impose HTTPS |
| **`SameSite`** | **`Strict`** | Aucun envoi depuis un autre site |
| **`Path`** | **`/api`** | Le cookie n'est pas envoyé aux fichiers statiques |
| **`Max-Age`** | **36 000 secondes (10 h)** | Borne absolue côté navigateur ; le serveur reste autoritaire |
| **`Domain`** | absent | Cookie lié à l'hôte exact |
| **`Priority`** | `High` | Facultatif, sans effet de sécurité garanti |

> **Aucun jeton dans `localStorage`, `sessionStorage`, un paramètre d'URL ou un en-tête `Authorization`.** Le cookie est le seul transport.

### 4.3 Jeton et stockage

| Sujet | Règle |
|---|---|
| **Génération** | `crypto.randomBytes(32)` → base64url |
| **Stockage** | `jeton_hash = HMAC-SHA-256(SESSION_SECRET, jeton)` en hexadécimal |
| **Recherche** | Par `jeton_hash` (index unique) |
| **Pourquoi HMAC** | Une copie de la base ne permet pas de rejouer une session : il faudrait aussi le secret serveur |
| **Comparaison** | Le jeton fourni est haché puis recherché ; aucune comparaison caractère par caractère en clair |
| **Rotation** | Nouveau jeton à chaque connexion et à chaque changement de mot de passe |
| **Révocation** | `revoque_le = now()` ; la session reste en base pour la traçabilité jusqu'à la purge |

### 4.4 Durées de session — **D77**

**Décision du 02/11/2026 (A13-03, option A)** : **30 minutes d'inactivité** et **10 heures absolues**.

| Durée | Valeur | Comportement |
|---|---|---|
| **Inactivité** | **30 minutes** | Si `now() − derniere_activite_le > 30 min` → session expirée, `401 SESSION_EXPIREE` |
| **Absolue** | **10 heures** | Si `now() > expire_le` → session expirée, quel que soit l'usage |
| **Mise à jour de l'activité** | À chaque requête authentifiée, **au plus une fois par minute** | Limite les écritures en base |
| **Cookie** | `Max-Age = 10 h` | Cohérent avec la borne absolue |
| **Horloge** | `Clock` injectée, fuseau `Africa/Algiers` pour les règles métier ; les sessions sont comparées en **UTC** | Déterminisme des tests |

> **Justification** : 30 minutes couvrent une interruption de travail normale ; 10 heures couvrent une journée de 8h00 à 16h30 avec une marge. Une session laissée ouverte le soir est fermée au plus tard 10 heures après la connexion.

### 4.5 Validation à chaque requête

Ordre **strict** :

1. le cookie `gd_session` est présent ;
2. son HMAC correspond à une ligne `session` ;
3. `revoque_le IS NULL` ;
4. `now() <= expire_le` (durée absolue) ;
5. `now() − derniere_activite_le <= 30 min` (inactivité) ;
6. le compte lié existe et `actif = true` ;
7. les droits sont **recalculés** à partir du rôle courant (D73) ;
8. `doit_changer_mot_de_passe` est vérifié : si `true` et route non autorisée → `403 CHANGEMENT_MOT_DE_PASSE_REQUIS` ;
9. le **jeton CSRF** est vérifié sur toute écriture ;
10. l'**autorisation métier** est appliquée (ÉTAPE 10).

**Réponses** :

| Cas | Code | Erreur |
|---|---|---|
| Cookie absent | `401` | `AUTHENTIFICATION_REQUISE` |
| Cookie invalide, session expirée, révoquée ou compte inactif | `401` | `SESSION_EXPIREE` |
| Changement de mot de passe requis | `403` | `CHANGEMENT_MOT_DE_PASSE_REQUIS` |
| CSRF absent ou invalide | `403` | `JETON_CSRF_INVALIDE` |
| Droit insuffisant | `403` | `ACTION_NON_AUTORISEE` |
| Ressource hors périmètre | `404` | `RESSOURCE_INTROUVABLE` |

### 4.6 Rotation

| Événement | Rotation | Détail |
|---|---|---|
| Connexion | **Oui** | Nouvelle ligne `session`, nouveau jeton, nouveau jeton CSRF |
| Changement de mot de passe | **Oui** | Session courante révoquée et recréée ; autres révoquées |
| Réinitialisation admin | **Oui** | Toutes les sessions révoquées ; l'utilisateur se reconnecte |
| Élévation ou changement de rôle | **Non** | D73 : effet immédiat sans reconnexion |
| Requête ordinaire | **Non** | Le jeton reste stable pendant la session |

> **Fixation de session** : le serveur **ne lit jamais** un jeton de session dans un paramètre, un corps ou un en-tête autre que le cookie. Un jeton fourni par le client avant la connexion est ignoré.

### 4.7 Révocation

| Déclencheur | Portée | Réf. |
|---|---|---|
| `POST /auth/logout` | Session courante | EF-01 |
| Changement de mot de passe | Toutes **sauf** la session courante (renouvelée) | T13-03 |
| Réinitialisation admin | **Toutes** les sessions du compte | T13-03 |
| Désactivation d'un employé | **Toutes** les sessions du compte, dans la même transaction | D50 |
| Suppression d'un compte | Impossible (compte désactivé, jamais supprimé) | D12 |
| Incident de sécurité | Toutes les sessions concernées, sur décision de l'admin | §12 |
| Restauration de base | **Toutes** les sessions, après restauration | §11.3 |

### 4.8 Sessions multiples

| Sujet | Règle |
|---|---|
| **Nombre** | Un utilisateur peut avoir plusieurs sessions (poste fixe + portable) |
| **Limite** | **5 sessions actives** par compte ; au-delà, la plus ancienne est révoquée à la connexion |
| **Liste** | Aucun endpoint ne liste les sessions en V1 (pas de nouvel endpoint) |
| **Révocation sélective** | Non exposée en V1 ; l'admin révoque **toutes** les sessions via la réinitialisation |

### 4.9 Purge

| Sujet | Règle |
|---|---|
| **Déclencheur** | Au démarrage du serveur et à chaque connexion réussie |
| **Critère** | `expire_le < now() − 7 jours` **ou** `revoque_le < now() − 7 jours` |
| **Portée** | Suppression physique des lignes concernées |
| **Audit** | Aucun : la purge est une opération technique, pas un événement métier |
| **Transaction** | Purge isolée, sans effet sur les sessions actives |

### 4.10 Protection CSRF — **T13-05**

**Mécanisme retenu** : jeton **dérivé de la session**, sans stockage supplémentaire.

```text
jetonCSRF = base64url( HMAC-SHA-256( SESSION_SECRET, "csrf:" + session.id ) )
```

| Sujet | Règle |
|---|---|
| **Obtention** | `GET /auth/csrf`, authentifié, retourne `{ "jeton": "…" }` |
| **Transmission** | En-tête `X-CSRF-Token` sur tout `POST`, `PATCH`, `PUT`, `DELETE` |
| **Vérification** | Le serveur recalcule le jeton attendu et compare à temps constant (`timingSafeEqual`) |
| **Rotation** | Automatique avec la session (l'`id` change) |
| **Absence** | `403 JETON_CSRF_INVALIDE` |
| **Jeton d'une autre session** | Refusé (le calcul dépend de l'`id` de la session) |
| **`POST /auth/login`** | Pas de jeton (pas encore de session) ; protégé par le contrôle d'origine et la limitation |
| **`POST /auth/logout`** | Jeton exigé |
| **Pourquoi pas un cookie double-soumission** | Un jeton dérivé ne stocke rien, ne peut pas être volé par lecture de cookie, et reste lié à la session |
| **Pourquoi pas `SameSite` seul** | `SameSite=Strict` est une défense en profondeur ; certains navigateurs ou configurations peuvent l'assouplir |

**Contrôle d'origine** (complément) :

- si l'en-tête `Origin` est présent sur une écriture, il doit correspondre à `APP_ORIGIN` ;
- sinon `403 JETON_CSRF_INVALIDE` (même code, pas de fuite de mécanisme) ;
- si `Origin` est absent (outil en ligne de commande interne), le jeton CSRF reste exigé.

### 4.11 Déconnexion

| Sujet | Règle |
|---|---|
| **Route** | `POST /auth/logout` |
| **Accès** | Authentifié, jeton CSRF valide |
| **Effet** | `revoque_le = now()` sur la session courante ; cookie effacé (`Max-Age=0`) |
| **Réponse** | `204`, même si la session était déjà expirée |
| **Audit** | `CONNEXION` avec `motif = "DECONNEXION"` |
| **Comportement client** | Redirection vers `/connexion`, purge du cache de requêtes (TanStack Query) |

---

## 5. Verrouillage et limitation

### 5.1 Verrouillage par compte — **D78**

**Décision du 02/11/2026 (A13-05 / A13-06, option A)** : **5 échecs consécutifs → verrouillage 15 minutes**, avec limitation par IP.

| Paramètre | Valeur | Réf. |
|---|---|---|
| **Seuil** | **5** échecs consécutifs | D78 |
| **Durée** | **15 minutes** | D78 |
| **Portée** | Par **compte** (`utilisateur.tentatives_echouees`, `verrouille_jusqua`) | `docs\06` §5.3 |
| **Remise à zéro** | Connexion réussie, expiration du verrouillage, réinitialisation admin | T13-03 |
| **Comptage** | Uniquement si le compte existe, est **actif** et n'est **pas verrouillé** | Évite de révéler l'existence |
| **Compte inconnu** | Aucun compteur (aucune ligne) ; hash factice vérifié | EF-10 |
| **Compte inactif** | Aucun compteur | EF-02 |
| **Compte verrouillé** | Aucun compteur ; réponse générique | EF-10 |
| **Message** | Toujours `401 IDENTIFIANTS_INVALIDES` | EF-10 |
| **Audit** | `CONNEXION` avec `motif = "VERROUILLAGE"` au moment du 5ᵉ échec | D42 |

**Séquence** :

1. échec n°1 à n°4 : `tentatives_echouees++`, réponse générique ;
2. échec n°5 : `tentatives_echouees = 5`, `verrouille_jusqua = now() + 15 min`, audit, réponse générique ;
3. pendant le verrouillage : réponse générique, **même si le mot de passe est correct** ;
4. à l'expiration : `tentatives_echouees = 0`, `verrouille_jusqua = NULL` avant d'évaluer la tentative ;
5. connexion réussie : compteur et verrou remis à zéro.

> **Conséquence assumée** : un utilisateur verrouillé ne reçoit pas d'explication dans l'interface (EF-10). L'admin peut voir l'état dans la fiche du compte et déverrouiller par réinitialisation. Une information générique « trop de tentatives, réessayez plus tard » est affichée **uniquement** lorsque la limitation IP renvoie `429`.

### 5.2 Limitation par adresse IP — **T13-06**

| Limite | Seuil | Fenêtre | Portée |
|---|---|---|---|
| **Connexion** | **10 tentatives** | 15 minutes | Par IP |
| **API globale** | **100 requêtes** | 1 minute | Par IP |
| **Écritures** | **30 requêtes** | 1 minute | Par IP |
| **Santé** | incluse dans la limite globale | — | `/api/health` |

**Comportement** :

- réponse `429 TROP_DE_TENTATIVES` avec `Retry-After` (secondes) ;
- aucun compteur par identifiant au niveau IP : la limitation ne révèle pas l'existence d'un compte ;
- stockage **en mémoire** (Map avec expiration), adapté à un serveur unique ;
- réinitialisation au redémarrage : acceptée (R7) ;
- `TRUST_PROXY` configuré à l'ÉTAPE 14 si un reverse proxy est présent ; sinon `false` pour éviter l'usurpation d'IP via `X-Forwarded-For`.

> **Note** : la limitation IP et le verrouillage de compte sont **complémentaires**. Le premier ralentit une attaque distribuée sur un compte ; le second protège un compte ciblé.

### 5.3 Déverrouillage

| Moyen | Effet | Accès |
|---|---|---|
| **Attente** | 15 minutes | Utilisateur |
| **Réinitialisation admin** | Nouveau mot de passe temporaire, compteur à zéro, verrou effacé, sessions révoquées | `ADMIN` |
| **Script de secours** | Même effet, acteur `NULL` | Responsable informatique, sur le serveur |

Aucun endpoint dédié « déverrouiller » n'est ajouté : les **54 endpoints** restent inchangés.

### 5.4 Déni de service et abus

| Risque | Mesure |
|---|---|
| Verrouillage malveillant d'un compte | 15 minutes, limitation IP, déverrouillage admin, audit |
| Saturation par requêtes | Limite globale 100/min, corps 1 Mo, timeouts serveur |
| Attaque par dictionnaire | Argon2id 64 Mio, verrouillage, limitation |
| Épuisement mémoire Argon2 | Parallélisme 1, mémoire bornée par paramètres, pas de file illimitée |
| Redémarrage pour contourner | Le verrouillage est en base ; seule la limitation IP est en mémoire |

---

## 6. Validation, injections et robustesse

### 6.1 Validation des entrées

| Règle | Détail |
|---|---|
| **Bibliothèque** | **Zod** à chaque frontière (corps, paramètres, requête) |
| **Objets stricts** | `.strict()` : tout champ non prévu est rejeté (`400 CHAMP_INCONNU`) |
| **Types** | Aucune coercion implicite ; les dates métier sont des chaînes `AAAA-MM-JJ` validées |
| **Champs calculés** | Refusés en entrée (statut, progression calculée, score, service porteur, horodatages) |
| **Contenu** | Longueurs maximales sur tous les textes libres (libellé, commentaire, motif) |
| **Énumérations** | Valeurs strictement limitées aux listes validées |
| **Erreurs** | `422` avec la liste des champs fautifs, sans détail technique |
| **Côté client** | Mêmes schémas partagés via `shared\`, pour un retour immédiat ; **le serveur reste autoritaire** |

### 6.2 Taille, type et forme des requêtes

| Contrôle | Valeur | Réponse |
|---|---|---|
| **Corps maximal** | **1 Mo** | `413 CHARGE_TROP_VOLUMINEUSE` |
| **`Content-Type`** | `application/json` obligatoire sur les écritures | `415 TYPE_MEDIA_NON_SUPPORTE` |
| **JSON mal formé** | Rejet | `400 REQUETE_INVALIDE` |
| **Profondeur JSON** | 10 niveaux maximum | `400 REQUETE_INVALIDE` |
| **Paramètres d'URL** | UUID validés, pagination bornée (50, max 200) | `400` / `422` |
| **Méthodes non exposées** | `405 METHODE_NON_AUTORISEE` | — |
| **En-têtes inconnus** | Ignorés, jamais interprétés | — |

### 6.3 Injection SQL

| Mesure | Détail |
|---|---|
| **ORM** | Prisma, requêtes paramétrées par construction |
| **Interdits** | Concaténation de chaînes SQL, `$queryRawUnsafe`, SQL dynamique avec entrée utilisateur |
| **SQL brut** | Autorisé uniquement dans les migrations et le seed, avec paramètres liés |
| **Tri et filtres** | Listes blanches de colonnes ; un tri sur un champ calculé est refusé (`TRI_NON_SUPPORTE`) |
| **Recherche** | `contains` Prisma, pas de `LIKE` concaténé |

### 6.4 XSS

| Mesure | Détail |
|---|---|
| **Rendu** | React échappe par défaut tout contenu interpolé |
| **Interdit** | `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function` |
| **Commentaires** | Affichés comme texte, jamais interprétés comme HTML |
| **CSP** | `script-src 'self'` en production, aucun script inline |
| **En-tête** | `X-Content-Type-Options: nosniff` |
| **API** | Réponses `application/json`, jamais `text/html` |
| **URL** | Aucune donnée sensible dans l'URL (pas de jeton, pas de mot de passe) |

### 6.5 Mass assignment

- Aucun `Object.assign(entity, body)` ni spread direct d'un corps de requête dans une entité Prisma.
- Chaque route construit explicitement les champs autorisés à partir du schéma Zod.
- Les champs `id`, `cree_le`, `modifie_le`, `role`, `actif`, `doit_changer_mot_de_passe`, `tentatives_echouees` ne sont **jamais** acceptés depuis un corps générique.
- Le rôle et l'activation passent uniquement par `PATCH /accounts/:id`, protégé par D72 et D75.

### 6.6 IDOR et contrôle d'accès

- Chaque lecture et écriture passe par la **politique centralisée** (ÉTAPE 10).
- Un identifiant valide mais hors périmètre renvoie `404 RESSOURCE_INTROUVABLE`, jamais `403` avec des données.
- Les listes sont **filtrées en base**, pas après chargement.
- Les tests d'autorisation (**62 cas**) sont exécutés à chaque livraison.

### 6.7 Gestion des erreurs

| Règle | Détail |
|---|---|
| **Format** | `application/problem+json` (RFC 9457) |
| **Codes** | Codes stables du catalogue `docs\07` |
| **Détail** | Message en français, sans donnée sensible |
| **Pile d'appels** | Jamais renvoyée au client en production |
| **Erreur 500** | `ERREUR_INTERNE` générique + identifiant de corrélation dans le journal |
| **Base indisponible** | `503 BASE_INDISPONIBLE`, sans détail de connexion |
| **Journal** | L'erreur complète est journalisée côté serveur, avec l'identifiant de corrélation |

### 6.8 Dépendances et chaîne de développement

| Sujet | Règle |
|---|---|
| **Verrouillage** | `package-lock.json` versionné, installations reproductibles |
| **Audit** | `npm audit --omit=dev` doit retourner **0 vulnérabilité** avant livraison |
| **Vulnérabilités de développement** | Documentées ; pas de `npm audit fix --force` sans analyse |
| **Mises à jour** | Revues et testées, jamais automatiques en production |
| **Sources** | Uniquement le registre npm officiel ; aucune dépendance d'un dépôt privé non maîtrisé |
| **Code** | Aucun secret, aucun mot de passe, aucune clé dans le dépôt |
| **Revue** | Toute évolution de la sécurité est relue et couverte par un test |

---

## 7. Autorisation — rappel et articulation

### 7.1 Principes validés

| # | Principe | Réf. |
|---|---|---|
| 1 | **Le serveur décide** ; l'interface ne fait que masquer | EF-03 |
| 2 | **Refus par défaut** : toute route non explicitement ouverte est refusée | ÉTAPE 10 |
| 3 | **Politique centralisée** : aucune décision dupliquée dans un contrôleur | ÉTAPE 10 |
| 4 | **Périmètres recalculés** à chaque lecture | D29 |
| 5 | **Non-divulgation** : `404` hors périmètre, `403` action interdite sur une ressource visible | `docs\07` §4.4 |
| 6 | **Aucun rôle codé en dur** dans l'interface | D63 |
| 7 | **Effet immédiat** d'un changement de rôle | D73 |
| 8 | **Dernier admin protégé** | D72 |
| 9 | **Auto-modification interdite** | D75 |

### 7.2 Articulation avec la sécurité

```text
Requête
  → HTTPS / en-têtes
  → limitation IP
  → cookie + session valide
  → compte actif
  → changement de mot de passe effectué
  → jeton CSRF (si écriture)
  → rôle et périmètre (ÉTAPE 10)
  → validation des entrées
  → transaction métier
  → audit
```

> Une seule couche manquante ne doit jamais suffire à accorder un droit.

### 7.3 Décisions récentes appliquées

| Décision | Application sécurité |
|---|---|
| **D72** | Le contrôle du dernier admin est effectué **dans la transaction** de modification du compte ; `409 DERNIER_ADMIN` |
| **D73** | Le rôle est lu en base à **chaque requête** ; aucun cache de droits en session |
| **D74** | La désactivation annule les tâches `A faire` dans la **même transaction** et révoque les sessions |
| **D75** | L'auto-modification de rôle et l'auto-désactivation sont refusées avant toute écriture |

---

## 8. Secrets et configuration

### 8.1 Variables d'environnement

| Variable | Obligatoire | Exemple | Rôle |
|---|---|---|---|
| `NODE_ENV` | oui | `production` | Mode d'exécution |
| `PORT` | oui | `3000` | Port d'écoute |
| `DATABASE_URL` | oui | `postgresql://…` | Connexion PostgreSQL |
| `SESSION_SECRET` | oui | 48 octets aléatoires | HMAC des jetons de session et CSRF |
| `APP_ORIGIN` | oui | `https://todo.gd-trading.local` | Contrôle d'origine |
| `COOKIE_SECURE` | oui | `true` | Attribut `Secure` du cookie |
| `SESSION_IDLE_MINUTES` | non | `30` | D77 |
| `SESSION_ABSOLUTE_HOURS` | non | `10` | D77 |
| `LOGIN_MAX_ATTEMPTS` | non | `5` | D78 |
| `LOGIN_LOCK_MINUTES` | non | `15` | D78 |
| `RATE_LIMIT_LOGIN` | non | `10` | T13-06 |
| `RATE_LIMIT_GLOBAL` | non | `100` | T13-06 |
| `TRUST_PROXY` | non | `false` | Configuration reverse proxy (ÉTAPE 14) |
| `LOG_LEVEL` | non | `info` | Journalisation |
| `TZ` | oui | `Africa/Algiers` | Fuseau du serveur (D30) |

### 8.2 Validation au démarrage — **T13-10**

- Un schéma **Zod** valide toutes les variables au démarrage.
- Toute variable obligatoire absente ou invalide **empêche le démarrage** (message clair, sans secret).
- En `production` :
  - `SESSION_SECRET` doit faire **au moins 32 octets** et ne pas être une valeur d'exemple ;
  - `COOKIE_SECURE` doit être `true` ;
  - `APP_ORIGIN` doit commencer par `https://` ;
  - `NODE_ENV=production` interdit les valeurs de développement.
- En `development`, des valeurs par défaut sont autorisées **uniquement** pour les variables non secrètes ; `SESSION_SECRET` reste obligatoire.

### 8.3 Génération et rotation

| Secret | Génération | Rotation |
|---|---|---|
| `SESSION_SECRET` | `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` | Après incident, ou annuellement ; **toutes les sessions sont invalidées** |
| Mot de passe base | Généré par l'administrateur, 24+ caractères | Après incident, ou annuellement |
| Mot de passe admin | Généré par la procédure (T13-02/T13-03) | À la première connexion, puis selon la politique |

> La rotation de `SESSION_SECRET` **révoque toutes les sessions** : c'est un effet attendu, à planifier hors heures ouvrées.

### 8.4 Stockage et permissions

- `.env` **non versionné** (`.gitignore`), présent uniquement sur le serveur.
- Permissions restreintes au compte de service (ÉTAPE 14).
- Aucune copie dans le dépôt, dans un courriel, dans un ticket ou dans la documentation.
- `.env.test.example` ne contient **aucun secret réel**.
- Les sauvegardes du `.env` sont chiffrées ou exclues ; la restauration utilise une procédure séparée.

### 8.5 Interdictions

- Aucun secret dans le code source, les commentaires, les tests ou les migrations.
- Aucun secret dans les réponses de l'API, les DTO, l'audit ou les journaux.
- Aucun secret dans le bundle client : **toute variable préfixée `VITE_` est publique**.
- Aucune clé privée, aucun certificat privé dans le dépôt.

---

## 9. Transport et en-têtes

### 9.1 HTTPS

| Environnement | HTTP | HTTPS | Cookie `Secure` |
|---|---|---|---|
| **Développement local** | Autorisé (`localhost`) | Facultatif | `false` |
| **Recette** | Redirigé | **Obligatoire** | `true` |
| **Production** | Redirigé (301) | **Obligatoire** | `true` |

- Certificat interne ou auto-signé installé sur les postes (ÉTAPE 14).
- Redirection HTTP → HTTPS **avant** tout traitement applicatif.
- Aucune exception pour `/api/health` en production.

### 9.2 HSTS

| En-tête | Valeur | Condition |
|---|---|---|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | **Uniquement** en recette et production, après validation du certificat |

> `includeSubDomains` n'est activé que si **tous** les sous-domaines de l'hôte sont en HTTPS. Sinon, retirer ce paramètre (ÉTAPE 14).

### 9.3 Content Security Policy

**Production** :

```text
default-src 'self';
script-src 'self';
style-src 'self';
img-src 'self' data:;
font-src 'self';
connect-src 'self';
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
upgrade-insecure-requests
```

**Développement** : CSP assouplie pour le rechargement à chaud Vite (`connect-src 'self' ws:`, `script-src 'self' 'unsafe-inline'`), **jamais** en production.

| Règle | Conséquence |
|---|---|
| Aucun script inline | Interdiction d'injecter du HTML brut |
| Aucun style inline | Utiliser les CSS Modules ; pas de `style={{…}}` pour des valeurs dynamiques |
| Aucune police externe | Polices système uniquement |
| Aucune image externe | Images locales ou `data:` |
| Aucune connexion sortante | `connect-src 'self'` : aucun appel à un service tiers |

### 9.4 Autres en-têtes

| En-tête | Valeur |
|---|---|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `no-referrer` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=()` |
| `Cross-Origin-Opener-Policy` | `same-origin` |
| `Cross-Origin-Resource-Policy` | `same-origin` |
| `X-Powered-By` | **supprimé** |
| `ETag` | **désactivé** sur les réponses API |
| `Cache-Control` | `no-store` sur les réponses API |

### 9.5 CORS

- **Aucun CORS** : la SPA est servie par le même serveur.
- Aucun en-tête `Access-Control-Allow-Origin`.
- En développement, le proxy Vite fait office de même origine.
- Une requête `OPTIONS` inattendue reçoit `404` ou `405`, jamais une autorisation.

### 9.6 Compression

- `gzip` / `br` activé pour les réponses texte.
- Risque BREACH jugé faible (aucune réflexion d'entrée utilisateur à côté d'un secret dans la même réponse) ; documenté et accepté.
- Les réponses d'authentification ne contiennent **aucun** secret dans le corps, hors mot de passe temporaire renvoyé une seule fois à l'admin (connexion authentifiée, pas de réflexion).

---

## 10. Journalisation et audit

### 10.1 Journal technique — **T13-09**

| Champ | Contenu |
|---|---|
| `horodatage` | ISO 8601 UTC |
| `niveau` | `info`, `warn`, `error` |
| `requestId` | UUID par requête, renvoyé dans l'en-tête `X-Request-Id` |
| `methode`, `chemin`, `statut`, `dureeMs` | Accès |
| `utilisateurId` | Si authentifié ; jamais l'identifiant saisi |
| `ip` | Adresse source |
| `message` | Description courte |

**Interdits dans le journal technique** :

- mot de passe, hash, jeton de session, jeton CSRF, cookie ;
- corps des requêtes d'authentification ;
- en-tête `Cookie`, `Authorization` ;
- secret de configuration ;
- données métier complètes (les journaux d'accès ne contiennent que les métadonnées).

**Rotation** : quotidienne, conservation 30 jours, configuration à l'ÉTAPE 14 (ENF-13).

### 10.2 Journal d'audit

Le journal d'audit métier reste celui de `docs\06` §7.2 : **append-only**, consultable uniquement par l'admin, sans secret.

**Types d'opération ajoutés** (colonne `text`, aucune migration de type) :

| Type | Usage |
|---|---|
| `CONNEXION` | Connexion réussie, échec, verrouillage, déconnexion |
| `MOT_DE_PASSE` | Changement, réinitialisation, secours hors ligne |
| `SESSION` | Révocation en masse (désactivation, incident) |
| `COMPTE` | Création, modification, activation, désactivation |
| `ROLE` | Changement de rôle |

### 10.3 Événements de sécurité

| Événement | `type_operation` | `contexte` | Avant / après |
|---|---|---|---|
| Connexion réussie | `CONNEXION` | `{ ip, userAgent, motif: "SUCCES" }` | — |
| Échec (mot de passe faux) | `CONNEXION` | `{ ip, userAgent, motif: "MOT_DE_PASSE_INVALIDE" }` | — |
| Échec (compte inconnu) | `CONNEXION` | `{ ip, userAgent, motif: "IDENTIFIANT_INCONNU" }` | — |
| Échec (compte inactif) | `CONNEXION` | `{ ip, userAgent, motif: "COMPTE_INACTIF" }` | — |
| Verrouillage | `CONNEXION` | `{ ip, userAgent, motif: "VERROUILLAGE" }` | — |
| Déconnexion | `CONNEXION` | `{ ip, userAgent, motif: "DECONNEXION" }` | — |
| Changement de mot de passe | `MOT_DE_PASSE` | `{ ip, userAgent }` | — |
| Réinitialisation admin | `MOT_DE_PASSE` | `{ ip, cible }` | — |
| Révocation de sessions | `SESSION` | `{ ip, cause }` | — |
| Création de compte | `COMPTE` | `{ ip, role }` | — / `{ identifiant, role }` |
| Changement de rôle | `ROLE` | `{ ip }` | `{ role }` / `{ role }` |
| Désactivation | `COMPTE` | `{ ip }` | `{ actif: true }` / `{ actif: false }` |

> **Aucun mot de passe, hash, jeton ou secret** n'apparaît dans `donnees_avant`, `donnees_apres` ou `contexte`. Le `contexte` peut contenir l'IP et l'agent, jamais le cookie.

### 10.4 Interdictions et intégrité

- Aucune route de modification ou de suppression de l'audit.
- `UPDATE` et `DELETE` sur `journal_audit` refusés au niveau du rôle base **et** par un déclencheur (double protection).
- L'audit survit à la désactivation de son auteur (`acteur_id` nullable, `ON DELETE SET NULL`).
- Aucune purge automatique (D42).

### 10.5 Supervision

| Sujet | V1 | ÉTAPE 14 |
|---|---|---|
| Consultation de l'audit | Écran admin | — |
| Alertes | Revue manuelle | Supervision, seuils, notification |
| Journaux techniques | Fichiers avec rotation | Rotation automatisée, rétention |
| Tableau de bord sécurité | Aucun | Indicateurs simples (échecs, verrouillages) |

---

## 11. Sauvegardes, restauration et chiffrement

### 11.1 Exigences

| Sujet | Règle | Réf. |
|---|---|---|
| **Fréquence** | Quotidienne | ENF-04 |
| **Conservation** | 30 jours | ENF-04 |
| **Copie hors machine** | Obligatoire | ENF-04 |
| **Restauration testée** | Avant la mise en production, puis périodiquement | ENF-14 |
| **Avant migration** | Sauvegarde obligatoire | ENF-14 |
| **Checksum** | Empreinte de chaque sauvegarde | A11-04 |
| **Accès** | Compte dédié, permissions restreintes | T13-10 |

### 11.2 Chiffrement

| Élément | Mesure |
|---|---|
| **Sauvegardes** | Chiffrement **AES-256** (archive chiffrée) ou support chiffré (BitLocker) |
| **Disque du serveur** | **BitLocker** recommandé (ÉTAPE 14) |
| **Base** | Chiffrement au niveau disque ; pas de chiffrement applicatif colonne par colonne en V1 |
| **Secrets** | Le fichier `.env` n'est **pas** inclus dans les sauvegardes de base ; il est sauvegardé séparément, chiffré |
| **Supports usagés** | Effacement sécurisé avant mise au rebut |

### 11.3 Restauration et sessions

Après toute restauration de base :

1. **toutes les sessions sont révoquées** (`UPDATE session SET revoque_le = now()` ou `TRUNCATE session`) ;
2. les mots de passe sont conservés (aucune réinitialisation de masse) ;
3. l'admin vérifie le journal d'audit et la cohérence des données ;
4. un audit `SESSION` avec `cause = "RESTAURATION"` est écrit ;
5. les utilisateurs se reconnectent.

> Une session volée avant la sauvegarde ne doit pas redevenir valide après restauration.

### 11.4 Fin de vie

- Retrait du serveur : effacement sécurisé des disques, révocation des secrets, archivage chiffré si nécessaire.
- Suppression d'un compte : **jamais** de suppression physique ; désactivation (D12).
- Conservation des données : aucune purge automatique de l'audit (D42) ; les sessions sont purgées après 7 jours.

---

## 12. Réponse à incident

### 12.1 Niveaux

| Niveau | Définition | Exemple | Délai |
|---|---|---|---|
| **S1 — Critique** | Compromission avérée d'un compte admin ou de la base | Mot de passe admin divulgué, dump de base | Immédiat |
| **S2 — Majeur** | Tentative sérieuse ou accès non autorisé suspecté | Rafale de connexions, session volée | 24 h |
| **S3 — Mineur** | Écart de configuration sans exploitation connue | En-tête manquant, journal incomplet | 5 jours |
| **S4 — Observation** | Amélioration | Durcissement supplémentaire | Backlog |

### 12.2 Procédure

| Étape | Action | Responsable |
|---|---|---|
| 1 | **Détecter** : alerte, signalement, revue de journaux | Admin / informatique |
| 2 | **Qualifier** : nature, portée, comptes concernés | Admin / directeur |
| 3 | **Confiner** : désactiver les comptes, révoquer les sessions, bloquer l'IP, arrêter le service si nécessaire | Admin |
| 4 | **Éradiquer** : corriger la cause, mettre à jour, restaurer un état sain | Informatique |
| 5 | **Rétablir** : redémarrer, vérifier, réactiver les comptes nécessaires | Admin |
| 6 | **Apprendre** : compte rendu, cause racine, test de non-régression, mise à jour de ce document | Directeur |

### 12.3 Scénarios

| Scénario | Confinement | Rotation | Reprise |
|---|---|---|---|
| **Mot de passe divulgué** | Réinitialisation du compte, révocation des sessions | Mot de passe | Communication à l'utilisateur |
| **Session volée** | Révocation de toutes les sessions du compte | `SESSION_SECRET` si le vol est lié au serveur | Reconnexion |
| **Compte admin compromis** | Désactivation, création d'un admin de secours | `SESSION_SECRET`, mot de passe admin, mot de passe base | Audit complet |
| **Base copiée** | Restriction réseau, arrêt si nécessaire | Mots de passe base et admin, `SESSION_SECRET` | Analyse, information du directeur |
| **Rançongiciel** | Isolation du serveur, arrêt | Tous les secrets | Restauration sauvegarde, reconstruction |
| **Employé parti avec ses accès** | Désactivation (D50), révocation, annulation des tâches `A faire` (D74) | Aucune | Vérification de l'audit |
| **Verrouillage massif** | Vérification de la limitation IP, déverrouillage admin | Aucune | Revue des journaux |

### 12.4 Règles de rotation après incident

| Secret | Rotation obligatoire |
|---|---|
| `SESSION_SECRET` | **Oui** dès qu'un doute existe sur le serveur ou une session |
| Mot de passe base | **Oui** si la base ou le serveur est suspecté |
| Mot de passe admin | **Oui** si le compte est concerné |
| Mots de passe utilisateurs | **Oui** si la base ou les hash sont suspectés |

### 12.5 Traçabilité

- Chaque incident fait l'objet d'une **fiche** : date, niveau, description, actions, décision.
- Les journaux et l'audit concernés sont **conservés** (copie horodatée) avant toute purge.
- Le compte rendu est archivé avec les documents d'exploitation (ÉTAPE 14).
- Aucune suppression de preuve, même après résolution.

---

## 13. Tests de sécurité

### 13.1 Approche

| Niveau | Outil | Cible |
|---|---|---|
| **Unitaire** | Vitest | Politique de mot de passe, dérivation CSRF, calcul des durées, verrouillage |
| **Intégration** | Vitest + Supertest + PostgreSQL | Authentification, sessions, révocation, CSRF, limitation, audit, non-fuite |
| **Interface** | Vitest + Testing Library | États de connexion, verrouillage, changement forcé, erreurs |
| **Bout en bout** | Playwright | Connexion, changement forcé, déconnexion, expiration |
| **Manuel** | Liste ASVS | Configuration, en-têtes, secrets, exploitation |

### 13.2 Cas `TC-SEC-NNN`

#### Authentification et mots de passe

| # | Cas | Attendu |
|---|---|---|
| TC-SEC-001 | Connexion avec identifiant et mot de passe valides | `200`, cookie posé, `doitChangerMotDePasse` correct |
| TC-SEC-002 | Mot de passe faux | `401 IDENTIFIANTS_INVALIDES` |
| TC-SEC-003 | Identifiant inconnu | `401` **strictement identique** à TC-SEC-002 |
| TC-SEC-004 | Compte inactif avec bon mot de passe | `401` identique |
| TC-SEC-005 | Compte verrouillé avec bon mot de passe | `401` identique |
| TC-SEC-006 | 5 échecs consécutifs | Compte verrouillé 15 min, audit `VERROUILLAGE` |
| TC-SEC-007 | Verrouillage expiré | Connexion possible, compteur remis à zéro |
| TC-SEC-008 | Connexion réussie après 4 échecs | Compteur remis à zéro |
| TC-SEC-009 | 11ᵉ tentative de connexion depuis une IP en 15 min | `429 TROP_DE_TENTATIVES` + `Retry-After` |
| TC-SEC-010 | Mot de passe de 11 caractères | `422 MOT_DE_PASSE_INVALIDE` |
| TC-SEC-011 | Mot de passe égal à l'identifiant | `422 MOT_DE_PASSE_INVALIDE` |
| TC-SEC-012 | Nouveau mot de passe égal à l'ancien | `422 MOT_DE_PASSE_IDENTIQUE` |
| TC-SEC-013 | Changement forcé : accès à `GET /tasks` | `403 CHANGEMENT_MOT_DE_PASSE_REQUIS` |
| TC-SEC-014 | Changement forcé : accès à `/auth/password`, `/auth/csrf`, `/me`, `/auth/logout` | Autorisé |
| TC-SEC-015 | Changement de mot de passe réussi | `204`, session renouvelée, autres sessions révoquées |
| TC-SEC-016 | Ancien mot de passe faux | `422`, aucun changement |
| TC-SEC-017 | Réinitialisation admin | `200`, mot de passe temporaire une seule fois, sessions révoquées, flag `true` |
| TC-SEC-018 | Réinitialisation de son propre compte par un admin | `403 AUTO_MODIFICATION_INTERDITE` |
| TC-SEC-019 | Mot de passe temporaire | 16 caractères, alphabet sans ambiguïté |

#### Sessions et CSRF

| # | Cas | Attendu |
|---|---|---|
| TC-SEC-020 | Cookie de session | `HttpOnly`, `Secure` (prod), `SameSite=Strict`, `Path=/api` |
| TC-SEC-021 | Inactivité de 31 minutes | `401 SESSION_EXPIREE` |
| TC-SEC-022 | Session de plus de 10 heures | `401 SESSION_EXPIREE` |
| TC-SEC-023 | Déconnexion | `204`, session révoquée, cookie effacé |
| TC-SEC-024 | Désactivation d'un employé | Sessions révoquées dans la même transaction (D50) |
| TC-SEC-025 | Jeton de session fourni dans l'URL ou un en-tête | Ignoré ; seul le cookie compte |
| TC-SEC-026 | Jeton de session en base | Aucun jeton en clair : uniquement un HMAC |
| TC-SEC-027 | Rotation à la connexion | Jeton différent de celui présenté |
| TC-SEC-028 | Écriture sans `X-CSRF-Token` | `403 JETON_CSRF_INVALIDE` |
| TC-SEC-029 | Écriture avec un jeton d'une autre session | `403 JETON_CSRF_INVALIDE` |
| TC-SEC-030 | Écriture avec le bon jeton | Autorisée |
| TC-SEC-031 | `Origin` différent de `APP_ORIGIN` | `403 JETON_CSRF_INVALIDE` |
| TC-SEC-032 | `GET /auth/csrf` | Retourne un jeton stable pour la session |
| TC-SEC-033 | Limite de 5 sessions | La plus ancienne est révoquée |

#### En-têtes, transport et configuration

| # | Cas | Attendu |
|---|---|---|
| TC-SEC-034 | Réponse API | `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, CSP, `Permissions-Policy` |
| TC-SEC-035 | `X-Powered-By` | Absent |
| TC-SEC-036 | HSTS en production | Présent avec `max-age=31536000` |
| TC-SEC-037 | HTTP en production | Redirection 301 vers HTTPS |
| TC-SEC-038 | `SESSION_SECRET` absent en production | Démarrage refusé |
| TC-SEC-039 | `SESSION_SECRET` de moins de 32 octets en production | Démarrage refusé |
| TC-SEC-040 | `COOKIE_SECURE=false` en production | Démarrage refusé |
| TC-SEC-041 | `APP_ORIGIN` non HTTPS en production | Démarrage refusé |
| TC-SEC-042 | `npm audit --omit=dev` | 0 vulnérabilité |
| TC-SEC-043 | CSP en production | Aucun script inline accepté (vérification navigateur) |

#### Non-fuite, validation et audit

| # | Cas | Attendu |
|---|---|---|
| TC-SEC-044 | Réponses de tous les endpoints | Aucun `motDePasse`, `motDePasseHash`, `jeton`, `csrf` |
| TC-SEC-045 | Journaux techniques | Aucun mot de passe, cookie, jeton, en-tête d'authentification |
| TC-SEC-046 | Journal d'audit | Aucun secret ; acteur, cible, IP présents |
| TC-SEC-047 | Champ inconnu dans un corps | `400 CHAMP_INCONNU` |
| TC-SEC-048 | Corps de plus de 1 Mo | `413 CHARGE_TROP_VOLUMINEUSE` |
| TC-SEC-049 | `Content-Type` non JSON | `415 TYPE_MEDIA_NON_SUPPORTE` |
| TC-SEC-050 | Erreur interne | `500 ERREUR_INTERNE`, aucune pile d'appels |
| TC-SEC-051 | `UPDATE` / `DELETE` sur `journal_audit` | Refusés par la base |
| TC-SEC-052 | Changement de rôle pendant une session | Droits recalculés à la requête suivante (D73) |
| TC-SEC-053 | Dernier admin | `409 DERNIER_ADMIN` (D72) |
| TC-SEC-054 | Auto-modification du rôle | `403 AUTO_MODIFICATION_INTERDITE` (D75) |
| TC-SEC-055 | Désactivation d'un employé avec tâches `A faire` | Tâches annulées, audit par tâche (D74) |
| TC-SEC-056 | Réactivation d'un compte (D80) | Mot de passe conservé, `doitChangerMotDePasse = true`, accès limité jusqu'au changement |

> Les cas **TC-AUT-001 → TC-AUT-062** (autorisation) restent exécutés séparément ; ils ne sont pas remplacés par les tests de sécurité.

### 13.3 Correspondance avec les 62 cas d'autorisation

| Famille | Cas | Recouvrement sécurité |
|---|---|---|
| Lecture, création, modification, suppression | TC-AUT-001 → 054 | Vérifie l'absence de fuite et le refus serveur |
| Dernier admin | TC-AUT-055, 056 | TC-SEC-053 |
| Effet immédiat du rôle | TC-AUT-058 | TC-SEC-052 |
| Tâches d'un employé désactivé | TC-AUT-059, 060 | TC-SEC-055 |
| Auto-modification | TC-AUT-061, 062 | TC-SEC-054 |

### 13.4 Liste de contrôle manuelle (ASVS niveau 1, adaptée)

| # | Contrôle | Vérification |
|---|---|---|
| 1 | Authentification | Aucun compte par défaut autre que l'admin initial |
| 2 | Mots de passe | Aucun mot de passe en clair dans le dépôt, la base ou les journaux |
| 3 | Sessions | Cookie configuré, expiration vérifiée, révocation testée |
| 4 | Contrôle d'accès | 62 cas verts, refus par défaut |
| 5 | Validation | Champs inconnus rejetés, limites de taille |
| 6 | Injection | Aucune requête SQL concaténée |
| 7 | XSS | Aucun `dangerouslySetInnerHTML`, CSP active |
| 8 | CSRF | Jeton exigé sur toutes les écritures |
| 9 | En-têtes | Tous présents en production |
| 10 | TLS | Certificat valide, redirection HTTP |
| 11 | Journalisation | Aucun secret, audit append-only |
| 12 | Secrets | `.env` non versionné, permissions restreintes |
| 13 | Dépendances | `npm audit --omit=dev` à 0 |
| 14 | Sauvegardes | Chiffrées, restauration testée |
| 15 | Erreurs | Aucun détail technique au client |
| 16 | Configuration | Démarrage refusé si configuration faible |
| 17 | Comptes | Désactivation, dernier admin, auto-modification |
| 18 | Audit | Consultation admin uniquement, non modifiable |
| 19 | Documentation | Procédures de secours et d'incident à jour |
| 20 | Exploitation | Comptes système et permissions revus (ÉTAPE 14) |

### 13.5 Critères de sortie sécurité

| Critère | Seuil |
|---|---|
| `TC-SEC-001 → 055` | **100 % verts** |
| `TC-AUT-001 → 062` | **100 % verts** |
| Règles critiques (§6.2 du plan de tests) | **100 % couvertes** |
| `npm audit --omit=dev` | **0 vulnérabilité** |
| Anomalies S1 / S2 | **0 ouverte** |
| Liste ASVS | **20 / 20** vérifiés |
| Secrets | Aucun secret dans le dépôt |
| Revue de code sécurité | Effectuée et tracée |

---

## 14. Décisions et points

### 14.1 Décisions rendues le 02/11/2026

| # | Point d'origine | Décision | Conséquence |
|---|---|---|---|
| **D76** | **A13-01** — politique de mot de passe | **12 caractères minimum**, 128 maximum, **aucune composition imposée**, aucune expiration périodique, changement forcé à la première connexion et après réinitialisation | §3.3 ; `TC-SEC-010`, `TC-SEC-011` |
| **D77** | **A13-03** — durée de session | **30 minutes d'inactivité** et **10 heures absolues** | §4.4 ; `TC-SEC-021`, `TC-SEC-022` |
| **D78** | **A13-05 / A13-06** — verrouillage et limitation | **5 échecs → 15 minutes** par compte ; **10 tentatives / 15 min** et **100 requêtes / min** par IP | §5 ; `TC-SEC-006`, `TC-SEC-009` |
| **D79** | **A13-09** — MFA | **Aucune MFA en V1** ; risque accepté (R1), réexamen ultérieur | §2.6 |
| **D80** | **A13-14** — réactivation d'un compte | **Changement forcé à la connexion** (option C) : la réactivation met `doit_changer_mot_de_passe = true` ; l'utilisateur se connecte **une dernière fois** avec son ancien mot de passe puis doit en choisir un nouveau ; aucune session n'est créée durablement avant ce changement | §3.10 ; `TC-SEC-056` |

### 14.2 Décisions techniques

| # | Sujet | Choix | Justification |
|---|---|---|---|
| **T13-01** | Hachage | **Argon2id**, `@node-rs/argon2`, 64 Mio, 3 itérations, parallélisme 1, sel 16 octets, hash 32 octets | OWASP ; binaires précompilés ; re-hachage à la connexion |
| **T13-02** | Mot de passe temporaire | **16 caractères** générés, alphabet sans ambiguïté, retourné **une seule fois** | Lisible au téléphone, suffisamment fort |
| **T13-03** | Réinitialisation | Admin uniquement, **jamais son propre compte**, toutes sessions révoquées, déverrouillage inclus ; secours hors ligne `npm run admin:reset` | Évite le contournement de l'ancien mot de passe ; secours pour l'admin unique |
| **T13-04** | Session | Table `session`, jeton 32 octets, **HMAC-SHA-256** en base, cookie `HttpOnly` + `Secure` + `SameSite=Strict` + `Path=/api` | Aucun jeton en clair ; copie de base inexploitable |
| **T13-05** | CSRF | Jeton **dérivé** `HMAC(secret, "csrf:" + session.id)`, en-tête `X-CSRF-Token`, contrôle d'origine | Aucun stockage, rotation automatique, lié à la session |
| **T13-06** | Limitation | **`express-rate-limit`**, stockage mémoire, `TRUST_PROXY` explicite | Simple, adapté à un serveur unique |
| **T13-07** | Erreur « ancien mot de passe faux » | `422 MOT_DE_PASSE_INVALIDE` avec `erreurs[].champ = "ancienMotDePasse"` | **Aucun nouveau code global** ; catalogue stable |
| **T13-08** | En-têtes et CSP | **Helmet** + CSP stricte en production, relâchée en développement | SPA sans script inline ; défense en profondeur |
| **T13-09** | Journalisation | **`pino`** + `pino-http`, `X-Request-Id`, aucun corps d'authentification | Structuré, rapide, filtrable |
| **T13-10** | Configuration | **Zod** au démarrage, refus de démarrer si faible en production | Évite une configuration silencieusement dangereuse |
| **T13-11** | Purge et sessions multiples | Purge après **7 jours** ; **5 sessions actives** maximum par compte | Limite la durée de vie des traces ; évite l'accumulation |
| **T13-12** | Rôles base de données | Rôle **applicatif** sans DDL et sans `UPDATE`/`DELETE` sur l'audit ; rôle **migrateur** séparé en production | Moindre privilège ; double protection de l'audit |
| **T13-13** | Phases d'implémentation | **4 phases** (A → D), validation après chacune | Adaptation demandée le 02/11/2026 (fusion des phases 1 à 3) |

### 14.3 Point tranché le 02/11/2026

#### `A13-14` — Réactivation d'un compte : réinitialisation obligatoire ? ✅

**Décision : option C — changement forcé à la connexion (D80).**

| Sujet | Règle |
|---|---|
| **Déclencheur** | `PATCH /employees/:id { actif: true }` par un `ADMIN` |
| **Mot de passe** | **Conservé** : l'utilisateur se connecte une dernière fois avec son ancien mot de passe |
| **Obligation** | `doit_changer_mot_de_passe = true` : les seules routes accessibles sont `/auth/csrf`, `/auth/password`, `/me`, `/auth/logout` |
| **Sessions** | Aucune session antérieure ne subsiste (toutes révoquées à la désactivation, D50) ; la session ouverte à la reconnexion est **renouvelée** après le changement |
| **Déverrouillage** | `tentatives_echouees = 0`, `verrouille_jusqua = NULL` |
| **Audit** | `COMPTE` avec `actif: false → true` ; le changement de mot de passe produit ensuite `MOT_DE_PASSE` |
| **Justification** | Compromis retenu : aucune remise de mot de passe à organiser, tout en garantissant qu'aucun ancien secret ne reste valide au-delà d'une connexion |

> **Aucune réinitialisation automatique** n'est effectuée par la réactivation. L'admin garde la possibilité de réinitialiser séparément (`POST /accounts/:id/reset-password`, T13-03) s'il suspecte une compromission.

### 14.4 Effet sur les points ouverts

| Point | État après cette étape |
|---|---|
| **P12** — sessions et mots de passe | ✅ **Clos** par **D76 → D80** et **T13-01 → T13-06** |
| **P1** — signification de `Durée G./E.` | ❓ Toujours ouvert (métier) |
| **P2** — fériés 2027-2028 | ❓ Toujours ouvert |
| **P3** — liste des consultants | ❓ Toujours ouvert |
| **P5** — sémantique de `FREQUENCE` | ❓ Toujours ouvert |
| **P11** — environnement serveur | ❓ Toujours ouvert (ÉTAPE 14) |
| **A13-14** — réactivation | ✅ **Tranché** : option C (**D80**) |

---

## 15. Plan d'implémentation

### 15.1 Principe

L'application est développée **dans cette étape**, en **quatre phases**. Chaque phase se termine par :

1. `npm run typecheck` ✅ ;
2. `npm run lint` ✅ ;
3. `npm run format:check` ✅ ;
4. `npm run test` ✅ ;
5. un **compte rendu** de livraison ;
6. votre **validation** avant la phase suivante.

> Aucune phase ne commence sans la validation de la précédente.

### 15.2 Phase A — Données, moteurs et socle de sécurité

**Objectif** : disposer d'une base saine, des règles métier testées et du socle d'authentification.

| Livrable | Détail |
|---|---|
| **Schéma Prisma** | 14 tables validées + table `session` ; 4 énumérations ; contraintes, index partiels, FK composites |
| **Migrations** | `0001_init` (tables, types, contraintes, index) ; `0002_audit_append_only` (déclencheur) |
| **Seed** | **55 lignes** (docs\10 §4), idempotent, une transaction, contrôles 1 → 14 |
| **Compte admin** | Création **hors seed**, par commande paramétrée (D70) ; identité à fournir avant l'ÉTAPE 14 |
| **Moteurs** | `task-status`, `task-progress`, `priority`, `reminder`, `working-days`, `durations`, cohérence des dates |
| **Socle sécurité** | Configuration Zod, Argon2id, politique de mot de passe, sessions, CSRF, verrouillage, limitation, Helmet, pino |
| **Tests** | Unitaires moteurs ; `TC-SEC-001 → 019`, `020 → 026`, `028 → 033`, `038 → 041`, `044 → 049` |

**Porte de validation A** :

- 55 lignes exactes, contrôles 1 → 14 verts ;
- moteurs couverts à **≥ 80 %** ;
- création de compte, connexion, changement forcé, déconnexion et verrouillage fonctionnels ;
- aucune donnée nominative inventée.

### 15.3 Phase B — API complète

**Objectif** : les **54 endpoints** du contrat, avec les **62 cas d'autorisation**.

| Livrable | Détail |
|---|---|
| **Modules** | `auth`, `accounts`, `employees`, `departments`, `partners`, `elements`, `priorities`, `tasks`, `dashboard`, `audit` |
| **Middleware** | Session, changement forcé, CSRF, autorisation, validation Zod, erreurs, limitation |
| **Endpoints** | 54, conformes à `docs\07` (enveloppes, codes, pagination, tri, filtres) |
| **Transactions** | Création, duplication, clôture, désactivation (D74), dernier admin (D72) |
| **Audit** | Hooks sur chaque écriture, append-only |
| **Tests** | `TC-AUT-001 → 062` ; un cas nominal, un refus et un cas de validation par endpoint ; `TC-SEC-027`, `034 → 037`, `042`, `050 → 055` |

**Porte de validation B** :

- **54 / 54** endpoints couverts ;
- **62 / 62** cas d'autorisation verts ;
- aucune fuite de champ ou de secret ;
- `npm audit --omit=dev` à 0.

### 15.4 Phase C — Interface React

**Objectif** : les **14 écrans** et les **18 parcours** du livrable 08.

| Livrable | Détail |
|---|---|
| **Socle** | Vite, React Router, TanStack Query, React Hook Form + Zod, CSS Modules |
| **Écrans** | Connexion, Aujourd'hui, Mes tâches, Service, Toutes les tâches, Détail, Création / modification, Duplication, Comptes, Employés, Référentiels, Fériés / paramètres, Audit, Profil |
| **Sécurité d'interface** | Aucun rôle codé en dur (D63), aucun secret, messages non divulgants, changement forcé, expiration, verrouillage |
| **Accessibilité** | Navigation clavier, contrastes, libellés |
| **Tests** | Composants et parcours ; Playwright sur les **6 scénarios** retenus (E2E-01 → E2E-06) |

**Porte de validation C** :

- **14 / 14** écrans livrés ;
- **18 / 18** parcours exécutables ;
- **6 / 6** scénarios E2E verts ;
- aucune action interdite visible pour un rôle qui ne la possède pas.

### 15.5 Phase D — Durcissement et livraison

**Objectif** : vérifier la sécurité de bout en bout et préparer l'ÉTAPE 14.

| Livrable | Détail |
|---|---|
| **Revue de sécurité** | Liste ASVS (20 points), revue de code ciblée |
| **Tests complets** | Unitaires, intégration, composants, E2E |
| **Configuration** | `.env.example` complet, procédure de génération des secrets |
| **Documentation** | Mise à jour de `docs\06` (table `session`), `docs\07` (P12 clos), `docs\12`, README |
| **Préparation ÉTAPE 14** | Liste des éléments à installer, certificat, sauvegardes, supervision |

**Porte de validation D** :

- tous les tests verts ;
- **TC-SEC-001 → 055** et **TC-AUT-001 → 062** verts ;
- liste ASVS 20 / 20 ;
- aucun secret dans le dépôt ;
- **ÉTAPE 13 close**.

### 15.6 Risques techniques et parades

| Risque | Impact | Parade |
|---|---|---|
| **Téléchargement des moteurs Prisma** | Blocage de l'installation | Vérifier la connexion ; utiliser le miroir interne si nécessaire |
| **`@node-rs/argon2` incompatible Node 24** | Authentification impossible | Vérifier les binaires précompilés ; repli sur `argon2` avec compilation, ou `crypto.scrypt` **seulement** après validation |
| **Base de test non créée** | Tests d'intégration ignorés | Créer `gd_trading_test` avec les droits du service PostgreSQL local ; sinon la suite est ignorée sans échec |
| **Mot de passe PostgreSQL inconnu** | Impossible de créer la base | À fournir par le responsable informatique ; non bloquant pour la phase A (schéma et tests unitaires) |
| **Port 3000 occupé** | Serveur de développement non démarrable | Port configurable par `PORT` |
| **Certificat interne** | HTTPS non testable localement | Développement en HTTP avec `COOKIE_SECURE=false` ; recette en HTTPS (ÉTAPE 14) |
| **Volumétrie des tests** | Durée d'exécution | Projets Vitest séparés ; tests d'intégration séquentiels |

---

## 16. Ce que l'ÉTAPE 13 ne fait pas

- Elle **n'installe pas** le serveur, le certificat, les sauvegardes ni la supervision → **ÉTAPE 14**.
- Elle **ne rédige pas** le manuel utilisateur ni le manuel d'administration → **ÉTAPE 15**.
- Elle **ne met pas en place** de MFA (D79).
- Elle **ne réalise pas** de test d'intrusion externe.
- Elle **ne modifie pas** les 54 endpoints, les 14 écrans, les 55 lignes du seed ni les règles métier.
- Elle **n'invente aucune donnée nominative** : le compte admin initial sera créé avec l'identité fournie par le directeur.
- Elle **ne reprend aucune donnée** du classeur Excel (D11).

---

## 17. Validation

**Spécification validée le 02/11/2026** :

1. le **modèle de menaces** (§2) et les **risques acceptés** (§2.6, dont l'absence de MFA — **D79**) sont conformes ;
2. la **politique de mot de passe** (**D76**) est arrêtée : 12 caractères, aucune composition, aucune expiration périodique ;
3. les **durées de session** (**D77**) sont arrêtées : 30 minutes d'inactivité, 10 heures absolues ;
4. le **verrouillage et la limitation** (**D78**) sont arrêtés : 5 échecs → 15 minutes, 10 tentatives / 15 min et 100 requêtes / min par IP ;
5. les **mécanismes techniques** (**T13-01 → T13-13**) sont acceptés, notamment la table `session`, le jeton CSRF dérivé et le hachage Argon2id ;
6. les **tests de sécurité** (§13) et les **critères de sortie** (§13.5) sont complets (**56 cas**) ;
7. le **plan d'implémentation en quatre phases** (§15) est accepté ;
8. **`A13-14`** est tranché : **option C — changement forcé à la connexion** (**D80**).

> **Phase A engagée le 02/11/2026** : schéma Prisma, migrations, seed, moteurs de domaine et socle de sécurité.

---

## 18. Journal des révisions

| Date | Section(s) | Modification | Statut |
|---|---|---|---|
| 02/11/2026 | Document entier | Création du livrable 12 (ÉTAPE 13) : objet et périmètre, modèle de menaces et risques acceptés, authentification (D76), hachage Argon2id, première connexion, réinitialisation, sessions (D77), CSRF, verrouillage et limitation (D78), validation et injections, autorisation, secrets, transport et en-têtes, journalisation et audit, sauvegardes, réponse à incident, **55 cas de test de sécurité**, décisions **D76 → D79**, **T13-01 → T13-13**, plan d'implémentation en **quatre phases**. Aucun code écrit. | ⏳ En attente de validation |
| 02/11/2026 | §1.4, §3.10, §13.2, §14.1, §14.3, §14.4, §17, §18 | **Validation du document.** `A13-14` tranché : **option C** → **D80** (réactivation = changement forcé à la connexion). Ajout de **TC-SEC-056** (56 cas). P12 clos par **D76 → D80**. **Phase A engagée.** | ✅ **Validée le 02/11/2026** |
