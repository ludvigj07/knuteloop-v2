import { fireEvent, render, screen } from '@testing-library/react-native'
import StaffPreview from './StaffPreview'

const mockBack = jest.fn()
jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack, canGoBack: () => true }) }))
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))
jest.mock('@shopify/flash-list', () => ({
  FlashList: jest.requireActual<typeof import('react-native')>('react-native').FlatList,
}))

function press(label: string | RegExp) {
  fireEvent.press(screen.getByLabelText(label))
}

function chooseRemoval() {
  press('Fjern innhold')
  press('Trakassering eller mobbing')
  press('Se over avgjørelsen')
  press('Bekreft valget')
}

beforeEach(() => mockBack.mockClear())

describe('StaffPreview', () => {
  it('introduces the demo, opens the queue and returns to the app', () => {
    render(<StaffPreview />)
    expect(screen.getByText('Demo · bare eksempeldata. Endringer lagres ikke.')).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Oversikt' }).props.accessibilityState.selected).toBe(true)

    press('Gå til rapportkøen')
    expect(screen.getByRole('tab', { name: 'Rapporter' }).props.accessibilityState.selected).toBe(true)
    expect(screen.getAllByLabelText(/^Åpne sak S-/)).toHaveLength(4)

    press('Lukk forhåndsvisningen')
    expect(mockBack).toHaveBeenCalledTimes(1)
  })

  it('filters the queue between pending, urgent and resolved cases', () => {
    render(<StaffPreview />)
    press('Rapporter')
    expect(screen.getAllByLabelText(/^Åpne sak S-/)).toHaveLength(4)

    press('Vis haster saker')
    expect(screen.getAllByLabelText(/^Åpne sak S-/)).toHaveLength(2)
    expect(screen.getByLabelText(/^Åpne sak S-1041\./)).toBeTruthy()
    expect(screen.getByLabelText(/^Åpne sak S-1043\./)).toBeTruthy()
    expect(screen.queryByLabelText(/^Åpne sak S-1042\./)).toBeNull()

    press('Vis behandlet saker')
    expect(screen.queryAllByLabelText(/^Åpne sak S-/)).toHaveLength(0)
    expect(screen.getByText('Ingen behandlede saker ennå')).toBeTruthy()

    press('Vis venter saker')
    expect(screen.getAllByLabelText(/^Åpne sak S-/)).toHaveLength(4)
  })

  it.each([
    {
      id: 'S-1042',
      action: 'La stå',
      reason: 'Bryter ikke retningslinjene',
      duration: null,
      outcome: 'Innsending beholdt',
      visibility: 'Synlig i forhåndsvisningen',
    },
    {
      id: 'S-1041',
      action: 'Fjern innhold',
      reason: 'Innhold delt uten samtykke',
      duration: null,
      outcome: 'Innsending fjernet',
      visibility: 'Skjult i forhåndsvisningen',
    },
    {
      id: 'S-1044',
      action: 'Fjern og utesteng',
      reason: 'Trakassering eller mobbing',
      duration: '7 dager',
      outcome: 'Innsending fjernet og bruker utestengt i én uke',
      visibility: 'Skjult i forhåndsvisningen',
    },
  ])('moves a case to Behandlet only after confirming $action', ({
    id, action, reason, duration, outcome, visibility,
  }) => {
    render(<StaffPreview />)
    press('Rapporter')
    press(new RegExp(`^Åpne sak ${id}\\.`))
    press(action)
    press(reason)
    if (duration) press(duration)
    press('Se over avgjørelsen')

    expect(screen.getByText(outcome)).toBeTruthy()
    expect(screen.getByText(`Begrunnelse: ${reason}`)).toBeTruthy()
    expect(screen.queryByText('Saken er avsluttet')).toBeNull()
    press('Bekreft valget')

    expect(screen.getByText(`Sak ${id} er behandlet i demoen.`)).toBeTruthy()
    expect(screen.queryByLabelText(new RegExp(`^Åpne sak ${id}\\.`))).toBeNull()
    expect(screen.getAllByLabelText(/^Åpne sak S-/)).toHaveLength(3)

    press('Vis behandlet saker')
    expect(screen.getAllByLabelText(/^Åpne sak S-/)).toHaveLength(1)
    press(new RegExp(`^Åpne sak ${id}\\.`))
    expect(screen.getByText('Saken er avsluttet')).toBeTruthy()
    expect(screen.getByText(outcome)).toBeTruthy()
    expect(screen.getByText(visibility)).toBeTruthy()
    expect(screen.queryByLabelText('La stå')).toBeNull()

    press('Tilbake til oversikten')
    press('Logg')
    expect(screen.getByText(`Demo: ${outcome}. Begrunnelse: ${reason}`)).toBeTruthy()
    press(new RegExp(`^Åpne sak ${id}\\. Demo: ${outcome}`))
    expect(screen.getByText('Saken er avsluttet')).toBeTruthy()
    expect(mockBack).not.toHaveBeenCalled()
  })

  it('records case openings and can reopen the same case from its local log', () => {
    render(<StaffPreview />)
    press('Logg')
    expect(screen.getByText('Ingen handlinger ennå')).toBeTruthy()
    press('Oversikt')
    press(/^Åpne neste sak, S-1043\./)
    expect(screen.getByText('Hvorfor ser du sak S-1043?')).toBeTruthy()

    press('Tilbake til oversikten')
    press('Logg')
    expect(screen.getAllByLabelText(/^Åpne sak S-1043\. Demo:/)).toHaveLength(1)
    press(/^Åpne sak S-1043\. Demo:/)
    expect(screen.getByText('Hvorfor ser du sak S-1043?')).toBeTruthy()
    press('Tilbake til oversikten')
    expect(screen.getAllByLabelText(/^Åpne sak S-1043\. Demo:/)).toHaveLength(2)
  })

  it('keeps work after cancelling reset, and restores cases and clears the log after confirmation', () => {
    render(<StaffPreview />)
    press(/^Åpne neste sak, S-1043\./)
    chooseRemoval()
    press('Oversikt')
    press('Nullstill eksemplene')
    expect(screen.getByText('Begynne på nytt?')).toBeTruthy()
    press('Avbryt')
    expect(screen.queryByText('Begynne på nytt?')).toBeNull()

    press('Logg')
    expect(screen.getAllByLabelText(/^Åpne sak S-1043. Demo:/)).toHaveLength(2)
    press('Rapporter')
    press('Vis behandlet saker')
    expect(screen.getByLabelText(/^Åpne sak S-1043\./)).toBeTruthy()

    press('Oversikt')
    press('Nullstill eksemplene')
    // Both the trigger and the sheet action exist; the last is the confirmation.
    const resetButtons = screen.getAllByLabelText('Nullstill eksemplene')
    fireEvent.press(resetButtons[resetButtons.length - 1]!)
    expect(screen.getByText('Eksemplene er nullstilt.')).toBeTruthy()

    press('Logg')
    expect(screen.getByText('Ingen handlinger ennå')).toBeTruthy()
    press('Rapporter')
    expect(screen.getAllByLabelText(/^Åpne sak S-/)).toHaveLength(4)
    press('Vis behandlet saker')
    expect(screen.getByText('Ingen behandlede saker ennå')).toBeTruthy()
    press('Vis venter saker')
    press(/^Åpne sak S-1041\./)
    expect(screen.getByText('Synlig i forhåndsvisningen')).toBeTruthy()
    expect(screen.getByLabelText('La stå')).toBeTruthy()
  })
})
