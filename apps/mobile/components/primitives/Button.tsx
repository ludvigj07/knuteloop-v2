import { type ReactNode } from 'react'
import { ActivityIndicator, StyleSheet } from 'react-native'
import { Pressable } from './Pressable'
import { Text } from './Text'
import type { HapticKind } from '../../lib/haptics'
import {
  borderWidth,
  colors,
  fontSize,
  radius,
  size,
  spacing,
} from '../../lib/theme'

// Design-system Button, built on the Pressable primitive (so it inherits the
// scale + haptic brand feel) and Text. Variants/sizes map to theme tokens only.

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive'
type ButtonSize = 'sm' | 'base' | 'lg'

const VARIANT: Record<Variant, { bg: string; fg: 'inverse' | 'ink'; border: string }> = {
  primary: { bg: colors.ink, fg: 'inverse', border: colors.ink },
  secondary: { bg: colors.accent.yellow, fg: 'ink', border: colors.borderInk },
  ghost: { bg: colors.transparent, fg: 'ink', border: colors.borderStrong },
  destructive: { bg: colors.error, fg: 'inverse', border: colors.error },
}

const SIZE: Record<
  ButtonSize,
  { height: number; paddingX: keyof typeof spacing; font: keyof typeof fontSize }
> = {
  sm: { height: size.controlHeightSm, paddingX: 'md', font: 'sm' },
  base: { height: size.controlHeightBase, paddingX: 'lg', font: 'base' },
  lg: { height: size.controlHeightLg, paddingX: 'xl', font: 'lg' },
}

export type ButtonProps = {
  onPress: () => void
  label: string // bokmål
  variant?: Variant
  size?: ButtonSize
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
  haptic?: HapticKind | 'none'
  accessibilityHint?: string
}

export function Button({
  onPress,
  label,
  variant = 'primary',
  size: sizeProp = 'base',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  haptic = 'medium',
  accessibilityHint,
}: ButtonProps) {
  const v = VARIANT[variant]
  const s = SIZE[sizeProp]
  const isDisabled = disabled || loading

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      haptic={isDisabled ? 'none' : haptic}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      style={[
        styles.base,
        {
          minHeight: s.height,
          paddingHorizontal: spacing[s.paddingX],
          backgroundColor: v.bg,
          borderColor: v.border,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg === 'inverse' ? colors.text.inverse : colors.ink} />
      ) : (
        <>
          {icon != null && iconPosition === 'left' ? icon : null}
          <Text size={s.font} weight="bold" color={v.fg}>
            {label}
          </Text>
          {icon != null && iconPosition === 'right' ? icon : null}
        </>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: borderWidth.thin,
    borderRadius: radius.full,
  },
})
