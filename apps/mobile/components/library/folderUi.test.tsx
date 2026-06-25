import { fireEvent, render, screen } from '@testing-library/react-native'
import { AdminKnuteRow, FolderRow } from './folderUi'
import type { Folder, Knute } from '../../lib/api'

const folder: Folder = { id: 'f1', name: 'Fadderuka', sortOrder: 0, knuteCount: 3 }

const knute: Knute = {
  id: 'k1',
  title: 'Spis en banan',
  description: null,
  points: 10,
  difficulty: 'Lett',
  evidenceType: 'media',
  isGold: false,
  isActive: true,
  createdAt: '2026-06-01T00:00:00.000Z',
}

describe('FolderRow', () => {
  it('shows the name + knute count and opens on tap', () => {
    const onPress = jest.fn()
    render(<FolderRow folder={folder} onPress={onPress} />)

    expect(screen.getByText('Fadderuka')).toBeTruthy()
    fireEvent.press(screen.getByLabelText('Fadderuka, 3 knuter'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('singularises the count', () => {
    render(<FolderRow folder={{ ...folder, knuteCount: 1 }} onPress={jest.fn()} />)
    expect(screen.getByText('1 knute')).toBeTruthy()
  })
})

describe('AdminKnuteRow', () => {
  it('removes a knute from the folder', () => {
    const onAction = jest.fn()
    render(<AdminKnuteRow knute={knute} action="remove" busy={false} onAction={onAction} />)

    fireEvent.press(screen.getByLabelText('Fjern Spis en banan fra mappa'))
    expect(onAction).toHaveBeenCalledTimes(1)
  })

  it('adds a knute to the folder', () => {
    const onAction = jest.fn()
    render(<AdminKnuteRow knute={knute} action="add" busy={false} onAction={onAction} />)

    fireEvent.press(screen.getByLabelText('Legg til Spis en banan i mappa'))
    expect(onAction).toHaveBeenCalledTimes(1)
  })

  it('ignores taps while busy', () => {
    const onAction = jest.fn()
    render(<AdminKnuteRow knute={knute} action="add" busy onAction={onAction} />)

    fireEvent.press(screen.getByLabelText('Legg til Spis en banan i mappa'))
    expect(onAction).not.toHaveBeenCalled()
  })
})
