import type { Pool } from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createTestPool, hasTestDatabase, resetDatabase } from './helpers/db'

describe.skipIf(!hasTestDatabase())('base PostgreSQL de test', () => {
  let pool: Pool | undefined

  beforeAll(async () => {
    pool = createTestPool()
    await pool.query('SELECT 1')
  })

  afterAll(async () => {
    await pool?.end()
  })

  it('répond à une requête simple', async () => {
    const result = await pool!.query<{ un: number }>('SELECT 1 AS un')

    expect(result.rows[0]?.un).toBe(1)
  })

  it('se réinitialise sans erreur, même sans table applicative', async () => {
    await resetDatabase(pool!)
  })
})
