ALTER TYPE role_utilisateur RENAME VALUE 'EMPLOYEE' TO 'EMPLOYE';
ALTER TABLE utilisateur ALTER COLUMN role SET DEFAULT 'EMPLOYE';

CREATE TYPE organisation_utilisateur AS ENUM ('GD_TRADING', 'PARTENAIRE');
CREATE TYPE type_tache AS ENUM ('RECURRENTE', 'SIMPLE');
CREATE TYPE frequence_recurrence AS ENUM ('QUOTIDIENNE', 'HEBDOMADAIRE', 'MENSUELLE', 'TRIMESTRIELLE', 'ANNUELLE');
CREATE TYPE statut_tache AS ENUM ('A_FAIRE', 'EN_COURS', 'EN_RETARD', 'TERMINEE', 'TERMINEE_EN_RETARD', 'SUSPENDUE', 'ANNULEE');

ALTER TABLE utilisateur ADD COLUMN organisation organisation_utilisateur NOT NULL DEFAULT 'GD_TRADING';
ALTER TABLE utilisateur ADD COLUMN service_id uuid;

UPDATE utilisateur u
SET service_id = e.departement_id
FROM employe e
WHERE u.employe_id = e.id AND e.departement_id IS NOT NULL;

UPDATE utilisateur SET organisation = 'PARTENAIRE' WHERE role = 'CONSULTANT';

ALTER TABLE utilisateur
  ADD CONSTRAINT fk_utilisateur_service FOREIGN KEY (service_id)
  REFERENCES departement (id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE utilisateur
  ADD CONSTRAINT ck_utilisateur_service
  CHECK (role NOT IN ('RESPONSABLE', 'EMPLOYE') OR service_id IS NOT NULL) NOT VALID;

CREATE INDEX ix_utilisateur_service ON utilisateur (service_id);

ALTER TABLE tache ADD COLUMN type_tache type_tache;
UPDATE tache
SET type_tache = CASE
  WHEN nature = 'QUOTIDIENNE' THEN 'RECURRENTE'::type_tache
  ELSE 'SIMPLE'::type_tache
END;
ALTER TABLE tache ALTER COLUMN type_tache SET NOT NULL;
ALTER TABLE tache ALTER COLUMN type_tache SET DEFAULT 'SIMPLE';

ALTER TABLE tache ADD COLUMN frequence frequence_recurrence;
UPDATE tache SET frequence = 'QUOTIDIENNE' WHERE type_tache = 'RECURRENTE';

ALTER TABLE tache ADD COLUMN date_fin_recurrence date;
ALTER TABLE tache ADD COLUMN jour_echeance smallint;
ALTER TABLE tache ADD COLUMN is_supplementaire boolean NOT NULL DEFAULT false;
ALTER TABLE tache ADD COLUMN tache_origine_id uuid;
ALTER TABLE tache ADD COLUMN progression_surchargee boolean NOT NULL DEFAULT false;
UPDATE tache SET progression_surchargee = (progression_manuelle IS NOT NULL);
ALTER TABLE tache ADD COLUMN date_mise_a_jour timestamptz;
ALTER TABLE tache ADD COLUMN motif_retard text;
ALTER TABLE tache ADD COLUMN date_fin_reelle_estimee date;
ALTER TABLE tache ADD COLUMN retard_valide_par_id uuid;
ALTER TABLE tache ADD COLUMN retard_valide_le timestamptz;
ALTER TABLE tache ADD COLUMN suspendue_le timestamptz;
ALTER TABLE tache ADD COLUMN reprise_le timestamptz;
ALTER TABLE tache ADD COLUMN statut_avant_suspension statut_tache;
ALTER TABLE tache ADD COLUMN motif_suspension_annulation text;

ALTER TABLE tache ADD COLUMN statut statut_tache;
UPDATE tache
SET statut = CASE
  WHEN statut_manuel = 'ANNULEE' THEN 'ANNULEE'::statut_tache
  WHEN statut_manuel = 'SUSPENDUE' THEN 'SUSPENDUE'::statut_tache
  WHEN date_fin IS NOT NULL AND date_fin > COALESCE(date_fin_prevue, date_action) THEN 'TERMINEE_EN_RETARD'::statut_tache
  WHEN date_fin IS NOT NULL THEN 'TERMINEE'::statut_tache
  WHEN nature = 'QUOTIDIENNE' AND date_action < (now() AT TIME ZONE 'Africa/Algiers')::date THEN 'EN_RETARD'::statut_tache
  WHEN nature = 'AUTRE' AND date_fin_prevue < (now() AT TIME ZONE 'Africa/Algiers')::date THEN 'EN_RETARD'::statut_tache
  WHEN date_debut > (now() AT TIME ZONE 'Africa/Algiers')::date THEN 'A_FAIRE'::statut_tache
  ELSE 'EN_COURS'::statut_tache
END;
ALTER TABLE tache ALTER COLUMN statut SET NOT NULL;
ALTER TABLE tache ALTER COLUMN statut SET DEFAULT 'A_FAIRE';

ALTER TABLE tache
  ADD CONSTRAINT fk_tache_origine FOREIGN KEY (tache_origine_id)
  REFERENCES tache (id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE tache
  ADD CONSTRAINT fk_tache_retard_valide_par FOREIGN KEY (retard_valide_par_id)
  REFERENCES utilisateur (id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE tache
  ADD CONSTRAINT ck_tache_recurrence CHECK (
    (type_tache = 'RECURRENTE' AND frequence IS NOT NULL)
    OR (type_tache = 'SIMPLE' AND frequence IS NULL)
  );

ALTER TABLE tache
  ADD CONSTRAINT ck_tache_supplementaire CHECK (NOT is_supplementaire OR type_tache = 'SIMPLE');

ALTER TABLE tache
  ADD CONSTRAINT ck_tache_jour_echeance CHECK (jour_echeance IS NULL OR jour_echeance BETWEEN 1 AND 31);

ALTER TABLE tache
  ADD CONSTRAINT ck_tache_date_fin_recurrence CHECK (date_fin_recurrence IS NULL OR date_fin_recurrence >= date_debut);

ALTER TABLE tache
  ADD CONSTRAINT ck_tache_retard_validation CHECK (
    (retard_valide_par_id IS NULL AND retard_valide_le IS NULL)
    OR (retard_valide_par_id IS NOT NULL AND retard_valide_le IS NOT NULL)
  );

ALTER TABLE tache
  ADD CONSTRAINT ck_tache_suspension CHECK (reprise_le IS NULL OR suspendue_le IS NOT NULL);

CREATE INDEX ix_tache_origine ON tache (tache_origine_id);
CREATE INDEX ix_tache_type_statut ON tache (type_tache, statut);
CREATE INDEX ix_tache_supplementaire ON tache (is_supplementaire) WHERE is_supplementaire;
CREATE INDEX ix_tache_retard ON tache (date_fin_prevue)
  WHERE date_fin IS NULL AND supprime_le IS NULL;
