import type { Pool } from 'pg'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createTestPool, hasTestDatabase, resetDatabase } from './helpers/db'

/**
 * Contraintes réellement portées par PostgreSQL — TC-SEC-051 et docs/06.
 *
 * Prisma ne sait pas exprimer CHECK, index fonctionnels/partiels ni
 * déclencheurs : ces règles vivent dans les migrations SQL et sont donc
 * vérifiées ici contre une vraie base, pas contre le schéma Prisma.
 */
interface Contexte {
  employeId: string
  utilisateurId: string
  elementId: string
  urgenceId: string
  importanceCritiqueId: string
  importanceFaibleId: string
  partenaireId: string
}

function premier<T>(resultat: { rows: T[] }): T {
  const ligne = resultat.rows[0]
  if (ligne === undefined) throw new Error('Aucune ligne retournée')
  return ligne
}

async function creerContexte(pool: Pool): Promise<Contexte> {
  const departement = premier(
    await pool.query<{ id: string }>(
      "INSERT INTO departement (libelle) VALUES ('LOGISTIQUE') RETURNING id",
    ),
  )
  const employe = premier(
    await pool.query<{ id: string }>(
      "INSERT INTO employe (nom, prenom, departement_id) VALUES ('Test', 'Utilisateur', $1) RETURNING id",
      [departement.id],
    ),
  )
  const utilisateur = premier(
    await pool.query<{ id: string }>(
      "INSERT INTO utilisateur (employe_id, identifiant, mot_de_passe_hash) VALUES ($1, 'test.user', 'hash-de-test') RETURNING id",
      [employe.id],
    ),
  )
  const element = premier(
    await pool.query<{ id: string }>(
      "INSERT INTO element (libelle) VALUES ('PROCESS') RETURNING id",
    ),
  )
  const urgence = premier(
    await pool.query<{ id: string }>(
      "INSERT INTO urgence (libelle) VALUES ('Immédiate') RETURNING id",
    ),
  )
  const critique = premier(
    await pool.query<{ id: string }>(
      "INSERT INTO importance (libelle) VALUES ('Critique') RETURNING id",
    ),
  )
  const faible = premier(
    await pool.query<{ id: string }>(
      "INSERT INTO importance (libelle) VALUES ('Faible') RETURNING id",
    ),
  )
  const partenaire = premier(
    await pool.query<{ id: string }>(
      "INSERT INTO partenaire (libelle) VALUES ('Partenaire test') RETURNING id",
    ),
  )

  // Seule la combinaison Immédiate × Critique existe dans la matrice.
  await pool.query(
    'INSERT INTO matrice_priorite (urgence_id, importance_id, score, frequence_jours) VALUES ($1, $2, 12, 1)',
    [urgence.id, critique.id],
  )

  return {
    employeId: employe.id,
    utilisateurId: utilisateur.id,
    elementId: element.id,
    urgenceId: urgence.id,
    importanceCritiqueId: critique.id,
    importanceFaibleId: faible.id,
    partenaireId: partenaire.id,
  }
}

interface TacheOverrides {
  nature?: 'QUOTIDIENNE' | 'AUTRE'
  acteur?: 'GD_TRADING' | 'PARTENAIRE'
  piloteEmployeId?: string | null
  pilotePartenaireId?: string | null
  assigneAEmployeId?: string | null
  assigneAPartenaireId?: string | null
  dateAction?: string
  dateDebut?: string
  dateFinPrevue?: string | null
  dateFin?: string | null
  clotureLe?: string | null
  importanceId?: string
  progressionManuelle?: number | null
  motifNonAchevement?: string | null
}

function insererTache(pool: Pool, contexte: Contexte, overrides: TacheOverrides = {}) {
  const valeurs = {
    nature: 'AUTRE',
    acteur: 'GD_TRADING',
    piloteEmployeId: contexte.employeId,
    pilotePartenaireId: null,
    assigneAEmployeId: contexte.employeId,
    assigneAPartenaireId: null,
    dateAction: '2026-11-02',
    dateDebut: '2026-11-02',
    dateFinPrevue: '2026-11-10',
    dateFin: null,
    clotureLe: null,
    importanceId: contexte.importanceCritiqueId,
    progressionManuelle: null,
    motifNonAchevement: null,
    ...overrides,
  }

  return pool.query(
    `INSERT INTO tache (
       nature, libelle, element_id, acteur, pilote_employe_id, pilote_partenaire_id,
       assigne_a_employe_id, assigne_a_partenaire_id,
       date_action, date_debut, date_fin_prevue, date_fin, cloture_le,
       urgence_id, importance_id, progression_manuelle, motif_non_achevement,
       cree_par_id, attribue_par_id
     ) VALUES (
       $1, 'Tâche de test', $2, $3, $4, $5,
       $6, $7, $8, $9, $10, $11, $12,
       $13, $14, $15, $16,
       $17, $17
     )`,
    [
      valeurs.nature,
      contexte.elementId,
      valeurs.acteur,
      valeurs.piloteEmployeId,
      valeurs.pilotePartenaireId,
      valeurs.assigneAEmployeId,
      valeurs.assigneAPartenaireId,
      valeurs.dateAction,
      valeurs.dateDebut,
      valeurs.dateFinPrevue,
      valeurs.dateFin,
      valeurs.clotureLe,
      contexte.urgenceId,
      valeurs.importanceId,
      valeurs.progressionManuelle,
      valeurs.motifNonAchevement,
      contexte.utilisateurId,
    ],
  )
}

describe.skipIf(!hasTestDatabase())('contraintes PostgreSQL', () => {
  let pool: Pool
  let contexte: Contexte

  beforeAll(async () => {
    pool = createTestPool()
    await pool.query('SELECT 1')
  })

  beforeEach(async () => {
    await resetDatabase(pool)
    contexte = await creerContexte(pool)
  })

  afterAll(async () => {
    await pool?.end()
  })

  it('TC-SEC-051 — le journal d’audit refuse UPDATE et DELETE', async () => {
    await pool.query("INSERT INTO journal_audit (type_operation, entite) VALUES ('TEST', 'test')")

    await expect(pool.query("UPDATE journal_audit SET entite = 'modifie'")).rejects.toMatchObject({
      code: '42501',
    })
    await expect(pool.query('DELETE FROM journal_audit')).rejects.toMatchObject({
      code: '42501',
    })
  })

  it('TC-DBK-001 — l’identifiant est unique sans tenir compte de la casse', async () => {
    await expect(
      pool.query(
        "INSERT INTO utilisateur (identifiant, mot_de_passe_hash) VALUES ('Test.User', 'hash')",
      ),
    ).rejects.toMatchObject({ code: '23505' })
  })

  it('TC-DBK-002 — un employé ne peut avoir qu’un compte', async () => {
    await expect(
      pool.query(
        "INSERT INTO utilisateur (employe_id, identifiant, mot_de_passe_hash) VALUES ($1, 'autre.user', 'hash')",
        [contexte.employeId],
      ),
    ).rejects.toMatchObject({ code: '23505' })
  })

  it('TC-DBK-003 — une combinaison absente de la matrice est refusée (D31)', async () => {
    await expect(
      insererTache(pool, contexte, { importanceId: contexte.importanceFaibleId }),
    ).rejects.toMatchObject({ code: '23503' })
  })

  it('TC-DBK-004 — la progression manuelle est bornée à 0-100', async () => {
    await expect(insererTache(pool, contexte, { progressionManuelle: 101 })).rejects.toMatchObject({
      code: '23514',
    })
    await expect(insererTache(pool, contexte, { progressionManuelle: -1 })).rejects.toMatchObject({
      code: '23514',
    })

    await expect(insererTache(pool, contexte, { progressionManuelle: 100 })).resolves.toBeDefined()
  })

  it('TC-DBK-005 — un seul pilote, du type de l’acteur (D6)', async () => {
    await expect(
      insererTache(pool, contexte, {
        acteur: 'GD_TRADING',
        piloteEmployeId: null,
        pilotePartenaireId: contexte.partenaireId,
      }),
    ).rejects.toMatchObject({ code: '23514' })
  })

  it('TC-DBK-015 — l’assigné est unique et du type de l’acteur (D6)', async () => {
    await expect(
      insererTache(pool, contexte, {
        acteur: 'GD_TRADING',
        assigneAEmployeId: null,
        assigneAPartenaireId: contexte.partenaireId,
      }),
    ).rejects.toMatchObject({ code: '23514' })

    await expect(
      insererTache(pool, contexte, {
        assigneAEmployeId: contexte.employeId,
        assigneAPartenaireId: contexte.partenaireId,
      }),
    ).rejects.toMatchObject({ code: '23514' })

    await expect(
      insererTache(pool, contexte, {
        acteur: 'PARTENAIRE',
        piloteEmployeId: contexte.employeId,
        pilotePartenaireId: null,
        assigneAEmployeId: contexte.employeId,
        assigneAPartenaireId: null,
      }),
    ).rejects.toMatchObject({ code: '23514' })

    await expect(
      insererTache(pool, contexte, {
        acteur: 'PARTENAIRE',
        piloteEmployeId: contexte.employeId,
        pilotePartenaireId: null,
        assigneAEmployeId: null,
        assigneAPartenaireId: contexte.partenaireId,
      }),
    ).resolves.toBeDefined()
  })

  it('TC-DBK-006 — une tâche quotidienne n’a pas d’échéance séparée (D28)', async () => {
    await expect(
      insererTache(pool, contexte, {
        nature: 'QUOTIDIENNE',
        dateFinPrevue: '2026-11-02',
      }),
    ).rejects.toMatchObject({ code: '23514' })
  })

  it('TC-DBK-007 — une tâche « autre » exige une échéance (D28)', async () => {
    await expect(
      insererTache(pool, contexte, { nature: 'AUTRE', dateFinPrevue: null }),
    ).rejects.toMatchObject({ code: '23514' })
  })

  it('TC-DBK-008 — l’ordre des dates est contrôlé (RM-15)', async () => {
    await expect(
      insererTache(pool, contexte, { dateAction: '2026-11-03', dateDebut: '2026-11-02' }),
    ).rejects.toMatchObject({ code: '23514' })
  })

  it('TC-DBK-009 — une clôture tardive exige un motif (D15)', async () => {
    await expect(
      insererTache(pool, contexte, {
        dateFin: '2026-11-20',
        clotureLe: '2026-11-20T10:00:00Z',
        motifNonAchevement: null,
      }),
    ).rejects.toMatchObject({ code: '23514' })
  })

  it('TC-DBK-010 — le paramètre est unique (singleton)', async () => {
    await expect(pool.query('INSERT INTO parametre (id) VALUES (2)')).rejects.toMatchObject({
      code: '23514',
    })
  })

  it('TC-DBK-011 — les deux jours de week-end doivent différer', async () => {
    await expect(
      pool.query('INSERT INTO parametre (id, weekend_jour_1, weekend_jour_2) VALUES (1, 5, 5)'),
    ).rejects.toMatchObject({ code: '23514' })
  })

  it('TC-DBK-012 — une session doit expirer après sa création', async () => {
    await expect(
      pool.query(
        "INSERT INTO session (utilisateur_id, jeton_hash, expire_le) VALUES ($1, 'hash-session', now() - interval '1 hour')",
        [contexte.utilisateurId],
      ),
    ).rejects.toMatchObject({ code: '23514' })
  })

  it('TC-DBK-013 — un jour férié est unique', async () => {
    await pool.query("INSERT INTO jour_ferie (jour) VALUES ('2026-01-01')")

    await expect(
      pool.query("INSERT INTO jour_ferie (jour) VALUES ('2026-01-01')"),
    ).rejects.toMatchObject({ code: '23505' })
  })

  it('TC-DBK-014 — un nom d’employé vide est refusé', async () => {
    await expect(
      pool.query("INSERT INTO employe (nom, prenom) VALUES ('   ', 'Test')"),
    ).rejects.toMatchObject({ code: '23514' })
  })
})
