import type { Request, Response } from 'express'
import { describe, expect, it } from 'vitest'
import { ApiError, TITRES, instanceOf, sendProblem, toProblemDetails } from './problem'

function fausseReponse() {
  return {
    statusCode: 200,
    contentType: '',
    corps: undefined as unknown,
    status(code: number) {
      this.statusCode = code
      return this
    },
    type(valeur: string) {
      this.contentType = valeur
      return this
    },
    json(charge: unknown) {
      this.corps = charge
      return this
    },
  }
}

describe('erreurs applicatives — problem+json', () => {
  it('TC-PRB-001 — le titre découle du code, avec repli sur le code', () => {
    expect(new ApiError(403, 'ACTION_NON_AUTORISEE', 'Interdit').title).toBe('Action non autorisée')
    expect(TITRES['ACTION_NON_AUTORISEE']).toBe('Action non autorisée')
    expect(new ApiError(418, 'CODE_INCONNU', 'Inconnu').title).toBe('CODE_INCONNU')
  })

  it('TC-PRB-002 — la structure respecte RFC 9457', () => {
    const problem = toProblemDetails(
      new ApiError(422, 'MOT_DE_PASSE_INVALIDE', 'Le mot de passe est trop court.'),
    )

    expect(problem).toEqual({
      type: 'https://gd-trading.local/erreurs/MOT_DE_PASSE_INVALIDE',
      title: 'Mot de passe invalide',
      status: 422,
      code: 'MOT_DE_PASSE_INVALIDE',
      detail: 'Le mot de passe est trop court.',
    })
  })

  it('TC-PRB-003 — l’instance n’est ajoutée que si elle est fournie', () => {
    const erreur = new ApiError(404, 'RESSOURCE_INTROUVABLE', 'Absente.')

    expect(toProblemDetails(erreur).instance).toBeUndefined()
    expect(toProblemDetails(erreur, '/api/tasks/42').instance).toBe('/api/tasks/42')
  })

  it('TC-PRB-004 — les erreurs de champ ne sont exposées que si elles existent', () => {
    const sansChamp = toProblemDetails(new ApiError(400, 'REQUETE_INVALIDE', 'Invalide.'))
    expect(sansChamp.erreurs).toBeUndefined()

    const avecChamp = toProblemDetails(
      new ApiError(400, 'REQUETE_INVALIDE', 'Invalide.', [
        { champ: 'titre', code: 'CHAMP_OBLIGATOIRE', message: 'Le titre est obligatoire.' },
      ]),
    )
    expect(avecChamp.erreurs).toEqual([
      { champ: 'titre', code: 'CHAMP_OBLIGATOIRE', message: 'Le titre est obligatoire.' },
    ])

    const vide = toProblemDetails(new ApiError(400, 'REQUETE_INVALIDE', 'Invalide.', []))
    expect(vide.erreurs).toBeUndefined()
  })

  it('TC-PRB-005 — sendProblem écrit le statut, le type et le corps', () => {
    const res = fausseReponse()
    const erreur = new ApiError(403, 'JETON_CSRF_INVALIDE', 'Jeton absent.')

    sendProblem(res as unknown as Response, erreur, '/api/taches')

    expect(res.statusCode).toBe(403)
    expect(res.contentType).toBe('application/problem+json')
    expect(res.corps).toMatchObject({
      status: 403,
      code: 'JETON_CSRF_INVALIDE',
      instance: '/api/taches',
    })
  })

  it('TC-PRB-006 — l’instance provient de l’URL d’origine', () => {
    expect(instanceOf({ originalUrl: '/api/taches?page=2' } as Request)).toBe('/api/taches?page=2')
  })
})
