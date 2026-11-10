export type RoleRbac = 'ADMIN' | 'RESPONSABLE' | 'EMPLOYE' | 'CONSULTANT'

export type ActionRbac =
  | 'TACHE_VOIR'
  | 'TACHE_MODIFIER'
  | 'TACHE_CHANGER_STATUT'
  | 'TACHE_COMMENTER'
  | 'TACHE_SUPPRIMER'
  | 'TACHE_JUSTIFIER_RETARD'
  | 'TACHE_VALIDER_RETARD'
  | 'TACHE_VOIR_SCORE'
  | 'SUPPLEMENTAIRE_CREER'

export interface UtilisateurRbac {
  id: string
  role: RoleRbac
  serviceId: string | null
  employeId: string | null
}

export interface RessourceTache {
  assigneAEmployeId: string | null
  piloteEmployeId: string | null
  creeParId: string
  creeParRole: RoleRbac
  attribueParId: string
  serviceId: string | null
  isSupplementaire: boolean
}

export function estExecutant(utilisateur: UtilisateurRbac, tache: RessourceTache): boolean {
  if (tache.isSupplementaire) return false
  if (utilisateur.employeId === null) return false
  return (
    tache.creeParId !== utilisateur.id &&
    (tache.assigneAEmployeId === utilisateur.employeId ||
      tache.piloteEmployeId === utilisateur.employeId)
  )
}

export function peutVoirTache(utilisateur: UtilisateurRbac, tache: RessourceTache): boolean {
  // Confidentialité des tâches supplémentaires : seul leur créateur peut les
  // voir. Cette règle prime sur tous les rôles, y compris ADMIN et CONSULTANT.
  if (tache.isSupplementaire) return tache.creeParId === utilisateur.id
  if (utilisateur.role === 'ADMIN' || utilisateur.role === 'CONSULTANT') return true
  if (tache.creeParId === utilisateur.id) return true
  if (
    utilisateur.employeId !== null &&
    (tache.assigneAEmployeId === utilisateur.employeId ||
      tache.piloteEmployeId === utilisateur.employeId)
  ) {
    return true
  }
  return (
    utilisateur.role === 'RESPONSABLE' &&
    utilisateur.serviceId !== null &&
    tache.serviceId === utilisateur.serviceId
  )
}

export function can(
  utilisateur: UtilisateurRbac,
  action: ActionRbac,
  tache: RessourceTache,
): boolean {
  const estCreateur = tache.creeParId === utilisateur.id
  const estAttribue =
    utilisateur.employeId !== null &&
    (tache.assigneAEmployeId === utilisateur.employeId ||
      tache.piloteEmployeId === utilisateur.employeId)

  switch (action) {
    case 'TACHE_VOIR':
      return peutVoirTache(utilisateur, tache)
    case 'TACHE_MODIFIER':
      if (utilisateur.role === 'CONSULTANT') return false
      if (tache.isSupplementaire) return estCreateur
      if (utilisateur.role === 'ADMIN') return tache.creeParRole === 'ADMIN'
      if (utilisateur.role === 'RESPONSABLE') return estCreateur
      return false
    case 'TACHE_CHANGER_STATUT':
      if (utilisateur.role === 'CONSULTANT') return false
      if (tache.isSupplementaire) return estCreateur
      if (utilisateur.role === 'ADMIN') return true
      if (utilisateur.role === 'RESPONSABLE') return estCreateur
      return false
    case 'TACHE_COMMENTER':
      if (utilisateur.role === 'CONSULTANT') return false
      if (utilisateur.role === 'ADMIN') return true
      if (estCreateur || estAttribue) return true
      return utilisateur.role === 'RESPONSABLE' && peutVoirTache(utilisateur, tache)
    case 'TACHE_SUPPRIMER':
      if (utilisateur.role === 'ADMIN') return true
      return utilisateur.role === 'RESPONSABLE' && estCreateur && !tache.isSupplementaire
    case 'TACHE_JUSTIFIER_RETARD':
      if (tache.isSupplementaire) return false
      return utilisateur.role === 'ADMIN' || estAttribue
    case 'TACHE_VALIDER_RETARD':
      if (tache.isSupplementaire) return false
      if (utilisateur.role === 'ADMIN') return true
      if (estCreateur) return true
      return (
        utilisateur.role === 'RESPONSABLE' &&
        utilisateur.serviceId !== null &&
        tache.serviceId === utilisateur.serviceId
      )
    case 'TACHE_VOIR_SCORE':
      if (tache.isSupplementaire) return false
      return utilisateur.role === 'ADMIN' || estCreateur
    case 'SUPPLEMENTAIRE_CREER':
      return utilisateur.role !== 'CONSULTANT'
  }
}
