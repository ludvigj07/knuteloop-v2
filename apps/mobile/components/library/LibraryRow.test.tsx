import { fireEvent, render, screen } from '@testing-library/react-native'
import { LibraryRow } from './LibraryRow'
import type { LibraryKnute } from '../../lib/api'

const knute: LibraryKnute = {
  id: 'k1',
  title: 'Test knute',
  description: null,
  points: 20,
  difficulty: 'Medium',
  evidenceType: 'media',
  minAge: 17,
  suggestedFolder: 'Generelle',
  region: null,
  imported: false,
}

describe('LibraryRow', () => {
  it('the add toggle calls onAdd and NOT onOpen (separate tap targets)', () => {
    const onOpen = jest.fn()
    const onAdd = jest.fn()
    render(<LibraryRow knute={knute} importing={false} onOpen={onOpen} onAdd={onAdd} />)

    fireEvent.press(screen.getByLabelText('Legg Test knute til i knuteboka'))
    expect(onAdd).toHaveBeenCalledTimes(1)
    expect(onOpen).not.toHaveBeenCalled()
  })

  it('the content area calls onOpen and NOT onAdd', () => {
    const onOpen = jest.fn()
    const onAdd = jest.fn()
    render(<LibraryRow knute={knute} importing={false} onOpen={onOpen} onAdd={onAdd} />)

    fireEvent.press(screen.getByLabelText('Test knute. 20 poeng. Trykk for detaljer.'))
    expect(onOpen).toHaveBeenCalledTimes(1)
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('shows the added badge and hides the add button once imported', () => {
    render(
      <LibraryRow knute={{ ...knute, imported: true }} importing={false} onOpen={jest.fn()} onAdd={jest.fn()} />,
    )
    expect(screen.getByLabelText('Test knute er lagt til')).toBeTruthy()
    expect(screen.queryByLabelText('Legg Test knute til i knuteboka')).toBeNull()
  })
})
