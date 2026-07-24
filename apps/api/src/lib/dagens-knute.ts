// "Dagens knute" — the deterministic daily pick (v1-spec §3).
//
// v1 rule: sort the pool by id then title (nb collation), then take
// index = daySeed % length, where daySeed = Number('YYYYMMDD').
// The Oslo fix ([V1 BUG] in the spec): the day MUST be the Europe/Oslo
// calendar day, computed in SQL by the caller — never the host clock.
//
// Pure so the sort/modulo behavior is unit-testable without a database.

export type DagensKandidat = { id: string; title: string }

export function pickDagensKnute<T extends DagensKandidat>(
  pool: readonly T[],
  daySeed: number,
): T | null {
  if (pool.length === 0) return null
  // UUIDs are plain ASCII — byte-order comparison keeps the sort stable across
  // environments. The title tiebreak (nb collation) mirrors v1; with unique
  // UUID ids it can never fire, but spec fidelity is cheap.
  const sorted = [...pool].sort(
    (a, b) =>
      (a.id < b.id ? -1 : a.id > b.id ? 1 : 0) || a.title.localeCompare(b.title, 'nb-NO'),
  )
  return sorted[daySeed % sorted.length] ?? null
}
