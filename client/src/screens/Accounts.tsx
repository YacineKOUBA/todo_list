import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { api, ApiError } from '../api'
import { Toast } from '../components/Toast'
import type { Compte, Departement, Employe, Me, Page, Role } from '../types'
import { LIBELLES_ROLE } from '../types'
import { formatDateTime } from '../utils/format'

interface AccountsProps {
  me: Me
}

type ModeEmploye = 'EXISTANT' | 'NOUVEAU'

const ROLES: Role[] = ['ADMIN', 'RESPONSABLE', 'EMPLOYE', 'CONSULTANT']

function messageErreur(probleme: unknown): string {
  return probleme instanceof ApiError
    ? probleme.problem.detail
    : 'L’opération a échoué.'
}

function LigneCompte({
  compte,
  onModifie,
  onReset,
  onErreur,
}: {
  compte: Compte
  onModifie: (compte: Compte) => void
  onReset: (motDePasseTemporaire: string) => void
  onErreur: (message: string) => void
}) {
  const [role, setRole] = useState<Role>(compte.role)
  const [actif, setActif] = useState(compte.actif)
  const [enCours, setEnCours] = useState(false)

  async function enregistrer(): Promise<void> {
    setEnCours(true)
    try {
      const modifie = await api<Compte>(`/accounts/${compte.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ role, actif }),
      })
      onModifie(modifie)
    } catch (probleme) {
      onErreur(messageErreur(probleme))
    } finally {
      setEnCours(false)
    }
  }

  async function reinitialiser(): Promise<void> {
    setEnCours(true)
    try {
      const reponse = await api<{ motDePasseTemporaire: string }>(
        `/accounts/${compte.id}/reset-password`,
        { method: 'POST' },
      )
      onReset(reponse.motDePasseTemporaire)
    } catch (probleme) {
      onErreur(messageErreur(probleme))
    } finally {
      setEnCours(false)
    }
  }

  const modifie = role !== compte.role || actif !== compte.actif

  return (
    <tr>
      <td>
        <strong>{compte.identifiant}</strong>
        {compte.doitChangerMotDePasse && (
          <span className="etiquette">Mot de passe à changer</span>
        )}
      </td>
      <td>{compte.employe?.nomComplet ?? '—'}</td>
      <td>{compte.employe?.departement?.libelle ?? '—'}</td>
      <td>
        <select value={role} onChange={(evenement) => setRole(evenement.target.value as Role)}>
          {ROLES.map((valeur) => (
            <option key={valeur} value={valeur}>
              {LIBELLES_ROLE[valeur]}
            </option>
          ))}
        </select>
      </td>
      <td>
        <label className="case">
          <input
            type="checkbox"
            checked={actif}
            onChange={(evenement) => setActif(evenement.target.checked)}
          />
          Actif
        </label>
      </td>
      <td>{formatDateTime(compte.derniereConnexionLe)}</td>
      <td className="tableau__actions">
        <button
          type="button"
          className="bouton"
          onClick={() => void enregistrer()}
          disabled={enCours || !modifie}
        >
          Enregistrer
        </button>
        <button
          type="button"
          className="bouton bouton--fantome"
          onClick={() => void reinitialiser()}
          disabled={enCours}
        >
          Réinitialiser
        </button>
      </td>
    </tr>
  )
}

/** IHM-11 — comptes et rôles (docs/08 §4.11). Réservé à l’administrateur. */
export function Accounts({ me }: AccountsProps) {
  const [comptes, setComptes] = useState<Compte[]>([])
  const [employes, setEmployes] = useState<Employe[]>([])
  const [departements, setDepartements] = useState<Departement[]>([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState<string | null>(null)
  const [succes, setSucces] = useState<string | null>(null)
  const [motDePasseTemporaire, setMotDePasseTemporaire] = useState<string | null>(null)

  const [identifiant, setIdentifiant] = useState('')
  const [role, setRole] = useState<Role>('EMPLOYE')
  const [modeEmploye, setModeEmploye] = useState<ModeEmploye>('EXISTANT')
  const [employeId, setEmployeId] = useState('')
  const [nom, setNom] = useState('')
  const [prenom, setPrenom] = useState('')
  const [email, setEmail] = useState('')
  const [departementId, setDepartementId] = useState('')
  const [envoi, setEnvoi] = useState(false)

  const charger = useCallback(async (): Promise<void> => {
    setChargement(true)
    try {
      const [listeComptes, listeEmployes, listeDepartements] = await Promise.all([
        api<Page<Compte>>('/accounts?taille=200'),
        api<Page<Employe>>('/employees?taille=200&actif=true'),
        api<{ elements: Departement[] }>('/departments'),
      ])
      setComptes(listeComptes.elements)
      setEmployes(listeEmployes.elements)
      setDepartements(listeDepartements.elements)
      setErreur(null)
    } catch (probleme) {
      setErreur(messageErreur(probleme))
    } finally {
      setChargement(false)
    }
  }, [])

  useEffect(() => {
    void charger()
  }, [charger])

  const employesDisponibles = useMemo(() => {
    const lies = new Set(
      comptes
        .filter((compte) => compte.employe !== null)
        .map((compte) => compte.employe?.id),
    )
    return employes.filter((employe) => !lies.has(employe.id))
  }, [comptes, employes])

  function signaler(message: string): void {
    setSucces(message)
    setErreur(null)
    setMotDePasseTemporaire(null)
  }

  async function creer(evenement: FormEvent): Promise<void> {
    evenement.preventDefault()
    setEnvoi(true)
    setErreur(null)
    setSucces(null)
    setMotDePasseTemporaire(null)

    const corps: Record<string, unknown> = { identifiant, role }
    if (modeEmploye === 'NOUVEAU') {
      corps['employe'] = {
        nom: nom.trim(),
        prenom: prenom.trim(),
        email: email.trim().length === 0 ? null : email.trim(),
        departementId: departementId.length === 0 ? null : departementId,
      }
    } else if (employeId.length > 0) {
      corps['employeId'] = employeId
    }

    try {
      const cree = await api<Compte & { motDePasseTemporaire?: string }>('/accounts', {
        method: 'POST',
        body: JSON.stringify(corps),
      })
      setComptes((liste) => [cree, ...liste])
      setEmployes((liste) => (cree.employe === null ? liste : liste.filter((e) => e.id !== cree.employe?.id)))
      setIdentifiant('')
      setNom('')
      setPrenom('')
      setEmail('')
      setDepartementId('')
      setEmployeId('')
      setSucces(`Compte « ${cree.identifiant} » créé.`)
      if (cree.motDePasseTemporaire !== undefined) {
        setMotDePasseTemporaire(cree.motDePasseTemporaire)
      }
    } catch (probleme) {
      setErreur(messageErreur(probleme))
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <section>
      <header className="page-entete">
        <div>
          <h1>Comptes et rôles</h1>
          <p className="page-sous-titre">
            Un compte par employé. Aucune suppression : le compte se désactive et ses sessions sont
            révoquées.
          </p>
        </div>
      </header>

      {chargement && (
        <div className="squelette" aria-label="Chargement des comptes" role="status">
          <div className="squelette__ligne" />
          <div className="squelette__ligne" />
        </div>
      )}

      {erreur !== null && (
        <div className="message message--erreur" role="alert">
          <p>{erreur}</p>
          <button type="button" className="bouton" onClick={() => void charger()}>
            Réessayer
          </button>
        </div>
      )}
      {succes !== null && <Toast message={succes} onFermer={() => setSucces(null)} />}
      {motDePasseTemporaire !== null && (
        <p className="message message--succes" role="status">
          Mot de passe temporaire, affiché une seule fois : <strong>{motDePasseTemporaire}</strong>.
          Le compte devra le changer à la première connexion.
        </p>
      )}

      <form className="formulaire formulaire--large" onSubmit={(evenement) => void creer(evenement)}>
        <fieldset>
          <legend>Nouveau compte</legend>

          <label htmlFor="identifiant">Identifiant *</label>
          <input
            id="identifiant"
            value={identifiant}
            minLength={3}
            maxLength={64}
            onChange={(evenement) => setIdentifiant(evenement.target.value)}
            required
          />

          <label htmlFor="role">Rôle *</label>
          <select
            id="role"
            value={role}
            onChange={(evenement) => setRole(evenement.target.value as Role)}
          >
            {ROLES.map((valeur) => (
              <option key={valeur} value={valeur}>
                {LIBELLES_ROLE[valeur]}
              </option>
            ))}
          </select>

          {role !== 'CONSULTANT' && (
            <>
              <label htmlFor="modeEmploye">Fiche employé</label>
              <select
                id="modeEmploye"
                value={modeEmploye}
                onChange={(evenement) => setModeEmploye(evenement.target.value as ModeEmploye)}
              >
                <option value="EXISTANT">Employé existant</option>
                <option value="NOUVEAU">Créer la fiche employé</option>
              </select>

              {modeEmploye === 'EXISTANT' ? (
                <>
                  <label htmlFor="employeId">Employé *</label>
                  <select
                    id="employeId"
                    value={employeId}
                    onChange={(evenement) => setEmployeId(evenement.target.value)}
                    required
                  >
                    <option value="">— Choisir —</option>
                    {employesDisponibles.map((employe) => (
                      <option key={employe.id} value={employe.id}>
                        {employe.nomComplet}
                        {employe.departement !== null ? ` · ${employe.departement.libelle}` : ''}
                      </option>
                    ))}
                  </select>
                </>
              ) : (
                <>
                  <label htmlFor="prenom">Prénom *</label>
                  <input
                    id="prenom"
                    value={prenom}
                    maxLength={100}
                    onChange={(evenement) => setPrenom(evenement.target.value)}
                    required
                  />
                  <label htmlFor="nom">Nom *</label>
                  <input
                    id="nom"
                    value={nom}
                    maxLength={100}
                    onChange={(evenement) => setNom(evenement.target.value)}
                    required
                  />
                  <label htmlFor="email">Courriel</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    maxLength={254}
                    onChange={(evenement) => setEmail(evenement.target.value)}
                  />
                  <label htmlFor="departementId">Département</label>
                  <select
                    id="departementId"
                    value={departementId}
                    onChange={(evenement) => setDepartementId(evenement.target.value)}
                  >
                    <option value="">— Aucun —</option>
                    {departements
                      .filter((departement) => departement.actif)
                      .map((departement) => (
                        <option key={departement.id} value={departement.id}>
                          {departement.libelle}
                        </option>
                      ))}
                  </select>
                </>
              )}
            </>
          )}

          <div className="boutons-ligne">
            <button type="submit" className="bouton bouton--principal" disabled={envoi}>
              {envoi ? 'Création…' : 'Créer le compte'}
            </button>
          </div>
        </fieldset>
      </form>

      <div className="tableau-conteneur">
        <table className="tableau">
          <thead>
            <tr>
              <th>Identifiant</th>
              <th>Employé</th>
              <th>Département</th>
              <th>Rôle</th>
              <th>État</th>
              <th>Dernière connexion</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {comptes.map((compte) => (
              <LigneCompte
                key={compte.id}
                compte={compte}
                onModifie={(modifie) => {
                  setComptes((liste) => liste.map((c) => (c.id === modifie.id ? modifie : c)))
                  signaler(`Compte « ${modifie.identifiant} » mis à jour.`)
                }}
                onReset={(temporaire) => {
                  setMotDePasseTemporaire(temporaire)
                  setSucces(`Mot de passe réinitialisé pour « ${compte.identifiant} ».`)
                  setErreur(null)
                }}
                onErreur={setErreur}
              />
            ))}
            {!chargement && erreur === null && comptes.length === 0 && (
              <tr>
                <td className="tableau__vide" colSpan={7}>
                  Aucun compte enregistré.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="aide">
        Connecté en tant que {me.utilisateur.identifiant}. Un administrateur ne peut pas retirer son
        propre rôle ni se désactiver ; le dernier administrateur actif est protégé.
      </p>
    </section>
  )
}
