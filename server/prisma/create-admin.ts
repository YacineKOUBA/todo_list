/**
 * Création du premier compte administrateur — D70, T13-02, docs/12 §3.6.
 *
 * Le compte est **nominatif** : aucune donnée n'est inventée. Nom, prénom et
 * identifiant sont fournis en arguments par le directeur avant l'ÉTAPE 14.
 *
 * Usage :
 *   npm run admin:create -w @gd-trading/server -- \
 *     --identifiant=... --nom=... --prenom=... [--email=...]
 *
 * Le mot de passe temporaire est affiché **une seule fois**. Il n'est jamais
 * stocké en clair, ni journalisé, ni écrit dans l'audit.
 */

import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/security/argon2'
import { generateTemporaryPassword } from '../src/security/temporary-password'
import { LONGUEUR_MIN_MOT_DE_PASSE } from '../src/security/password-policy'

const prisma = new PrismaClient()

function option(nom: string): string | null {
  const prefixe = `--${nom}=`
  const valeur = process.argv.find((argument) => argument.startsWith(prefixe))
  if (valeur === undefined) return null
  const contenu = valeur.slice(prefixe.length).trim()
  return contenu.length === 0 ? null : contenu
}

function optionObligatoire(nom: string): string {
  const valeur = option(nom)
  if (valeur === null) {
    throw new Error(`Argument obligatoire manquant : --${nom}=...`)
  }
  return valeur
}

function validerIdentifiant(identifiant: string): void {
  if (identifiant.length < 3 || identifiant.length > 64 || /\s/.test(identifiant)) {
    throw new Error('Identifiant invalide : 3 à 64 caractères, sans espace (docs/06 §5.3).')
  }
}

async function main(): Promise<void> {
  const identifiant = optionObligatoire('identifiant')
  const nom = optionObligatoire('nom')
  const prenom = optionObligatoire('prenom')
  const email = option('email')

  validerIdentifiant(identifiant)

  if (nom.trim().length === 0 || prenom.trim().length === 0) {
    throw new Error('Le nom et le prénom sont obligatoires.')
  }

  const existant = await prisma.utilisateur.findFirst({
    where: { identifiant: { equals: identifiant, mode: 'insensitive' } },
  })
  if (existant !== null) {
    throw new Error(`L’identifiant « ${identifiant} » est déjà utilisé.`)
  }

  const motDePasseTemporaire = generateTemporaryPassword()
  const motDePasseHash = await hashPassword(motDePasseTemporaire)

  const utilisateur = await prisma.$transaction(async (tx) => {
    const employe = await tx.employe.create({
      data: {
        nom: nom.trim(),
        prenom: prenom.trim(),
        email: email === null ? null : email.toLowerCase(),
      },
    })

    const compte = await tx.utilisateur.create({
      data: {
        employeId: employe.id,
        identifiant,
        motDePasseHash,
        role: 'ADMIN',
        actif: true,
        doitChangerMotDePasse: true,
      },
    })

    await tx.journalAudit.create({
      data: {
        acteurId: null,
        typeOperation: 'COMPTE',
        entite: 'utilisateur',
        entiteId: compte.id,
        donneesApres: {
          identifiant,
          role: 'ADMIN',
          actif: true,
          doitChangerMotDePasse: true,
          source: 'admin:create',
        },
        contexte: { source: 'CLI', nom: nom.trim(), prenom: prenom.trim() },
      },
    })

    return compte
  })

  console.log('Compte administrateur créé.')
  console.log(`  identifiant          : ${identifiant}`)
  console.log(`  identifiant interne  : ${utilisateur.id}`)
  console.log(`  rôle                 : ADMIN`)
  console.log(`  changement forcé     : oui`)
  console.log('')
  console.log('Mot de passe temporaire (affiché une seule fois) :')
  console.log(`  ${motDePasseTemporaire}`)
  console.log('')
  console.log(
    `Longueur minimale à la première connexion : ${LONGUEUR_MIN_MOT_DE_PASSE} caractères (D76).`,
  )
}

main()
  .then(async () => {
    await prisma.$disconnect()
    process.exitCode = 0
  })
  .catch(async (erreur: unknown) => {
    console.error('Création refusée.')
    console.error(erreur instanceof Error ? erreur.message : erreur)
    await prisma.$disconnect()
    process.exitCode = 1
  })
