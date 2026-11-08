import { describe, expect, it } from 'vitest'
import { hash } from '@node-rs/argon2'
import {
  PARAMETRES_ARGON2,
  dummyPasswordHash,
  hashPassword,
  needsRehash,
  verifyPassword,
} from './argon2'

describe('hachage Argon2id — T13-01', () => {
  it('TC-AR2-001 — un mot de passe est vérifié par son hash', async () => {
    const hashStocke = await hashPassword('mot-de-passe-de-test')

    expect(hashStocke.startsWith('$argon2id$v=19$m=65536,t=3,p=1$')).toBe(true)
    expect(await verifyPassword(hashStocke, 'mot-de-passe-de-test')).toBe(true)
    expect(await verifyPassword(hashStocke, 'autre-mot-de-passe')).toBe(false)
  })

  it('TC-AR2-002 — deux hachages du même mot de passe diffèrent (sel aléatoire)', async () => {
    const premier = await hashPassword('mot-de-passe-de-test')
    const second = await hashPassword('mot-de-passe-de-test')

    expect(premier).not.toBe(second)
  })

  it('TC-AR2-003 — un hash aux paramètres courants ne nécessite pas de re-hachage', async () => {
    const hashStocke = await hashPassword('mot-de-passe-de-test')

    expect(needsRehash(hashStocke)).toBe(false)
  })

  it('TC-AR2-004 — un hash plus faible nécessite un re-hachage', async () => {
    const faible = await hash('mot-de-passe-de-test', {
      algorithm: 2,
      memoryCost: 19_456,
      timeCost: 2,
      parallelism: 1,
      outputLen: 32,
    })

    expect(needsRehash(faible)).toBe(true)
  })

  it('TC-AR2-005 — un hash illisible est considéré comme à re-hacher', () => {
    expect(needsRehash('pas-un-hash')).toBe(true)
  })

  it('TC-AR2-006 — le hash factice est stable et utilisable (EF-10)', async () => {
    const premier = await dummyPasswordHash()
    const second = await dummyPasswordHash()

    expect(premier).toBe(second)
    expect(
      await verifyPassword(premier, 'mot-de-passe-factice-pour-egaliser-le-temps-de-reponse'),
    ).toBe(true)
  })

  it('TC-AR2-007 — les paramètres sont ceux de la décision', () => {
    expect(PARAMETRES_ARGON2).toMatchObject({
      memoryCost: 65_536,
      timeCost: 3,
      parallelism: 1,
      outputLen: 32,
    })
  })
})
