import { fireEvent, render, screen } from '@testing-library/react-native'
import { AddOwnKnuterSheet } from './AddOwnKnuterSheet'
import type { Knute } from '../../lib/api'

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

const knute = (id: string, title: string): Knute => ({
  id,
  title,
  description: null,
  points: 10,
  difficulty: 'Lett',
  evidenceType: 'media',
  isGold: false,
  isActive: true,
  createdAt: '2026-07-01T00:00:00Z',
  myStatus: null,
  folderIds: [],
})

const CANDIDATES = [knute('k1', 'Syng i kantina'), knute('k2', 'Lag en russelåt')]

function renderSheet(props: Partial<Parameters<typeof AddOwnKnuterSheet>[0]> = {}) {
  return render(
    <AddOwnKnuterSheet
      open
      folderName="musikk"
      candidates={CANDIDATES}
      adding={false}
      onClose={jest.fn()}
      onConfirm={jest.fn()}
      {...props}
    />,
  )
}

describe('AddOwnKnuterSheet', () => {
  it('lists the school knuter that are not in the folder yet', () => {
    renderSheet()
    expect(screen.getByText('Syng i kantina')).toBeTruthy()
    expect(screen.getByText('Lag en russelåt')).toBeTruthy()
  })

  it('confirms with exactly the selected knute ids', () => {
    const onConfirm = jest.fn()
    renderSheet({ onConfirm })
    fireEvent.press(screen.getByLabelText('Syng i kantina'))
    fireEvent.press(screen.getByLabelText('Lag en russelåt'))
    fireEvent.press(screen.getByLabelText('Syng i kantina')) // deselect again
    fireEvent.press(screen.getByLabelText('Legg til (1)'))
    expect(onConfirm).toHaveBeenCalledWith(['k2'])
  })

  it('disables the confirm button until something is selected', () => {
    const onConfirm = jest.fn()
    renderSheet({ onConfirm })
    fireEvent.press(screen.getByLabelText('Legg til'))
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('explains itself when every knute is already in the folder', () => {
    renderSheet({ candidates: [] })
    expect(screen.getByText('Alle knutene dine ligger allerede i denne mappa.')).toBeTruthy()
  })
})
