import { useMemo, useState, type ReactNode } from 'react'
import {
  Pressable as RNPressable,
  type GestureResponderEvent,
  type Insets,
  type LayoutChangeEvent,
  type PressableProps as RNPressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import { animation, opacity, size } from '../../lib/theme'
import { springs } from '../../lib/animations'
import { haptics, type HapticKind } from '../../lib/haptics'

// The brand "tap". Every interactive element uses this: scale to pressScale on
// press-in (springs back on release) + a haptic. Respects reduced motion.
// accessibilityLabel is REQUIRED — inclusion is the brand (frontend.md §4, §9).
//
// It also guarantees a size.minTapTarget (44px) touch area WITHOUT touching
// layout: the element is measured on layout, and anything smaller gets the
// shortfall back as hitSlop. Small icon buttons stay visually small but become
// reliably tappable — v1 did the same with an invisible ::after overlay
// (docs/v1-detaljer.md §3). Pass an explicit `hitSlop` to opt out.

const AnimatedPressable = Animated.createAnimatedComponent(RNPressable)

export type PressableProps = Omit<
  RNPressableProps,
  'style' | 'children' | 'onPress' | 'accessibilityLabel'
> & {
  onPress: () => void
  /** Haptic fired on press-in. 'light' by default; 'none' to disable. */
  haptic?: HapticKind | 'none'
  /** Scale-down feedback on press. Default true. */
  scale?: boolean
  accessibilityLabel: string
  style?: StyleProp<ViewStyle>
  children: ReactNode
}

export function Pressable({
  onPress,
  haptic = 'light',
  scale = true,
  disabled = false,
  accessibilityLabel,
  accessibilityRole = 'button',
  style,
  children,
  onPressIn,
  onPressOut,
  onLayout,
  hitSlop,
  ...rest
}: PressableProps) {
  const scaleValue = useSharedValue(1)
  const reduceMotion = useReducedMotion()
  // RN types `disabled` as boolean | null; normalise to a strict boolean.
  const isDisabled = disabled === true
  // Shortfall to size.minTapTarget on each axis, halved (applied to both sides).
  const [slop, setSlop] = useState({ x: 0, y: 0 })

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }))

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout
    const x = Math.max(0, Math.ceil((size.minTapTarget - width) / 2))
    const y = Math.max(0, Math.ceil((size.minTapTarget - height) / 2))
    // Returning the previous object lets React bail out of the re-render, so a
    // layout pass that changes nothing costs nothing.
    setSlop((prev) => (prev.x === x && prev.y === y ? prev : { x, y }))
    onLayout?.(e)
  }

  const autoHitSlop = useMemo<Insets | undefined>(() => {
    if (hitSlop !== undefined) return undefined
    if (slop.x === 0 && slop.y === 0) return undefined
    return { top: slop.y, bottom: slop.y, left: slop.x, right: slop.x }
  }, [hitSlop, slop.x, slop.y])

  const handlePressIn = (e: GestureResponderEvent) => {
    if (scale && !reduceMotion) {
      scaleValue.value = withSpring(animation.pressScale, springs.base)
    }
    if (haptic !== 'none' && !isDisabled) {
      void haptics[haptic]()
    }
    onPressIn?.(e)
  }

  const handlePressOut = (e: GestureResponderEvent) => {
    if (scale && !reduceMotion) {
      scaleValue.value = withSpring(1, springs.base)
    }
    onPressOut?.(e)
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onLayout={handleLayout}
      hitSlop={hitSlop ?? autoHitSlop}
      disabled={isDisabled}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isDisabled }}
      style={[animatedStyle, style, isDisabled ? { opacity: opacity.disabled } : null]}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  )
}
