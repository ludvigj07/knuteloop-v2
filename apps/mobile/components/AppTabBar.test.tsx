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
  it('renders all five tabs', () => {
    renderBar('knuter')
    for (const label of ['Knuter', 'Toppliste', 'Øyeblikk', 'Knutesjef', 'Profil']) {
      expect(screen.getByLabelText(label)).toBeTruthy()
    }
  })

  it('switches tab with replace (not push), and ignores taps on the active tab', () => {
    renderBar('knuter')
    fireEvent.press(screen.getByLabelText('Toppliste'))
    expect(mockReplace).toHaveBeenCalledWith('/leaderboard')
    mockReplace.mockClear()
    fireEvent.press(screen.getByLabelText('Knuter'))
    expect(mockReplace).not.toHaveBeenCalled()
  })
})
