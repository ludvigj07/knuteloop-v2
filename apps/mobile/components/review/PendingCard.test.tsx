import { fireEvent, render, screen } from '@testing-library/react-native'
import { PendingCard } from './PendingCard'
import type { PendingSubmission } from '../../lib/api'

const SUB: PendingSubmission = {
  id: 's1',
  userId: 'u1',
  knuteId: 'k1',
  imageKey: 'submissions/11111111-1111-4111-8111-111111111111.jpg',
  imageUrl: 'https://cdn.example/photo.jpg',
  caption: 'Tok bilde utenfor skolen',
  createdAt: '2026-07-02T10:00:00.000Z',
  russenavn: 'Loke',
  knuteTitle: 'Spis frokost under pulten',
  knutePoints: 15,
  evidenceType: 'media',
}

function renderCard(
  overrides: Partial<PendingSubmission> = {},
  props: {
    onApprove?: () => void
    onReject?: () => void
    pendingAction?: 'approve' | 'reject' | null
  } = {},
) {
  return render(
    <PendingCard
      submission={{ ...SUB, ...overrides }}
      onApprove={props.onApprove ?? jest.fn()}
      onReject={props.onReject ?? jest.fn()}
      pendingAction={props.pendingAction ?? null}
    />,
  )
}

describe('PendingCard', () => {
  it('shows the knute title, russenavn and points', () => {
    renderCard()
    expect(screen.getByText('Spis frokost under pulten')).toBeTruthy()
    expect(screen.getByText('Loke')).toBeTruthy()
    expect(screen.getByText('+15 P')).toBeTruthy()
  })

  it('approves via the Godkjenn button (and does not reject)', () => {
    const onApprove = jest.fn()
    const onReject = jest.fn()
    renderCard({}, { onApprove, onReject })
    fireEvent.press(screen.getByLabelText('Godkjenn'))
    expect(onApprove).toHaveBeenCalledTimes(1)
    expect(onReject).not.toHaveBeenCalled()
  })

  it('rejects via the Avvis button (and does not approve)', () => {
    const onApprove = jest.fn()
    const onReject = jest.fn()
    renderCard({}, { onApprove, onReject })
    fireEvent.press(screen.getByLabelText('Avvis'))
    expect(onReject).toHaveBeenCalledTimes(1)
    expect(onApprove).not.toHaveBeenCalled()
  })

  it('is inert while a review is in flight (no double-submit)', () => {
    const onApprove = jest.fn()
    const onReject = jest.fn()
    renderCard({}, { onApprove, onReject, pendingAction: 'approve' })
    // Both buttons are disabled while the approve is pending.
    fireEvent.press(screen.getByLabelText('Godkjenn'))
    fireEvent.press(screen.getByLabelText('Avvis'))
    expect(onApprove).not.toHaveBeenCalled()
    expect(onReject).not.toHaveBeenCalled()
  })

  it('renders the written caption as evidence for text-only knuter', () => {
    renderCard({ evidenceType: 'text', imageUrl: null, caption: 'Skrev et dikt om russetida' })
    expect(screen.getByText('Skrev et dikt om russetida')).toBeTruthy()
    expect(screen.queryByText(/Bildet kommer/)).toBeNull()
  })

  it('shows a placeholder for media knuter whose photo has not landed yet', () => {
    renderCard({ evidenceType: 'media', imageUrl: null })
    expect(screen.getByText(/Bildet kommer når lagring er koblet på/)).toBeTruthy()
  })
})
