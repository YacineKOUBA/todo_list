/**
 * En-têtes de sécurité — T13-08, docs/12 §9.
 *
 * Helmet avec une CSP stricte en production, assouplie uniquement en
 * développement pour le rechargement à chaud Vite. Aucun CORS n'est ajouté.
 */

import helmet from 'helmet'
import type { Express, RequestHandler } from 'express'

export interface SecurityHeadersOptions {
  production: boolean
}

const DIRECTIVES_PRODUCTION = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'"],
  styleSrc: ["'self'"],
  imgSrc: ["'self'", 'data:'],
  fontSrc: ["'self'"],
  connectSrc: ["'self'"],
  objectSrc: ["'none'"],
  baseUri: ["'self'"],
  formAction: ["'self'"],
  frameAncestors: ["'none'"],
  upgradeInsecureRequests: [],
} as const

const DIRECTIVES_DEVELOPPEMENT = {
  ...DIRECTIVES_PRODUCTION,
  // Rechargement à chaud Vite uniquement — jamais en production.
  scriptSrc: ["'self'", "'unsafe-inline'"],
  styleSrc: ["'self'", "'unsafe-inline'"],
  connectSrc: ["'self'", 'ws:'],
  upgradeInsecureRequests: null,
} as const

export const PERMISSIONS_POLICY = 'camera=(), microphone=(), geolocation=(), payment=()'

/**
 * Désactive les en-têtes qui ne doivent pas être exposés par l'application.
 * À appeler avant l'enregistrement des routes.
 */
export function configureExpressSecurity(app: Express): void {
  app.disable('x-powered-by')
  app.set('etag', false)
}

export function securityHeaders(options: SecurityHeadersOptions): RequestHandler {
  const helmetMiddleware = helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: options.production ? DIRECTIVES_PRODUCTION : DIRECTIVES_DEVELOPPEMENT,
    },
    crossOriginEmbedderPolicy: false,
    hsts: options.production ? { maxAge: 31_536_000, includeSubDomains: true } : false,
    frameguard: { action: 'deny' },
    referrerPolicy: { policy: 'no-referrer' },
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'same-origin' },
  })

  return (req, res, next) => {
    helmetMiddleware(req, res, (erreur?: unknown) => {
      if (erreur !== undefined) {
        next(erreur)
        return
      }
      res.removeHeader('X-Powered-By')
      res.setHeader('Permissions-Policy', PERMISSIONS_POLICY)
      res.setHeader('Cache-Control', 'no-store')
      next()
    })
  }
}
