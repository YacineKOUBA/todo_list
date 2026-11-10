import type { TacheListe } from '../types'
import { formatDate } from '../utils/format'
import { StatusBadge } from './StatusBadge'

const FREQUENCES: Record<NonNullable<TacheListe['frequence']>, string> = {
  QUOTIDIENNE: 'Quotidienne',
  HEBDOMADAIRE: 'Hebdomadaire',
  MENSUELLE: 'Mensuelle',
  TRIMESTRIELLE: 'Trimestrielle',
  ANNUELLE: 'Annuelle',
}

export function frequenceLibelle(
  frequence: NonNullable<TacheListe['frequence']>,
): string {
  return FREQUENCES[frequence]
}

function classePriorite(code: TacheListe['priorite']['code']): string {
  return `etiquette etiquette--${code.slice(0, 2).toLowerCase()}`
}

function classeProgression(tache: TacheListe): string {
  if (tache.estEnRetard) return 'progression progression--retard'
  if (tache.statut.code === 'ACHEVEE') return 'progression progression--terminee'
  if (tache.statut.code === 'SUSPENDUE') return 'progression progression--suspendue'
  if (tache.statut.code === 'ANNULEE') return 'progression progression--annulee'
  return 'progression'
}

export function TaskCard({
  tache,
  onOuvrir,
  estAdmin = false,
}: {
  tache: TacheListe
  onOuvrir: (id: string) => void
  estAdmin?: boolean
}) {
  return (
    <article className={`carte ${tache.estEnRetard ? 'carte--alerte' : ''}`}>
      <div className="carte__ligne">
        <button
          type="button"
          className="carte__titre"
          title={tache.libelle}
          onClick={() => onOuvrir(tache.id)}
        >
          {tache.libelle}
        </button>
        <StatusBadge statut={tache.statut} />
      </div>

      <div className="carte__meta">
        <span className={classePriorite(tache.priorite.code)} title={tache.priorite.libelle}>
          {tache.priorite.libelle}
        </span>
        {tache.isSupplementaire && (
          <span className="badge badge--supplementaire" title="Tâche supplémentaire">
            Suppl.
          </span>
        )}
        <span>{tache.typeTache === 'RECURRENTE' ? 'Tâche récurrente' : 'Tâche simple'}</span>
        {tache.typeTache === 'RECURRENTE' && tache.frequence !== null && (
          <span className="badge badge--frequence" title={`Fréquence : ${frequenceLibelle(tache.frequence)}`}>
            {frequenceLibelle(tache.frequence)}
          </span>
        )}
        <span>
          Échéance :{' '}
          <strong>
            {formatDate(
              tache.typeTache === 'RECURRENTE' && tache.frequence === 'QUOTIDIENNE'
                ? tache.dateAction
                : tache.dateFinPrevue,
            )}
          </strong>
        </span>
        <span>Assignée à {tache.assigneA.libelle}</span>
        {tache.servicePorteur !== null && <span>Service : {tache.servicePorteur.libelle}</span>}
        {tache.retard.enRetard && (
          <span className="alerte">
            Retard : {tache.retard.joursRetard} j
            {tache.retard.justificationRequise ? ' · justification attendue' : ''}
          </span>
        )}
        {tache.checklist.total > 0 && (
          <span
            className="badge badge--checklist"
            title={
              tache.checklist.statut === 'VALIDEE'
                ? 'Checklist validée'
                : tache.checklist.statut === 'SOUMISE'
                  ? 'Checklist en attente de validation'
                  : 'Checklist en brouillon'
            }
          >
            {tache.checklist.cochees}/{tache.checklist.total}
          </span>
        )}
        {estAdmin && tache.checklist.statut === 'SOUMISE' && (
          <span className="alerte">Checklist à valider</span>
        )}
        {tache.score !== undefined && <span>Score : {tache.score}/100</span>}
        {tache.rappelEchu && <span className="alerte">Rappel échu</span>}
        {!tache.rappelEchu && tache.rappelImminent && (
          <span className="avertissement">Rappel dans moins de 5 jours</span>
        )}
      </div>

      {tache.retard.enRetard && tache.retard.justificationRequise && (
        <p className="bandeau-retard" role="status">
          Motif de retard requis
        </p>
      )}

      <div
        className={classeProgression(tache)}
        aria-label={`Progression ${tache.progression ?? 0} %`}
      >
        <div className="progression__barre">
          <div
            className="progression__valeur"
            style={{ width: `${String(tache.progression ?? 0)}%` }}
          />
        </div>
        <span className="progression__texte">
          {tache.progression === null ? '—' : `${String(tache.progression)} %`}
        </span>
      </div>

      {tache.dateRappel !== null && (
        <p className="carte__rappel">Rappel prévu le {formatDate(tache.dateRappel)}</p>
      )}
    </article>
  )
}
