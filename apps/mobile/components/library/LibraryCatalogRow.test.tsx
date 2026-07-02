import { fireEvent, render, screen } from '@testing-library/react-native'
import { LibraryCatalogRow } from './LibraryCatalogRow'
import type { LibraryKnute } from '../../lib/api'

const KNUTE: LibraryKnute = {
  id: 'lk1',
  title: 'Spis en banan på ti sekunder',
  description: 'Hele bananen, foran minst tre medruss.',
  points: 15,
  difficulty: 'Lett',
  evidenceType: 'media',
  minAge: 17,
  suggestedFolder: 'Generelle',
  region: null,
  imported: false,
}

function renderRow(overrides: Partial<LibraryKnute> = {}, props: { onOpen?: () => void; onAdd?: () => void } = {}) {
  return render(
    <LibraryCatalogRow
      knute={{ ...KNUTE, ...overrides }}
      importing={false}
      isFirst
      isLast
      onOpen={props.onOpen ?? jest.fn()}
      onAdd={props.onAdd ?? jest.fn()}
    />,
  )
}

describe('LibraryCatalogRow', () => {
  it('shows the title AND the one-line description (the decision surface)', () => {
    renderRow()
    expect(screen.getByText('Spis en banan på ti sekunder')).toBeTruthy()
    expect(screen.getByText('Hele bananen, foran minst tre medruss.')).toBeTruthy()
  })

  it('opens the detail sheet when the content area is pressed', () => {
    const onOpen = jest.fn()
    renderRow({}, { onOpen })
    fireEvent.press(screen.getByLabelText(/Trykk for detaljer/))
    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it('adds via the + toggle without opening the sheet', () => {
    const onOpen = jest.fn()
    const onAdd = jest.fn()
    renderRow({}, { onOpen, onAdd })
    fireEvent.press(screen.getByLabelText(`Legg ${KNUTE.title} til i knuteboka`))
    expect(onAdd).toHaveBeenCalledTimes(1)
    expect(onOpen).not.toHaveBeenCalled()
  })

  it('shows a passive check instead of + once imported', () => {
    const onAdd = jest.fn()
    renderRow({ imported: true }, { onAdd })
    expect(screen.getByLabelText(`${KNUTE.title} er lagt til`)).toBeTruthy()
    expect(screen.queryByLabelText(`Legg ${KNUTE.title} til i knuteboka`)).toBeNull()
  })

  it('flags sensitive knuter with the 18+ and Tekst badges', () => {
    renderRow({ minAge: 18, evidenceType: 'text', suggestedFolder: 'Sex' })
    expect(screen.getByText('18+')).toBeTruthy()
    expect(screen.getByText('Tekst')).toBeTruthy()
  })
})
