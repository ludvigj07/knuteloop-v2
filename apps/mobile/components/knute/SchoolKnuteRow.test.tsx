import { fireEvent, render, screen } from '@testing-library/react-native'
import { SchoolKnuteRow } from './SchoolKnuteRow'
import type { Knute } from '../../lib/api'

const knute: Knute = {
  id: 'k1',
  title: 'Spis frokost under pulten',
  description: null,
  points: 10,
  evidenceType: 'media',
  isGold: false,
  isActive: true,
  createdAt: '2026-09-03T12:00:00.000Z',
  myStatus: null,
  folderIds: [],
}

describe('SchoolKnuteRow', () => {
  it('viser en tydelig redigeringsknapp når raden kan fjernes', () => {
    const onPress = jest.fn()
    render(<SchoolKnuteRow knute={knute} onPress={onPress} onRemove={jest.fn()} />)

    fireEvent.press(screen.getByRole('button', { name: 'Rediger Spis frokost under pulten' }))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('beholder fjerning som en separat handling', () => {
    const onPress = jest.fn()
    const onRemove = jest.fn()
    render(<SchoolKnuteRow knute={knute} onPress={onPress} onRemove={onRemove} />)

    fireEvent.press(screen.getByRole('button', { name: 'Fjern Spis frokost under pulten fra mappa' }))
    expect(onRemove).toHaveBeenCalledTimes(1)
    expect(onPress).not.toHaveBeenCalled()
  })
})
