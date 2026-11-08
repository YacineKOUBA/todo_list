import { describe, expect, it } from 'vitest'
import { computeTaskProgress, type TaskProgressInput } from './task-progress'

const BASE: TaskProgressInput = {
  progressionManuelle: null,
  dateAction: '2026-11-02',
  dateDebut: '2026-11-01',
  dateFinPrevue: '2026-11-11',
  dateFin: null,
  aujourdhui: '2026-11-02',
}

function progression(overrides: Partial<TaskProgressInput> = {}) {
  return computeTaskProgress({ ...BASE, ...overrides })
}

describe('moteur de progression — RM-02', () => {
  it('TC-PRO-001 — la valeur manuelle est bornée à 0', () => {
    expect(progression({ progressionManuelle: -5 })).toBe(0)
  })

  it('TC-PRO-002 — la valeur manuelle est bornée à 100', () => {
    expect(progression({ progressionManuelle: 150 })).toBe(100)
  })

  it('TC-PRO-003 — la valeur manuelle gagne sur la clôture', () => {
    expect(progression({ progressionManuelle: 42, dateFin: '2026-11-02' })).toBe(42)
  })

  it('TC-PRO-004 — une tâche clôturée sans valeur manuelle est à 100', () => {
    expect(progression({ dateFin: '2026-11-02' })).toBe(100)
  })

  it('TC-PRO-005 — sans date de début, la progression est inconnue', () => {
    expect(progression({ dateDebut: null })).toBeNull()
  })

  it('TC-PRO-006 — une tâche quotidienne (sans date de fin prévue) affiche « — »', () => {
    expect(progression({ dateFinPrevue: null })).toBeNull()
  })

  it('TC-PRO-007 — un intervalle nul est invalide', () => {
    expect(progression({ dateFinPrevue: '2026-11-01' })).toBeNull()
  })

  it('TC-PRO-008 — avant le début, la progression est à 0', () => {
    expect(progression({ dateAction: '2026-10-20' })).toBe(0)
  })

  it('TC-PRO-009 — après l’échéance, la progression est plafonnée à 100', () => {
    expect(progression({ dateAction: '2026-11-20' })).toBe(100)
  })

  it('TC-PRO-010 — à mi-parcours, la progression est arrondie', () => {
    expect(progression({ dateAction: '2026-11-06' })).toBe(50)
  })

  it('TC-PRO-011 — l’arrondi suit la règle commerciale', () => {
    // 2 jours écoulés sur 7 → 28,57 % → 29 %.
    expect(progression({ dateAction: '2026-11-03', dateFinPrevue: '2026-11-08' })).toBe(29)
  })

  it('TC-PRO-012 — sans date d’action, la référence est aujourd’hui', () => {
    expect(progression({ dateAction: null, aujourdhui: '2026-11-06' })).toBe(50)
  })
})
