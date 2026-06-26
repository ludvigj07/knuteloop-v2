import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { Text } from './Text'
import { sticker, spacing } from '../../lib/theme'

// Mini outline tag used for binary indicators on knute rows — "18+" (age gate)
// and "Tekst" (text-only evidence). Outline, not filled, so it sits quietly
// next to the louder points/difficulty Chips. Never colour-only: always a label.

export type BadgeProps = {
  label: string
  /** Amber emphasis for the 18+ age gate; default is a quiet neutral outline. */
  tone?: 'neutral' | 'age'
  style?: StyleProp<ViewStyle>
}

export function Badge({ label, tone = 'neutral', style }: BadgeProps) {
  const isAge = tone === 'age'
  return (
    <View
      style={[
        styles.badge,
        {
          borderColor: isAge ? sticker.color.accentStrong : sticker.color.line,
          backgroundColor: isAge ? sticker.color.accentBg : sticker.color.card,
        },
        style,
      ]}
    >
      <Text
        size="xs"
        weight="bold"
        color={isAge ? sticker.color.accentStrong : sticker.color.textMuted}
        style={styles.label}
      >
        {label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1.5,
    borderRadius: sticker.radius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
  },
  label: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
})
