import type { LeaderboardEntry } from './api'

// Pure helpers for the toppliste's three views. All three are derived from the
// ONE leaderboard payload the screen already fetches — no extra API calls.

export type ClassStanding = {
  className: string
  memberCount: number
  /** Snittpoeng per russ — BOTH ranked on and displayed (v1 lesson: the number
   *  you show must be the number you rank by; v1 once showed sums while
   *  ranking on averages and confused everyone). Rounded for display AFTER
   *  ranking on the raw value. */
  averagePoints: number
  rank: number
  /** True when the signed-in user belongs to this class. */
  isMyClass: boolean
}

// Klassekamp: one row per class, ranked by average points per member
// (Ludvig 2026-07-05: snitt, not sum). Users without a class are excluded.
// Ties break alphabetically (nb-NO) for a stable, deterministic order.
export function classStandings(entries: LeaderboardEntry[]): ClassStanding[] {
  const byClass = new Map<string, { sum: number; count: number; mine: boolean }>()
  for (const entry of entries) {
    if (!entry.className) continue
    const acc = byClass.get(entry.className) ?? { sum: 0, count: 0, mine: false }
    acc.sum += entry.points
    acc.count += 1
    if (entry.isCurrentUser) acc.mine = true
    byClass.set(entry.className, acc)
  }

  return [...byClass.entries()]
    .map(([className, { sum, count, mine }]) => ({
      className,
      memberCount: count,
      rawAverage: sum / count,
      isMyClass: mine,
    }))
    .sort(
      (a, b) => b.rawAverage - a.rawAverage || a.className.localeCompare(b.className, 'nb-NO'),
    )
    .map(({ rawAverage, ...standing }, idx) => ({
      ...standing,
      averagePoints: Math.round(rawAverage),
      rank: idx + 1,
    }))
}

// Any class's own leaderboard, in school-leaderboard order (already sorted by
// points). Drives both «Klassen min» and drilling into a class from Klassekamp.
export function classMembers(
  entries: LeaderboardEntry[],
  className: string | null,
): LeaderboardEntry[] {
  if (!className) return []
  return entries.filter((e) => e.className === className)
}

// «Klassen min»: the signed-in user's classmates. Empty when the user hasn't
// claimed a class.
export function classmatesOf(
  entries: LeaderboardEntry[],
  me: LeaderboardEntry | null,
): LeaderboardEntry[] {
  return classMembers(entries, me?.className ?? null)
}
