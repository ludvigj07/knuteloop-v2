import type { LeaderboardEntry } from './api'
import { classStandings, classmatesOf } from './leaderboard-ui'

function entry(
  russenavn: string,
  points: number,
  className: string | null,
  isCurrentUser = false,
): LeaderboardEntry {
  return {
    userId: `user-${russenavn}`,
    russenavn,
    points,
    className,
    rank: 0, // school rank is irrelevant for these helpers
    rankTitle: 'Knutebaron',
    isCurrentUser,
  }
}

describe('classStandings — Klassekamp ranked on average (the number shown IS the number ranked)', () => {
  it('ranks classes by average points per member, not sum', () => {
    // 3STA: 3 russ, sum 120, snitt 40. 3MKA: 1 russ, sum 100, snitt 100.
    // Sum-ranking would put 3STA first — average puts 3MKA first.
    const standings = classStandings([
      entry('A', 60, '3STA'),
      entry('B', 40, '3STA'),
      entry('C', 20, '3STA'),
      entry('D', 100, '3MKA'),
    ])
    expect(standings.map((s) => s.className)).toEqual(['3MKA', '3STA'])
    expect(standings[0]).toMatchObject({ rank: 1, averagePoints: 100, memberCount: 1 })
    expect(standings[1]).toMatchObject({ rank: 2, averagePoints: 40, memberCount: 3 })
  })

  it('excludes class-less users and rounds the displayed average', () => {
    const standings = classStandings([
      entry('A', 10, '3STA'),
      entry('B', 15, '3STA'), // snitt 12,5 → vises som 13
      entry('C', 999, null), // uten klasse — teller ikke i Klassekamp
    ])
    expect(standings).toHaveLength(1)
    expect(standings[0]).toMatchObject({ className: '3STA', memberCount: 2, averagePoints: 13 })
  })

  it('breaks average ties alphabetically (nb-NO) for a stable order', () => {
    const standings = classStandings([entry('A', 50, '3MKA'), entry('B', 50, '3STA')])
    expect(standings.map((s) => s.className)).toEqual(['3MKA', '3STA'])
    expect(standings.map((s) => s.rank)).toEqual([1, 2])
  })

  it('flags the signed-in user\'s class', () => {
    const standings = classStandings([
      entry('A', 50, '3STA', true),
      entry('B', 80, '3MKA'),
    ])
    expect(standings.find((s) => s.className === '3STA')?.isMyClass).toBe(true)
    expect(standings.find((s) => s.className === '3MKA')?.isMyClass).toBe(false)
  })
})

describe('classmatesOf — «Klassen min»', () => {
  it('returns only the signed-in user\'s classmates, in given order', () => {
    const me = entry('Meg', 40, '3STA', true)
    const list = [entry('A', 90, '3MKA'), entry('B', 60, '3STA'), me, entry('C', 10, null)]
    expect(classmatesOf(list, me).map((e) => e.russenavn)).toEqual(['B', 'Meg'])
  })

  it('is empty for a user without a class (and for no user at all)', () => {
    const me = entry('Meg', 40, null, true)
    expect(classmatesOf([me], me)).toEqual([])
    expect(classmatesOf([entry('A', 1, '3STA')], null)).toEqual([])
  })
})
