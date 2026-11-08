import { useState, type FormEvent } from 'react'
import { api, ApiError } from '../api'
import type { Me } from '../types'

interface ChangePasswordProps {
  me: Me
  onChanged: (me: Me) => void
  onLogout: () => void
}

/** Changement obligatoire du mot de passe temporaire (EF-09). */
export function ChangePassword({ me, onChanged, onLogout }: ChangePasswordProps) {
  const [ancien, setAncien] = useState('')
  const [nouveau, setNouveau] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState(false)

  async function soumettre(evenement: FormEvent): Promise<void> {
    evenement.preventDefault()
    setErreur(null)
    if (nouveau !== confirmation) {
      setErreur('La confirmation ne correspond pas au nouveau mot de passe.')
      return
    }
    setEnvoi(true)
    try {
      await api<void>('/auth/password', {
        method: 'POST',
        body: JSON.stringify({ ancienMotDePasse: ancien, nouveauMotDePasse: nouveau }),
      })
      const rafraichi = await api<Me>('/me')
      onChanged(rafraichi)
    } catch (probleme) {
      setErreur(
        probleme instanceof ApiError
          ? (probleme.erreurDe('nouveauMotDePasse') ??
              probleme.erreurDe('ancienMotDePasse') ??
              probleme.problem.detail)
          : 'Changement de mot de passe impossible.',
      )
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <div className="connexion">
      <section className="connexion__panneau">
        <div className="connexion__marque">
          <span className="entete__logo entete__logo--grand" aria-hidden="true">
            GD
          </span>
          <h1>GD TRADING</h1>
          <p>Suivi des tâches</p>
        </div>

        <form className="formulaire" onSubmit={(evenement) => void soumettre(evenement)}>
          <h2>Nouveau mot de passe</h2>
          <p className="page-sous-titre">
            Bonjour {me.employe?.prenom ?? me.utilisateur.identifiant}. Votre mot de passe temporaire doit
            être remplacé avant d’accéder à l’application (12 caractères minimum, différent de
            l’identifiant).
          </p>

          <label htmlFor="ancienMotDePasse">Mot de passe temporaire</label>
          <input
            id="ancienMotDePasse"
            type="password"
            autoComplete="current-password"
            value={ancien}
            onChange={(evenement) => setAncien(evenement.target.value)}
            required
          />

          <label htmlFor="nouveauMotDePasse">Nouveau mot de passe</label>
          <input
            id="nouveauMotDePasse"
            type="password"
            autoComplete="new-password"
            value={nouveau}
            onChange={(evenement) => setNouveau(evenement.target.value)}
            required
          />

          <label htmlFor="confirmation">Confirmer le nouveau mot de passe</label>
          <input
            id="confirmation"
            type="password"
            autoComplete="new-password"
            value={confirmation}
            onChange={(evenement) => setConfirmation(evenement.target.value)}
            required
          />

          {erreur !== null && (
            <p className="message message--erreur" role="alert">
              {erreur}
            </p>
          )}

          <button type="submit" className="bouton bouton--principal" disabled={envoi}>
            {envoi ? 'Enregistrement…' : 'Enregistrer le nouveau mot de passe'}
          </button>
          <button type="button" className="bouton" onClick={onLogout} disabled={envoi}>
            Se déconnecter
          </button>
        </form>
      </section>
    </div>
  )
}
