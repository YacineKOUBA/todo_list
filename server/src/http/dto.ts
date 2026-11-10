/**
 * Mappage base de données → DTO exposés par l'API (`docs/07` §7).
 *
 * Aucun champ calculé n'est stocké : statut, progression, priorité, rappel,
 * durées et service porteur sont recalculés à chaque lecture par les moteurs
 * de domaine (AR-05).
 */

import type { Prisma } from '@prisma/client'
import { computeDurations } from '../domain/durations'
import {
  calculerPriorite,
  calculerProgression,
  calculerRetard,
  calculerScoreTache,
  normaliserImportance,
  normaliserUrgence,
} from '../domain/calculs'
import { computeReminderDate, computeReminderSignals } from '../domain/reminder'
import { progressionChecklist } from '../domain/checklist'
import { computeTaskStatus } from '../domain/task-status'
import { resolveServicePorteur } from '../domain/service-porteur'
import { utcDateToCalendarDate } from '../lib/calendar-date'
import type { ContexteCalendrier } from './calendar'

export const INCLUDE_TACHE = {
  element: true,
  assigneAEmploye: { include: { departement: true } },
  assigneAPartenaire: true,
  piloteEmploye: { include: { departement: true } },
  pilotePartenaire: true,
  matrice: { include: { urgence: true, importance: true } },
  actionAPrendre: true,
  creePar: { include: { employe: true } },
  attribuePar: { include: { employe: true } },
  valideParChecklist: { include: { employe: true } },
  sousTaches: {
    orderBy: { ordre: 'asc' },
    include: { cocheePar: { include: { employe: true } }, creePar: { include: { employe: true } } },
  },
} satisfies Prisma.TacheInclude

export type TacheComplete = Prisma.TacheGetPayload<{ include: typeof INCLUDE_TACHE }>
export type CommentaireComplet = Prisma.CommentaireGetPayload<{
  include: { auteur: { include: { employe: true } } }
}>

export type PiloteDto = { type: 'EMPLOYE' | 'PARTENAIRE'; id: string; libelle: string }

export interface AssigneADto {
  type: 'EMPLOYE' | 'PARTENAIRE'
  id: string
  libelle: string
  departement: { id: string; libelle: string } | null
}

export type SousTacheDto = {
  id: string
  libelle: string
  ordre: number
  cochee: boolean
  dateCochee: string | null
  cocheePar: { id: string; nomComplet: string } | null
}

export interface TacheListeDto {
  id: string
  libelle: string
  nature: string
  typeTache: string
  isSupplementaire: boolean
  checklist: { statut: string; total: number; cochees: number }
  statut: { code: string; libelle: string; manuel: boolean }
  progression: number | null
  priorite: { code: string; libelle: string; poids: number }
  dateAction: string
  dateDebut: string
  dateFinPrevue: string | null
  dateFin: string | null
  assigneA: AssigneADto
  creePar: { id: string; nomComplet: string }
  pilote: PiloteDto
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

export interface TacheDetailDto extends TacheListeDto {
  element: { id: string; libelle: string }
  acteur: string
  dateDebut: string
  clotureLe: string | null
  urgence: { id: string; libelle: string }
  importance: { id: string; libelle: string }
  actionAPrendre: { id: string; libelle: string } | null
  statutManuel: string | null
  progressionManuelle: number | null
  progressionSurchargee: boolean
  dateMiseAJour: string | null
  dateControle: string | null
  motifNonAchevement: string | null
  motifRetard: string | null
  motifSuspensionAnnulation: string | null
  dateFinReelleEstimee: string | null
  frequence: string | null
  dateFinRecurrence: string | null
  retardValideLe: string | null
  suspendueLe: string | null
  repriseLe: string | null
  dureeGJours: number | null
  dureeEJours: number | null
  anomalieDuree: boolean
  creePar: { id: string; nomComplet: string }
  attribuePar: { id: string; nomComplet: string }
  creeLe: string
  modifieLe: string
  supprimeLe: string | null
  sousTaches: SousTacheDto[]
  motifRenvoiChecklist: string | null
  dateSoumissionChecklist: string | null
  dateValidationChecklist: string | null
  valideParChecklist: { id: string; nomComplet: string } | null
}

export function iso(valeur: Date): string {
  return valeur.toISOString().replace(/\.\d{3}Z$/, 'Z')
}

export function nomCompletDe(
  employe: { prenom: string; nom: string } | null,
  identifiant: string,
): string {
  return employe === null ? identifiant : `${employe.prenom} ${employe.nom}`
}

export function identiteUtilisateur(utilisateur: {
  id: string
  identifiant: string
  employe: { prenom: string; nom: string } | null
}): { id: string; nomComplet: string } {
  return {
    id: utilisateur.id,
    nomComplet: nomCompletDe(utilisateur.employe, utilisateur.identifiant),
  }
}

export function assigneADe(tache: TacheComplete): AssigneADto {
  if (tache.assigneAEmploye !== null) {
    return {
      type: 'EMPLOYE',
      id: tache.assigneAEmploye.id,
      libelle: nomCompletDe(tache.assigneAEmploye, tache.assigneAEmploye.id),
      departement:
        tache.assigneAEmploye.departement === null
          ? null
          : {
              id: tache.assigneAEmploye.departement.id,
              libelle: tache.assigneAEmploye.departement.libelle,
            },
    }
  }
  if (tache.assigneAPartenaire !== null) {
    return {
      type: 'PARTENAIRE',
      id: tache.assigneAPartenaire.id,
      libelle: tache.assigneAPartenaire.libelle,
      departement: null,
    }
  }
  // La contrainte `ck_tache_assigne` garantit qu'un assigné existe : ce
  // retour n'est qu'un filet de sécurité pour le typage.
  return { type: 'EMPLOYE', id: '', libelle: '—', departement: null }
}

export function piloteDe(tache: TacheComplete): PiloteDto {
  if (tache.piloteEmploye !== null) {
    return {
      type: 'EMPLOYE',
      id: tache.piloteEmploye.id,
      libelle: nomCompletDe(tache.piloteEmploye, tache.piloteEmploye.id),
    }
  }
  if (tache.pilotePartenaire !== null) {
    return {
      type: 'PARTENAIRE',
      id: tache.pilotePartenaire.id,
      libelle: tache.pilotePartenaire.libelle,
    }
  }
  const assigneA = assigneADe(tache)
  return { type: assigneA.type, id: assigneA.id, libelle: assigneA.libelle }
}

export function servicePorteurDeTache(
  tache: TacheComplete,
): { id: string; libelle: string } | null {
  const departementAssigne = tache.assigneAEmploye?.departement ?? null
  const departementPilote = tache.piloteEmploye?.departement ?? null
  const id = resolveServicePorteur({
    departementAssigneId: departementAssigne?.id ?? null,
    departementPiloteId: departementPilote?.id ?? null,
  })
  if (id === null) return null
  if (departementAssigne !== null && departementAssigne.id === id) {
    return { id, libelle: departementAssigne.libelle }
  }
  return departementPilote !== null && departementPilote.id === id
    ? { id, libelle: departementPilote.libelle }
    : null
}

export function toTacheListe(tache: TacheComplete, contexte: ContexteCalendrier): TacheListeDto {
  const dateAction = utcDateToCalendarDate(tache.dateAction)
  const dateDebut = utcDateToCalendarDate(tache.dateDebut)
  const dateFinPrevue = tache.dateFinPrevue === null ? null : utcDateToCalendarDate(tache.dateFinPrevue)
  const dateFin = tache.dateFin === null ? null : utcDateToCalendarDate(tache.dateFin)

  const statut = computeTaskStatus({
    statutManuel: tache.statutManuel,
    nature: tache.nature,
    dateAction,
    dateFinPrevue,
    dateFin,
    maintenant: contexte.maintenant,
    fuseau: contexte.fuseau,
    heureEcheanceQuotidienne: contexte.heureEcheanceQuotidienne,
  })

  const echeance = dateFinPrevue ?? dateAction
  const totalSousTaches = tache.sousTaches.length
  const cochees = tache.sousTaches.filter((sousTache) => sousTache.cochee).length
  const progressionDepuisChecklist =
    tache.statutChecklist === 'VALIDEE' && totalSousTaches > 0
      ? progressionChecklist(cochees, totalSousTaches)
      : null
  const progression = calculerProgression({
    progressionSurchargee: tache.progressionSurchargee,
    progressionManuelle: tache.progressionManuelle,
    progressionChecklist: progressionDepuisChecklist,
    dateDebut,
    dateFinPrevue,
    dateFin,
    aujourdhui: contexte.aujourdhui,
  })

  const priorite = calculerPriorite(
    normaliserUrgence(tache.matrice.urgence.libelle),
    normaliserImportance(tache.matrice.importance.libelle),
  )

  const retard = calculerRetard({
    echeance,
    dateFin,
    aujourdhui: contexte.aujourdhui,
    isSupplementaire: tache.isSupplementaire,
    motifRetard: tache.motifRetard,
    retardValideLe: tache.retardValideLe,
  })

  const score = calculerScoreTache({
    priorite: priorite.code,
    echeance,
    dateFin,
    aujourdhui: contexte.aujourdhui,
    isSupplementaire: tache.isSupplementaire,
    motifRetard: tache.motifRetard,
    retardValideLe: tache.retardValideLe,
    recurrente: tache.typeTache === 'RECURRENTE',
  })

  const dateRappel = computeReminderDate({
    dateAction,
    dateDebut,
    dateFin,
    frequenceJours: tache.matrice.frequenceJours,
    aujourdhui: contexte.aujourdhui,
    calendrier: contexte.calendrier,
  })
  const signaux = computeReminderSignals(dateRappel, contexte.aujourdhui)

  return {
    id: tache.id,
    libelle: tache.libelle,
    nature: tache.nature,
    typeTache: tache.typeTache,
    isSupplementaire: tache.isSupplementaire,
    checklist: {
      statut: tache.statutChecklist,
      total: totalSousTaches,
      cochees,
    },
    statut,
    progression,
    priorite,
    dateAction,
    dateDebut,
    dateFinPrevue,
    dateFin,
    assigneA: assigneADe(tache),
    creePar: identiteUtilisateur(tache.creePar),
    pilote: piloteDe(tache),
    servicePorteur: servicePorteurDeTache(tache),
    dateRappel,
    estEnRetard: retard.enRetard,
    retard,
    ...(score === null ? {} : { score: score.valeur }),
    rappelEchu: signaux.echue,
    rappelImminent: signaux.imminent,
    version: tache.version,
  }
}

export function toTacheDetail(tache: TacheComplete, contexte: ContexteCalendrier): TacheDetailDto {
  const liste = toTacheListe(tache, contexte)
  const durees = computeDurations({
    dateDebut: liste.dateDebut,
    dateFin: liste.dateFin,
    dateFinPrevue: liste.dateFinPrevue,
    aujourdhui: contexte.aujourdhui,
  })

  return {
    ...liste,
    element: { id: tache.element.id, libelle: tache.element.libelle },
    acteur: tache.acteur,
    dateDebut: liste.dateDebut,
    clotureLe: tache.clotureLe === null ? null : iso(tache.clotureLe),
    urgence: { id: tache.matrice.urgence.id, libelle: tache.matrice.urgence.libelle },
    importance: { id: tache.matrice.importance.id, libelle: tache.matrice.importance.libelle },
    actionAPrendre:
      tache.actionAPrendre === null
        ? null
        : { id: tache.actionAPrendre.id, libelle: tache.actionAPrendre.libelle },
    statutManuel: tache.statutManuel,
    progressionManuelle: tache.progressionManuelle,
    progressionSurchargee: tache.progressionSurchargee,
    dateMiseAJour: tache.dateMiseAJour === null ? null : iso(tache.dateMiseAJour),
    dateControle: tache.dateControle === null ? null : utcDateToCalendarDate(tache.dateControle),
    motifNonAchevement: tache.motifNonAchevement,
    motifRetard: tache.motifRetard,
    motifSuspensionAnnulation: tache.motifSuspensionAnnulation,
    dateFinReelleEstimee:
      tache.dateFinReelleEstimee === null
        ? null
        : utcDateToCalendarDate(tache.dateFinReelleEstimee),
    frequence: tache.frequence,
    dateFinRecurrence:
      tache.dateFinRecurrence === null
        ? null
        : utcDateToCalendarDate(tache.dateFinRecurrence),
    retardValideLe: tache.retardValideLe === null ? null : iso(tache.retardValideLe),
    suspendueLe: tache.suspendueLe === null ? null : iso(tache.suspendueLe),
    repriseLe: tache.repriseLe === null ? null : iso(tache.repriseLe),
    dureeGJours: durees.dureeG === 'ERREUR' ? null : durees.dureeG,
    dureeEJours: durees.dureeE === 'ERREUR' ? null : durees.dureeE,
    anomalieDuree: durees.incoherente,
    attribuePar: identiteUtilisateur(tache.attribuePar),
    creeLe: iso(tache.creeLe),
    modifieLe: iso(tache.modifieLe),
    supprimeLe: tache.supprimeLe === null ? null : iso(tache.supprimeLe),
    sousTaches: tache.sousTaches.map((sousTache) => ({
      id: sousTache.id,
      libelle: sousTache.libelle,
      ordre: sousTache.ordre,
      cochee: sousTache.cochee,
      dateCochee: sousTache.dateCochee === null ? null : iso(sousTache.dateCochee),
      cocheePar:
        sousTache.cocheePar === null ? null : identiteUtilisateur(sousTache.cocheePar),
    })),
    motifRenvoiChecklist: tache.motifRenvoiChecklist,
    dateSoumissionChecklist:
      tache.dateSoumissionChecklist === null ? null : iso(tache.dateSoumissionChecklist),
    dateValidationChecklist:
      tache.dateValidationChecklist === null ? null : iso(tache.dateValidationChecklist),
    valideParChecklist:
      tache.valideParChecklist === null
        ? null
        : identiteUtilisateur(tache.valideParChecklist),
  }
}

export function toCommentaire(commentaire: CommentaireComplet): {
  id: string
  tacheId: string
  auteur: { id: string; nomComplet: string }
  texte: string
  creeLe: string
} {
  return {
    id: commentaire.id,
    tacheId: commentaire.tacheId,
    auteur: identiteUtilisateur(commentaire.auteur),
    texte: commentaire.texte,
    creeLe: iso(commentaire.creeLe),
  }
}
