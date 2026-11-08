import { describe, expect, it } from 'vitest'
import {
  ALPHABET_MOT_DE_PASSE_TEMPORAIRE,
  LONGUEUR_MOT_DE_PASSE_TEMPORAIRE,
  generateTemporaryPassword,
} from './temporary-password'

describe('mot de passe temporaire — T13-02', () => {
  it('TC-TMP-001 — 16 caractères, tous issus de l’alphabet autorisé (TC-SEC-019)', () => {
    const motDePasse = generateTemporaryPassword()

    expect(motDePasse).toHaveLength(LONGUEUR_MOT_DE_PASSE_TEMPORAIRE)
    for (const caractere of motDePasse) {
      expect(ALPHABET_MOT_DE_PASSE_TEMPORAIRE).toContain(caractere)
    }
  })

  it('TC-TMP-002 — l’alphabet exclut les caractères ambigus', () => {
    // `a-km-z` conserve bien le « o » minuscule : il n'est ambigu qu'avec le
    // zéro, lui aussi exclu, et avec le « O » majuscule, absent de l'alphabet.
    for (const ambigu of ['I', 'O', 'l', '0', '1']) {
      expect(ALPHABET_MOT_DE_PASSE_TEMPORAIRE).not.toContain(ambigu)
    }
  })

  it('TC-TMP-003 — la génération est injectable pour les tests', () => {
    expect(generateTemporaryPassword(() => 0)).toBe('A'.repeat(16))
    expect(generateTemporaryPassword(() => ALPHABET_MOT_DE_PASSE_TEMPORAIRE.length - 1)).toBe(
      '9'.repeat(16),
    )
  })

  it('TC-TMP-004 — deux générations diffèrent (aléa réel)', () => {
    const valeurs = new Set(Array.from({ length: 50 }, () => generateTemporaryPassword()))

    expect(valeurs.size).toBe(50)
  })

  it('TC-TMP-005 — une longueur invalide est refusée', () => {
    expect(() => generateTemporaryPassword(undefined, 0)).toThrow(RangeError)
    expect(() => generateTemporaryPassword(undefined, 1.5)).toThrow(RangeError)
  })
})
