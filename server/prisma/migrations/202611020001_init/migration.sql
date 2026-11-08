-- =============================================================================
-- 0001_init — Schéma initial de l'application de suivi des TODO LIST
--
-- Source : docs/06_MODELE_DE_DONNEES.md (validé le 02/11/2026)
--          docs/12_SECURITE.md §4.1 (table `session`, T13-04)
--
-- Migration écrite à la main : Prisma ne sait pas exprimer les CHECK, les index
-- fonctionnels ou partiels, ni les déclencheurs. Le schéma Prisma décrit les
-- mêmes tables pour le client ; ce fichier est la référence exécutable.
--
-- Forward-only : aucune migration `down`. Le retour arrière passe par une
-- sauvegarde (ENF-04, ENF-14, docs/06 §14).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Énumérations (docs/06 §4.1)
-- ---------------------------------------------------------------------------

CREATE TYPE role_utilisateur AS ENUM ('ADMIN', 'RESPONSABLE', 'EMPLOYEE', 'CONSULTANT');
CREATE TYPE nature_tache AS ENUM ('QUOTIDIENNE', 'AUTRE');
CREATE TYPE acteur_tache AS ENUM ('GD_TRADING', 'PARTENAIRE');
CREATE TYPE statut_manuel AS ENUM ('ANNULEE', 'SUSPENDUE');

-- ---------------------------------------------------------------------------
-- 2. Référentiel des services (docs/06 §5.1)
-- ---------------------------------------------------------------------------

CREATE TABLE departement (
  id         uuid        NOT NULL DEFAULT gen_random_uuid(),
  libelle    text        NOT NULL,
  actif      boolean     NOT NULL DEFAULT true,
  cree_le    timestamptz NOT NULL DEFAULT now(),
  modifie_le timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT pk_departement PRIMARY KEY (id),
  CONSTRAINT ck_departement_libelle CHECK (length(btrim(libelle)) > 0)
);

CREATE UNIQUE INDEX uq_departement_libelle ON departement (lower(libelle));
CREATE INDEX ix_departement_actif ON departement (actif);

-- ---------------------------------------------------------------------------
-- 3. Employés (docs/06 §5.2)
-- ---------------------------------------------------------------------------

CREATE TABLE employe (
  id             uuid        NOT NULL DEFAULT gen_random_uuid(),
  nom            text        NOT NULL,
  prenom         text        NOT NULL,
  email          text,
  departement_id uuid,
  actif          boolean     NOT NULL DEFAULT true,
  cree_le        timestamptz NOT NULL DEFAULT now(),
  modifie_le     timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT pk_employe PRIMARY KEY (id),
  CONSTRAINT ck_employe_nom CHECK (length(btrim(nom)) > 0),
  CONSTRAINT ck_employe_prenom CHECK (length(btrim(prenom)) > 0),
  CONSTRAINT ck_employe_email CHECK (email IS NULL OR length(btrim(email)) > 0),
  CONSTRAINT fk_employe_departement FOREIGN KEY (departement_id)
    REFERENCES departement (id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX ix_employe_departement ON employe (departement_id);
CREATE INDEX ix_employe_actif ON employe (actif) WHERE actif;

-- ---------------------------------------------------------------------------
-- 4. Comptes (docs/06 §5.3, docs/12 §3 et §5)
-- ---------------------------------------------------------------------------

CREATE TABLE utilisateur (
  id                       uuid             NOT NULL DEFAULT gen_random_uuid(),
  employe_id               uuid,
  identifiant              text             NOT NULL,
  mot_de_passe_hash        text             NOT NULL,
  role                     role_utilisateur NOT NULL DEFAULT 'EMPLOYEE',
  actif                    boolean          NOT NULL DEFAULT true,
  doit_changer_mot_de_passe boolean         NOT NULL DEFAULT true,
  tentatives_echouees      smallint         NOT NULL DEFAULT 0,
  verrouille_jusqua        timestamptz,
  derniere_connexion_le    timestamptz,
  cree_le                  timestamptz      NOT NULL DEFAULT now(),
  modifie_le               timestamptz      NOT NULL DEFAULT now(),

  CONSTRAINT pk_utilisateur PRIMARY KEY (id),
  CONSTRAINT ck_utilisateur_identifiant
    CHECK (length(btrim(identifiant)) BETWEEN 3 AND 64 AND identifiant !~ '\s'),
  CONSTRAINT ck_utilisateur_tentatives CHECK (tentatives_echouees >= 0),
  CONSTRAINT ck_utilisateur_hash CHECK (length(btrim(mot_de_passe_hash)) > 0),
  CONSTRAINT fk_utilisateur_employe FOREIGN KEY (employe_id)
    REFERENCES employe (id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Un compte par employé — équivalent de l'index partiel du docs/06 §5.3 :
-- PostgreSQL n'applique pas la contrainte aux valeurs NULL.
CREATE UNIQUE INDEX uq_utilisateur_employe
  ON utilisateur (employe_id) WHERE employe_id IS NOT NULL;

-- Unicité insensible à la casse de l'identifiant.
CREATE UNIQUE INDEX uq_utilisateur_identifiant ON utilisateur (lower(identifiant));
CREATE INDEX ix_utilisateur_role ON utilisateur (role);

-- ---------------------------------------------------------------------------
-- 5. Partenaires (docs/06 §5.4)
-- ---------------------------------------------------------------------------

CREATE TABLE partenaire (
  id         uuid        NOT NULL DEFAULT gen_random_uuid(),
  libelle    text        NOT NULL,
  actif      boolean     NOT NULL DEFAULT true,
  cree_le    timestamptz NOT NULL DEFAULT now(),
  modifie_le timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT pk_partenaire PRIMARY KEY (id),
  CONSTRAINT ck_partenaire_libelle CHECK (length(btrim(libelle)) > 0)
);

CREATE UNIQUE INDEX uq_partenaire_libelle ON partenaire (lower(libelle));
CREATE INDEX ix_partenaire_actif ON partenaire (actif) WHERE actif;

-- ---------------------------------------------------------------------------
-- 6. Piliers / éléments (docs/06 §5.5)
-- ---------------------------------------------------------------------------

CREATE TABLE element (
  id         uuid        NOT NULL DEFAULT gen_random_uuid(),
  libelle    text        NOT NULL,
  ordre      smallint    NOT NULL DEFAULT 0,
  actif      boolean     NOT NULL DEFAULT true,
  cree_le    timestamptz NOT NULL DEFAULT now(),
  modifie_le timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT pk_element PRIMARY KEY (id),
  CONSTRAINT ck_element_libelle CHECK (length(btrim(libelle)) > 0),
  CONSTRAINT ck_element_ordre CHECK (ordre >= 0)
);

CREATE UNIQUE INDEX uq_element_libelle ON element (lower(libelle));
CREATE INDEX ix_element_actif_ordre ON element (actif, ordre);

-- ---------------------------------------------------------------------------
-- 7. Urgences et importances (docs/06 §5.6 et §5.7)
-- ---------------------------------------------------------------------------

CREATE TABLE urgence (
  id      uuid     NOT NULL DEFAULT gen_random_uuid(),
  libelle text     NOT NULL,
  ordre   smallint NOT NULL DEFAULT 0,

  CONSTRAINT pk_urgence PRIMARY KEY (id),
  CONSTRAINT ck_urgence_libelle CHECK (length(btrim(libelle)) > 0),
  CONSTRAINT ck_urgence_ordre CHECK (ordre >= 0)
);

CREATE UNIQUE INDEX uq_urgence_libelle ON urgence (lower(libelle));

CREATE TABLE importance (
  id      uuid     NOT NULL DEFAULT gen_random_uuid(),
  libelle text     NOT NULL,
  ordre   smallint NOT NULL DEFAULT 0,

  CONSTRAINT pk_importance PRIMARY KEY (id),
  CONSTRAINT ck_importance_libelle CHECK (length(btrim(libelle)) > 0),
  CONSTRAINT ck_importance_ordre CHECK (ordre >= 0)
);

CREATE UNIQUE INDEX uq_importance_libelle ON importance (lower(libelle));

-- ---------------------------------------------------------------------------
-- 8. Matrice de priorité (docs/06 §5.8, D31)
-- ---------------------------------------------------------------------------

CREATE TABLE matrice_priorite (
  urgence_id      uuid     NOT NULL,
  importance_id   uuid     NOT NULL,
  score           smallint NOT NULL,
  frequence_jours smallint NOT NULL,

  CONSTRAINT pk_matrice_priorite PRIMARY KEY (urgence_id, importance_id),
  CONSTRAINT ck_matrice_score CHECK (score BETWEEN 0 AND 12),
  CONSTRAINT ck_matrice_frequence CHECK (frequence_jours BETWEEN 1 AND 45),
  CONSTRAINT fk_matrice_urgence FOREIGN KEY (urgence_id)
    REFERENCES urgence (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_matrice_importance FOREIGN KEY (importance_id)
    REFERENCES importance (id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ---------------------------------------------------------------------------
-- 9. Actions à prendre (docs/06 §5.9)
-- ---------------------------------------------------------------------------

CREATE TABLE action_a_prendre (
  id         uuid        NOT NULL DEFAULT gen_random_uuid(),
  libelle    text        NOT NULL,
  actif      boolean     NOT NULL DEFAULT true,
  cree_le    timestamptz NOT NULL DEFAULT now(),
  modifie_le timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT pk_action_a_prendre PRIMARY KEY (id),
  CONSTRAINT ck_action_a_prendre_libelle CHECK (length(btrim(libelle)) > 0)
);

CREATE UNIQUE INDEX uq_action_a_prendre_libelle ON action_a_prendre (lower(libelle));

-- ---------------------------------------------------------------------------
-- 10. Tâches (docs/06 §6)
-- ---------------------------------------------------------------------------

CREATE TABLE tache (
  id                    uuid           NOT NULL DEFAULT gen_random_uuid(),
  nature                nature_tache   NOT NULL,
  libelle               text           NOT NULL,
  element_id            uuid           NOT NULL,
  acteur                acteur_tache   NOT NULL,
  pilote_employe_id     uuid,
  pilote_partenaire_id  uuid,
  assigne_a_id          uuid           NOT NULL,
  date_action           date           NOT NULL,
  date_debut            date           NOT NULL,
  date_fin_prevue       date,
  date_fin              date,
  cloture_le            timestamptz,
  urgence_id            uuid           NOT NULL,
  importance_id         uuid           NOT NULL,
  action_a_prendre_id   uuid,
  statut_manuel         statut_manuel,
  progression_manuelle  smallint,
  motif_non_achevement  text,
  cree_par_id           uuid           NOT NULL,
  attribue_par_id       uuid           NOT NULL,
  supprime_le           timestamptz,
  supprime_par_id       uuid,
  cree_le               timestamptz    NOT NULL DEFAULT now(),
  modifie_le            timestamptz    NOT NULL DEFAULT now(),
  version               integer        NOT NULL DEFAULT 1,

  CONSTRAINT pk_tache PRIMARY KEY (id),

  CONSTRAINT ck_tache_libelle CHECK (length(btrim(libelle)) > 0),
  CONSTRAINT ck_tache_version CHECK (version >= 1),

  -- D6 / EF-26 : un seul pilote, du bon type.
  CONSTRAINT ck_tache_pilote CHECK (
    (acteur = 'GD_TRADING'
      AND pilote_employe_id IS NOT NULL
      AND pilote_partenaire_id IS NULL)
    OR
    (acteur = 'PARTENAIRE'
      AND pilote_partenaire_id IS NOT NULL
      AND pilote_employe_id IS NULL)
  ),

  -- EF-35 / RM-15 : ordre des dates.
  CONSTRAINT ck_tache_dates_ordre CHECK (
    date_action <= date_debut
    AND (date_fin_prevue IS NULL OR date_debut <= date_fin_prevue)
  ),
  CONSTRAINT ck_tache_date_fin CHECK (date_fin IS NULL OR date_fin >= date_debut),

  -- D28 : quotidienne = journée unique ; autre = échéance obligatoire.
  CONSTRAINT ck_tache_nature CHECK (
    (nature = 'QUOTIDIENNE' AND date_fin_prevue IS NULL AND date_debut = date_action)
    OR
    (nature = 'AUTRE' AND date_fin_prevue IS NOT NULL)
  ),

  CONSTRAINT ck_tache_progression CHECK (
    progression_manuelle IS NULL OR progression_manuelle BETWEEN 0 AND 100
  ),

  -- D15 : filet de sécurité pour la clôture tardive (le détail 16h30 est
  -- porté par le moteur de domaine, cf. docs/06 §6.2).
  CONSTRAINT ck_tache_motif CHECK (
    date_fin IS NULL
    OR date_fin <= COALESCE(date_fin_prevue, date_debut)
    OR (motif_non_achevement IS NOT NULL AND length(btrim(motif_non_achevement)) > 0)
  ),

  CONSTRAINT ck_tache_cloture CHECK (
    (date_fin IS NULL AND cloture_le IS NULL)
    OR (date_fin IS NOT NULL AND cloture_le IS NOT NULL)
  ),

  CONSTRAINT ck_tache_suppression CHECK (
    (supprime_le IS NULL AND supprime_par_id IS NULL)
    OR (supprime_le IS NOT NULL AND supprime_par_id IS NOT NULL)
  ),

  CONSTRAINT fk_tache_element FOREIGN KEY (element_id)
    REFERENCES element (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_tache_assigne FOREIGN KEY (assigne_a_id)
    REFERENCES employe (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_tache_pilote_employe FOREIGN KEY (pilote_employe_id)
    REFERENCES employe (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_tache_pilote_partenaire FOREIGN KEY (pilote_partenaire_id)
    REFERENCES partenaire (id) ON DELETE RESTRICT ON UPDATE CASCADE,

  -- D31 : les 3 combinaisons absentes sont impossibles en base.
  CONSTRAINT fk_tache_matrice FOREIGN KEY (urgence_id, importance_id)
    REFERENCES matrice_priorite (urgence_id, importance_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_tache_action FOREIGN KEY (action_a_prendre_id)
    REFERENCES action_a_prendre (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_tache_cree_par FOREIGN KEY (cree_par_id)
    REFERENCES utilisateur (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_tache_attribue_par FOREIGN KEY (attribue_par_id)
    REFERENCES utilisateur (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_tache_supprime_par FOREIGN KEY (supprime_par_id)
    REFERENCES utilisateur (id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX ix_tache_assigne ON tache (assigne_a_id);
CREATE INDEX ix_tache_pilote_employe ON tache (pilote_employe_id);
CREATE INDEX ix_tache_cree_par ON tache (cree_par_id);
CREATE INDEX ix_tache_attribue_par ON tache (attribue_par_id);
CREATE INDEX ix_tache_element ON tache (element_id);
CREATE INDEX ix_tache_matrice ON tache (urgence_id, importance_id);
CREATE INDEX ix_tache_jour ON tache (nature, date_action);
CREATE INDEX ix_tache_echeance_ouverte ON tache (date_fin_prevue)
  WHERE date_fin IS NULL AND supprime_le IS NULL;
CREATE INDEX ix_tache_ouvertes ON tache (date_action)
  WHERE date_fin IS NULL AND supprime_le IS NULL;
CREATE INDEX ix_tache_libelle ON tache (lower(libelle));
CREATE INDEX ix_tache_supprime ON tache (supprime_le)
  WHERE supprime_le IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 11. Commentaires (docs/06 §7.1)
-- ---------------------------------------------------------------------------

CREATE TABLE commentaire (
  id        uuid        NOT NULL DEFAULT gen_random_uuid(),
  tache_id  uuid        NOT NULL,
  auteur_id uuid        NOT NULL,
  texte     text        NOT NULL,
  cree_le   timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT pk_commentaire PRIMARY KEY (id),
  CONSTRAINT ck_commentaire_texte CHECK (length(btrim(texte)) > 0),
  CONSTRAINT fk_commentaire_tache FOREIGN KEY (tache_id)
    REFERENCES tache (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_commentaire_auteur FOREIGN KEY (auteur_id)
    REFERENCES utilisateur (id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX ix_commentaire_tache_cree ON commentaire (tache_id, cree_le);

-- ---------------------------------------------------------------------------
-- 12. Journal d'audit (docs/06 §7.2) — append-only, voir migration 0002
-- ---------------------------------------------------------------------------

CREATE TABLE journal_audit (
  id             bigserial   NOT NULL,
  horodatage     timestamptz NOT NULL DEFAULT now(),
  acteur_id      uuid,
  type_operation text        NOT NULL,
  entite         text        NOT NULL,
  entite_id      text,
  donnees_avant  jsonb,
  donnees_apres  jsonb,
  contexte       jsonb,

  CONSTRAINT pk_journal_audit PRIMARY KEY (id),
  CONSTRAINT ck_journal_audit_type CHECK (length(btrim(type_operation)) > 0),
  CONSTRAINT ck_journal_audit_entite CHECK (length(btrim(entite)) > 0),
  CONSTRAINT fk_journal_audit_acteur FOREIGN KEY (acteur_id)
    REFERENCES utilisateur (id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX ix_journal_audit_entite ON journal_audit (entite, entite_id);
CREATE INDEX ix_journal_audit_horodatage ON journal_audit (horodatage);
CREATE INDEX ix_journal_audit_acteur ON journal_audit (acteur_id);

-- ---------------------------------------------------------------------------
-- 13. Paramètres (docs/06 §5.11)
-- ---------------------------------------------------------------------------

CREATE TABLE parametre (
  id                        smallint    NOT NULL DEFAULT 1,
  fuseau                    text        NOT NULL DEFAULT 'Africa/Algiers',
  weekend_jour_1            smallint    NOT NULL DEFAULT 5,
  weekend_jour_2            smallint    NOT NULL DEFAULT 6,
  heure_debut_journee       time(0)     NOT NULL DEFAULT '08:00:00',
  pause_debut               time(0)     NOT NULL DEFAULT '12:00:00',
  pause_fin                 time(0)     NOT NULL DEFAULT '13:00:00',
  heure_echeance_quotidienne time(0)    NOT NULL DEFAULT '16:30:00',
  modifie_le                timestamptz NOT NULL DEFAULT now(),
  modifie_par_id            uuid,

  CONSTRAINT pk_parametre PRIMARY KEY (id),
  CONSTRAINT ck_parametre_singleton CHECK (id = 1),
  CONSTRAINT ck_parametre_weekend CHECK (
    weekend_jour_1 BETWEEN 0 AND 6
    AND weekend_jour_2 BETWEEN 0 AND 6
    AND weekend_jour_1 <> weekend_jour_2
  ),
  CONSTRAINT ck_parametre_horaires CHECK (
    heure_debut_journee < pause_debut
    AND pause_debut < pause_fin
    AND pause_fin < heure_echeance_quotidienne
  ),
  CONSTRAINT fk_parametre_modifie_par FOREIGN KEY (modifie_par_id)
    REFERENCES utilisateur (id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- ---------------------------------------------------------------------------
-- 14. Jours fériés (docs/06 §5.10)
-- ---------------------------------------------------------------------------

CREATE TABLE jour_ferie (
  id      uuid        NOT NULL DEFAULT gen_random_uuid(),
  jour    date        NOT NULL,
  libelle text,
  cree_le timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT pk_jour_ferie PRIMARY KEY (id),
  CONSTRAINT ck_jour_ferie_libelle CHECK (libelle IS NULL OR length(btrim(libelle)) > 0)
);

CREATE UNIQUE INDEX uq_jour_ferie_jour ON jour_ferie (jour);

-- ---------------------------------------------------------------------------
-- 15. Sessions serveur (docs/12_SECURITE.md §4.1, T13-04)
-- ---------------------------------------------------------------------------

CREATE TABLE session (
  id                   uuid        NOT NULL DEFAULT gen_random_uuid(),
  utilisateur_id       uuid        NOT NULL,
  jeton_hash           text        NOT NULL,
  cree_le              timestamptz NOT NULL DEFAULT now(),
  derniere_activite_le timestamptz NOT NULL DEFAULT now(),
  expire_le            timestamptz NOT NULL,
  revoque_le           timestamptz,
  ip                   inet,
  user_agent           text,

  CONSTRAINT pk_session PRIMARY KEY (id),
  CONSTRAINT ck_session_jeton CHECK (length(btrim(jeton_hash)) > 0),
  CONSTRAINT ck_session_expiration CHECK (expire_le > cree_le),
  CONSTRAINT ck_session_user_agent CHECK (user_agent IS NULL OR length(user_agent) <= 512),
  CONSTRAINT fk_session_utilisateur FOREIGN KEY (utilisateur_id)
    REFERENCES utilisateur (id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX uq_session_jeton_hash ON session (jeton_hash);
CREATE INDEX ix_session_utilisateur ON session (utilisateur_id);
CREATE INDEX ix_session_expire ON session (expire_le);
