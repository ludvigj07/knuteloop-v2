import { fireEvent, render, screen } from '@testing-library/react-native'
import { AppTabBar, type AppTabKey } from './AppTabBar'

const mockReplace = jest.fn()
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace }) }))
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

function renderBar(active: AppTabKey) {
  return render(<AppTabBar active={active} />)
}

beforeEach(() => mockReplace.mockClear())

describe('AppTabBar', () => {
  it('renders home and the four student destinations', () => {
    renderBar('home')
    for (const label of ['Hjem', 'Knuter', 'Øyeblikk', 'Toppliste', 'Profil']) {
      expect(screen.getByLabelText(label)).toBeTruthy()
    }
    expect(screen.queryByLabelText('Knutesjef')).toBeNull()
  })

  it('switches tab with replace (not push), and ignores taps on the active tab', () => {
    renderBar('home')
    fireEvent.press(screen.getByLabelText('Knuter'))
    expect(mockReplace).toHaveBeenCalledWith('/knuter')
    mockReplace.mockClear()
    fireEvent.press(screen.getByLabelText('Toppliste'))
    expect(mockReplace).toHaveBeenCalledWith('/leaderboard')
    mockReplace.mockClear()
    fireEvent.press(screen.getByLabelText('Hjem'))
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('keeps a clear exit when the legacy knutesjef panel is active', () => {
    renderBar('knutesjef')
    expect(screen.getByLabelText('Hjem')).toBeTruthy()
    expect(screen.getByLabelText('Knutesjef')).toBeTruthy()
    expect(screen.queryByLabelText('Profil')).toBeNull()
  })
})
