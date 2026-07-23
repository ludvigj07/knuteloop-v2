import { View, StyleSheet } from 'react-native'
import { KnoteIcon, Text, type KnoteGlyph } from '../primitives'
import { size, sticker, spacing } from '../../lib/theme'

// A compact per-folder progress indicator (knutemappe) for the profile's
// «Knote-kategorier» section, in the sticker look: a 2px ink-bordered circle
// showing the completed count, the folder's knot glyph above the label, and a
// thin progress bar encoding completed/total. No SVG arc dependency — a true
// arc ring can come later with react-native-svg (needs an ADR). Pure
// presentation; every value comes from theme tokens.

export type CategoryRingProps = {
  label: string
  completed: number
  total: number
  /** Folder accent colour (a sticker theme token value). */
  color: string
  /** Which knot glyph to show above the label. */
  glyph: KnoteGlyph
}

export function CategoryRing({ label, completed, total, color, glyph }: CategoryRingProps) {
  const hasKnuter = total > 0
  const ratio = hasKnuter ? Math.min(1, completed / total) : 0
  const accent = hasKnuter ? color : sticker.color.textMuted
  const isComplete = hasKnuter && completed >= total
  const numberColor = isComplete ? sticker.color.textInverse : hasKnuter ? color : sticker.color.textMuted

  return (
    <View
      style={styles.cell}
      accessibilityRole="text"
      accessibilityLabel={
        hasKnuter ? `${label}: ${completed} av ${total} fullført` : `${label}: ingen knuter ennå`
      }
    >
      <View
        style={[
          styles.ring,
          { borderColor: accent },
          isComplete ? { backgroundColor: accent } : null,
        ]}
      >
        <Text font="mono" size="xl" weight="bold" color={numberColor}>
          {completed}
        </Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: ratio * size.categoryRing, backgroundColor: accent }]} />
      </View>
      <View style={styles.labelRow}>
        <KnoteIcon name={glyph} size={sticker.icon.sm} color={accent} strokeWidth={1.8} />
        <Text size="xs" weight="semibold" color={sticker.color.text} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Text font="mono" size="xs" color={sticker.color.textMuted}>{`${completed}/${total}`}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  cell: { width: '30%', alignItems: 'center', gap: spacing.xs },
  ring: {
    width: size.categoryRing,
    height: size.categoryRing,
    borderRadius: sticker.radius.full,
    borderWidth: sticker.borderWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barTrack: {
    width: size.categoryRing,
    height: size.progressBarHeight,
    borderRadius: sticker.radius.full,
    backgroundColor: sticker.color.surfaceSoft,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: sticker.radius.full },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing['2xs'] },
})
