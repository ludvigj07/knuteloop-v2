// Norwegian (nb-NO) number and date formatting — the single source so screens
// don't each redefine Intl formatters (they were duplicated in index/profile).
// Intl instances are created once and reused (cheaper than per-call construction).

const numberFormat = new Intl.NumberFormat('nb-NO')
const shortDateFormat = new Intl.DateTimeFormat('nb-NO', { day: 'numeric', month: 'short' })
const longDateFormat = new Intl.DateTimeFormat('nb-NO', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

/** 1234 → "1 234" (space thousands separator, nb-NO). */
export function formatNumber(n: number): string {
  return numberFormat.format(n)
}

/** Points use the same formatting — alias keeps call sites readable. */
export const formatPoints = formatNumber

/** ISO string → "5. mai". */
export function formatShortDate(iso: string): string {
  return shortDateFormat.format(new Date(iso))
}

/** ISO string → "5. mai 2026". */
export function formatLongDate(iso: string): string {
  return longDateFormat.format(new Date(iso))
}
