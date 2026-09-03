import { fireEvent, render, screen } from '@testing-library/react-native'
import { HomeActivityCard } from './HomeActivityCard'
import type { FeedItem } from '../../lib/api'

const ITEM: FeedItem = {
  id: 'submission-1',
  userId: 'user-1',
  imageKey: null,
  imageUrl: null,
  caption: 'Dette skjedde i storefri.',
  createdAt: '2026-07-24T10:00:00.000Z',
  russenavn: 'Løkka',
  knuteId: 'knute-1',
  knuteTitle: 'Spis frokost under pulten',
  knutePoints: 15,
  evidenceType: 'text',
  isBookmarked: false,
}

const baseProps = {
  isLoading: false,
  error: null,
  onRetry: jest.fn(),
  onOpenFeed: jest.fn(),
  onOpenKnuter: jest.fn(),
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('HomeActivityCard', () => {
  it('shows real school activity and opens the feed', () => {
    render(<HomeActivityCard {...baseProps} item={ITEM} />)

    expect(screen.getByText('Løkka')).toBeTruthy()
    expect(screen.getByText('Spis frokost under pulten')).toBeTruthy()
    fireEvent.press(screen.getByLabelText('Løkka fullførte Spis frokost under pulten, 15 poeng'))
    expect(baseProps.onOpenFeed).toHaveBeenCalledTimes(1)
  })

  it('offers the catalog when the school feed is empty', () => {
    render(<HomeActivityCard {...baseProps} item={null} />)

    expect(screen.getByText('Det er stille akkurat nå')).toBeTruthy()
    fireEvent.press(screen.getByLabelText('Finn en knute'))
    expect(baseProps.onOpenKnuter).toHaveBeenCalledTimes(1)
  })

  it('renders a recoverable section error', () => {
    render(<HomeActivityCard {...baseProps} item={null} error={new Error('Nettet svarte ikke.')} />)

    expect(screen.getByText('Nettet svarte ikke.')).toBeTruthy()
    fireEvent.press(screen.getByLabelText('Prøv igjen'))
    expect(baseProps.onRetry).toHaveBeenCalledTimes(1)
  })
})
