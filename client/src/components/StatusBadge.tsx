import type { Statut } from '../types'

const ICONES: Record<Statut['code'], string> = {
  A_FAIRE: '○',
  EN_COURS: '▶',
  RETARD: '!',
  ACHEVEE: '✓',
  ANNULEE: '×',
  SUSPENDUE: '⏸',
}

/** Statut = libellé + icône + position, jamais la couleur seule (D23). */
export function StatusBadge({ statut }: { statut: Statut }) {
  return (
    <span className={`badge badge--${statut.code.toLowerCase()}`}>
      <span aria-hidden="true" className="badge__icone">
        {ICONES[statut.code]}
      </span>
      {statut.libelle}
      {statut.manuel && <span className="badge__note">manuel</span>}
    </span>
  )
}
