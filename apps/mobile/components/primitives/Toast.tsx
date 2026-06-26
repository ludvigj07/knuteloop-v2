import { useCallback, useEffect, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { Text } from './Text'
import { shadows, sticker, spacing } from '../../lib/theme'

// Lightweight transient toast for confirmations + non-blocking errors. Replaces
// Alert.alert for anything non-destructive (frontend.md §13). Controlled: the
// screen owns the message via useToast() and renders <Toast/> over its content.

export function useToast() {
  const [message, setMessage] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = useCallback((msg: string) => {
    setMessage(msg)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setMessage(null), 2400)
  }, [])

  // Clear the pending timer on unmount (cleanup only — not data fetching).
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  return { message, show }
}

export type ToastProps = {
  message: string | null
  /** Distance from the bottom edge (px) — lift it above a tab bar. */
  bottomOffset?: number
}

export function Toast({ message, bottomOffset = spacing['2xl'] }: ToastProps) {
  const v = useSharedValue(0)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    v.value = withTiming(message ? 1 : 0, { duration: reduceMotion ? 0 : 180 })
  }, [message, reduceMotion, v])

  const animStyle = useAnimatedStyle(() => ({
    opacity: v.value,
    transform: [{ translateY: (1 - v.value) * spacing.md }],
  }))

  if (!message) return null

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.wrap, { bottom: bottomOffset }, animStyle]}
      accessibilityLiveRegion="polite"
    >
      <View style={styles.pill}>
        <Text size="sm" weight="semibold" color={sticker.color.textInverse} align="center">
          {message}
        </Text>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    alignItems: 'center',
  },
  pill: {
    backgroundColor: sticker.color.ink,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: sticker.radius.full,
    ...shadows.lg,
  },
})
