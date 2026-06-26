import { type ReactNode } from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { Text } from './Text'
import { sticker, spacing } from '../../lib/theme'

// Small pill label used in the sticker UI for points, difficulty and folder
// tags. Non-interactive. Colour comes from a tone token, never raw values.

export type ChipTone =
  | 'accent'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'neutral'

const TONE: Record<ChipTone, { bg: string; fg: string }> = {
  accent: { bg: sticker.color.accent, fg: sticker.color.ink },
  primary: { bg: sticker.color.primaryBg, fg: sticker.color.primary },
  success: { bg: sticker.color.successBg, fg: sticker.color.success },
  warning: { bg: sticker.color.warningBg, fg: sticker.color.warning },
  danger: { bg: sticker.color.dangerBg, fg: sticker.color.danger },
  neutral: { bg: sticker.color.surfaceSoft, fg: sticker.color.textMuted },
}

export type ChipProps = {
  label: string
  tone?: ChipTone
  icon?: ReactNode
  /** Render the label in JetBrains Mono (for numeric values like points). */
  mono?: boolean
  style?: StyleProp<ViewStyle>
}

export function Chip({ label, tone = 'neutral', icon, mono = false, style }: ChipProps) {
  const t = TONE[tone]
  return (
    <View style={[styles.chip, { backgroundColor: t.bg }, style]}>
      {icon}
      <Text size="xs" weight="semibold" font={mono ? 'mono' : 'sans'} color={t.fg}>
        {label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['2xs'],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing['2xs'],
    borderRadius: sticker.radius.full,
  },
})
