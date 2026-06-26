import { type ReactNode } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { Pressable } from './Pressable'
import { StickerCard } from './StickerCard'
import { Text } from './Text'
import type { HapticKind } from '../../lib/haptics'
import { fontSize, size, sticker, spacing } from '../../lib/theme'

// The sticker-styled button: a die-cut StickerCard that presses flat. Variants
// map to design tones; `accent` is the loud golden hero CTA (one per screen).
// `ghost` is a quiet borderless action (no card). Existing flat `Button` is left
// untouched so non-sticker screens don't change.

type Variant = 'primary' | 'accent' | 'secondary' | 'destructive' | 'ghost'
type ButtonSize = 'sm' | 'base' | 'lg'

const VARIANT: Record<Variant, { tone: 'primary' | 'accent' | 'surface' | 'danger'; fg: string }> = {
  primary: { tone: 'primary', fg: sticker.color.textInverse },
  accent: { tone: 'accent', fg: sticker.color.ink },
  secondary: { tone: 'surface', fg: sticker.color.ink },
  destructive: { tone: 'danger', fg: sticker.color.textInverse },
  ghost: { tone: 'surface', fg: sticker.color.text }, // tone unused for ghost
}

const SIZE: Record<ButtonSize, { minHeight: number; paddingX: keyof typeof spacing; font: keyof typeof fontSize }> = {
  sm: { minHeight: sticker.tap.min, paddingX: 'md', font: 'sm' },
  base: { minHeight: sticker.tap.size, paddingX: 'lg', font: 'base' },
  lg: { minHeight: size.controlHeightLg, paddingX: 'xl', font: 'lg' },
}

export type StickerButtonProps = {
  onPress: () => void
  label: string // bokmål
  variant?: Variant
  size?: ButtonSize
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
  /** ALL-CAPS label — reserve for the accent hero CTA (frontend.md / brand). */
  uppercase?: boolean
  haptic?: HapticKind | 'none'
  accessibilityHint?: string
}

export function StickerButton({
  onPress,
  label,
  variant = 'primary',
  size: sizeProp = 'base',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  uppercase = false,
  haptic = 'medium',
  accessibilityHint,
}: StickerButtonProps) {
  const v = VARIANT[variant]
  const s = SIZE[sizeProp]
  const isDisabled = disabled || loading

  const inner = (
    <View style={[styles.inner, { minHeight: s.minHeight, paddingHorizontal: spacing[s.paddingX] }]}>
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <>
          {icon != null && iconPosition === 'left' ? icon : null}
          <Text
            font="display"
            weight="bold"
            size={s.font}
            color={v.fg}
            style={uppercase ? styles.uppercase : undefined}
          >
            {label}
          </Text>
          {icon != null && iconPosition === 'right' ? icon : null}
        </>
      )}
    </View>
  )

  if (variant === 'ghost') {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        haptic={isDisabled ? 'none' : haptic}
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint}
        style={[styles.ghost, { alignSelf: fullWidth ? 'stretch' : 'flex-start' }]}
      >
        {inner}
      </Pressable>
    )
  }

  return (
    <StickerCard
      tone={v.tone}
      radius="md"
      shadow={sizeProp === 'sm' ? 'sm' : 'base'}
      padding="none"
      onPress={onPress}
      disabled={isDisabled}
      haptic={isDisabled ? 'none' : haptic}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      style={{ alignSelf: fullWidth ? 'stretch' : 'flex-start' }}
    >
      {inner}
    </StickerCard>
  )
}

const styles = StyleSheet.create({
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  ghost: {
    borderRadius: sticker.radius.md,
  },
  uppercase: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
})
