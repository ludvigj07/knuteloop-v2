import { act, renderHook } from '@testing-library/react-native'
import type { StaffDecision } from '../components/staff/staff-preview-data'
import { useStaffPreview } from './useStaffPreview'

describe('useStaffPreview', () => {
  it('records opening a known case and ignores an unknown case', () => {
    const { result } = renderHook(() => useStaffPreview())

    act(() => {
      result.current.openReport('unknown')
      result.current.openReport('S-1041')
    })

    expect(result.current.events).toHaveLength(1)
    expect(result.current.events[0]).toEqual(expect.objectContaining({
      reportId: 'S-1041',
      description: 'Demo: saken ble åpnet.',
    }))
    expect(result.current.reports.every((report) => !report.decision)).toBe(true)
  })

  it('restores visibility when a hidden submission is kept', () => {
    const { result } = renderHook(() => useStaffPreview())
    expect(result.current.reports.find((report) => report.id === 'S-1042')?.visibility).toBe('hidden')

    act(() => result.current.resolveReport('S-1042', {
      action: 'keep',
      reason: '  Bryter ikke reglene  ',
    }))

    expect(result.current.reports.find((report) => report.id === 'S-1042')).toEqual(expect.objectContaining({
      visibility: 'visible',
      decision: { action: 'keep', reason: 'Bryter ikke reglene' },
    }))
    expect(result.current.events).toHaveLength(1)
    expect(result.current.events[0]?.description).toContain('Innsending beholdt')
    expect(result.current.events[0]?.description).toContain('Bryter ikke reglene')
  })

  it.each<StaffDecision>([
    { action: 'remove', reason: 'Bryter reglene' },
    { action: 'suspend', reason: 'Gjentatte brudd', duration: 'day' },
    { action: 'suspend', reason: 'Gjentatte brudd', duration: 'week' },
  ])('hides a visible submission when resolving with $action / $duration', (decision) => {
    const { result } = renderHook(() => useStaffPreview())

    act(() => result.current.resolveReport('S-1041', decision))

    expect(result.current.reports.find((report) => report.id === 'S-1041')).toEqual(expect.objectContaining({
      visibility: 'hidden',
      decision,
    }))
    expect(result.current.events).toHaveLength(1)
    expect(result.current.events[0]?.description).toContain('Innsending fjernet')
    if (decision.action === 'suspend') {
      expect(result.current.events[0]?.description).toContain(decision.duration === 'day' ? 'ett døgn' : 'én uke')
    }
  })

  it('requires a reason and a suspension duration, and ignores unknown IDs', () => {
    const { result } = renderHook(() => useStaffPreview())
    const originalVisibility = result.current.reports.find((report) => report.id === 'S-1041')?.visibility

    act(() => {
      result.current.resolveReport('S-1041', { action: 'keep', reason: '' })
      result.current.resolveReport('S-1041', { action: 'remove', reason: '   ' })
      result.current.resolveReport('S-1041', { action: 'suspend', reason: 'Gjentatte brudd' })
      result.current.resolveReport('unknown', { action: 'remove', reason: 'Bryter reglene' })
    })

    expect(result.current.reports.find((report) => report.id === 'S-1041')?.visibility).toBe(originalVisibility)
    expect(result.current.reports.every((report) => !report.decision)).toBe(true)
    expect(result.current.events).toHaveLength(0)
  })

  it('applies only the first resolution even when two actions arrive together', () => {
    const { result } = renderHook(() => useStaffPreview())

    act(() => {
      result.current.resolveReport('S-1041', { action: 'remove', reason: 'Bryter reglene' })
      result.current.resolveReport('S-1041', { action: 'keep', reason: 'Ombestemt' })
    })

    expect(result.current.reports.find((report) => report.id === 'S-1041')?.decision).toEqual({
      action: 'remove',
      reason: 'Bryter reglene',
    })
    expect(result.current.reports.find((report) => report.id === 'S-1041')?.visibility).toBe('hidden')
    expect(result.current.events).toHaveLength(1)
  })

  it('resets decisions, visibility and the local log, allowing another practice run', () => {
    const { result } = renderHook(() => useStaffPreview())
    const initialVisibility = result.current.reports.find((report) => report.id === 'S-1041')?.visibility

    act(() => {
      result.current.openReport('S-1041')
      result.current.resolveReport('S-1041', { action: 'remove', reason: 'Bryter reglene' })
    })
    expect(result.current.events).toHaveLength(2)

    act(() => result.current.reset())

    expect(result.current.events).toHaveLength(0)
    expect(result.current.reports.every((report) => !report.decision)).toBe(true)
    expect(result.current.reports.find((report) => report.id === 'S-1041')?.visibility).toBe(initialVisibility)

    act(() => result.current.resolveReport('S-1041', { action: 'keep', reason: 'Bryter ikke reglene' }))
    expect(result.current.reports.find((report) => report.id === 'S-1041')?.decision?.action).toBe('keep')
    expect(result.current.events).toHaveLength(1)
  })
})
