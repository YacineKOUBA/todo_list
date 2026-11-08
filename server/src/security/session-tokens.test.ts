import { describe, expect, it } from 'vitest'
import {
  COOKIE_MAX_AGE_SECONDES,
  DUREE_ABSOLUE_HEURES,
  INTERVALLE_ACTIVITE_MS,
  MAX_SESSIONS_ACTIVES,
  NOM_COOKIE_SESSION,
  PURGE_SESSIONS_JOURS,
  clearedSessionCookieOptions,
  generateCsrfToken,
  generateSessionToken,
  hashSessionToken,
  isSessionUsable,
  sessionCookieOptions,
  sessionExpiryFrom,
  shouldTouchActivity,
  timingSafeEqualStrings,
  verifyCsrfToken,
  type SessionTimestamps,
} from './session-tokens'

const SECRET = 'secret-de-test-de-32-octets-minimum-0001'
const ID_SESSION = '11111111-2222-3333-4444-555555555555'

function session(overrides: Partial<SessionTimestamps> = {}): SessionTimestamps {
  return {
    creeLe: new Date('2026-11-02T08:00:00.000Z'),
    derniereActiviteLe: new Date('2026-11-02T08:00:00.000Z'),
    expireLe: new Date('2026-11-02T18:00:00.000Z'),
    revoqueLe: null,
    ...overrides,
  }
}

describe('jetons de session — T13-04', () => {
  it('TC-SES-001 — le jeton fait 43 caractères base64url (32 octets)', () => {
    const jeton = generateSessionToken()

    expect(jeton).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(Buffer.from(jeton, 'base64url')).toHaveLength(32)
  })

  it('TC-SES-002 — deux jetons générés diffèrent', () => {
    const jetons = new Set(Array.from({ length: 100 }, () => generateSessionToken()))

    expect(jetons.size).toBe(100)
  })

  it('TC-SES-003 — seule l’empreinte HMAC-SHA-256 est stockable (TC-SEC-026)', () => {
    const jeton = generateSessionToken()
    const empreinte = hashSessionToken(SECRET, jeton)

    expect(empreinte).toMatch(/^[a-f0-9]{64}$/)
    expect(empreinte).toBe(hashSessionToken(SECRET, jeton))
    expect(empreinte).not.toBe(hashSessionToken('autre-secret', jeton))
    expect(empreinte).not.toContain(jeton)
  })

  it('TC-SES-004 — le nom du cookie est celui de l’API', () => {
    expect(NOM_COOKIE_SESSION).toBe('gd_session')
  })
})

describe('jetons CSRF — T13-05', () => {
  it('TC-CSR-001 — le jeton CSRF est dérivé et déterministe (TC-SEC-032)', () => {
    const premier = generateCsrfToken(SECRET, ID_SESSION)
    const second = generateCsrfToken(SECRET, ID_SESSION)

    expect(premier).toBe(second)
    expect(premier).toMatch(/^[A-Za-z0-9_-]{43}$/)
  })

  it('TC-CSR-002 — deux sessions produisent des jetons CSRF différents (TC-SEC-029)', () => {
    expect(generateCsrfToken(SECRET, ID_SESSION)).not.toBe(
      generateCsrfToken(SECRET, '99999999-8888-7777-6666-555555555555'),
    )
  })

  it('TC-CSR-003 — le jeton CSRF correct est accepté (TC-SEC-030)', () => {
    expect(verifyCsrfToken(SECRET, ID_SESSION, generateCsrfToken(SECRET, ID_SESSION))).toBe(true)
  })

  it('TC-CSR-004 — un jeton absent, vide ou faux est refusé (TC-SEC-028)', () => {
    expect(verifyCsrfToken(SECRET, ID_SESSION, null)).toBe(false)
    expect(verifyCsrfToken(SECRET, ID_SESSION, undefined)).toBe(false)
    expect(verifyCsrfToken(SECRET, ID_SESSION, '')).toBe(false)
    expect(verifyCsrfToken(SECRET, ID_SESSION, 'faux-jeton')).toBe(false)
    expect(verifyCsrfToken(SECRET, ID_SESSION, generateCsrfToken('autre-secret', ID_SESSION))).toBe(
      false,
    )
  })

  it('TC-CSR-005 — la comparaison de chaînes est à temps constant', () => {
    expect(timingSafeEqualStrings('abc', 'abc')).toBe(true)
    expect(timingSafeEqualStrings('abc', 'abd')).toBe(false)
    expect(timingSafeEqualStrings('abc', 'abcd')).toBe(false)
  })
})

describe('durée de vie des sessions — D77, T13-11', () => {
  it('TC-SES-005 — les constantes de décision sont respectées', () => {
    expect(DUREE_ABSOLUE_HEURES).toBe(10)
    expect(COOKIE_MAX_AGE_SECONDES).toBe(10 * 3600)
    expect(INTERVALLE_ACTIVITE_MS).toBe(60_000)
    expect(MAX_SESSIONS_ACTIVES).toBe(5)
    expect(PURGE_SESSIONS_JOURS).toBe(7)
  })

  it('TC-SES-006 — expiration absolue à 10 heures (TC-SEC-022)', () => {
    expect(sessionExpiryFrom(new Date('2026-11-02T08:00:00.000Z')).toISOString()).toBe(
      '2026-11-02T18:00:00.000Z',
    )
  })

  it('TC-SES-007 — une session révoquée est inutilisable', () => {
    expect(
      isSessionUsable(
        session({ revoqueLe: new Date('2026-11-02T09:00:00.000Z') }),
        new Date('2026-11-02T09:30:00.000Z'),
      ),
    ).toBe(false)
  })

  it('TC-SES-008 — au-delà de 30 minutes d’inactivité, la session est refusée (TC-SEC-021)', () => {
    expect(isSessionUsable(session(), new Date('2026-11-02T08:30:00.000Z'))).toBe(true)
    expect(isSessionUsable(session(), new Date('2026-11-02T08:30:00.001Z'))).toBe(false)
  })

  it('TC-SES-009 — expiration absolue : une activité récente ne prolonge pas la session', () => {
    expect(
      isSessionUsable(
        session({ derniereActiviteLe: new Date('2026-11-02T18:00:00.000Z') }),
        new Date('2026-11-02T18:00:00.001Z'),
      ),
    ).toBe(false)
  })

  it('TC-SES-010 — l’activité n’est écrite qu’une fois par minute', () => {
    const derniere = new Date('2026-11-02T08:00:00.000Z')

    expect(shouldTouchActivity(derniere, new Date('2026-11-02T08:00:59.999Z'))).toBe(false)
    expect(shouldTouchActivity(derniere, new Date('2026-11-02T08:01:00.000Z'))).toBe(true)
  })

  it('TC-SES-011 — le cookie est HttpOnly, Secure, Strict, limité à /api (TC-SEC-020)', () => {
    const options = sessionCookieOptions(true)

    expect(options).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/api',
      maxAge: COOKIE_MAX_AGE_SECONDES * 1000,
    })
    expect(sessionCookieOptions(false).secure).toBe(false)
  })

  it('TC-SES-012 — le cookie de déconnexion expire immédiatement', () => {
    expect(clearedSessionCookieOptions(true)).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/api',
      maxAge: 0,
    })
  })
})
