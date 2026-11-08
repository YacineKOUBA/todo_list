/**
 * Client HTTP de l'interface — cookie de session + jeton CSRF.
 *
 * Le cookie est `HttpOnly` : le JavaScript ne le voit jamais. Le jeton CSRF,
 * lui, est demandé à `GET /auth/csrf` après connexion et renvoyé dans
 * l'en-tête `x-csrf-token` pour toute écriture.
 */

export interface FieldError {
  champ: string
  code: string
  message: string
}

export interface Problem {
  type: string
  title: string
  status: number
  code: string
  detail: string
  instance?: string
  erreurs?: FieldError[]
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly problem: Problem

  constructor(problem: Problem) {
    super(problem.detail)
    this.name = 'ApiError'
    this.status = problem.status
    this.code = problem.code
    this.problem = problem
  }

  erreurDe(champ: string): string | null {
    return this.problem.erreurs?.find((erreur) => erreur.champ === champ)?.message ?? null
  }
}

let jetonCsrf: string | null = null

export function reinitialiserCsrf(): void {
  jetonCsrf = null
}

async function chargerCsrf(): Promise<string> {
  if (jetonCsrf !== null) return jetonCsrf
  const reponse = await fetch('/api/v1/auth/csrf', { credentials: 'same-origin' })
  if (!reponse.ok) throw new Error('Jeton CSRF indisponible')
  const corps = (await reponse.json()) as { jeton: string }
  jetonCsrf = corps.jeton
  return jetonCsrf
}

const METHODES_SURES = new Set(['GET', 'HEAD', 'OPTIONS'])
/**
 * La connexion est la seule écriture sans session : demander un jeton CSRF
 * à ce moment-là renverrait 401 (le point d'entrée `/auth/csrf` est protégé).
 */
const CHEMINS_SANS_CSRF = new Set(['/auth/login'])

export async function api<T>(chemin: string, options: RequestInit = {}): Promise<T> {
  const methode = (options.method ?? 'GET').toUpperCase()
  const entetes = new Headers(options.headers)
  if (options.body !== undefined && !entetes.has('content-type')) {
    entetes.set('content-type', 'application/json')
  }
  if (!METHODES_SURES.has(methode) && !CHEMINS_SANS_CSRF.has(chemin)) {
    entetes.set('x-csrf-token', await chargerCsrf())
  }

  const reponse = await fetch(`/api/v1${chemin}`, {
    ...options,
    method: methode,
    headers: entetes,
    credentials: 'same-origin',
  })

  if (reponse.status === 204) return undefined as T

  const type = reponse.headers.get('content-type') ?? ''
  if (!reponse.ok) {
    // Session expirée côté serveur (redémarrage, purge) : l'interface doit
    // revenir à l'écran de connexion au lieu d'afficher une erreur générique.
    if (reponse.status === 401 && !CHEMINS_SANS_CSRF.has(chemin) && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('gd:session-expiree'))
    }
    if (type.includes('application/problem+json')) {
      const probleme = (await reponse.json()) as Problem
      if (probleme.code === 'JETON_CSRF_INVALIDE') reinitialiserCsrf()
      throw new ApiError(probleme)
    }
    throw new ApiError({
      type: 'about:blank',
      title: 'Erreur',
      status: reponse.status,
      code: 'ERREUR_INTERNE',
      detail: 'Une erreur inattendue est survenue.',
    })
  }

  return (await reponse.json()) as T
}
