import { describe, expect, it } from 'vitest'
import {
  WEEKEND_DEFAUT,
  addWorkingDays,
  isWeekend,
  isWorkingDay,
  nextWorkingDay,
  previousWorkingDay,
  validateWeekend,
  type WorkingCalendar,
} from './working-days'

/** 2026-01-01 est un jeudi ; le week-end par défaut est vendredi + samedi. */
const SANS_FERIE: WorkingCalendar = { weekEnd: WEEKEND_DEFAUT, joursFeries: new Set() }

function avecFeries(...jours: string[]): WorkingCalendar {
  return { weekEnd: WEEKEND_DEFAUT, joursFeries: new Set(jours) }
}

describe('moteur de jours ouvrés — RM-05', () => {
  it('TC-JOU-001 — vendredi et samedi sont exclus par défaut', () => {
    expect(isWeekend('2026-01-02', WEEKEND_DEFAUT)).toBe(true)
    expect(isWeekend('2026-01-03', WEEKEND_DEFAUT)).toBe(true)
    expect(isWeekend('2026-01-04', WEEKEND_DEFAUT)).toBe(false)
  })

  it('TC-JOU-002 — le jour de départ n’est jamais compté', () => {
    expect(addWorkingDays('2026-01-04', 1, SANS_FERIE)).toBe('2026-01-05')
  })

  it('TC-JOU-003 — un vendredi saute au dimanche', () => {
    // Jeudi 01/01 + 1 jour ouvré : vendredi et samedi exclus → dimanche 04/01.
    expect(addWorkingDays('2026-01-01', 1, SANS_FERIE)).toBe('2026-01-04')
  })

  it('TC-JOU-004 — un férié est exclu', () => {
    const calendrier = avecFeries('2026-01-04')

    expect(addWorkingDays('2026-01-01', 1, calendrier)).toBe('2026-01-05')
  })

  it('TC-JOU-005 — enchaînement sur plusieurs semaines', () => {
    expect(addWorkingDays('2026-01-01', 5, SANS_FERIE)).toBe('2026-01-08')
  })

  it('TC-JOU-006 — ajout de zéro jour renvoie la date de départ', () => {
    expect(addWorkingDays('2026-01-02', 0, SANS_FERIE)).toBe('2026-01-02')
  })

  it('TC-JOU-007 — le calcul fonctionne en arrière', () => {
    expect(addWorkingDays('2026-01-04', -1, SANS_FERIE)).toBe('2026-01-01')
  })

  it('TC-JOU-008 — nextWorkingDay et previousWorkingDay', () => {
    expect(nextWorkingDay('2026-01-04', SANS_FERIE)).toBe('2026-01-05')
    expect(previousWorkingDay('2026-01-04', SANS_FERIE)).toBe('2026-01-01')
  })

  it('TC-JOU-009 — le week-end est paramétrable (samedi + dimanche)', () => {
    const calendrier: WorkingCalendar = {
      weekEnd: [6, 0],
      joursFeries: new Set(),
    }

    // Vendredi 02/01 + 1 jour ouvré → lundi 05/01.
    expect(addWorkingDays('2026-01-02', 1, calendrier)).toBe('2026-01-05')
    expect(isWorkingDay('2026-01-02', calendrier)).toBe(true)
  })

  it('TC-JOU-010 — une année sans férié saisi reste calculable (P2)', () => {
    expect(addWorkingDays('2027-01-01', 1, SANS_FERIE)).toBe('2027-01-03')
  })

  it('TC-JOU-011 — un week-end invalide est refusé', () => {
    expect(() => validateWeekend([5])).toThrow(RangeError)
    expect(() => validateWeekend([7, 1])).toThrow(RangeError)
    expect(() => validateWeekend([5, 5])).toThrow(RangeError)
    expect(() => validateWeekend([5.5, 6])).toThrow(RangeError)
  })

  it('TC-JOU-012 — un nombre de jours non entier est refusé', () => {
    expect(() => addWorkingDays('2026-01-01', 1.5, SANS_FERIE)).toThrow(RangeError)
  })

  it('TC-JOU-013 — isWorkingDay combine week-end et fériés', () => {
    const calendrier = avecFeries('2026-01-05')

    expect(isWorkingDay('2026-01-02', calendrier)).toBe(false)
    expect(isWorkingDay('2026-01-05', calendrier)).toBe(false)
    expect(isWorkingDay('2026-01-06', calendrier)).toBe(true)
  })
})
