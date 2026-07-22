import { fireEvent, render, screen } from '@testing-library/react-native'
import { SubmitActions } from './SubmitActions'

// ADR-0021: the button pair IS the visibility choice. These tests pin the
// contract: which button fires which choice, the evidence gate disables both,
// and the locked state hides the pair entirely.

const baseProps = {
  onSubmit: jest.fn(),
  onCancel: jest.fn(),
  canSubmit: true,
  missingHint: null,
  busyChoice: null,
  locked: false,
}

beforeEach(() => jest.clearAllMocks())

describe('SubmitActions', () => {
  it('«Del i feeden» submits as shared', () => {
    render(<SubmitActions {...baseProps} />)
    fireEvent.press(screen.getByLabelText('Del i feeden'))
    expect(baseProps.onSubmit).toHaveBeenCalledWith('shared')
  })

  it('«Send inn» submits as private', () => {
    render(<SubmitActions {...baseProps} />)
    fireEvent.press(screen.getByLabelText('Send inn'))
    expect(baseProps.onSubmit).toHaveBeenCalledWith('private')
  })

  it('shows the poeng hint when submittable', () => {
    render(<SubmitActions {...baseProps} />)
    expect(
      screen.getByText('Begge gir poeng — «Send inn» viser den bare til knutesjefen.'),
    ).toBeTruthy()
  })

  it('disables both buttons and shows the missing hint when evidence is missing', () => {
    render(
      <SubmitActions
        {...baseProps}
        canSubmit={false}
        missingHint="Legg til et bilde for å sende inn."
      />,
    )
    fireEvent.press(screen.getByLabelText('Del i feeden'))
    fireEvent.press(screen.getByLabelText('Send inn'))
    expect(baseProps.onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText('Legg til et bilde for å sende inn.')).toBeTruthy()
  })

  it('locks BOTH buttons while one choice is in flight (no double submit)', () => {
    render(<SubmitActions {...baseProps} busyChoice="shared" />)
    // The in-flight accent button renders a spinner (label hidden) and ignores
    // presses; the other button is disabled outright.
    expect(screen.queryByText('Del i feeden')).toBeNull()
    fireEvent.press(screen.getByLabelText('Del i feeden'))
    fireEvent.press(screen.getByLabelText('Send inn'))
    expect(baseProps.onSubmit).not.toHaveBeenCalled()
  })

  it('locked: hides the pair, keeps only Tilbake', () => {
    render(<SubmitActions {...baseProps} locked />)
    expect(screen.queryByLabelText('Del i feeden')).toBeNull()
    expect(screen.queryByLabelText('Send inn')).toBeNull()
    fireEvent.press(screen.getByLabelText('Tilbake'))
    expect(baseProps.onCancel).toHaveBeenCalledTimes(1)
  })

  it('Avbryt calls onCancel when not locked', () => {
    render(<SubmitActions {...baseProps} />)
    fireEvent.press(screen.getByLabelText('Avbryt'))
    expect(baseProps.onCancel).toHaveBeenCalledTimes(1)
  })
})
