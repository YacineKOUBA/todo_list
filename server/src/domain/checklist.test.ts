import { describe, expect, it } from 'vitest'
import { calculerProgression } from './calculs'
import {
  appliquerDateDebutValidation,
  checklistBloquante,
  peutCocherChecklist,
  peutStructurerChecklist,
  peutSoumettreChecklist,
  peutValiderChecklist,
  progressionChecklist,
  type ContexteChecklist,
} from './checklist'

function contexte(overrides: Partial<ContexteChecklist> = {}): ContexteChecklist {
  return {
    role: 'EMPLOYE',
    estExecutant: true,
    estAdmin: false,
    statut: 'BROUILLON',
    ...overrides,
  }
}

describe('checklist — progression', () => {
  it('TC-CHK-001 — arrondit le ratio de sous-tâches cochées', () => {
    expect(progressionChecklist(3, 8)).toBe(38)
    expect(progressionChecklist(1, 3)).toBe(33)
    expect(progressionChecklist(8, 8)).toBe(100)
  })

  it('TC-CHK-002 — une checklist vide vaut 0', () => {
    expect(progressionChecklist(0, 0)).toBe(0)
  })

  it('TC-CHK-003 — une checklist non validée bloque le démarrage', () => {
    expect(checklistBloquante('BROUILLON', 2)).toBe(true)
    expect(checklistBloquante('SOUMISE', 2)).toBe(true)
    expect(checklistBloquante('VALIDEE', 2)).toBe(false)
    expect(checklistBloquante('BROUILLON', 0)).toBe(false)
  })

  it('TC-CHK-004 — la checklist validée remplace la progression temporelle', () => {
    expect(
      calculerProgression({
        progressionSurchargee: false,
        progressionManuelle: null,
        progressionChecklist: 38,
        dateDebut: '2026-11-01',
        dateFinPrevue: '2026-11-11',
        dateFin: null,
        aujourdhui: '2026-11-12',
      }),
    ).toBe(38)
  })

  it('TC-CHK-005 — la surcharge manuelle reste prioritaire', () => {
    expect(
      calculerProgression({
        progressionSurchargee: true,
        progressionManuelle: 75,
        progressionChecklist: 38,
        dateDebut: '2026-11-01',
        dateFinPrevue: '2026-11-11',
        dateFin: null,
        aujourdhui: '2026-11-12',
      }),
    ).toBe(75)
  })
})

describe('checklist — transitions et droits', () => {
  it('TC-CHK-010 — l’exécutant structure en brouillon, l’admin en attente', () => {
    expect(peutStructurerChecklist(contexte())).toBe(true)
    expect(peutStructurerChecklist(contexte({ estExecutant: false }))).toBe(false)
    expect(peutStructurerChecklist(contexte({ statut: 'SOUMISE', estExecutant: false }))).toBe(false)
    expect(
      peutStructurerChecklist(contexte({ statut: 'SOUMISE', estExecutant: false, estAdmin: true })),
    ).toBe(true)
    expect(peutStructurerChecklist(contexte({ statut: 'VALIDEE', estAdmin: true }))).toBe(false)
  })

  it('TC-CHK-011 — le responsable ne valide jamais', () => {
    expect(
      peutValiderChecklist(contexte({ statut: 'SOUMISE', role: 'RESPONSABLE', estExecutant: false })),
    ).toBe(false)
    expect(
      peutValiderChecklist(contexte({ statut: 'SOUMISE', role: 'ADMIN', estAdmin: true })),
    ).toBe(true)
  })

  it('TC-CHK-012 — la soumission est réservée à l’exécutant en brouillon', () => {
    expect(peutSoumettreChecklist(contexte())).toBe(true)
    expect(peutSoumettreChecklist(contexte({ estExecutant: false }))).toBe(false)
    expect(peutSoumettreChecklist(contexte({ statut: 'SOUMISE' }))).toBe(false)
  })

  it('TC-CHK-013 — la coche est impossible avant validation', () => {
    expect(peutCocherChecklist(contexte())).toBe(false)
    expect(peutCocherChecklist(contexte({ statut: 'SOUMISE' }))).toBe(false)
    expect(peutCocherChecklist(contexte({ statut: 'VALIDEE' }))).toBe(true)
  })

  it('TC-CHK-014 — seuls l’exécutant et l’admin cochent une checklist validée', () => {
    expect(
      peutCocherChecklist(contexte({ statut: 'VALIDEE', estExecutant: false, role: 'RESPONSABLE' })),
    ).toBe(false)
    expect(
      peutCocherChecklist(
        contexte({ statut: 'VALIDEE', estExecutant: false, role: 'ADMIN', estAdmin: true }),
      ),
    ).toBe(true)
    expect(
      peutCocherChecklist(contexte({ statut: 'VALIDEE', role: 'CONSULTANT', estExecutant: true })),
    ).toBe(false)
  })

  it('TC-CHK-015 — la date de début ne suit que la première validation', () => {
    expect(appliquerDateDebutValidation(null)).toBe(true)
    expect(appliquerDateDebutValidation(new Date('2026-11-10T10:00:00Z'))).toBe(false)
  })
})
