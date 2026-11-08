import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

/**
 * Vérifie la chaîne de test React (Vite + Testing Library + jest-dom)
 * sans aucun composant applicatif.
 */
function Exemple({ texte }: { texte: string }) {
  return <p>{texte}</p>
}

describe('harnais de rendu React', () => {
  it('affiche un composant et applique les matchers jest-dom', () => {
    render(<Exemple texte="Socle de tests GD Trading" />)

    const paragraphe = screen.getByText('Socle de tests GD Trading')
    expect(paragraphe).toBeInTheDocument()
    expect(paragraphe).toBeVisible()
  })
})
