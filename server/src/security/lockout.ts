/**
 * Verrouillage par compte — D78, docs/12 §5.1.
 *
 * Règles pures : 5 échecs consécutifs → verrouillage 15 minutes. Un compte
 * verrouillé ne compte pas de nouvelle tentative, même si le mot de passe est
 * correct. À l'expiration, le compteur est remis à zéro avant d'évaluer la
 * tentative suivante.
 */

export interface LockoutPolicy {
  maxAttempts: number
  lockMinutes: number
}

export const POLITIQUE_VERROUILLAGE: Readonly<LockoutPolicy> = {
  maxAttempts: 5,
  lockMinutes: 15,
}

export interface LockoutState {
  tentativesEchouees: number
  verrouilleJusqua: Date | null
}

export const ETAT_INITIAL: Readonly<LockoutState> = {
  tentativesEchouees: 0,
  verrouilleJusqua: null,
}

/** Verrouillage expiré → compteur et verrou effacés. */
export function normalizeLockout(state: LockoutState, maintenant: Date): LockoutState {
  if (state.verrouilleJusqua === null) return state
  if (maintenant.getTime() < state.verrouilleJusqua.getTime()) return state
  return { tentativesEchouees: 0, verrouilleJusqua: null }
}

export function isLocked(state: LockoutState, maintenant: Date): boolean {
  return state.verrouilleJusqua !== null && maintenant.getTime() < state.verrouilleJusqua.getTime()
}

export interface FailedAttemptResult {
  etat: LockoutState
  /** Vrai si le compte est verrouillé après cette tentative. */
  verrouille: boolean
  /** Vrai au moment précis où le seuil est atteint (audit `VERROUILLAGE`). */
  verrouillageDeclenche: boolean
}

export function registerFailedAttempt(
  state: LockoutState,
  maintenant: Date,
  politique: LockoutPolicy = POLITIQUE_VERROUILLAGE,
): FailedAttemptResult {
  // Pendant un verrouillage actif : aucune tentative n'est comptée.
  if (isLocked(state, maintenant)) {
    return { etat: state, verrouille: true, verrouillageDeclenche: false }
  }

  const courant = normalizeLockout(state, maintenant)
  const tentatives = courant.tentativesEchouees + 1

  if (tentatives >= politique.maxAttempts) {
    const verrouilleJusqua = new Date(maintenant.getTime() + politique.lockMinutes * 60 * 1000)
    return {
      etat: { tentativesEchouees: tentatives, verrouilleJusqua },
      verrouille: true,
      verrouillageDeclenche: true,
    }
  }

  return {
    etat: { tentativesEchouees: tentatives, verrouilleJusqua: null },
    verrouille: false,
    verrouillageDeclenche: false,
  }
}

/** Connexion réussie : compteur et verrou remis à zéro. */
export function registerSuccessfulLogin(): LockoutState {
  return { tentativesEchouees: 0, verrouilleJusqua: null }
}
