-- Checklist de tâche : sous-tâches + workflow de validation administrateur.

CREATE TYPE statut_checklist AS ENUM ('BROUILLON', 'SOUMISE', 'VALIDEE');

ALTER TABLE tache
  ADD COLUMN statut_checklist statut_checklist NOT NULL DEFAULT 'BROUILLON',
  ADD COLUMN date_soumission_checklist timestamptz(0),
  ADD COLUMN date_validation_checklist timestamptz(0),
  ADD COLUMN valide_par_checklist_id uuid,
  ADD COLUMN motif_renvoi_checklist text;

ALTER TABLE tache
  ADD CONSTRAINT fk_tache_checklist_valide_par
  FOREIGN KEY (valide_par_checklist_id) REFERENCES utilisateur(id)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Les tâches existantes n'ont pas de checklist : leur comportement est inchangé.
UPDATE tache SET statut_checklist = 'VALIDEE';

CREATE TABLE sous_tache (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tache_id      uuid NOT NULL,
  libelle       text NOT NULL,
  ordre         smallint NOT NULL DEFAULT 0,
  cochee        boolean NOT NULL DEFAULT false,
  date_cochee   timestamptz(0),
  cochee_par_id uuid,
  cree_par_id   uuid NOT NULL,
  created_at    timestamptz(0) NOT NULL DEFAULT now(),
  CONSTRAINT ck_sous_tache_libelle CHECK (char_length(btrim(libelle)) BETWEEN 3 AND 200),
  CONSTRAINT ck_sous_tache_ordre CHECK (ordre >= 0)
);

CREATE INDEX ix_sous_tache_tache ON sous_tache(tache_id, ordre);

ALTER TABLE sous_tache
  ADD CONSTRAINT fk_sous_tache_tache
  FOREIGN KEY (tache_id) REFERENCES tache(id)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE sous_tache
  ADD CONSTRAINT fk_sous_tache_cochee_par
  FOREIGN KEY (cochee_par_id) REFERENCES utilisateur(id)
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE sous_tache
  ADD CONSTRAINT fk_sous_tache_cree_par
  FOREIGN KEY (cree_par_id) REFERENCES utilisateur(id)
  ON DELETE RESTRICT ON UPDATE CASCADE;
