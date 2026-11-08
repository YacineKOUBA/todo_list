import { useState, type FormEvent } from 'react'
import { api, ApiError } from '../api'
import type { Me } from '../types'

export function Login({ onLogin }: { onLogin: (me: Me) => void }) {
  const [identifiant, setIdentifiant] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState(false)

  async function soumettre(evenement: FormEvent): Promise<void> {
    evenement.preventDefault()
    setErreur(null)
    setEnvoi(true)
    try {
      const me = await api<Me>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifiant, motDePasse }),
      })
      onLogin(me)
    } catch (probleme) {
      setErreur(
        probleme instanceof ApiError
          ? probleme.problem.detail
          : 'Connexion impossible. Vérifiez que le serveur est démarré.',
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
          <h2>Connexion</h2>

          <label htmlFor="identifiant">Identifiant</label>
          <input
            id="identifiant"
            name="identifiant"
            autoComplete="username"
            value={identifiant}
            onChange={(evenement) => setIdentifiant(evenement.target.value)}
            required
          />

          <label htmlFor="motDePasse">Mot de passe</label>
          <input
            id="motDePasse"
            name="motDePasse"
            type="password"
            autoComplete="current-password"
            value={motDePasse}
            onChange={(evenement) => setMotDePasse(evenement.target.value)}
            required
          />

          {erreur !== null && (
            <p className="message message--erreur" role="alert">
              {erreur}
            </p>
          )}

          <button type="submit" className="bouton bouton--principal" disabled={envoi}>
            {envoi ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </section>
    </div>
  )
}
