import { describe, expect, it } from 'vitest'
import {
  computePriority,
  findPriority,
  priorityLabel,
  resolvePriority,
  type PriorityEntry,
} from './priority'

const URGENCES = {
  immediate: '11111111-1111-1111-1111-111111111111',
  courte: '22222222-2222-2222-2222-222222222222',
  planifiable: '33333333-3333-3333-3333-333333333333',
  pasUrgent: '44444444-4444-4444-4444-444444444444',
}

const IMPORTANCES = {
  critique: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  elevee: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  moderee: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
  faible: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
}

function entree(
  urgence: keyof typeof URGENCES,
  importance: keyof typeof IMPORTANCES,
  score: number,
  frequenceJours: number,
): PriorityEntry {
  const libellesUrgence = {
    immediate: 'Immédiate',
    courte: 'Courte échéance',
    planifiable: 'Planifiable',
    pasUrgent: 'Pas urgent',
  } as const
  const libellesImportance = {
    critique: 'Critique',
    elevee: 'Elevée',
    moderee: 'Modérée',
    faible: 'Faible',
  } as const
  return {
    urgenceId: URGENCES[urgence],
    importanceId: IMPORTANCES[importance],
    urgenceLibelle: libellesUrgence[urgence],
    importanceLibelle: libellesImportance[importance],
    score,
    frequenceJours,
  }
}

/** Les 13 combinaisons du seed (docs/10 §4.4). */
const MATRICE: readonly PriorityEntry[] = [
  entree('immediate', 'critique', 12, 1),
  entree('immediate', 'elevee', 11, 2),
  entree('immediate', 'moderee', 10, 4),
  entree('immediate', 'faible', 9, 5),
  entree('courte', 'critique', 8, 6),
  entree('courte', 'elevee', 7, 7),
  entree('courte', 'moderee', 6, 8),
  entree('courte', 'faible', 5, 10),
  entree('planifiable', 'critique', 4, 15),
  entree('planifiable', 'elevee', 3, 20),
  entree('planifiable', 'moderee', 2, 25),
  entree('planifiable', 'faible', 1, 30),
  entree('pasUrgent', 'faible', 0, 45),
]

describe('moteur de priorité — RM-03', () => {
  it('TC-PRI-001 — le libellé est exactement « Urgence & Importance »', () => {
    expect(priorityLabel('Immédiate', 'Elevée')).toBe('Immédiate & Elevée')
  })

  it('TC-PRI-002 — « Elevée » reste sans accent, comme dans l’Excel', () => {
    const resultat = computePriority(entree('courte', 'elevee', 7, 7))

    expect(resultat.libelle).toBe('Courte échéance & Elevée')
    expect(resultat.libelle).not.toContain('Élevée')
  })

  it('TC-PRI-003 — les 13 combinaisons de la matrice sont résolues', () => {
    expect(MATRICE).toHaveLength(13)
    for (const attendu of MATRICE) {
      const resultat = resolvePriority(MATRICE, attendu.urgenceId, attendu.importanceId)
      expect(resultat).toEqual({
        libelle: `${attendu.urgenceLibelle} & ${attendu.importanceLibelle}`,
        score: attendu.score,
        frequenceJours: attendu.frequenceJours,
      })
    }
  })

  it('TC-PRI-004 — les scores et fréquences correspondent au tableau validé', () => {
    const resultats = new Map(
      MATRICE.map((entry) => [
        `${entry.urgenceLibelle}/${entry.importanceLibelle}`,
        [entry.score, entry.frequenceJours],
      ]),
    )

    expect(resultats.get('Immédiate/Critique')).toEqual([12, 1])
    expect(resultats.get('Courte échéance/Faible')).toEqual([5, 10])
    expect(resultats.get('Planifiable/Critique')).toEqual([4, 15])
    expect(resultats.get('Pas urgent/Faible')).toEqual([0, 45])
  })

  it('TC-PRI-005 — « Pas urgent » × « Critique » est absent', () => {
    expect(findPriority(MATRICE, URGENCES.pasUrgent, IMPORTANCES.critique)).toBeNull()
    expect(resolvePriority(MATRICE, URGENCES.pasUrgent, IMPORTANCES.critique)).toBeNull()
  })

  it('TC-PRI-006 — « Pas urgent » × « Elevée » est absent', () => {
    expect(resolvePriority(MATRICE, URGENCES.pasUrgent, IMPORTANCES.elevee)).toBeNull()
  })

  it('TC-PRI-007 — « Pas urgent » × « Modérée » est absent', () => {
    expect(resolvePriority(MATRICE, URGENCES.pasUrgent, IMPORTANCES.moderee)).toBeNull()
  })

  it('TC-PRI-008 — un couple inconnu ne produit aucune priorité', () => {
    expect(resolvePriority(MATRICE, 'inconnu', 'inconnu')).toBeNull()
  })
})
