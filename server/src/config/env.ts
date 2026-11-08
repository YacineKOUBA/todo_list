/**
 * Configuration de l'application — T13-10, docs/12 §8.
 *
 * Toutes les variables sont validées au démarrage par Zod. Une variable
 * obligatoire absente ou invalide **empêche le démarrage**. Les messages
 * d'erreur ne contiennent jamais la valeur d'un secret.
 */

import { z } from 'zod'

const booleen = z.enum(['true', 'false']).transform((valeur) => valeur === 'true')

const port = z.coerce.number().int().min(1).max(65_535)

const urlPostgres = z
  .string()
  .min(1)
  .refine((valeur) => valeur.startsWith('postgresql://') || valeur.startsWith('postgres://'), {
    message: 'doit commencer par postgresql:// ou postgres://',
  })

const fuseauValide = z
  .string()
  .min(1)
  .refine(
    (valeur) => {
      try {
        new Intl.DateTimeFormat('fr-FR', { timeZone: valeur })
        return true
      } catch {
        return false
      }
    },
    { message: 'fuseau IANA inconnu' },
  )

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']),
    PORT: port,
    DATABASE_URL: urlPostgres,
    SESSION_SECRET: z.string().min(1),
    APP_ORIGIN: z.url(),
    COOKIE_SECURE: booleen,
    SESSION_IDLE_MINUTES: z.coerce.number().int().min(1).max(1440).default(30),
    SESSION_ABSOLUTE_HOURS: z.coerce.number().int().min(1).max(168).default(10),
    LOGIN_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(100).default(5),
    LOGIN_LOCK_MINUTES: z.coerce.number().int().min(1).max(1440).default(15),
    RATE_LIMIT_LOGIN: z.coerce.number().int().min(1).max(10_000).default(10),
    RATE_LIMIT_GLOBAL: z.coerce.number().int().min(1).max(100_000).default(100),
    TRUST_PROXY: z
      .enum(['true', 'false'])
      .default('false')
      .transform((v) => v === 'true'),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
    TZ: fuseauValide,
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== 'production') return

    if (Buffer.byteLength(env.SESSION_SECRET, 'utf8') < 32) {
      ctx.addIssue({
        code: 'custom',
        path: ['SESSION_SECRET'],
        message: 'doit faire au moins 32 octets en production',
      })
    }

    const secretFaible = /(dev-secret|change[-_]?me|a-remplacer|exemple|example|motdepasse)/i
    if (secretFaible.test(env.SESSION_SECRET)) {
      ctx.addIssue({
        code: 'custom',
        path: ['SESSION_SECRET'],
        message: 'ne doit pas être une valeur de développement ou d’exemple',
      })
    }

    if (!env.COOKIE_SECURE) {
      ctx.addIssue({
        code: 'custom',
        path: ['COOKIE_SECURE'],
        message: 'doit valoir true en production',
      })
    }

    if (!env.APP_ORIGIN.startsWith('https://')) {
      ctx.addIssue({
        code: 'custom',
        path: ['APP_ORIGIN'],
        message: 'doit commencer par https:// en production',
      })
    }
  })

export type Env = z.infer<typeof envSchema>

export class ConfigurationError extends Error {
  readonly problemes: readonly string[]

  constructor(problemes: readonly string[]) {
    super(`Configuration invalide :\n- ${problemes.join('\n- ')}`)
    this.name = 'ConfigurationError'
    this.problemes = problemes
  }
}

/**
 * Valide la configuration. Les valeurs ne sont jamais recopiées dans l'erreur
 * (elles peuvent contenir un secret).
 */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const resultat = envSchema.safeParse(source)
  if (resultat.success) return resultat.data

  const problemes = resultat.error.issues.map((issue) => {
    const chemin = issue.path.join('.')
    return chemin.length > 0 ? `${chemin} : ${issue.message}` : issue.message
  })
  throw new ConfigurationError(problemes)
}
