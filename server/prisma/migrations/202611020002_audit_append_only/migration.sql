-- =============================================================================
-- 0002_audit_append_only — Protection du journal d'audit
--
-- Source : docs/06 §7.2 (AR-10, EF-76, EF-77) et docs/12_SECURITE.md §10.4.
-- Le journal est append-only : UPDATE et DELETE sont refusés par un déclencheur.
-- La révocation au niveau du rôle base est traitée à l'ÉTAPE 14 (T13-12).
--
-- TRUNCATE n'est volontairement pas bloqué : la base de test est réinitialisée
-- par `TRUNCATE` (server/src/tests/helpers/db.ts). En production, aucun compte
-- applicatif ne doit disposer du droit TRUNCATE (T13-12).
-- =============================================================================

CREATE OR REPLACE FUNCTION fn_journal_audit_append_only()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'journal_audit est append-only : operation % interdite', TG_OP
    USING ERRCODE = 'insufficient_privilege';
END;
$$;

DROP TRIGGER IF EXISTS trg_journal_audit_append_only ON journal_audit;

CREATE TRIGGER trg_journal_audit_append_only
BEFORE UPDATE OR DELETE ON journal_audit
FOR EACH ROW
EXECUTE FUNCTION fn_journal_audit_append_only();
