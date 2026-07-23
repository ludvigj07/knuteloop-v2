import { render, screen } from '@testing-library/react-native'
import { ProfileGridTile } from './ProfileGridTile'
import type { ProfileGridItem } from '../../lib/api'

const base: ProfileGridItem = {
  id: 's1',
  imageKey: 'submissions/x.jpg',
  imageUrl: 'http://localhost/uploads/x.jpg',
  caption: 'Klarte den!',
  createdAt: '2026-07-20T12:00:00.000Z',
  knuteTitle: 'Spis frokost under pulten',
  knutePoints: 10,
  evidenceType: 'media',
  isGold: false,
}

describe('ProfileGridTile', () => {
  it('labels a photo tile with the knute title', () => {
    render(<ProfileGridTile item={base} />)
    expect(screen.getByLabelText('Spis frokost under pulten')).toBeTruthy()
  })

  it('renders a text submission as a quote tile with the caption', () => {
    render(
      <ProfileGridTile
        item={{ ...base, evidenceType: 'text', imageKey: null, imageUrl: null }}
      />,
    )
    expect(screen.getByText('Klarte den!')).toBeTruthy()
  })

  it('falls back to the knute title when a text submission has no caption', () => {
    render(
      <ProfileGridTile
        item={{ ...base, evidenceType: 'text', imageKey: null, imageUrl: null, caption: null }}
      />,
    )
    expect(screen.getByText('Spis frokost under pulten')).toBeTruthy()
  })

  it('marks gullknuter in the accessibility label', () => {
    render(<ProfileGridTile item={{ ...base, isGold: true }} />)
    expect(screen.getByLabelText('Spis frokost under pulten, gullknute')).toBeTruthy()
  })
})
