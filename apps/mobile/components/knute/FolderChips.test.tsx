import { fireEvent, render, screen } from '@testing-library/react-native'
import { FolderChips } from './FolderChips'
import type { Folder } from '../../lib/api'

const FOLDERS: Folder[] = [
  { id: 'f1', name: 'Alkohol', icon: null, sortOrder: 0, knuteCount: 12 },
  { id: 'f2', name: 'Skolegård', icon: 'star', sortOrder: 1, knuteCount: 4 },
]

describe('FolderChips', () => {
  it('renders "Alle" plus every folder', () => {
    render(<FolderChips folders={FOLDERS} selected={null} onSelect={jest.fn()} />)
    expect(screen.getByLabelText('Alle')).toBeTruthy()
    expect(screen.getByLabelText('Alkohol')).toBeTruthy()
    expect(screen.getByLabelText('Skolegård')).toBeTruthy()
  })

  it('selects a folder by id on press', () => {
    const onSelect = jest.fn()
    render(<FolderChips folders={FOLDERS} selected={null} onSelect={onSelect} />)
    fireEvent.press(screen.getByLabelText('Alkohol'))
    expect(onSelect).toHaveBeenCalledWith('f1')
  })

  it('returns to "Alle" (null) on press', () => {
    const onSelect = jest.fn()
    render(<FolderChips folders={FOLDERS} selected="f1" onSelect={onSelect} />)
    fireEvent.press(screen.getByLabelText('Alle'))
    expect(onSelect).toHaveBeenCalledWith(null)
  })

  it('announces the active chip as selected', () => {
    render(<FolderChips folders={FOLDERS} selected="f2" onSelect={jest.fn()} />)
    expect(screen.getByLabelText('Skolegård').props.accessibilityState.selected).toBe(true)
    expect(screen.getByLabelText('Alle').props.accessibilityState.selected).toBe(false)
  })
})
