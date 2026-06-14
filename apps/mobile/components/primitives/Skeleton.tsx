import { useEffect } from 'react'
import { type StyleProp, type ViewStyle } from 'react-native'
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { animation, colors, opacity, radius } from '../../lib/theme'

// A loading placeholder that gently pulses, so loading feels alive instead of
// dead grey blocks. Pass size/shape via `style`. Respects reduced motion (then
// it just sits at full opacity). frontend.md §7 — skeletons, never spinners.

export function Skeleton({ style }: { style?: StyleProp<ViewStyle> }) {
  const pulse = useSharedValue<number>(opacity.shimmerHigh)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (reduceMotion) return
    pulse.value = withRepeat(
      withSequence(
        withTiming(opacity.shimmerLow, { duration: animation.duration.shimmer }),
        withTiming(opacity.shimmerHigh, { duration: animation.duration.shimmer }),
      ),
      -1,
      false,
    )
    return () => cancelAnimation(pulse)
  }, [pulse, reduceMotion])

  const animatedStyle = useAnimatedStyle(() => ({ opacity: pulse.value }))

  return (
    <Animated.View
      style={[{ backgroundColor: colors.knuter.divider, borderRadius: radius.md }, style, animatedStyle]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  )
}
