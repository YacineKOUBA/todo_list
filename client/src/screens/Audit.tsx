import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api, ApiError } from '../api'
import type { EvenementAudit, Page } from '../types'
import { formatDateTime } from '../utils/format'

const TAILLE = 50

interface Filtres {
  typeOperation: string
  entite: string
  du: string
  au: string
}

const FILTRES_VIDES: Filtres = { typeOperation: '', entite: '', du: '', au: '' }

function valeurJson(valeur: unknown): string {
  if (valeur === null || valeur === undefined) return '—'
  return JSON.stringify(valeur, null, 2)
}

/** IHM-13 — journal d’audit en lecture seule (docs/08 §4.13). */
export function Audit() {
  const [elements, setElements] = useState<EvenementAudit[]>([])
  const [page, setPage] = useState(1)
  const [nombrePages, setNombrePages] = useState(0)
  const [total, setTotal] = useState(0)
  const [formulaire, setFormulaire] = useState<Filtres>(FILTRES_VIDES)
  const [filtres, setFiltres] = useState<Filtres>(FILTRES_VIDES)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState<string | null>(null)

  const charger = useCallback(async (): Promise<void> => {
    setChargement(true)
    const parametres = new URLSearchParams({ page: String(page), taille: String(TAILLE) })
    if (filtres.typeOperation.trim().length > 0) {
      parametres.set('typeOperation', filtres.typeOperation.trim())
    }
    if (filtres.entite.trim().length > 0) parametres.set('entite', filtres.entite.trim())
    if (filtres.du.length > 0) parametres.set('du', filtres.du)
    if (filtres.au.length > 0) parametres.set('au', filtres.au)

    try {
      const reponse = await api<Page<EvenementAudit>>(`/audit-events?${parametres.toString()}`)
      setElements(reponse.elements)
      setNombrePages(reponse.pagination.nombrePages)
      setTotal(reponse.pagination.total)
      setErreur(null)
    } catch (probleme) {
      setErreur(
        probleme instanceof ApiError
          ? probleme.problem.detail
          : 'Impossible de charger le journal d’audit.',
      )
    } finally {
      setChargement(false)
    }
  }, [filtres, page])

  useEffect(() => {
    void charger()
  }, [charger])

  function appliquer(evenement: FormEvent): void {
    evenement.preventDefault()
    setPage(1)
    setFiltres(formulaire)
  }

  function reinitialiser(): void {
    setFormulaire(FILTRES_VIDES)
    setFiltres(FILTRES_VIDES)
    setPage(1)
  }

  return (
    <section>
      <header className="page-entete">
        <div>
          <h1>Journal d’audit</h1>
          <p className="page-sous-titre">
            Lecture seule, du plus récent au plus ancien. {total} événement{total > 1 ? 's' : ''}.
          </p>
        </div>
      </header>

      <form className="outils" onSubmit={appliquer}>
        <label htmlFor="typeOperation">Type d’opération</label>
        <input
          id="typeOperation"
          value={formulaire.typeOperation}
          maxLength={50}
          onChange={(evenement) =>
            setFormulaire({ ...formulaire, typeOperation: evenement.target.value })
          }
        />
        <label htmlFor="entite">Entité</label>
        <input
          id="entite"
          value={formulaire.entite}
          maxLength={50}
          onChange={(evenement) => setFormulaire({ ...formulaire, entite: evenement.target.value })}
        />
        <label htmlFor="du">Du</label>
        <input
          id="du"
          type="date"
          value={formulaire.du}
          onChange={(evenement) => setFormulaire({ ...formulaire, du: evenement.target.value })}
        />
        <label htmlFor="au">Au</label>
        <input
          id="au"
          type="date"
          value={formulaire.au}
          onChange={(evenement) => setFormulaire({ ...formulaire, au: evenement.target.value })}
        />
        <div className="boutons-ligne">
          <button type="submit" className="bouton bouton--principal" disabled={chargement}>
            Filtrer
          </button>
          <button type="button" className="bouton" onClick={reinitialiser} disabled={chargement}>
            Réinitialiser
          </button>
        </div>
      </form>

      {erreur !== null && (
        <div className="message message--erreur" role="alert">
          <p>{erreur}</p>
          <button type="button" className="bouton" onClick={() => void charger()}>
            Réessayer
          </button>
        </div>
      )}
      {chargement && (
        <div className="squelette" aria-label="Chargement du journal" role="status">
          <div className="squelette__ligne" />
          <div className="squelette__ligne" />
        </div>
      )}

      {!chargement && erreur === null && elements.length === 0 && (
        <div className="vide">
          <p className="vide__titre">Aucun événement</p>
          <p>Aucune entrée ne correspond aux filtres.</p>
        </div>
      )}

      {elements.length > 0 && (
        <div className="tableau-conteneur">
          <table className="tableau">
            <thead>
              <tr>
                <th>Horodatage</th>
                <th>Acteur</th>
                <th>Opération</th>
                <th>Entité</th>
                <th>Détail</th>
              </tr>
            </thead>
            <tbody>
              {elements.map((evenement) => (
                <tr key={evenement.id}>
                  <td>{formatDateTime(evenement.horodatage)}</td>
                  <td>{evenement.acteur?.nomComplet ?? 'Système'}</td>
                  <td>{evenement.typeOperation}</td>
                  <td>
                    {evenement.entite}
                    {evenement.entiteId !== null && (
                      <span className="tableau__secondaire">{evenement.entiteId}</span>
                    )}
                  </td>
                  <td>
                    <details>
                      <summary>Avant / après</summary>
                      <p className="tableau__secondaire">Avant</p>
                      <pre className="journal-json">{valeurJson(evenement.donneesAvant)}</pre>
                      <p className="tableau__secondaire">Après</p>
                      <pre className="journal-json">{valeurJson(evenement.donneesApres)}</pre>
                      <p className="tableau__secondaire">Contexte</p>
                      <pre className="journal-json">{valeurJson(evenement.contexte)}</pre>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {nombrePages > 1 && (
        <div className="boutons-ligne" aria-label="Pagination">
          <button
            type="button"
            className="bouton"
            onClick={() => setPage((valeur) => Math.max(1, valeur - 1))}
            disabled={chargement || page <= 1}
          >
            ← Précédent
          </button>
          <span className="aide">
            Page {page} sur {nombrePages}
          </span>
          <button
            type="button"
            className="bouton"
            onClick={() => setPage((valeur) => Math.min(nombrePages, valeur + 1))}
            disabled={chargement || page >= nombrePages}
          >
            Suivant →
          </button>
        </div>
      )}
    </section>
  )
}
