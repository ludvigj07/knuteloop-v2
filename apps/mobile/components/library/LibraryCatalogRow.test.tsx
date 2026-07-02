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
  importedKnuteId: null,
}

function renderRow(overrides: Partial<LibraryKnute> = {}, props: { onOpen?: () => void; onAdd?: () => void; onManage?: () => void } = {}) {
  return render(
    <LibraryCatalogRow
      knute={{ ...KNUTE, ...overrides }}
      importing={false}
      isFirst
      isLast
      onOpen={props.onOpen ?? jest.fn()}
      onAdd={props.onAdd ?? jest.fn()}
      onManage={props.onManage ?? jest.fn()}
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

  it('turns + into a ✓ that opens the manage-sheet once imported', () => {
    const onAdd = jest.fn()
    const onManage = jest.fn()
    renderRow({ imported: true, importedKnuteId: 'copy-1' }, { onAdd, onManage })
    expect(screen.queryByLabelText(`Legg ${KNUTE.title} til i knuteboka`)).toBeNull()
    fireEvent.press(screen.getByLabelText(`${KNUTE.title} er lagt til — endre mapper eller tekst`))
    expect(onManage).toHaveBeenCalledTimes(1)
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('flags sensitive knuter with the 18+ and Tekst badges', () => {
    renderRow({ minAge: 18, evidenceType: 'text', suggestedFolder: 'Sex' })
    expect(screen.getByText('18+')).toBeTruthy()
    expect(screen.getByText('Tekst')).toBeTruthy()
  })
})
