import { fireEvent, render, screen } from '@testing-library/react-native'
import { HomeDagensKnuteCard } from './HomeDagensKnuteCard'

const knute = {
  id: 'knute-1',
  title: 'Bad i sjøen før skoletid',
  description: 'Ta med en venn.',
  points: 20,
  difficulty: 'Medium' as const,
}

const defaultProps = {
  knute,
  isLoading: false,
  error: null,
  isCompleted: false,
  onRetry: jest.fn(),
  onOpen: jest.fn(),
}

describe('HomeDagensKnuteCard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows the compact daily knot and opens it', () => {
    const onOpen = jest.fn()
    render(<HomeDagensKnuteCard {...defaultProps} onOpen={onOpen} />)

    expect(screen.getByText('Dagens knute')).toBeTruthy()
    expect(screen.getByText('Bad i sjøen før skoletid')).toBeTruthy()
    expect(screen.getByText('20 P')).toBeTruthy()
    expect(screen.getByText('Ta knuten')).toBeTruthy()
    expect(screen.queryByText('Ta med en venn.')).toBeNull()

    fireEvent.press(
      screen.getByLabelText('Dagens knute: Bad i sjøen før skoletid, 20 poeng'),
    )
    expect(onOpen).toHaveBeenCalledWith('knute-1')
  })

  it('shows a calm completed state without an action', () => {
    render(<HomeDagensKnuteCard {...defaultProps} isCompleted />)

    expect(screen.getByText('Dagens knute er sendt inn')).toBeTruthy()
    expect(screen.getByText('Kom tilbake i morgen.')).toBeTruthy()
    expect(
      screen.getByLabelText('Dagens knute er sendt inn. Kom tilbake i morgen.'),
    ).toBeTruthy()
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('shows a skeleton while loading', () => {
    render(<HomeDagensKnuteCard {...defaultProps} knute={null} isLoading />)

    expect(screen.queryByText('Dagens knute')).toBeNull()
    expect(screen.queryByText('Kunne ikke laste dagens knute')).toBeNull()
  })

  it('retries after an initial error', () => {
    const onRetry = jest.fn()
    render(
      <HomeDagensKnuteCard
        {...defaultProps}
        knute={null}
        error={new Error('Nettverksfeil')}
        onRetry={onRetry}
      />,
    )

    expect(screen.getByText('Kunne ikke laste dagens knute')).toBeTruthy()
    fireEvent.press(screen.getByRole('button', { name: 'Prøv igjen' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('shows a friendly empty state', () => {
    render(<HomeDagensKnuteCard {...defaultProps} knute={null} />)

    expect(screen.getByText('Ingen dagens knute akkurat nå')).toBeTruthy()
    expect(screen.getByText('Knutesjefen fyller på med flere knuter.')).toBeTruthy()
  })
})
