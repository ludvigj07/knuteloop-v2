import { StyleSheet, View } from 'react-native'
import { Text } from '../primitives'
import { formatNumber } from '../../lib/format'
import { borderWidth, colors, radius, spacing } from '../../lib/theme'
import type { LibraryKnute } from '../../lib/api'

// Shared presentational bits for the knutebibliotek browse surface. Keeping the
// folder tile + meta chips in one place stops the row and the detail sheet from
// drifting apart.

// A library knute is "sensitive" when it's adult-only (18+). Importing one into
// a school is gated behind an extra confirm (ADR-0015 age gating).
export function isSensitive(knute: Pick<LibraryKnute, 'minAge'>): boolean {
  return knute.minAge >= 18
}

// Difficulty → tone. Mirrors the design kit (Lett=success … Hard=danger).
const DIFFICULTY_COLOR: Record<string, string> = {
  Lett: colors.success,
  Medium: colors.warning,
  Hard: colors.error,
  Valgfri: colors.text.secondary,
}

/** A small folder-tinted tile showing the suggested-folder initial. */
export function FolderTile({
  folder,
  sensitive,
  dimension = spacing.xl + spacing.sm,
}: {
  folder: string
  sensitive: boolean
  dimension?: number
}) {
  return (
    <View
      style={[
        styles.tile,
        { width: dimension, height: dimension },
        sensitive ? styles.tileSensitive : styles.tilePlain,
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Text size="lg" weight="bold" color={sensitive ? colors.gold : colors.ink}>
        {folder.charAt(0).toUpperCase()}
      </Text>
    </View>
  )
}

/** The points pill (russ-red, like the rest of the app). */
export function PointsBadge({ points }: { points: number }) {
  return (
    <View style={styles.points}>
      <Text size="xs" weight="semibold" color="inverse">
        {formatNumber(points)} p
      </Text>
    </View>
  )
}

/** Difficulty chip, coloured by tone. */
export function DifficultyChip({ difficulty }: { difficulty: string }) {
  const tone = DIFFICULTY_COLOR[difficulty] ?? colors.text.secondary
  return (
    <View style={[styles.chip, { borderColor: tone }]}>
      <Text size="xs" weight="semibold" color={tone}>
        {difficulty}
      </Text>
    </View>
  )
}

/** A flag badge — `age` (18+, amber fill) or a neutral tag (Tekst-bevis). */
export function FlagBadge({ label, tone = 'neutral' }: { label: string; tone?: 'age' | 'neutral' }) {
  const isAge = tone === 'age'
  return (
    <View style={[styles.flag, isAge ? styles.flagAge : styles.flagNeutral]}>
      <Text size="xs" weight="semibold" color={isAge ? 'inverse' : 'secondary'}>
        {label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: radius.md,
    borderWidth: borderWidth.thin,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tilePlain: { backgroundColor: colors.knuter.canvas },
  tileSensitive: { backgroundColor: colors.goldSoft, borderColor: colors.gold },
  points: {
    backgroundColor: colors.brand.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing['2xs'],
    borderRadius: radius.sm,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing['2xs'],
    borderRadius: radius.sm,
    borderWidth: borderWidth.thin,
  },
  flag: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing['2xs'],
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  flagNeutral: { backgroundColor: colors.background },
  flagAge: { backgroundColor: colors.warning },
})
