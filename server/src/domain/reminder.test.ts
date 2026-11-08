import { describe, expect, it } from 'vitest'
import { computeReminderDate, computeReminderSignals, type ReminderInput } from './reminder'
import { WEEKEND_DEFAUT, type WorkingCalendar } from './working-days'

const CALENDRIER: WorkingCalendar = { weekEnd: WEEKEND_DEFAUT, joursFeries: new Set() }

const BASE: ReminderInput = {
  dateAction: '2026-01-10',
  dateDebut: '2026-01-10',
  dateFin: null,
  frequenceJours: 5,
  aujourdhui: '2026-01-05',
  calendrier: CALENDRIER,
}

function rappel(overrides: Partial<ReminderInput> = {}) {
  return computeReminderDate({ ...BASE, ...overrides })
}

describe('moteur de date de rappel — RM-04', () => {
  it('TC-RAP-001 — base = date de début quand dateDebut + fréquence est future', () => {
    // 10/01 + 5 jours calendaires = 15/01 > 05/01 → base 10/01.
    expect(rappel({ aujourdhui: '2026-01-05' })).toBe('2026-01-15')
  })

  it('TC-RAP-002 — base = date d’action quand dateDebut + fréquence est passée', () => {
    // 05/01 + 5 = 10/01 <= 20/01 → base = date d’action 10/01.
    expect(rappel({ dateDebut: '2026-01-05', aujourdhui: '2026-01-20' })).toBe('2026-01-15')
  })

  it('TC-RAP-003 — le test de base est calendaire, le résultat ouvré', () => {
    // 08/01 + 2 = 10/01, égal à aujourd’hui → base = date d’action (08/01).
    const resultat = rappel({
      dateAction: '2026-01-08',
      dateDebut: '2026-01-08',
      frequenceJours: 2,
      aujourdhui: '2026-01-10',
    })

    // Jeudi 08/01 + 2 jours ouvrés : dimanche 11/01, lundi 12/01.
    expect(resultat).toBe('2026-01-12')
  })

  it('TC-RAP-004 — une tâche clôturée n’a aucune date de rappel', () => {
    expect(rappel({ dateFin: '2026-01-09' })).toBeNull()
  })

  it('TC-RAP-005 — une tâche sans date d’action n’a aucune date de rappel', () => {
    expect(rappel({ dateAction: null })).toBeNull()
  })

  it('TC-RAP-006 — une date de début absente ne produit pas de rappel', () => {
    expect(rappel({ dateDebut: null })).toBeNull()
  })

  it('TC-RAP-007 — une fréquence invalide est refusée', () => {
    expect(() => rappel({ frequenceJours: 0 })).toThrow(RangeError)
    expect(() => rappel({ frequenceJours: 2.5 })).toThrow(RangeError)
  })

  it('TC-RAP-008 — un férié décale la date de rappel', () => {
    const resultat = rappel({
      aujourdhui: '2026-01-05',
      calendrier: {
        weekEnd: WEEKEND_DEFAUT,
        joursFeries: new Set([
          '2026-01-11',
          '2026-01-12',
          '2026-01-13',
          '2026-01-14',
          '2026-01-15',
        ]),
      },
    })

    expect(resultat).toBe('2026-01-22')
  })

  it('TC-RAP-009 — signal « échue » quand la date est passée ou aujourd’hui', () => {
    expect(computeReminderSignals('2026-01-04', '2026-01-05')).toEqual({
      echue: true,
      imminent: false,
    })
    expect(computeReminderSignals('2026-01-05', '2026-01-05')).toEqual({
      echue: true,
      imminent: false,
    })
  })

  it('TC-RAP-010 — signal « imminent » de J+1 à J+5', () => {
    expect(computeReminderSignals('2026-01-06', '2026-01-05').imminent).toBe(true)
    expect(computeReminderSignals('2026-01-10', '2026-01-05').imminent).toBe(true)
    expect(computeReminderSignals('2026-01-11', '2026-01-05').imminent).toBe(false)
  })

  it('TC-RAP-011 — aucune date de rappel : aucun signal', () => {
    expect(computeReminderSignals(null, '2026-01-05')).toEqual({
      echue: false,
      imminent: false,
    })
  })
})
