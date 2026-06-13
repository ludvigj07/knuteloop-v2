import { Easing } from 'react-native-reanimated'
import { animation } from './theme'

// Shared motion presets built on the theme's motion tokens. Springs for
// positional change (enter, scale, layout); timings for opacity/color.
// See frontend.md §7.

export const springs = {
  gentle: animation.spring.gentle,
  base: animation.spring.base,
  bouncy: animation.spring.bouncy,
} as const

export const timings = {
  fast: { duration: animation.duration.fast, easing: Easing.out(Easing.cubic) },
  base: { duration: animation.duration.base, easing: Easing.out(Easing.cubic) },
  slow: { duration: animation.duration.slow, easing: Easing.out(Easing.cubic) },
} as const
