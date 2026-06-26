import { fireEvent, render, screen } from '@testing-library/react-native'
import { Text } from './Text'
import { StickerCard } from './StickerCard'

describe('StickerCard', () => {
  it('renders its children', () => {
    render(
      <StickerCard>
        <Text>Innhold</Text>
      </StickerCard>,
    )
    expect(screen.getByText('Innhold')).toBeTruthy()
  })

  it('is pressable when onPress is given', () => {
    const onPress = jest.fn()
    render(
      <StickerCard onPress={onPress} accessibilityLabel="Åpne kort">
        <Text>Trykk</Text>
      </StickerCard>,
    )
    fireEvent.press(screen.getByLabelText('Åpne kort'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn()
    render(
      <StickerCard onPress={onPress} disabled accessibilityLabel="Åpne kort">
        <Text>Trykk</Text>
      </StickerCard>,
    )
    fireEvent.press(screen.getByLabelText('Åpne kort'))
    expect(onPress).not.toHaveBeenCalled()
  })
})
