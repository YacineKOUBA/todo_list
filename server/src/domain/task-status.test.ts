import { describe, expect, it } from 'vitest'
import { computeTaskStatus, type TaskStatusInput } from './task-status'

const BASE: TaskStatusInput = {
  statutManuel: null,
  nature: 'AUTRE',
  dateAction: '2026-11-02',
  dateFinPrevue: '2026-11-10',
  dateFin: null,
  maintenant: new Date('2026-11-02T09:00:00.000Z'),
  fuseau: 'Africa/Algiers',
  heureEcheanceQuotidienne: '16:30',
}

function statut(overrides: Partial<TaskStatusInput> = {}) {
  return computeTaskStatus({ ...BASE, ...overrides })
}

describe('moteur de statut — RM-01', () => {
  it('TC-STA-001 — une tâche annulée le reste, même clôturée', () => {
    const resultat = statut({ statutManuel: 'ANNULEE', dateFin: '2026-11-02' })

    expect(resultat).toMatchObject({ code: 'ANNULEE', libelle: 'Annulée', manuel: true })
  })

  it('TC-STA-002 — une tâche suspendue le reste, même en retard', () => {
    const resultat = statut({
      statutManuel: 'SUSPENDUE',
      dateFinPrevue: '2026-01-01',
      maintenant: new Date('2026-11-02T09:00:00.000Z'),
    })

    expect(resultat).toMatchObject({ code: 'SUSPENDUE', manuel: true, estEnRetard: false })
  })

  it('TC-STA-003 — une date de fin renseignée vaut achèvement, même en avance', () => {
    const resultat = statut({ dateFin: '2026-11-02', dateFinPrevue: '2026-11-30' })

    expect(resultat).toMatchObject({ code: 'ACHEVEE', libelle: 'Achevée', manuel: false })
  })

  it('TC-STA-004 — date d’action future → A faire', () => {
    const resultat = statut({ dateAction: '2026-11-03' })

    expect(resultat.code).toBe('A_FAIRE')
    expect(resultat.libelle).toBe('A faire')
  })

  it('TC-STA-005 — date d’action absente → A faire', () => {
    expect(statut({ dateAction: null }).code).toBe('A_FAIRE')
  })

  it('TC-STA-006 — tâche « autre » non échue → En cours', () => {
    expect(statut({ dateFinPrevue: '2026-11-10' }).code).toBe('EN_COURS')
  })

  it('TC-STA-007 — tâche « autre » dont l’échéance est hier → Retard', () => {
    const resultat = statut({
      dateAction: '2026-10-01',
      dateFinPrevue: '2026-11-01',
    })

    expect(resultat).toMatchObject({ code: 'RETARD', estEnRetard: true })
  })

  it('TC-STA-008 — tâche « autre » échéant aujourd’hui → En cours', () => {
    expect(statut({ dateFinPrevue: '2026-11-02' }).code).toBe('EN_COURS')
  })

  it('TC-STA-009 — quotidienne à 16h29 (heure d’Alger) → En cours', () => {
    const resultat = statut({
      nature: 'QUOTIDIENNE',
      dateAction: '2026-11-02',
      dateFinPrevue: null,
      maintenant: new Date('2026-11-02T15:29:00.000Z'),
    })

    expect(resultat.code).toBe('EN_COURS')
  })

  it('TC-STA-010 — quotidienne à 16h30 pile → Retard', () => {
    const resultat = statut({
      nature: 'QUOTIDIENNE',
      dateAction: '2026-11-02',
      dateFinPrevue: null,
      maintenant: new Date('2026-11-02T15:30:00.000Z'),
    })

    expect(resultat.code).toBe('RETARD')
  })

  it('TC-STA-011 — quotidienne à 16h31 → Retard', () => {
    const resultat = statut({
      nature: 'QUOTIDIENNE',
      dateAction: '2026-11-02',
      dateFinPrevue: null,
      maintenant: new Date('2026-11-02T15:31:00.000Z'),
    })

    expect(resultat.code).toBe('RETARD')
  })

  it('TC-STA-012 — la frontière de fuseau est celle d’Africa/Algiers', () => {
    // 23h30 UTC le 02/11 = 00h30 le 03/11 à Alger : la tâche du 03/11 est due.
    const resultat = statut({
      nature: 'QUOTIDIENNE',
      dateAction: '2026-11-03',
      dateFinPrevue: null,
      maintenant: new Date('2026-11-02T23:30:00.000Z'),
    })

    expect(resultat.code).toBe('EN_COURS')
  })

  it('TC-STA-013 — une échéance quotidienne personnalisée est respectée', () => {
    const resultat = statut({
      nature: 'QUOTIDIENNE',
      dateAction: '2026-11-02',
      dateFinPrevue: null,
      heureEcheanceQuotidienne: '12:00',
      maintenant: new Date('2026-11-02T11:00:00.000Z'),
    })

    expect(resultat.code).toBe('RETARD')
  })
})
