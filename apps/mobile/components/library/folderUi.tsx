import { ScrollView, StyleSheet, View } from 'react-native'
import { Pressable, Sheet, Skeleton, Text } from '../primitives'
import { DifficultyChip, PointsBadge } from './libraryMeta'
import { formatNumber } from '../../lib/format'
import { borderWidth, colors, radius, size, spacing } from '../../lib/theme'
import type { Folder, Knute } from '../../lib/api'

// Shared UI for the Knuteboka (per-school folders) surface: a folder row for the
// overview, a compact school-knute row (used both inside a folder and in the
// add-picker), and the picker sheet itself.

/** A folder in the overview list — initial tile, name, knute count. */
export function FolderRow({ folder, onPress }: { folder: Folder; onPress: () => void }) {
  return (
    <Pressable
      style={styles.folderRow}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${folder.name}, ${countLabel(folder.knuteCount)}`}
      accessibilityHint="Åpner mappa."
    >
      <View style={styles.tile}>
        <Text size="lg" weight="bold" color="ink">
          {folder.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.textBlock}>
        <Text size="base" weight="semibold" numberOfLines={1}>
          {folder.name}
        </Text>
        <Text size="sm" color="muted">
          {countLabel(folder.knuteCount)}
        </Text>
      </View>
      <Text size="xl" color="muted">
        ›
      </Text>
    </Pressable>
  )
}

/** A school knute as a compact row with one trailing action (remove or add). */
export function AdminKnuteRow({
  knute,
  action,
  busy,
  onAction,
}: {
  knute: Knute
  action: 'remove' | 'add'
  busy: boolean
  onAction: () => void
}) {
  const isRemove = action === 'remove'
  return (
    <View style={styles.knuteRow}>
      <View style={styles.textBlock}>
        <Text size="base" weight="medium" numberOfLines={2}>
          {knute.isGold ? <Text color={colors.gold}>★ </Text> : null}
          {knute.title}
          {!knute.isActive ? (
            <Text size="xs" color="muted">
              {'  ·  arkivert'}
            </Text>
          ) : null}
        </Text>
        <View style={styles.metaRow}>
          <PointsBadge points={knute.points} />
          <DifficultyChip difficulty={knute.difficulty} />
        </View>
      </View>
      <Pressable
        style={[styles.action, isRemove ? styles.actionRemove : styles.actionAdd, busy && styles.busy]}
        onPress={onAction}
        disabled={busy}
        haptic="none"
        accessibilityRole="button"
        accessibilityLabel={`${isRemove ? 'Fjern' : 'Legg til'} ${knute.title}${isRemove ? ' fra mappa' : ' i mappa'}`}
      >
        <Text size="sm" weight="semibold" color={isRemove ? 'error' : 'inverse'}>
          {busy ? '…' : isRemove ? 'Fjern' : '+ Legg til'}
        </Text>
      </Pressable>
    </View>
  )
}

/** Bottom sheet listing school knuter not yet in the folder, to add them. */
export function AddKnutePickerSheet({
  visible,
  candidates,
  loading,
  addingId,
  onAdd,
  onClose,
}: {
  visible: boolean
  candidates: Knute[]
  loading: boolean
  addingId: string | null
  onAdd: (knuteId: string) => void
  onClose: () => void
}) {
  return (
    <Sheet visible={visible} onClose={onClose} accessibilityLabel="Legg til knute i mappa">
      <Text size="xl" weight="bold" accessibilityRole="header">
        Legg til knute
      </Text>
      <Text size="sm" color="muted" style={styles.pickerLede}>
        Velg en av skolens knuter å legge i mappa.
      </Text>
      {loading ? (
        <View style={styles.pickerList}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} style={styles.pickerSkeleton} />
          ))}
        </View>
      ) : candidates.length === 0 ? (
        <View style={styles.pickerEmpty}>
          <Text size="sm" color="muted">
            Alle skolens knuter ligger allerede i denne mappa. Importer flere fra biblioteket.
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.pickerScroll} contentContainerStyle={styles.pickerList}>
          {candidates.map((k) => (
            <AdminKnuteRow
              key={k.id}
              knute={k}
              action="add"
              busy={addingId === k.id}
              onAction={() => onAdd(k.id)}
            />
          ))}
        </ScrollView>
      )}
    </Sheet>
  )
}

function countLabel(n: number): string {
  return n === 1 ? '1 knute' : `${formatNumber(n)} knuter`
}

const styles = StyleSheet.create({
  folderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: borderWidth.thin,
    borderColor: colors.border,
  },
  tile: {
    width: size.otherAvatar,
    height: size.otherAvatar,
    borderRadius: radius.md,
    borderWidth: borderWidth.thin,
    borderColor: colors.borderStrong,
    backgroundColor: colors.knuter.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: { flex: 1, gap: spacing.xs },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  knuteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: borderWidth.thin,
    borderColor: colors.border,
  },
  action: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    minHeight: size.actionMinHeight,
    justifyContent: 'center',
  },
  actionAdd: { backgroundColor: colors.ink },
  actionRemove: { backgroundColor: colors.background, borderWidth: borderWidth.thin, borderColor: colors.borderStrong },
  busy: { opacity: 0.6 },
  pickerLede: { marginTop: spacing['2xs'] },
  pickerScroll: { maxHeight: size.emptyMinHeight + size.controlHeightLg, marginTop: spacing.base },
  pickerList: { gap: spacing.sm, marginTop: spacing.base },
  pickerSkeleton: { height: size.controlHeightLg, borderRadius: radius.md },
  pickerEmpty: { paddingVertical: spacing.lg, alignItems: 'center' },
})
