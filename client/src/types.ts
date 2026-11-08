/** Types exposés par l'API (docs/07 §7). */

export type Role = 'ADMIN' | 'RESPONSABLE' | 'EMPLOYE' | 'CONSULTANT'

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

export interface Me {
  utilisateur: {
    id: string
    identifiant: string
    role: Role
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
  droits: Droits
}

export interface Statut {
  code: 'A_FAIRE' | 'EN_COURS' | 'RETARD' | 'ACHEVEE' | 'ANNULEE' | 'SUSPENDUE'
  libelle: string
  manuel: boolean
}

export interface TacheListe {
  id: string
  libelle: string
  nature: 'QUOTIDIENNE' | 'AUTRE'
  typeTache: 'RECURRENTE' | 'SIMPLE'
  isSupplementaire: boolean
  statut: Statut
  progression: number | null
  priorite: { code: 'P1_CRITIQUE' | 'P2_HAUTE' | 'P3_MOYENNE' | 'P4_BASSE'; libelle: string; poids: number }
  dateAction: string
  dateDebut: string
  dateFinPrevue: string | null
  dateFin: string | null
  assigneA: {
    type: 'EMPLOYE' | 'PARTENAIRE'
    id: string
    libelle: string
    departement: { id: string; libelle: string } | null
  }
  creePar: { id: string; nomComplet: string }
  pilote: { type: 'EMPLOYE' | 'PARTENAIRE'; id: string; libelle: string }
  servicePorteur: { id: string; libelle: string } | null
  dateRappel: string | null
  estEnRetard: boolean
  retard: {
    enRetard: boolean
    joursRetard: number
    justificationRequise: boolean
    validationRequise: boolean
  }
  score?: number
  rappelEchu: boolean
  rappelImminent: boolean
  version: number
}

export interface TacheDetail extends TacheListe {
  element: { id: string; libelle: string }
  acteur: 'GD_TRADING' | 'PARTENAIRE'
  clotureLe: string | null
  urgence: { id: string; libelle: string }
  importance: { id: string; libelle: string }
  actionAPrendre: { id: string; libelle: string } | null
  statutManuel: 'ANNULEE' | 'SUSPENDUE' | null
  progressionManuelle: number | null
  progressionSurchargee: boolean
  dateMiseAJour: string | null
  dateControle: string | null
  motifNonAchevement: string | null
  motifRetard: string | null
  motifSuspensionAnnulation: string | null
  dateFinReelleEstimee: string | null
  frequence: 'QUOTIDIENNE' | 'HEBDOMADAIRE' | 'MENSUELLE' | 'TRIMESTRIELLE' | 'ANNUELLE' | null
  dateFinRecurrence: string | null
  retardValideLe: string | null
  suspendueLe: string | null
  repriseLe: string | null
  dureeGJours: number | null
  dureeEJours: number | null
  anomalieDuree: boolean
  attribuePar: { id: string; nomComplet: string }
  creeLe: string
  modifieLe: string
  supprimeLe: string | null
}

export interface Page<T> {
  elements: T[]
  pagination: { page: number; taille: number; total: number; nombrePages: number }
}

export interface Commentaire {
  id: string
  tacheId: string
  auteur: { id: string; nomComplet: string }
  texte: string
  creeLe: string
}

export interface EvenementHistorique {
  id: number
  horodatage: string
  typeOperation: string
  acteur: { id: string; nomComplet: string } | null
  champsModifies: string[]
}

export interface Employe {
  id: string
  nom: string
  prenom: string
  nomComplet: string
  email: string | null
  actif: boolean
  departement: { id: string; libelle: string } | null
}

export interface Compte {
  id: string
  identifiant: string
  role: Role
  actif: boolean
  doitChangerMotDePasse: boolean
  derniereConnexionLe: string | null
  employe: {
    id: string
    nomComplet: string
    departement: { id: string; libelle: string } | null
  } | null
}

export interface EvenementAudit {
  id: number
  horodatage: string
  typeOperation: string
  acteur: { id: string; nomComplet: string } | null
  entite: string
  entiteId: string | null
  donneesAvant: unknown
  donneesApres: unknown
  contexte: unknown
}

export interface Departement {
  id: string
  libelle: string
  actif: boolean
  responsable: { id: string; nomComplet: string } | null
}

export interface Element {
  id: string
  libelle: string
  ordre: number
  actif: boolean
}

export interface Partenaire {
  id: string
  libelle: string
  actif: boolean
}

export interface Urgence {
  id: string
  libelle: string
  ordre: number
}

export interface Importance {
  id: string
  libelle: string
  ordre: number
}

export interface LigneMatrice {
  urgence: { id: string; libelle: string }
  importance: { id: string; libelle: string }
  score: number
  frequenceJours: number
  priorite: string
}

export const LIBELLES_ROLE: Record<Role, string> = {
  ADMIN: 'Administrateur',
  RESPONSABLE: 'Responsable',
  EMPLOYE: 'Employé',
  CONSULTANT: 'Consultant',
}
