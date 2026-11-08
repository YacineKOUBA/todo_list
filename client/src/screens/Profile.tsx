import type { Me } from '../types'
import { LIBELLES_ROLE } from '../types'

export function Profile({ me }: { me: Me }) {
  const droits = [
    ['Voir toutes les tâches', me.droits.voirToutesLesTaches],
    ['Voir les tâches du service', me.droits.voirTachesService],
    ['Créer pour autrui', me.droits.creerPourAutrui],
    ['Créer pour son service', me.droits.creerPourSonService],
    ['Créer une tâche supplémentaire', me.droits.creerTacheSupplementaire],
    ['Gérer les comptes', me.droits.gererComptes],
    ['Gérer les référentiels', me.droits.gererReferentiels],
    ['Consulter le journal d’audit', me.droits.consulterAudit],
    ['Voir les scores', me.droits.voirScores],
  ] as const

  return (
    <section>
      <header className="page-entete">
        <div>
          <h1>Mon profil</h1>
          <p className="page-sous-titre">Identité, rattachement et droits effectifs.</p>
        </div>
      </header>

      <div className="actions-grille">
        <section className="encart">
          <h2>Rattachement</h2>
          {me.employe === null ? (
            <p>Aucune fiche employé n’est rattachée à ce compte.</p>
          ) : (
            <dl className="profil-liste">
              <dt>Nom complet</dt>
              <dd>{me.employe.nomComplet}</dd>
              <dt>Courriel</dt>
              <dd>{me.employe.email ?? '—'}</dd>
              <dt>Département</dt>
              <dd>{me.employe.departement?.libelle ?? '—'}</dd>
            </dl>
          )}
        </section>

        <section className="encart">
          <h2>Identité</h2>
          <dl className="profil-liste">
            <dt>Identifiant</dt>
            <dd>{me.utilisateur.identifiant}</dd>
            <dt>Rôle</dt>
            <dd>{LIBELLES_ROLE[me.utilisateur.role]}</dd>
            <dt>Compte actif</dt>
            <dd>{me.utilisateur.actif ? 'Oui' : 'Non'}</dd>
          </dl>
        </section>

        <section className="encart">
          <h2>Droits effectifs</h2>
          <ul>
            {droits
              .filter(([, accorde]) => accorde)
              .map(([libelle]) => (
                <li key={libelle}>{libelle}</li>
              ))}
          </ul>
        </section>
      </div>
    </section>
  )
}
