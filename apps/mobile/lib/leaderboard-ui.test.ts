import type { LeaderboardEntry } from './api'
import { nextPlaceText } from './leaderboard-ui'

function entry(rank: number, points: number, isCurrentUser = false): LeaderboardEntry {
  return {
    userId: `user-${rank}`,
    russenavn: `Russ${rank}`,
    points,
    rank,
    rankTitle: 'Knutebaron',
    isCurrentUser,
  }
}

describe('nextPlaceText — copy for the pinned «min plass» card', () => {
  it('celebrates the leader instead of showing a gap', () => {
    const me = entry(1, 120, true)
    expect(nextPlaceText([me, entry(2, 90)], me)).toBe('Du leder kullet!')
  })

  it('shows the points needed to reach the place above', () => {
    const me = entry(3, 85, true)
    expect(nextPlaceText([entry(1, 120), entry(2, 90), me], me)).toBe(
      'Du mangler 5 poeng til plass 2',
    )
  })

  it('never says 0 poeng on a points tie (rank broken by name)', () => {
    const me = entry(2, 90, true)
    expect(nextPlaceText([entry(1, 90), me], me)).toBe('Du mangler 1 poeng til plass 1')
  })
})
