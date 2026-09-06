import { fireEvent, render, screen } from '@testing-library/react-native'
import { StaffPreviewEntry } from './StaffPreviewEntry'
import StaffPreviewRoute from '../../app/superadmin-preview'

const mockPush = jest.fn()
const mockRedirect = jest.fn((_props: { href: string }) => null)
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  Redirect: (props: { href: string }) => mockRedirect(props),
  Stack: { Screen: () => null },
}))
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

const originalDev = Object.getOwnPropertyDescriptor(globalThis, '__DEV__')

function setDevelopment(value: boolean) {
  Object.defineProperty(globalThis, '__DEV__', { value, configurable: true, writable: true })
}

beforeEach(() => {
  mockPush.mockClear()
  mockRedirect.mockClear()
})

afterEach(() => {
  if (originalDev) Object.defineProperty(globalThis, '__DEV__', originalDev)
})

describe('StaffPreviewEntry', () => {
  it('opens the dedicated preview route from the development entry', () => {
    setDevelopment(true)
    render(<StaffPreviewEntry />)

    expect(screen.getByText('Superadmin · forhåndsvisning')).toBeTruthy()
    fireEvent.press(screen.getByLabelText('Åpne superadmin-forhåndsvisningen'))
    expect(mockPush).toHaveBeenCalledWith('/superadmin-preview')
  })

  it('hides the entry in a release build', () => {
    setDevelopment(false)
    render(<StaffPreviewEntry />)

    expect(screen.queryByLabelText('Åpne superadmin-forhåndsvisningen')).toBeNull()
    expect(screen.queryByText('Superadmin · forhåndsvisning')).toBeNull()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('redirects a direct preview route in a release build', () => {
    setDevelopment(false)
    render(<StaffPreviewRoute />)

    expect(mockRedirect).toHaveBeenCalledWith({ href: '/' })
    expect(screen.queryByText('Superadmin')).toBeNull()
  })
})
