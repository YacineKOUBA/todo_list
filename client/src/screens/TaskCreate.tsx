import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { api, ApiError } from '../api'
import type {
  Employe,
  Element,
  Importance,
  LigneMatrice,
  Me,
  Page,
  Partenaire,
  TacheDetail,
  Urgence,
} from '../types'
import { ajouterJours, aujourdhuiIso } from '../utils/format'

interface TaskCreateProps {
  me: Me
  onCree: (id: string) => void
  onAnnuler: () => void
}

interface Referentiels {
  employes: Employe[]
  elements: Element[]
  partenaires: Partenaire[]
  urgences: Urgence[]
  importances: Importance[]
  matrice: LigneMatrice[]
}

export function TaskCreate({ me, onCree, onAnnuler }: TaskCreateProps) {
  const estEmploye = me.utilisateur.role === 'EMPLOYE'
  const peutSupplementaire = me.utilisateur.role !== 'CONSULTANT'
  const [supplementaire, setSupplementaire] = useState(estEmploye)
  const [referentiels, setReferentiels] = useState<Referentiels | null>(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState<ApiError | Error | null>(null)
  const [envoi, setEnvoi] = useState(false)

  const [typeTache, setTypeTache] = useState<'SIMPLE' | 'RECURRENTE'>('SIMPLE')
  const [frequence, setFrequence] = useState<
    'QUOTIDIENNE' | 'HEBDOMADAIRE' | 'MENSUELLE' | 'TRIMESTRIELLE' | 'ANNUELLE'
  >('HEBDOMADAIRE')
  const [dateFinRecurrence, setDateFinRecurrence] = useState(ajouterJours(aujourdhuiIso(), 90))
  // La nature découle du type : une récurrence quotidienne est une tâche du jour,
  // tout le reste est planifié avec une échéance.
  const nature: 'AUTRE' | 'QUOTIDIENNE' =
    !supplementaire && typeTache === 'RECURRENTE' && frequence === 'QUOTIDIENNE'
      ? 'QUOTIDIENNE'
      : 'AUTRE'
  const [libelle, setLibelle] = useState('')
  const [elementId, setElementId] = useState('')
  const [acteur, setActeur] = useState<'GD_TRADING' | 'PARTENAIRE'>('GD_TRADING')
  const [assigneAEmployeId, setAssigneAEmployeId] = useState(me.employe?.id ?? '')
  const [assigneAPartenaireId, setAssigneAPartenaireId] = useState('')
  const [piloteType, setPiloteType] = useState<'EMPLOYE' | 'PARTENAIRE'>('EMPLOYE')
  const [piloteEmployeId, setPiloteEmployeId] = useState(me.employe?.id ?? '')
  const [pilotePartenaireId, setPilotePartenaireId] = useState('')
  const [dateAction, setDateAction] = useState(aujourdhuiIso())
  const [dateDebut, setDateDebut] = useState(aujourdhuiIso())
  const [dateFinPrevue, setDateFinPrevue] = useState(ajouterJours(aujourdhuiIso(), 7))
  const [urgenceId, setUrgenceId] = useState('')
  const [importanceId, setImportanceId] = useState('')
  const [commentaireInitial, setCommentaireInitial] = useState('')

  useEffect(() => {
    let annule = false
    Promise.all([
      api<Page<Employe>>('/employees?taille=200'),
      api<{ elements: Element[] }>('/elements'),
      api<Page<Partenaire>>('/partners?taille=200'),
      api<{ elements: Urgence[] }>('/urgencies'),
      api<{ elements: Importance[] }>('/importances'),
      api<{ elements: LigneMatrice[] }>('/priority-matrix'),
    ])
      .then(([employes, elements, partenaires, urgences, importances, matrice]) => {
        if (annule) return
        setReferentiels({
          employes: employes.elements,
          elements: elements.elements,
          partenaires: partenaires.elements,
          urgences: urgences.elements,
          importances: importances.elements,
          matrice: matrice.elements,
        })
        const premierElement = elements.elements[0]
        if (premierElement !== undefined) setElementId(premierElement.id)
        const premiereUrgence = urgences.elements[0]
        const premiereImportance = importances.elements[0]
        if (premiereUrgence !== undefined) setUrgenceId(premiereUrgence.id)
        if (premiereImportance !== undefined) setImportanceId(premiereImportance.id)
      })
      .catch((probleme: unknown) => {
        if (!annule) {
          setErreur(
            probleme instanceof ApiError
              ? probleme
              : new Error('Impossible de charger les référentiels.'),
          )
        }
      })
      .finally(() => {
        if (!annule) setChargement(false)
      })
    return () => {
      annule = true
    }
  }, [])

  const employesEligibles = useMemo(() => {
    if (referentiels === null) return []
    const actifs = referentiels.employes.filter((employe) => employe.actif)
    if (me.droits.creerPourAutrui) return actifs
    if (me.employe === null) return []
    if (me.droits.creerPourSonService && me.employe.departement !== null) {
      return actifs.filter(
        (employe) =>
          employe.id !== me.employe?.id &&
          employe.departement?.id === me.employe?.departement?.id,
      )
    }
    return actifs.filter((employe) => employe.id === me.employe?.id)
  }, [referentiels, me])

  const partenairesActifs = useMemo(
    () => referentiels?.partenaires.filter((partenaire) => partenaire.actif) ?? [],
    [referentiels],
  )

  function changerActeur(nouveau: 'GD_TRADING' | 'PARTENAIRE'): void {
    setActeur(nouveau)
    setPiloteType('EMPLOYE')
    if (nouveau === 'PARTENAIRE') {
      setAssigneAPartenaireId(partenairesActifs[0]?.id ?? '')
    } else if (assigneAEmployeId === '') {
      setAssigneAEmployeId(me.employe?.id ?? '')
    }
  }

  const importancesDisponibles = useMemo(() => {
    if (referentiels === null) return []
    const autorisees = new Set(
      referentiels.matrice
        .filter((ligne) => ligne.urgence.id === urgenceId)
        .map((ligne) => ligne.importance.id),
    )
    return referentiels.importances.filter((importance) => autorisees.has(importance.id))
  }, [referentiels, urgenceId])

  const combinaisonValide = useMemo(() => {
    if (referentiels === null) return false
    return referentiels.matrice.some(
      (ligne) => ligne.urgence.id === urgenceId && ligne.importance.id === importanceId,
    )
  }, [referentiels, urgenceId, importanceId])

  const prioriteCalculee = useMemo(() => {
    if (referentiels === null) return null
    const urgence = referentiels.urgences.find((entree) => entree.id === urgenceId)
    const importance = referentiels.importances.find((entree) => entree.id === importanceId)
    if (urgence === undefined || importance === undefined) return null
    const normaliser = (texte: string): string =>
      texte
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
    const urgenceHaute = normaliser(urgence.libelle).includes('immediat') ||
      normaliser(urgence.libelle).includes('courte')
    const importanceHaute = normaliser(importance.libelle).includes('critique') ||
      normaliser(importance.libelle).includes('eleve')
    if (urgenceHaute && importanceHaute) return { code: 'p1', libelle: 'P1 — Critique' }
    if (!urgenceHaute && importanceHaute) return { code: 'p2', libelle: 'P2 — Haute' }
    if (urgenceHaute && !importanceHaute) return { code: 'p3', libelle: 'P3 — Moyenne' }
    return { code: 'p4', libelle: 'P4 — Basse' }
  }, [referentiels, urgenceId, importanceId])

  const actionAPrendreCalculee = useMemo(() => {
    if (prioriteCalculee === null) return null
    if (prioriteCalculee.code === 'p1' || prioriteCalculee.code === 'p2') {
      return 'Faire immédiatement'
    }
    if (prioriteCalculee.code === 'p3') return 'Déléguer si possible'
    return 'Planifier'
  }, [prioriteCalculee])

  function changerUrgence(id: string): void {
    setUrgenceId(id)
    if (referentiels === null) return
    const disponibles = referentiels.matrice
      .filter((ligne) => ligne.urgence.id === id)
      .map((ligne) => ligne.importance.id)
    if (!disponibles.includes(importanceId)) {
      const premiere = disponibles[0]
      setImportanceId(premiere ?? '')
    }
  }

  async function soumettre(evenement: FormEvent): Promise<void> {
    evenement.preventDefault()
    setErreur(null)
    setEnvoi(true)

    const corps: Record<string, unknown> = {
      nature,
      typeTache: supplementaire ? 'SIMPLE' : typeTache,
      isSupplementaire: supplementaire,
      libelle,
      elementId,
      acteur,
      dateAction,
      dateDebut: nature === 'QUOTIDIENNE' ? dateAction : dateDebut,
      dateFinPrevue: nature === 'QUOTIDIENNE' ? null : dateFinPrevue,
      urgenceId,
      importanceId,
      frequence: supplementaire ? null : typeTache === 'RECURRENTE' ? frequence : null,
      dateFinRecurrence:
        supplementaire ? null : typeTache === 'RECURRENTE' ? dateFinRecurrence : null,
      commentaireInitial: commentaireInitial.trim().length === 0 ? null : commentaireInitial.trim(),
    }

    if (supplementaire) {
      corps['assigneAEmployeId'] = me.employe?.id ?? ''
      corps['assigneAPartenaireId'] = null
      corps['acteur'] = 'GD_TRADING'
      corps['piloteEmployeId'] = me.employe?.id ?? ''
      corps['pilotePartenaireId'] = null
    } else if (acteur === 'GD_TRADING') {
      corps['assigneAEmployeId'] = assigneAEmployeId
      corps['assigneAPartenaireId'] = null
      corps['piloteEmployeId'] = piloteEmployeId
      corps['pilotePartenaireId'] = null
    } else {
      corps['assigneAEmployeId'] = null
      corps['assigneAPartenaireId'] = assigneAPartenaireId
      if (piloteType === 'EMPLOYE') {
        corps['piloteEmployeId'] = piloteEmployeId
        corps['pilotePartenaireId'] = null
      } else {
        corps['piloteEmployeId'] = null
        corps['pilotePartenaireId'] = pilotePartenaireId
      }
    }

    try {
      const reponse = await api<TacheDetail | { donnees: TacheDetail }>('/tasks', {
        method: 'POST',
        body: JSON.stringify(corps),
      })
      onCree('donnees' in reponse ? reponse.donnees.id : reponse.id)
    } catch (probleme) {
      setErreur(
        probleme instanceof ApiError ? probleme : new Error('La création a échoué.'),
      )
    } finally {
      setEnvoi(false)
    }
  }

  if (chargement) return <p className="message">Chargement des référentiels…</p>
  if (referentiels === null) {
    return (
      <div className="vide">
        <p className="message message--erreur" role="alert">
          {erreur instanceof ApiError ? erreur.problem.detail : 'Référentiels indisponibles.'}
        </p>
        <button type="button" className="bouton" onClick={onAnnuler}>
          Retour
        </button>
      </div>
    )
  }

  const erreurChamp = (champ: string): string | null =>
    erreur instanceof ApiError ? erreur.erreurDe(champ) : null
  const messageGlobal = erreur instanceof ApiError ? erreur.problem.detail : erreur?.message ?? null

  return (
    <section>
      <button type="button" className="lien-retour" onClick={onAnnuler}>
        ← Retour
      </button>

      <header className="page-entete">
        <div>
          <h1>{supplementaire ? 'Nouvelle tâche supplémentaire' : 'Nouvelle tâche'}</h1>
          <p className="page-sous-titre">
            {supplementaire
              ? 'Tâche ajoutée à votre propre liste, hors planification officielle et sans score.'
              : 'Les champs sont contrôlés par le serveur ; les erreurs s’affichent sous le champ concerné.'}
          </p>
        </div>
      </header>

      {messageGlobal !== null && (
        <p className="message message--erreur" role="alert">
          {messageGlobal}
        </p>
      )}

      <form className="formulaire formulaire--large" onSubmit={(evenement) => void soumettre(evenement)}>
        <fieldset>
          <legend>Informations</legend>

          {peutSupplementaire && !estEmploye && me.employe !== null && (
            <label className="champ-case">
              <input
                type="checkbox"
                checked={supplementaire}
                onChange={(evenement) => setSupplementaire(evenement.target.checked)}
              />{' '}
              Tâche supplémentaire (auto-attribution)
            </label>
          )}

          {!supplementaire && (
            <>
              <label htmlFor="typeTache">Type de tâche</label>
              <select
                id="typeTache"
                value={typeTache}
                onChange={(evenement) =>
                  setTypeTache(evenement.target.value as 'SIMPLE' | 'RECURRENTE')
                }
              >
                <option value="SIMPLE">Tâche simple</option>
                <option value="RECURRENTE">Tâche récurrente</option>
              </select>

              {typeTache === 'RECURRENTE' && (
                <>
                  <label htmlFor="frequence">Fréquence</label>
                  <select
                    id="frequence"
                    value={frequence}
                    onChange={(evenement) =>
                      setFrequence(evenement.target.value as typeof frequence)
                    }
                  >
                    <option value="QUOTIDIENNE">Quotidienne</option>
                    <option value="HEBDOMADAIRE">Hebdomadaire</option>
                    <option value="MENSUELLE">Mensuelle</option>
                    <option value="TRIMESTRIELLE">Trimestrielle</option>
                    <option value="ANNUELLE">Annuelle</option>
                  </select>
                  <label htmlFor="dateFinRecurrence">Fin de la récurrence *</label>
                  <input
                    id="dateFinRecurrence"
                    type="date"
                    value={dateFinRecurrence}
                    onChange={(evenement) => setDateFinRecurrence(evenement.target.value)}
                    required
                  />
                  {erreurChamp('dateFinRecurrence') !== null && (
                    <p className="erreur-champ">{erreurChamp('dateFinRecurrence')}</p>
                  )}
                </>
              )}
            </>
          )}

          <label htmlFor="libelle">Libellé *</label>
          <input
            id="libelle"
            value={libelle}
            maxLength={255}
            onChange={(evenement) => setLibelle(evenement.target.value)}
            required
          />
          {erreurChamp('libelle') !== null && (
            <p className="erreur-champ">{erreurChamp('libelle')}</p>
          )}

          <label htmlFor="elementId">Élément / pilier</label>
          <select
            id="elementId"
            value={elementId}
            onChange={(evenement) => setElementId(evenement.target.value)}
          >
            {referentiels.elements
              .filter((element) => element.actif)
              .map((element) => (
                <option key={element.id} value={element.id}>
                  {element.libelle}
                </option>
              ))}
          </select>

          {!supplementaire && (
            <>
              <label htmlFor="acteur">Acteur</label>
              <select
                id="acteur"
                value={acteur}
                onChange={(evenement) =>
                  changerActeur(evenement.target.value as 'GD_TRADING' | 'PARTENAIRE')
                }
              >
                <option value="GD_TRADING">GD Trading</option>
                {me.utilisateur.role === 'ADMIN' && (
                  <option value="PARTENAIRE">Partenaire</option>
                )}
              </select>
            </>
          )}
        </fieldset>

        {!supplementaire && (
        <fieldset>
          <legend>Suivi</legend>

          {acteur === 'GD_TRADING' ? (
            <>
              <label htmlFor="assigneAEmployeId">Assignée à *</label>
              <select
                id="assigneAEmployeId"
                value={assigneAEmployeId}
                onChange={(evenement) => {
                  setAssigneAEmployeId(evenement.target.value)
                  setPiloteEmployeId(evenement.target.value)
                }}
                required
              >
                {employesEligibles.map((employe) => (
                  <option key={employe.id} value={employe.id}>
                    {employe.nomComplet}
                    {employe.departement !== null ? ` · ${employe.departement.libelle}` : ''}
                  </option>
                ))}
              </select>
              {erreurChamp('assigneAEmployeId') !== null && (
                <p className="erreur-champ">{erreurChamp('assigneAEmployeId')}</p>
              )}
            </>
          ) : (
            <>
              <label htmlFor="assigneAPartenaireId">Assignée à *</label>
              <select
                id="assigneAPartenaireId"
                value={assigneAPartenaireId}
                onChange={(evenement) => setAssigneAPartenaireId(evenement.target.value)}
                required
              >
                <option value="">— Choisir un partenaire —</option>
                {partenairesActifs.map((partenaire) => (
                  <option key={partenaire.id} value={partenaire.id}>
                    {partenaire.libelle}
                  </option>
                ))}
              </select>
              {partenairesActifs.length === 0 && (
                <p className="aide">
                  Aucun partenaire actif dans le référentiel : créez-en un avant d’enregistrer.
                </p>
              )}
              {erreurChamp('assigneAPartenaireId') !== null && (
                <p className="erreur-champ">{erreurChamp('assigneAPartenaireId')}</p>
              )}
            </>
          )}

          {acteur === 'GD_TRADING' ? (
            <>
              <label htmlFor="piloteEmployeId">Piloté par</label>
              <select
                id="piloteEmployeId"
                value={piloteEmployeId}
                onChange={(evenement) => setPiloteEmployeId(evenement.target.value)}
              >
                {employesEligibles.map((employe) => (
                  <option key={employe.id} value={employe.id}>
                    {employe.nomComplet}
                  </option>
                ))}
              </select>
            </>
          ) : (
            <>
              <label htmlFor="piloteType">Type de pilote</label>
              <select
                id="piloteType"
                value={piloteType}
                onChange={(evenement) =>
                  setPiloteType(evenement.target.value as 'EMPLOYE' | 'PARTENAIRE')
                }
              >
                <option value="EMPLOYE">Employé GD Trading</option>
                <option value="PARTENAIRE">Partenaire</option>
              </select>

              {piloteType === 'EMPLOYE' ? (
                <>
                  <label htmlFor="piloteEmployeId">Piloté par (employé)</label>
                  <select
                    id="piloteEmployeId"
                    value={piloteEmployeId}
                    onChange={(evenement) => setPiloteEmployeId(evenement.target.value)}
                  >
                    {employesEligibles.map((employe) => (
                      <option key={employe.id} value={employe.id}>
                        {employe.nomComplet}
                      </option>
                    ))}
                  </select>
                </>
              ) : (
                <>
                  <label htmlFor="pilotePartenaireId">Piloté par (partenaire)</label>
                  <select
                    id="pilotePartenaireId"
                    value={pilotePartenaireId}
                    onChange={(evenement) => setPilotePartenaireId(evenement.target.value)}
                    required
                  >
                    <option value="">— Choisir —</option>
                    {partenairesActifs.map((partenaire) => (
                      <option key={partenaire.id} value={partenaire.id}>
                        {partenaire.libelle}
                      </option>
                    ))}
                  </select>
                </>
              )}
            </>
          )}
        </fieldset>
        )}

        <fieldset>
          <legend>Planning</legend>

          <label htmlFor="dateAction">Date d’action *</label>
          <input
            id="dateAction"
            type="date"
            value={dateAction}
            onChange={(evenement) => {
              setDateAction(evenement.target.value)
              if (nature === 'QUOTIDIENNE') setDateDebut(evenement.target.value)
            }}
            required
          />
          {erreurChamp('dateAction') !== null && (
            <p className="erreur-champ">{erreurChamp('dateAction')}</p>
          )}

          {nature === 'AUTRE' && (
            <>
              <label htmlFor="dateDebut">Date de début *</label>
              <input
                id="dateDebut"
                type="date"
                value={dateDebut}
                onChange={(evenement) => setDateDebut(evenement.target.value)}
                required
              />
              <label htmlFor="dateFinPrevue">Date de fin prévue *</label>
              <input
                id="dateFinPrevue"
                type="date"
                value={dateFinPrevue}
                min={dateDebut}
                onChange={(evenement) => setDateFinPrevue(evenement.target.value)}
                required
              />
              {erreurChamp('dateFinPrevue') !== null && (
                <p className="erreur-champ">{erreurChamp('dateFinPrevue')}</p>
              )}
            </>
          )}

          {nature === 'QUOTIDIENNE' && (
            <p className="aide">
              Une tâche récurrente quotidienne démarre le jour d’action et doit être créée avant
              16 h 30. Les occurrences suivantes se déduisent de la fréquence.
            </p>
          )}
        </fieldset>

        <fieldset>
          <legend>Priorité</legend>

          <label htmlFor="urgenceId">Urgence</label>
          <select
            id="urgenceId"
            value={urgenceId}
            onChange={(evenement) => changerUrgence(evenement.target.value)}
          >
            {referentiels.urgences.map((urgence) => (
              <option key={urgence.id} value={urgence.id}>
                {urgence.libelle}
              </option>
            ))}
          </select>

          <label htmlFor="importanceId">Importance</label>
          <select
            id="importanceId"
            value={importanceId}
            onChange={(evenement) => setImportanceId(evenement.target.value)}
          >
            {importancesDisponibles.map((importance) => (
              <option key={importance.id} value={importance.id}>
                {importance.libelle}
              </option>
            ))}
          </select>
          {!combinaisonValide && (
            <p className="erreur-champ">
              Cette combinaison d’urgence et d’importance n’existe pas dans la matrice.
            </p>
          )}

          <p className="priorite-calculee">
            Priorité calculée :
            {prioriteCalculee === null ? (
              <span>—</span>
            ) : (
              <span className={`etiquette etiquette--${prioriteCalculee.code}`}>
                {prioriteCalculee.libelle}
              </span>
            )}
          </p>

          <p className="priorite-calculee">
            Action à prendre :
            {actionAPrendreCalculee === null ? (
              <span>—</span>
            ) : (
              <span className="etiquette">{actionAPrendreCalculee}</span>
            )}
          </p>
        </fieldset>

        <fieldset>
          <legend>Commentaire</legend>
          <label htmlFor="commentaireInitial">Commentaire (facultatif)</label>
          <textarea
            id="commentaireInitial"
            rows={4}
            maxLength={2000}
            value={commentaireInitial}
            onChange={(evenement) => setCommentaireInitial(evenement.target.value)}
          />
        </fieldset>

        <div className="boutons-ligne formulaire__pied">
          <button type="button" className="bouton" onClick={onAnnuler}>
            Annuler
          </button>
          <button
            type="submit"
            className="bouton bouton--principal"
            disabled={envoi || !combinaisonValide}
          >
            {envoi && <span className="bouton__chargement" aria-hidden="true" />}
            {envoi ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </section>
  )
}
