-- Deux types principaux : SIMPLE et RECURRENTE.
-- « Quotidienne » devient une fréquence de RECURRENTE, jamais un type.
-- Aucune donnée n'est supprimée : `nature` reste la description technique
-- historique utilisée par les règles de dates et de retard.

-- 1. Anciennes tâches « quotidiennes » → récurrente quotidienne.
UPDATE tache
SET type_tache = 'RECURRENTE',
    frequence = 'QUOTIDIENNE'
WHERE nature = 'QUOTIDIENNE'
  AND (type_tache <> 'RECURRENTE' OR frequence IS DISTINCT FROM 'QUOTIDIENNE');

-- 2. Anciennes tâches « autres » → simples (les fréquences déjà portées par
--    une récurrence existante sont conservées).
UPDATE tache
SET type_tache = 'SIMPLE',
    frequence = NULL
WHERE nature = 'AUTRE'
  AND type_tache = 'RECURRENTE'
  AND frequence IS NULL;

-- 3. Une tâche supplémentaire peut être simple ou récurrente.
ALTER TABLE tache DROP CONSTRAINT IF EXISTS ck_tache_supplementaire;

-- 4. Une tâche simple ne porte jamais de fréquence.
UPDATE tache SET frequence = NULL WHERE type_tache = 'SIMPLE' AND frequence IS NOT NULL;

-- Rollback (manuel, sans perte de données) :
--   ALTER TABLE tache ADD CONSTRAINT ck_tache_supplementaire
--     CHECK (NOT is_supplementaire OR type_tache = 'SIMPLE') NOT VALID;
--   UPDATE tache SET type_tache = 'RECURRENTE', frequence = 'QUOTIDIENNE'
--     WHERE nature = 'QUOTIDIENNE';
--   UPDATE tache SET type_tache = 'SIMPLE', frequence = NULL WHERE nature = 'AUTRE';
