import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
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
  knuteId: 'knute-1',
  knuteTitle: 'Spis frokost under pulten',
  knutePoints: 15,
  evidenceType: 'media',
  isBookmarked: false,
}

// The bookmark button inside the panel uses a TanStack mutation, so the panel
// needs a QueryClient — a fresh one per render keeps tests independent.
function renderPanel(props: Parameters<typeof FeedInfoPanel>[0]) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <FeedInfoPanel {...props} />
    </QueryClientProvider>,
  )
}

describe('FeedInfoPanel', () => {
  it('viser innholdet uten overflødig godkjentstatus', () => {
    renderPanel({ item, onOpenProfile: jest.fn() })

    expect(screen.getByText('Løkka')).toBeTruthy()
    expect(screen.getByText('Spis frokost under pulten')).toBeTruthy()
    expect(screen.getByText('+15 P')).toBeTruthy()
    expect(screen.getByText('Dette skjedde i storefri.')).toBeTruthy()
    expect(screen.queryByText('Godkjent')).toBeNull()
  })

  it('åpner profiloversikten fra identiteten', () => {
    const onOpenProfile = jest.fn()
    renderPanel({ item, onOpenProfile })

    fireEvent.press(screen.getByLabelText('Se profilen til Løkka'))
    expect(onOpenProfile).toHaveBeenCalledTimes(1)
  })

  it('viser bokmerke-knappen for knuten, med riktig tilstand', () => {
    renderPanel({ item, onOpenProfile: jest.fn() })
    expect(screen.getByLabelText('Bokmerk knuten')).toBeTruthy()

    renderPanel({ item: { ...item, isBookmarked: true }, onOpenProfile: jest.fn() })
    expect(screen.getByLabelText('Fjern bokmerke')).toBeTruthy()
  })
})
