import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react-native'
import { AppTabBar, type AppTabKey } from './AppTabBar'
import { fetchMe } from '../lib/api'

const mockReplace = jest.fn()
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace }) }))
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))
jest.mock('../lib/api', () => ({ fetchMe: jest.fn() }))

const mockFetchMe = fetchMe as jest.Mock

function mockRole(role: 'student' | 'knutesjef' | 'admin') {
  mockFetchMe.mockResolvedValue({ user: { role } })
}

function renderBar(active: AppTabKey) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AppTabBar active={active} />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  mockReplace.mockClear()
  mockFetchMe.mockReset()
})

describe('AppTabBar', () => {
  it('renders home and the four student destinations, without the knutesjef tab', async () => {
    mockRole('student')
    renderBar('home')
    await screen.findByLabelText('Hjem')
    for (const label of ['Hjem', 'Knuter', 'Øyeblikk', 'Toppliste', 'Profil']) {
      expect(screen.getByLabelText(label)).toBeTruthy()
    }
    expect(screen.queryByLabelText('Knutesjef')).toBeNull()
  })

  it('switches tab with replace (not push), and ignores taps on the active tab', async () => {
    mockRole('student')
    renderBar('home')
    await screen.findByLabelText('Hjem')
    fireEvent.press(screen.getByLabelText('Knuter'))
    expect(mockReplace).toHaveBeenCalledWith('/knuter')
    mockReplace.mockClear()
    fireEvent.press(screen.getByLabelText('Toppliste'))
    expect(mockReplace).toHaveBeenCalledWith('/leaderboard')
    mockReplace.mockClear()
    fireEvent.press(screen.getByLabelText('Hjem'))
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('gives knutesjefen a sixth tab at the far right, next to Profil', async () => {
    mockRole('knutesjef')
    renderBar('home')
    const knutesjefTab = await screen.findByLabelText('Knutesjef')
    expect(knutesjefTab).toBeTruthy()
    expect(screen.getByLabelText('Profil')).toBeTruthy()

    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(6)
    expect(tabs[tabs.length - 1]?.props.accessibilityLabel).toBe('Knutesjef')

    fireEvent.press(knutesjefTab)
    expect(mockReplace).toHaveBeenCalledWith('/admin')
  })

  it('shows the knutesjef tab for admins too', async () => {
    mockRole('admin')
    renderBar('home')
    expect(await screen.findByLabelText('Knutesjef')).toBeTruthy()
  })

  it('keeps the knutesjef tab selected on the panel even before the role has loaded', () => {
    mockFetchMe.mockReturnValue(new Promise(() => undefined))
    renderBar('knutesjef')
    const knutesjefTab = screen.getByLabelText('Knutesjef')
    expect(knutesjefTab.props.accessibilityState.selected).toBe(true)
    expect(screen.getByLabelText('Profil')).toBeTruthy()
  })
})
