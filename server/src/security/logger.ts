/**
 * Journal technique — T13-09, docs/12 §10.1.
 *
 * Aucun secret ne doit apparaître : mots de passe, hash, jetons, cookies et
 * en-têtes d'autorisation sont explicitement masqués. Le journal ne contient
 * jamais le corps des requêtes d'authentification.
 */

import { randomUUID } from 'node:crypto'
import pino from 'pino'
import type { DestinationStream, Logger, LoggerOptions } from 'pino'
import { pinoHttp } from 'pino-http'
import type { RequestHandler } from 'express'

export const CHEMINS_REDACTES: readonly string[] = [
  // Secrets plats.
  'cookie',
  'authorization',
  'motDePasse',
  'ancienMotDePasse',
  'nouveauMotDePasse',
  'motDePasseTemporaire',
  'motDePasseHash',
  'jeton',
  'jetonHash',
  // Secrets imbriqués, quel que soit le niveau d'objet.
  '*.motDePasse',
  '*.ancienMotDePasse',
  '*.nouveauMotDePasse',
  '*.motDePasseTemporaire',
  '*.motDePasseHash',
  '*.jeton',
  '*.jetonHash',
  // Requêtes et réponses HTTP.
  'req.headers.cookie',
  'req.headers.authorization',
  'res.headers["set-cookie"]',
  'req.body.motDePasse',
  'req.body.ancienMotDePasse',
  'req.body.nouveauMotDePasse',
  'req.body.motDePasseTemporaire',
]

export interface LoggerOptionsApplication {
  level: NonNullable<LoggerOptions['level']>
  /** Flux de destination (tests). Par défaut, la sortie standard. */
  destination?: DestinationStream
}

export function createLogger(options: LoggerOptionsApplication): Logger {
  const configuration: LoggerOptions = {
    level: options.level,
    base: null,
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
      paths: [...CHEMINS_REDACTES],
      censor: '[MASQUE]',
    },
  }
  return options.destination === undefined
    ? pino(configuration)
    : pino(configuration, options.destination)
}

interface RequeteAvecId {
  id?: string
}

export function createRequestLogger(logger: Logger): RequestHandler {
  return pinoHttp({
    logger,
    genReqId(req, res) {
      const id = randomUUID()
      res.setHeader('X-Request-Id', id)
      return id
    },
    customProps(req) {
      const identifiantRequete = (req as RequeteAvecId).id
      return identifiantRequete === undefined ? {} : { requestId: identifiantRequete }
    },
    serializers: {
      req(req) {
        return {
          method: req.method,
          url: req.url,
          ip: req.remoteAddress,
        }
      },
      res(res) {
        return { statusCode: res.statusCode }
      },
    },
    customLogLevel(_req, res, erreur) {
      if (erreur !== undefined && erreur !== null) return 'error'
      if (res.statusCode >= 500) return 'error'
      if (res.statusCode >= 400) return 'warn'
      return 'info'
    },
  })
}
