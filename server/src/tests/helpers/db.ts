import type { Pool } from 'pg'
import { Pool as PgPool } from 'pg'

/**
 * Accès à la base PostgreSQL de test.
 *
 * Aucun test ne doit utiliser la base de production ou la base de recette.
 * L'URL est lue dans `TEST_DATABASE_URL` (voir `.env.test.example`).
 */
export function testDatabaseUrl(): string | null {
  const url = process.env['TEST_DATABASE_URL']?.trim()
  return url !== undefined && url.length > 0 ? url : null
}

export function hasTestDatabase(): boolean {
  return testDatabaseUrl() !== null
}

export function createTestPool(): Pool {
  const connectionString = testDatabaseUrl()
  if (connectionString === null) {
    throw new Error(
      'TEST_DATABASE_URL absente : impossible de créer le pool de test. ' +
        'Copiez .env.test.example vers .env.test et renseignez la base dédiée.',
    )
  }
  return new PgPool({
    connectionString,
    max: 2,
    application_name: 'gd-trading-tests',
  })
}

/**
 * Vide toutes les tables du schéma `public` (sauf l'historique de migrations).
 *
 * La réinitialisation est faite par `TRUNCATE ... CASCADE` et non par une
 * transaction annulée : les tests d'intégration doivent pouvoir vérifier de
 * vraies transactions et de vrais rollbacks métier.
 */
export async function resetDatabase(pool: Pool): Promise<void> {
  await pool.query(`
    DO $$
    DECLARE
      table_name text;
    BEGIN
      FOR table_name IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename <> '_prisma_migrations'
      LOOP
        EXECUTE format('TRUNCATE TABLE public.%I RESTART IDENTITY CASCADE', table_name);
      END LOOP;
    END
    $$;
  `)
}

export async function withTestDatabase<T>(run: (pool: Pool) => Promise<T>): Promise<T> {
  const pool = createTestPool()
  try {
    return await run(pool)
  } finally {
    await pool.end()
  }
}
