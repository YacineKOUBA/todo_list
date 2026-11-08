/**
 * Formats d'affichage — docs/08 §2.4 (JJ/MM/AAAA, HH:MM).
 */

export function formatDate(iso: string | null | undefined): string {
  if (iso === null || iso === undefined || iso.length < 10) return '—'
  const [annee, mois, jour] = iso.slice(0, 10).split('-')
  return `${jour}/${mois}/${annee}`
}

export function formatDateTime(iso: string | null | undefined): string {
  if (iso === null || iso === undefined) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  const jour = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Africa/Algiers',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
  const heure = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Africa/Algiers',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
  return `${jour} à ${heure}`
}

export function aujourdhuiIso(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Algiers',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

export function ajouterJours(iso: string, jours: number): string {
  const date = new Date(`${iso}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + jours)
  return date.toISOString().slice(0, 10)
}

export function dateLongueFr(): string {
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Africa/Algiers',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())
}
