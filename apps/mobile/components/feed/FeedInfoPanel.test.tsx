import { fireEvent, render, screen } from '@testing-library/react-native'
import { FeedInfoPanel } from './FeedInfoPanel'
import type { FeedItem } from '../../lib/api'

const item: FeedItem = {
  id: 'submission-1',
  userId: 'user-1',
  imageKey: 'image-1',
  imageUrl: 'https://example.test/image.jpg',
  caption: 'Dette skjedde i storefri.',
  createdAt: '2026-07-24T10:00:00.000Z',
  russenavn: 'Løkka',
  knuteTitle: 'Spis frokost under pulten',
  knutePoints: 15,
  evidenceType: 'media',
}

describe('FeedInfoPanel', () => {
  it('viser innholdet uten overflødig godkjentstatus', () => {
    render(<FeedInfoPanel item={item} onOpenProfile={jest.fn()} />)

    expect(screen.getByText('Løkka')).toBeTruthy()
    expect(screen.getByText('Spis frokost under pulten')).toBeTruthy()
    expect(screen.getByText('+15 P')).toBeTruthy()
    expect(screen.getByText('Dette skjedde i storefri.')).toBeTruthy()
    expect(screen.queryByText('Godkjent')).toBeNull()
  })

  it('åpner profiloversikten fra identiteten', () => {
    const onOpenProfile = jest.fn()
    render(<FeedInfoPanel item={item} onOpenProfile={onOpenProfile} />)

    fireEvent.press(screen.getByLabelText('Se profilen til Løkka'))
    expect(onOpenProfile).toHaveBeenCalledTimes(1)
  })
})
