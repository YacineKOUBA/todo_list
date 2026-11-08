/**
 * Référentiels en lecture — écrans de saisie et filtres.
 *
 * Périmètre de cette première livraison : lecture seule (docs/07 §8.10 à
 * §8.17). Les écritures référentiels et la gestion des comptes suivent avec le
 * reste des 54 endpoints.
 */

import { Router } from 'express'
import type { Prisma } from '@prisma/client'
import { z } from 'zod'
import { ApiError } from '../security/problem'
import type { AppContext } from './context'
import { chargerCalendrier } from './calendar'
import { ecrireAudit } from './audit'
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
  texteFacultatif,
  texteObligatoire,
} from './validation'

const schemaListeEmployes = z.strictObject({
  actif: schemaBooleen.optional(),
  departementId: schemaUuid.optional(),
  recherche: z.string().max(100).optional(),
  ...schemaPagination,
})

const schemaListePartenaires = z.strictObject({
  actif: schemaBooleen.optional(),
  recherche: z.string().max(100).optional(),
  ...schemaPagination,
})

const schemaListeFeries = z.strictObject({
  annee: z.coerce.number().int().min(2000).max(2100).optional(),
})

const schemaListeActions = z.strictObject({
  actif: schemaBooleen.optional(),
})

const schemaDepartement = z.strictObject({ libelle: texteObligatoire(100) })

const schemaElement = z.strictObject({
  libelle: texteObligatoire(100),
  ordre: z.number().int().min(0).max(9999).optional(),
})

const schemaPartenaire = z.strictObject({ libelle: texteObligatoire(100) })

const schemaFerie = z.strictObject({
  jour: schemaDate,
  libelle: texteFacultatif(150),
})

function exigerAdmin(auth: AuthSession): void {
  if (auth.utilisateur.role !== 'ADMIN') {
    throw new ApiError(
      403,
      'ACTION_NON_AUTORISEE',
      'Seul un administrateur gère les référentiels.',
    )
  }
}

function pagination(page: number, taille: number, total: number) {
  return {
    page,
    taille,
    total,
    nombrePages: total === 0 ? 0 : Math.ceil(total / taille),
  }
}

export function createReferentialsRouter(ctx: AppContext): Router {
  const routeur = Router()
  routeur.use(requireAuth)

  // --- Employés -----------------------------------------------------------

  routeur.get('/employees', async (req, res) => {
    const auth = authOf(req)
    const parametres = parseQuery(schemaListeEmployes, req)

    const where: Prisma.EmployeWhereInput = {}
    if (parametres.actif !== undefined) where.actif = parametres.actif
    if (parametres.departementId !== undefined) where.departementId = parametres.departementId
    const recherche = parametres.recherche?.trim()
    if (recherche !== undefined && recherche.length > 0) {
      where.OR = [
        { nom: { contains: recherche, mode: 'insensitive' } },
        { prenom: { contains: recherche, mode: 'insensitive' } },
      ]
    }

    const total = await ctx.prisma.employe.count({ where })
    const employes = await ctx.prisma.employe.findMany({
      where,
      include: { departement: true },
      orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
      skip: (parametres.page - 1) * parametres.taille,
      take: parametres.taille,
    })

    const estAdmin = auth.utilisateur.role === 'ADMIN'
    res.status(200).json({
      elements: employes.map((employe) => ({
        id: employe.id,
        nom: employe.nom,
        prenom: employe.prenom,
        nomComplet: `${employe.prenom} ${employe.nom}`,
        email: estAdmin ? employe.email : null,
        actif: employe.actif,
        departement:
          employe.departement === null
            ? null
            : { id: employe.departement.id, libelle: employe.departement.libelle },
      })),
      pagination: pagination(parametres.page, parametres.taille, total),
    })
  })

  routeur.get('/employees/:id', async (req, res) => {
    const auth = authOf(req)
    const id = lireUuid(req.params['id'])
    const employe = await ctx.prisma.employe.findUnique({
      where: { id },
      include: { departement: true },
    })
    if (employe === null) {
      throw new ApiError(404, 'RESSOURCE_INTROUVABLE', 'Employé introuvable.')
    }
    res.status(200).json({
      id: employe.id,
      nom: employe.nom,
      prenom: employe.prenom,
      nomComplet: `${employe.prenom} ${employe.nom}`,
      email: auth.utilisateur.role === 'ADMIN' ? employe.email : null,
      actif: employe.actif,
      departement:
        employe.departement === null
          ? null
          : { id: employe.departement.id, libelle: employe.departement.libelle },
    })
  })

  routeur.delete('/employees/:id', (_req, _res) => {
    throw new ApiError(405, 'METHODE_NON_AUTORISEE', 'Un employé n’est jamais supprimé.')
  })

  // --- Départements -------------------------------------------------------

  routeur.get('/departments', async (_req, res) => {
    const departements = await ctx.prisma.departement.findMany({
      orderBy: { libelle: 'asc' },
    })
    const responsables = await ctx.prisma.utilisateur.findMany({
      where: { role: 'RESPONSABLE', actif: true, employe: { isNot: null } },
      include: { employe: true },
    })

    res.status(200).json({
      elements: departements.map((departement) => {
        const responsable = responsables.find(
          (utilisateur) => utilisateur.employe?.departementId === departement.id,
        )
        return {
          id: departement.id,
          libelle: departement.libelle,
          actif: departement.actif,
          responsable:
            responsable?.employe === null || responsable?.employe === undefined
              ? null
              : {
                  id: responsable.id,
                  nomComplet: `${responsable.employe.prenom} ${responsable.employe.nom}`,
                },
        }
      }),
    })
  })

  routeur.post('/departments', async (req, res) => {
    const auth = authOf(req)
    exigerAdmin(auth)
    const corps = parseBody(schemaDepartement, req)
    const libelle = corps.libelle.trim()
    const existant = await ctx.prisma.departement.findFirst({ where: { libelle } })
    if (existant !== null) {
      throw new ApiError(409, 'RESSOURCE_DEJA_PRESENTE', 'Ce département existe déjà.')
    }
    const departement = await ctx.prisma.$transaction(async (tx) => {
      const cree = await tx.departement.create({ data: { libelle } })
      await ecrireAudit(tx, {
        acteurId: auth.utilisateur.id,
        typeOperation: 'CREATION',
        entite: 'departement',
        entiteId: cree.id,
        donneesApres: { libelle: cree.libelle } as Prisma.InputJsonValue,
      })
      return cree
    })
    res.status(201).json({
      id: departement.id,
      libelle: departement.libelle,
      actif: departement.actif,
      responsable: null,
    })
  })

  routeur.delete('/departments/:id', async (req, res) => {
    const auth = authOf(req)
    exigerAdmin(auth)
    const id = lireUuid(req.params['id'])
    const departement = await ctx.prisma.departement.findUnique({ where: { id } })
    if (departement === null) {
      throw new ApiError(404, 'RESSOURCE_INTROUVABLE', 'Département introuvable.')
    }
    const [employes, services] = await Promise.all([
      ctx.prisma.employe.count({ where: { departementId: id } }),
      ctx.prisma.utilisateur.count({ where: { serviceId: id } }),
    ])
    if (employes > 0 || services > 0) {
      throw new ApiError(
        409,
        'RESSOURCE_UTILISEE',
        'Ce département est rattaché à des employés ou des comptes : il ne peut pas être supprimé.',
      )
    }
    await ctx.prisma.$transaction(async (tx) => {
      await tx.departement.delete({ where: { id } })
      await ecrireAudit(tx, {
        acteurId: auth.utilisateur.id,
        typeOperation: 'SUPPRESSION',
        entite: 'departement',
        entiteId: id,
        donneesAvant: { libelle: departement.libelle } as Prisma.InputJsonValue,
      })
    })
    res.status(204).send()
  })

  // --- Partenaires --------------------------------------------------------

  routeur.post('/partners', async (req, res) => {
    const auth = authOf(req)
    exigerAdmin(auth)
    const corps = parseBody(schemaPartenaire, req)
    const libelle = corps.libelle.trim()
    const existant = await ctx.prisma.partenaire.findFirst({ where: { libelle } })
    if (existant !== null) {
      throw new ApiError(409, 'RESSOURCE_DEJA_PRESENTE', 'Ce partenaire existe déjà.')
    }
    const partenaire = await ctx.prisma.$transaction(async (tx) => {
      const cree = await tx.partenaire.create({ data: { libelle } })
      await ecrireAudit(tx, {
        acteurId: auth.utilisateur.id,
        typeOperation: 'CREATION',
        entite: 'partenaire',
        entiteId: cree.id,
        donneesApres: { libelle: cree.libelle } as Prisma.InputJsonValue,
      })
      return cree
    })
    res.status(201).json({ id: partenaire.id, libelle: partenaire.libelle, actif: partenaire.actif })
  })

  routeur.delete('/partners/:id', async (req, res) => {
    const auth = authOf(req)
    exigerAdmin(auth)
    const id = lireUuid(req.params['id'])
    const partenaire = await ctx.prisma.partenaire.findUnique({ where: { id } })
    if (partenaire === null) {
      throw new ApiError(404, 'RESSOURCE_INTROUVABLE', 'Partenaire introuvable.')
    }
    const references = await ctx.prisma.tache.count({
      where: { OR: [{ pilotePartenaireId: id }, { assigneAPartenaireId: id }] },
    })
    if (references > 0) {
      throw new ApiError(
        409,
        'RESSOURCE_UTILISEE',
        'Ce partenaire est référencé par des tâches : il ne peut pas être supprimé.',
      )
    }
    await ctx.prisma.$transaction(async (tx) => {
      await tx.partenaire.delete({ where: { id } })
      await ecrireAudit(tx, {
        acteurId: auth.utilisateur.id,
        typeOperation: 'SUPPRESSION',
        entite: 'partenaire',
        entiteId: id,
        donneesAvant: { libelle: partenaire.libelle } as Prisma.InputJsonValue,
      })
    })
    res.status(204).send()
  })

  routeur.get('/partners', async (req, res) => {
    const parametres = parseQuery(schemaListePartenaires, req)
    const where: Prisma.PartenaireWhereInput = {}
    if (parametres.actif !== undefined) where.actif = parametres.actif
    const recherche = parametres.recherche?.trim()
    if (recherche !== undefined && recherche.length > 0) {
      where.libelle = { contains: recherche, mode: 'insensitive' }
    }

    const total = await ctx.prisma.partenaire.count({ where })
    const partenaires = await ctx.prisma.partenaire.findMany({
      where,
      orderBy: { libelle: 'asc' },
      skip: (parametres.page - 1) * parametres.taille,
      take: parametres.taille,
    })

    res.status(200).json({
      elements: partenaires.map((partenaire) => ({
        id: partenaire.id,
        libelle: partenaire.libelle,
        actif: partenaire.actif,
      })),
      pagination: pagination(parametres.page, parametres.taille, total),
    })
  })

  // --- Éléments / piliers -------------------------------------------------

  routeur.post('/elements', async (req, res) => {
    const auth = authOf(req)
    exigerAdmin(auth)
    const corps = parseBody(schemaElement, req)
    const libelle = corps.libelle.trim()
    const existant = await ctx.prisma.element.findFirst({ where: { libelle } })
    if (existant !== null) {
      throw new ApiError(409, 'RESSOURCE_DEJA_PRESENTE', 'Cet élément existe déjà.')
    }
    const ordre = corps.ordre ?? (await ctx.prisma.element.count())
    const element = await ctx.prisma.$transaction(async (tx) => {
      const cree = await tx.element.create({ data: { libelle, ordre } })
      await ecrireAudit(tx, {
        acteurId: auth.utilisateur.id,
        typeOperation: 'CREATION',
        entite: 'element',
        entiteId: cree.id,
        donneesApres: { libelle: cree.libelle, ordre: cree.ordre } as Prisma.InputJsonValue,
      })
      return cree
    })
    res.status(201).json({
      id: element.id,
      libelle: element.libelle,
      ordre: element.ordre,
      actif: element.actif,
    })
  })

  routeur.delete('/elements/:id', async (req, res) => {
    const auth = authOf(req)
    exigerAdmin(auth)
    const id = lireUuid(req.params['id'])
    const element = await ctx.prisma.element.findUnique({ where: { id } })
    if (element === null) {
      throw new ApiError(404, 'RESSOURCE_INTROUVABLE', 'Élément introuvable.')
    }
    const references = await ctx.prisma.tache.count({ where: { elementId: id } })
    if (references > 0) {
      throw new ApiError(
        409,
        'RESSOURCE_UTILISEE',
        'Cet élément est référencé par des tâches : il ne peut pas être supprimé.',
      )
    }
    await ctx.prisma.$transaction(async (tx) => {
      await tx.element.delete({ where: { id } })
      await ecrireAudit(tx, {
        acteurId: auth.utilisateur.id,
        typeOperation: 'SUPPRESSION',
        entite: 'element',
        entiteId: id,
        donneesAvant: { libelle: element.libelle } as Prisma.InputJsonValue,
      })
    })
    res.status(204).send()
  })

  routeur.get('/elements', async (_req, res) => {
    const elements = await ctx.prisma.element.findMany({
      orderBy: [{ ordre: 'asc' }, { libelle: 'asc' }],
    })
    res.status(200).json({
      elements: elements.map((element) => ({
        id: element.id,
        libelle: element.libelle,
        ordre: element.ordre,
        actif: element.actif,
      })),
    })
  })

  // --- Priorités ----------------------------------------------------------

  routeur.get('/urgencies', async (_req, res) => {
    const urgences = await ctx.prisma.urgence.findMany({ orderBy: { ordre: 'asc' } })
    res.status(200).json({
      elements: urgences.map((urgence) => ({
        id: urgence.id,
        libelle: urgence.libelle,
        ordre: urgence.ordre,
      })),
    })
  })

  routeur.get('/importances', async (_req, res) => {
    const importances = await ctx.prisma.importance.findMany({ orderBy: { ordre: 'asc' } })
    res.status(200).json({
      elements: importances.map((importance) => ({
        id: importance.id,
        libelle: importance.libelle,
        ordre: importance.ordre,
      })),
    })
  })

  routeur.get('/priority-matrix', async (_req, res) => {
    const lignes = await ctx.prisma.matricePriorite.findMany({
      include: { urgence: true, importance: true },
      orderBy: [{ urgence: { ordre: 'asc' } }, { importance: { ordre: 'asc' } }],
    })
    res.status(200).json({
      elements: lignes.map((ligne) => ({
        urgence: { id: ligne.urgence.id, libelle: ligne.urgence.libelle },
        importance: { id: ligne.importance.id, libelle: ligne.importance.libelle },
        score: ligne.score,
        frequenceJours: ligne.frequenceJours,
        priorite: `${ligne.urgence.libelle} & ${ligne.importance.libelle}`,
      })),
    })
  })

  routeur.get('/actions-a-prendre', async (req, res) => {
    const parametres = parseQuery(schemaListeActions, req)
    const actions = await ctx.prisma.actionAPrendre.findMany({
      where: parametres.actif === undefined ? {} : { actif: parametres.actif },
      orderBy: { libelle: 'asc' },
    })
    res.status(200).json({
      elements: actions.map((action) => ({
        id: action.id,
        libelle: action.libelle,
        actif: action.actif,
      })),
    })
  })

  // --- Jours fériés -------------------------------------------------------

  routeur.get('/holidays', async (req, res) => {
    const parametres = parseQuery(schemaListeFeries, req)
    const where: Prisma.JourFerieWhereInput =
      parametres.annee === undefined
        ? {}
        : {
            jour: {
              gte: new Date(Date.UTC(parametres.annee, 0, 1)),
              lte: new Date(Date.UTC(parametres.annee, 11, 31)),
            },
          }
    const feries = await ctx.prisma.jourFerie.findMany({ where, orderBy: { jour: 'asc' } })
    res.status(200).json({
      elements: feries.map((ferie) => ({
        id: ferie.id,
        jour: ferie.jour.toISOString().slice(0, 10),
        libelle: ferie.libelle,
      })),
    })
  })

  routeur.post('/holidays', async (req, res) => {
    const auth = authOf(req)
    exigerAdmin(auth)
    const corps = parseBody(schemaFerie, req)
    const jour = new Date(`${corps.jour}T00:00:00.000Z`)
    const existant = await ctx.prisma.jourFerie.findUnique({ where: { jour } })
    if (existant !== null) {
      throw new ApiError(409, 'RESSOURCE_DEJA_PRESENTE', 'Ce jour férié existe déjà.')
    }
    const libelle = corps.libelle?.trim() ?? null
    const ferie = await ctx.prisma.$transaction(async (tx) => {
      const cree = await tx.jourFerie.create({
        data: { jour, libelle: libelle === '' ? null : libelle },
      })
      await ecrireAudit(tx, {
        acteurId: auth.utilisateur.id,
        typeOperation: 'CREATION',
        entite: 'jour_ferie',
        entiteId: cree.id,
        donneesApres: { jour: corps.jour, libelle: cree.libelle } as Prisma.InputJsonValue,
      })
      return cree
    })
    res.status(201).json({
      id: ferie.id,
      jour: ferie.jour.toISOString().slice(0, 10),
      libelle: ferie.libelle,
    })
  })

  routeur.delete('/holidays/:id', async (req, res) => {
    const auth = authOf(req)
    exigerAdmin(auth)
    const id = lireUuid(req.params['id'])
    const ferie = await ctx.prisma.jourFerie.findUnique({ where: { id } })
    if (ferie === null) {
      throw new ApiError(404, 'RESSOURCE_INTROUVABLE', 'Jour férié introuvable.')
    }
    const jour = ferie.jour.toISOString().slice(0, 10)
    await ctx.prisma.$transaction(async (tx) => {
      await tx.jourFerie.delete({ where: { id } })
      await ecrireAudit(tx, {
        acteurId: auth.utilisateur.id,
        typeOperation: 'SUPPRESSION',
        entite: 'jour_ferie',
        entiteId: id,
        donneesAvant: { jour, libelle: ferie.libelle } as Prisma.InputJsonValue,
      })
    })
    res.status(204).send()
  })

  // --- Paramètres ---------------------------------------------------------

  routeur.get('/settings', async (_req, res) => {
    const contexte = await chargerCalendrier(ctx)
    res.status(200).json({
      fuseau: contexte.parametres.fuseau,
      weekendJours: contexte.parametres.weekendJours,
      heureDebutJournee: contexte.parametres.heureDebutJournee,
      pauseDebut: contexte.parametres.pauseDebut,
      pauseFin: contexte.parametres.pauseFin,
      heureEcheanceQuotidienne: contexte.parametres.heureEcheanceQuotidienne,
      modifieLe: contexte.parametres.modifieLe.toISOString(),
    })
  })

  return routeur
}
