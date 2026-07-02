import { type ReactNode } from 'react'
import {
  Pressable as RNPressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { sticker, spacing } from '../../lib/theme'
import { haptics, type HapticKind } from '../../lib/haptics'

// The signature "sticker" surface — a white (or tinted) card with a 2px ink
// border and a HARD offset shadow (solid ink, no blur). The shadow is a real
// View rendered behind-and-offset, so it looks identical on iOS and Android
// (Android `elevation` can't do a directional hard shadow).
//
// Press feedback: the SURFACE stays put (its hit target never moves) and the
// offset shadow fades out — it reads as "pressed flat" but, crucially, the touch
// never leaves the pressable, so onPress always fires. (An earlier version
// translated the surface 4px on press, which made edge/small taps miss.)

type ShadowSize = 'sm' | 'base' | 'lg' | 'none'
type Tone = 'surface' | 'soft' | 'media' | 'primary' | 'accent' | 'danger'

const TONE_BG: Record<Tone, string> = {
  surface: sticker.color.card,
  soft: sticker.color.surfaceSoft,
  media: sticker.color.surfaceMedia,
  primary: sticker.color.primary,
  accent: sticker.color.accent,
  danger: sticker.color.danger,
}

export type StickerCardProps = {
  tone?: keyof typeof TONE_BG
  radius?: keyof typeof sticker.radius
  shadow?: ShadowSize
  /** Inner padding token. 'none' for hairline-separated list cards. */
  padding?: keyof typeof spacing
  onPress?: () => void
  haptic?: HapticKind | 'none'
  disabled?: boolean
  /** Required when `onPress` is set — inclusion is the brand (frontend.md §9). */
  accessibilityLabel?: string
  accessibilityHint?: string
  accessibilityRole?: 'button' | 'link'
  /** For toggle/filter cards (folder chips): announces selected state to screen readers. */
  accessibilitySelected?: boolean
  /** Styles the OUTER box (margins, width, alignSelf). */
  style?: StyleProp<ViewStyle>
  children: ReactNode
}

export function StickerCard({
  tone = 'surface',
  radius = 'lg',
  shadow = 'base',
  padding = 'base',
  onPress,
  haptic = 'light',
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  accessibilitySelected,
  style,
  children,
}: StickerCardProps) {
  const offset = shadow === 'none' ? 0 : sticker.shadowOffset[shadow]
  const borderRadius = sticker.radius[radius]
  const pressed = useSharedValue(0)
  const reduceMotion = useReducedMotion()

  const shadowAnimStyle = useAnimatedStyle(() => ({ opacity: 1 - pressed.value }))

  const surfaceStyle: ViewStyle = {
    borderWidth: sticker.borderWidth,
    borderColor: sticker.color.ink,
    borderRadius,
    backgroundColor: TONE_BG[tone],
    padding: spacing[padding],
  }

  const shadowBaseStyle: StyleProp<ViewStyle> = [
    StyleSheet.absoluteFill,
    {
      backgroundColor: sticker.color.ink,
      borderRadius,
      transform: [{ translateX: offset }, { translateY: offset }],
    },
  ]

  if (!onPress) {
    return (
      <View style={[styles.outer, style]}>
        {offset > 0 ? <View pointerEvents="none" style={shadowBaseStyle} /> : null}
        <View style={surfaceStyle}>{children}</View>
      </View>
    )
  }

  const handlePressIn = () => {
    if (!reduceMotion && offset > 0) pressed.value = withTiming(1, { duration: 90 })
    if (haptic !== 'none' && !disabled) void haptics[haptic]()
  }
  const handlePressOut = () => {
    if (!reduceMotion && offset > 0) pressed.value = withTiming(0, { duration: 140 })
  }

  return (
    <View style={[styles.outer, style]}>
      {offset > 0 ? (
        <Animated.View pointerEvents="none" style={[shadowBaseStyle, shadowAnimStyle]} />
      ) : null}
      <RNPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled, selected: accessibilitySelected }}
        // hitSlop gives a little forgiveness near the edges; the surface itself
        // never moves, so taps register reliably.
        hitSlop={6}
        style={({ pressed: isPressed }) => [
          surfaceStyle,
          isPressed ? styles.pressedDim : null,
          disabled ? styles.disabled : null,
        ]}
      >
        {children}
      </RNPressable>
    </View>
  )
}

const styles = StyleSheet.create({
  outer: { position: 'relative' },
  disabled: { opacity: 0.5 },
  pressedDim: { opacity: 0.92 },
})
