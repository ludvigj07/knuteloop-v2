import { fireEvent, render, screen } from '@testing-library/react-native'
import { LibraryKnuteRow } from './LibraryKnuteRow'
import type { LibraryKnute } from '../../lib/api'

const base: LibraryKnute = {
  id: 'k1',
  title: 'Spis en banan',
  description: 'Foran hele klassen.',
  points: 10,
  difficulty: 'Lett',
  evidenceType: 'media',
  minAge: 17,
  suggestedFolder: 'Generelle',
  region: null,
  imported: false,
}

function renderRow(knute: Partial<LibraryKnute> = {}, handlers: { onOpen?: () => void; onImport?: () => void } = {}) {
  const onOpen = handlers.onOpen ?? jest.fn()
  const onImport = handlers.onImport ?? jest.fn()
  render(<LibraryKnuteRow knute={{ ...base, ...knute }} importing={false} onOpen={onOpen} onImport={onImport} />)
  return { onOpen, onImport }
}

describe('LibraryKnuteRow', () => {
  it('shows the knute, opens detail on row tap, imports on the add button', () => {
    const { onOpen, onImport } = renderRow()

    expect(screen.getByText('Spis en banan')).toBeTruthy()
    expect(screen.getByText('10 p')).toBeTruthy()

    fireEvent.press(screen.getByLabelText('Spis en banan, 10 poeng, Generelle'))
    expect(onOpen).toHaveBeenCalledTimes(1)

    fireEvent.press(screen.getByLabelText('Legg Spis en banan til skolen'))
    expect(onImport).toHaveBeenCalledTimes(1)
  })

  it('flags an 18+ knute and notes it in the row label', () => {
    renderRow({ minAge: 18, suggestedFolder: 'Sex' })

    expect(screen.getByText('18+')).toBeTruthy()
    expect(screen.getByLabelText('Spis en banan, 10 poeng, Sex, 18 pluss')).toBeTruthy()
  })

  it('hides the add button once imported', () => {
    renderRow({ imported: true })

    expect(screen.getByLabelText('Lagt til')).toBeTruthy()
    expect(screen.queryByLabelText('Legg Spis en banan til skolen')).toBeNull()
  })
})
