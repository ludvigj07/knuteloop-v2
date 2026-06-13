import { type ReactNode } from 'react'
import {
  Pressable as RNPressable,
  type GestureResponderEvent,
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
import { animation, opacity } from '../../lib/theme'
import { springs } from '../../lib/animations'
import { haptics, type HapticKind } from '../../lib/haptics'

// The brand "tap". Every interactive element uses this: scale to pressScale on
// press-in (springs back on release) + a haptic. Respects reduced motion.
// accessibilityLabel is REQUIRED — inclusion is the brand (frontend.md §4, §9).

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
  ...rest
}: PressableProps) {
  const scaleValue = useSharedValue(1)
  const reduceMotion = useReducedMotion()
  // RN types `disabled` as boolean | null; normalise to a strict boolean.
  const isDisabled = disabled === true

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }))

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
