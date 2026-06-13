import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'react-native-reanimated'

// Animates a number from 0 → target over `duration` ms with an ease-out curve.
// Pure presentation (re-renders the value each frame) — used for points / rank
// count-ups. Respects reduced motion (jumps straight to the target).
export function useCountUp(target: number, duration = 600): number {
  const reduceMotion = useReducedMotion()
  const [value, setValue] = useState(reduceMotion ? target : 0)
  const frame = useRef<number>()
  const start = useRef<number>()

  useEffect(() => {
    if (reduceMotion) {
      setValue(target)
      return
    }
    start.current = undefined

    const tick = (now: number) => {
      if (start.current == null) start.current = now
      const t = Math.min(1, (now - start.current) / duration)
      const eased = 1 - Math.pow(1 - t, 3) // easeOutCubic
      setValue(Math.round(target * eased))
      if (t < 1) frame.current = requestAnimationFrame(tick)
    }

    frame.current = requestAnimationFrame(tick)
    return () => {
      if (frame.current != null) cancelAnimationFrame(frame.current)
    }
  }, [target, duration, reduceMotion])

  return value
}
