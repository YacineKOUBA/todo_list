import { describe, expect, it } from 'vitest'
import { resolveServicePorteur } from './service-porteur'

describe('service porteur — P7 / D29', () => {
  it('TC-SER-001 — le département de l’exécutant prime', () => {
    expect(
      resolveServicePorteur({
        departementAssigneId: 'dept-assigne',
        departementPiloteId: 'dept-pilote',
      }),
    ).toBe('dept-assigne')
  })

  it('TC-SER-002 — à défaut, celui du pilote', () => {
    expect(
      resolveServicePorteur({
        departementAssigneId: null,
        departementPiloteId: 'dept-pilote',
      }),
    ).toBe('dept-pilote')
  })

  it('TC-SER-003 — aucun département : tâche sans service', () => {
    expect(
      resolveServicePorteur({ departementAssigneId: null, departementPiloteId: null }),
    ).toBeNull()
  })
})
