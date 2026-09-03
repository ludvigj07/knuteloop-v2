import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { UserPeekSheet } from './UserPeekSheet'
import { fetchUserProfile, fetchUserSubmissions } from '../../lib/api'

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))
jest.mock('../../lib/api', () => ({
  fetchUserProfile: jest.fn(),
  fetchUserSubmissions: jest.fn(),
}))

function renderSheet(onOpenFullProfile = jest.fn(), onClose = jest.fn()) {
  ;(fetchUserProfile as jest.Mock).mockResolvedValue({
    user: {
      id: 'user-1',
      russenavn: 'Knerten',
      role: 'student',
      russType: 'red',
      quote: 'Tar ein knute om gongen',
      points: 1240,
      className: '3STA',
      rank: 4,
      rankTitle: 'Knutesamler',
      completedCount: 12,
      goldCount: 2,
    },
  })
  ;(fetchUserSubmissions as jest.Mock).mockResolvedValue({
    submissions: [
      { id: 's1', knuteTitle: 'Morgenbad', knutePoints: 20 },
      { id: 's2', knuteTitle: 'Russedåp', knutePoints: 10 },
    ],
    nextCursor: null,
  })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <UserPeekSheet
        userId="user-1"
        onClose={onClose}
        onOpenFullProfile={onOpenFullProfile}
      />
    </QueryClientProvider>,
  )
  return { onOpenFullProfile, onClose }
}

describe('UserPeekSheet', () => {
  it('viser en rask profiloversikt og de siste knutene', async () => {
    renderSheet()
    await waitFor(() => expect(screen.getByText('Knerten')).toBeTruthy())
    expect(screen.getByText('1 240')).toBeTruthy()
    expect(screen.getByText('Morgenbad')).toBeTruthy()
    expect(screen.getByText('Russedåp')).toBeTruthy()
  })

  it('lukker oversikten før hele profilen åpnes', async () => {
    const { onOpenFullProfile, onClose } = renderSheet()
    await waitFor(() => expect(screen.getByLabelText('Se hele profilen')).toBeTruthy())
    fireEvent.press(screen.getByLabelText('Se hele profilen'))
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onOpenFullProfile).toHaveBeenCalledWith('user-1')
  })
})
