import { describe, expect, it } from 'vitest'
import {
  can,
  peutVoirTache,
  type RessourceTache,
  type RoleRbac,
  type UtilisateurRbac,
} from './rbac'

function utilisateur(
  role: RoleRbac,
  options: Partial<Omit<UtilisateurRbac, 'role'>> = {},
): UtilisateurRbac {
  return {
    id: options.id ?? 'utilisateur-createur',
    role,
    serviceId: options.serviceId ?? 'departement-1',
    employeId: options.employeId ?? 'employe-1',
  }
}

function tache(options: Partial<RessourceTache> = {}): RessourceTache {
  return {
    assigneAEmployeId: 'employe-1',
    piloteEmployeId: 'employe-1',
    creeParId: 'utilisateur-createur',
    creeParRole: 'EMPLOYE',
    attribueParId: 'utilisateur-createur',
    serviceId: 'departement-1',
    isSupplementaire: false,
    ...options,
  }
}

describe('visibilité des tâches supplémentaires', () => {
  const supplementaire = tache({ isSupplementaire: true })

  it('autorise le créateur à voir sa tâche supplémentaire', () => {
    expect(peutVoirTache(utilisateur('EMPLOYE'), supplementaire)).toBe(true)
    expect(peutVoirTache(utilisateur('RESPONSABLE'), supplementaire)).toBe(true)
    expect(peutVoirTache(utilisateur('ADMIN'), supplementaire)).toBe(true)
  })

  it('interdit à l’admin de voir la tâche supplémentaire d’un autre', () => {
    expect(
      peutVoirTache(utilisateur('ADMIN', { id: 'autre-admin' }), supplementaire),
    ).toBe(false)
  })

  it('interdit au consultant de voir la tâche supplémentaire d’un autre', () => {
    expect(
      peutVoirTache(
        utilisateur('CONSULTANT', {
          id: 'consultant',
          employeId: null,
          serviceId: null,
        }),
        supplementaire,
      ),
    ).toBe(false)
  })

  it('interdit au responsable de voir la tâche supplémentaire d’un employé de son service', () => {
    expect(
      peutVoirTache(
        utilisateur('RESPONSABLE', {
          id: 'responsable',
          employeId: 'employe-responsable',
        }),
        supplementaire,
      ),
    ).toBe(false)
  })

  it('interdit à un exécutant non créateur de voir la tâche supplémentaire', () => {
    expect(
      peutVoirTache(
        utilisateur('EMPLOYE', {
          id: 'autre-employe',
          employeId: 'employe-1',
        }),
        supplementaire,
      ),
    ).toBe(false)
  })

  it('applique la même règle à l’action TACHE_VOIR', () => {
    expect(
      can(utilisateur('ADMIN', { id: 'autre-admin' }), 'TACHE_VOIR', supplementaire),
    ).toBe(false)
    expect(can(utilisateur('EMPLOYE'), 'TACHE_VOIR', supplementaire)).toBe(true)
  })
})

describe('visibilité des tâches ordinaires', () => {
  it('laisse l’admin et le consultant voir toutes les tâches', () => {
    expect(peutVoirTache(utilisateur('ADMIN', { id: 'autre-admin' }), tache())).toBe(true)
    expect(
      peutVoirTache(
        utilisateur('CONSULTANT', {
          id: 'consultant',
          employeId: null,
          serviceId: null,
        }),
        tache(),
      ),
    ).toBe(true)
  })

  it('limite le responsable à son service et à ses propres tâches', () => {
    expect(
      peutVoirTache(
        utilisateur('RESPONSABLE', { id: 'responsable', employeId: 'employe-responsable' }),
        tache(),
      ),
    ).toBe(true)
    expect(
      peutVoirTache(
        utilisateur('RESPONSABLE', {
          id: 'responsable',
          employeId: 'employe-responsable',
          serviceId: 'autre-departement',
        }),
        tache(),
      ),
    ).toBe(false)
  })
})
