/**
 * Authentification et profil courant — `docs/07` §3, `docs/12` §3 et §4.
 *
 * Toutes les réponses d'échec de connexion sont **strictement identiques**
 * (`401 IDENTIFIANTS_INVALIDES`) : compte inconnu, inactif, verrouillé ou mot
 * de passe faux ne doivent pas être distinguables (EF-10).
 */

import { Router } from 'express'
import type { OrganisationUtilisateur, Prisma, RoleUtilisateur } from '@prisma/client'
import { z } from 'zod'
import { hashPassword, verifyPassword } from '../security/argon2'
import {
  ETAT_INITIAL,
  isLocked,
  normalizeLockout,
  registerFailedAttempt,
  registerSuccessfulLogin,
} from '../security/lockout'
import { validatePasswordPolicy } from '../security/password-policy'
import { ApiError } from '../security/problem'
import {
  generateCsrfToken,
  generateSessionToken,
  hashSessionToken,
  MAX_SESSIONS_ACTIVES,
  PURGE_SESSIONS_JOURS,
  sessionExpiryFrom,
} from '../security/session-tokens'
import { calculerDroits } from './authorization'
import { ecrireAudit } from './audit'
import type { AppContext } from './context'
import { clearSessionCookie, setSessionCookie } from './cookies'
import { authOf, requireAuth } from './session'
import type { AuthSession } from './types'
import { parseBody, texteObligatoire, schemaCorpsVide } from './validation'

const schemaLogin = z.strictObject({
  identifiant: texteObligatoire(64),
  motDePasse: z.string().min(1).max(128),
})

const schemaMotDePasse = z.strictObject({
  ancienMotDePasse: z.string().min(1).max(128),
  nouveauMotDePasse: z.string().min(1).max(128),
})

const MESSAGE_ECHEC = 'Identifiant ou mot de passe incorrect.'

/** Hash factice : égalise le temps de réponse pour un identifiant inconnu. */
let hashFactice: Promise<string> | null = null
function obtenirHashFactice(): Promise<string> {
  hashFactice ??= hashPassword('identifiant-inexistant-mot-de-passe-factice-0000')
  return hashFactice
}

interface UtilisateurConnecte {
  id: string
  identifiant: string
  role: RoleUtilisateur
  organisation: OrganisationUtilisateur
  serviceId: string | null
  actif: boolean
  doitChangerMotDePasse: boolean
  motDePasseHash: string
  tentativesEchouees: number
  verrouilleJusqua: Date | null
  employe: {
    id: string
    nom: string
    prenom: string
    email: string | null
    departementId: string | null
    departement: { id: string; libelle: string } | null
  } | null
}

function meDepuis(utilisateur: UtilisateurConnecte): {
  utilisateur: {
    id: string
    identifiant: string
    role: RoleUtilisateur
    organisation: OrganisationUtilisateur
    serviceId: string | null
    actif: boolean
    doitChangerMotDePasse: boolean
  }
  employe: {
    id: string
    nom: string
    prenom: string
    nomComplet: string
    email: string | null
    departement: { id: string; libelle: string } | null
  } | null
  droits: ReturnType<typeof calculerDroits>
} {
  return {
    utilisateur: {
      id: utilisateur.id,
      identifiant: utilisateur.identifiant,
      role: utilisateur.role,
      organisation: utilisateur.organisation,
      serviceId: utilisateur.serviceId,
      actif: utilisateur.actif,
      doitChangerMotDePasse: utilisateur.doitChangerMotDePasse,
    },
    employe:
      utilisateur.employe === null
        ? null
        : {
            id: utilisateur.employe.id,
            nom: utilisateur.employe.nom,
            prenom: utilisateur.employe.prenom,
            nomComplet: `${utilisateur.employe.prenom} ${utilisateur.employe.nom}`,
            email: utilisateur.employe.email,
            departement: utilisateur.employe.departement,
          },
    droits: calculerDroits(utilisateur.role),
  }
}

async function purgerSessions(ctx: AppContext, maintenant: Date): Promise<void> {
  const limite = new Date(maintenant.getTime() - PURGE_SESSIONS_JOURS * 86_400_000)
  await ctx.prisma.session.deleteMany({
    where: {
      OR: [{ expireLe: { lt: limite } }, { revoqueLe: { lt: limite } }],
    },
  })
}

async function limiterSessionsActives(
  tx: Prisma.TransactionClient,
  utilisateurId: string,
  maintenant: Date,
  inactiviteMinutes: number,
): Promise<void> {
  const limiteInactivite = new Date(maintenant.getTime() - inactiviteMinutes * 60_000)
  const sessions = await tx.session.findMany({
    where: {
      utilisateurId,
      revoqueLe: null,
      expireLe: { gt: maintenant },
      derniereActiviteLe: { gt: limiteInactivite },
    },
    orderBy: { creeLe: 'asc' },
    select: { id: true },
  })

  const excedent = sessions.length - (MAX_SESSIONS_ACTIVES - 1)
  if (excedent <= 0) return
  await tx.session.updateMany({
    where: { id: { in: sessions.slice(0, excedent).map((session) => session.id) } },
    data: { revoqueLe: maintenant },
  })
}

function adresseIp(req: { ip: string | undefined }): string | null {
  const ip = req.ip
  return typeof ip === 'string' && ip.length > 0 ? ip : null
}

export function createAuthRouter(ctx: AppContext): Router {
  const routeur = Router()

  routeur.post('/login', async (req, res) => {
    const corps = parseBody(schemaLogin, req)
    const maintenant = ctx.clock.now()

    const utilisateur = (await ctx.prisma.utilisateur.findFirst({
      where: { identifiant: { equals: corps.identifiant, mode: 'insensitive' } },
      include: { employe: { include: { departement: true } } },
    })) as UtilisateurConnecte | null

    if (utilisateur === null) {
      await verifyPassword(await obtenirHashFactice(), corps.motDePasse)
      await ecrireAudit(ctx.prisma, {
        acteurId: null,
        typeOperation: 'CONNEXION',
        entite: 'session',
        entiteId: null,
        contexte: {
          identifiant: corps.identifiant,
          resultat: 'ECHEC',
          ip: adresseIp(req),
        },
      })
      throw new ApiError(401, 'IDENTIFIANTS_INVALIDES', MESSAGE_ECHEC)
    }

    const etat = normalizeLockout(
      {
        tentativesEchouees: utilisateur.tentativesEchouees,
        verrouilleJusqua: utilisateur.verrouilleJusqua,
      },
      maintenant,
    )

    const motDePasseValide = await verifyPassword(utilisateur.motDePasseHash, corps.motDePasse)

    if (isLocked(etat, maintenant) || !utilisateur.actif) {
      await ecrireAudit(ctx.prisma, {
        acteurId: utilisateur.id,
        typeOperation: 'CONNEXION',
        entite: 'utilisateur',
        entiteId: utilisateur.id,
        contexte: {
          identifiant: corps.identifiant,
          resultat: 'ECHEC',
          motif: isLocked(etat, maintenant) ? 'COMPTE_VERROUILLE' : 'COMPTE_INACTIF',
          ip: adresseIp(req),
        },
      })
      throw new ApiError(401, 'IDENTIFIANTS_INVALIDES', MESSAGE_ECHEC)
    }

    if (!motDePasseValide) {
      const echec = registerFailedAttempt(etat, maintenant)
      await ctx.prisma.utilisateur.update({
        where: { id: utilisateur.id },
        data: {
          tentativesEchouees: echec.etat.tentativesEchouees,
          verrouilleJusqua: echec.etat.verrouilleJusqua,
          modifieLe: maintenant,
        },
      })
      await ecrireAudit(ctx.prisma, {
        acteurId: utilisateur.id,
        typeOperation: 'CONNEXION',
        entite: 'utilisateur',
        entiteId: utilisateur.id,
        contexte: {
          identifiant: corps.identifiant,
          resultat: 'ECHEC',
          motif: echec.verrouillageDeclenche ? 'VERROUILLAGE' : 'MOT_DE_PASSE_FAUX',
          ip: adresseIp(req),
        },
      })
      throw new ApiError(401, 'IDENTIFIANTS_INVALIDES', MESSAGE_ECHEC)
    }

    await purgerSessions(ctx, maintenant)

    const jeton = generateSessionToken()
    const jetonHash = hashSessionToken(ctx.env.SESSION_SECRET, jeton)

    await ctx.prisma.$transaction(async (tx) => {
      await limiterSessionsActives(
        tx,
        utilisateur.id,
        maintenant,
        ctx.env.SESSION_IDLE_MINUTES,
      )
      const reussite = registerSuccessfulLogin()
      await tx.utilisateur.update({
        where: { id: utilisateur.id },
        data: {
          tentativesEchouees: reussite.tentativesEchouees,
          verrouilleJusqua: reussite.verrouilleJusqua,
          derniereConnexionLe: maintenant,
          modifieLe: maintenant,
        },
      })
      await tx.session.create({
        data: {
          utilisateurId: utilisateur.id,
          jetonHash,
          creeLe: maintenant,
          derniereActiviteLe: maintenant,
          expireLe: sessionExpiryFrom(maintenant, ctx.env.SESSION_ABSOLUTE_HOURS),
          ip: adresseIp(req),
          userAgent: req.headers['user-agent']?.slice(0, 512) ?? null,
        },
      })
      await ecrireAudit(tx, {
        acteurId: utilisateur.id,
        typeOperation: 'CONNEXION',
        entite: 'utilisateur',
        entiteId: utilisateur.id,
        contexte: {
          identifiant: corps.identifiant,
          resultat: 'SUCCES',
          ip: adresseIp(req),
        },
      })
    })

    setSessionCookie(res, jeton, ctx.env.COOKIE_SECURE)
    res.status(200).json(meDepuis(utilisateur))
  })

  routeur.post('/logout', requireAuth, async (req, res) => {
    const auth = authOf(req)
    const maintenant = ctx.clock.now()

    await ctx.prisma.$transaction(async (tx) => {
      await tx.session.updateMany({
        where: { id: auth.sessionId, revoqueLe: null },
        data: { revoqueLe: maintenant },
      })
      await ecrireAudit(tx, {
        acteurId: auth.utilisateur.id,
        typeOperation: 'CONNEXION',
        entite: 'utilisateur',
        entiteId: auth.utilisateur.id,
        contexte: { resultat: 'DECONNEXION' },
      })
    })

    clearSessionCookie(res, ctx.env.COOKIE_SECURE)
    res.status(204).end()
  })

  routeur.get('/csrf', requireAuth, (req, res) => {
    const auth = authOf(req)
    res.status(200).json({ jeton: generateCsrfToken(ctx.env.SESSION_SECRET, auth.sessionId) })
  })

  routeur.post('/password', requireAuth, async (req, res) => {
    const auth = authOf(req)
    const corps = parseBody(schemaMotDePasse, req)
    const maintenant = ctx.clock.now()

    const utilisateur = await ctx.prisma.utilisateur.findUnique({
      where: { id: auth.utilisateur.id },
    })
    if (utilisateur === null) {
      throw new ApiError(401, 'SESSION_EXPIREE', 'La session a expiré. Reconnectez-vous.')
    }

    const ancienValide = await verifyPassword(utilisateur.motDePasseHash, corps.ancienMotDePasse)
    if (!ancienValide) {
      throw new ApiError(422, 'MOT_DE_PASSE_INVALIDE', 'L’ancien mot de passe est incorrect.', [
        {
          champ: 'ancienMotDePasse',
          code: 'VALEUR_INCORRECTE',
          message: 'L’ancien mot de passe est incorrect.',
        },
      ])
    }

    const erreurs = validatePasswordPolicy({
      motDePasse: corps.nouveauMotDePasse,
      identifiant: utilisateur.identifiant,
    })
    if (erreurs.length > 0) {
      throw new ApiError(
        422,
        'MOT_DE_PASSE_INVALIDE',
        'Le nouveau mot de passe ne respecte pas la politique.',
        erreurs.map((erreur) => ({
          champ: erreur.champ,
          code: erreur.code,
          message: erreur.message,
        })),
      )
    }

    if (await verifyPassword(utilisateur.motDePasseHash, corps.nouveauMotDePasse)) {
      throw new ApiError(
        422,
        'MOT_DE_PASSE_IDENTIQUE',
        'Le nouveau mot de passe doit être différent de l’ancien.',
        [
          {
            champ: 'nouveauMotDePasse',
            code: 'MOT_DE_PASSE_IDENTIQUE',
            message: 'Identique à l’ancien mot de passe.',
          },
        ],
      )
    }

    const nouveauHash = await hashPassword(corps.nouveauMotDePasse)
    const jeton = generateSessionToken()
    const jetonHash = hashSessionToken(ctx.env.SESSION_SECRET, jeton)

    await ctx.prisma.$transaction(async (tx) => {
      await tx.utilisateur.update({
        where: { id: utilisateur.id },
        data: {
          motDePasseHash: nouveauHash,
          doitChangerMotDePasse: false,
          tentativesEchouees: 0,
          verrouilleJusqua: null,
          modifieLe: maintenant,
        },
      })
      await tx.session.updateMany({
        where: { utilisateurId: utilisateur.id, revoqueLe: null },
        data: { revoqueLe: maintenant },
      })
      await tx.session.create({
        data: {
          utilisateurId: utilisateur.id,
          jetonHash,
          creeLe: maintenant,
          derniereActiviteLe: maintenant,
          expireLe: sessionExpiryFrom(maintenant, ctx.env.SESSION_ABSOLUTE_HOURS),
          ip: adresseIp(req),
          userAgent: req.headers['user-agent']?.slice(0, 512) ?? null,
        },
      })
      await ecrireAudit(tx, {
        acteurId: utilisateur.id,
        typeOperation: 'MOT_DE_PASSE',
        entite: 'utilisateur',
        entiteId: utilisateur.id,
        contexte: { resultat: 'CHANGEMENT' },
      })
    })

    setSessionCookie(res, jeton, ctx.env.COOKIE_SECURE)
    res.status(204).end()
  })

  return routeur
}

export function createMeRouter(ctx: AppContext): Router {
  const routeur = Router()

  routeur.get('/', requireAuth, async (req, res) => {
    const auth = authOf(req)
    const utilisateur = await ctx.prisma.utilisateur.findUnique({
      where: { id: auth.utilisateur.id },
      include: { employe: { include: { departement: true } } },
    })
    if (utilisateur === null || !utilisateur.actif) {
      throw new ApiError(401, 'SESSION_EXPIREE', 'La session a expiré. Reconnectez-vous.')
    }
    res.status(200).json(meDepuis(utilisateur as UtilisateurConnecte))
  })

  return routeur
}

/** Réexport utilitaire pour les tests : état initial du verrouillage. */
export const ETAT_VERROUILLAGE_INITIAL = ETAT_INITIAL

/** Utilisé par la route de changement de mot de passe pour un corps vide. */
export const SCHEMA_CORPS_VIDE = schemaCorpsVide

export type { AuthSession }
