import { describe, expect, it } from 'vitest'
import { fixedClock, systemClock, TestClock } from './helpers/clock'

describe('horloge injectable', () => {
  it('fige un instant précis et renvoie toujours la même valeur', () => {
    const clock = fixedClock('2026-11-02T15:30:00.000Z')

    expect(clock.now().toISOString()).toBe('2026-11-02T15:30:00.000Z')
    expect(clock.now().toISOString()).toBe('2026-11-02T15:30:00.000Z')
  })

  it('renvoie une copie : modifier la date reçue ne change pas l’horloge', () => {
    const clock = fixedClock('2026-11-02T08:00:00.000Z')
    const first = clock.now()
    first.setUTCFullYear(2030)

    expect(clock.now().toISOString()).toBe('2026-11-02T08:00:00.000Z')
  })

  it('refuse un instant invalide', () => {
    expect(() => fixedClock('pas-une-date')).toThrow(RangeError)
  })

  it('avance et se replace avec TestClock', () => {
    const clock = new TestClock('2026-11-02T08:00:00.000Z')

    clock.advance(30 * 60 * 1000)
    expect(clock.now().toISOString()).toBe('2026-11-02T08:30:00.000Z')

    clock.set('2026-11-02T16:30:00.000Z')
    expect(clock.now().toISOString()).toBe('2026-11-02T16:30:00.000Z')
  })

  it('expose une horloge système', () => {
    const before = Date.now()
    const value = systemClock.now().getTime()
    const after = Date.now()

    expect(value).toBeGreaterThanOrEqual(before)
    expect(value).toBeLessThanOrEqual(after)
  })
})
