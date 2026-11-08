/**
 * Jeu de démonstration — base `gd_trading_demo` UNIQUEMENT.
 *
 * Ce script n'est pas le seed de référence : il ajoute des données fictives
 * pour montrer l'interface au directeur. Il refuse de s'exécuter si l'URL de
 * base ne contient pas `gd_trading_demo`, et refuse d'écraser des données.
 *
 * Aucun compte nominatif réel n'est créé ici (D70) : le compte ADMIN de
 * production reste à créer par `npm run admin:create`.
 */

import { PrismaClient, type Prisma, type Tache } from '@prisma/client'
import { hashPassword } from '../src/security/argon2'
import { addCalendarDays, calendarDateToUtcDate, todayInTimeZone } from '../src/lib/calendar-date'

const prisma = new PrismaClient()

const MOT_DE_PASSE_DEMO = 'GdTradingDemo2026!'
const FUSEAU = 'Africa/Algiers'

interface EmployeDemo {
  identifiant: string
  nom: string
  prenom: string
  email: string
  departement: string
  role: 'ADMIN' | 'RESPONSABLE' | 'EMPLOYE' | 'CONSULTANT'
}

const COMPTES: readonly EmployeDemo[] = [
  { identifiant: 'admin', nom: 'DEMONSTRATION', prenom: 'Direction', email: 'direction@demo.local', departement: 'TOP MANAGEMENT', role: 'ADMIN' },
  { identifiant: 's.benali', nom: 'BENALI', prenom: 'Sami', email: 's.benali@demo.local', departement: 'POLE SUPPORT & PERFORMANCE', role: 'RESPONSABLE' },
  { identifiant: 'n.haddad', nom: 'HADDAD', prenom: 'Nadia', email: 'n.haddad@demo.local', departement: 'COMPTABILITE', role: 'RESPONSABLE' },
  { identifiant: 'k.cherif', nom: 'CHERIF', prenom: 'Karim', email: 'k.cherif@demo.local', departement: 'ACHATS INTERNATIONAUX', role: 'RESPONSABLE' },
  { identifiant: 'a.mansouri', nom: 'MANSOURI', prenom: 'Amel', email: 'a.mansouri@demo.local', departement: 'COMPTABILITE', role: 'EMPLOYE' },
  { identifiant: 'y.bouzid', nom: 'BOUZID', prenom: 'Yacine', email: 'y.bouzid@demo.local', departement: 'M.Gx & LOGISTIQUE', role: 'EMPLOYE' },
  { identifiant: 'l.ferhat', nom: 'FERHAT', prenom: 'Lina', email: 'l.ferhat@demo.local', departement: 'B.U.INGREDIENTS', role: 'EMPLOYE' },
  { identifiant: 'm.saidi', nom: 'SAIDI', prenom: 'Mehdi', email: 'm.saidi@demo.local', departement: 'FINANCES', role: 'EMPLOYE' },
  { identifiant: 'r.khelifi', nom: 'KHELIFI', prenom: 'Rania', email: 'r.khelifi@demo.local', departement: 'POLE DEVELOPPEMENT DES ACTIVITES', role: 'EMPLOYE' },
  { identifiant: 'o.taleb', nom: 'TALEB', prenom: 'Omar', email: 'o.taleb@demo.local', departement: 'COORDINATION R&I', role: 'EMPLOYE' },
  { identifiant: 'demo.consultant', nom: 'LECTURE', prenom: 'Consultant', email: 'consultant@demo.local', departement: 'TOP MANAGEMENT', role: 'CONSULTANT' },
]

interface TacheDemo {
  libelle: string
  nature: 'QUOTIDIENNE' | 'AUTRE'
  element: string
  /** Employé assigné (tâches dont l'acteur est GD_TRADING). */
  assigneA?: string
  /** Tâche assignée au partenaire du référentiel (acteur PARTENAIRE). */
  assigneAPartenaire?: boolean
  acteur: 'GD_TRADING' | 'PARTENAIRE'
  /** Pilote employé ; par défaut, l'employé assigné. */
  piloteEmploye?: string
  urgence: string
  importance: string
  /** Décalage en jours par rapport à aujourd'hui (date d'action). */
  action: number
  /** Décalage de la date de début (défaut : action). */
  debut?: number
  /** Décalage de la date de fin prévue (tâches AUTRE). */
  finPrevue?: number
  /** Décalage de la date de fin (tâche achevée). */
  fin?: number
  /** Motif obligatoire si la clôture est postérieure à l'échéance (D15). */
  motif?: string
  statutManuel?: 'ANNULEE' | 'SUSPENDUE'
  progression?: number
  commentaire?: string
}

const TACHES: readonly TacheDemo[] = [
  { libelle: 'Relancer les factures fournisseurs en attente', nature: 'AUTRE', element: 'PROCESS', assigneA: 'a.mansouri', acteur: 'GD_TRADING', urgence: 'Immédiate', importance: 'Critique', action: -8, debut: -8, finPrevue: -2, commentaire: 'Deux relances déjà envoyées, sans réponse.' },
  { libelle: 'Contrôler les déclarations douanières du mois', nature: 'AUTRE', element: 'PROCESS', assigneA: 'k.cherif', acteur: 'GD_TRADING', urgence: 'Courte échéance', importance: 'Elevée', action: -5, debut: -5, finPrevue: -1 },
  { libelle: 'Mettre à jour le tableau de bord logistique', nature: 'AUTRE', element: 'REPORTING', assigneA: 'y.bouzid', acteur: 'GD_TRADING', urgence: 'Courte échéance', importance: 'Modérée', action: -3, debut: -3, finPrevue: 3, progression: 45 },
  { libelle: 'Valider les prix de la nouvelle gamme', nature: 'AUTRE', element: 'PERFORMANCE', assigneA: 'l.ferhat', acteur: 'GD_TRADING', urgence: 'Immédiate', importance: 'Elevée', action: -2, debut: -2, finPrevue: 1 },
  { libelle: 'Préparer le comité de direction', nature: 'AUTRE', element: 'GOUVERNANCE', assigneA: 'admin', acteur: 'GD_TRADING', urgence: 'Courte échéance', importance: 'Critique', action: -1, debut: -1, finPrevue: 4 },
  { libelle: 'Clôturer les comptes du mois précédent', nature: 'AUTRE', element: 'PROCESS', assigneA: 'n.haddad', acteur: 'GD_TRADING', urgence: 'Planifiable', importance: 'Elevée', action: -10, debut: -10, finPrevue: -4, fin: -4 },
  { libelle: 'Archiver les contrats fournisseurs 2025', nature: 'AUTRE', element: 'PROCESS', assigneA: 'a.mansouri', acteur: 'GD_TRADING', urgence: 'Planifiable', importance: 'Faible', action: -20, debut: -20, finPrevue: -12, fin: -11, motif: 'Retard d’archivage dû à une pièce manquante.' },
  { libelle: 'Organiser l’entretien annuel de l’équipe', nature: 'AUTRE', element: 'EQUIPE', assigneA: 's.benali', acteur: 'GD_TRADING', urgence: 'Planifiable', importance: 'Modérée', action: 2, debut: 2, finPrevue: 12 },
  { libelle: 'Réviser la procédure de validation des achats', nature: 'AUTRE', element: 'PROCESS', assigneA: 'k.cherif', acteur: 'GD_TRADING', urgence: 'Courte échéance', importance: 'Elevée', action: 1, debut: 1, finPrevue: 9 },
  { libelle: 'Former l’équipe au nouvel outil de suivi', nature: 'AUTRE', element: 'EQUIPE', assigneA: 'r.khelifi', acteur: 'GD_TRADING', urgence: 'Planifiable', importance: 'Modérée', action: 3, debut: 3, finPrevue: 15 },
  { libelle: 'Auditer la qualité des données clients', nature: 'AUTRE', element: 'PERFORMANCE', assigneA: 'o.taleb', acteur: 'GD_TRADING', urgence: 'Planifiable', importance: 'Critique', action: 5, debut: 5, finPrevue: 20 },
  { libelle: 'Négocier le renouvellement du contrat transport', nature: 'AUTRE', element: 'RESSOURCES / OUTILS', assigneAPartenaire: true, piloteEmploye: 'k.cherif', acteur: 'PARTENAIRE', urgence: 'Courte échéance', importance: 'Critique', action: -1, debut: -1, finPrevue: 6 },
  { libelle: 'Mettre à jour le plan de trésorerie', nature: 'AUTRE', element: 'REPORTING', assigneA: 'm.saidi', acteur: 'GD_TRADING', urgence: 'Immédiate', importance: 'Critique', action: 0, debut: 0, finPrevue: 2 },
  { libelle: 'Vérifier les écarts de stock entrepôt', nature: 'AUTRE', element: 'PERFORMANCE', assigneA: 'y.bouzid', acteur: 'GD_TRADING', urgence: 'Courte échéance', importance: 'Elevée', action: -4, debut: -4, finPrevue: 2, statutManuel: 'SUSPENDUE' },
  { libelle: 'Réceptionner le lot de matières premières', nature: 'AUTRE', element: 'RESSOURCES / OUTILS', assigneA: 'y.bouzid', acteur: 'GD_TRADING', urgence: 'Planifiable', importance: 'Faible', action: -6, debut: -6, finPrevue: 4, statutManuel: 'ANNULEE' },
  { libelle: 'Relancer les impayés de plus de 60 jours', nature: 'QUOTIDIENNE', element: 'PROCESS', assigneA: 'a.mansouri', acteur: 'GD_TRADING', urgence: 'Immédiate', importance: 'Critique', action: 0 },
  { libelle: 'Contrôler les encaissements de la veille', nature: 'QUOTIDIENNE', element: 'PROCESS', assigneA: 'n.haddad', acteur: 'GD_TRADING', urgence: 'Courte échéance', importance: 'Elevée', action: 0 },
  { libelle: 'Mettre à jour les indicateurs du jour', nature: 'QUOTIDIENNE', element: 'REPORTING', assigneA: 'admin', acteur: 'GD_TRADING', urgence: 'Courte échéance', importance: 'Modérée', action: 0 },
  { libelle: 'Suivre les expéditions en cours', nature: 'QUOTIDIENNE', element: 'REPORTING', assigneA: 'y.bouzid', acteur: 'GD_TRADING', urgence: 'Planifiable', importance: 'Modérée', action: 0 },
  { libelle: 'Pointer les anomalies qualité de la production', nature: 'QUOTIDIENNE', element: 'PERFORMANCE', assigneA: 'l.ferhat', acteur: 'GD_TRADING', urgence: 'Courte échéance', importance: 'Elevée', action: 0 },
  { libelle: 'Préparer les éléments de reporting hebdomadaire', nature: 'AUTRE', element: 'REPORTING', assigneA: 's.benali', acteur: 'GD_TRADING', urgence: 'Courte échéance', importance: 'Modérée', action: 1, debut: 1, finPrevue: 5 },
  { libelle: 'Clôturer le plan d’action qualité', nature: 'AUTRE', element: 'PROCESS', assigneA: 'o.taleb', acteur: 'GD_TRADING', urgence: 'Planifiable', importance: 'Faible', action: -30, debut: -30, finPrevue: -20, fin: -19, motif: 'Attente de la validation du fournisseur.' },
]

function refuser(condition: boolean, message: string): void {
  if (condition) throw new Error(message)
}

/** Exige une condition vraie et affine les types (assertion). */
function exiger(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

/**
 * Instantané des champs d'une tâche, au même format que celui écrit par l'API
 * (`docs/07` §10). Les tâches insérées directement n'ont pas d'historique :
 * ce jeu de démonstration écrit donc les événements à la main.
 */
function instantaneDemo(tache: Tache): Record<string, unknown> {
  return {
    libelle: tache.libelle,
    nature: tache.nature,
    elementId: tache.elementId,
    acteur: tache.acteur,
    piloteEmployeId: tache.piloteEmployeId ?? null,
    pilotePartenaireId: tache.pilotePartenaireId ?? null,
    assigneAEmployeId: tache.assigneAEmployeId,
    assigneAPartenaireId: tache.assigneAPartenaireId,
    dateAction: tache.dateAction.toISOString().slice(0, 10),
    dateDebut: tache.dateDebut.toISOString().slice(0, 10),
    dateFinPrevue:
      tache.dateFinPrevue === null ? null : tache.dateFinPrevue.toISOString().slice(0, 10),
    urgenceId: tache.urgenceId,
    importanceId: tache.importanceId,
    actionAPrendreId: tache.actionAPrendreId ?? null,
  }
}

function aujourdhui(): string {
  return todayInTimeZone(new Date(), FUSEAU)
}

async function main(): Promise<void> {
  const url = process.env['DATABASE_URL'] ?? ''
  refuser(
    !url.includes('gd_trading_demo'),
    'Refus : ce script ne s’exécute que sur la base gd_trading_demo.',
  )

  const dejaDesComptes = await prisma.utilisateur.count()
  refuser(
    dejaDesComptes > 0,
    'Refus : la base de démonstration contient déjà des comptes. Utilisez une base neuve.',
  )

  const jours = aujourdhui()
  const date = (decalage: number): Date => calendarDateToUtcDate(addCalendarDays(jours, decalage))

  const departements = new Map(
    (await prisma.departement.findMany()).map((departement) => [departement.libelle, departement.id]),
  )
  const elements = new Map(
    (await prisma.element.findMany()).map((element) => [element.libelle, element.id]),
  )
  const urgences = new Map(
    (await prisma.urgence.findMany()).map((urgence) => [urgence.libelle, urgence.id]),
  )
  const importances = new Map(
    (await prisma.importance.findMany()).map((importance) => [importance.libelle, importance.id]),
  )
  const matrice = await prisma.matricePriorite.findMany()

  const hash = await hashPassword(MOT_DE_PASSE_DEMO)
  const utilisateurs = new Map<string, string>()
  const employes = new Map<string, string>()

  await prisma.$transaction(async (tx) => {
    const partenaire = await tx.partenaire.create({
      data: { libelle: 'TRANSPORTEUR ATLAS', actif: true },
    })

    for (const compte of COMPTES) {
      const departementId = departements.get(compte.departement) ?? null
      const employe = await tx.employe.create({
        data: {
          nom: compte.nom,
          prenom: compte.prenom,
          email: compte.email,
          departementId,
        },
      })
      employes.set(compte.identifiant, employe.id)

      const utilisateur = await tx.utilisateur.create({
        data: {
          employeId: employe.id,
          identifiant: compte.identifiant,
          motDePasseHash: hash,
          role: compte.role,
          actif: true,
          // Démonstration uniquement : pas de changement forcé, pour montrer
          // les écrans sans étape intermédiaire. La production applique D76.
          doitChangerMotDePasse: false,
        },
      })
      utilisateurs.set(compte.identifiant, utilisateur.id)
    }

    for (const tache of TACHES) {
      const action = tache.action
      const debut = tache.debut ?? action
      const urgenceId = urgences.get(tache.urgence)
      const importanceId = importances.get(tache.importance)
      exiger(
        urgenceId !== undefined && importanceId !== undefined,
        `Priorité inconnue : ${tache.libelle}`,
      )
      const combinaison = matrice.find(
        (ligne) => ligne.urgenceId === urgenceId && ligne.importanceId === importanceId,
      )
      refuser(combinaison === undefined, `Combinaison absente de la matrice : ${tache.libelle}`)

      const elementId = elements.get(tache.element)
      const assigneAEmployeId =
        tache.assigneA === undefined ? undefined : employes.get(tache.assigneA)
      const piloteEmployeId =
        tache.piloteEmploye === undefined
          ? assigneAEmployeId
          : employes.get(tache.piloteEmploye)
      const assignePartenaire = tache.acteur === 'PARTENAIRE'
      exiger(
        elementId !== undefined &&
          piloteEmployeId !== undefined &&
          (assignePartenaire ? tache.assigneAPartenaire === true : assigneAEmployeId !== undefined),
        `Référence inconnue : ${tache.libelle}`,
      )

      // Horodatages cohérents avec la date d'action : création en matinée,
      // clôture en fin de journée de la date de fin.
      const horodatageCreation = new Date(date(action).getTime() + 8 * 60 * 60 * 1000)
      const dateFin = tache.fin === undefined ? null : date(tache.fin)
      const horodatageCloture =
        dateFin === null ? null : new Date(dateFin.getTime() + 16 * 60 * 60 * 1000)

      const tacheCreee = await tx.tache.create({
        data: {
          nature: tache.nature,
          libelle: tache.libelle,
          elementId,
          acteur: tache.acteur,
          piloteEmployeId: piloteEmployeId ?? null,
          pilotePartenaireId: null,
          assigneAEmployeId: assignePartenaire ? null : (assigneAEmployeId ?? null),
          assigneAPartenaireId: assignePartenaire ? partenaire.id : null,
          dateAction: date(action),
          dateDebut: date(debut),
          dateFinPrevue:
            tache.nature === 'QUOTIDIENNE'
              ? null
              : tache.finPrevue === undefined
                ? null
                : date(tache.finPrevue),
          dateFin,
          clotureLe: horodatageCloture,
          statutManuel: tache.statutManuel ?? null,
          progressionManuelle: tache.progression ?? null,
          motifNonAchevement: tache.motif ?? null,
          urgenceId,
          importanceId,
          creeLe: horodatageCreation,
          modifieLe: horodatageCloture ?? horodatageCreation,
          creeParId: utilisateurs.get('admin') ?? '',
          attribueParId: utilisateurs.get('admin') ?? '',
        },
      })

      await tx.journalAudit.create({
        data: {
          horodatage: horodatageCreation,
          acteurId: utilisateurs.get('admin') ?? '',
          typeOperation: 'CREATION',
          entite: 'tache',
          entiteId: tacheCreee.id,
          donneesApres: instantaneDemo(tacheCreee) as Prisma.InputJsonValue,
        },
      })

      if (tache.commentaire !== undefined) {
        const commentaireCree = await tx.commentaire.create({
          data: {
            tacheId: tacheCreee.id,
            auteurId: utilisateurs.get('a.mansouri') ?? '',
            texte: tache.commentaire,
          },
        })
        await tx.journalAudit.create({
          data: {
            horodatage: new Date(horodatageCreation.getTime() + 60 * 60 * 1000),
            acteurId: utilisateurs.get('a.mansouri') ?? '',
            typeOperation: 'COMMENTAIRE',
            entite: 'tache',
            entiteId: tacheCreee.id,
            donneesApres: { commentaireId: commentaireCree.id } as Prisma.InputJsonValue,
          },
        })
      }

      if (horodatageCloture !== null && dateFin !== null) {
        await tx.journalAudit.create({
          data: {
            horodatage: horodatageCloture,
            acteurId: utilisateurs.get('admin') ?? '',
            typeOperation: 'CLOTURE',
            entite: 'tache',
            entiteId: tacheCreee.id,
            donneesApres: {
              dateFin: dateFin.toISOString().slice(0, 10),
              clotureLe: horodatageCloture.toISOString(),
              tardive: tache.motif !== undefined,
            } as Prisma.InputJsonValue,
          },
        })
        if (tache.motif !== undefined) {
          await tx.journalAudit.create({
            data: {
              horodatage: horodatageCloture,
              acteurId: utilisateurs.get('admin') ?? '',
              typeOperation: 'MOTIF',
              entite: 'tache',
              entiteId: tacheCreee.id,
              donneesApres: { motifNonAchevement: tache.motif } as Prisma.InputJsonValue,
            },
          })
        }
      }

      if (tache.statutManuel !== undefined) {
        await tx.journalAudit.create({
          data: {
            horodatage: new Date(horodatageCreation.getTime() + 3 * 24 * 60 * 60 * 1000),
            acteurId: utilisateurs.get('admin') ?? '',
            typeOperation: 'CHANGEMENT_STATUT',
            entite: 'tache',
            entiteId: tacheCreee.id,
            donneesApres: { statutManuel: tache.statutManuel } as Prisma.InputJsonValue,
          },
        })
      }

      if (tache.progression !== undefined) {
        await tx.journalAudit.create({
          data: {
            horodatage: new Date(horodatageCreation.getTime() + 2 * 24 * 60 * 60 * 1000),
            acteurId: utilisateurs.get('admin') ?? '',
            typeOperation: 'CHANGEMENT_PROGRESSION',
            entite: 'tache',
            entiteId: tacheCreee.id,
            donneesApres: { progressionManuelle: tache.progression } as Prisma.InputJsonValue,
          },
        })
      }
    }
  })

  console.log('Base de démonstration initialisée.')
  console.log(`  comptes      : ${COMPTES.length}`)
  console.log(`  tâches       : ${TACHES.length}`)
  console.log(`  mot de passe : ${MOT_DE_PASSE_DEMO} (commun aux comptes de démo)`)
  console.log('  comptes      : admin, s.benali, n.haddad, k.cherif, a.mansouri, demo.consultant…')
}

main()
  .then(async () => {
    await prisma.$disconnect()
    process.exitCode = 0
  })
  .catch(async (erreur: unknown) => {
    console.error('Initialisation refusée.')
    console.error(erreur instanceof Error ? erreur.message : erreur)
    await prisma.$disconnect()
    process.exitCode = 1
  })
