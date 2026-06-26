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
// (Android `elevation` can't do a directional hard shadow). When `onPress` is
// given the surface presses flat onto its shadow, mirroring the web `.sticker`.

const AnimatedPressable = Animated.createAnimatedComponent(RNPressable)

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
  style,
  children,
}: StickerCardProps) {
  const offset = shadow === 'none' ? 0 : sticker.shadowOffset[shadow]
  const borderRadius = sticker.radius[radius]
  const pressed = useSharedValue(0)
  const reduceMotion = useReducedMotion()

  const surfaceAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: pressed.value * offset },
      { translateY: pressed.value * offset },
    ],
  }))

  const surfaceStyle: ViewStyle = {
    borderWidth: sticker.borderWidth,
    borderColor: sticker.color.ink,
    borderRadius,
    backgroundColor: TONE_BG[tone],
    padding: spacing[padding],
  }

  const content = (
    <>
      {offset > 0 ? (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: sticker.color.ink, borderRadius, transform: [{ translateX: offset }, { translateY: offset }] },
          ]}
        />
      ) : null}
    </>
  )

  if (!onPress) {
    return (
      <View style={[styles.outer, style]}>
        {content}
        <View style={surfaceStyle}>{children}</View>
      </View>
    )
  }

  const handlePressIn = () => {
    if (!reduceMotion && offset > 0) pressed.value = withTiming(1, { duration: 120 })
    if (haptic !== 'none' && !disabled) void haptics[haptic]()
  }
  const handlePressOut = () => {
    if (!reduceMotion && offset > 0) pressed.value = withTiming(0, { duration: 120 })
  }

  return (
    <View style={[styles.outer, style]}>
      {content}
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled }}
        style={[surfaceStyle, surfaceAnimStyle, disabled ? styles.disabled : null]}
      >
        {children}
      </AnimatedPressable>
    </View>
  )
}

const styles = StyleSheet.create({
  outer: { position: 'relative' },
  disabled: { opacity: 0.5 },
})
