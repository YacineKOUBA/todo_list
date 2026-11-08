/**
 * Secours hors ligne — T13-03, docs/12 §3.7.
 *
 * Utilisé lorsque l'unique administrateur a perdu son mot de passe. Le script
 * génère un mot de passe temporaire, impose son changement, révoque toutes les
 * sessions et journalise l'opération avec un acteur `NULL` (système).
 *
 * Usage :
 *   npm run admin:reset -w @gd-trading/server -- --identifiant=...
 *
 * Le mot de passe temporaire est affiché **une seule fois** dans la console
 * du serveur. Il n'est jamais stocké en clair, ni journalisé.
 */

import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/security/argon2'
import { generateTemporaryPassword } from '../src/security/temporary-password'

const prisma = new PrismaClient()

function identifiantDemande(): string {
  const prefixe = '--identifiant='
  const valeur = process.argv.find((argument) => argument.startsWith(prefixe))
  if (valeur === undefined) {
    throw new Error('Argument obligatoire manquant : --identifiant=...')
  }
  const identifiant = valeur.slice(prefixe.length).trim()
  if (identifiant.length === 0) {
    throw new Error('L’identifiant ne peut pas être vide.')
  }
  return identifiant
}

async function main(): Promise<void> {
  const identifiant = identifiantDemande()

  const utilisateur = await prisma.utilisateur.findFirst({
    where: {
      identifiant: { equals: identifiant, mode: 'insensitive' },
      role: 'ADMIN',
    },
  })

  if (utilisateur === null) {
    throw new Error(`Aucun compte ADMIN ne correspond à « ${identifiant} ».`)
  }

  const motDePasseTemporaire = generateTemporaryPassword()
  const motDePasseHash = await hashPassword(motDePasseTemporaire)
  const maintenant = new Date()

  await prisma.$transaction(async (tx) => {
    await tx.utilisateur.update({
      where: { id: utilisateur.id },
      data: {
        motDePasseHash,
        doitChangerMotDePasse: true,
        tentativesEchouees: 0,
        verrouilleJusqua: null,
        modifieLe: maintenant,
      },
    })

    await tx.session.updateMany({
      where: { utilisateurId: utilisateur.id, revoqueLe: null },
      data: { revoqueLe: maintenant },
    })

    await tx.journalAudit.create({
      data: {
        acteurId: null,
        typeOperation: 'MOT_DE_PASSE',
        entite: 'utilisateur',
        entiteId: utilisateur.id,
        donneesApres: {
          identifiant: utilisateur.identifiant,
          doitChangerMotDePasse: true,
          tentativesEchouees: 0,
          verrouilleJusqua: null,
        },
        contexte: { source: 'admin:reset', sessionsRevoquees: true },
      },
    })
  })

  console.log('Réinitialisation d’urgence effectuée.')
  console.log(`  identifiant          : ${utilisateur.identifiant}`)
  console.log(`  changement forcé     : oui`)
  console.log(`  sessions révoquées   : oui`)
  console.log('')
  console.log('Mot de passe temporaire (affiché une seule fois) :')
  console.log(`  ${motDePasseTemporaire}`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
    process.exitCode = 0
  })
  .catch(async (erreur: unknown) => {
    console.error('Réinitialisation refusée.')
    console.error(erreur instanceof Error ? erreur.message : erreur)
    await prisma.$disconnect()
    process.exitCode = 1
  })
