import { useEffect, useMemo, useState } from 'react'
import { api, ApiError } from '../api'
import { TaskCard } from '../components/TaskCard'
import type { Me, Page, TacheListe } from '../types'
import { ajouterJours, aujourdhuiIso } from '../utils/format'

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

const PERIODES = [
  { code: 'TOUTES', libelle: 'Toutes' },
  { code: 'AUJOURDHUI', libelle: "Aujourd’hui" },
  { code: '7J', libelle: '7 prochains jours' },
  { code: '30J', libelle: '30 prochains jours' },
] as const

const TAILLE_PAGE = 20

function echeanceDe(tache: TacheListe): string | null {
  return tache.nature === 'QUOTIDIENNE' ? tache.dateAction : tache.dateFinPrevue
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
  const [assigne, setAssigne] = useState<string>('TOUS')
  const [periode, setPeriode] = useState<string>('TOUTES')
  const [recherche, setRecherche] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    let annule = false
    setChargement(true)
    setErreur(null)
    // Évite d'afficher brièvement les tâches de la vue précédente.
    setTaches([])
    api<Page<TacheListe>>(`/tasks?vue=${vue}&taille=200`)
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
  }, [vue, rechargement])

  useEffect(() => {
    setPage(1)
  }, [statut, priorite, assigne, periode, recherche, vue])

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
    const aujourdhui = aujourdhuiIso()
    const limite =
      periode === '7J'
        ? ajouterJours(aujourdhui, 7)
        : periode === '30J'
          ? ajouterJours(aujourdhui, 30)
          : null

    return taches.filter((tache) => {
      if (statut !== 'TOUTES' && tache.statut.code !== statut) return false
      if (priorite !== 'TOUTES' && tache.priorite.code !== priorite) return false
      if (assigne !== 'TOUS' && tache.assigneA.id !== assigne) return false

      if (periode !== 'TOUTES') {
        const date = echeanceDe(tache)
        if (date === null) return false
        if (periode === 'AUJOURDHUI' && date !== aujourdhui) return false
        if (limite !== null && (date < aujourdhui || date > limite)) return false
      }

      if (rechercheNormalisee.length === 0) return true
      return tache.libelle
        .toLocaleLowerCase('fr-FR')
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .includes(rechercheNormalisee)
    })
  }, [taches, statut, priorite, assigne, periode, recherche])

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
    setAssigne('TOUS')
    setPeriode('TOUTES')
    setRecherche('')
  }

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

          <div className="filtre-champ">
            <label htmlFor="filtre-periode">Période</label>
            <select
              id="filtre-periode"
              value={periode}
              onChange={(evenement) => setPeriode(evenement.target.value)}
            >
              {PERIODES.map((entree) => (
                <option key={entree.code} value={entree.code}>
                  {entree.libelle}
                </option>
              ))}
            </select>
          </div>

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

      <div className="liste">
        {pageAffichee.map((tache) => (
          <TaskCard key={tache.id} tache={tache} onOuvrir={onOuvrir} />
        ))}
      </div>

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
