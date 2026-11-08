import { describe, expect, it } from 'vitest'
import {
  addCalendarDays,
  calendarDateInTimeZone,
  calendarDateToUtcDate,
  calendarDaysBetween,
  compareCalendarDates,
  isCalendarDate,
  maxCalendarDate,
  minCalendarDate,
  parseCalendarDate,
  todayInTimeZone,
  utcDateToCalendarDate,
  zonedDateTimeToInstant,
} from './calendar-date'

describe('dates calendaires et fuseau — D30', () => {
  it('TC-CAL-001 — valide une date réelle', () => {
    expect(isCalendarDate('2026-11-02')).toBe(true)
    expect(isCalendarDate('2024-02-29')).toBe(true)
  })

  it('TC-CAL-002 — refuse un format ou une date inexistante', () => {
    expect(isCalendarDate('02/11/2026')).toBe(false)
    expect(isCalendarDate('2026-02-30')).toBe(false)
    expect(isCalendarDate('2026-13-01')).toBe(false)
    expect(isCalendarDate(20261102)).toBe(false)
  })

  it('TC-CAL-003 — parseCalendarDate lève une erreur explicite', () => {
    expect(parseCalendarDate('2026-11-02')).toBe('2026-11-02')
    expect(() => parseCalendarDate('2026-11-31')).toThrow(RangeError)
  })

  it('TC-CAL-004 — conversion date calendaire ↔ Date UTC', () => {
    const date = calendarDateToUtcDate('2026-11-02')

    expect(date.toISOString()).toBe('2026-11-02T00:00:00.000Z')
    expect(utcDateToCalendarDate(date)).toBe('2026-11-02')
    expect(() => utcDateToCalendarDate(new Date('invalide'))).toThrow(RangeError)
  })

  it('TC-CAL-005 — ajout de jours calendaires, y compris années bissextiles', () => {
    expect(addCalendarDays('2026-11-02', 1)).toBe('2026-11-03')
    expect(addCalendarDays('2024-02-28', 1)).toBe('2024-02-29')
    expect(addCalendarDays('2026-01-01', -1)).toBe('2025-12-31')
    expect(() => addCalendarDays('2026-11-02', 0.5)).toThrow(RangeError)
  })

  it('TC-CAL-006 — écart et comparaison', () => {
    expect(calendarDaysBetween('2026-01-01', '2026-01-10')).toBe(9)
    expect(calendarDaysBetween('2026-01-10', '2026-01-01')).toBe(-9)
    expect(compareCalendarDates('2026-01-01', '2026-01-02')).toBe(-1)
    expect(compareCalendarDates('2026-01-02', '2026-01-02')).toBe(0)
    expect(compareCalendarDates('2026-01-03', '2026-01-02')).toBe(1)
  })

  it('TC-CAL-007 — min et max refusent une liste vide', () => {
    expect(minCalendarDate(['2026-01-03', '2026-01-01'])).toBe('2026-01-01')
    expect(maxCalendarDate(['2026-01-03', '2026-01-01'])).toBe('2026-01-03')
    expect(() => minCalendarDate([])).toThrow(RangeError)
    expect(() => maxCalendarDate([])).toThrow(RangeError)
  })

  it('TC-CAL-008 — un instant est converti dans le fuseau d’Alger', () => {
    // 23h30 UTC = 00h30 le lendemain à Alger (UTC+1, sans heure d’été).
    expect(calendarDateInTimeZone(new Date('2026-11-02T23:30:00Z'), 'Africa/Algiers')).toBe(
      '2026-11-03',
    )
    expect(todayInTimeZone(new Date('2026-11-02T22:59:59Z'), 'Africa/Algiers')).toBe('2026-11-02')
  })

  it('TC-CAL-009 — 16h30 à Alger correspond à 15h30 UTC', () => {
    expect(zonedDateTimeToInstant('2026-11-02', '16:30', 'Africa/Algiers').toISOString()).toBe(
      '2026-11-02T15:30:00.000Z',
    )
  })

  it('TC-CAL-010 — une heure invalide est refusée', () => {
    expect(() => zonedDateTimeToInstant('2026-11-02', '24:00', 'Africa/Algiers')).toThrow(
      RangeError,
    )
    expect(() => zonedDateTimeToInstant('2026-11-02', '16h30', 'Africa/Algiers')).toThrow(
      RangeError,
    )
  })

  it('TC-CAL-011 — le fuseau tient compte de l’heure d’été d’un autre fuseau', () => {
    // Europe/Paris : été UTC+2, hiver UTC+1.
    expect(zonedDateTimeToInstant('2026-07-01', '12:00', 'Europe/Paris').toISOString()).toBe(
      '2026-07-01T10:00:00.000Z',
    )
    expect(zonedDateTimeToInstant('2026-12-01', '12:00', 'Europe/Paris').toISOString()).toBe(
      '2026-12-01T11:00:00.000Z',
    )
  })
})
