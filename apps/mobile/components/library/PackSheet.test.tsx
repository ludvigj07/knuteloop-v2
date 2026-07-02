import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PackSheet } from './PackSheet'
import { fetchLibraryPack } from '../../lib/api'
import type { LibraryPackDetail } from '../../lib/api'

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))
jest.mock('../../lib/api', () => ({ fetchLibraryPack: jest.fn() }))

const DETAIL: LibraryPackDetail = {
  pack: { id: 'p1', name: 'Anbefalt starter', description: 'Klassikerne.' },
  knuter: [
    { id: 'a', title: 'Russedåp', points: 10, suggestedFolder: 'Generelle', evidenceType: 'media', minAge: 17, imported: true },
    { id: 'b', title: 'Linjal', points: 15, suggestedFolder: 'Rampestrek', evidenceType: 'media', minAge: 17, imported: false },
    { id: 'c', title: 'Kongla', points: 45, suggestedFolder: 'Sex', evidenceType: 'text', minAge: 18, imported: false },
  ],
}

function renderSheet(detail: LibraryPackDetail = DETAIL, onImport = jest.fn()) {
  ;(fetchLibraryPack as jest.Mock).mockResolvedValue(detail)
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={qc}>
      <PackSheet packId="p1" importing={false} onClose={jest.fn()} onImport={onImport} />
    </QueryClientProvider>,
  )
  return onImport
}

describe('PackSheet', () => {
  it('previews the contents with folder targets and already-added locks', async () => {
    renderSheet()
    await waitFor(() => expect(screen.getByText('Anbefalt starter')).toBeTruthy())
    expect(screen.getByLabelText(/Russedåp.*allerede lagt til/)).toBeTruthy()
    expect(screen.getByLabelText(/Linjal, 15 poeng, Rampestrek$/)).toBeTruthy()
  })

  it('the CTA counts only the NEW knuter and imports the pack', async () => {
    const onImport = renderSheet()
    await waitFor(() => expect(screen.getByLabelText('Legg til 2 nye')).toBeTruthy())
    fireEvent.press(screen.getByLabelText('Legg til 2 nye'))
    expect(onImport).toHaveBeenCalledWith('p1')
  })

  it('locks the CTA when everything is already added', async () => {
    const all = {
      ...DETAIL,
      knuter: DETAIL.knuter.map((k) => ({ ...k, imported: true })),
    }
    const onImport = renderSheet(all)
    await waitFor(() =>
      expect(screen.getByLabelText('Alt i pakka er allerede lagt til')).toBeTruthy(),
    )
    fireEvent.press(screen.getByLabelText('Alt i pakka er allerede lagt til'))
    expect(onImport).not.toHaveBeenCalled()
  })
})
