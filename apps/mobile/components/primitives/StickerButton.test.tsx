import { fireEvent, render, screen } from '@testing-library/react-native'
import { StickerButton } from './StickerButton'

describe('StickerButton', () => {
  it('renders the label and calls onPress when tapped', () => {
    const onPress = jest.fn()
    render(<StickerButton label="Legg til" onPress={onPress} />)

    fireEvent.press(screen.getByLabelText('Legg til'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn()
    render(<StickerButton label="Legg til" onPress={onPress} disabled />)

    fireEvent.press(screen.getByLabelText('Legg til'))
    expect(onPress).not.toHaveBeenCalled()
  })

  it('hides the label and ignores presses while loading', () => {
    const onPress = jest.fn()
    render(<StickerButton label="Legg til" onPress={onPress} loading />)

    expect(screen.queryByText('Legg til')).toBeNull()
    fireEvent.press(screen.getByLabelText('Legg til'))
    expect(onPress).not.toHaveBeenCalled()
  })

  it('renders the ghost variant and calls onPress', () => {
    const onPress = jest.fn()
    render(<StickerButton label="Avbryt" variant="ghost" onPress={onPress} />)

    fireEvent.press(screen.getByLabelText('Avbryt'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })
})
