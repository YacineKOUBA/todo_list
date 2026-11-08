import type { Express } from 'express'
import request from 'supertest'

/**
 * Point d'entrée unique des tests HTTP.
 *
 * Les tests d'intégration importent l'application Express réelle
 * (`src/http/app.ts`) dès qu'elle existera, puis appellent `api(app)`.
 * Aucun port réseau n'est ouvert : Supertest dialogue avec l'application
 * en mémoire.
 */
export function api(app: Express) {
  return request(app)
}
