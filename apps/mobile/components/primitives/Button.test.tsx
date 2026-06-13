import { fireEvent, render, screen } from '@testing-library/react-native'
import { Button } from './Button'

describe('Button', () => {
  it('renders the label and calls onPress when tapped', () => {
    const onPress = jest.fn()
    render(<Button label="Send inn" onPress={onPress} />)

    fireEvent.press(screen.getByLabelText('Send inn'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn()
    render(<Button label="Send inn" onPress={onPress} disabled />)

    fireEvent.press(screen.getByLabelText('Send inn'))
    expect(onPress).not.toHaveBeenCalled()
  })

  it('hides the label and ignores presses while loading', () => {
    const onPress = jest.fn()
    render(<Button label="Send inn" onPress={onPress} loading />)

    expect(screen.queryByText('Send inn')).toBeNull()
    fireEvent.press(screen.getByLabelText('Send inn'))
    expect(onPress).not.toHaveBeenCalled()
  })
})
