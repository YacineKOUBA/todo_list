/**
 * Types de la session applicative — extension de `Request`.
 *
 * `req.auth` n'est renseigné que si le cookie correspond à une session
 * utilisable **et** que le compte lié est actif. Un cookie présent mais
 * inutilisable laisse `req.auth` vide et pose `req.sessionIssue`, afin de
 * distinguer « pas de cookie » (`AUTHENTIFICATION_REQUISE`) de « session
 * expirée » (`SESSION_EXPIREE`).
 */

import type { OrganisationUtilisateur, RoleUtilisateur } from '@prisma/client'

export interface DepartementCourant {
  id: string
  libelle: string
}

export interface EmployeCourant {
  id: string
  nom: string
  prenom: string
  email: string | null
  departementId: string | null
  departement: DepartementCourant | null
}

export interface UtilisateurCourant {
  id: string
  identifiant: string
  role: RoleUtilisateur
  organisation: OrganisationUtilisateur
  serviceId: string | null
  actif: boolean
  doitChangerMotDePasse: boolean
}

export interface AuthSession {
  sessionId: string
  utilisateur: UtilisateurCourant
  employe: EmployeCourant | null
}

declare global {
  // L'augmentation du type `Request` d'Express passe obligatoirement par un namespace.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthSession
      sessionIssue?: 'SESSION_EXPIREE'
    }
  }
}

export {}
