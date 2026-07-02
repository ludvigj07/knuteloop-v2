import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { KnutesjefTabBar, type KnutesjefTabKey } from './KnutesjefTabBar'

const mockPush = jest.fn()
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }))
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))
jest.mock('../lib/api', () => ({ tryFetchPendingCount: jest.fn().mockResolvedValue(3) }))

function renderBar(active: KnutesjefTabKey) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <KnutesjefTabBar active={active} />
    </QueryClientProvider>,
  )
}

beforeEach(() => mockPush.mockClear())

describe('KnutesjefTabBar', () => {
  it('renders the three knutesjef tabs and the exit back to the app', () => {
    renderBar('bibliotek')
    expect(screen.getByLabelText(/^Kø/)).toBeTruthy()
    expect(screen.getByLabelText('Biblioteket')).toBeTruthy()
    expect(screen.getByLabelText('Knuteboka')).toBeTruthy()
    expect(screen.getByLabelText('Tilbake til appen')).toBeTruthy()
  })

  it('navigates to another tab, but not to the one already active', () => {
    renderBar('bibliotek')
    fireEvent.press(screen.getByLabelText('Knuteboka'))
    expect(mockPush).toHaveBeenCalledWith('/admin/knuteboka')
    mockPush.mockClear()
    fireEvent.press(screen.getByLabelText('Biblioteket'))
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('exits to the student app', () => {
    renderBar('ko')
    fireEvent.press(screen.getByLabelText('Tilbake til appen'))
    expect(mockPush).toHaveBeenCalledWith('/')
  })

  it('shows the pending count on Kø once loaded', async () => {
    renderBar('bibliotek')
    await waitFor(() => expect(screen.getByLabelText('Kø, 3 venter')).toBeTruthy())
  })
})
