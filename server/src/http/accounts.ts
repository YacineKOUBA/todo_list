/**
 * Comptes et rôles — IHM-11 (docs/07 §8.11).
 *
 * Réservé à l'administrateur. Aucun compte n'est supprimé : la désactivation
 * révoque les sessions. Un compte peut être créé avec sa fiche employé dans la
 * même transaction, ce qui rend l'écran autonome.
 */

import { Router } from 'express'
import type { Prisma, RoleUtilisateur } from '@prisma/client'
import { z } from 'zod'
import { hashPassword } from '../security/argon2'
import { ApiError } from '../security/problem'
import { generateTemporaryPassword } from '../security/temporary-password'
import { ecrireAudit } from './audit'
import type { AppContext } from './context'
import { authOf, requireAuth } from './session'
import {
  lireUuid,
  parseBody,
  parseQuery,
  schemaBooleen,
  schemaPagination,
  schemaUuid,
  texteObligatoire,
} from './validation'

const ROLES = ['ADMIN', 'RESPONSABLE', 'EMPLOYE', 'CONSULTANT'] as const

const schemaListe = z.strictObject({
  actif: schemaBooleen.optional(),
  role: z.enum(ROLES).optional(),
  recherche: z.string().max(100).optional(),
  ...schemaPagination,
})

const schemaEmploye = z.strictObject({
  nom: texteObligatoire(100),
  prenom: texteObligatoire(100),
  email: z.email().max(254).nullable().optional(),
  departementId: schemaUuid.nullable().optional(),
})

const schemaCreation = z.strictObject({
  employeId: schemaUuid.nullable().optional(),
  employe: schemaEmploye.optional(),
  identifiant: z
    .string()
    .min(3)
    .max(64)
    .regex(/^\S+$/, 'identifiant sans espace'),
  role: z.enum(ROLES),
})

const schemaModification = z.strictObject({
  role: z.enum(ROLES).optional(),
  actif: z.boolean().optional(),
  employeId: schemaUuid.nullable().optional(),
})

function pagination(page: number, taille: number, total: number) {
  return { page, taille, total, nombrePages: total === 0 ? 0 : Math.ceil(total / taille) }
}

function exigerAdmin(ctx: AppContext, auth: ReturnType<typeof authOf>): void {
  void ctx
  if (auth.utilisateur.role !== 'ADMIN') {
    throw new ApiError(403, 'ACTION_NON_AUTORISEE', 'Seul un administrateur gère les comptes.')
  }
}

interface EmployeCompte {
  id: string
  departementId: string | null
  actif: boolean
}

async function verifierService(
  role: RoleUtilisateur,
  employe: EmployeCompte | null,
): Promise<void> {
  if (role !== 'EMPLOYE' && role !== 'RESPONSABLE') return
  if (employe === null || employe.departementId === null) {
    throw new ApiError(
      422,
      'SERVICE_OBLIGATOIRE',
      'Un compte employé ou responsable doit être rattaché à un département.',
    )
  }
}

async function verifierResponsable(
  tx: Prisma.TransactionClient,
  role: RoleUtilisateur,
  employe: EmployeCompte | null,
  ignorerUtilisateurId?: string,
): Promise<void> {
  if (role !== 'RESPONSABLE') return
  if (employe === null || employe.departementId === null) {
    throw new ApiError(
      422,
      'RESPONSABLE_SANS_DEPARTEMENT',
      'Un responsable doit être rattaché à un département.',
    )
  }
  const autre = await tx.utilisateur.findFirst({
    where: {
      role: 'RESPONSABLE',
      actif: true,
      employe: { departementId: employe.departementId },
      ...(ignorerUtilisateurId === undefined ? {} : { id: { not: ignorerUtilisateurId } }),
    },
    select: { id: true },
  })
  if (autre !== null) {
    throw new ApiError(
      409,
      'RESPONSABLE_DEJA_PRESENT',
      'Ce département dispose déjà d’un responsable actif.',
    )
  }
}

function versCompte(utilisateur: {
  id: string
  identifiant: string
  role: RoleUtilisateur
  actif: boolean
  doitChangerMotDePasse: boolean
  derniereConnexionLe: Date | null
  employe: {
    id: string
    nom: string
    prenom: string
    departement: { id: string; libelle: string } | null
  } | null
}) {
  return {
    id: utilisateur.id,
    identifiant: utilisateur.identifiant,
    role: utilisateur.role,
    actif: utilisateur.actif,
    doitChangerMotDePasse: utilisateur.doitChangerMotDePasse,
    derniereConnexionLe: utilisateur.derniereConnexionLe?.toISOString() ?? null,
    employe:
      utilisateur.employe === null
        ? null
        : {
            id: utilisateur.employe.id,
            nomComplet: `${utilisateur.employe.prenom} ${utilisateur.employe.nom}`,
            departement: utilisateur.employe.departement,
          },
  }
}

export function createAccountsRouter(ctx: AppContext): Router {
  const routeur = Router()
  routeur.use(requireAuth)

  routeur.get('/', async (req, res) => {
    exigerAdmin(ctx, authOf(req))
    const parametres = parseQuery(schemaListe, req)

    const where: Prisma.UtilisateurWhereInput = {}
    if (parametres.actif !== undefined) where.actif = parametres.actif
    if (parametres.role !== undefined) where.role = parametres.role
    const recherche = parametres.recherche?.trim()
    if (recherche !== undefined && recherche.length > 0) {
      where.OR = [
        { identifiant: { contains: recherche, mode: 'insensitive' } },
        { employe: { nom: { contains: recherche, mode: 'insensitive' } } },
        { employe: { prenom: { contains: recherche, mode: 'insensitive' } } },
      ]
    }

    const total = await ctx.prisma.utilisateur.count({ where })
    const utilisateurs = await ctx.prisma.utilisateur.findMany({
      where,
      include: { employe: { include: { departement: true } } },
      orderBy: [{ actif: 'desc' }, { identifiant: 'asc' }],
      skip: (parametres.page - 1) * parametres.taille,
      take: parametres.taille,
    })

    res.status(200).json({
      elements: utilisateurs.map(versCompte),
      pagination: pagination(parametres.page, parametres.taille, total),
    })
  })

  routeur.post('/', async (req, res) => {
    const auth = authOf(req)
    exigerAdmin(ctx, auth)
    const corps = parseBody(schemaCreation, req)
    const identifiant = corps.identifiant.trim()

    const doublon = await ctx.prisma.utilisateur.findFirst({
      where: { identifiant: { equals: identifiant, mode: 'insensitive' } },
      select: { id: true },
    })
    if (doublon !== null) {
      throw new ApiError(409, 'IDENTIFIANT_DEJA_UTILISE', 'Cet identifiant est déjà utilisé.')
    }
    if (corps.employeId !== undefined && corps.employeId !== null && corps.employe !== undefined) {
      throw new ApiError(422, 'VALEUR_INVALIDE', 'Fournir soit employeId, soit une fiche employé.')
    }
    if ((corps.employeId === undefined || corps.employeId === null) && corps.employe === undefined) {
      if (corps.role !== 'CONSULTANT') {
        throw new ApiError(
          422,
          'CHAMP_OBLIGATOIRE',
          'Un compte non consultant exige une fiche employé.',
        )
      }
    }
    if (corps.employe !== undefined && corps.role === 'CONSULTANT') {
      throw new ApiError(422, 'VALEUR_INVALIDE', 'Un consultant n’a pas de fiche employé.')
    }

    const motDePasseTemporaire = generateTemporaryPassword()
    const motDePasseHash = await hashPassword(motDePasseTemporaire)
    const maintenant = ctx.clock.now()

    const cree = await ctx.prisma.$transaction(async (tx) => {
      let employe: EmployeCompte | null = null

      if (corps.employe !== undefined) {
        if (corps.employe.departementId !== undefined && corps.employe.departementId !== null) {
          const departement = await tx.departement.findUnique({
            where: { id: corps.employe.departementId },
            select: { id: true },
          })
          if (departement === null) {
            throw new ApiError(422, 'VALEUR_INVALIDE', 'Département inconnu.')
          }
        }
        const fiche = await tx.employe.create({
          data: {
            nom: corps.employe.nom.trim(),
            prenom: corps.employe.prenom.trim(),
            email: corps.employe.email ?? null,
            departementId: corps.employe.departementId ?? null,
            creeLe: maintenant,
            modifieLe: maintenant,
          },
        })
        employe = { id: fiche.id, departementId: fiche.departementId, actif: fiche.actif }
      } else if (corps.employeId !== undefined && corps.employeId !== null) {
        const fiche = await tx.employe.findUnique({ where: { id: corps.employeId } })
        if (fiche === null) {
          throw new ApiError(422, 'VALEUR_INVALIDE', 'Employé inconnu.')
        }
        if (!fiche.actif) {
          throw new ApiError(422, 'EMPLOYE_INACTIF', 'Cet employé est inactif.')
        }
        const dejaLie = await tx.utilisateur.findUnique({
          where: { employeId: fiche.id },
          select: { id: true },
        })
        if (dejaLie !== null) {
          throw new ApiError(409, 'COMPTE_DEJA_LIE', 'Cet employé possède déjà un compte.')
        }
        employe = { id: fiche.id, departementId: fiche.departementId, actif: fiche.actif }
      }

      await verifierService(corps.role, employe)
      await verifierResponsable(tx, corps.role, employe)

      const utilisateur = await tx.utilisateur.create({
        data: {
          employeId: employe?.id ?? null,
          identifiant,
          motDePasseHash,
          role: corps.role,
          organisation: corps.role === 'CONSULTANT' ? 'PARTENAIRE' : 'GD_TRADING',
          serviceId: corps.role === 'CONSULTANT' ? null : (employe?.departementId ?? null),
          actif: true,
          doitChangerMotDePasse: true,
          creeLe: maintenant,
          modifieLe: maintenant,
        },
        include: { employe: { include: { departement: true } } },
      })

      await ecrireAudit(tx, {
        acteurId: auth.utilisateur.id,
        typeOperation: 'COMPTE',
        entite: 'utilisateur',
        entiteId: utilisateur.id,
        donneesApres: {
          identifiant: utilisateur.identifiant,
          role: utilisateur.role,
          employeId: utilisateur.employeId,
        } as Prisma.InputJsonValue,
        contexte: { resultat: 'CREATION' } as Prisma.InputJsonValue,
      })

      return utilisateur
    })

    res.status(201).json({
      ...versCompte(cree),
      motDePasseTemporaire,
    })
  })

  routeur.patch('/:id', async (req, res) => {
    const auth = authOf(req)
    exigerAdmin(ctx, auth)
    const id = lireUuid(req.params['id'])
    const corps = parseBody(schemaModification, req)

    const compte = await ctx.prisma.utilisateur.findUnique({
      where: { id },
      include: { employe: true },
    })
    if (compte === null) {
      throw new ApiError(404, 'RESSOURCE_INTROUVABLE', 'Compte introuvable.')
    }

    const modifieRole = corps.role !== undefined && corps.role !== compte.role
    const modifieActif = corps.actif !== undefined && corps.actif !== compte.actif
    if (id === auth.utilisateur.id && (modifieRole || modifieActif)) {
      throw new ApiError(
        403,
        'AUTO_MODIFICATION_INTERDITE',
        'Vous ne pouvez pas modifier votre propre rôle ni vous désactiver.',
      )
    }

    const role = corps.role ?? compte.role
    const actif = corps.actif ?? compte.actif

    if (compte.role === 'ADMIN' && compte.actif && (role !== 'ADMIN' || !actif)) {
      const autres = await ctx.prisma.utilisateur.count({
        where: { role: 'ADMIN', actif: true, id: { not: compte.id } },
      })
      if (autres === 0) {
        throw new ApiError(409, 'DERNIER_ADMIN', 'Le dernier administrateur actif est protégé.')
      }
    }

    const employeId = corps.employeId === undefined ? compte.employeId : corps.employeId
    let employe: EmployeCompte | null =
      compte.employe === null
        ? null
        : {
            id: compte.employe.id,
            departementId: compte.employe.departementId,
            actif: compte.employe.actif,
          }

    if (corps.employeId !== undefined && corps.employeId !== compte.employeId) {
      if (corps.employeId === null) {
        if (role !== 'CONSULTANT') {
          throw new ApiError(422, 'VALEUR_INVALIDE', 'Seul un consultant peut être sans employé.')
        }
        employe = null
      } else {
        const fiche = await ctx.prisma.employe.findUnique({ where: { id: corps.employeId } })
        if (fiche === null) throw new ApiError(422, 'VALEUR_INVALIDE', 'Employé inconnu.')
        const dejaLie = await ctx.prisma.utilisateur.findUnique({
          where: { employeId: fiche.id },
          select: { id: true },
        })
        if (dejaLie !== null && dejaLie.id !== compte.id) {
          throw new ApiError(409, 'COMPTE_DEJA_LIE', 'Cet employé possède déjà un compte.')
        }
        employe = { id: fiche.id, departementId: fiche.departementId, actif: fiche.actif }
      }
    }

    const maintenant = ctx.clock.now()
    await verifierService(role, employe)
    const modifie = await ctx.prisma.$transaction(async (tx) => {
      await verifierResponsable(tx, role, employe, compte.id)

      const resultat = await tx.utilisateur.update({
        where: { id: compte.id },
        data: {
          role,
          actif,
          employeId,
          organisation: role === 'CONSULTANT' ? 'PARTENAIRE' : 'GD_TRADING',
          serviceId: role === 'CONSULTANT' ? null : (employe?.departementId ?? null),
          modifieLe: maintenant,
        },
        include: { employe: { include: { departement: true } } },
      })
      if (!actif) {
        await tx.session.updateMany({
          where: { utilisateurId: compte.id, revoqueLe: null },
          data: { revoqueLe: maintenant },
        })
      }
      await ecrireAudit(tx, {
        acteurId: auth.utilisateur.id,
        typeOperation: 'COMPTE',
        entite: 'utilisateur',
        entiteId: compte.id,
        donneesAvant: { role: compte.role, actif: compte.actif } as Prisma.InputJsonValue,
        donneesApres: { role, actif } as Prisma.InputJsonValue,
        contexte: { resultat: 'MODIFICATION' } as Prisma.InputJsonValue,
      })
      return resultat
    })

    res.status(200).json(versCompte(modifie))
  })

  routeur.post('/:id/reset-password', async (req, res) => {
    const auth = authOf(req)
    exigerAdmin(ctx, auth)
    const id = lireUuid(req.params['id'])

    const compte = await ctx.prisma.utilisateur.findUnique({ where: { id } })
    if (compte === null) {
      throw new ApiError(404, 'RESSOURCE_INTROUVABLE', 'Compte introuvable.')
    }

    const motDePasseTemporaire = generateTemporaryPassword()
    const motDePasseHash = await hashPassword(motDePasseTemporaire)
    const maintenant = ctx.clock.now()

    await ctx.prisma.$transaction(async (tx) => {
      await tx.utilisateur.update({
        where: { id },
        data: {
          motDePasseHash,
          doitChangerMotDePasse: true,
          tentativesEchouees: 0,
          verrouilleJusqua: null,
          modifieLe: maintenant,
        },
      })
      await tx.session.updateMany({
        where: { utilisateurId: id, revoqueLe: null },
        data: { revoqueLe: maintenant },
      })
      await ecrireAudit(tx, {
        acteurId: auth.utilisateur.id,
        typeOperation: 'COMPTE',
        entite: 'utilisateur',
        entiteId: id,
        contexte: { resultat: 'REINITIALISATION_MOT_DE_PASSE' } as Prisma.InputJsonValue,
      })
    })

    res.status(200).json({ motDePasseTemporaire })
  })

  return routeur
}
