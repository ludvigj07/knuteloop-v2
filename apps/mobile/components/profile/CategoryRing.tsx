import { View, StyleSheet } from 'react-native'
import { Stack, Text } from '../primitives'
import { borderWidth, colors, radius, size } from '../../lib/theme'

// A compact per-folder progress indicator (knutemappe) for the profile status
// section, modelled on v1's "Knote-kategorier" rings. No SVG dependency is
// installed, so the ring is a bordered circle showing the completed count, with
// a thin progress bar beneath encoding completed/total. A true arc ring can come
// later with react-native-svg (needs an ADR). Pure presentation — all values
// come from theme tokens.

export type CategoryRingProps = {
  label: string
  completed: number
  total: number
  /** Folder accent colour (a theme token value). */
  color: string
}

export function CategoryRing({ label, completed, total, color }: CategoryRingProps) {
  const hasKnuter = total > 0
  const ratio = hasKnuter ? Math.min(1, completed / total) : 0
  const accent = hasKnuter ? color : colors.borderStrong
  const isComplete = hasKnuter && completed >= total

  return (
    <Stack
      align="center"
      gap="xs"
      style={styles.cell}
      accessibilityRole="text"
      accessibilityLabel={
        hasKnuter ? `${label}: ${completed} av ${total} fullført` : `${label}: ingen knuter ennå`
      }
    >
      <View style={[styles.ring, { borderColor: accent }, isComplete ? { backgroundColor: accent } : null]}>
        <Text size="xl" weight="bold" color={isComplete ? 'inverse' : hasKnuter ? color : 'muted'}>
          {completed}
        </Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: ratio * size.categoryRing, backgroundColor: accent }]} />
      </View>
      <Text size="xs" weight="medium" align="center" numberOfLines={1}>
        {label}
      </Text>
      <Text size="xs" color="muted">{`${completed}/${total}`}</Text>
    </Stack>
  )
}

const styles = StyleSheet.create({
  cell: { width: '30%' },
  ring: {
    width: size.categoryRing,
    height: size.categoryRing,
    borderRadius: radius.full,
    borderWidth: borderWidth.thick,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barTrack: {
    width: size.categoryRing,
    height: size.progressBarHeight,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: radius.full },
})
