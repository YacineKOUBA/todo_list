import type { RequestHandler } from 'express'
import type { AuthSession } from './types'

function estTache(valeur: Record<string, unknown>): boolean {
  return (
    typeof valeur['id'] === 'string' &&
    typeof valeur['assigneA'] === 'object' &&
    valeur['assigneA'] !== null &&
    typeof valeur['creePar'] === 'object' &&
    valeur['creePar'] !== null
  )
}

function nettoyer(
  valeur: unknown,
  auth: AuthSession,
  createurAutorise: boolean | null,
): unknown {
  if (Array.isArray(valeur)) {
    return valeur.map((element) => nettoyer(element, auth, createurAutorise))
  }
  if (typeof valeur !== 'object' || valeur === null) return valeur

  const objet = valeur as Record<string, unknown>
  let autorise = createurAutorise
  if (estTache(objet)) {
    const creePar = objet['creePar'] as Record<string, unknown>
    autorise = auth.utilisateur.role === 'ADMIN' || creePar['id'] === auth.utilisateur.id
  }

  const copie: Record<string, unknown> = {}
  for (const [cle, contenu] of Object.entries(objet)) {
    if (autorise === false && cle.toLowerCase().includes('score')) continue
    copie[cle] = nettoyer(contenu, auth, autorise)
  }
  return copie
}

export const masquerScore: RequestHandler = (req, res, next) => {
  const auth = req.auth
  if (auth === undefined) {
    next()
    return
  }
  const json = res.json.bind(res)
  res.json = ((corps: unknown) => json(nettoyer(corps, auth, null))) as typeof res.json
  next()
}
