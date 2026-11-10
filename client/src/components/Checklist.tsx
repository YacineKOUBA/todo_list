import { useState } from 'react'
import { api, ApiError } from '../api'
import type { Me, TacheDetail } from '../types'
import { formatDate } from '../utils/format'

const LIBELLES_STATUT: Record<TacheDetail['checklist']['statut'], string> = {
  BROUILLON: 'Brouillon',
  SOUMISE: 'En attente de validation',
  VALIDEE: 'Validée',
}

interface ChecklistProps {
  tache: TacheDetail
  me: Me
  onRecharger: () => Promise<void>
  onMessage: (message: string) => void
  onErreur: (message: string) => void
  enCours: boolean
  setEnCours: (valeur: boolean) => void
}

export function Checklist({
  tache,
  me,
  onRecharger,
  onMessage,
  onErreur,
  enCours,
  setEnCours,
}: ChecklistProps) {
  const [ajout, setAjout] = useState('')
  const [motifRenvoi, setMotifRenvoi] = useState('')
  const [editionId, setEditionId] = useState<string | null>(null)
  const [editionLibelle, setEditionLibelle] = useState('')

  const statut = tache.checklist.statut
  const total = tache.checklist.total
  const cochees = tache.checklist.cochees
  const estAdmin = me.utilisateur.role === 'ADMIN'
  const consultant = me.utilisateur.role === 'CONSULTANT'
  const estExecutant = tache.isSupplementaire
    ? tache.creePar.id === me.utilisateur.id
    : me.employe !== null && tache.assigneA.type === 'EMPLOYE' && tache.assigneA.id === me.employe.id
  const peutStructurer =
    !consultant &&
    statut !== 'VALIDEE' &&
    (statut === 'BROUILLON' ? estExecutant : estAdmin)
  const peutCocher = !consultant && statut === 'VALIDEE' && (estExecutant || estAdmin)
  const peutSoumettre = statut === 'BROUILLON' && estExecutant && total > 0
  const peutValider = statut === 'SOUMISE' && estAdmin

  async function executer(action: () => Promise<unknown>, message: string): Promise<void> {
    setEnCours(true)
    try {
      await action()
      onMessage(message)
      await onRecharger()
    } catch (probleme) {
      onErreur(probleme instanceof ApiError ? probleme.problem.detail : 'L’action a échoué.')
    } finally {
      setEnCours(false)
    }
  }

  function reordonner(index: number, decalage: number): void {
    const ids = tache.sousTaches.map((sousTache) => sousTache.id)
    const cible = index + decalage
    if (cible < 0 || cible >= ids.length) return
    const [deplacee] = ids.splice(index, 1)
    ids.splice(cible, 0, deplacee!)
    void executer(
      () => api(`/tasks/${tache.id}/checklist/ordre`, { method: 'PUT', body: JSON.stringify({ ids }) }),
      'Checklist réordonnée.',
    )
  }

  function infobulleCoche(sousTache: TacheDetail['sousTaches'][number]): string | undefined {
    if (sousTache.cochee) {
      const auteur = sousTache.cocheePar?.nomComplet ?? ''
      const date = sousTache.dateCochee === null ? '' : formatDate(sousTache.dateCochee.slice(0, 10))
      return `Cochée le ${date}${auteur === '' ? '' : ` par ${auteur}`}`
    }
    return statut === 'SOUMISE' ? 'En attente de validation par l’administrateur' : undefined
  }

  return (
    <section className="encart checklist">
      <div className="checklist__entete">
        <h2>Checklist</h2>
        <span className={`badge-checklist badge-checklist--${statut.toLowerCase()}`}>
          {LIBELLES_STATUT[statut]}
        </span>
        <span className="checklist__compteur">
          {cochees}/{total}
        </span>
      </div>

      {tache.motifRenvoiChecklist !== null && statut === 'BROUILLON' && (
        <p className="message message--avertissement" role="status">
          Renvoyée pour correction : {tache.motifRenvoiChecklist}
        </p>
      )}

      {tache.progressionSurchargee && statut === 'VALIDEE' && total > 0 && (
        <p className="checklist__suggestion">
          Progression calculée : {Math.round((cochees / total) * 100)} % (surcharge manuelle prioritaire)
        </p>
      )}

      {total === 0 ? (
        <p className="checklist__vide">Aucune sous-tâche.</p>
      ) : (
        <ul className="checklist__liste">
          {tache.sousTaches.map((sousTache, index) => (
            <li key={sousTache.id} className="checklist__item">
              <input
                type="checkbox"
                checked={sousTache.cochee}
                disabled={!peutCocher || enCours}
                title={infobulleCoche(sousTache)}
                aria-label={sousTache.libelle}
                onChange={() =>
                  void executer(
                    () =>
                      api(`/tasks/${tache.id}/checklist/${sousTache.id}/coche`, {
                        method: 'PATCH',
                        body: JSON.stringify({ cochee: !sousTache.cochee }),
                      }),
                    sousTache.cochee ? 'Sous-tâche décochée.' : 'Sous-tâche cochée.',
                  )
                }
              />
              {editionId === sousTache.id ? (
                <span className="checklist__edition">
                  <input
                    value={editionLibelle}
                    onChange={(evenement) => setEditionLibelle(evenement.target.value)}
                    aria-label="Nouveau libellé"
                  />
                  <button
                    type="button"
                    className="bouton bouton--petit"
                    disabled={enCours || editionLibelle.trim().length < 3}
                    onClick={() =>
                      void executer(async () => {
                        await api(`/tasks/${tache.id}/checklist/${sousTache.id}`, {
                          method: 'PATCH',
                          body: JSON.stringify({ libelle: editionLibelle.trim() }),
                        })
                        setEditionId(null)
                      }, 'Sous-tâche renommée.')
                    }
                  >
                    OK
                  </button>
                  <button type="button" className="bouton bouton--petit" onClick={() => setEditionId(null)}>
                    Annuler
                  </button>
                </span>
              ) : (
                <span className={sousTache.cochee ? 'checklist__libelle checklist__libelle--cochee' : 'checklist__libelle'}>
                  {sousTache.libelle}
                </span>
              )}
              {peutStructurer && editionId !== sousTache.id && (
                <span className="checklist__actions">
                  <button
                    type="button"
                    className="bouton bouton--petit"
                    disabled={enCours || index === 0}
                    aria-label="Monter"
                    onClick={() => reordonner(index, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="bouton bouton--petit"
                    disabled={enCours || index === total - 1}
                    aria-label="Descendre"
                    onClick={() => reordonner(index, 1)}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="bouton bouton--petit"
                    disabled={enCours}
                    onClick={() => {
                      setEditionId(sousTache.id)
                      setEditionLibelle(sousTache.libelle)
                    }}
                  >
                    Renommer
                  </button>
                  <button
                    type="button"
                    className="bouton bouton--petit bouton--danger"
                    disabled={enCours}
                    onClick={() =>
                      void executer(
                        () =>
                          api(`/tasks/${tache.id}/checklist/${sousTache.id}`, { method: 'DELETE' }),
                        'Sous-tâche supprimée.',
                      )
                    }
                  >
                    Supprimer
                  </button>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {peutStructurer && (
        <form
          className="checklist__ajout"
          onSubmit={(evenement) => {
            evenement.preventDefault()
            const libelle = ajout.trim()
            if (libelle.length < 3) return
            void executer(async () => {
              await api(`/tasks/${tache.id}/checklist`, {
                method: 'POST',
                body: JSON.stringify({ libelle }),
              })
              setAjout('')
            }, 'Sous-tâche ajoutée.')
          }}
        >
          <input
            value={ajout}
            onChange={(evenement) => setAjout(evenement.target.value)}
            placeholder="Ajouter une sous-tâche puis Entrée"
            aria-label="Ajouter une sous-tâche"
          />
          <button
            type="submit"
            className="bouton bouton--petit"
            disabled={enCours || ajout.trim().length < 3}
          >
            Ajouter
          </button>
        </form>
      )}

      {peutSoumettre && (
        <button
          type="button"
          className="bouton bouton--principal"
          disabled={enCours || total === 0}
          onClick={() =>
            void executer(
              () =>
                api(`/tasks/${tache.id}/checklist/soumettre`, {
                  method: 'POST',
                  body: JSON.stringify({ version: tache.version }),
                }),
              'Checklist soumise.',
            )
          }
        >
          Soumettre la checklist
        </button>
      )}

      {peutValider && (
        <div className="checklist__validation">
          <div className="boutons-ligne">
            <button
              type="button"
              className="bouton bouton--principal"
              disabled={enCours}
              onClick={() =>
                void executer(
                  () =>
                    api(`/tasks/${tache.id}/checklist/valider`, {
                      method: 'POST',
                      body: JSON.stringify({ version: tache.version }),
                    }),
                  'Checklist validée.',
                )
              }
            >
              Valider la checklist
            </button>
          </div>
          <div className="champ-ligne">
            <label htmlFor="motifRenvoi">Motif de renvoi (obligatoire pour renvoyer)</label>
            <textarea
              id="motifRenvoi"
              value={motifRenvoi}
              onChange={(evenement) => setMotifRenvoi(evenement.target.value)}
              rows={2}
            />
          </div>
          <button
            type="button"
            className="bouton"
            disabled={enCours || motifRenvoi.trim().length < 3}
            onClick={() =>
              void executer(async () => {
                await api(`/tasks/${tache.id}/checklist/renvoyer`, {
                  method: 'POST',
                  body: JSON.stringify({ version: tache.version, motif: motifRenvoi.trim() }),
                })
                setMotifRenvoi('')
              }, 'Checklist renvoyée pour correction.')
            }
          >
            Renvoyer pour correction
          </button>
        </div>
      )}
    </section>
  )
}
