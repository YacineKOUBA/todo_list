import { describe, expect, it } from 'vitest'
import {
  LONGUEUR_MAX_MOT_DE_PASSE,
  LONGUEUR_MIN_MOT_DE_PASSE,
  passwordLength,
  validatePasswordPolicy,
} from './password-policy'

describe('politique de mot de passe — D76', () => {
  it('TC-PWD-001 — 11 caractères sont refusés (TC-SEC-010)', () => {
    const erreurs = validatePasswordPolicy({
      motDePasse: 'a'.repeat(11),
      identifiant: 'jean.dupont',
    })

    expect(erreurs).toHaveLength(1)
    expect(erreurs[0]).toMatchObject({
      champ: 'nouveauMotDePasse',
      code: 'MOT_DE_PASSE_INVALIDE',
    })
  })

  it('TC-PWD-002 — un mot de passe égal à l’identifiant est refusé (TC-SEC-011)', () => {
    const erreurs = validatePasswordPolicy({
      motDePasse: 'Jean.Dupont.2026',
      identifiant: 'jean.dupont.2026',
    })

    expect(erreurs).toHaveLength(1)
    expect(erreurs[0]?.code).toBe('MOT_DE_PASSE_INVALIDE')
  })

  it('TC-PWD-003 — 12 caractères suffisent, sans composition imposée', () => {
    expect(
      validatePasswordPolicy({ motDePasse: 'abcdefghijkl', identifiant: 'jean.dupont' }),
    ).toEqual([])
  })

  it('TC-PWD-004 — la longueur maximale est de 128 caractères', () => {
    expect(
      validatePasswordPolicy({
        motDePasse: 'a'.repeat(LONGUEUR_MAX_MOT_DE_PASSE),
        identifiant: 'jean.dupont',
      }),
    ).toEqual([])
    expect(
      validatePasswordPolicy({
        motDePasse: 'a'.repeat(LONGUEUR_MAX_MOT_DE_PASSE + 1),
        identifiant: 'jean.dupont',
      }),
    ).toHaveLength(1)
  })

  it('TC-PWD-005 — les espaces intérieurs sont acceptés', () => {
    expect(
      validatePasswordPolicy({
        motDePasse: 'une phrase de passe',
        identifiant: 'jean.dupont',
      }),
    ).toEqual([])
  })

  it('TC-PWD-006 — la longueur compte les caractères Unicode, pas les unités UTF-16', () => {
    const douzeEmojis = '😀'.repeat(LONGUEUR_MIN_MOT_DE_PASSE)

    expect(passwordLength(douzeEmojis)).toBe(12)
    expect(validatePasswordPolicy({ motDePasse: douzeEmojis, identifiant: 'jean.dupont' })).toEqual(
      [],
    )
  })

  it('TC-PWD-007 — un mot de passe vide est refusé', () => {
    expect(validatePasswordPolicy({ motDePasse: '', identifiant: 'jean.dupont' })).toHaveLength(1)
  })
})
