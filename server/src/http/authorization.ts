import type { RoleUtilisateur } from '@prisma/client'
import {
  can,
  estExecutant,
  peutVoirTache as rbacPeutVoir,
  type RessourceTache,
  type RoleRbac,
  type UtilisateurRbac,
} from '../domain/rbac'
import type { AuthSession, EmployeCourant } from './types'

export interface Droits {
  voirToutesLesTaches: boolean
  voirTachesService: boolean
  creerPourAutrui: boolean
  creerPourSonService: boolean
  supprimerTouteTache: boolean
  supprimerTachesAttribuees: boolean
  gererReferentiels: boolean
  gererComptes: boolean
  consulterAudit: boolean
  lectureSeule: boolean
  voirScores: boolean
  creerTacheSupplementaire: boolean
}

export function calculerDroits(role: RoleUtilisateur): Droits {
  const admin = role === 'ADMIN'
  const responsable = role === 'RESPONSABLE'
  return {
    voirToutesLesTaches: admin || role === 'CONSULTANT',
    voirTachesService: responsable,
    creerPourAutrui: admin,
    creerPourSonService: responsable,
    supprimerTouteTache: admin,
    supprimerTachesAttribuees: responsable,
    gererReferentiels: admin,
    gererComptes: admin,
    consulterAudit: admin,
    lectureSeule: role === 'CONSULTANT',
    voirScores: admin || responsable,
    creerTacheSupplementaire: role !== 'CONSULTANT',
  }
}

export interface TachePourAutorisation {
  assigneAEmployeId: string | null
  piloteEmployeId: string | null
  creeParId: string
  creeParRole: RoleRbac
  attribueParId: string
  assigneAEmploye: { departementId: string | null } | null
  piloteEmploye: { departementId: string | null } | null
  isSupplementaire: boolean
}

export function servicePorteurDe(tache: TachePourAutorisation): string | null {
  return tache.assigneAEmploye?.departementId ?? tache.piloteEmploye?.departementId ?? null
}

function utilisateurRbac(auth: AuthSession): UtilisateurRbac {
  return {
    id: auth.utilisateur.id,
    role: auth.utilisateur.role,
    serviceId: auth.utilisateur.serviceId ?? auth.employe?.departementId ?? null,
    employeId: auth.employe?.id ?? null,
  }
}

function ressourceRbac(tache: TachePourAutorisation): RessourceTache {
  return {
    assigneAEmployeId: tache.assigneAEmployeId,
    piloteEmployeId: tache.piloteEmployeId,
    creeParId: tache.creeParId,
    creeParRole: tache.creeParRole,
    attribueParId: tache.attribueParId,
    serviceId: servicePorteurDe(tache),
    isSupplementaire: tache.isSupplementaire,
  }
}

export function estTachePropre(auth: AuthSession, tache: TachePourAutorisation): boolean {
  if (auth.employe === null) return tache.creeParId === auth.utilisateur.id
  return (
    tache.assigneAEmployeId === auth.employe.id ||
    tache.piloteEmployeId === auth.employe.id ||
    tache.creeParId === auth.utilisateur.id
  )
}

export function peutVoirTache(auth: AuthSession, tache: TachePourAutorisation): boolean {
  return rbacPeutVoir(utilisateurRbac(auth), ressourceRbac(tache))
}

export interface CibleCreation {
  employeId: string
  departementId: string | null
  role: RoleUtilisateur | null
  supplementaire?: boolean
}

export function peutCreerPour(auth: AuthSession, cible: CibleCreation): boolean {
  const role = auth.utilisateur.role
  if (role === 'CONSULTANT') return false
  if (cible.supplementaire === true && auth.employe?.id === cible.employeId) return true
  if (role === 'ADMIN') return true
  if (role === 'RESPONSABLE') {
    const service = auth.utilisateur.serviceId ?? auth.employe?.departementId ?? null
    return cible.role === 'EMPLOYE' && service !== null && cible.departementId === service
  }
  return false
}

export function peutModifierTache(auth: AuthSession, tache: TachePourAutorisation): boolean {
  return can(utilisateurRbac(auth), 'TACHE_MODIFIER', ressourceRbac(tache))
}

export function peutChangerStatutTache(auth: AuthSession, tache: TachePourAutorisation): boolean {
  return can(utilisateurRbac(auth), 'TACHE_CHANGER_STATUT', ressourceRbac(tache))
}

export function peutSupprimerTache(auth: AuthSession, tache: TachePourAutorisation): boolean {
  return can(utilisateurRbac(auth), 'TACHE_SUPPRIMER', ressourceRbac(tache))
}

export function peutCommenter(auth: AuthSession, tache: TachePourAutorisation): boolean {
  return can(utilisateurRbac(auth), 'TACHE_COMMENTER', ressourceRbac(tache))
}

export function peutVoirScore(auth: AuthSession, tache: TachePourAutorisation): boolean {
  return can(utilisateurRbac(auth), 'TACHE_VOIR_SCORE', ressourceRbac(tache))
}

export function peutJustifierRetard(auth: AuthSession, tache: TachePourAutorisation): boolean {
  return can(utilisateurRbac(auth), 'TACHE_JUSTIFIER_RETARD', ressourceRbac(tache))
}

export function peutValiderRetard(auth: AuthSession, tache: TachePourAutorisation): boolean {
  return can(utilisateurRbac(auth), 'TACHE_VALIDER_RETARD', ressourceRbac(tache))
}

export function estExecutantDe(auth: AuthSession, tache: TachePourAutorisation): boolean {
  return estExecutant(utilisateurRbac(auth), ressourceRbac(tache))
}

export interface EmployeCible extends EmployeCourant {
  actif: boolean
}
