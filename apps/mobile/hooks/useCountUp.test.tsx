// useCountUp only reads useReducedMotion from reanimated — force it on so the
// hook is deterministic (no rAF) and returns the target immediately.
jest.mock('react-native-reanimated', () => ({ useReducedMotion: () => true }))

import { renderHook } from '@testing-library/react-native'
import { useCountUp } from './useCountUp'

describe('useCountUp', () => {
  it('returns the target immediately when reduced motion is on', () => {
    const { result } = renderHook(() => useCountUp(250))
    expect(result.current).toBe(250)
  })
})
