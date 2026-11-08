import { describe, expect, it } from 'vitest'
import { computeDurations, type DurationInput } from './durations'

const BASE: DurationInput = {
  dateDebut: '2026-01-01',
  dateFin: '2026-01-10',
  dateFinPrevue: '2026-01-08',
  aujourdhui: '2026-01-20',
}

function durees(overrides: Partial<DurationInput> = {}) {
  return computeDurations({ ...BASE, ...overrides })
}

describe('moteur des durées — RM-06', () => {
  it('TC-DUR-001 — durée G. avec date de fin', () => {
    expect(durees().dureeG).toBe(9)
  })

  it('TC-DUR-002 — durée G. sans date de fin utilise aujourd’hui', () => {
    expect(durees({ dateFin: null }).dureeG).toBe(19)
  })

  it('TC-DUR-003 — durée E. positive = clôture en retard', () => {
    expect(durees().dureeE).toBe(2)
  })

  it('TC-DUR-004 — durée E. négative = clôture en avance', () => {
    expect(durees({ dateFin: '2026-01-06' }).dureeE).toBe(-2)
  })

  it('TC-DUR-005 — durée E. nulle = clôture à l’heure', () => {
    expect(durees({ dateFin: '2026-01-08' }).dureeE).toBe(0)
  })

  it('TC-DUR-006 — durée E. absente sans date de fin prévue', () => {
    expect(durees({ dateFinPrevue: null }).dureeE).toBeNull()
  })

  it('TC-DUR-007 — durée E. absente sans date de fin', () => {
    expect(durees({ dateFin: null }).dureeE).toBeNull()
  })

  it('TC-DUR-008 — sans date de début, tout est inconnu', () => {
    expect(durees({ dateDebut: null })).toEqual({
      dureeG: null,
      dureeE: null,
      incoherente: false,
    })
  })

  it('TC-DUR-009 — clôture avant le début → ERREUR', () => {
    expect(durees({ dateFin: '2025-12-31' })).toEqual({
      dureeG: 'ERREUR',
      dureeE: 'ERREUR',
      incoherente: true,
    })
  })

  it('TC-DUR-010 — échéance avant le début → ERREUR', () => {
    expect(durees({ dateFinPrevue: '2025-12-31' })).toMatchObject({
      incoherente: true,
      dureeG: 'ERREUR',
    })
  })

  it('TC-DUR-011 — min(dateFin, dateFinPrevue) détermine l’erreur', () => {
    const resultat = durees({ dateFin: '2026-01-20', dateFinPrevue: '2025-12-31' })

    expect(resultat.incoherente).toBe(true)
  })
})
