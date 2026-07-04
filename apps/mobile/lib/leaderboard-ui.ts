import type { LeaderboardEntry } from './api'
import { formatNumber } from './format'

// Copy for the toppliste's pinned «min plass» card. Framed as an invitation
// (what's within reach), never as a loss — pressure-free gamification.
export function nextPlaceText(entries: LeaderboardEntry[], me: LeaderboardEntry): string {
  const above = entries.find((e) => e.rank === me.rank - 1)
  if (!above) return 'Du leder kullet!'
  const gap = Math.max(above.points - me.points, 1)
  return `Du mangler ${formatNumber(gap)} poeng til plass ${formatNumber(above.rank)}`
}
