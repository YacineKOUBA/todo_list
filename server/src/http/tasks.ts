/**
 * Tâches — lecture, création, modification, statut, progression, clôture,
 * commentaires, duplication, suppression logique et historique.
 *
 * Sources : `docs/07` §6 et §8.2 à §8.9, `docs/09` §5, RM-01 → RM-11.
 *
 * Le statut, la progression, la priorité, le rappel et les durées ne sont
 * jamais stockés : ils sont recalculés à chaque lecture par les moteurs purs.
 */

import { Router } from 'express'
import type { Prisma, RoleUtilisateur, StatutManuel, Tache } from '@prisma/client'
import { z } from 'zod'
import { calendarDateToUtcDate, compareCalendarDates, utcDateToCalendarDate } from '../lib/calendar-date'
import type { CalendarDate } from '../lib/calendar-date'
import { ApiError } from '../security/problem'
import {
  actionAPrendrePourPriorite,
  calculerPriorite,
  calculerRetard,
  normaliserImportance,
  normaliserUrgence,
} from '../domain/calculs'
import {
  estTachePropre,
  peutChangerStatutTache,
  peutCommenter,
  peutCreerPour,
  peutJustifierRetard,
  peutModifierTache,
  peutSupprimerTache,
  peutValiderRetard,
  peutVoirTache,
  type TachePourAutorisation,
} from './authorization'
import {
  appliquerDateDebutValidation,
  checklistBloquante,
  peutCocherChecklist,
  peutStructurerChecklist,
  peutSoumettreChecklist,
  peutValiderChecklist,
  type ContexteChecklist,
} from '../domain/checklist'
import { chargerCalendrier, echeanceQuotidienne, estJourOuvre } from './calendar'
import type { ContexteCalendrier } from './calendar'
import { ecrireAudit } from './audit'
import type { AppContext } from './context'
import {
  INCLUDE_TACHE,
  iso,
  toCommentaire,
  toTacheDetail,
  type CommentaireComplet,
  type TacheComplete,
} from './dto'
import { authOf, requireAuth } from './session'
import type { AuthSession } from './types'
import {
  lireUuid,
  parseBody,
  parseQuery,
  schemaBooleen,
  schemaDate,
  schemaPagination,
  schemaUuid,
  texteObligatoire,
} from './validation'

const VUES = [
  'mes-taches-du-jour',
  'mes-autres-taches',
  'mes-taches',
  'service',
  'supplementaires',
  'toutes',
] as const
type Vue = (typeof VUES)[number]

/** Champs de date utilisables par le filtre `date` (tableau de bord). */
const CHAMPS_DATE = ['TOUTES', 'dateAction', 'dateDebut', 'dateFinPrevue'] as const
type ChampDate = (typeof CHAMPS_DATE)[number]

const STATUTS = ['A_FAIRE', 'EN_COURS', 'RETARD', 'ACHEVEE', 'ANNULEE', 'SUSPENDUE'] as const
type StatutCode = (typeof STATUTS)[number]

const CHAMPS_TRIABLES = [
  'dateAction',
  'dateDebut',
  'dateFinPrevue',
  'dateFin',
  'libelle',
  'creeLe',
  'modifieLe',
  'score',
] as const
type ChampTri = (typeof CHAMPS_TRIABLES)[number]

const CHAMPS_CALCULES = [
  'statut',
  'progression',
  'dateRappel',
  'dureeGJours',
  'dureeEJours',
  'servicePorteur',
] as const

const schemaListe = z.strictObject({
  vue: z.enum(VUES).default('mes-taches'),
  statut: z.union([z.string(), z.array(z.string())]).optional(),
  typeTache: z.enum(['SIMPLE', 'RECURRENTE']).optional(),
  frequence: z
    .enum(['QUOTIDIENNE', 'HEBDOMADAIRE', 'MENSUELLE', 'TRIMESTRIELLE', 'ANNUELLE'])
    .optional(),
  departementId: schemaUuid.optional(),
  assigneAId: schemaUuid.optional(),
  piloteEmployeId: schemaUuid.optional(),
  pilotePartenaireId: schemaUuid.optional(),
  elementId: schemaUuid.optional(),
  urgenceId: schemaUuid.optional(),
  importanceId: schemaUuid.optional(),
  echeanceDu: schemaDate.optional(),
  echeanceAu: schemaDate.optional(),
  date: schemaDate.optional(),
  champDate: z.enum(CHAMPS_DATE).default('TOUTES'),
  rappelEchu: schemaBooleen.optional(),
  rappelImminent: schemaBooleen.optional(),
  libelle: z.string().max(255).optional(),
  supprimees: schemaBooleen.optional(),
  tri: z.union([z.string(), z.array(z.string())]).optional(),
  ...schemaPagination,
})

const FREQUENCES = ['QUOTIDIENNE', 'HEBDOMADAIRE', 'MENSUELLE', 'TRIMESTRIELLE', 'ANNUELLE'] as const

type TypeTacheCode = 'SIMPLE' | 'RECURRENTE'
type FrequenceCode = (typeof FREQUENCES)[number]

function estQuotidienne(typeTache: TypeTacheCode, frequence: FrequenceCode | null): boolean {
  return typeTache === 'RECURRENTE' && frequence === 'QUOTIDIENNE'
}

const schemaCreation = z.strictObject({
  typeTache: z.enum(['SIMPLE', 'RECURRENTE']).default('SIMPLE'),
  isSupplementaire: z.boolean().default(false),
  frequence: z.enum(FREQUENCES).nullable().optional(),
  dateFinRecurrence: schemaDate.nullable().optional(),
  libelle: texteObligatoire(255),
  elementId: schemaUuid,
  acteur: z.enum(['GD_TRADING', 'PARTENAIRE']),
  piloteEmployeId: schemaUuid.nullable().optional(),
  pilotePartenaireId: schemaUuid.nullable().optional(),
  assigneAEmployeId: schemaUuid.nullable().optional(),
  assigneAPartenaireId: schemaUuid.nullable().optional(),
  dateAction: schemaDate,
  dateDebut: schemaDate,
  dateFinPrevue: schemaDate.nullable().optional(),
  urgenceId: schemaUuid,
  importanceId: schemaUuid,
  commentaireInitial: z.string().max(2000).nullable().optional(),
})

const schemaModification = z.strictObject({
  libelle: texteObligatoire(255).optional(),
  typeTache: z.enum(['SIMPLE', 'RECURRENTE']).optional(),
  frequence: z.enum(FREQUENCES).nullable().optional(),
  dateFinRecurrence: schemaDate.nullable().optional(),
  elementId: schemaUuid.optional(),
  acteur: z.enum(['GD_TRADING', 'PARTENAIRE']).optional(),
  piloteEmployeId: schemaUuid.nullable().optional(),
  pilotePartenaireId: schemaUuid.nullable().optional(),
  assigneAEmployeId: schemaUuid.nullable().optional(),
  assigneAPartenaireId: schemaUuid.nullable().optional(),
  dateAction: schemaDate.optional(),
  dateDebut: schemaDate.optional(),
  dateFinPrevue: schemaDate.nullable().optional(),
  urgenceId: schemaUuid.optional(),
  importanceId: schemaUuid.optional(),
  version: z.number().int().min(1),
})

const schemaStatut = z.strictObject({
  statutManuel: z.enum(['ANNULEE', 'SUSPENDUE']).nullable(),
  motif: z.string().max(2000).nullable().optional(),
  version: z.number().int().min(1),
})

const schemaProgression = z.strictObject({
  progressionManuelle: z.number().int().min(0).max(100).nullable(),
  dateControle: schemaDate.nullable().optional(),
  version: z.number().int().min(1),
})

const schemaJustificationRetard = z.strictObject({
  motifRetard: texteObligatoire(2000),
  dateFinReelleEstimee: schemaDate.nullable().optional(),
  version: z.number().int().min(1),
})

const schemaValidationRetard = z.strictObject({
  dateFinReelleEstimee: schemaDate.nullable().optional(),
  sansMotif: z.boolean().optional(),
  version: z.number().int().min(1),
})

const schemaCloture = z.strictObject({
  dateFin: schemaDate,
  motifNonAchevement: z.string().max(2000).nullable().optional(),
  version: z.number().int().min(1),
})

const schemaCommentaire = z.strictObject({
  texte: texteObligatoire(2000),
})

const schemaDuplication = z.strictObject({
  dates: z.array(schemaDate).min(1).max(31),
  assigneAEmployeId: schemaUuid.optional(),
  assigneAPartenaireId: schemaUuid.optional(),
})

const schemaCommentairesListe = z.strictObject({ ...schemaPagination })

const schemaHistorique = z.strictObject({ ...schemaPagination })

const schemaSousTache = z.strictObject({
  libelle: z.string().trim().min(3, 'longueur minimale 3').max(200, 'longueur maximale 200'),
})

const schemaSousTacheOrdre = z.strictObject({
  ids: z.array(schemaUuid).min(1),
})

const schemaSousTacheCoche = z.strictObject({
  cochee: z.boolean(),
})

const schemaChecklistVersion = z.strictObject({
  version: z.number().int().positive(),
})

const schemaRenvoyerChecklist = z.strictObject({
  version: z.number().int().positive(),
  motif: z.string().trim().min(3, 'longueur minimale 3').max(500, 'longueur maximale 500'),
})

function autoriserVue(auth: AuthSession, vue: Vue, departementId: string | undefined): void {
  const role = auth.utilisateur.role
  if (role === 'CONSULTANT' && vue !== 'toutes') {
    throw new ApiError(403, 'ACTION_NON_AUTORISEE', 'Cette vue n’est pas accessible à ce rôle.')
  }
  if (role === 'EMPLOYE' && vue !== 'mes-taches' && vue !== 'mes-taches-du-jour' && vue !== 'mes-autres-taches' && vue !== 'supplementaires') {
    throw new ApiError(403, 'ACTION_NON_AUTORISEE', 'Cette vue n’est pas accessible à ce rôle.')
  }
  if (role === 'RESPONSABLE' && vue === 'toutes') {
    throw new ApiError(403, 'ACTION_NON_AUTORISEE', 'Cette vue n’est pas accessible à ce rôle.')
  }
  if (vue === 'service' && role === 'RESPONSABLE' && auth.employe?.departementId == null) {
    throw new ApiError(403, 'ACTION_NON_AUTORISEE', 'Aucun département n’est rattaché à ce compte.')
  }
  if (vue === 'service' && role === 'ADMIN' && departementId === undefined) {
    throw new ApiError(400, 'REQUETE_INVALIDE', 'Le paramètre departementId est requis pour cette vue.')
  }
  if (vue.startsWith('mes-') && auth.employe === null) {
    throw new ApiError(403, 'ACTION_NON_AUTORISEE', 'Aucune fiche employé n’est rattachée à ce compte.')
  }
}

function perimetrePropre(auth: AuthSession): Prisma.TacheWhereInput {
  const conditions: Prisma.TacheWhereInput[] = [{ creeParId: auth.utilisateur.id }]
  if (auth.employe !== null) {
    conditions.push({ assigneAEmployeId: auth.employe.id })
    conditions.push({ piloteEmployeId: auth.employe.id })
  }
  return { OR: conditions }
}

function perimetreService(departementId: string): Prisma.TacheWhereInput {
  return {
    OR: [
      { assigneAEmploye: { is: { departementId } } },
      {
        AND: [
          {
            OR: [
              { assigneAEmploye: { is: null } },
              { assigneAEmploye: { is: { departementId: null } } },
            ],
          },
          { piloteEmploye: { is: { departementId } } },
        ],
      },
    ],
  }
}

function perimetreTableauDeBord(auth: AuthSession): Prisma.TacheWhereInput | null {
  const role = auth.utilisateur.role
  if (role === 'ADMIN' || role === 'CONSULTANT') return null
  if (role === 'RESPONSABLE') {
    const departementId = auth.utilisateur.serviceId ?? auth.employe?.departementId ?? null
    return departementId === null ? { id: { in: [] } } : perimetreService(departementId)
  }
  return perimetrePropre(auth)
}

function conditionDate(date: CalendarDate, champ: ChampDate): Prisma.TacheWhereInput {
  const jour = calendarDateToUtcDate(date)
  if (champ === 'dateAction') return { dateAction: jour }
  if (champ === 'dateDebut') return { dateDebut: jour }
  if (champ === 'dateFinPrevue') return { dateFinPrevue: jour }
  return {
    OR: [{ dateAction: jour }, { dateDebut: jour }, { dateFinPrevue: jour }],
  }
}

function construireWhereListe(
  auth: AuthSession,
  parametres: z.infer<typeof schemaListe>,
  calendrier: ContexteCalendrier,
): Prisma.TacheWhereInput {
  const conditions: Prisma.TacheWhereInput[] = []

  const inclureSupprimees =
    parametres.supprimees === true && auth.utilisateur.role === 'ADMIN'
  if (!inclureSupprimees) conditions.push({ supprimeLe: null })

  // Confidentialité des tâches supplémentaires : elles ne sont visibles que par
  // leur créateur, dans toutes les vues et pour tous les rôles (ADMIN et
  // CONSULTANT compris).
  conditions.push({
    OR: [{ isSupplementaire: false }, { creeParId: auth.utilisateur.id }],
  })

  if (parametres.typeTache !== undefined) conditions.push({ typeTache: parametres.typeTache })
  if (parametres.frequence !== undefined) conditions.push({ frequence: parametres.frequence })
  if (parametres.elementId !== undefined) conditions.push({ elementId: parametres.elementId })
  if (parametres.assigneAId !== undefined) {
    // Filtre générique : l'identifiant peut désigner un employé ou un partenaire.
    conditions.push({
      OR: [
        { assigneAEmployeId: parametres.assigneAId },
        { assigneAPartenaireId: parametres.assigneAId },
      ],
    })
  }
  if (parametres.piloteEmployeId !== undefined) {
    conditions.push({ piloteEmployeId: parametres.piloteEmployeId })
  }
  if (parametres.pilotePartenaireId !== undefined) {
    conditions.push({ pilotePartenaireId: parametres.pilotePartenaireId })
  }
  if (parametres.urgenceId !== undefined) conditions.push({ urgenceId: parametres.urgenceId })
  if (parametres.importanceId !== undefined) conditions.push({ importanceId: parametres.importanceId })

  // Filtre par date sur un champ précis, ou sur l'un des trois champs du tableau de bord.
  if (parametres.date !== undefined) {
    conditions.push(conditionDate(parametres.date, parametres.champDate))
  }

  switch (parametres.vue) {
    case 'toutes':
      break
    case 'service': {
      const departementId =
        auth.utilisateur.role === 'ADMIN'
          ? parametres.departementId
          : (auth.employe?.departementId ?? undefined)
      if (departementId === undefined) {
        throw new ApiError(400, 'REQUETE_INVALIDE', 'Le paramètre departementId est requis.')
      }
      conditions.push(perimetreService(departementId))
      break
    }
    case 'mes-taches-du-jour': {
      // Tableau de bord : périmètre de l'utilisateur (tout pour l'admin,
      // service pour le responsable, tâches propres pour l'employé) et
      // uniquement les tâches liées au jour même (action, début ou fin prévue).
      const perimetre = perimetreTableauDeBord(auth)
      if (perimetre !== null) conditions.push(perimetre)
      if (parametres.date === undefined) {
        conditions.push(conditionDate(calendrier.aujourdhui, parametres.champDate))
      }
      break
    }
    case 'mes-autres-taches':
      conditions.push({ nature: 'AUTRE' })
      if (auth.employe === null) {
        conditions.push({ id: { in: [] } })
      } else {
        conditions.push({ assigneAEmployeId: auth.employe.id })
      }
      break
    case 'mes-taches':
      conditions.push(perimetrePropre(auth))
      break
    case 'supplementaires':
      // Le filtre « créateur uniquement » est déjà appliqué globalement.
      conditions.push({ isSupplementaire: true })
      break
  }

  return conditions.length === 0 ? {} : { AND: conditions }
}

function normaliserStatuts(valeur: string | string[] | undefined): StatutCode[] | null {
  if (valeur === undefined) return null
  const bruts = Array.isArray(valeur) ? valeur : valeur.split(',')
  const codes = bruts.map((code) => code.trim()).filter((code) => code.length > 0)
  if (codes.length === 0) return null
  const resultat: StatutCode[] = []
  for (const code of codes) {
    if (!(STATUTS as readonly string[]).includes(code)) {
      throw new ApiError(400, 'REQUETE_INVALIDE', `Statut inconnu : ${code}.`)
    }
    resultat.push(code as StatutCode)
  }
  return resultat
}

interface TriDemande {
  champ: ChampTri
  sens: 'asc' | 'desc'
}

function normaliserTri(valeur: string | string[] | undefined): TriDemande[] {
  const defaut: TriDemande[] = [
    { champ: 'dateAction', sens: 'asc' },
    { champ: 'libelle', sens: 'asc' },
  ]
  if (valeur === undefined) return defaut

  const morceaux = (Array.isArray(valeur) ? valeur : [valeur])
    .flatMap((element) => element.split(','))
    .map((element) => element.trim())
    .filter((element) => element.length > 0)
  if (morceaux.length === 0) return defaut

  return morceaux.map((morceau) => {
    const [champBrut, sensBrut] = morceau.split(':')
    const champ = (champBrut ?? '').trim()
    if ((CHAMPS_CALCULES as readonly string[]).includes(champ)) {
      throw new ApiError(422, 'TRI_NON_SUPPORTE', `Le champ « ${champ} » n’est pas triable.`)
    }
    if (!(CHAMPS_TRIABLES as readonly string[]).includes(champ)) {
      throw new ApiError(422, 'TRI_NON_SUPPORTE', `Le champ de tri « ${champ} » est inconnu.`)
    }
    const sens = sensBrut === undefined ? 'asc' : sensBrut
    if (sens !== 'asc' && sens !== 'desc') {
      throw new ApiError(422, 'TRI_NON_SUPPORTE', 'Le sens de tri doit être « asc » ou « desc ».')
    }
    return { champ: champ as ChampTri, sens }
  })
}

function normaliserTexte(valeur: string): string {
  return valeur
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('fr-FR')
}

type LigneListe = ReturnType<typeof toTacheDetail>

function valeurTri(ligne: LigneListe, champ: ChampTri): string | number | null {
  switch (champ) {
    case 'score':
      return ligne.priorite.poids
    default:
      return ligne[champ]
  }
}

function comparerLignes(a: LigneListe, b: LigneListe, tris: TriDemande[]): number {
  for (const tri of tris) {
    const valeurA = valeurTri(a, tri.champ)
    const valeurB = valeurTri(b, tri.champ)
    if (valeurA === valeurB) continue
    if (valeurA === null) return 1
    if (valeurB === null) return -1
    const comparaison =
      typeof valeurA === 'number' && typeof valeurB === 'number'
        ? valeurA - valeurB
        : String(valeurA).localeCompare(String(valeurB), 'fr-FR')
    if (comparaison !== 0) return tri.sens === 'asc' ? comparaison : -comparaison
  }
  return 0
}

async function chargerTache(ctx: AppContext, id: string): Promise<TacheComplete> {
  const tache = await ctx.prisma.tache.findUnique({ where: { id }, include: INCLUDE_TACHE })
  if (tache === null) {
    throw new ApiError(404, 'RESSOURCE_INTROUVABLE', 'La tâche demandée est introuvable.')
  }
  return tache
}

function pourAutorisation(tache: TacheComplete): TachePourAutorisation {
  return {
    assigneAEmployeId: tache.assigneAEmployeId,
    piloteEmployeId: tache.piloteEmployeId,
    creeParId: tache.creeParId,
    creeParRole: tache.creePar.role,
    attribueParId: tache.attribueParId,
    assigneAEmploye:
      tache.assigneAEmploye === null
        ? null
        : { departementId: tache.assigneAEmploye.departementId },
    piloteEmploye:
      tache.piloteEmploye === null
        ? null
        : { departementId: tache.piloteEmploye.departementId },
    isSupplementaire: tache.isSupplementaire,
  }
}

/** Charge une tâche visible, sinon `404` (non-divulgation, §4.4). */
async function chargerTacheVisible(
  ctx: AppContext,
  auth: AuthSession,
  id: string,
): Promise<TacheComplete> {
  const tache = await chargerTache(ctx, id)
  if (tache.supprimeLe !== null || !peutVoirTache(auth, pourAutorisation(tache))) {
    throw new ApiError(404, 'RESSOURCE_INTROUVABLE', 'La tâche demandée est introuvable.')
  }
  return tache
}

async function chargerTacheModifiable(
  ctx: AppContext,
  auth: AuthSession,
  id: string,
): Promise<TacheComplete> {
  const tache = await chargerTacheVisible(ctx, auth, id)
  if (!peutModifierTache(auth, pourAutorisation(tache))) {
    throw new ApiError(403, 'ACTION_NON_AUTORISEE', 'Vous ne pouvez pas modifier cette tâche.')
  }
  return tache
}

/**
 * L'action à prendre n'est jamais saisie : elle découle de la priorité calculée
 * (P1/P2 → faire immédiatement, P3 → déléguer, P4 → planifier). Le référentiel
 * ne contient que ces trois libellés, on le résout donc par son libellé.
 */
async function resoudreActionAPrendreId(
  ctx: AppContext,
  urgenceLibelle: string,
  importanceLibelle: string,
): Promise<string> {
  const priorite = calculerPriorite(
    normaliserUrgence(urgenceLibelle),
    normaliserImportance(importanceLibelle),
  )
  const libelle = actionAPrendrePourPriorite(priorite.code)
  const action = await ctx.prisma.actionAPrendre.findFirst({
    where: { libelle: { equals: libelle, mode: 'insensitive' } },
    select: { id: true },
  })
  if (action === null) {
    throw new ApiError(
      500,
      'REFERENTIEL_INCOMPLET',
      `L’action à prendre « ${libelle} » est absente du référentiel.`,
    )
  }
  return action.id
}

async function chargerTacheStatutModifiable(
  ctx: AppContext,
  auth: AuthSession,
  id: string,
): Promise<TacheComplete> {
  const tache = await chargerTacheVisible(ctx, auth, id)
  if (!peutChangerStatutTache(auth, pourAutorisation(tache))) {
    throw new ApiError(403, 'ACTION_NON_AUTORISEE', 'Vous ne pouvez pas changer le statut de cette tâche.')
  }
  return tache
}

function verifierVersion(tache: Tache, version: number): void {
  if (tache.version !== version) {
    throw new ApiError(
      409,
      'VERSION_OBSOLETE',
      'La tâche a été modifiée entre-temps. Rechargez-la puis réessayez.',
    )
  }
}

interface DatesCoherence {
  dateAction: CalendarDate
  dateDebut: CalendarDate
  dateFinPrevue: CalendarDate | null
}

function verifierDates(dates: DatesCoherence, quotidienne: boolean): void {
  if (compareCalendarDates(dates.dateAction, dates.dateDebut) > 0) {
    throw new ApiError(
      422,
      'DATE_INCOHERENTE',
      'La date d’action doit être antérieure ou égale à la date de début.',
    )
  }

  if (quotidienne) {
    if (dates.dateFinPrevue !== null || dates.dateAction !== dates.dateDebut) {
      throw new ApiError(
        422,
        'NATURE_INVALIDE',
        'Une tâche récurrente quotidienne a une date unique et aucune date de fin prévue.',
      )
    }
    return
  }

  if (dates.dateFinPrevue === null) {
    throw new ApiError(422, 'NATURE_INVALIDE', 'Une tâche avec échéance exige une date de fin prévue.')
  }
  if (compareCalendarDates(dates.dateDebut, dates.dateFinPrevue) > 0) {
    throw new ApiError(
      422,
      'DATE_INCOHERENTE',
      'La date de début doit être antérieure ou égale à la date de fin prévue.',
    )
  }
}

interface RecurrenceCoherence {
  typeTache: 'SIMPLE' | 'RECURRENTE'
  frequence: (typeof FREQUENCES)[number] | null
  dateFinRecurrence: CalendarDate | null
  dateDebut: CalendarDate
}

function ajouterFrequence(date: CalendarDate, frequence: (typeof FREQUENCES)[number]): CalendarDate {
  const valeur = calendarDateToUtcDate(date)
  switch (frequence) {
    case 'QUOTIDIENNE':
      valeur.setUTCDate(valeur.getUTCDate() + 1)
      break
    case 'HEBDOMADAIRE':
      valeur.setUTCDate(valeur.getUTCDate() + 7)
      break
    case 'MENSUELLE':
      valeur.setUTCMonth(valeur.getUTCMonth() + 1)
      break
    case 'TRIMESTRIELLE':
      valeur.setUTCMonth(valeur.getUTCMonth() + 3)
      break
    case 'ANNUELLE':
      valeur.setUTCFullYear(valeur.getUTCFullYear() + 1)
      break
  }
  return valeur.toISOString().slice(0, 10)
}

function verifierRecurrence(recurrence: RecurrenceCoherence): void {
  if (recurrence.typeTache === 'SIMPLE') {
    if (recurrence.frequence !== null || recurrence.dateFinRecurrence !== null) {
      throw new ApiError(
        422,
        'RECURRENCE_INVALIDE',
        'Une tâche simple ne porte ni fréquence ni date de fin de récurrence.',
      )
    }
    return
  }
  if (recurrence.frequence === null || recurrence.dateFinRecurrence === null) {
    throw new ApiError(
      422,
      'RECURRENCE_INVALIDE',
      'Une tâche récurrente exige une fréquence et une date de fin de récurrence.',
    )
  }
  if (compareCalendarDates(recurrence.dateFinRecurrence, recurrence.dateDebut) < 0) {
    throw new ApiError(
      422,
      'DATE_INCOHERENTE',
      'La fin de récurrence doit être postérieure ou égale à la date de début.',
    )
  }
}

interface EmployeReference {
  id: string
  nom: string
  prenom: string
  departementId: string | null
  actif: boolean
  role: RoleUtilisateur | null
}

async function chargerEmployeReference(
  ctx: AppContext,
  id: string,
  champ = 'assigneAEmployeId',
): Promise<EmployeReference> {
  const employe = await ctx.prisma.employe.findUnique({
    where: { id },
    select: {
      id: true,
      nom: true,
      prenom: true,
      departementId: true,
      actif: true,
      utilisateur: { select: { role: true } },
    },
  })
  if (employe === null) {
    throw new ApiError(422, 'VALEUR_INVALIDE', 'Employé inconnu.', [
      { champ, code: 'VALEUR_NON_AUTORISEE', message: 'Employé inconnu.' },
    ])
  }
  return { ...employe, role: employe.utilisateur?.role ?? null }
}

interface PartenaireReference {
  id: string
  libelle: string
  actif: boolean
}

async function chargerPartenaireReference(
  ctx: AppContext,
  id: string,
  champ: string,
): Promise<PartenaireReference> {
  const partenaire = await ctx.prisma.partenaire.findUnique({
    where: { id },
    select: { id: true, libelle: true, actif: true },
  })
  if (partenaire === null) {
    throw new ApiError(422, 'VALEUR_INVALIDE', 'Partenaire inconnu.', [
      { champ, code: 'VALEUR_NON_AUTORISEE', message: 'Partenaire inconnu.' },
    ])
  }
  if (!partenaire.actif) {
    throw new ApiError(422, 'PARTENAIRE_INACTIF', 'Le partenaire désigné est inactif.', [
      { champ, code: 'PARTENAIRE_INACTIF', message: 'Partenaire inactif.' },
    ])
  }
  return partenaire
}

function verifierAffectation(
  auth: AuthSession,
  employe: EmployeReference,
  champ: string,
  supplementaire = false,
): void {
  if (!employe.actif) {
    throw new ApiError(
      422,
      'EMPLOYE_INACTIF',
      'L’employé désigné est inactif.',
      [{ champ, code: 'EMPLOYE_INACTIF', message: 'Employé inactif.' }],
    )
  }
  if (
    !peutCreerPour(auth, {
      employeId: employe.id,
      departementId: employe.departementId,
      role: employe.role,
      supplementaire,
    })
  ) {
    throw new ApiError(
      403,
      'ACTION_NON_AUTORISEE',
      'Vous ne pouvez pas affecter une tâche à cet employé.',
    )
  }
}

type ActeurTacheCode = 'GD_TRADING' | 'PARTENAIRE'

function verifierAssigneEtActeur(
  auth: AuthSession,
  acteur: ActeurTacheCode,
  assigneAEmployeId: string | null,
  assigneAPartenaireId: string | null,
): void {
  const employeFourni = assigneAEmployeId !== null
  const partenaireFourni = assigneAPartenaireId !== null

  if (employeFourni === partenaireFourni) {
    throw new ApiError(
      422,
      'ASSIGNE_INVALIDE',
      'Une tâche doit être assignée soit à un employé, soit à un partenaire.',
      [
        {
          champ: 'assigneAEmployeId',
          code: 'VALEUR_NON_AUTORISEE',
          message: 'Choisissez un seul assigné.',
        },
      ],
    )
  }

  if (acteur === 'GD_TRADING') {
    if (!employeFourni) {
      throw new ApiError(
        422,
        'ASSIGNE_INVALIDE',
        'Une tâche GD TRADING est obligatoirement assignée à un employé interne.',
        [
          {
            champ: 'assigneAEmployeId',
            code: 'VALEUR_NON_AUTORISEE',
            message: 'Un employé interne est requis.',
          },
        ],
      )
    }
    return
  }

  if (!partenaireFourni) {
    throw new ApiError(
      422,
      'ASSIGNE_INVALIDE',
      'Une tâche dont l’acteur est un partenaire est obligatoirement assignée à un partenaire.',
      [
        {
          champ: 'assigneAPartenaireId',
          code: 'VALEUR_NON_AUTORISEE',
          message: 'Un partenaire est requis.',
        },
      ],
    )
  }
  if (auth.utilisateur.role !== 'ADMIN') {
    throw new ApiError(
      403,
      'ACTION_NON_AUTORISEE',
      'Seul un administrateur peut créer ou modifier une tâche assignée à un partenaire.',
    )
  }
}

function verifierPiloteEtActeur(
  auth: AuthSession,
  acteur: ActeurTacheCode,
  piloteEmployeId: string | null,
  pilotePartenaireId: string | null,
): void {
  const employeFourni = piloteEmployeId !== null
  const partenaireFourni = pilotePartenaireId !== null

  if (employeFourni === partenaireFourni) {
    throw new ApiError(
      422,
      'PILOTE_INVALIDE',
      'Une tâche exige exactement un pilote.',
    )
  }

  if (acteur === 'GD_TRADING') {
    if (!employeFourni) {
      throw new ApiError(
        422,
        'PILOTE_INVALIDE',
        'Une tâche GD TRADING exige un pilote employé et interdit un pilote partenaire.',
      )
    }
    return
  }

  if (pilotePartenaireId !== null && auth.utilisateur.role !== 'ADMIN') {
    throw new ApiError(
      403,
      'ACTION_NON_AUTORISEE',
      'Seul un administrateur peut désigner un partenaire comme pilote.',
    )
  }
}

function instantaneTache(tache: Tache | TacheComplete): Record<string, unknown> {
  return {
    libelle: tache.libelle,
    nature: tache.nature,
    typeTache: tache.typeTache,
    isSupplementaire: tache.isSupplementaire,
    elementId: tache.elementId,
    acteur: tache.acteur,
    piloteEmployeId: tache.piloteEmployeId,
    pilotePartenaireId: tache.pilotePartenaireId,
    assigneAEmployeId: tache.assigneAEmployeId,
    assigneAPartenaireId: tache.assigneAPartenaireId,
    dateAction: tache.dateAction.toISOString().slice(0, 10),
    dateDebut: tache.dateDebut.toISOString().slice(0, 10),
    dateFinPrevue:
      tache.dateFinPrevue === null ? null : tache.dateFinPrevue.toISOString().slice(0, 10),
    urgenceId: tache.urgenceId,
    importanceId: tache.importanceId,
    actionAPrendreId: tache.actionAPrendreId,
  }
}

function retardDeTache(tache: TacheComplete, calendrier: ContexteCalendrier) {
  const echeance =
    tache.nature === 'QUOTIDIENNE'
      ? utcDateToCalendarDate(tache.dateAction)
      : tache.dateFinPrevue === null
        ? null
        : utcDateToCalendarDate(tache.dateFinPrevue)
  return calculerRetard({
    echeance,
    dateFin: tache.dateFin === null ? null : utcDateToCalendarDate(tache.dateFin),
    aujourdhui: calendrier.aujourdhui,
    isSupplementaire: tache.isSupplementaire,
    motifRetard: tache.motifRetard,
    retardValideLe: tache.retardValideLe,
  })
}

function estExecutantChecklist(auth: AuthSession, tache: TacheComplete): boolean {
  if (tache.isSupplementaire) return tache.creeParId === auth.utilisateur.id
  return tache.assigneAEmployeId !== null && auth.employe?.id === tache.assigneAEmployeId
}

function contexteChecklist(auth: AuthSession, tache: TacheComplete): ContexteChecklist {
  return {
    role: auth.utilisateur.role,
    estExecutant: estExecutantChecklist(auth, tache),
    estAdmin: auth.utilisateur.role === 'ADMIN',
    statut: tache.statutChecklist,
  }
}

function verifierChecklistDemarrable(tache: TacheComplete): void {
  if (checklistBloquante(tache.statutChecklist, tache.sousTaches.length)) {
    throw new ApiError(
      422,
      'CHECKLIST_NON_VALIDEE',
      'La checklist doit être validée avant de démarrer cette tâche.',
    )
  }
}

export function createTasksRouter(ctx: AppContext): Router {
  const routeur = Router()
  routeur.use(requireAuth)

  routeur.get('/', async (req, res) => {
    const auth = authOf(req)
    const parametres = parseQuery(schemaListe, req)
    autoriserVue(auth, parametres.vue, parametres.departementId)
    if (parametres.supprimees === true && auth.utilisateur.role !== 'ADMIN') {
      throw new ApiError(403, 'ACTION_NON_AUTORISEE', 'Seul un administrateur peut lister les supprimées.')
    }

    const calendrier = await chargerCalendrier(ctx)
    const statuts = normaliserStatuts(parametres.statut)
    const tris = normaliserTri(parametres.tri)

    const where = construireWhereListe(auth, parametres, calendrier)
    const taches = await ctx.prisma.tache.findMany({
      where,
      include: INCLUDE_TACHE,
      orderBy: [{ dateAction: 'asc' }, { libelle: 'asc' }],
    })

    let lignes = taches.map((tache) => toTacheDetail(tache, calendrier))

    if (statuts !== null) {
      lignes = lignes.filter((ligne) => statuts.includes(ligne.statut.code as StatutCode))
    }

    if (parametres.vue === 'mes-autres-taches') {
      lignes = lignes.filter(
        (ligne) => ligne.statut.code !== 'ACHEVEE' && ligne.statut.code !== 'ANNULEE',
      )
    }

    if (parametres.echeanceDu !== undefined) {
      lignes = lignes.filter((ligne) => {
        const echeance = ligne.nature === 'QUOTIDIENNE' ? ligne.dateAction : ligne.dateFinPrevue
        return echeance !== null && compareCalendarDates(echeance, parametres.echeanceDu!) >= 0
      })
    }
    if (parametres.echeanceAu !== undefined) {
      lignes = lignes.filter((ligne) => {
        const echeance = ligne.nature === 'QUOTIDIENNE' ? ligne.dateAction : ligne.dateFinPrevue
        return echeance !== null && compareCalendarDates(echeance, parametres.echeanceAu!) <= 0
      })
    }
    if (parametres.rappelEchu === true) lignes = lignes.filter((ligne) => ligne.rappelEchu)
    if (parametres.rappelImminent === true) {
      lignes = lignes.filter((ligne) => ligne.rappelImminent)
    }
    if (parametres.libelle !== undefined && parametres.libelle.trim().length > 0) {
      const recherche = normaliserTexte(parametres.libelle.trim())
      lignes = lignes.filter((ligne) => normaliserTexte(ligne.libelle).includes(recherche))
    }

    lignes.sort((a, b) => comparerLignes(a, b, tris))

    const total = lignes.length
    const debut = (parametres.page - 1) * parametres.taille
    const elements = lignes.slice(debut, debut + parametres.taille)

    res.status(200).json({
      elements,
      pagination: {
        page: parametres.page,
        taille: parametres.taille,
        total,
        nombrePages: total === 0 ? 0 : Math.ceil(total / parametres.taille),
      },
    })
  })

  routeur.get('/:id', async (req, res) => {
    const auth = authOf(req)
    const id = lireUuid(req.params['id'])
    const tache = await chargerTacheVisible(ctx, auth, id)
    const calendrier = await chargerCalendrier(ctx)
    res.status(200).json(toTacheDetail(tache, calendrier))
  })

  routeur.post('/', async (req, res) => {
    const auth = authOf(req)
    const corps = parseBody(schemaCreation, req)
    const calendrier = await chargerCalendrier(ctx)

    if (auth.utilisateur.role === 'CONSULTANT') {
      throw new ApiError(403, 'ACTION_NON_AUTORISEE', 'Un consultant ne crée jamais de tâche.')
    }

    if (corps.isSupplementaire) {
      if (corps.acteur !== 'GD_TRADING') {
        throw new ApiError(
          422,
          'PILOTE_INVALIDE',
          'Une tâche supplémentaire est interne à GD Trading.',
        )
      }
      if (auth.employe === null) {
        throw new ApiError(
          403,
          'ACTION_NON_AUTORISEE',
          'Une tâche supplémentaire ne peut être créée que pour soi-même.',
        )
      }
    }

    let assigneAEmployeId = corps.isSupplementaire
      ? auth.employe?.id ?? null
      : corps.assigneAEmployeId ?? null
    const assigneAPartenaireId = corps.isSupplementaire
      ? null
      : corps.assigneAPartenaireId ?? null
    verifierAssigneEtActeur(auth, corps.acteur, assigneAEmployeId, assigneAPartenaireId)

    if (assigneAEmployeId !== null) {
      const assigne = await chargerEmployeReference(ctx, assigneAEmployeId)
      verifierAffectation(auth, assigne, 'assigneAEmployeId', corps.isSupplementaire)
      if (corps.isSupplementaire && assigne.id !== auth.employe?.id) {
        throw new ApiError(
          403,
          'ACTION_NON_AUTORISEE',
          'Une tâche supplémentaire ne peut être créée que pour soi-même.',
        )
      }
      assigneAEmployeId = assigne.id
    } else if (assigneAPartenaireId !== null) {
      await chargerPartenaireReference(ctx, assigneAPartenaireId, 'assigneAPartenaireId')
    }

    let piloteEmployeId = corps.isSupplementaire
      ? auth.employe?.id ?? null
      : corps.piloteEmployeId ?? null
    const pilotePartenaireId = corps.pilotePartenaireId ?? null
    verifierPiloteEtActeur(auth, corps.acteur, piloteEmployeId, pilotePartenaireId)

    if (piloteEmployeId !== null) {
      const pilote = await chargerEmployeReference(ctx, piloteEmployeId, 'piloteEmployeId')
      verifierAffectation(auth, pilote, 'piloteEmployeId', corps.isSupplementaire)
      piloteEmployeId = pilote.id
    }

    if (pilotePartenaireId !== null) {
      await chargerPartenaireReference(ctx, pilotePartenaireId, 'pilotePartenaireId')
    }

    const element = await ctx.prisma.element.findUnique({ where: { id: corps.elementId } })
    if (element === null || !element.actif) {
      throw new ApiError(422, 'VALEUR_INVALIDE', 'Élément inconnu ou inactif.', [
        { champ: 'elementId', code: 'VALEUR_NON_AUTORISEE', message: 'Élément inconnu ou inactif.' },
      ])
    }

    const dateFinPrevue = corps.dateFinPrevue ?? null
    const typeTache = corps.typeTache
    const frequence = typeTache === 'RECURRENTE' ? corps.frequence ?? null : null
    const dateFinRecurrence = typeTache === 'RECURRENTE' ? corps.dateFinRecurrence ?? null : null
    const quotidienne = estQuotidienne(typeTache, frequence)
    const nature = quotidienne ? 'QUOTIDIENNE' : 'AUTRE'
    verifierDates(
      { dateAction: corps.dateAction, dateDebut: corps.dateDebut, dateFinPrevue },
      quotidienne,
    )
    verifierRecurrence({
      typeTache,
      frequence,
      dateFinRecurrence,
      dateDebut: corps.dateDebut,
    })

    if (quotidienne) {
      if (!estJourOuvre(corps.dateAction, calendrier.calendrier)) {
        throw new ApiError(
          422,
          'TACHE_QUOTIDIENNE_JOUR_NON_OUVRE',
          'La date choisie n’est pas un jour ouvré.',
        )
      }
      const limite = echeanceQuotidienne(corps.dateAction, calendrier)
      if (calendrier.maintenant.getTime() >= limite.getTime()) {
        throw new ApiError(
          422,
          'TACHE_QUOTIDIENNE_HORS_DELAI',
          'Une tâche récurrente quotidienne ne peut plus être créée après l’heure limite.',
        )
      }
    }

    const matrice = await ctx.prisma.matricePriorite.findUnique({
      where: {
        urgenceId_importanceId: {
          urgenceId: corps.urgenceId,
          importanceId: corps.importanceId,
        },
      },
      include: { urgence: true, importance: true },
    })
    if (matrice === null) {
      throw new ApiError(
        422,
        'COMBINAISON_PRIORITE_INVALIDE',
        'Cette combinaison d’urgence et d’importance n’existe pas dans la matrice.',
        [
          {
            champ: 'importanceId',
            code: 'VALEUR_NON_AUTORISEE',
            message: 'Combinaison absente de la matrice.',
          },
        ],
      )
    }

    const actionAPrendreId = await resoudreActionAPrendreId(
      ctx,
      matrice.urgence.libelle,
      matrice.importance.libelle,
    )

    const doublon = await ctx.prisma.tache.findFirst({
      where: { libelle: { equals: corps.libelle.trim(), mode: 'insensitive' }, supprimeLe: null },
      select: { id: true },
    })

    const tacheCreee = await ctx.prisma.$transaction(async (tx) => {
      const tache = await tx.tache.create({
        data: {
          nature,
          typeTache,
          isSupplementaire: corps.isSupplementaire,
          frequence,
          dateFinRecurrence:
            dateFinRecurrence === null ? null : calendarDateToUtcDate(dateFinRecurrence),
          libelle: corps.libelle.trim(),
          elementId: corps.elementId,
          acteur: corps.acteur,
          piloteEmployeId,
          pilotePartenaireId,
          assigneAEmployeId,
          assigneAPartenaireId,
          dateAction: calendarDateToUtcDate(corps.dateAction),
          dateDebut: calendarDateToUtcDate(corps.dateDebut),
          dateFinPrevue: dateFinPrevue === null ? null : calendarDateToUtcDate(dateFinPrevue),
          urgenceId: corps.urgenceId,
          importanceId: corps.importanceId,
          actionAPrendreId,
          creeParId: auth.utilisateur.id,
          attribueParId: auth.utilisateur.id,
          creeLe: calendrier.maintenant,
          modifieLe: calendrier.maintenant,
        },
      })

      await ecrireAudit(tx, {
        acteurId: auth.utilisateur.id,
        typeOperation: 'CREATION',
        entite: 'tache',
        entiteId: tache.id,
        donneesApres: instantaneTache(tache) as Prisma.InputJsonValue,
      })

      const commentaire = corps.commentaireInitial?.trim() ?? ''
      if (commentaire.length > 0) {
        const cree = await tx.commentaire.create({
          data: {
            tacheId: tache.id,
            auteurId: auth.utilisateur.id,
            texte: commentaire,
            creeLe: calendrier.maintenant,
          },
        })
        await ecrireAudit(tx, {
          acteurId: auth.utilisateur.id,
          typeOperation: 'COMMENTAIRE',
          entite: 'tache',
          entiteId: tache.id,
          donneesApres: { commentaireId: cree.id } as Prisma.InputJsonValue,
        })
      }

      return tache
    })

    const complete = await chargerTache(ctx, tacheCreee.id)
    const detail = toTacheDetail(complete, calendrier)

    res.status(201).location(`/api/v1/tasks/${detail.id}`)
    if (doublon === null) {
      res.json(detail)
    } else {
      res.json({
        donnees: detail,
        avertissements: [
          {
            code: 'LIBELLE_DEJA_UTILISE',
            message: 'Un libellé identique existe déjà sur une tâche active.',
          },
        ],
      })
    }
  })

  routeur.patch('/:id', async (req, res) => {
    const auth = authOf(req)
    const id = lireUuid(req.params['id'])
    const corps = parseBody(schemaModification, req)
    const tache = await chargerTacheModifiable(ctx, auth, id)
    verifierVersion(tache, corps.version)
    const calendrier = await chargerCalendrier(ctx)

    const acteur = corps.acteur ?? tache.acteur
    const changementActeur = acteur !== tache.acteur

    let assigneAEmployeId =
      corps.assigneAEmployeId !== undefined
        ? corps.assigneAEmployeId
        : changementActeur
          ? null
          : tache.assigneAEmployeId
    const assigneAPartenaireId =
      corps.assigneAPartenaireId !== undefined
        ? corps.assigneAPartenaireId
        : changementActeur
          ? null
          : tache.assigneAPartenaireId

    verifierAssigneEtActeur(auth, acteur, assigneAEmployeId, assigneAPartenaireId)

    if (assigneAEmployeId !== null && assigneAEmployeId !== tache.assigneAEmployeId) {
      const assigne = await chargerEmployeReference(ctx, assigneAEmployeId, 'assigneAEmployeId')
      verifierAffectation(auth, assigne, 'assigneAEmployeId')
      assigneAEmployeId = assigne.id
    }
    if (
      assigneAPartenaireId !== null &&
      assigneAPartenaireId !== tache.assigneAPartenaireId
    ) {
      await chargerPartenaireReference(ctx, assigneAPartenaireId, 'assigneAPartenaireId')
    }

    let piloteEmployeId =
      corps.piloteEmployeId === undefined
        ? changementActeur
          ? null
          : tache.piloteEmployeId
        : corps.piloteEmployeId
    const pilotePartenaireId =
      corps.pilotePartenaireId === undefined
        ? changementActeur
          ? null
          : tache.pilotePartenaireId
        : corps.pilotePartenaireId

    verifierPiloteEtActeur(auth, acteur, piloteEmployeId, pilotePartenaireId)

    if (piloteEmployeId !== null && piloteEmployeId !== tache.piloteEmployeId) {
      const pilote = await chargerEmployeReference(ctx, piloteEmployeId, 'piloteEmployeId')
      verifierAffectation(auth, pilote, 'piloteEmployeId')
      piloteEmployeId = pilote.id
    }
    if (pilotePartenaireId !== null && pilotePartenaireId !== tache.pilotePartenaireId) {
      await chargerPartenaireReference(ctx, pilotePartenaireId, 'pilotePartenaireId')
    }

    if (corps.elementId !== undefined) {
      const element = await ctx.prisma.element.findUnique({ where: { id: corps.elementId } })
      if (element === null || !element.actif) {
        throw new ApiError(422, 'VALEUR_INVALIDE', 'Élément inconnu ou inactif.', [
          { champ: 'elementId', code: 'VALEUR_NON_AUTORISEE', message: 'Élément inconnu ou inactif.' },
        ])
      }
    }

    const dateAction = corps.dateAction ?? tache.dateAction.toISOString().slice(0, 10)
    const dateDebut = corps.dateDebut ?? tache.dateDebut.toISOString().slice(0, 10)
    const dateFinPrevue =
      corps.dateFinPrevue === undefined
        ? tache.dateFinPrevue === null
          ? null
          : tache.dateFinPrevue.toISOString().slice(0, 10)
        : corps.dateFinPrevue

    const typeTache = corps.typeTache ?? tache.typeTache
    const frequence =
      typeTache === 'RECURRENTE'
        ? ((corps.frequence !== undefined ? corps.frequence : tache.frequence) ?? null)
        : null
    const dateFinRecurrence =
      typeTache === 'RECURRENTE'
        ? corps.dateFinRecurrence !== undefined
          ? corps.dateFinRecurrence
          : tache.dateFinRecurrence === null
            ? null
            : tache.dateFinRecurrence.toISOString().slice(0, 10)
        : null
    const quotidienne = estQuotidienne(typeTache, frequence)
    const nature = quotidienne ? 'QUOTIDIENNE' : 'AUTRE'

    verifierRecurrence({ typeTache, frequence, dateFinRecurrence, dateDebut })
    verifierDates({ dateAction, dateDebut, dateFinPrevue }, quotidienne)

    if (quotidienne && corps.dateAction !== undefined) {
      if (!estJourOuvre(dateAction, calendrier.calendrier)) {
        throw new ApiError(
          422,
          'TACHE_QUOTIDIENNE_JOUR_NON_OUVRE',
          'La date choisie n’est pas un jour ouvré.',
        )
      }
    }

    const urgenceId = corps.urgenceId ?? tache.urgenceId
    const importanceId = corps.importanceId ?? tache.importanceId
    let actionAPrendreId: string | undefined
    if (corps.urgenceId !== undefined || corps.importanceId !== undefined) {
      const matrice = await ctx.prisma.matricePriorite.findUnique({
        where: { urgenceId_importanceId: { urgenceId, importanceId } },
        include: { urgence: true, importance: true },
      })
      if (matrice === null) {
        throw new ApiError(
          422,
          'COMBINAISON_PRIORITE_INVALIDE',
          'Cette combinaison d’urgence et d’importance n’existe pas dans la matrice.',
          [
            {
              champ: 'importanceId',
              code: 'VALEUR_NON_AUTORISEE',
              message: 'Combinaison absente de la matrice.',
            },
          ],
        )
      }
      actionAPrendreId = await resoudreActionAPrendreId(
        ctx,
        matrice.urgence.libelle,
        matrice.importance.libelle,
      )
    }

    const avant = instantaneTache(tache)

    await ctx.prisma.$transaction(async (tx) => {
      await tx.tache.updateMany({
        where: { id, version: corps.version },
        data: {
          ...(corps.libelle === undefined ? {} : { libelle: corps.libelle.trim() }),
          nature,
          typeTache,
          frequence,
          dateFinRecurrence:
            dateFinRecurrence === null ? null : calendarDateToUtcDate(dateFinRecurrence),
          ...(corps.elementId === undefined ? {} : { elementId: corps.elementId }),
          ...(corps.acteur === undefined ? {} : { acteur: corps.acteur }),
          ...(corps.piloteEmployeId === undefined && !changementActeur
            ? {}
            : { piloteEmployeId }),
          ...(corps.pilotePartenaireId === undefined && !changementActeur
            ? {}
            : { pilotePartenaireId }),
          ...(corps.assigneAEmployeId === undefined &&
          corps.assigneAPartenaireId === undefined &&
          !changementActeur
            ? {}
            : { assigneAEmployeId, assigneAPartenaireId }),
          ...(corps.dateAction === undefined
            ? {}
            : { dateAction: calendarDateToUtcDate(corps.dateAction) }),
          ...(corps.dateDebut === undefined
            ? {}
            : { dateDebut: calendarDateToUtcDate(corps.dateDebut) }),
          ...(corps.dateFinPrevue === undefined
            ? {}
            : {
                dateFinPrevue:
                  corps.dateFinPrevue === null
                    ? null
                    : calendarDateToUtcDate(corps.dateFinPrevue),
              }),
          ...(corps.urgenceId === undefined ? {} : { urgenceId }),
          ...(corps.importanceId === undefined ? {} : { importanceId }),
          ...(actionAPrendreId === undefined ? {} : { actionAPrendreId }),
          modifieLe: calendrier.maintenant,
          version: { increment: 1 },
        },
      })

      const apresTache = await tx.tache.findUnique({ where: { id } })
      if (apresTache === null) {
        throw new ApiError(404, 'RESSOURCE_INTROUVABLE', 'La tâche demandée est introuvable.')
      }
      await ecrireAudit(tx, {
        acteurId: auth.utilisateur.id,
        typeOperation: 'MODIFICATION',
        entite: 'tache',
        entiteId: id,
        donneesAvant: avant as Prisma.InputJsonValue,
        donneesApres: instantaneTache(apresTache) as Prisma.InputJsonValue,
      })
      if (
        assigneAEmployeId !== tache.assigneAEmployeId ||
        assigneAPartenaireId !== tache.assigneAPartenaireId ||
        piloteEmployeId !== tache.piloteEmployeId ||
        pilotePartenaireId !== tache.pilotePartenaireId
      ) {
        await ecrireAudit(tx, {
          acteurId: auth.utilisateur.id,
          typeOperation: 'CHANGEMENT_TITULAIRE',
          entite: 'tache',
          entiteId: id,
          donneesAvant: {
            assigneAEmployeId: tache.assigneAEmployeId,
            assigneAPartenaireId: tache.assigneAPartenaireId,
            piloteEmployeId: tache.piloteEmployeId,
            pilotePartenaireId: tache.pilotePartenaireId,
          } as Prisma.InputJsonValue,
          donneesApres: {
            assigneAEmployeId,
            assigneAPartenaireId,
            piloteEmployeId,
            pilotePartenaireId,
          } as Prisma.InputJsonValue,
        })
      }
    })

    const complete = await chargerTache(ctx, id)
    res.status(200).json(toTacheDetail(complete, calendrier))
  })

  routeur.patch('/:id/status', async (req, res) => {
    const auth = authOf(req)
    const id = lireUuid(req.params['id'])
    const corps = parseBody(schemaStatut, req)
    const tache = await chargerTacheStatutModifiable(ctx, auth, id)
    verifierVersion(tache, corps.version)
    const calendrier = await chargerCalendrier(ctx)
    const avant = tache.statutManuel
    const motif = corps.motif?.trim() ?? ''
    const motifRequis =
      corps.statutManuel !== null &&
      auth.utilisateur.role === 'ADMIN' &&
      tache.creePar.role === 'RESPONSABLE'
    if (motifRequis && motif.length === 0) {
      throw new ApiError(
        422,
        'MOTIF_OBLIGATOIRE',
        'Un administrateur doit motiver la suspension ou l’annulation d’une tâche créée par un responsable.',
        [{ champ: 'motif', code: 'MOTIF_OBLIGATOIRE', message: 'Motif obligatoire.' }],
      )
    }

    await ctx.prisma.$transaction(async (tx) => {
      await tx.tache.updateMany({
        where: { id, version: corps.version },
        data: {
          statutManuel: corps.statutManuel as StatutManuel | null,
          motifSuspensionAnnulation: corps.statutManuel === null ? null : motif.length === 0 ? null : motif,
          dateMiseAJour: calendrier.maintenant,
          modifieLe: calendrier.maintenant,
          version: { increment: 1 },
        },
      })
      await ecrireAudit(tx, {
        acteurId: auth.utilisateur.id,
        typeOperation: 'CHANGEMENT_STATUT',
        entite: 'tache',
        entiteId: id,
        donneesAvant: {
          statutManuel: avant,
          motifSuspensionAnnulation: tache.motifSuspensionAnnulation,
        } as Prisma.InputJsonValue,
        donneesApres: {
          statutManuel: corps.statutManuel,
          motifSuspensionAnnulation: corps.statutManuel === null || motif.length === 0 ? null : motif,
        } as Prisma.InputJsonValue,
      })
    })

    const complete = await chargerTache(ctx, id)
    res.status(200).json(toTacheDetail(complete, calendrier))
  })

  routeur.patch('/:id/progress', async (req, res) => {
    const auth = authOf(req)
    const id = lireUuid(req.params['id'])
    const corps = parseBody(schemaProgression, req)
    const tache = await chargerTacheVisible(ctx, auth, id)
    verifierChecklistDemarrable(tache)
    if (
      tache.creeParId !== auth.utilisateur.id &&
      !peutModifierTache(auth, pourAutorisation(tache))
    ) {
      throw new ApiError(
        403,
        'ACTION_NON_AUTORISEE',
        'Vous ne pouvez pas modifier la progression de cette tâche.',
      )
    }
    verifierVersion(tache, corps.version)
    const calendrier = await chargerCalendrier(ctx)
    const avant = tache.progressionManuelle
    const avantDate =
      tache.dateControle === null ? null : utcDateToCalendarDate(tache.dateControle)
    const dateControle =
      corps.dateControle === undefined ? avantDate : corps.dateControle

    await ctx.prisma.$transaction(async (tx) => {
      await tx.tache.updateMany({
        where: { id, version: corps.version },
        data: {
          progressionManuelle: corps.progressionManuelle,
          progressionSurchargee: corps.progressionManuelle !== null,
          dateControle:
            dateControle === null ? null : calendarDateToUtcDate(dateControle),
          dateMiseAJour: calendrier.maintenant,
          modifieLe: calendrier.maintenant,
          version: { increment: 1 },
        },
      })
      await ecrireAudit(tx, {
        acteurId: auth.utilisateur.id,
        typeOperation: 'CHANGEMENT_PROGRESSION',
        entite: 'tache',
        entiteId: id,
        donneesAvant: {
          progressionManuelle: avant,
          dateControle: avantDate,
        } as Prisma.InputJsonValue,
        donneesApres: {
          progressionManuelle: corps.progressionManuelle,
          dateControle,
        } as Prisma.InputJsonValue,
      })
    })

    const complete = await chargerTache(ctx, id)
    res.status(200).json(toTacheDetail(complete, calendrier))
  })

  routeur.patch('/:id/retard', async (req, res) => {
    const auth = authOf(req)
    const id = lireUuid(req.params['id'])
    const corps = parseBody(schemaJustificationRetard, req)
    const tache = await chargerTacheVisible(ctx, auth, id)
    if (!peutJustifierRetard(auth, pourAutorisation(tache))) {
      throw new ApiError(403, 'ACTION_NON_AUTORISEE', 'Vous ne pouvez pas justifier ce retard.')
    }
    verifierVersion(tache, corps.version)
    if (tache.retardValideLe !== null) {
      throw new ApiError(
        409,
        'RETARD_DEJA_VALIDE',
        'Ce retard a déjà été validé : la justification n’est plus modifiable.',
      )
    }
    const calendrier = await chargerCalendrier(ctx)
    if (!retardDeTache(tache, calendrier).enRetard) {
      throw new ApiError(422, 'AUCUN_RETARD', 'Cette tâche n’est pas en retard.')
    }

    const dateFinReelleEstimee = corps.dateFinReelleEstimee ?? null
    if (dateFinReelleEstimee !== null && compareCalendarDates(dateFinReelleEstimee, tache.dateDebut.toISOString().slice(0, 10)) < 0) {
      throw new ApiError(
        422,
        'DATE_INCOHERENTE',
        'La date de fin estimée doit être postérieure ou égale à la date de début.',
      )
    }

    await ctx.prisma.$transaction(async (tx) => {
      await tx.tache.updateMany({
        where: { id, version: corps.version },
        data: {
          motifRetard: corps.motifRetard.trim(),
          dateFinReelleEstimee:
            dateFinReelleEstimee === null
              ? tache.dateFinReelleEstimee
              : calendarDateToUtcDate(dateFinReelleEstimee),
          dateMiseAJour: calendrier.maintenant,
          modifieLe: calendrier.maintenant,
          version: { increment: 1 },
        },
      })
      await ecrireAudit(tx, {
        acteurId: auth.utilisateur.id,
        typeOperation: 'JUSTIFICATION_RETARD',
        entite: 'tache',
        entiteId: id,
        donneesAvant: {
          motifRetard: tache.motifRetard,
          dateFinReelleEstimee:
            tache.dateFinReelleEstimee === null
              ? null
              : tache.dateFinReelleEstimee.toISOString().slice(0, 10),
        } as Prisma.InputJsonValue,
        donneesApres: {
          motifRetard: corps.motifRetard.trim(),
          dateFinReelleEstimee,
        } as Prisma.InputJsonValue,
      })
    })

    const complete = await chargerTache(ctx, id)
    res.status(200).json(toTacheDetail(complete, calendrier))
  })

  routeur.patch('/:id/retard/validation', async (req, res) => {
    const auth = authOf(req)
    const id = lireUuid(req.params['id'])
    const corps = parseBody(schemaValidationRetard, req)
    const tache = await chargerTacheVisible(ctx, auth, id)
    if (!peutValiderRetard(auth, pourAutorisation(tache))) {
      throw new ApiError(403, 'ACTION_NON_AUTORISEE', 'Vous ne pouvez pas valider ce retard.')
    }
    verifierVersion(tache, corps.version)
    if (tache.retardValideLe !== null) {
      throw new ApiError(409, 'RETARD_DEJA_VALIDE', 'Ce retard a déjà été validé.')
    }
    const calendrier = await chargerCalendrier(ctx)
    if (!retardDeTache(tache, calendrier).enRetard) {
      throw new ApiError(422, 'AUCUN_RETARD', 'Cette tâche n’est pas en retard.')
    }

    const motifPresent = tache.motifRetard !== null && tache.motifRetard.trim().length > 0
    const sansMotif = !motifPresent && corps.sansMotif === true
    if (!motifPresent && !sansMotif) {
      throw new ApiError(
        422,
        'MOTIF_RETARD_ABSENT',
        'Aucun motif de retard n’a été saisi. Confirmez explicitement la validation sans motif : la pénalité de 10 points sera conservée.',
        [
          {
            champ: 'sansMotif',
            code: 'MOTIF_RETARD_ABSENT',
            message: 'Motif absent : confirmation explicite requise.',
          },
        ],
      )
    }

    const dateFinReelleEstimee =
      corps.dateFinReelleEstimee === undefined
        ? tache.dateFinReelleEstimee === null
          ? null
          : utcDateToCalendarDate(tache.dateFinReelleEstimee)
        : corps.dateFinReelleEstimee
    if (dateFinReelleEstimee === null && !sansMotif) {
      throw new ApiError(
        422,
        'DATE_ESTIMEE_REQUISE',
        'La validation exige une date de fin estimée.',
        [
          {
            champ: 'dateFinReelleEstimee',
            code: 'DATE_ESTIMEE_REQUISE',
            message: 'Date de fin estimée requise.',
          },
        ],
      )
    }
    if (
      dateFinReelleEstimee !== null &&
      compareCalendarDates(dateFinReelleEstimee, tache.dateDebut.toISOString().slice(0, 10)) < 0
    ) {
      throw new ApiError(
        422,
        'DATE_INCOHERENTE',
        'La date de fin estimée doit être postérieure ou égale à la date de début.',
      )
    }

    await ctx.prisma.$transaction(async (tx) => {
      await tx.tache.updateMany({
        where: { id, version: corps.version },
        data: {
          retardValideParId: auth.utilisateur.id,
          retardValideLe: calendrier.maintenant,
          dateFinReelleEstimee:
            dateFinReelleEstimee === null
              ? tache.dateFinReelleEstimee
              : calendarDateToUtcDate(dateFinReelleEstimee),
          dateMiseAJour: calendrier.maintenant,
          modifieLe: calendrier.maintenant,
          version: { increment: 1 },
        },
      })
      await ecrireAudit(tx, {
        acteurId: auth.utilisateur.id,
        typeOperation: 'VALIDATION_RETARD',
        entite: 'tache',
        entiteId: id,
        donneesAvant: {
          motifRetard: tache.motifRetard,
          dateFinReelleEstimee:
            tache.dateFinReelleEstimee === null
              ? null
              : utcDateToCalendarDate(tache.dateFinReelleEstimee),
        } as Prisma.InputJsonValue,
        donneesApres: {
          retardValideParId: auth.utilisateur.id,
          sansMotif,
          motifRetard: tache.motifRetard,
          dateFinReelleEstimee,
        } as Prisma.InputJsonValue,
      })
    })

    const complete = await chargerTache(ctx, id)
    res.status(200).json(toTacheDetail(complete, calendrier))
  })

  routeur.post('/:id/close', async (req, res) => {
    const auth = authOf(req)
    const id = lireUuid(req.params['id'])
    const corps = parseBody(schemaCloture, req)
    const tache = await chargerTacheModifiable(ctx, auth, id)
    verifierChecklistDemarrable(tache)
    verifierVersion(tache, corps.version)
    const calendrier = await chargerCalendrier(ctx)

    if (tache.dateFin !== null) {
      throw new ApiError(409, 'TACHE_DEJA_CLOTUREE', 'Cette tâche est déjà clôturée.')
    }

    const dateDebut = tache.dateDebut.toISOString().slice(0, 10)
    if (compareCalendarDates(corps.dateFin, dateDebut) < 0) {
      throw new ApiError(
        422,
        'DATE_INCOHERENTE',
        'La date de fin doit être postérieure ou égale à la date de début.',
      )
    }

    const clotureLe = calendrier.maintenant
    let tardive = false
    if (tache.nature === 'AUTRE') {
      const dateFinPrevue =
        tache.dateFinPrevue === null ? null : tache.dateFinPrevue.toISOString().slice(0, 10)
      tardive = dateFinPrevue !== null && compareCalendarDates(corps.dateFin, dateFinPrevue) > 0
    } else {
      const dateAction = tache.dateAction.toISOString().slice(0, 10)
      const limite = echeanceQuotidienne(dateAction, calendrier)
      tardive =
        compareCalendarDates(corps.dateFin, dateAction) > 0 || clotureLe.getTime() > limite.getTime()
    }

    const motif = corps.motifNonAchevement?.trim() ?? ''
    if (tardive && !tache.isSupplementaire && tache.retardValideLe === null) {
      throw new ApiError(
        422,
        'RETARD_NON_VALIDE',
        'Le retard doit être justifié puis validé avant la clôture.',
        [{ champ: 'retard', code: 'RETARD_NON_VALIDE', message: 'Validation du retard requise.' }],
      )
    }
    if (tardive && motif.length === 0) {
      throw new ApiError(
        422,
        'MOTIF_OBLIGATOIRE',
        'Une clôture tardive exige un motif de non-achèvement.',
        [{ champ: 'motifNonAchevement', code: 'MOTIF_OBLIGATOIRE', message: 'Motif obligatoire.' }],
      )
    }

    const occurrence =
      tache.typeTache === 'RECURRENTE' && tache.frequence !== null
        ? (() => {
            const origineId = tache.tacheOrigineId ?? tache.id
            const dateAction = ajouterFrequence(
              utcDateToCalendarDate(tache.dateAction),
              tache.frequence,
            )
            const fin =
              tache.dateFinRecurrence === null
                ? null
                : utcDateToCalendarDate(tache.dateFinRecurrence)
            if (fin !== null && compareCalendarDates(dateAction, fin) > 0) return null
            return {
              origineId,
              dateAction,
              dateDebut: ajouterFrequence(
                utcDateToCalendarDate(tache.dateDebut),
                tache.frequence,
              ),
              dateFinPrevue:
                tache.dateFinPrevue === null
                  ? null
                  : ajouterFrequence(
                      utcDateToCalendarDate(tache.dateFinPrevue),
                      tache.frequence,
                    ),
            }
          })()
        : null

    const actionAPrendreId = await resoudreActionAPrendreId(
      ctx,
      tache.matrice.urgence.libelle,
      tache.matrice.importance.libelle,
    )

    await ctx.prisma.$transaction(async (tx) => {
      await tx.tache.updateMany({
        where: { id, version: corps.version },
        data: {
          dateFin: calendarDateToUtcDate(corps.dateFin),
          clotureLe,
          motifNonAchevement: motif.length === 0 ? null : motif,
          modifieLe: calendrier.maintenant,
          version: { increment: 1 },
        },
      })
      await ecrireAudit(tx, {
        acteurId: auth.utilisateur.id,
        typeOperation: 'CLOTURE',
        entite: 'tache',
        entiteId: id,
        donneesApres: {
          dateFin: corps.dateFin,
          clotureLe: iso(clotureLe),
          tardive,
        } as Prisma.InputJsonValue,
      })
      if (motif.length > 0) {
        await ecrireAudit(tx, {
          acteurId: auth.utilisateur.id,
          typeOperation: 'MOTIF',
          entite: 'tache',
          entiteId: id,
          donneesApres: { motifNonAchevement: motif } as Prisma.InputJsonValue,
        })
      }

      if (occurrence !== null) {
        const dateAction = calendarDateToUtcDate(occurrence.dateAction)
        const existante = await tx.tache.findFirst({
          where: {
            tacheOrigineId: occurrence.origineId,
            dateAction,
            supprimeLe: null,
          },
          select: { id: true },
        })
        if (existante === null) {
          const suivante = await tx.tache.create({
            data: {
              nature: tache.nature,
              typeTache: 'RECURRENTE',
              isSupplementaire: tache.isSupplementaire,
              frequence: tache.frequence,
              dateFinRecurrence: tache.dateFinRecurrence,
              tacheOrigineId: occurrence.origineId,
              libelle: tache.libelle,
              elementId: tache.elementId,
              acteur: tache.acteur,
              piloteEmployeId: tache.piloteEmployeId,
              pilotePartenaireId: tache.pilotePartenaireId,
              assigneAEmployeId: tache.assigneAEmployeId,
              assigneAPartenaireId: tache.assigneAPartenaireId,
              dateAction,
              dateDebut: calendarDateToUtcDate(occurrence.dateDebut),
              dateFinPrevue:
                occurrence.dateFinPrevue === null
                  ? null
                  : calendarDateToUtcDate(occurrence.dateFinPrevue),
              urgenceId: tache.urgenceId,
              importanceId: tache.importanceId,
              actionAPrendreId,
              creeParId: tache.creeParId,
              attribueParId: tache.attribueParId,
              statutChecklist: tache.statutChecklist,
              dateSoumissionChecklist: tache.dateSoumissionChecklist,
              dateValidationChecklist: tache.dateValidationChecklist,
              valideParChecklistId: tache.valideParChecklistId,
              creeLe: calendrier.maintenant,
              modifieLe: calendrier.maintenant,
            },
          })
          if (tache.statutChecklist === 'VALIDEE' && tache.sousTaches.length > 0) {
            await tx.sousTache.createMany({
              data: tache.sousTaches.map((sousTache) => ({
                tacheId: suivante.id,
                libelle: sousTache.libelle,
                ordre: sousTache.ordre,
                creeParId: sousTache.creeParId,
                creeLe: calendrier.maintenant,
              })),
            })
          }
          await ecrireAudit(tx, {
            acteurId: auth.utilisateur.id,
            typeOperation: 'CREATION',
            entite: 'tache',
            entiteId: suivante.id,
            donneesApres: {
              occurrenceDe: id,
              tacheOrigineId: occurrence.origineId,
              dateAction: occurrence.dateAction,
              frequence: tache.frequence,
            } as Prisma.InputJsonValue,
          })
        }
      }
    })

    const complete = await chargerTache(ctx, id)
    res.status(200).json(toTacheDetail(complete, calendrier))
  })

  routeur.post('/:id/checklist', async (req, res) => {
    const auth = authOf(req)
    const id = lireUuid(req.params['id'])
    const corps = parseBody(schemaSousTache, req)
    const tache = await chargerTacheVisible(ctx, auth, id)
    if (!peutStructurerChecklist(contexteChecklist(auth, tache))) {
      throw new ApiError(403, 'ACTION_NON_AUTORISEE', 'Vous ne pouvez pas modifier cette checklist.')
    }
    const calendrier = await chargerCalendrier(ctx)
    const ordre =
      tache.sousTaches.reduce((maximum, sousTache) => Math.max(maximum, sousTache.ordre), -1) + 1

    await ctx.prisma.$transaction(async (tx) => {
      const creee = await tx.sousTache.create({
        data: {
          tacheId: id,
          libelle: corps.libelle,
          ordre,
          creeParId: auth.utilisateur.id,
          creeLe: calendrier.maintenant,
        },
      })
      await ecrireAudit(tx, {
        acteurId: auth.utilisateur.id,
        typeOperation: 'CHECKLIST_AJOUT',
        entite: 'tache',
        entiteId: id,
        donneesApres: { sousTacheId: creee.id, libelle: corps.libelle, ordre } as Prisma.InputJsonValue,
      })
    })

    const complete = await chargerTache(ctx, id)
    res.status(201).json(toTacheDetail(complete, calendrier))
  })

  routeur.patch('/:id/checklist/:sousTacheId', async (req, res) => {
    const auth = authOf(req)
    const id = lireUuid(req.params['id'])
    const sousTacheId = lireUuid(req.params['sousTacheId'])
    const corps = parseBody(schemaSousTache, req)
    const tache = await chargerTacheVisible(ctx, auth, id)
    if (!peutStructurerChecklist(contexteChecklist(auth, tache))) {
      throw new ApiError(403, 'ACTION_NON_AUTORISEE', 'Vous ne pouvez pas modifier cette checklist.')
    }
    const existante = tache.sousTaches.find((sousTache) => sousTache.id === sousTacheId)
    if (existante === undefined) {
      throw new ApiError(404, 'RESSOURCE_INTROUVABLE', 'La sous-tâche demandée est introuvable.')
    }
    const calendrier = await chargerCalendrier(ctx)

    await ctx.prisma.$transaction(async (tx) => {
      await tx.sousTache.update({ where: { id: sousTacheId }, data: { libelle: corps.libelle } })
      await ecrireAudit(tx, {
        acteurId: auth.utilisateur.id,
        typeOperation: 'CHECKLIST_MODIFICATION',
        entite: 'tache',
        entiteId: id,
        donneesAvant: { sousTacheId, libelle: existante.libelle } as Prisma.InputJsonValue,
        donneesApres: { sousTacheId, libelle: corps.libelle } as Prisma.InputJsonValue,
      })
    })

    res.status(200).json(toTacheDetail(await chargerTache(ctx, id), calendrier))
  })

  routeur.delete('/:id/checklist/:sousTacheId', async (req, res) => {
    const auth = authOf(req)
    const id = lireUuid(req.params['id'])
    const sousTacheId = lireUuid(req.params['sousTacheId'])
    const tache = await chargerTacheVisible(ctx, auth, id)
    if (!peutStructurerChecklist(contexteChecklist(auth, tache))) {
      throw new ApiError(403, 'ACTION_NON_AUTORISEE', 'Vous ne pouvez pas modifier cette checklist.')
    }
    const existante = tache.sousTaches.find((sousTache) => sousTache.id === sousTacheId)
    if (existante === undefined) {
      throw new ApiError(404, 'RESSOURCE_INTROUVABLE', 'La sous-tâche demandée est introuvable.')
    }
    const calendrier = await chargerCalendrier(ctx)

    await ctx.prisma.$transaction(async (tx) => {
      await tx.sousTache.delete({ where: { id: sousTacheId } })
      await ecrireAudit(tx, {
        acteurId: auth.utilisateur.id,
        typeOperation: 'CHECKLIST_SUPPRESSION',
        entite: 'tache',
        entiteId: id,
        donneesAvant: { sousTacheId, libelle: existante.libelle } as Prisma.InputJsonValue,
      })
    })

    res.status(200).json(toTacheDetail(await chargerTache(ctx, id), calendrier))
  })

  routeur.put('/:id/checklist/ordre', async (req, res) => {
    const auth = authOf(req)
    const id = lireUuid(req.params['id'])
    const corps = parseBody(schemaSousTacheOrdre, req)
    const tache = await chargerTacheVisible(ctx, auth, id)
    if (!peutStructurerChecklist(contexteChecklist(auth, tache))) {
      throw new ApiError(403, 'ACTION_NON_AUTORISEE', 'Vous ne pouvez pas modifier cette checklist.')
    }
    const attendues = new Set(tache.sousTaches.map((sousTache) => sousTache.id))
    if (attendues.size !== corps.ids.length || corps.ids.some((valeur) => !attendues.has(valeur))) {
      throw new ApiError(422, 'ORDRE_INVALIDE', 'La liste des sous-tâches est incohérente.')
    }
    const calendrier = await chargerCalendrier(ctx)

    await ctx.prisma.$transaction(async (tx) => {
      for (const [index, sousTacheId] of corps.ids.entries()) {
        await tx.sousTache.update({ where: { id: sousTacheId }, data: { ordre: index } })
      }
      await ecrireAudit(tx, {
        acteurId: auth.utilisateur.id,
        typeOperation: 'CHECKLIST_ORDRE',
        entite: 'tache',
        entiteId: id,
        donneesApres: { ids: corps.ids } as Prisma.InputJsonValue,
      })
    })

    res.status(200).json(toTacheDetail(await chargerTache(ctx, id), calendrier))
  })

  routeur.patch('/:id/checklist/:sousTacheId/coche', async (req, res) => {
    const auth = authOf(req)
    const id = lireUuid(req.params['id'])
    const sousTacheId = lireUuid(req.params['sousTacheId'])
    const corps = parseBody(schemaSousTacheCoche, req)
    const tache = await chargerTacheVisible(ctx, auth, id)
    if (!peutCocherChecklist(contexteChecklist(auth, tache))) {
      throw new ApiError(
        tache.statutChecklist === 'VALIDEE' ? 403 : 422,
        tache.statutChecklist === 'VALIDEE' ? 'ACTION_NON_AUTORISEE' : 'CHECKLIST_NON_VALIDEE',
        tache.statutChecklist === 'VALIDEE'
          ? 'Vous ne pouvez pas cocher cette sous-tâche.'
          : 'La checklist doit être validée avant de cocher une sous-tâche.',
      )
    }
    const existante = tache.sousTaches.find((sousTache) => sousTache.id === sousTacheId)
    if (existante === undefined) {
      throw new ApiError(404, 'RESSOURCE_INTROUVABLE', 'La sous-tâche demandée est introuvable.')
    }
    const calendrier = await chargerCalendrier(ctx)

    await ctx.prisma.$transaction(async (tx) => {
      await tx.sousTache.update({
        where: { id: sousTacheId },
        data: {
          cochee: corps.cochee,
          dateCochee: corps.cochee ? calendrier.maintenant : null,
          cocheeParId: corps.cochee ? auth.utilisateur.id : null,
        },
      })
      await ecrireAudit(tx, {
        acteurId: auth.utilisateur.id,
        typeOperation: 'CHECKLIST_COCHE',
        entite: 'tache',
        entiteId: id,
        donneesAvant: { sousTacheId, cochee: existante.cochee } as Prisma.InputJsonValue,
        donneesApres: { sousTacheId, cochee: corps.cochee } as Prisma.InputJsonValue,
      })
    })

    res.status(200).json(toTacheDetail(await chargerTache(ctx, id), calendrier))
  })

  routeur.post('/:id/checklist/soumettre', async (req, res) => {
    const auth = authOf(req)
    const id = lireUuid(req.params['id'])
    const corps = parseBody(schemaChecklistVersion, req)
    const tache = await chargerTacheVisible(ctx, auth, id)
    if (!peutSoumettreChecklist(contexteChecklist(auth, tache))) {
      throw new ApiError(403, 'ACTION_NON_AUTORISEE', 'Vous ne pouvez pas soumettre cette checklist.')
    }
    verifierVersion(tache, corps.version)
    if (tache.sousTaches.length === 0) {
      throw new ApiError(422, 'CHECKLIST_VIDE', 'La checklist doit contenir au moins une sous-tâche.')
    }
    const calendrier = await chargerCalendrier(ctx)
    const automatique = auth.utilisateur.role === 'ADMIN' || tache.isSupplementaire
    const premiereValidation = appliquerDateDebutValidation(tache.dateValidationChecklist)
    const dateDebut = premiereValidation
      ? calendrier.aujourdhui
      : utcDateToCalendarDate(tache.dateDebut)

    await ctx.prisma.$transaction(async (tx) => {
      await tx.tache.updateMany({
        where: { id, version: corps.version },
        data: {
          statutChecklist: automatique ? 'VALIDEE' : 'SOUMISE',
          dateSoumissionChecklist: calendrier.maintenant,
          motifRenvoiChecklist: null,
          ...(automatique
            ? {
                dateValidationChecklist: calendrier.maintenant,
                valideParChecklistId: auth.utilisateur.id,
                ...(premiereValidation
                  ? { dateDebut: calendarDateToUtcDate(dateDebut), statut: 'EN_COURS' as const }
                  : {}),
              }
            : {}),
          modifieLe: calendrier.maintenant,
          version: { increment: 1 },
        },
      })
      await ecrireAudit(tx, {
        acteurId: auth.utilisateur.id,
        typeOperation: 'CHECKLIST_SOUMISSION',
        entite: 'tache',
        entiteId: id,
        donneesAvant: {
          statutChecklist: tache.statutChecklist,
          dateDebut: utcDateToCalendarDate(tache.dateDebut),
        } as Prisma.InputJsonValue,
        donneesApres: {
          statutChecklist: automatique ? 'VALIDEE' : 'SOUMISE',
          dateDebut,
          automatique,
        } as Prisma.InputJsonValue,
      })
    })

    res.status(200).json(toTacheDetail(await chargerTache(ctx, id), calendrier))
  })

  routeur.post('/:id/checklist/valider', async (req, res) => {
    const auth = authOf(req)
    const id = lireUuid(req.params['id'])
    const corps = parseBody(schemaChecklistVersion, req)
    const tache = await chargerTacheVisible(ctx, auth, id)
    if (!peutValiderChecklist(contexteChecklist(auth, tache))) {
      throw new ApiError(
        auth.utilisateur.role === 'ADMIN' ? 409 : 403,
        auth.utilisateur.role === 'ADMIN' ? 'CHECKLIST_NON_SOUMISE' : 'ACTION_NON_AUTORISEE',
        auth.utilisateur.role === 'ADMIN'
          ? 'Seule une checklist soumise peut être validée.'
          : 'Seul un administrateur valide une checklist.',
      )
    }
    verifierVersion(tache, corps.version)
    const calendrier = await chargerCalendrier(ctx)
    const premiereValidation = appliquerDateDebutValidation(tache.dateValidationChecklist)
    const dateDebut = premiereValidation
      ? calendrier.aujourdhui
      : utcDateToCalendarDate(tache.dateDebut)

    await ctx.prisma.$transaction(async (tx) => {
      await tx.tache.updateMany({
        where: { id, version: corps.version },
        data: {
          statutChecklist: 'VALIDEE',
          dateValidationChecklist: calendrier.maintenant,
          valideParChecklistId: auth.utilisateur.id,
          motifRenvoiChecklist: null,
          ...(premiereValidation
            ? { dateDebut: calendarDateToUtcDate(dateDebut), statut: 'EN_COURS' as const }
            : {}),
          modifieLe: calendrier.maintenant,
          version: { increment: 1 },
        },
      })
      await ecrireAudit(tx, {
        acteurId: auth.utilisateur.id,
        typeOperation: 'CHECKLIST_VALIDATION',
        entite: 'tache',
        entiteId: id,
        donneesAvant: {
          statutChecklist: tache.statutChecklist,
          dateDebut: utcDateToCalendarDate(tache.dateDebut),
        } as Prisma.InputJsonValue,
        donneesApres: { statutChecklist: 'VALIDEE', dateDebut } as Prisma.InputJsonValue,
      })
    })

    res.status(200).json(toTacheDetail(await chargerTache(ctx, id), calendrier))
  })

  routeur.post('/:id/checklist/renvoyer', async (req, res) => {
    const auth = authOf(req)
    const id = lireUuid(req.params['id'])
    const corps = parseBody(schemaRenvoyerChecklist, req)
    const tache = await chargerTacheVisible(ctx, auth, id)
    if (auth.utilisateur.role !== 'ADMIN' || tache.statutChecklist !== 'SOUMISE') {
      throw new ApiError(
        auth.utilisateur.role === 'ADMIN' ? 409 : 403,
        auth.utilisateur.role === 'ADMIN' ? 'CHECKLIST_NON_SOUMISE' : 'ACTION_NON_AUTORISEE',
        auth.utilisateur.role === 'ADMIN'
          ? 'Seule une checklist soumise peut être renvoyée.'
          : 'Seul un administrateur renvoie une checklist.',
      )
    }
    verifierVersion(tache, corps.version)
    const calendrier = await chargerCalendrier(ctx)

    await ctx.prisma.$transaction(async (tx) => {
      await tx.tache.updateMany({
        where: { id, version: corps.version },
        data: {
          statutChecklist: 'BROUILLON',
          dateSoumissionChecklist: null,
          motifRenvoiChecklist: corps.motif,
          modifieLe: calendrier.maintenant,
          version: { increment: 1 },
        },
      })
      await ecrireAudit(tx, {
        acteurId: auth.utilisateur.id,
        typeOperation: 'CHECKLIST_RENVOI',
        entite: 'tache',
        entiteId: id,
        donneesAvant: { statutChecklist: tache.statutChecklist } as Prisma.InputJsonValue,
        donneesApres: { statutChecklist: 'BROUILLON', motif: corps.motif } as Prisma.InputJsonValue,
      })
    })

    res.status(200).json(toTacheDetail(await chargerTache(ctx, id), calendrier))
  })

  routeur.get('/:id/comments', async (req, res) => {
    const auth = authOf(req)
    const id = lireUuid(req.params['id'])
    const parametres = parseQuery(schemaCommentairesListe, req)
    await chargerTacheVisible(ctx, auth, id)

    const total = await ctx.prisma.commentaire.count({ where: { tacheId: id } })
    const commentaires = await ctx.prisma.commentaire.findMany({
      where: { tacheId: id },
      include: { auteur: { include: { employe: true } } },
      orderBy: { creeLe: 'asc' },
      skip: (parametres.page - 1) * parametres.taille,
      take: parametres.taille,
    })

    res.status(200).json({
      elements: commentaires.map((commentaire) => toCommentaire(commentaire as CommentaireComplet)),
      pagination: {
        page: parametres.page,
        taille: parametres.taille,
        total,
        nombrePages: total === 0 ? 0 : Math.ceil(total / parametres.taille),
      },
    })
  })

  routeur.post('/:id/comments', async (req, res) => {
    const auth = authOf(req)
    const id = lireUuid(req.params['id'])
    const corps = parseBody(schemaCommentaire, req)
    const tache = await chargerTacheVisible(ctx, auth, id)
    if (!peutCommenter(auth, pourAutorisation(tache))) {
      throw new ApiError(403, 'ACTION_NON_AUTORISEE', 'Vous ne pouvez pas commenter cette tâche.')
    }
    const maintenant = ctx.clock.now()

    const commentaire = await ctx.prisma.$transaction(async (tx) => {
      const cree = await tx.commentaire.create({
        data: {
          tacheId: id,
          auteurId: auth.utilisateur.id,
          texte: corps.texte.trim(),
          creeLe: maintenant,
        },
        include: { auteur: { include: { employe: true } } },
      })
      await ecrireAudit(tx, {
        acteurId: auth.utilisateur.id,
        typeOperation: 'COMMENTAIRE',
        entite: 'tache',
        entiteId: id,
        donneesApres: { commentaireId: cree.id } as Prisma.InputJsonValue,
      })
      return cree
    })

    res
      .status(201)
      .location(`/api/v1/tasks/${id}/comments/${commentaire.id}`)
      .json(toCommentaire(commentaire as CommentaireComplet))
  })

  routeur.post('/:id/duplicate', async (req, res) => {
    const auth = authOf(req)
    const id = lireUuid(req.params['id'])
    const corps = parseBody(schemaDuplication, req)
    const source = await chargerTacheVisible(ctx, auth, id)
    const calendrier = await chargerCalendrier(ctx)

    if (auth.utilisateur.role === 'CONSULTANT') {
      throw new ApiError(403, 'ACTION_NON_AUTORISEE', 'Un consultant ne duplique jamais de tâche.')
    }

    let assigneAEmployeId =
      corps.assigneAEmployeId !== undefined
        ? corps.assigneAEmployeId
        : corps.assigneAPartenaireId === undefined
          ? source.assigneAEmployeId
          : null
    const assigneAPartenaireId =
      corps.assigneAPartenaireId !== undefined
        ? corps.assigneAPartenaireId
        : corps.assigneAEmployeId === undefined
          ? source.assigneAPartenaireId
          : null
    verifierAssigneEtActeur(auth, source.acteur, assigneAEmployeId, assigneAPartenaireId)

    if (assigneAEmployeId !== null) {
      const assigne = await chargerEmployeReference(ctx, assigneAEmployeId, 'assigneAEmployeId')
      verifierAffectation(auth, assigne, 'assigneAEmployeId')
      assigneAEmployeId = assigne.id
    } else if (assigneAPartenaireId !== null) {
      await chargerPartenaireReference(ctx, assigneAPartenaireId, 'assigneAPartenaireId')
    }

    const uniques = new Set(corps.dates)
    if (uniques.size !== corps.dates.length) {
      throw new ApiError(422, 'VALEUR_INVALIDE', 'La liste des dates contient un doublon.', [
        { champ: 'dates', code: 'DOUBLON', message: 'Dates en double.' },
      ])
    }

    const dureeSource =
      source.nature === 'AUTRE' &&
      source.dateFinPrevue !== null &&
      compareCalendarDates(
        source.dateDebut.toISOString().slice(0, 10),
        source.dateFinPrevue.toISOString().slice(0, 10),
      ) >= 0
        ? Math.round(
            (source.dateFinPrevue.getTime() - source.dateDebut.getTime()) / 86_400_000,
          )
        : 0

    const actionAPrendreId = await resoudreActionAPrendreId(
      ctx,
      source.matrice.urgence.libelle,
      source.matrice.importance.libelle,
    )

    const aCreer: Prisma.TacheCreateManyInput[] = []
    for (const date of corps.dates) {
      if (source.nature === 'QUOTIDIENNE') {
        if (!estJourOuvre(date, calendrier.calendrier)) {
          throw new ApiError(
            422,
            'TACHE_QUOTIDIENNE_JOUR_NON_OUVRE',
            `La date ${date} n’est pas un jour ouvré.`,
          )
        }
        if (calendrier.maintenant.getTime() >= echeanceQuotidienne(date, calendrier).getTime()) {
          throw new ApiError(
            422,
            'TACHE_QUOTIDIENNE_HORS_DELAI',
            'La duplication est impossible après l’heure limite.',
          )
        }
      }

      const dateFinPrevue =
        source.nature === 'AUTRE' && source.dateFinPrevue !== null
          ? calendarDateToUtcDate(
              new Date(calendarDateToUtcDate(date).getTime() + dureeSource * 86_400_000)
                .toISOString()
                .slice(0, 10),
            )
          : null

      aCreer.push({
        nature: source.nature,
        libelle: source.libelle,
        elementId: source.elementId,
        acteur: source.acteur,
        piloteEmployeId: source.piloteEmployeId,
        pilotePartenaireId: source.pilotePartenaireId,
        assigneAEmployeId,
        assigneAPartenaireId,
        dateAction: calendarDateToUtcDate(date),
        dateDebut: calendarDateToUtcDate(date),
        dateFinPrevue,
        urgenceId: source.urgenceId,
        importanceId: source.importanceId,
        actionAPrendreId,
        creeParId: auth.utilisateur.id,
        attribueParId: auth.utilisateur.id,
        creeLe: calendrier.maintenant,
        modifieLe: calendrier.maintenant,
      })
    }

    const creees = await ctx.prisma.$transaction(async (tx) => {
      const resultat: { id: string; dateAction: string }[] = []
      for (const donnees of aCreer) {
        const tache = await tx.tache.create({ data: donnees })
        resultat.push({
          id: tache.id,
          dateAction: tache.dateAction.toISOString().slice(0, 10),
        })
        await ecrireAudit(tx, {
          acteurId: auth.utilisateur.id,
          typeOperation: 'CREATION',
          entite: 'tache',
          entiteId: tache.id,
          donneesApres: {
            sourceId: source.id,
            libelle: tache.libelle,
            dateAction: tache.dateAction.toISOString().slice(0, 10),
          } as Prisma.InputJsonValue,
        })
      }
      return resultat
    })

    res.status(201).json({ donnees: { creees, nombre: creees.length } })
  })

  routeur.delete('/:id', async (req, res) => {
    const auth = authOf(req)
    const id = lireUuid(req.params['id'])
    const tache = await chargerTacheVisible(ctx, auth, id)

    if (!peutSupprimerTache(auth, pourAutorisation(tache))) {
      throw new ApiError(403, 'ACTION_NON_AUTORISEE', 'Vous ne pouvez pas supprimer cette tâche.')
    }

    const maintenant = ctx.clock.now()
    await ctx.prisma.$transaction(async (tx) => {
      await tx.tache.update({
        where: { id },
        data: {
          supprimeLe: maintenant,
          supprimeParId: auth.utilisateur.id,
          version: { increment: 1 },
          modifieLe: maintenant,
        },
      })
      await ecrireAudit(tx, {
        acteurId: auth.utilisateur.id,
        typeOperation: 'SUPPRESSION',
        entite: 'tache',
        entiteId: id,
        donneesAvant: { libelle: tache.libelle } as Prisma.InputJsonValue,
        donneesApres: { supprimeLe: iso(maintenant) } as Prisma.InputJsonValue,
      })
    })

    res.status(204).end()
  })

  routeur.get('/:id/history', async (req, res) => {
    const auth = authOf(req)
    const id = lireUuid(req.params['id'])
    const parametres = parseQuery(schemaHistorique, req)
    await chargerTacheVisible(ctx, auth, id)

    const where: Prisma.JournalAuditWhereInput = { entite: 'tache', entiteId: id }
    const total = await ctx.prisma.journalAudit.count({ where })
    const evenements = await ctx.prisma.journalAudit.findMany({
      where,
      include: { acteur: { include: { employe: true } } },
      orderBy: { horodatage: 'desc' },
      skip: (parametres.page - 1) * parametres.taille,
      take: parametres.taille,
    })

    res.status(200).json({
      elements: evenements.map((evenement) => {
        const avant =
          evenement.donneesAvant !== null && typeof evenement.donneesAvant === 'object'
            ? (evenement.donneesAvant as Record<string, unknown>)
            : {}
        const apres =
          evenement.donneesApres !== null && typeof evenement.donneesApres === 'object'
            ? (evenement.donneesApres as Record<string, unknown>)
            : {}
        const champs = new Set([...Object.keys(avant), ...Object.keys(apres)])
        return {
          id: Number(evenement.id),
          horodatage: iso(evenement.horodatage),
          typeOperation: evenement.typeOperation,
          acteur:
            evenement.acteur === null
              ? null
              : {
                  id: evenement.acteur.id,
                  nomComplet:
                    evenement.acteur.employe === null
                      ? evenement.acteur.identifiant
                      : `${evenement.acteur.employe.prenom} ${evenement.acteur.employe.nom}`,
                },
          champsModifies: [...champs],
        }
      }),
      pagination: {
        page: parametres.page,
        taille: parametres.taille,
        total,
        nombrePages: total === 0 ? 0 : Math.ceil(total / parametres.taille),
      },
    })
  })

  return routeur
}

/** Exporté pour les tests d'autorisation. */
export { estTachePropre }
