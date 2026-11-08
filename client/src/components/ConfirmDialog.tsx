import { useEffect } from 'react'

interface ConfirmDialogProps {
  titre: string
  message: string
  libelleConfirmer?: string
  enCours?: boolean
  onConfirmer: () => void
  onAnnuler: () => void
}

/** Confirmation d'une action destructive : Échap ou clic extérieur annulent. */
export function ConfirmDialog({
  titre,
  message,
  libelleConfirmer = 'Confirmer',
  enCours = false,
  onConfirmer,
  onAnnuler,
}: ConfirmDialogProps) {
  useEffect(() => {
    const surTouche = (evenement: KeyboardEvent): void => {
      if (evenement.key === 'Escape' && !enCours) onAnnuler()
    }
    window.addEventListener('keydown', surTouche)
    return () => window.removeEventListener('keydown', surTouche)
  }, [enCours, onAnnuler])

  return (
    <div
      className="modale"
      role="presentation"
      onMouseDown={(evenement) => {
        if (evenement.target === evenement.currentTarget && !enCours) onAnnuler()
      }}
    >
      <div
        className="modale__panneau"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modale-titre"
        aria-describedby="modale-description"
      >
        <div className="modale__entete">
          <h2 id="modale-titre">{titre}</h2>
        </div>
        <div className="modale__contenu">
          <p id="modale-description">{message}</p>
        </div>
        <div className="modale__pied">
          <button type="button" className="bouton" onClick={onAnnuler} disabled={enCours} autoFocus>
            Annuler
          </button>
          <button
            type="button"
            className="bouton bouton--danger"
            onClick={onConfirmer}
            disabled={enCours}
          >
            {libelleConfirmer}
          </button>
        </div>
      </div>
    </div>
  )
}
