import { StyleSheet, View } from 'react-native'
import { Pressable, Text } from '../primitives'
import { DifficultyChip, FlagBadge, FolderTile, PointsBadge, isSensitive } from './libraryMeta'
import { formatNumber } from '../../lib/format'
import { borderWidth, colors, radius, size, spacing } from '../../lib/theme'
import type { LibraryKnute } from '../../lib/api'

// One row in the library catalog. Tapping the row opens the detail sheet; the
// trailing control imports (or shows it's already imported). Sensitive (18+)
// knuter are flagged and route their import through a confirm at the screen.
export function LibraryKnuteRow({
  knute,
  importing,
  onOpen,
  onImport,
}: {
  knute: LibraryKnute
  importing: boolean
  onOpen: () => void
  onImport: () => void
}) {
  const sensitive = isSensitive(knute)
  const a11ySuffix = sensitive ? ', 18 pluss' : ''

  return (
    <Pressable
      style={styles.row}
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`${knute.title}, ${formatNumber(knute.points)} poeng, ${knute.suggestedFolder}${a11ySuffix}`}
      accessibilityHint="Åpner detaljer om knuten."
    >
      <FolderTile folder={knute.suggestedFolder} sensitive={sensitive} />

      <View style={styles.textBlock}>
        <Text size="base" weight="medium" numberOfLines={2}>
          {knute.title}
        </Text>
        <View style={styles.metaRow}>
          <PointsBadge points={knute.points} />
          <DifficultyChip difficulty={knute.difficulty} />
          {sensitive ? <FlagBadge label="18+" tone="age" /> : null}
          {knute.evidenceType === 'text' ? <FlagBadge label="Tekst" /> : null}
        </View>
        {knute.description ? (
          <Text size="sm" color="secondary" numberOfLines={2} style={styles.desc}>
            {knute.description}
          </Text>
        ) : null}
      </View>

      {knute.imported ? (
        <View style={styles.added} accessibilityLabel="Lagt til">
          <Text size="sm" weight="semibold" color="success">
            ✓ Lagt til
          </Text>
        </View>
      ) : (
        <Pressable
          style={[styles.add, importing && styles.addBusy]}
          onPress={onImport}
          disabled={importing}
          haptic="none"
          accessibilityRole="button"
          accessibilityLabel={`Legg ${knute.title} til skolen`}
          accessibilityHint={
            sensitive
              ? 'Spør om bekreftelse før den legges til, fordi knuten er 18 pluss.'
              : 'Kopierer knuten inn i skolens liste.'
          }
        >
          <Text size="sm" weight="semibold" color="inverse">
            {importing ? 'Legger til…' : '+ Legg til'}
          </Text>
        </Pressable>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: borderWidth.thin,
    borderColor: colors.border,
  },
  textBlock: { flex: 1, gap: spacing.xs },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  desc: { marginTop: spacing['2xs'] },
  add: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.ink,
    minHeight: size.actionMinHeight,
    justifyContent: 'center',
  },
  addBusy: { opacity: 0.6 },
  added: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.status.approvedBg,
  },
})
