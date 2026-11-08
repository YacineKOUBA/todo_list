import { useEffect, useRef } from 'react'

export type TypeToast = 'succes' | 'erreur'

interface ToastProps {
  message: string
  type?: TypeToast
  onFermer: () => void
}

/** Notification éphémère affichée 4 secondes après une action. */
export function Toast({ message, type = 'succes', onFermer }: ToastProps) {
  const fermer = useRef(onFermer)

  useEffect(() => {
    fermer.current = onFermer
  }, [onFermer])

  useEffect(() => {
    const minuteur = window.setTimeout(() => fermer.current(), 4000)
    return () => window.clearTimeout(minuteur)
  }, [message])

  return (
    <div className="toasts">
      <div className={`toast toast--${type}`} role="status" aria-live="polite">
        <span>{message}</span>
        <button
          type="button"
          className="toast__fermer"
          aria-label="Fermer la notification"
          onClick={onFermer}
        >
          ✕
        </button>
      </div>
    </div>
  )
}
