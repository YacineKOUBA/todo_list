/**
 * Seed de référence — 55 lignes, une seule transaction.
 *
 * Source : docs/10_REPRISE_DES_DONNEES.md §4 (contenu exact) et §7 (ordre,
 * idempotence, contrôles).
 *
 * Règles :
 *  - insérer uniquement ce qui manque (jamais d'UPDATE) ;
 *  - clés naturelles : `parametre.id = 1`, `lower(libelle)`, `jour`, couple
 *    `(urgence_id, importance_id)` ;
 *  - une seule transaction : tout réussit ou tout est annulé ;
 *  - contrôle 14 (compte administrateur) hors seed, voir `create-admin.ts`.
 *
 * Exécution : `npm run db:seed -w @gd-trading/server`
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const PARAMETRE = {
  id: 1,
  fuseau: 'Africa/Algiers',
  weekendJour1: 5,
  weekendJour2: 6,
  heureDebutJournee: new Date('1970-01-01T08:00:00.000Z'),
  pauseDebut: new Date('1970-01-01T12:00:00.000Z'),
  pauseFin: new Date('1970-01-01T13:00:00.000Z'),
  heureEcheanceQuotidienne: new Date('1970-01-01T16:30:00.000Z'),
} as const

const URGENCES = ['Immédiate', 'Courte échéance', 'Planifiable', 'Pas urgent'] as const

const IMPORTANCES = ['Critique', 'Elevée', 'Modérée', 'Faible'] as const

const MATRICE: ReadonlyArray<readonly [string, string, number, number]> = [
  ['Immédiate', 'Critique', 12, 1],
  ['Immédiate', 'Elevée', 11, 2],
  ['Immédiate', 'Modérée', 10, 4],
  ['Immédiate', 'Faible', 9, 5],
  ['Courte échéance', 'Critique', 8, 6],
  ['Courte échéance', 'Elevée', 7, 7],
  ['Courte échéance', 'Modérée', 6, 8],
  ['Courte échéance', 'Faible', 5, 10],
  ['Planifiable', 'Critique', 4, 15],
  ['Planifiable', 'Elevée', 3, 20],
  ['Planifiable', 'Modérée', 2, 25],
  ['Planifiable', 'Faible', 1, 30],
  ['Pas urgent', 'Faible', 0, 45],
]

const ACTIONS_A_PRENDRE = ['Faire immédiatement', 'Planifier', 'Déléguer si possible'] as const

const ELEMENTS = [
  'EQUIPE',
  'GOUVERNANCE',
  'PERFORMANCE',
  'PROCESS',
  'REPORTING',
  'RESSOURCES / OUTILS',
] as const

const FERIES_2026 = [
  '2026-01-01',
  '2026-01-12',
  '2026-03-20',
  '2026-03-21',
  '2026-03-22',
  '2026-05-01',
  '2026-05-27',
  '2026-05-28',
  '2026-05-29',
  '2026-06-16',
  '2026-06-25',
  '2026-07-02',
  '2026-07-05',
  '2026-08-26',
  '2026-11-01',
] as const

const DEPARTEMENTS = [
  'POLE SUPPORT & PERFORMANCE',
  'POLE DEVELOPPEMENT DES ACTIVITES',
  'COMPTABILITE',
  'M.Gx & LOGISTIQUE',
  'COORDINATION R&I',
  'FINANCES',
  'B.U.INGREDIENTS',
  'ACHATS INTERNATIONAUX',
  'TOP MANAGEMENT',
] as const

function dateSeule(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`)
}

async function seed(): Promise<void> {
  await prisma.$transaction(
    async (tx) => {
      // 1. Paramètres — insérer si absent, ne jamais écraser.
      const parametre = await tx.parametre.findUnique({ where: { id: 1 } })
      if (parametre === null) {
        await tx.parametre.create({ data: PARAMETRE })
      }

      // 2. Urgences (ordre = proposition d'affichage, docs/10 §4.2).
      for (const [index, libelle] of URGENCES.entries()) {
        const existante = await tx.urgence.findFirst({
          where: { libelle: { equals: libelle, mode: 'insensitive' } },
        })
        if (existante === null) {
          await tx.urgence.create({ data: { libelle, ordre: index + 1 } })
        }
      }

      // 3. Importances — « Elevée » sans accent, conformément à l'Excel.
      for (const [index, libelle] of IMPORTANCES.entries()) {
        const existante = await tx.importance.findFirst({
          where: { libelle: { equals: libelle, mode: 'insensitive' } },
        })
        if (existante === null) {
          await tx.importance.create({ data: { libelle, ordre: index + 1 } })
        }
      }

      // 4. Matrice (13 combinaisons, jamais 16).
      for (const [urgenceLibelle, importanceLibelle, score, frequenceJours] of MATRICE) {
        const urgence = await tx.urgence.findFirst({
          where: { libelle: { equals: urgenceLibelle, mode: 'insensitive' } },
        })
        const importance = await tx.importance.findFirst({
          where: { libelle: { equals: importanceLibelle, mode: 'insensitive' } },
        })
        if (urgence === null || importance === null) {
          throw new Error(
            `Matrice : référentiel introuvable (${urgenceLibelle} / ${importanceLibelle})`,
          )
        }
        const existante = await tx.matricePriorite.findUnique({
          where: {
            urgenceId_importanceId: {
              urgenceId: urgence.id,
              importanceId: importance.id,
            },
          },
        })
        if (existante === null) {
          await tx.matricePriorite.create({
            data: {
              urgenceId: urgence.id,
              importanceId: importance.id,
              score,
              frequenceJours,
            },
          })
        }
      }

      // 5. Actions à prendre.
      for (const [index, libelle] of ACTIONS_A_PRENDRE.entries()) {
        const existante = await tx.actionAPrendre.findFirst({
          where: { libelle: { equals: libelle, mode: 'insensitive' } },
        })
        if (existante === null) {
          await tx.actionAPrendre.create({ data: { libelle } })
        }
        void index
      }

      // 6. Éléments / piliers.
      for (const [index, libelle] of ELEMENTS.entries()) {
        const existant = await tx.element.findFirst({
          where: { libelle: { equals: libelle, mode: 'insensitive' } },
        })
        if (existant === null) {
          await tx.element.create({ data: { libelle, ordre: index + 1 } })
        }
      }

      // 7. Jours fériés 2026 — libellés NULL, aucune date 2027-2028.
      for (const iso of FERIES_2026) {
        const jour = dateSeule(iso)
        const existant = await tx.jourFerie.findUnique({ where: { jour } })
        if (existant === null) {
          await tx.jourFerie.create({ data: { jour, libelle: null } })
        }
      }

      // 8. Départements observés (9 sur les 11 de R5).
      for (const libelle of DEPARTEMENTS) {
        const existant = await tx.departement.findFirst({
          where: { libelle: { equals: libelle, mode: 'insensitive' } },
        })
        if (existant === null) {
          await tx.departement.create({ data: { libelle, actif: true } })
        }
      }
    },
    { timeout: 30_000 },
  )

  await controler()
}

type Controle = {
  libelle: string
  attendu: number
  obtenu: number
}

async function controler(): Promise<void> {
  const controles: Controle[] = [
    { libelle: 'parametre', attendu: 1, obtenu: await prisma.parametre.count() },
    { libelle: 'urgence', attendu: 4, obtenu: await prisma.urgence.count() },
    { libelle: 'importance', attendu: 4, obtenu: await prisma.importance.count() },
    { libelle: 'matrice_priorite', attendu: 13, obtenu: await prisma.matricePriorite.count() },
    { libelle: 'action_a_prendre', attendu: 3, obtenu: await prisma.actionAPrendre.count() },
    { libelle: 'element', attendu: 6, obtenu: await prisma.element.count() },
    { libelle: 'jour_ferie', attendu: 15, obtenu: await prisma.jourFerie.count() },
    { libelle: 'departement', attendu: 9, obtenu: await prisma.departement.count() },
    { libelle: 'tache', attendu: 0, obtenu: await prisma.tache.count() },
    { libelle: 'commentaire', attendu: 0, obtenu: await prisma.commentaire.count() },
    { libelle: 'partenaire', attendu: 0, obtenu: await prisma.partenaire.count() },
    { libelle: 'journal_audit', attendu: 0, obtenu: await prisma.journalAudit.count() },
    {
      libelle: 'matrice_combinaisons_absentes',
      attendu: 0,
      obtenu: await prisma.matricePriorite.count({
        where: {
          urgence: { libelle: { equals: 'Pas urgent', mode: 'insensitive' } },
          importance: {
            libelle: { in: ['Critique', 'Elevée', 'Modérée'], mode: 'insensitive' },
          },
        },
      }),
    },
  ]

  const enEchec = controles.filter((controle) => controle.obtenu !== controle.attendu)
  const lignes = controles.map(
    (controle) =>
      `  ${controle.obtenu === controle.attendu ? 'OK ' : 'ECHEC'} ` +
      `${controle.libelle.padEnd(30)} attendu=${controle.attendu} obtenu=${controle.obtenu}`,
  )

  console.log('Contrôles du seed (1 → 13) :')
  console.log(lignes.join('\n'))

  if (enEchec.length > 0) {
    throw new Error(
      `Seed non conforme : ${enEchec.map((c) => c.libelle).join(', ')}. ` +
        'Aucune donnée métier ne doit exister avant la mise en service (D11).',
    )
  }

  const totalReference =
    controles
      .filter((c) => !['tache', 'commentaire', 'partenaire', 'journal_audit'].includes(c.libelle))
      .reduce((somme, c) => somme + c.obtenu, 0) - controles[12]!.obtenu

  console.log(`\nSeed conforme : ${totalReference} lignes de référence.`)
}

seed()
  .then(async () => {
    await prisma.$disconnect()
    process.exitCode = 0
  })
  .catch(async (error: unknown) => {
    console.error('Seed en échec — transaction annulée.')
    console.error(error instanceof Error ? error.message : error)
    await prisma.$disconnect()
    process.exitCode = 1
  })
