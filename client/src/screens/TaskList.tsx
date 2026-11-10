import { useEffect, useMemo, useState } from 'react'
import { api, ApiError } from '../api'
import { TaskGroupedList } from '../components/TaskGroupedList'
import type { Me, Page, TacheListe } from '../types'
import { aujourdhuiIso } from '../utils/format'

type Vue = 'mes-taches-du-jour' | 'mes-autres-taches' | 'mes-taches' | 'service' | 'supplementaires' | 'toutes'

const STATUTS = [
  { code: 'TOUTES', libelle: 'Toutes' },
  { code: 'A_FAIRE', libelle: 'À faire' },
  { code: 'EN_COURS', libelle: 'En cours' },
  { code: 'RETARD', libelle: 'En retard' },
  { code: 'ACHEVEE', libelle: 'Terminée' },
  { code: 'SUSPENDUE', libelle: 'Suspendue' },
  { code: 'ANNULEE', libelle: 'Annulée' },
] as const

const PRIORITES = [
  { code: 'TOUTES', libelle: 'Toutes' },
  { code: 'P1_CRITIQUE', libelle: 'P1 — Critique' },
  { code: 'P2_HAUTE', libelle: 'P2 — Haute' },
  { code: 'P3_MOYENNE', libelle: 'P3 — Moyenne' },
  { code: 'P4_BASSE', libelle: 'P4 — Basse' },
] as const

const CHAMPS_DATE = [
  { code: 'TOUTES', libelle: 'Sélectionner une date' },
  { code: 'dateAction', libelle: 'Date d’action' },
  { code: 'dateDebut', libelle: 'Date de début' },
  { code: 'dateFinPrevue', libelle: 'Date de fin prévue' },
] as const

const TYPES_TACHE = [
  { code: 'TOUS', libelle: 'Tous' },
  { code: 'SIMPLE', libelle: 'Simples' },
  { code: 'RECURRENTE', libelle: 'Récurrentes' },
] as const

const FREQUENCES = [
  { code: 'TOUTES', libelle: 'Toutes' },
  { code: 'QUOTIDIENNE', libelle: 'Quotidienne' },
  { code: 'HEBDOMADAIRE', libelle: 'Hebdomadaire' },
  { code: 'MENSUELLE', libelle: 'Mensuelle' },
  { code: 'TRIMESTRIELLE', libelle: 'Trimestrielle' },
  { code: 'ANNUELLE', libelle: 'Annuelle' },
] as const

const TAILLE_PAGE = 20

/** Seule la vue « toutes les tâches » (archive) s'ouvre sur la date du jour. */
function dateParDefaut(vue: Vue): string {
  return vue === 'toutes' ? aujourdhuiIso() : ''
}

interface TaskListProps {
  me: Me
  vue: Vue
  titre: string
  sousTitre: string
  onOuvrir: (id: string) => void
  onCreer: () => void
}

export function TaskList({ me, vue, titre, sousTitre, onOuvrir, onCreer }: TaskListProps) {
  const [taches, setTaches] = useState<TacheListe[]>([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState<string | null>(null)
  const [rechargement, setRechargement] = useState(0)
  const [statut, setStatut] = useState<string>('TOUTES')
  const [priorite, setPriorite] = useState<string>('TOUTES')
  const [typeFiltre, setTypeFiltre] = useState<string>('TOUS')
  const [frequenceFiltre, setFrequenceFiltre] = useState<string>('TOUTES')
  const [assigne, setAssigne] = useState<string>('TOUS')
  const [dateFiltre, setDateFiltre] = useState<string>(() => dateParDefaut(vue))
  const [champDate, setChampDate] = useState<string>('TOUTES')
  const [recherche, setRecherche] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    setDateFiltre(dateParDefaut(vue))
    setChampDate('TOUTES')
  }, [vue])

  useEffect(() => {
    let annule = false
    setChargement(true)
    setErreur(null)
    // Évite d'afficher brièvement les tâches de la vue précédente.
    setTaches([])
    const parametres = new URLSearchParams({ vue, taille: '200' })
    if (vue === 'toutes') {
      if (dateFiltre !== '') {
        parametres.set('date', dateFiltre)
        parametres.set('champDate', champDate)
      }
    } else if (vue === 'mes-taches-du-jour') {
      // Jour même appliqué par le serveur ; « Date cible » choisit le champ.
      parametres.set('champDate', champDate)
    }
    api<Page<TacheListe>>(`/tasks?${parametres.toString()}`)
      .then((donnees) => {
        if (!annule) setTaches(donnees.elements)
      })
      .catch((probleme: unknown) => {
        if (!annule) {
          setErreur(
            probleme instanceof ApiError ? probleme.problem.detail : 'Impossible de charger les tâches.',
          )
        }
      })
      .finally(() => {
        if (!annule) setChargement(false)
      })
    return () => {
      annule = true
    }
  }, [vue, rechargement, dateFiltre, champDate])

  useEffect(() => {
    setPage(1)
  }, [statut, priorite, typeFiltre, frequenceFiltre, assigne, dateFiltre, champDate, recherche, vue])

  const assignes = useMemo(() => {
    const uniques = new Map<string, string>()
    for (const tache of taches) uniques.set(tache.assigneA.id, tache.assigneA.libelle)
    return [...uniques.entries()].sort((a, b) => a[1].localeCompare(b[1], 'fr'))
  }, [taches])

  const compteurs = useMemo(() => {
    const resultat: Record<string, number> = { TOUTES: taches.length }
    for (const tache of taches) {
      resultat[tache.statut.code] = (resultat[tache.statut.code] ?? 0) + 1
    }
    return resultat
  }, [taches])

  const visibles = useMemo(() => {
    const rechercheNormalisee = recherche
      .trim()
      .toLocaleLowerCase('fr-FR')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')

    return taches.filter((tache) => {
      if (statut !== 'TOUTES' && tache.statut.code !== statut) return false
      if (priorite !== 'TOUTES' && tache.priorite.code !== priorite) return false
      if (typeFiltre !== 'TOUS' && tache.typeTache !== typeFiltre) return false
      if (
        frequenceFiltre !== 'TOUTES' &&
        (tache.typeTache !== 'RECURRENTE' || tache.frequence !== frequenceFiltre)
      ) {
        return false
      }
      if (assigne !== 'TOUS' && tache.assigneA.id !== assigne) return false

      if (rechercheNormalisee.length === 0) return true
      return tache.libelle
        .toLocaleLowerCase('fr-FR')
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .includes(rechercheNormalisee)
    })
  }, [taches, statut, priorite, typeFiltre, frequenceFiltre, assigne, recherche])

  const nombrePages = Math.max(1, Math.ceil(visibles.length / TAILLE_PAGE))
  const pageCourante = Math.min(page, nombrePages)
  const debut = (pageCourante - 1) * TAILLE_PAGE
  const pageAffichee = visibles.slice(debut, debut + TAILLE_PAGE)

  const peutCreer =
    me.droits.creerPourAutrui ||
    me.droits.creerPourSonService ||
    me.droits.creerTacheSupplementaire

  function reinitialiser(): void {
    setStatut('TOUTES')
    setPriorite('TOUTES')
    setTypeFiltre('TOUS')
    setFrequenceFiltre('TOUTES')
    setAssigne('TOUS')
    setDateFiltre(dateParDefaut(vue))
    setChampDate('TOUTES')
    setRecherche('')
  }

  const totalSimples = visibles.filter((tache) => tache.typeTache === 'SIMPLE').length
  const totalRecurrentes = visibles.length - totalSimples

  return (
    <section>
      <header className="page-entete">
        <div>
          <h1>{titre}</h1>
          <p className="page-sous-titre">{sousTitre}</p>
        </div>
        {peutCreer && (
          <button type="button" className="bouton bouton--principal" onClick={onCreer}>
            + Créer une tâche
          </button>
        )}
      </header>

      <div className="onglets" role="tablist" aria-label="Filtrer par statut">
        {STATUTS.map((entree) => (
          <button
            key={entree.code}
            type="button"
            role="tab"
            aria-selected={statut === entree.code}
            className={statut === entree.code ? 'onglet onglet--actif' : 'onglet'}
            onClick={() => setStatut(entree.code)}
          >
            {entree.libelle}
            <span className="onglet__compteur">{compteurs[entree.code] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="outils">
        <div className="filtres" role="group" aria-label="Filtres des tâches">
          <div className="filtre-champ">
            <label htmlFor="filtre-priorite">Priorité</label>
            <select
              id="filtre-priorite"
              value={priorite}
              onChange={(evenement) => setPriorite(evenement.target.value)}
            >
              {PRIORITES.map((entree) => (
                <option key={entree.code} value={entree.code}>
                  {entree.libelle}
                </option>
              ))}
            </select>
          </div>

          <div className="filtre-champ">
            <label htmlFor="filtre-type">Type</label>
            <select
              id="filtre-type"
              value={typeFiltre}
              onChange={(evenement) => {
                setTypeFiltre(evenement.target.value)
                if (evenement.target.value !== 'RECURRENTE') setFrequenceFiltre('TOUTES')
              }}
            >
              {TYPES_TACHE.map((entree) => (
                <option key={entree.code} value={entree.code}>
                  {entree.libelle}
                </option>
              ))}
            </select>
          </div>

          {typeFiltre === 'RECURRENTE' && (
            <div className="filtre-champ">
              <label htmlFor="filtre-frequence">Fréquence</label>
              <select
                id="filtre-frequence"
                value={frequenceFiltre}
                onChange={(evenement) => setFrequenceFiltre(evenement.target.value)}
              >
                {FREQUENCES.map((entree) => (
                  <option key={entree.code} value={entree.code}>
                    {entree.libelle}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="filtre-champ">
            <label htmlFor="filtre-assigne">Assigné à</label>
            <select
              id="filtre-assigne"
              value={assigne}
              onChange={(evenement) => setAssigne(evenement.target.value)}
            >
              <option value="TOUS">Tous</option>
              {assignes.map(([id, nomComplet]) => (
                <option key={id} value={id}>
                  {nomComplet}
                </option>
              ))}
            </select>
          </div>

          {(vue === 'toutes' || vue === 'mes-taches-du-jour') && (
            <div className="filtre-champ">
              <label htmlFor="filtre-champ-date">Date cible</label>
              <select
                id="filtre-champ-date"
                value={champDate}
                onChange={(evenement) => setChampDate(evenement.target.value)}
              >
                {CHAMPS_DATE.map((entree) => (
                  <option
                    key={entree.code}
                    value={entree.code}
                    hidden={entree.code === 'TOUTES'}
                  >
                    {entree.libelle}
                  </option>
                ))}
              </select>
            </div>
          )}

          {vue === 'toutes' && (
            <div className="filtre-champ">
              <label htmlFor="filtre-date">Date</label>
              <div className="filtre-date">
                <input
                  id="filtre-date"
                  type="date"
                  value={dateFiltre}
                  onChange={(evenement) => setDateFiltre(evenement.target.value)}
                />
                <button
                  type="button"
                  className="bouton"
                  onClick={() => setDateFiltre(aujourdhuiIso())}
                >
                  Aujourd’hui
                </button>
                <button
                  type="button"
                  className="bouton"
                  onClick={() => setDateFiltre('')}
                  disabled={dateFiltre === ''}
                >
                  Toutes les dates
                </button>
              </div>
            </div>
          )}

          <button type="button" className="bouton filtres__reset" onClick={reinitialiser}>
            Réinitialiser
          </button>
        </div>

        <input
          type="search"
          className="recherche"
          placeholder="Rechercher un libellé…"
          aria-label="Rechercher une tâche par libellé"
          value={recherche}
          onChange={(evenement) => setRecherche(evenement.target.value)}
        />
      </div>

      {chargement && (
        <div className="squelette" aria-label="Chargement des tâches" role="status">
          <div className="squelette__ligne" />
          <div className="squelette__ligne" />
          <div className="squelette__ligne" />
        </div>
      )}

      {erreur !== null && (
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
      )}

      {!chargement && erreur === null && visibles.length === 0 && (
        <div className="vide">
          <p className="vide__titre">Aucune tâche à afficher</p>
          <p>
            {taches.length === 0
              ? 'Aucune tâche ne correspond à cette vue pour le moment.'
              : 'Aucune tâche ne correspond aux filtres ou à la recherche.'}
          </p>
          {peutCreer && taches.length === 0 && (
            <button type="button" className="bouton bouton--principal" onClick={onCreer}>
              Créer une tâche
            </button>
          )}
        </div>
      )}

      <TaskGroupedList
        taches={pageAffichee}
        totalSimples={totalSimples}
        totalRecurrentes={totalRecurrentes}
        onOuvrir={onOuvrir}
        estAdmin={me.utilisateur.role === 'ADMIN'}
      />

      {!chargement && erreur === null && visibles.length > TAILLE_PAGE && (
        <nav className="pagination" aria-label="Pagination des tâches">
          <span className="pagination__info">
            {debut + 1}–{Math.min(debut + TAILLE_PAGE, visibles.length)} sur {visibles.length}
          </span>
          <button
            type="button"
            className="bouton"
            disabled={pageCourante <= 1}
            onClick={() => setPage((valeur) => Math.max(1, valeur - 1))}
          >
            Précédent
          </button>
          <span className="pagination__info">
            Page {pageCourante} / {nombrePages}
          </span>
          <button
            type="button"
            className="bouton"
            disabled={pageCourante >= nombrePages}
            onClick={() => setPage((valeur) => Math.min(nombrePages, valeur + 1))}
          >
            Suivant
          </button>
        </nav>
      )}
    </section>
  )
}
