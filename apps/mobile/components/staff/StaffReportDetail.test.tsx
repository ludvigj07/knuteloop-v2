import { fireEvent, render, screen } from '@testing-library/react-native'
import { StaffReportDetail } from './StaffReportDetail'
import type { StaffReport } from './staff-preview-data'

const REPORT: StaffReport = {
  id: 'SAK-101',
  title: 'Mulig trakassering',
  school: 'Eksempelskolen',
  knute: 'Si noe hyggelig',
  russenavn: 'Eksempelruss',
  receivedAt: '2026-09-06T10:30:00.000Z',
  escalation: 'Knutesjefen er selv involvert i denne saken.',
  description: 'Innsendingen beskrives som nedsettende mot en medelev.',
  urgent: false,
  visibility: 'visible',
}

function renderDetail(report: StaffReport = REPORT) {
  const onResolve = jest.fn()
  render(<StaffReportDetail report={report} onResolve={onResolve} />)
  return onResolve
}

describe('StaffReportDetail', () => {
  it('connects the shown content to the escalation and labels the illustrative content', () => {
    renderDetail()
    expect(screen.getByText('Hvorfor ser du sak SAK-101?')).toBeTruthy()
    expect(screen.getByText(REPORT.escalation)).toBeTruthy()
    expect(screen.getByText(REPORT.knute)).toBeTruthy()
    expect(screen.getByText(REPORT.russenavn)).toBeTruthy()
    expect(screen.getByText(REPORT.description)).toBeTruthy()
    expect(screen.getByText('Eksempelinnhold')).toBeTruthy()
  })

  it('requires an explicit reason before reviewing and confirming a removal', () => {
    const onResolve = renderDetail()
    fireEvent.press(screen.getByLabelText('Se over avgjørelsen'))
    expect(screen.queryByLabelText('Bekreft valget')).toBeNull()

    fireEvent.press(screen.getByLabelText('Fjern innhold'))
    fireEvent.press(screen.getByLabelText('Se over avgjørelsen'))
    expect(screen.queryByLabelText('Bekreft valget')).toBeNull()
    expect(screen.getByRole('radio', { name: 'Trakassering eller mobbing' }).props.accessibilityState.checked).toBe(false)

    fireEvent.press(screen.getByLabelText('Trakassering eller mobbing'))
    fireEvent.press(screen.getByLabelText('Se over avgjørelsen'))
    expect(screen.getByText('Begrunnelse: Trakassering eller mobbing')).toBeTruthy()
    expect(screen.getByText(/Kun eksempeldata endres/)).toBeTruthy()
    expect(onResolve).not.toHaveBeenCalled()

    fireEvent.press(screen.getByLabelText('Bekreft valget'))
    fireEvent.press(screen.getByLabelText('Bekreft valget'))
    expect(onResolve).toHaveBeenCalledTimes(1)
    expect(onResolve).toHaveBeenCalledWith({ action: 'remove', reason: 'Trakassering eller mobbing' })
  })

  it('allows editing and cancelling the review without resolving the case', () => {
    const onResolve = renderDetail()
    fireEvent.press(screen.getByLabelText('La stå'))
    expect(screen.queryByLabelText('Trakassering eller mobbing')).toBeNull()
    fireEvent.press(screen.getByLabelText('Bryter ikke retningslinjene'))
    fireEvent.press(screen.getByLabelText('Se over avgjørelsen'))
    fireEvent.press(screen.getByLabelText('Endre valgene'))
    expect(screen.getByRole('radio', { name: 'Bryter ikke retningslinjene' }).props.accessibilityState.checked).toBe(true)

    fireEvent.press(screen.getByLabelText('Se over avgjørelsen'))
    fireEvent.press(screen.getByLabelText('Avbryt'))
    expect(screen.queryByLabelText('Bekreft valget')).toBeNull()
    expect(screen.getByRole('radio', { name: 'La stå' }).props.accessibilityState.checked).toBe(false)
    fireEvent.press(screen.getByLabelText('Se over avgjørelsen'))
    expect(screen.queryByLabelText('Bekreft valget')).toBeNull()
    expect(onResolve).not.toHaveBeenCalled()
  })

  it.each([
    { label: '24 timer', duration: 'day' },
    { label: '7 dager', duration: 'week' },
  ])('requires and confirms the selected suspension duration: $label', ({ label, duration }) => {
    const onResolve = renderDetail()
    fireEvent.press(screen.getByLabelText('Fjern og utesteng'))
    fireEvent.press(screen.getByLabelText('Fare for liv eller helse'))
    expect(screen.getByRole('radio', { name: label }).props.accessibilityState.checked).toBe(false)
    fireEvent.press(screen.getByLabelText('Se over avgjørelsen'))
    expect(screen.queryByLabelText('Bekreft valget')).toBeNull()

    fireEvent.press(screen.getByLabelText(label))
    fireEvent.press(screen.getByLabelText('Se over avgjørelsen'))
    expect(screen.getByText(`Eksempelruss markeres som utestengt i ${label} i eksempelet.`)).toBeTruthy()
    expect(onResolve).not.toHaveBeenCalled()
    fireEvent.press(screen.getByLabelText('Bekreft valget'))
    expect(onResolve).toHaveBeenCalledWith({ action: 'suspend', reason: 'Fare for liv eller helse', duration })
  })

  it('clears the reason and duration when the action changes', () => {
    const onResolve = renderDetail()
    fireEvent.press(screen.getByLabelText('Fjern og utesteng'))
    fireEvent.press(screen.getByLabelText('Innhold delt uten samtykke'))
    fireEvent.press(screen.getByLabelText('7 dager'))
    fireEvent.press(screen.getByLabelText('La stå'))
    fireEvent.press(screen.getByLabelText('Se over avgjørelsen'))
    expect(screen.queryByLabelText('Bekreft valget')).toBeNull()
    expect(screen.queryByLabelText('7 dager')).toBeNull()
    fireEvent.press(screen.getByLabelText('Bryter ikke retningslinjene'))
    fireEvent.press(screen.getByLabelText('Se over avgjørelsen'))
    fireEvent.press(screen.getByLabelText('Bekreft valget'))
    expect(onResolve).toHaveBeenCalledWith({ action: 'keep', reason: 'Bryter ikke retningslinjene' })
  })

  it('shows completed cases as read-only', () => {
    const onResolve = renderDetail({
      ...REPORT,
      visibility: 'hidden',
      decision: { action: 'remove', reason: 'Innhold delt uten samtykke' },
    })
    expect(screen.getByText('Saken er avsluttet')).toBeTruthy()
    expect(screen.getByText('Begrunnelse: Innhold delt uten samtykke')).toBeTruthy()
    expect(screen.queryAllByRole('button')).toHaveLength(0)
    expect(screen.queryAllByRole('radio')).toHaveLength(0)
    expect(onResolve).not.toHaveBeenCalled()
  })
})
