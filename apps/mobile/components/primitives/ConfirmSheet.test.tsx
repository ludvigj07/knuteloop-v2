import { fireEvent, render, screen } from '@testing-library/react-native'
import { ConfirmSheet } from './ConfirmSheet'

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

function renderSheet(onConfirm = jest.fn(), onCancel = jest.fn()) {
  render(
    <ConfirmSheet
      open
      title="Fjerne «Kongla»?"
      message="Knuten forsvinner fra elevenes katalog."
      confirmLabel="Fjern fra knuteboka"
      onCancel={onCancel}
      onConfirm={onConfirm}
    />,
  )
  return { onConfirm, onCancel }
}

describe('ConfirmSheet', () => {
  it('confirms the destructive action', () => {
    const { onConfirm, onCancel } = renderSheet()
    expect(screen.getByText('Fjerne «Kongla»?')).toBeTruthy()
    fireEvent.press(screen.getByLabelText('Fjern fra knuteboka'))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('cancels without confirming', () => {
    const { onConfirm, onCancel } = renderSheet()
    fireEvent.press(screen.getByLabelText('Avbryt'))
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onConfirm).not.toHaveBeenCalled()
  })
})
