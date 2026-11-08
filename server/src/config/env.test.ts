import { describe, expect, it } from 'vitest'
import { ConfigurationError, loadEnv } from './env'

const DEV = {
  NODE_ENV: 'development',
  PORT: '3000',
  DATABASE_URL: 'postgresql://gd_trading@127.0.0.1:5433/gd_trading_dev',
  SESSION_SECRET: 'dev-secret-local-0123456789abcdef',
  APP_ORIGIN: 'http://localhost:5173',
  COOKIE_SECURE: 'false',
  TZ: 'Africa/Algiers',
} as const

const PRODUCTION = {
  ...DEV,
  NODE_ENV: 'production',
  SESSION_SECRET: 'K7p2vQ9xR4mN8sT1uW6yA3bC5dE0fG2hJ4kL6nP8qS1t',
  APP_ORIGIN: 'https://todo.gd-trading.local',
  COOKIE_SECURE: 'true',
} as const

describe('configuration — T13-10', () => {
  it('TC-CFG-001 — une configuration de développement valide applique les défauts', () => {
    const env = loadEnv(DEV)

    expect(env.SESSION_IDLE_MINUTES).toBe(30)
    expect(env.SESSION_ABSOLUTE_HOURS).toBe(10)
    expect(env.LOGIN_MAX_ATTEMPTS).toBe(5)
    expect(env.LOGIN_LOCK_MINUTES).toBe(15)
    expect(env.RATE_LIMIT_LOGIN).toBe(10)
    expect(env.RATE_LIMIT_GLOBAL).toBe(100)
    expect(env.TRUST_PROXY).toBe(false)
    expect(env.LOG_LEVEL).toBe('info')
    expect(env.COOKIE_SECURE).toBe(false)
  })

  it('TC-CFG-002 — une variable obligatoire absente empêche le démarrage', () => {
    const sansSecret: Record<string, string> = { ...DEV }
    delete sansSecret['SESSION_SECRET']

    expect(() => loadEnv(sansSecret)).toThrow(ConfigurationError)
    try {
      loadEnv(sansSecret)
    } catch (erreur) {
      expect(erreur).toBeInstanceOf(ConfigurationError)
      expect((erreur as ConfigurationError).problemes.join(' ')).toContain('SESSION_SECRET')
    }
  })

  it('TC-CFG-003 — un port invalide est refusé', () => {
    expect(() => loadEnv({ ...DEV, PORT: 'abc' })).toThrow(ConfigurationError)
    expect(() => loadEnv({ ...DEV, PORT: '70000' })).toThrow(ConfigurationError)
  })

  it('TC-CFG-004 — une URL de base non PostgreSQL est refusée', () => {
    expect(() => loadEnv({ ...DEV, DATABASE_URL: 'mysql://localhost/db' })).toThrow(
      ConfigurationError,
    )
  })

  it('TC-CFG-005 — un fuseau IANA inconnu est refusé', () => {
    expect(() => loadEnv({ ...DEV, TZ: 'Mars/Olympus' })).toThrow(ConfigurationError)
  })

  it('TC-CFG-006 — TRUST_PROXY explicite est converti en booléen', () => {
    expect(loadEnv({ ...DEV, TRUST_PROXY: 'true' }).TRUST_PROXY).toBe(true)
    expect(loadEnv({ ...DEV, TRUST_PROXY: 'false' }).TRUST_PROXY).toBe(false)
    expect(() => loadEnv({ ...DEV, TRUST_PROXY: 'oui' })).toThrow(ConfigurationError)
  })

  it('TC-CFG-007 — la production exige un secret d’au moins 32 octets (TC-SEC-039)', () => {
    expect(() => loadEnv({ ...PRODUCTION, SESSION_SECRET: 'a'.repeat(31) })).toThrow(
      ConfigurationError,
    )
    expect(loadEnv({ ...PRODUCTION, SESSION_SECRET: 'a'.repeat(32) }).NODE_ENV).toBe('production')
  })

  it('TC-CFG-008 — la production refuse un secret de développement', () => {
    expect(() =>
      loadEnv({
        ...PRODUCTION,
        SESSION_SECRET: 'dev-secret-a-remplacer-en-production-0123456789abcdef',
      }),
    ).toThrow(ConfigurationError)
  })

  it('TC-CFG-009 — la production exige COOKIE_SECURE=true (TC-SEC-040)', () => {
    expect(() => loadEnv({ ...PRODUCTION, COOKIE_SECURE: 'false' })).toThrow(ConfigurationError)
  })

  it('TC-CFG-010 — la production exige une origine HTTPS (TC-SEC-041)', () => {
    expect(() => loadEnv({ ...PRODUCTION, APP_ORIGIN: 'http://todo.local' })).toThrow(
      ConfigurationError,
    )
  })

  it('TC-CFG-011 — le message d’erreur ne contient jamais le secret', () => {
    // Secret volontairement refusé (motif de développement) ET assez long pour
    // ne pas déclencher l'autre règle : l'erreur doit citer le champ, pas la valeur.
    const secret = 'change-me-secret-qui-ne-doit-pas-fuir-en-clair'
    try {
      loadEnv({ ...PRODUCTION, SESSION_SECRET: secret })
      expect.unreachable('la configuration aurait dû échouer')
    } catch (erreur) {
      expect(erreur).toBeInstanceOf(ConfigurationError)
      expect((erreur as Error).message).not.toContain(secret)
      expect((erreur as Error).message).toContain('SESSION_SECRET')
    }
  })
})
