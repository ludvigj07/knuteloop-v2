import { ScrollView, StyleSheet, View } from 'react-native'
import { Button, Sheet, Text } from '../primitives'
import { DifficultyChip, FlagBadge, FolderTile, PointsBadge, isSensitive } from './libraryMeta'
import { borderWidth, colors, fontSize, radius, size, spacing } from '../../lib/theme'
import type { LibraryKnute } from '../../lib/api'

// Bottom sheet showing a single library knute in full: description, metadata,
// and the import action. Opened by tapping a row. `knute === null` keeps it
// closed. Import routes through the screen's gate (so the 18+ confirm still runs).
export function KnuteDetailSheet({
  knute,
  importing,
  onClose,
  onImport,
}: {
  knute: LibraryKnute | null
  importing: boolean
  onClose: () => void
  onImport: () => void
}) {
  return (
    <Sheet visible={knute !== null} onClose={onClose} accessibilityLabel="Detaljer om knuten">
      {knute ? <Body knute={knute} importing={importing} onImport={onImport} /> : null}
    </Sheet>
  )
}

function Body({
  knute,
  importing,
  onImport,
}: {
  knute: LibraryKnute
  importing: boolean
  onImport: () => void
}) {
  const sensitive = isSensitive(knute)

  return (
    <View>
      <View style={styles.head}>
        <FolderTile folder={knute.suggestedFolder} sensitive={sensitive} dimension={size.otherAvatar} />
        <View style={styles.headText}>
          <Text size="xl" weight="bold" accessibilityRole="header">
            {knute.title}
          </Text>
        </View>
      </View>

      <View style={styles.chips}>
        <PointsBadge points={knute.points} />
        <DifficultyChip difficulty={knute.difficulty} />
        {sensitive ? <FlagBadge label="18+" tone="age" /> : null}
        {knute.evidenceType === 'text' ? <FlagBadge label="Tekst-bevis" /> : null}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollBody}>
        {knute.description ? (
          <Text size="base" color="secondary" style={styles.desc}>
            {knute.description}
          </Text>
        ) : null}

        <View style={styles.metaGrid}>
          <Meta label="Mappe" value={knute.suggestedFolder} />
          <Meta label="Vanskelighet" value={knute.difficulty} />
          <Meta label="Bevis" value={knute.evidenceType === 'text' ? 'Tekst' : 'Bilde / video'} />
          <Meta label="Alder" value={sensitive ? '18+' : '17+'} />
          <Meta label="Område" value={knute.region ?? 'Nasjonalt'} />
        </View>

        {sensitive ? (
          <View style={styles.note} accessibilityRole="alert">
            <Text size="sm" color="secondary">
              Dette er en 18+-knute. Du blir bedt om å bekrefte før den legges til.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {knute.imported ? (
        <View style={styles.importedRow} accessibilityLabel="Allerede lagt til i skolen">
          <Text size="base" weight="semibold" color="success">
            ✓ Lagt til i skolen
          </Text>
        </View>
      ) : (
        <View style={styles.action}>
          <Button
            label={importing ? 'Legger til…' : 'Legg til i skolen'}
            onPress={onImport}
            variant="secondary"
            loading={importing}
            fullWidth
            accessibilityHint={
              sensitive
                ? 'Spør om bekreftelse fordi knuten er 18 pluss.'
                : 'Kopierer knuten inn i skolens liste.'
            }
          />
        </View>
      )}
    </View>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaCell}>
      <Text size="xs" weight="semibold" color="muted">
        {label.toLocaleUpperCase('nb-NO')}
      </Text>
      <Text size="base" weight="medium">
        {value}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headText: { flex: 1 },
  chips: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
    marginTop: spacing.md,
  },
  scroll: { maxHeight: size.emptyMinHeight + size.controlHeightLg, marginTop: spacing.base },
  scrollBody: { gap: spacing.base },
  // Body copy gets a looser 1.5× line for readability (dyslexia, frontend.md §3).
  desc: { lineHeight: fontSize.base * 1.5 },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.base },
  metaCell: { gap: spacing['2xs'], minWidth: size.leaderboardPanelActionMinWidth - spacing.xl },
  note: {
    backgroundColor: colors.goldSoft,
    borderRadius: radius.md,
    borderWidth: borderWidth.thin,
    borderColor: colors.gold,
    padding: spacing.base,
  },
  importedRow: {
    marginTop: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.status.approvedBg,
    alignItems: 'center',
  },
  action: { marginTop: spacing.base },
})
