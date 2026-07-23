import { fireEvent, render, screen } from '@testing-library/react-native'
import { SubmitActions } from './SubmitActions'

// ADR-0021 + ADR-0022: the button pair IS the visibility choice, and sharing
// requires a photo. These tests pin the contract: which button fires which
// choice, the share button greys out without a photo (visible = teaching),
// text knuter never render it, and the locked state hides the pair.

const baseProps = {
  onSubmit: jest.fn(),
  onCancel: jest.fn(),
  showShare: true,
  canShare: true,
  canSend: true,
  hint: 'Begge gir poeng — «Send inn» viser den bare til knutesjefen.',
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

  it('renders the hint line', () => {
    render(<SubmitActions {...baseProps} hint="Legg ved bilde for å dele i feeden." />)
    expect(screen.getByText('Legg ved bilde for å dele i feeden.')).toBeTruthy()
  })

  it('ADR-0022: share is visible but dead without a photo — private still works', () => {
    render(<SubmitActions {...baseProps} canShare={false} />)
    // Visible (teaches that photos can be shared) but ignores presses.
    fireEvent.press(screen.getByLabelText('Del i feeden'))
    expect(baseProps.onSubmit).not.toHaveBeenCalled()
    // The private path is unaffected.
    fireEvent.press(screen.getByLabelText('Send inn'))
    expect(baseProps.onSubmit).toHaveBeenCalledWith('private')
  })

  it('ADR-0022: text knuter never render the share button at all', () => {
    render(<SubmitActions {...baseProps} showShare={false} />)
    expect(screen.queryByLabelText('Del i feeden')).toBeNull()
    fireEvent.press(screen.getByLabelText('Send inn'))
    expect(baseProps.onSubmit).toHaveBeenCalledWith('private')
  })

  it('disables both buttons when nothing is filled in', () => {
    render(<SubmitActions {...baseProps} canShare={false} canSend={false} />)
    fireEvent.press(screen.getByLabelText('Del i feeden'))
    fireEvent.press(screen.getByLabelText('Send inn'))
    expect(baseProps.onSubmit).not.toHaveBeenCalled()
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
