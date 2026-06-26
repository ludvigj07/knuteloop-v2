import { render, screen } from '@testing-library/react-native'
import { Chip } from './Chip'
import { Badge } from './Badge'
import { KnoteIcon } from './KnoteIcon'

describe('Chip', () => {
  it('renders its label', () => {
    render(<Chip label="120 P" tone="accent" mono />)
    expect(screen.getByText('120 P')).toBeTruthy()
  })
})

describe('Badge', () => {
  it('renders its label', () => {
    render(<Badge label="18+" tone="age" />)
    expect(screen.getByText('18+')).toBeTruthy()
  })
})

describe('KnoteIcon', () => {
  it('renders each glyph without crashing', () => {
    const { toJSON } = render(
      <>
        <KnoteIcon name="knute" />
        <KnoteIcon name="generelle" />
        <KnoteIcon name="dobbel" />
        <KnoteIcon name="alkohol" />
        <KnoteIcon name="sex" />
        <KnoteIcon name="fordervett" />
      </>,
    )
    expect(toJSON()).toBeTruthy()
  })
})
