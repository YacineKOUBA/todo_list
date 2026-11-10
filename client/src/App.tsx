import { useEffect, useState } from 'react'
import { api, ApiError, reinitialiserCsrf } from './api'
import { Layout } from './components/Layout'
import { Accounts } from './screens/Accounts'
import { Audit } from './screens/Audit'
import { ChangePassword } from './screens/ChangePassword'
import { Login } from './screens/Login'
import { Profile } from './screens/Profile'
import { Referentials } from './screens/Referentials'
import { TaskCreate } from './screens/TaskCreate'
import { TaskDetail } from './screens/TaskDetail'
import { TaskList } from './screens/TaskList'
import type { Me } from './types'
import { dateLongueFr } from './utils/format'

type Route =
  | { nom: 'aujourdhui' }
  | { nom: 'mes-taches' }
  | { nom: 'autres-taches' }
  | { nom: 'service' }
  | { nom: 'supplementaires' }
  | { nom: 'toutes-les-taches' }
  | { nom: 'comptes' }
  | { nom: 'audit' }
  | { nom: 'referentiels' }
  | { nom: 'profil' }
  | { nom: 'nouvelle-tache' }
  | { nom: 'detail'; id: string }
  | { nom: 'inconnue' }

function lireRoute(hash: string): Route {
  const chemin = hash.replace(/^#/, '') || '/'
  if (chemin === '/' || chemin === '/aujourdhui') return { nom: 'aujourdhui' }
  if (chemin === '/mes-taches') return { nom: 'mes-taches' }
  if (chemin === '/autres-taches') return { nom: 'autres-taches' }
  if (chemin === '/service') return { nom: 'service' }
  if (chemin === '/supplementaires') return { nom: 'supplementaires' }
  if (chemin === '/toutes-les-taches') return { nom: 'toutes-les-taches' }
  if (chemin === '/comptes') return { nom: 'comptes' }
  if (chemin === '/audit') return { nom: 'audit' }
  if (chemin === '/referentiels') return { nom: 'referentiels' }
  if (chemin === '/profil') return { nom: 'profil' }
  if (chemin === '/nouvelle-tache') return { nom: 'nouvelle-tache' }
  const detail = /^\/tache\/([0-9a-f-]{36})$/i.exec(chemin)
  if (detail !== null && detail[1] !== undefined) return { nom: 'detail', id: detail[1] }
  return { nom: 'inconnue' }
}

function atterrissage(me: Me): string {
  if (me.utilisateur.role === 'ADMIN' || me.utilisateur.role === 'CONSULTANT') {
    return '#/toutes-les-taches'
  }
  if (me.utilisateur.role === 'RESPONSABLE') return '#/service'
  return '#/aujourdhui'
}

function naviguer(chemin: string): void {
  window.location.hash = chemin
}

export function App() {
  const [me, setMe] = useState<Me | null>(null)
  const [chargement, setChargement] = useState(true)
  const [route, setRoute] = useState<Route>(() => lireRoute(window.location.hash))

  useEffect(() => {
    let annule = false
    api<Me>('/me')
      .then((utilisateur) => {
        if (annule) return
        setMe(utilisateur)
        if (window.location.hash === '' || window.location.hash === '#/') {
          naviguer(atterrissage(utilisateur))
        }
      })
      .catch(() => {
        if (!annule) setMe(null)
      })
      .finally(() => {
        if (!annule) setChargement(false)
      })
    return () => {
      annule = true
    }
  }, [])

  useEffect(() => {
    const surExpiration = (): void => {
      reinitialiserCsrf()
      setMe(null)
      naviguer('#/')
    }
    window.addEventListener('gd:session-expiree', surExpiration)
    return () => window.removeEventListener('gd:session-expiree', surExpiration)
  }, [])

  useEffect(() => {
    const surChangement = (): void => setRoute(lireRoute(window.location.hash))
    window.addEventListener('hashchange', surChangement)
    return () => window.removeEventListener('hashchange', surChangement)
  }, [])

  useEffect(() => {
    if (me === null) return
    if (route.nom === 'toutes-les-taches' && !me.droits.voirToutesLesTaches) {
      naviguer(atterrissage(me))
    }
    if (
      (route.nom === 'aujourdhui' || route.nom === 'mes-taches' || route.nom === 'autres-taches') &&
      me.utilisateur.role === 'CONSULTANT'
    ) {
      naviguer('#/toutes-les-taches')
    }
    if (route.nom === 'autres-taches' && me.utilisateur.role !== 'EMPLOYE') {
      naviguer(atterrissage(me))
    }
    if (route.nom === 'service' && me.utilisateur.role !== 'RESPONSABLE') {
      naviguer(atterrissage(me))
    }
    if (route.nom === 'supplementaires' && me.utilisateur.role === 'CONSULTANT') {
      naviguer(atterrissage(me))
    }
    if (route.nom === 'comptes' && !me.droits.gererComptes) {
      naviguer(atterrissage(me))
    }
    if (route.nom === 'audit' && !me.droits.consulterAudit) {
      naviguer(atterrissage(me))
    }
    if (route.nom === 'referentiels' && !me.droits.gererReferentiels) {
      naviguer(atterrissage(me))
    }
    if (
      route.nom === 'nouvelle-tache' &&
      !me.droits.creerPourAutrui &&
      !me.droits.creerPourSonService &&
      !me.droits.creerTacheSupplementaire
    ) {
      naviguer(atterrissage(me))
    }
  }, [me, route])

  if (chargement) {
    return (
      <div className="connexion">
        <p className="message">Chargement…</p>
      </div>
    )
  }

  if (me === null) {
    return (
      <Login
        onLogin={(utilisateur) => {
          reinitialiserCsrf()
          setMe(utilisateur)
          naviguer(atterrissage(utilisateur))
        }}
      />
    )
  }

  if (me.utilisateur.doitChangerMotDePasse) {
    return (
      <ChangePassword
        me={me}
        onChanged={(utilisateur) => {
          reinitialiserCsrf()
          setMe(utilisateur)
          naviguer(atterrissage(utilisateur))
        }}
        onLogout={() => {
          reinitialiserCsrf()
          setMe(null)
          naviguer('#/')
        }}
      />
    )
  }

  function contenu() {
    if (me === null) return null
    switch (route.nom) {
      case 'detail':
        return (
          <TaskDetail
            me={me}
            id={route.id}
            onRetour={() =>
              naviguer(
                me.utilisateur.role === 'EMPLOYE' ? '#/aujourdhui' : atterrissage(me),
              )
            }
            onSupprimee={() => naviguer(atterrissage(me))}
          />
        )
      case 'nouvelle-tache':
        return (
          <TaskCreate
            me={me}
            onCree={(id) => naviguer(`#/tache/${id}`)}
            onAnnuler={() => naviguer(atterrissage(me))}
          />
        )
      case 'toutes-les-taches':
        return (
          <TaskList
            me={me}
            key="toutes"
            vue="toutes"
            titre="Toutes les tâches"
            sousTitre="Périmètre complet — tâches du jour par défaut ; choisissez une autre date ou « Toutes les dates »."
            onOuvrir={(id) => naviguer(`#/tache/${id}`)}
            onCreer={() => naviguer('#/nouvelle-tache')}
          />
        )
      case 'comptes':
        return <Accounts me={me} />
      case 'audit':
        return <Audit />
      case 'referentiels':
        return <Referentials />
      case 'profil':
        return <Profile me={me} />
      case 'service':
        return (
          <TaskList
            me={me}
            key="service"
            vue="service"
            titre="Tâches de mon service"
            sousTitre={
              me.employe?.departement !== null && me.employe?.departement !== undefined
                ? `Périmètre ${me.employe.departement.libelle} — suivi des exécutants.`
                : 'Suivi des tâches de votre service.'
            }
            onOuvrir={(id) => naviguer(`#/tache/${id}`)}
            onCreer={() => naviguer('#/nouvelle-tache')}
          />
        )
      case 'supplementaires':
        return (
          <TaskList
            me={me}
            key="supplementaires"
            vue="supplementaires"
            titre="Mes tâches supplémentaires"
            sousTitre="Visibles uniquement par vous — tâches ajoutées hors plan initial, sans effet sur le score de performance."
            onOuvrir={(id) => naviguer(`#/tache/${id}`)}
            onCreer={() => naviguer('#/nouvelle-tache')}
          />
        )
      case 'autres-taches':
        return (
          <TaskList
            me={me}
            key="mes-autres-taches"
            vue="mes-autres-taches"
            titre="Mes autres tâches"
            sousTitre="Tâches simples ou récurrentes qui vous sont assignées, hors tâches du jour."
            onOuvrir={(id) => naviguer(`#/tache/${id}`)}
            onCreer={() => naviguer('#/nouvelle-tache')}
          />
        )
      case 'mes-taches':
        return (
          <TaskList
            me={me}
            key="mes-taches"
            vue="mes-taches"
            titre="Mes tâches"
            sousTitre="Toutes les tâches dont vous êtes exécutant, pilote ou auteur."
            onOuvrir={(id) => naviguer(`#/tache/${id}`)}
            onCreer={() => naviguer('#/nouvelle-tache')}
          />
        )
      case 'aujourdhui':
        return (
          <TaskList
            me={me}
            key="mes-taches-du-jour"
            vue="mes-taches-du-jour"
            titre={me.utilisateur.role === 'ADMIN' ? 'Tableau de bord' : 'Mes tâches du jour'}
            sousTitre={`${dateLongueFr()} — tâches liées au jour même (Date cible : action, début ou fin prévue).`}
            onOuvrir={(id) => naviguer(`#/tache/${id}`)}
            onCreer={() => naviguer('#/nouvelle-tache')}
          />
        )
      case 'inconnue':
        return (
          <div className="vide">
            <p className="vide__titre">Page introuvable</p>
            <p>Cette adresse ne correspond à aucun écran de l’application.</p>
            <button
              type="button"
              className="bouton bouton--principal"
              onClick={() => naviguer(atterrissage(me))}
            >
              Revenir à l’accueil
            </button>
          </div>
        )
    }
  }

  return (
    <Layout
      me={me}
      route={window.location.hash.replace(/^#/, '')}
      onLogout={() => {
        reinitialiserCsrf()
        setMe(null)
        naviguer('#/')
      }}
    >
      {contenu()}
    </Layout>
  )
}

/** Exporté pour les tests : une erreur d’API ne doit jamais casser l’écran. */
export { ApiError }
