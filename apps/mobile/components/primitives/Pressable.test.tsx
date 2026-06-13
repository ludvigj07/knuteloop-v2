import { fireEvent, render, screen } from '@testing-library/react-native'
import { Pressable } from './Pressable'
import { Text } from './Text'

describe('Pressable', () => {
  it('renders children and calls onPress', () => {
    const onPress = jest.fn()
    render(
      <Pressable onPress={onPress} accessibilityLabel="Lik">
        <Text>Lik</Text>
      </Pressable>,
    )

    fireEvent.press(screen.getByLabelText('Lik'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn()
    render(
      <Pressable onPress={onPress} accessibilityLabel="Lik" disabled>
        <Text>Lik</Text>
      </Pressable>,
    )

    fireEvent.press(screen.getByLabelText('Lik'))
    expect(onPress).not.toHaveBeenCalled()
  })
})
