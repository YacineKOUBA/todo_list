-- Assignation polymorphe : une tâche peut être assignée à un employé interne
-- (acteur GD_TRADING) ou à un partenaire du référentiel (acteur PARTENAIRE).
--
-- Le pilote reste unique : employé pour une tâche GD_TRADING ; employé OU
-- partenaire pour une tâche PARTENAIRE.

-- 1. L'ancienne colonne devient la colonne « employé » et perd son NOT NULL.
ALTER TABLE "tache" RENAME COLUMN "assigne_a_id" TO "assigne_a_employe_id";
ALTER TABLE "tache" ALTER COLUMN "assigne_a_employe_id" DROP NOT NULL;

ALTER TABLE "tache" ADD COLUMN "assigne_a_partenaire_id" uuid;

-- 1 bis. Les anciennes contraintes imposent le type de l'acteur : elles doivent
--        être retirées AVANT la reprise des données, sinon l'échange des
--        titulaires d'une tâche PARTENAIRE viole `ck_tache_pilote`.
ALTER TABLE "tache" DROP CONSTRAINT "ck_tache_pilote";
ALTER TABLE "tache" DROP CONSTRAINT IF EXISTS "ck_tache_assigne";

-- 2. Reprise des tâches PARTENAIRE existantes : l'ancien employé assigné
--    devient le pilote employé, l'ancien partenaire pilote devient l'assigné.
--    (Les expressions SET utilisent toutes l'ancienne valeur de la ligne.)
UPDATE "tache"
SET "assigne_a_partenaire_id" = "pilote_partenaire_id",
    "assigne_a_employe_id"    = NULL,
    "pilote_partenaire_id"    = NULL,
    "pilote_employe_id"       = "assigne_a_employe_id"
WHERE "acteur" = 'PARTENAIRE';

-- 3. Clés étrangères et index.
ALTER TABLE "tache" RENAME CONSTRAINT "fk_tache_assigne" TO "fk_tache_assigne_employe";
ALTER TABLE "tache" ADD CONSTRAINT "fk_tache_assigne_partenaire"
  FOREIGN KEY ("assigne_a_partenaire_id")
  REFERENCES "partenaire" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER INDEX "ix_tache_assigne" RENAME TO "ix_tache_assigne_employe";
CREATE INDEX "ix_tache_assigne_partenaire" ON "tache" ("assigne_a_partenaire_id");
CREATE INDEX "ix_tache_pilote_partenaire" ON "tache" ("pilote_partenaire_id");

-- 4. Contraintes de cohérence acteur / assigné / pilote (recréées).
ALTER TABLE "tache" ADD CONSTRAINT "ck_tache_assigne" CHECK (
  (acteur = 'GD_TRADING'
    AND assigne_a_employe_id IS NOT NULL
    AND assigne_a_partenaire_id IS NULL)
  OR
  (acteur = 'PARTENAIRE'
    AND assigne_a_partenaire_id IS NOT NULL
    AND assigne_a_employe_id IS NULL)
);

ALTER TABLE "tache" ADD CONSTRAINT "ck_tache_pilote" CHECK (
  (acteur = 'GD_TRADING'
    AND pilote_employe_id IS NOT NULL
    AND pilote_partenaire_id IS NULL)
  OR
  (acteur = 'PARTENAIRE'
    AND ((pilote_employe_id IS NOT NULL) <> (pilote_partenaire_id IS NOT NULL)))
);
