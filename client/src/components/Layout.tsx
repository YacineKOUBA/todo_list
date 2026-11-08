import { useEffect, useRef, useState, type ReactNode } from 'react'
import { api, reinitialiserCsrf } from '../api'
import type { Me } from '../types'
import { LIBELLES_ROLE } from '../types'

interface LayoutProps {
  me: Me
  route: string
  onLogout: () => void
  children: ReactNode
}

interface LienNav {
  route: string
  libelle: string
  icone: string
}

interface GroupeNav {
  titre: string
  liens: LienNav[]
}

function lienClasse(route: string, cible: string): string {
  return route === cible || route.startsWith(`${cible}/`) ? 'nav__lien nav__lien--actif' : 'nav__lien'
}

function groupesPour(me: Me, peutCreer: boolean): GroupeNav[] {
  const droits = me.droits
  const role = me.utilisateur.role

  if (role === 'CONSULTANT') {
    return [
      {
        titre: 'Consultation',
        liens: [{ route: '/toutes-les-taches', libelle: 'Consultation', icone: '◎' }],
      },
      {
        titre: 'Compte',
        liens: [{ route: '/profil', libelle: 'Mon profil', icone: '◉' }],
      },
    ]
  }

  const travail: LienNav[] = []
  if (role === 'ADMIN') {
    travail.push({ route: '/aujourdhui', libelle: 'Tableau de bord', icone: '▦' })
    travail.push({ route: '/toutes-les-taches', libelle: 'Toutes les tâches', icone: '☰' })
  } else {
    travail.push({ route: '/mes-taches', libelle: 'Mes tâches', icone: '✓' })
    if (role === 'RESPONSABLE') {
      travail.push({ route: '/service', libelle: 'Mon service', icone: '▤' })
    }
    if (role === 'EMPLOYE') {
      travail.push({ route: '/autres-taches', libelle: 'Mes autres tâches', icone: '▤' })
    }
    travail.push({ route: '/supplementaires', libelle: 'Tâches supplémentaires', icone: '✚' })
  }

  if (role !== 'EMPLOYE') {
    travail.push({ route: '/supplementaires', libelle: 'Tâches supplémentaires', icone: '✚' })
  }

  const groupes: GroupeNav[] = []
  if (travail.length > 0) groupes.push({ titre: 'Travail', liens: travail })

  if (peutCreer) {
    groupes.push({
      titre: 'Actions',
      liens: [{ route: '/nouvelle-tache', libelle: 'Créer une tâche', icone: '＋' }],
    })
  }

  if (droits.gererComptes || droits.consulterAudit || droits.gererReferentiels) {
    const admin: LienNav[] = []
    if (droits.gererComptes) {
      admin.push({ route: '/comptes', libelle: 'Utilisateurs', icone: '●' })
    }
    if (droits.consulterAudit) {
      admin.push({ route: '/audit', libelle: 'Journal d’audit', icone: '▤' })
    }
    if (droits.gererReferentiels) {
      admin.push({ route: '/referentiels', libelle: 'Référentiels', icone: '⚙' })
    }
    groupes.push({ titre: 'Administration', liens: admin })
  }

  groupes.push({
    titre: 'Compte',
    liens: [{ route: '/profil', libelle: 'Mon profil', icone: '◉' }],
  })

  return groupes
}

function estMobile(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(max-width: 767px)').matches
  )
}

export function Layout({ me, route, onLogout, children }: LayoutProps) {
  const [menuOuvert, setMenuOuvert] = useState(() => !estMobile())
  const routePrecedente = useRef(route)
  const droits = me.droits
  const peutCreer =
    droits.creerPourAutrui || droits.creerPourSonService || droits.creerTacheSupplementaire
  const groupes = groupesPour(me, peutCreer)
  const fil = groupes.flatMap((groupe) => groupe.liens).find(
    (lien) => route === lien.route || route.startsWith(`${lien.route}/`),
  )
  const libelleFil =
    fil?.libelle ?? (route.startsWith('/taches/') ? 'Détail de la tâche' : 'Accueil')

  useEffect(() => {
    if (routePrecedente.current === route) return
    routePrecedente.current = route
    if (estMobile()) setMenuOuvert(false)
  }, [route])

  function fermerSiMobile(): void {
    if (estMobile()) setMenuOuvert(false)
  }

  useEffect(() => {
    if (!menuOuvert) return
    const surTouche = (evenement: KeyboardEvent): void => {
      if (evenement.key === 'Escape') setMenuOuvert(false)
    }
    window.addEventListener('keydown', surTouche)
    return () => window.removeEventListener('keydown', surTouche)
  }, [menuOuvert])

  async function deconnexion(): Promise<void> {
    try {
      await api<void>('/auth/logout', { method: 'POST' })
    } finally {
      reinitialiserCsrf()
      onLogout()
    }
  }

  return (
    <div className="gabarit">
      <header className="entete">
        <button
          type="button"
          className="bouton bouton--fantome entete__menu"
          aria-label={menuOuvert ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={menuOuvert}
          aria-controls="nav-principale"
          onClick={() => setMenuOuvert((ouvert) => !ouvert)}
        >
          ☰
        </button>

        <div className="entete__marque">
          <span className="entete__logo" aria-hidden="true">
            GD
          </span>
          <div>
            <p className="entete__titre">GD TRADING</p>
            <p className="entete__sous-titre">Suivi des tâches</p>
          </div>
        </div>

        <div className="entete__utilisateur">
          <div>
            <p className="entete__nom">{me.employe?.nomComplet ?? me.utilisateur.identifiant}</p>
            <p className="entete__role">
              {LIBELLES_ROLE[me.utilisateur.role]}
              {me.employe?.departement !== null && me.employe?.departement !== undefined
                ? ` · ${me.employe.departement.libelle}`
                : ''}
            </p>
          </div>
          <button
            type="button"
            className="bouton bouton--fantome"
            onClick={() => void deconnexion()}
          >
            Déconnexion
          </button>
        </div>
      </header>

      <div className={menuOuvert ? 'corps' : 'corps corps--menu-ferme'}>
        {menuOuvert ? (
          <button
            type="button"
            className="nav__voile"
            aria-label="Fermer le menu"
            tabIndex={-1}
            onClick={() => setMenuOuvert(false)}
          />
        ) : null}

        <nav
          id="nav-principale"
          className={menuOuvert ? 'nav nav--ouvert' : 'nav'}
          aria-label="Navigation principale"
        >
          <button
            type="button"
            className="bouton bouton--fantome nav__fermer"
            aria-label="Fermer le menu"
            onClick={() => setMenuOuvert(false)}
          >
            ✕
          </button>

          {groupes.map((groupe) => (
            <div className="nav__groupe" key={groupe.titre}>
              <p className="nav__groupe-titre">{groupe.titre}</p>
              {groupe.liens.map((lien) => (
                <a
                  key={`${groupe.titre}-${lien.route}-${lien.libelle}`}
                  className={lienClasse(route, lien.route)}
                  href={`#${lien.route}`}
                  onClick={fermerSiMobile}
                >
                  <span aria-hidden="true" className="nav__icone">
                    {lien.icone}
                  </span>
                  <span className="nav__libelle">{lien.libelle}</span>
                </a>
              ))}
            </div>
          ))}

          <div className="nav__bas">
            <p className="nav__note">
              {droits.lectureSeule
                ? 'Consultation seule'
                : 'Les actions sont limitées à votre périmètre.'}
            </p>
          </div>
        </nav>

        <main className="contenu">
          <p className="fil-ariane">GD TRADING / {libelleFil}</p>
          {children}
        </main>
      </div>
    </div>
  )
}
