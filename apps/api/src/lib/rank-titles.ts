// Leaderboard rank → Norwegian rank title (v1-spec §6). `rank` is the 1-based position
// on a school's leaderboard. The first tier whose upper bound covers the rank wins; rank 1
// is the unique top title. Ranks past the last tier (> 220) — and invalid ranks (< 1 or
// non-integer) — fall through to the bottom title, matching v1's `getLeaderboardTitle`.

type RankTier = { maxRank: number; title: string }

// Ordered ascending by maxRank. Thresholds are authoritative — do not invent (v1-spec §6).
const RANK_TIERS: readonly RankTier[] = [
  { maxRank: 1, title: "O' Store Knutemester" },
  { maxRank: 3, title: 'Knutemester' },
  { maxRank: 10, title: 'Knutebaron' },
  { maxRank: 20, title: 'Knuteridder' },
  { maxRank: 35, title: 'Knutesersjant' },
  { maxRank: 55, title: 'Knuteknekt' },
  { maxRank: 80, title: 'Knutelærling' },
  { maxRank: 110, title: 'Knuteamatør' },
  { maxRank: 145, title: 'Knuteprøvling' },
  { maxRank: 185, title: 'Knutetabbe' },
  { maxRank: 220, title: 'Knutenybegynner' },
]

// rank > 220, or an invalid rank.
const BOTTOM_TITLE = 'Knutekatastrofen'

export function getRankTitle(rank: number): string {
  if (!Number.isInteger(rank) || rank < 1) return BOTTOM_TITLE
  for (const tier of RANK_TIERS) {
    if (rank <= tier.maxRank) return tier.title
  }
  return BOTTOM_TITLE
}
