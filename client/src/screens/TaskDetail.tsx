import { useCallback, useEffect, useState } from 'react'
import { api, ApiError } from '../api'
import { StatusBadge } from '../components/StatusBadge'
import { Toast } from '../components/Toast'
import type { Commentaire, EvenementHistorique, Me, Page, TacheDetail } from '../types'
import { aujourdhuiIso, formatDate, formatDateTime, formatJours, joursEntre } from '../utils/format'

interface TaskDetailProps {
  me: Me
  id: string
  onRetour: () => void
  onSupprimee: () => void
}

export function TaskDetail({ me, id, onRetour, onSupprimee }: TaskDetailProps) {
  const [tache, setTache] = useState<TacheDetail | null>(null)
  const [commentaires, setCommentaires] = useState<Commentaire[]>([])
  const [historique, setHistorique] = useState<EvenementHistorique[]>([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState<string | null>(null)
  const [succes, setSucces] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)

  const [texteCommentaire, setTexteCommentaire] = useState('')
  const [progression, setProgression] = useState('')
  const [dateControle, setDateControle] = useState(aujourdhuiIso())
  const [dateFin, setDateFin] = useState(aujourdhuiIso())
  const [motif, setMotif] = useState('')
  const [motifRetard, setMotifRetard] = useState('')
  const [motifStatut, setMotifStatut] = useState('')
  const [dateFinEstimee, setDateFinEstimee] = useState(aujourdhuiIso())
  const [sansMotifConfirmation, setSansMotifConfirmation] = useState(false)
  const [confirmationSuppression, setConfirmationSuppression] = useState(false)

  const charger = useCallback(async (): Promise<void> => {
    setChargement(true)
    try {
      const detail = await api<TacheDetail>(`/tasks/${id}`)
      const [listeCommentaires, listeHistorique] = await Promise.all([
        api<Page<Commentaire>>(`/tasks/${id}/comments?taille=100`),
        api<Page<EvenementHistorique>>(`/tasks/${id}/history?taille=50`),
      ])
      setTache(detail)
      setProgression(detail.progressionManuelle === null ? '' : String(detail.progressionManuelle))
      setDateControle(detail.dateControle ?? aujourdhuiIso())
      setDateFinEstimee(detail.dateFinReelleEstimee ?? aujourdhuiIso())
      setSansMotifConfirmation(false)
      setCommentaires(listeCommentaires.elements)
      setHistorique(listeHistorique.elements)
      setErreur(null)
    } catch (probleme) {
      setErreur(
        probleme instanceof ApiError ? probleme.problem.detail : 'Impossible de charger la tâche.',
      )
    } finally {
      setChargement(false)
    }
  }, [id])

  useEffect(() => {
    void charger()
  }, [charger])

  async function executer(action: () => Promise<unknown>, message: string): Promise<void> {
    setEnCours(true)
    setErreur(null)
    setSucces(null)
    try {
      await action()
      setSucces(message)
      await charger()
    } catch (probleme) {
      setErreur(
        probleme instanceof ApiError ? probleme.problem.detail : 'L’action a échoué.',
      )
    } finally {
      setEnCours(false)
    }
  }

  if (chargement) return <p className="message">Chargement de la tâche…</p>
  if (erreur !== null && tache === null) {
    return (
      <div className="vide">
        <p className="message message--erreur" role="alert">
          {erreur}
        </p>
        <button type="button" className="bouton bouton--principal" onClick={() => void charger()}>
          Réessayer
        </button>
        <button type="button" className="bouton" onClick={onRetour}>
          Retour à la liste
        </button>
      </div>
    )
  }
  if (tache === null) return null

  const estAdmin = me.utilisateur.role === 'ADMIN'
  const estCreateur = tache.creePar.id === me.utilisateur.id
  const peutGerer =
    estAdmin ||
    (me.utilisateur.role === 'RESPONSABLE' && estCreateur) ||
    (tache.isSupplementaire && estCreateur)
  const peutEcrire = peutGerer
  const peutCommenter = !me.droits.lectureSeule
  const peutSupprimer =
    estAdmin || (me.utilisateur.role === 'RESPONSABLE' && estCreateur && !tache.isSupplementaire)
  const accentProgression = tache.estEnRetard
    ? ' progression--retard'
    : tache.statut.code === 'ACHEVEE'
      ? ' progression--terminee'
      : tache.statut.code === 'SUSPENDUE'
        ? ' progression--suspendue'
        : tache.statut.code === 'ANNULEE'
          ? ' progression--annulee'
          : ''

  const estExecutant =
    !tache.isSupplementaire &&
    me.employe !== null &&
    ((tache.assigneA.type === 'EMPLOYE' && tache.assigneA.id === me.employe.id) ||
      (tache.pilote.type === 'EMPLOYE' && tache.pilote.id === me.employe.id))
  const peutJustifier =
    !me.droits.lectureSeule &&
    !tache.isSupplementaire &&
    tache.dateFin === null &&
    tache.retardValideLe === null &&
    (estAdmin || estExecutant)
  const motifRetardAbsent = tache.motifRetard === null || tache.motifRetard.trim().length === 0
  // Durée affichée :
  // - tâche clôturée : date de fin réelle − date de début (couvre la clôture anticipée) ;
  // - tâche ouverte : échéance prévue − début + jours de retard.
  // Une tâche quotidienne n'a pas de date de fin prévue : son échéance est sa date d'action.
  const echeanceDuree = tache.dateFinPrevue ?? tache.dateAction
  const joursRetardDuree = tache.retard.enRetard ? tache.retard.joursRetard : 0
  const dureeJours =
    tache.dureeGJours === null
      ? null
      : tache.dateFin !== null
        ? joursEntre(tache.dateDebut, tache.dateFin)
        : joursEntre(tache.dateDebut, echeanceDuree) + joursRetardDuree
  const peutValider =
    !me.droits.lectureSeule &&
    !tache.isSupplementaire &&
    tache.retard.enRetard &&
    tache.retardValideLe === null &&
    (estAdmin ||
      estCreateur ||
      (me.utilisateur.role === 'RESPONSABLE' &&
        me.employe?.departement?.id !== undefined &&
        me.employe?.departement?.id === tache.servicePorteur?.id))

  return (
    <section>
      <button type="button" className="lien-retour" onClick={onRetour}>
        ← Retour
      </button>

      <header className="detail-entete">
        <div>
          <p className="detail-sur-titre">
            Tâche {tache.typeTache === 'RECURRENTE' ? 'récurrente' : 'simple'}
          </p>
          <h1>{tache.libelle}</h1>
          <div className="detail-badges">
            <StatusBadge statut={tache.statut} />
            <span className="etiquette">{tache.priorite.libelle}</span>
            {tache.estEnRetard && <span className="alerte">En retard</span>}
          </div>
        </div>
        <div className="detail-progression">
          <p>Progression</p>
          <div className={`progression__barre progression__barre--large${accentProgression}`}>
            <div
              className="progression__valeur"
              style={{ width: `${String(tache.progression ?? 0)}%` }}
            />
          </div>
          <strong>{tache.progression === null ? '—' : `${String(tache.progression)} %`}</strong>
        </div>
      </header>

      {erreur !== null && (
        <p className="message message--erreur" role="alert">
          {erreur}
        </p>
      )}
      {succes !== null && <Toast message={succes} onFermer={() => setSucces(null)} />}

      <div className="detail-grille">
        <dl>
          <dt>Élément / pilier</dt>
          <dd>{tache.element.libelle}</dd>
          <dt>Acteur</dt>
          <dd>{tache.acteur === 'GD_TRADING' ? 'GD Trading' : 'Partenaire'}</dd>
          <dt>Assignée à</dt>
          <dd>
            {tache.assigneA.libelle}
            {tache.assigneA.departement !== null ? ` · ${tache.assigneA.departement.libelle}` : ''}
          </dd>
          <dt>Pilote</dt>
          <dd>{tache.pilote.libelle}</dd>
          <dt>Service porteur</dt>
          <dd>{tache.servicePorteur?.libelle ?? '—'}</dd>
          <dt>Urgence / importance</dt>
          <dd>
            {tache.urgence.libelle} & {tache.importance.libelle}
          </dd>
          <dt>Action à prendre</dt>
          <dd>{tache.actionAPrendre?.libelle ?? '—'}</dd>
          <dt>Type de tâche</dt>
          <dd>
            {tache.typeTache === 'RECURRENTE' ? 'Tâche récurrente' : 'Tâche simple'}
            {tache.isSupplementaire ? ' · supplémentaire' : ''}
            {tache.frequence !== null ? ` · ${tache.frequence.toLowerCase()}` : ''}
          </dd>
          {tache.score !== undefined && (
            <>
              <dt>Score de performance</dt>
              <dd>{tache.score}/100</dd>
            </>
          )}
        </dl>

        <dl>
          <dt>Date d’action</dt>
          <dd>{formatDate(tache.dateAction)}</dd>
          <dt>Date de début</dt>
          <dd>{formatDate(tache.dateDebut)}</dd>
          <dt>Date de fin prévue</dt>
          <dd>{formatDate(tache.dateFinPrevue)}</dd>
          <dt>Date de fin</dt>
          <dd>{formatDate(tache.dateFin)}</dd>
          {tache.dateFinRecurrence !== null && (
            <>
              <dt>Fin de récurrence</dt>
              <dd>{formatDate(tache.dateFinRecurrence)}</dd>
            </>
          )}
          <dt>Retard</dt>
          <dd>
            {tache.retard.enRetard
              ? `${String(tache.retard.joursRetard)} jour(s)`
              : 'Aucun'}
            {tache.retard.justificationRequise && <span className="alerte"> · justification attendue</span>}
            {tache.retard.validationRequise && <span className="avertissement"> · à valider</span>}
          </dd>
          <dt>Progression</dt>
          <dd>{tache.progression === null ? '—' : `${String(tache.progression)} %`}</dd>
          <dt>Date de mise à jour</dt>
          <dd>{tache.dateControle === null ? '—' : formatDate(tache.dateControle)}</dd>
          <dt>Date de rappel</dt>
          <dd>
            {formatDate(tache.dateRappel)}
            {tache.rappelEchu && <span className="alerte"> · échu</span>}
            {!tache.rappelEchu && tache.rappelImminent && (
              <span className="avertissement"> · imminent</span>
            )}
          </dd>
          <dt>Durée G. / E.</dt>
          <dd>
            {dureeJours === null ? (
              '—'
            ) : (
              <>
                {formatJours(dureeJours)}
                {joursRetardDuree > 0 && (
                  <> (dont {formatJours(joursRetardDuree)} de retard)</>
                )}
              </>
            )}
            {tache.anomalieDuree && <span className="alerte"> · incohérence</span>}
          </dd>
          <dt>Créée par</dt>
          <dd>
            {tache.creePar.nomComplet} le {formatDateTime(tache.creeLe)}
          </dd>
          <dt>Attribuée par</dt>
          <dd>{tache.attribuePar.nomComplet}</dd>
        </dl>
      </div>

      {tache.motifNonAchevement !== null && (
        <div className="encart">
          <h2>Motif de non-achèvement</h2>
          <p>{tache.motifNonAchevement}</p>
        </div>
      )}

      {tache.motifSuspensionAnnulation !== null && (
        <div className="encart">
          <h2>Motif de suspension / annulation</h2>
          <p>{tache.motifSuspensionAnnulation}</p>
        </div>
      )}

      {(tache.motifRetard !== null || tache.retard.enRetard) && (
        <section className="encart encart--retard">
          <h2>Retard</h2>
          {tache.retard.enRetard && tache.retard.justificationRequise && (
            <p className="bandeau-retard" role="status">
              Motif de retard requis
            </p>
          )}
          {tache.retard.enRetard && (
            <p>
              Retard de <strong>{String(tache.retard.joursRetard)} jour(s)</strong>.
            </p>
          )}
          {tache.motifRetard !== null && <p>Motif : {tache.motifRetard}</p>}
          {tache.dateFinReelleEstimee !== null && (
            <p>Fin estimée : {formatDate(tache.dateFinReelleEstimee)}</p>
          )}
          {tache.retardValideLe !== null ? (
            <div>
              <p className="message message--succes">
                Retard validé le {formatDateTime(tache.retardValideLe)}.
              </p>
              {motifRetardAbsent && (
                <p className="avertissement" role="status">
                  Retard validé sans motif : la pénalité de 10 points est conservée.
                </p>
              )}
            </div>
          ) : (
            tache.retard.enRetard && <p className="avertissement">Validation du retard en attente.</p>
          )}

          {peutJustifier && (
            <div className="champ-ligne">
              <label htmlFor="motifRetard">Justification du retard</label>
              <textarea
                id="motifRetard"
                rows={3}
                value={motifRetard}
                onChange={(evenement) => setMotifRetard(evenement.target.value)}
                placeholder="Expliquez la cause du retard"
              />
              <button
                type="button"
                className="bouton"
                disabled={enCours || motifRetard.trim().length === 0}
                onClick={() =>
                  void executer(
                    () =>
                      api(`/tasks/${id}/retard`, {
                        method: 'PATCH',
                        body: JSON.stringify({
                          motifRetard,
                          version: tache.version,
                        }),
                      }),
                    'Justification enregistrée.',
                  )
                }
              >
                Justifier le retard
              </button>
            </div>
          )}

          {peutValider && (
            <div className="champ-ligne">
              <label htmlFor="dateFinEstimee">Date de fin estimée</label>
              <input
                id="dateFinEstimee"
                type="date"
                value={dateFinEstimee}
                onChange={(evenement) => setDateFinEstimee(evenement.target.value)}
              />
              {motifRetardAbsent && (
                <p className="avertissement" role="alert">
                  Aucun motif de retard n’a été saisi par l’exécutant. Valider sans motif clôture le
                  workflow mais conserve la pénalité de 10 points.
                </p>
              )}
              {motifRetardAbsent ? (
                sansMotifConfirmation ? (
                  <div className="boutons-ligne">
                    <button
                      type="button"
                      className="bouton bouton--principal"
                      disabled={enCours}
                      onClick={() =>
                        void executer(
                          () =>
                            api(`/tasks/${id}/retard/validation`, {
                              method: 'PATCH',
                              body: JSON.stringify({
                                dateFinReelleEstimee:
                                  dateFinEstimee.trim().length === 0 ? null : dateFinEstimee,
                                sansMotif: true,
                                version: tache.version,
                              }),
                            }),
                          'Retard validé sans motif : pénalité de 10 points conservée.',
                        )
                      }
                    >
                      Confirmer la validation sans motif
                    </button>
                    <button
                      type="button"
                      className="bouton"
                      disabled={enCours}
                      onClick={() => setSansMotifConfirmation(false)}
                    >
                      Annuler
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="bouton bouton--principal"
                    disabled={enCours}
                    onClick={() => setSansMotifConfirmation(true)}
                  >
                    Valider le retard
                  </button>
                )
              ) : (
                <button
                  type="button"
                  className="bouton bouton--principal"
                  disabled={enCours}
                  onClick={() =>
                    void executer(
                      () =>
                        api(`/tasks/${id}/retard/validation`, {
                          method: 'PATCH',
                          body: JSON.stringify({
                            dateFinReelleEstimee:
                              dateFinEstimee.trim().length === 0 ? null : dateFinEstimee,
                            version: tache.version,
                          }),
                        }),
                      'Retard validé.',
                    )
                  }
                >
                  Valider le retard
                </button>
              )}
            </div>
          )}
        </section>
      )}

      {(peutEcrire || estCreateur) && (
        <div className="actions-grille">
          {peutEcrire && (
            <section className="encart">
              <h2>Statut</h2>
            {estAdmin && (
              <div className="champ-ligne">
                <label htmlFor="motifStatut">Motif de suspension / annulation</label>
                <input
                  id="motifStatut"
                  value={motifStatut}
                  onChange={(evenement) => setMotifStatut(evenement.target.value)}
                  placeholder="Obligatoire pour une tâche créée par un responsable"
                />
              </div>
            )}
            <div className="boutons-ligne">
              <button
                type="button"
                className="bouton"
                disabled={enCours}
                onClick={() =>
                  void executer(
                    () =>
                      api(`/tasks/${id}/status`, {
                        method: 'PATCH',
                        body: JSON.stringify({
                          statutManuel: null,
                          motif: motifStatut.trim().length === 0 ? null : motifStatut,
                          version: tache.version,
                        }),
                      }),
                    'Statut rétabli.',
                  )
                }
              >
                Rétablir
              </button>
              <button
                type="button"
                className="bouton"
                disabled={enCours}
                onClick={() =>
                  void executer(
                    () =>
                      api(`/tasks/${id}/status`, {
                        method: 'PATCH',
                        body: JSON.stringify({
                          statutManuel: 'SUSPENDUE',
                          motif: motifStatut.trim().length === 0 ? null : motifStatut,
                          version: tache.version,
                        }),
                      }),
                    'Tâche suspendue.',
                  )
                }
              >
                Suspendre
              </button>
              <button
                type="button"
                className="bouton bouton--danger"
                disabled={enCours}
                onClick={() =>
                  void executer(
                    () =>
                      api(`/tasks/${id}/status`, {
                        method: 'PATCH',
                        body: JSON.stringify({
                          statutManuel: 'ANNULEE',
                          motif: motifStatut.trim().length === 0 ? null : motifStatut,
                          version: tache.version,
                        }),
                      }),
                    'Tâche annulée.',
                  )
                }
              >
                Annuler la tâche
              </button>
            </div>
            </section>
          )}

          <section className="encart">
            <h2>Progression proposée</h2>
            <p className="message">
              Après contrôle réel de la tâche, le créateur peut proposer une progression.
            </p>
            <div className="champ-ligne">
              <label htmlFor="dateControle">Date de mise à jour</label>
              <input
                id="dateControle"
                type="date"
                value={dateControle}
                onChange={(evenement) => setDateControle(evenement.target.value)}
              />
            </div>
            <div className="champ-ligne">
              <label htmlFor="progressionProposee">Progression proposée (%)</label>
              <input
                id="progressionProposee"
                type="number"
                min={0}
                max={100}
                value={progression}
                placeholder="—"
                onChange={(evenement) => setProgression(evenement.target.value)}
              />
            </div>
            <button
              type="button"
              className="bouton"
              disabled={enCours}
              onClick={() =>
                void executer(
                  () =>
                    api(`/tasks/${id}/progress`, {
                      method: 'PATCH',
                      body: JSON.stringify({
                        progressionManuelle:
                          progression.trim().length === 0 ? null : Number(progression),
                        dateControle: dateControle.trim().length === 0 ? null : dateControle,
                        version: tache.version,
                      }),
                    }),
                  'Progression enregistrée.',
                )
              }
            >
              Enregistrer
            </button>
          </section>

          {peutEcrire && tache.dateFin === null && (
            <section className="encart">
              <h2>Clôturer</h2>
              <div className="champ-ligne">
                <label htmlFor="dateFin">Date de fin</label>
                <input
                  id="dateFin"
                  type="date"
                  value={dateFin}
                  onChange={(evenement) => setDateFin(evenement.target.value)}
                />
              </div>
              <div className="champ-ligne">
                <label htmlFor="motif">Motif (si clôture tardive)</label>
                <input
                  id="motif"
                  value={motif}
                  onChange={(evenement) => setMotif(evenement.target.value)}
                  placeholder="Obligatoire uniquement en cas de retard"
                />
              </div>
              {tache.retard.enRetard && tache.retardValideLe === null && (
                <p className="avertissement" role="status">
                  Le retard n’est pas encore validé : validez-le dans le panneau « Retard » ci-dessus
                  (ou validez sans motif, avec conservation de la pénalité) avant de clôturer.
                </p>
              )}
              <button
                type="button"
                className="bouton bouton--principal"
                disabled={enCours}
                onClick={() =>
                  void executer(
                    () =>
                      api(`/tasks/${id}/close`, {
                        method: 'POST',
                        body: JSON.stringify({
                          dateFin,
                          motifNonAchevement: motif.trim().length === 0 ? null : motif.trim(),
                          version: tache.version,
                        }),
                      }),
                    'Tâche clôturée.',
                  )
                }
              >
                Clôturer la tâche
              </button>
            </section>
          )}

          {peutSupprimer && (
            <section className="encart encart--danger">
              <h2>Suppression</h2>
              {!confirmationSuppression ? (
                <button
                  type="button"
                  className="bouton bouton--danger"
                  onClick={() => setConfirmationSuppression(true)}
                >
                  Supprimer la tâche
                </button>
              ) : (
                <div>
                  <p>Confirmez-vous la suppression logique de cette tâche ?</p>
                  <div className="boutons-ligne">
                    <button
                      type="button"
                      className="bouton bouton--danger"
                      disabled={enCours}
                      onClick={() =>
                        void executer(async () => {
                          await api(`/tasks/${id}`, { method: 'DELETE' })
                          onSupprimee()
                        }, 'Tâche supprimée.')
                      }
                    >
                      Oui, supprimer
                    </button>
                    <button
                      type="button"
                      className="bouton"
                      onClick={() => setConfirmationSuppression(false)}
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      )}

      <section className="encart">
        <h2>Commentaires ({commentaires.length})</h2>
        {commentaires.length === 0 && <p className="message">Aucun commentaire pour l’instant.</p>}
        <ul className="commentaires">
          {commentaires.map((commentaire) => (
            <li key={commentaire.id}>
              <p className="commentaire__entete">
                <strong>{commentaire.auteur.nomComplet}</strong> · {formatDateTime(commentaire.creeLe)}
              </p>
              <p className="commentaire__texte">{commentaire.texte}</p>
            </li>
          ))}
        </ul>

        {peutCommenter && (
          <div className="champ-ligne">
            <label htmlFor="commentaire">Ajouter un commentaire</label>
            <textarea
              id="commentaire"
              rows={3}
              value={texteCommentaire}
              onChange={(evenement) => setTexteCommentaire(evenement.target.value)}
            />
            <button
              type="button"
              className="bouton"
              disabled={enCours || texteCommentaire.trim().length === 0}
              onClick={() =>
                void executer(async () => {
                  await api(`/tasks/${id}/comments`, {
                    method: 'POST',
                    body: JSON.stringify({ texte: texteCommentaire }),
                  })
                  setTexteCommentaire('')
                }, 'Commentaire ajouté.')
              }
            >
              Publier
            </button>
          </div>
        )}
      </section>

      <section className="encart">
        <h2>Historique</h2>
        {historique.length === 0 && <p className="message">Aucun événement enregistré.</p>}
        <ul className="historique">
          {historique.map((evenement) => (
            <li key={evenement.id}>
              <span className="historique__date">{formatDateTime(evenement.horodatage)}</span>
              <span className="historique__type">{evenement.typeOperation}</span>
              <span>{evenement.acteur?.nomComplet ?? 'Système'}</span>
              {evenement.champsModifies.length > 0 && (
                <span className="historique__champs">{evenement.champsModifies.join(', ')}</span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </section>
  )
}
