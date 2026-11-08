import { describe, expect, it } from 'vitest'
import {
  ETAT_INITIAL,
  POLITIQUE_VERROUILLAGE,
  isLocked,
  normalizeLockout,
  registerFailedAttempt,
  registerSuccessfulLogin,
  type LockoutState,
} from './lockout'

const T0 = new Date('2026-11-02T08:00:00.000Z')
const MINUTE = 60 * 1000

function apres(minutes: number): Date {
  return new Date(T0.getTime() + minutes * MINUTE)
}

function etatApresEchecs(nombre: number): LockoutState {
  let etat: LockoutState = ETAT_INITIAL
  for (let index = 0; index < nombre; index += 1) {
    etat = registerFailedAttempt(etat, T0).etat
  }
  return etat
}

describe('verrouillage par compte — D78', () => {
  it('TC-LCK-001 — l’état initial est neutre', () => {
    expect(ETAT_INITIAL).toEqual({ tentativesEchouees: 0, verrouilleJusqua: null })
    expect(isLocked(ETAT_INITIAL, T0)).toBe(false)
  })

  it('TC-LCK-002 — quatre échecs ne verrouillent pas', () => {
    for (let index = 1; index <= 4; index += 1) {
      const resultat = registerFailedAttempt(ETAT_INITIAL, T0)

      expect(resultat.verrouille).toBe(false)
      expect(resultat.verrouillageDeclenche).toBe(false)
    }
    expect(etatApresEchecs(4)).toEqual({ tentativesEchouees: 4, verrouilleJusqua: null })
  })

  it('TC-LCK-003 — le cinquième échec verrouille 15 minutes (TC-SEC-006)', () => {
    const etat = etatApresEchecs(4)
    const resultat = registerFailedAttempt(etat, T0)

    expect(resultat.verrouille).toBe(true)
    expect(resultat.verrouillageDeclenche).toBe(true)
    expect(resultat.etat.tentativesEchouees).toBe(5)
    expect(resultat.etat.verrouilleJusqua?.toISOString()).toBe(apres(15).toISOString())
    expect(POLITIQUE_VERROUILLAGE).toEqual({ maxAttempts: 5, lockMinutes: 15 })
  })

  it('TC-LCK-004 — un compte verrouillé ne compte aucune nouvelle tentative', () => {
    const verrouille = etatApresEchecs(5)
    const resultat = registerFailedAttempt(verrouille, apres(10))

    expect(resultat.etat).toBe(verrouille)
    expect(resultat.verrouille).toBe(true)
    expect(resultat.verrouillageDeclenche).toBe(false)
  })

  it('TC-LCK-005 — à l’expiration exacte, le verrou est levé (TC-SEC-007)', () => {
    const verrouille = etatApresEchecs(5)

    expect(isLocked(verrouille, apres(14))).toBe(true)
    expect(isLocked(verrouille, apres(15))).toBe(false)
    expect(normalizeLockout(verrouille, apres(15))).toEqual(ETAT_INITIAL)
  })

  it('TC-LCK-006 — après expiration, le compteur repart de un', () => {
    const verrouille = etatApresEchecs(5)
    const resultat = registerFailedAttempt(verrouille, apres(16))

    expect(resultat.verrouille).toBe(false)
    expect(resultat.etat).toEqual({ tentativesEchouees: 1, verrouilleJusqua: null })
  })

  it('TC-LCK-007 — une connexion réussie remet le compteur à zéro (TC-SEC-008)', () => {
    expect(registerSuccessfulLogin()).toEqual(ETAT_INITIAL)
  })

  it('TC-LCK-008 — normaliser un état sans verrou ne le modifie pas', () => {
    const etat = etatApresEchecs(3)

    expect(normalizeLockout(etat, T0)).toBe(etat)
  })

  it('TC-LCK-009 — la politique est paramétrable', () => {
    const politique = { maxAttempts: 3, lockMinutes: 5 }
    let etat: LockoutState = ETAT_INITIAL
    for (let index = 0; index < 2; index += 1) {
      etat = registerFailedAttempt(etat, T0, politique).etat
    }

    const resultat = registerFailedAttempt(etat, T0, politique)

    expect(resultat.verrouille).toBe(true)
    expect(resultat.etat.verrouilleJusqua?.toISOString()).toBe(apres(5).toISOString())
  })
})
