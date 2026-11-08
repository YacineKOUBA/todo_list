import { describe, expect, it } from 'vitest'
import {
  actionAPrendrePourPriorite,
  agregerScores,
  calculerPriorite,
  calculerProgression,
  calculerRetard,
  calculerScoreTache,
  normaliserImportance,
  normaliserUrgence,
} from './calculs'

describe('priorité', () => {
  it('mappe la matrice Eisenhower en P1–P4', () => {
    expect(calculerPriorite('HAUTE', 'HAUTE').code).toBe('P1_CRITIQUE')
    expect(calculerPriorite('BASSE', 'HAUTE').code).toBe('P2_HAUTE')
    expect(calculerPriorite('HAUTE', 'BASSE').code).toBe('P3_MOYENNE')
    expect(calculerPriorite('BASSE', 'BASSE').code).toBe('P4_BASSE')
  })

  it('normalise les libellés accentués', () => {
    expect(normaliserUrgence('Immédiate')).toBe('HAUTE')
    expect(normaliserUrgence('Planifiable')).toBe('BASSE')
    expect(normaliserImportance('Élevée')).toBe('HAUTE')
    expect(normaliserImportance('Faible')).toBe('BASSE')
  })

  it('déduit l’action à prendre de la priorité', () => {
    expect(actionAPrendrePourPriorite('P1_CRITIQUE')).toBe('Faire immédiatement')
    expect(actionAPrendrePourPriorite('P2_HAUTE')).toBe('Faire immédiatement')
    expect(actionAPrendrePourPriorite('P3_MOYENNE')).toBe('Déléguer si possible')
    expect(actionAPrendrePourPriorite('P4_BASSE')).toBe('Planifier')
  })
})

describe('progression', () => {
  const base = {
    progressionSurchargee: false,
    progressionManuelle: null,
    dateDebut: '2026-11-01',
    dateFinPrevue: '2026-11-11',
    dateFin: null,
  }

  it('plafonne à 95 % tant que la tâche n’est pas clôturée', () => {
    expect(calculerProgression({ ...base, aujourdhui: '2026-11-30' })).toBe(95)
    expect(calculerProgression({ ...base, dateFin: '2026-11-05', aujourdhui: '2026-11-30' })).toBe(100)
  })

  it('respecte la progression surchargée', () => {
    expect(
      calculerProgression({ ...base, progressionSurchargee: true, progressionManuelle: 42, aujourdhui: '2026-11-03' }),
    ).toBe(42)
  })
})

describe('retard et score', () => {
  const commun = {
    echeance: '2026-11-01',
    dateFin: null,
    aujourdhui: '2026-11-04',
    isSupplementaire: false,
    motifRetard: null,
    retardValideLe: null,
  }

  it('compte les jours de retard et exige justification', () => {
    const retard = calculerRetard(commun)
    expect(retard.enRetard).toBe(true)
    expect(retard.joursRetard).toBe(3)
    expect(retard.justificationRequise).toBe(true)
  })

  it('part de 80 et récompense l’avance sans dépasser 100', () => {
    expect(calculerScoreTache({ ...commun, priorite: 'P1_CRITIQUE' })?.valeur).toBe(55)
    expect(
      calculerScoreTache({ ...commun, echeance: '2026-11-10', dateFin: '2026-11-08', aujourdhui: '2026-11-09', priorite: 'P1_CRITIQUE' })
        ?.valeur,
    ).toBe(84)
    expect(
      calculerScoreTache({ ...commun, echeance: '2026-11-20', dateFin: '2026-11-02', aujourdhui: '2026-11-09', priorite: 'P1_CRITIQUE' })
        ?.valeur,
    ).toBe(100)
  })

  it('vaut 80 pour une tâche à l’heure, ouverte ou clôturée', () => {
    expect(
      calculerScoreTache({ ...commun, echeance: '2026-11-10', aujourdhui: '2026-11-04', priorite: 'P1_CRITIQUE' })
        ?.valeur,
    ).toBe(80)
    expect(
      calculerScoreTache({ ...commun, echeance: '2026-11-04', dateFin: '2026-11-04', aujourdhui: '2026-11-04', priorite: 'P1_CRITIQUE' })
        ?.valeur,
    ).toBe(80)
  })

  it('ignore les tâches supplémentaires et agrège par poids', () => {
    expect(calculerScoreTache({ ...commun, isSupplementaire: true, priorite: 'P1_CRITIQUE' })).toBeNull()
    expect(
      agregerScores([
        { score: 100, poids: 3 },
        { score: 50, poids: 1 },
      ]),
    ).toBe(87.5)
    expect(agregerScores([{ score: null, poids: 3 }])).toBeNull()
  })
})
