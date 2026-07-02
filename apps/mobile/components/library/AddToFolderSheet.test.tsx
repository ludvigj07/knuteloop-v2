import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AddToFolderSheet } from './AddToFolderSheet'
import { fetchFolders } from '../../lib/api'
import type { Folder, LibraryKnute } from '../../lib/api'

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))
jest.mock('../../lib/api', () => ({
  fetchFolders: jest.fn(),
  createFolder: jest.fn(),
}))

const FOLDERS: Folder[] = [
  { id: 'f-alk', name: 'Alkohol', icon: null, sortOrder: 0, knuteCount: 4 },
  { id: 'f-fest', name: 'Fest', icon: 'star', sortOrder: 1, knuteCount: 2 },
]

const KNUTE: LibraryKnute = {
  id: 'lk1',
  title: 'Stoppeklokke',
  description: 'Drikk en halvliter på ti sekunder.',
  points: 25,
  difficulty: 'Medium',
  evidenceType: 'media',
  minAge: 17,
  suggestedFolder: 'Alkohol',
  region: null,
  imported: false,
  importedKnuteId: null,
}

function renderSheet(
  props: Partial<Parameters<typeof AddToFolderSheet>[0]> = {},
  folders: Folder[] = FOLDERS,
) {
  ;(fetchFolders as jest.Mock).mockResolvedValue({ folders })
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <AddToFolderSheet
        knute={KNUTE}
        confirming={false}
        onClose={jest.fn()}
        onConfirm={jest.fn()}
        {...props}
      />
    </QueryClientProvider>,
  )
}

// Wait until the PRE-CHECK effect has actually applied (the badge renders one
// frame before the selection state on slow CI — asserting on the state kills
// the race that made #64's first CI run flaky).
async function waitForSelected(label: RegExp | string) {
  await waitFor(() =>
    expect(screen.getByLabelText(label).props.accessibilityState.selected).toBe(true),
  )
}

describe('AddToFolderSheet v2', () => {
  it('pre-checks the theme folder and marks it «Foreslått»', async () => {
    const onConfirm = jest.fn()
    renderSheet({ onConfirm })
    await waitForSelected(/^Alkohol/)
    expect(screen.getByText('Foreslått')).toBeTruthy()
    fireEvent.press(screen.getByLabelText('Legg til i 1 mappe'))
    expect(onConfirm).toHaveBeenCalledWith(
      KNUTE,
      expect.objectContaining({ folderIds: ['f-alk'], newFolderName: null, overrides: null }),
    )
  })

  it('offers «Ny mappe: <tema>» pre-checked when the school lacks the theme folder', async () => {
    const onConfirm = jest.fn()
    renderSheet({ onConfirm }, [FOLDERS[1]!]) // only «Fest» — no Alkohol
    await waitForSelected('Ny mappe: Alkohol')
    fireEvent.press(screen.getByLabelText('Legg til i 1 mappe'))
    expect(onConfirm).toHaveBeenCalledWith(
      KNUTE,
      expect.objectContaining({ folderIds: [], newFolderName: 'Alkohol' }),
    )
  })

  it('locks the CTA at zero folders (minst én)', async () => {
    const onConfirm = jest.fn()
    renderSheet({ onConfirm })
    await waitForSelected(/^Alkohol/)
    fireEvent.press(screen.getByLabelText(/^Alkohol/)) // deselect the suggestion
    fireEvent.press(screen.getByLabelText('Legg til i 1 mappe'))
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('pre-checks the context folder instead when browsing from a folder', async () => {
    const onConfirm = jest.fn()
    renderSheet({ onConfirm, contextFolderId: 'f-fest' })
    await waitForSelected(/^Fest/)
    fireEvent.press(screen.getByLabelText('Legg til i 1 mappe'))
    expect(onConfirm).toHaveBeenCalledWith(
      KNUTE,
      expect.objectContaining({ folderIds: ['f-fest'] }),
    )
  })

  it('saves inline edits as overrides on the copy', async () => {
    const onConfirm = jest.fn()
    renderSheet({ onConfirm })
    await waitForSelected(/^Alkohol/)
    fireEvent.press(screen.getByLabelText('Rediger knuten før lagring'))
    fireEvent.changeText(screen.getByLabelText('Poeng'), '40')
    fireEvent.press(screen.getByLabelText('Ferdig med redigering'))
    fireEvent.press(screen.getByLabelText('Legg til i 1 mappe'))
    expect(onConfirm).toHaveBeenCalledWith(
      KNUTE,
      expect.objectContaining({ overrides: { points: 40 } }),
    )
  })
})
