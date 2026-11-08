import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { api, ApiError } from '../api'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Toast } from '../components/Toast'
import type {
  Departement,
  Element,
  Importance,
  LigneMatrice,
  Page,
  Partenaire,
  Urgence,
} from '../types'

interface JourFerie {
  id: string
  jour: string
  libelle: string | null
}

interface Listes {
  departements: Departement[]
  elements: Element[]
  partenaires: Partenaire[]
  urgences: Urgence[]
  importances: Importance[]
  matrice: LigneMatrice[]
  feries: JourFerie[]
}

const LISTES_VIDES: Listes = {
  departements: [],
  elements: [],
  partenaires: [],
  urgences: [],
  importances: [],
  matrice: [],
  feries: [],
}

interface Suppression {
  chemin: string
  libelle: string
  retirer: (listes: Listes) => Listes
}

function messageErreur(probleme: unknown): string {
  return probleme instanceof ApiError
    ? probleme.problem.detail
    : 'L’opération a échoué.'
}

interface EncartProps {
  titre: string
  nombre: number
  onAjouter: (evenement: FormEvent) => void
  children: ReactNode
  formulaire: ReactNode
}

function EncartReferentiel({ titre, nombre, onAjouter, children, formulaire }: EncartProps) {
  return (
    <section className="encart">
      <div className="encart__entete">
        <div className="encart__titre">
          <h2>{titre}</h2>
          <span className="etiquette">{nombre}</span>
        </div>
        <form className="boutons-ligne referentiels-form" onSubmit={onAjouter}>
          {formulaire}
        </form>
      </div>
      <div className="tableau-conteneur">{children}</div>
    </section>
  )
}

export function Referentials() {
  const [listes, setListes] = useState<Listes>(LISTES_VIDES)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState<string | null>(null)
  const [erreurAction, setErreurAction] = useState<string | null>(null)
  const [succes, setSucces] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)
  const [suppression, setSuppression] = useState<Suppression | null>(null)
  const [rechargement, setRechargement] = useState(0)

  const [libelleDepartement, setLibelleDepartement] = useState('')
  const [libelleElement, setLibelleElement] = useState('')
  const [libellePartenaire, setLibellePartenaire] = useState('')
  const [jourFerie, setJourFerie] = useState('')
  const [libelleFerie, setLibelleFerie] = useState('')

  useEffect(() => {
    let annule = false
    setChargement(true)
    setErreur(null)
    const annee = new Date().getFullYear()
    Promise.all([
      api<{ elements: Departement[] }>('/departments'),
      api<{ elements: Element[] }>('/elements'),
      api<Page<Partenaire>>('/partners?taille=200'),
      api<{ elements: Urgence[] }>('/urgencies'),
      api<{ elements: Importance[] }>('/importances'),
      api<{ elements: LigneMatrice[] }>('/priority-matrix'),
      api<{ elements: JourFerie[] }>(`/holidays?annee=${String(annee)}`),
    ])
      .then(([departements, elements, partenaires, urgences, importances, matrice, feries]) => {
        if (annule) return
        setListes({
          departements: departements.elements,
          elements: elements.elements,
          partenaires: partenaires.elements,
          urgences: urgences.elements,
          importances: importances.elements,
          matrice: matrice.elements,
          feries: feries.elements,
        })
      })
      .catch((probleme: unknown) => {
        if (!annule) {
          setErreur(
            probleme instanceof ApiError
              ? probleme.problem.detail
              : 'Impossible de charger les référentiels.',
          )
        }
      })
      .finally(() => {
        if (!annule) setChargement(false)
      })
    return () => {
      annule = true
    }
  }, [rechargement])

  async function executer(action: () => Promise<void>): Promise<void> {
    setEnCours(true)
    setErreurAction(null)
    try {
      await action()
      setSucces('Référentiel mis à jour.')
    } catch (probleme) {
      setErreurAction(messageErreur(probleme))
    } finally {
      setEnCours(false)
    }
  }

  async function ajouterDepartement(evenement: FormEvent): Promise<void> {
    evenement.preventDefault()
    await executer(async () => {
      const cree = await api<Departement>('/departments', {
        method: 'POST',
        body: JSON.stringify({ libelle: libelleDepartement }),
      })
      setListes((actuel) => ({
        ...actuel,
        departements: [...actuel.departements, cree].sort((a, b) =>
          a.libelle.localeCompare(b.libelle),
        ),
      }))
      setLibelleDepartement('')
    })
  }

  async function ajouterElement(evenement: FormEvent): Promise<void> {
    evenement.preventDefault()
    await executer(async () => {
      const cree = await api<Element>('/elements', {
        method: 'POST',
        body: JSON.stringify({ libelle: libelleElement }),
      })
      setListes((actuel) => ({
        ...actuel,
        elements: [...actuel.elements, cree].sort((a, b) =>
          a.ordre === b.ordre ? a.libelle.localeCompare(b.libelle) : a.ordre - b.ordre,
        ),
      }))
      setLibelleElement('')
    })
  }

  async function ajouterPartenaire(evenement: FormEvent): Promise<void> {
    evenement.preventDefault()
    await executer(async () => {
      const cree = await api<Partenaire>('/partners', {
        method: 'POST',
        body: JSON.stringify({ libelle: libellePartenaire }),
      })
      setListes((actuel) => ({
        ...actuel,
        partenaires: [...actuel.partenaires, cree].sort((a, b) =>
          a.libelle.localeCompare(b.libelle),
        ),
      }))
      setLibellePartenaire('')
    })
  }

  async function ajouterFerie(evenement: FormEvent): Promise<void> {
    evenement.preventDefault()
    await executer(async () => {
      const cree = await api<JourFerie>('/holidays', {
        method: 'POST',
        body: JSON.stringify({
          jour: jourFerie,
          libelle: libelleFerie.trim().length > 0 ? libelleFerie : null,
        }),
      })
      setListes((actuel) => ({
        ...actuel,
        feries: [...actuel.feries, cree].sort((a, b) => a.jour.localeCompare(b.jour)),
      }))
      setJourFerie('')
      setLibelleFerie('')
    })
  }

  async function confirmerSuppression(): Promise<void> {
    if (suppression === null) return
    const { chemin, retirer } = suppression
    await executer(async () => {
      await api<void>(chemin, { method: 'DELETE' })
      setListes(retirer)
    })
    setSuppression(null)
  }

  if (chargement) return <p className="message">Chargement des référentiels…</p>
  if (erreur !== null) {
    return (
      <div className="vide" role="alert">
        <p className="vide__titre">Chargement impossible</p>
        <p>{erreur}</p>
        <button
          type="button"
          className="bouton bouton--principal"
          onClick={() => setRechargement((valeur) => valeur + 1)}
        >
          Réessayer
        </button>
      </div>
    )
  }

  return (
    <section>
      <header className="page-entete">
        <div>
          <h1>Référentiels et paramètres</h1>
          <p className="page-sous-titre">
            Données de référence utilisées par les formulaires et les calculs de priorité.
          </p>
        </div>
      </header>

      {erreurAction !== null && (
        <p className="message message--erreur" role="alert">
          {erreurAction}
        </p>
      )}
      {succes !== null && <Toast message={succes} onFermer={() => setSucces(null)} />}

      <div className="referentiels-liste">
        <EncartReferentiel
          titre="Départements"
          nombre={listes.departements.length}
          onAjouter={(evenement) => void ajouterDepartement(evenement)}
          formulaire={
            <>
              <input
                aria-label="Libellé du département"
                placeholder="Nouveau département"
                value={libelleDepartement}
                onChange={(evenement) => setLibelleDepartement(evenement.target.value)}
                required
              />
              <button type="submit" className="bouton" disabled={enCours}>
                Ajouter
              </button>
            </>
          }
        >
          <table className="tableau">
            <thead>
              <tr>
                <th>Département</th>
                <th>Responsable</th>
                <th>État</th>
                <th className="tableau__actions">Action</th>
              </tr>
            </thead>
            <tbody>
              {listes.departements.length === 0 && (
                <tr>
                  <td colSpan={4} className="tableau__vide">
                    Aucun département.
                  </td>
                </tr>
              )}
              {listes.departements.map((departement) => (
                <tr key={departement.id}>
                  <td>{departement.libelle}</td>
                  <td>{departement.responsable?.nomComplet ?? '—'}</td>
                  <td>
                    <span className="etiquette">{departement.actif ? 'Actif' : 'Inactif'}</span>
                  </td>
                  <td className="tableau__actions">
                    <button
                      type="button"
                      className="bouton bouton--danger"
                      disabled={enCours}
                      onClick={() =>
                        setSuppression({
                          chemin: `/departments/${departement.id}`,
                          libelle: departement.libelle,
                          retirer: (actuel) => ({
                            ...actuel,
                            departements: actuel.departements.filter(
                              (element) => element.id !== departement.id,
                            ),
                          }),
                        })
                      }
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </EncartReferentiel>

        <EncartReferentiel
          titre="Éléments / piliers"
          nombre={listes.elements.length}
          onAjouter={(evenement) => void ajouterElement(evenement)}
          formulaire={
            <>
              <input
                aria-label="Libellé de l’élément"
                placeholder="Nouvel élément / pilier"
                value={libelleElement}
                onChange={(evenement) => setLibelleElement(evenement.target.value)}
                required
              />
              <button type="submit" className="bouton" disabled={enCours}>
                Ajouter
              </button>
            </>
          }
        >
          <table className="tableau">
            <thead>
              <tr>
                <th>Élément</th>
                <th>Ordre</th>
                <th>État</th>
                <th className="tableau__actions">Action</th>
              </tr>
            </thead>
            <tbody>
              {listes.elements.length === 0 && (
                <tr>
                  <td colSpan={4} className="tableau__vide">
                    Aucun élément.
                  </td>
                </tr>
              )}
              {listes.elements.map((element) => (
                <tr key={element.id}>
                  <td>{element.libelle}</td>
                  <td>{element.ordre}</td>
                  <td>
                    <span className="etiquette">{element.actif ? 'Actif' : 'Inactif'}</span>
                  </td>
                  <td className="tableau__actions">
                    <button
                      type="button"
                      className="bouton bouton--danger"
                      disabled={enCours}
                      onClick={() =>
                        setSuppression({
                          chemin: `/elements/${element.id}`,
                          libelle: element.libelle,
                          retirer: (actuel) => ({
                            ...actuel,
                            elements: actuel.elements.filter((autre) => autre.id !== element.id),
                          }),
                        })
                      }
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </EncartReferentiel>

        <EncartReferentiel
          titre="Partenaires"
          nombre={listes.partenaires.length}
          onAjouter={(evenement) => void ajouterPartenaire(evenement)}
          formulaire={
            <>
              <input
                aria-label="Libellé du partenaire"
                placeholder="Nouveau partenaire"
                value={libellePartenaire}
                onChange={(evenement) => setLibellePartenaire(evenement.target.value)}
                required
              />
              <button type="submit" className="bouton" disabled={enCours}>
                Ajouter
              </button>
            </>
          }
        >
          <table className="tableau">
            <thead>
              <tr>
                <th>Partenaire</th>
                <th>État</th>
                <th className="tableau__actions">Action</th>
              </tr>
            </thead>
            <tbody>
              {listes.partenaires.length === 0 && (
                <tr>
                  <td colSpan={3} className="tableau__vide">
                    Aucun partenaire.
                  </td>
                </tr>
              )}
              {listes.partenaires.map((partenaire) => (
                <tr key={partenaire.id}>
                  <td>{partenaire.libelle}</td>
                  <td>
                    <span className="etiquette">{partenaire.actif ? 'Actif' : 'Inactif'}</span>
                  </td>
                  <td className="tableau__actions">
                    <button
                      type="button"
                      className="bouton bouton--danger"
                      disabled={enCours}
                      onClick={() =>
                        setSuppression({
                          chemin: `/partners/${partenaire.id}`,
                          libelle: partenaire.libelle,
                          retirer: (actuel) => ({
                            ...actuel,
                            partenaires: actuel.partenaires.filter(
                              (autre) => autre.id !== partenaire.id,
                            ),
                          }),
                        })
                      }
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </EncartReferentiel>

        <EncartReferentiel
          titre="Jours fériés"
          nombre={listes.feries.length}
          onAjouter={(evenement) => void ajouterFerie(evenement)}
          formulaire={
            <>
              <input
                type="date"
                aria-label="Date du jour férié"
                value={jourFerie}
                onChange={(evenement) => setJourFerie(evenement.target.value)}
                required
              />
              <input
                aria-label="Libellé du jour férié"
                placeholder="Libellé (facultatif)"
                value={libelleFerie}
                onChange={(evenement) => setLibelleFerie(evenement.target.value)}
              />
              <button type="submit" className="bouton" disabled={enCours}>
                Ajouter
              </button>
            </>
          }
        >
          <table className="tableau">
            <thead>
              <tr>
                <th>Date</th>
                <th>Libellé</th>
                <th className="tableau__actions">Action</th>
              </tr>
            </thead>
            <tbody>
              {listes.feries.length === 0 && (
                <tr>
                  <td colSpan={3} className="tableau__vide">
                    Aucun jour férié.
                  </td>
                </tr>
              )}
              {listes.feries.map((ferie) => (
                <tr key={ferie.id}>
                  <td>{ferie.jour}</td>
                  <td>{ferie.libelle ?? '—'}</td>
                  <td className="tableau__actions">
                    <button
                      type="button"
                      className="bouton bouton--danger"
                      disabled={enCours}
                      onClick={() =>
                        setSuppression({
                          chemin: `/holidays/${ferie.id}`,
                          libelle: ferie.libelle ?? ferie.jour,
                          retirer: (actuel) => ({
                            ...actuel,
                            feries: actuel.feries.filter((autre) => autre.id !== ferie.id),
                          }),
                        })
                      }
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </EncartReferentiel>
      </div>

      <div className="actions-grille">
        <section className="encart">
          <h2>Urgences et importances</h2>
          <p>
            Urgences : {listes.urgences.map((urgence) => urgence.libelle).join(', ') || '—'}
          </p>
          <p>
            Importances :{' '}
            {listes.importances.map((importance) => importance.libelle).join(', ') || '—'}
          </p>
        </section>

        <section className="encart">
          <h2>Matrice de priorité</h2>
          <ul>
            {listes.matrice.map((ligne) => (
              <li key={`${ligne.urgence.id}-${ligne.importance.id}`}>
                {ligne.priorite} · score {ligne.score} · relance {ligne.frequenceJours} j
              </li>
            ))}
          </ul>
        </section>
      </div>

      {suppression !== null && (
        <ConfirmDialog
          titre="Supprimer ce référentiel ?"
          message={`« ${suppression.libelle} » sera définitivement supprimé. Cette action est refusée si l’élément est déjà utilisé.`}
          libelleConfirmer="Supprimer"
          enCours={enCours}
          onConfirmer={() => void confirmerSuppression()}
          onAnnuler={() => setSuppression(null)}
        />
      )}
    </section>
  )
}
