// Streak computation — pure, so it can be unit-tested without a database.
//
// The caller supplies the set of Europe/Oslo calendar days (as 'YYYY-MM-DD'
// strings) on which the user has an approved submission, plus today's Oslo day.
// The Oslo day-key MUST be derived in SQL (`(created_at AT TIME ZONE
// 'Europe/Oslo')::date`), never from the API host's clock — host timezone is
// irrelevant and a v1 bug was using host local time.
//
// Rule (reconstructed — see ADR-0013): streak = the run of consecutive days
// ending at **today or yesterday**. The grace day (yesterday) keeps an active
// streak from reading 0 before the user has had a chance to post today.

/** `'YYYY-MM-DD'` shifted by `delta` days. Done in UTC on the date parts only,
 *  so there is no time component and therefore no DST drift. */
export function addDays(isoDate: string, delta: number): string {
  const [y, m, d] = isoDate.split('-')
  const dt = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)))
  dt.setUTCDate(dt.getUTCDate() + delta)
  return dt.toISOString().slice(0, 10)
}

/** Length of the consecutive run of `activeDays` ending today or yesterday. */
export function computeStreak(activeDays: Iterable<string>, todayOslo: string): number {
  const days = new Set(activeDays)
  if (days.size === 0) return 0

  // Anchor the run end at today (preferred) or yesterday (grace). If neither has
  // activity, there is no current streak.
  let cursor: string
  if (days.has(todayOslo)) cursor = todayOslo
  else if (days.has(addDays(todayOslo, -1))) cursor = addDays(todayOslo, -1)
  else return 0

  let streak = 0
  while (days.has(cursor)) {
    streak += 1
    cursor = addDays(cursor, -1)
  }
  return streak
}
