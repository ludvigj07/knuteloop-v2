import { render, screen } from '@testing-library/react-native'
import { Text } from './Text'

describe('Text', () => {
  it('renders its children', () => {
    render(<Text>Hei russ</Text>)
    expect(screen.getByText('Hei russ')).toBeTruthy()
  })

  it('passes through accessibility props', () => {
    render(
      <Text accessibilityRole="header" accessibilityLabel="Tittel">
        Toppliste
      </Text>,
    )
    expect(screen.getByLabelText('Tittel')).toBeTruthy()
  })
})
