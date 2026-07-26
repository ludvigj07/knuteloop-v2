import type { ComponentProps } from 'react'
import { fireEvent, render, screen } from '@testing-library/react-native'
import { HomeTopThree } from './HomeTopThree'
import type { LeaderboardEntry } from '../../lib/api'

function entry(overrides: Partial<LeaderboardEntry> = {}): LeaderboardEntry {
  return {
    userId: 'user-1',
    russenavn: 'Løkka',
    points: 240,
    className: '3STA',
    rank: 1,
    rankTitle: "O' Store Knutemester",
    isCurrentUser: false,
    ...overrides,
  }
}

function renderTopThree(overrides: Partial<ComponentProps<typeof HomeTopThree>> = {}) {
  const props: ComponentProps<typeof HomeTopThree> = {
    entries: [],
    isLoading: false,
    error: null,
    onRetry: jest.fn(),
    onOpenProfile: jest.fn(),
    onOpenLeaderboard: jest.fn(),
    ...overrides,
  }
  render(<HomeTopThree {...props} />)
  return props
}

describe('HomeTopThree', () => {
  it('opens a profile from a top-three row', () => {
    const props = renderTopThree({
      entries: [
        entry(),
        entry({ userId: 'user-2', russenavn: 'Knerten', rank: 2, points: 180, rankTitle: 'Knutemester' }),
      ],
    })

    fireEvent.press(screen.getByLabelText('Plass 2: Knerten, 180 poeng, Knutemester'))
    expect(props.onOpenProfile).toHaveBeenCalledWith('user-2')
  })

  it('marks only the current user with the Deg chip', () => {
    renderTopThree({
      entries: [entry(), entry({ userId: 'user-2', russenavn: 'Knerten', rank: 2, isCurrentUser: true })],
    })

    expect(screen.getAllByText('Deg')).toHaveLength(1)
  })

  it('shows the quiet empty state before the school has activity', () => {
    renderTopThree({ entries: [] })

    expect(screen.getByText('Ingen plasseringer ennå')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Se hele topplisten' })).toBeNull()
  })

  it('lets the user retry when the leaderboard fails with nothing cached', () => {
    const props = renderTopThree({ entries: [], error: new Error('Nettverksfeil') })

    expect(screen.getByText('Nettverksfeil')).toBeTruthy()
    fireEvent.press(screen.getByRole('button', { name: 'Prøv igjen' }))
    expect(props.onRetry).toHaveBeenCalledTimes(1)
  })

  it('keeps showing cached rows when a refresh fails', () => {
    renderTopThree({ entries: [entry()], error: new Error('Nettverksfeil') })

    expect(screen.getByLabelText("Plass 1: Løkka, 240 poeng, O' Store Knutemester")).toBeTruthy()
    expect(screen.queryByText('Nettverksfeil')).toBeNull()
  })

  it('opens the full leaderboard from the footer button', () => {
    const props = renderTopThree({ entries: [entry()] })

    fireEvent.press(screen.getByRole('button', { name: 'Se hele topplisten' }))
    expect(props.onOpenLeaderboard).toHaveBeenCalledTimes(1)
  })
})
