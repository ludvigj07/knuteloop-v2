import { useCallback, useReducer } from 'react'
import {
  actionLabel,
  createStaffReports,
  type StaffDecision,
  type StaffEvent,
  type StaffReport,
} from '../components/staff/staff-preview-data'

type PreviewState = { reports: StaffReport[]; events: StaffEvent[] }
type PreviewAction =
  | { type: 'open'; id: string; createdAt: string }
  | { type: 'resolve'; id: string; decision: StaffDecision; createdAt: string }
  | { type: 'reset' }

function initialState(): PreviewState {
  return { reports: createStaffReports(), events: [] }
}

function reducer(state: PreviewState, action: PreviewAction): PreviewState {
  if (action.type === 'reset') return initialState()
  const report = state.reports.find((item) => item.id === action.id)
  if (!report) return state

  let reports = state.reports
  let description = 'Demo: saken ble åpnet.'

  if (action.type === 'resolve') {
    const reason = action.decision.reason.trim()
    const { action: outcome, duration } = action.decision
    if (report.decision || !reason) return state
    if (outcome === 'suspend' && duration !== 'day' && duration !== 'week') return state

    const decision: StaffDecision = outcome === 'suspend'
      ? { action: outcome, reason, duration }
      : { action: outcome, reason }
    reports = reports.map((item) => item.id === action.id
      ? { ...item, visibility: outcome === 'keep' ? 'visible' : 'hidden', decision }
      : item)
    description = `Demo: ${actionLabel(decision)}. Begrunnelse: ${reason}`
  }

  const event: StaffEvent = {
    id: `demo-${state.events.length + 1}`,
    reportId: action.id,
    createdAt: action.createdAt,
    description,
  }
  return { reports, events: [event, ...state.events] }
}

// Preview state lives only in this hook instance; it never reaches an API or storage.
export function useStaffPreview() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)
  const openReport = useCallback((id: string) => {
    dispatch({ type: 'open', id, createdAt: new Date().toISOString() })
  }, [])
  const resolveReport = useCallback((id: string, decision: StaffDecision) => {
    dispatch({ type: 'resolve', id, decision, createdAt: new Date().toISOString() })
  }, [])
  const reset = useCallback(() => dispatch({ type: 'reset' }), [])

  return { ...state, openReport, resolveReport, reset }
}
