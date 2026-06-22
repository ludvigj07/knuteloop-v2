import { useState } from 'react'
import { View, ScrollView, StyleSheet, TextInput, Alert, RefreshControl } from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Stack } from 'expo-router'
import { Button, Pressable, Skeleton, Text } from '../../components/primitives'
import {
  fetchLibraryKnuter,
  fetchLibraryPacks,
  importLibraryKnute,
  importLibraryPack,
  type LibraryKnute,
  type LibraryPack,
  type ImportPackResponse,
} from '../../lib/api'
import { formatNumber } from '../../lib/format'
import { haptics } from '../../lib/haptics'
import { borderWidth, colors, fontSize, fontWeight, radius, size, spacing } from '../../lib/theme'

// The five library themes (suggested_folder). "Alle" = no filter.
const FOLDERS = ['Generelle', 'Dobbel', 'Rampestrek', 'Alkohol', 'Sex'] as const

export default function BibliotekScreen() {
  const insets = useSafeAreaInsets()
  const qc = useQueryClient()
  const [folder, setFolder] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [packResult, setPackResult] = useState<{ packId: string; res: ImportPackResponse } | null>(null)

  const q = search.trim()
  const packs = useQuery({ queryKey: ['library', 'packs'], queryFn: fetchLibraryPacks })
  const knuter = useQuery({
    queryKey: ['library', 'knuter', folder, q],
    queryFn: () => fetchLibraryKnuter({ folder: folder ?? undefined, q: q || undefined }),
  })

  const invalidateAfterImport = () => {
    void qc.invalidateQueries({ queryKey: ['library'] })
    void qc.invalidateQueries({ queryKey: ['knuter'] })
    void qc.invalidateQueries({ queryKey: ['folders'] })
  }

  const importKnute = useMutation({
    mutationFn: importLibraryKnute,
    onSuccess: () => {
      haptics.success()
      invalidateAfterImport()
    },
    onError: (err) => Alert.alert('Kunne ikke legge til', (err as Error).message),
  })

  const importPack = useMutation({
    mutationFn: importLibraryPack,
    onSuccess: (res, packId) => {
      haptics.success()
      setPackResult({ packId, res })
      invalidateAfterImport()
    },
    onError: (err) => Alert.alert('Import feilet', (err as Error).message),
  })

  const bottomPadding = insets.bottom + spacing.xl

  return (
    <>
      <Stack.Screen options={{ title: 'Bibliotek' }} />
      <View style={styles.root}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: bottomPadding }}
          keyboardDismissMode="on-drag"
          refreshControl={
            <RefreshControl
              refreshing={knuter.isRefetching || packs.isRefetching}
              onRefresh={() => {
                void knuter.refetch()
                void packs.refetch()
              }}
              tintColor={colors.brand.primary}
            />
          }
        >
          <View style={styles.header}>
            <Text style={styles.heading}>Bibliotek</Text>
            <Text style={styles.muted}>
              Bla i ferdige knuter og legg dem til skolen din. Kopiene blir dine — rediger fritt.
            </Text>
          </View>

          {packs.data?.packs.map((pack) => (
            <PackCard
              key={pack.id}
              pack={pack}
              importing={importPack.isPending && importPack.variables === pack.id}
              result={packResult?.packId === pack.id ? packResult.res : null}
              onImport={() => importPack.mutate(pack.id)}
            />
          ))}

          <FolderPills selected={folder} onSelect={setFolder} />

          <View style={styles.searchWrap}>
            <TextInput
              style={styles.search}
              value={search}
              onChangeText={setSearch}
              placeholder="Søk i biblioteket…"
              placeholderTextColor={colors.text.muted}
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Søk i biblioteket"
              returnKeyType="search"
            />
          </View>

          {knuter.isLoading ? (
            <View style={styles.list}>
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} style={styles.skeletonRow} />
              ))}
            </View>
          ) : knuter.error ? (
            <View style={styles.center}>
              <Text style={styles.errorTitle}>Kunne ikke laste biblioteket</Text>
              <Text style={styles.muted}>{(knuter.error as Error).message}</Text>
              <Pressable
                style={styles.retryButton}
                onPress={() => void knuter.refetch()}
                accessibilityRole="button"
                accessibilityLabel="Prøv igjen"
              >
                <Text style={styles.retryText}>Prøv igjen</Text>
              </Pressable>
            </View>
          ) : (knuter.data?.knuter.length ?? 0) === 0 ? (
            <View style={styles.center}>
              <Text style={styles.muted}>Ingen knuter her. Prøv et annet filter eller søk.</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {knuter.data!.knuter.map((k) => (
                <LibKnuteRow
                  key={k.id}
                  knute={k}
                  importing={importKnute.isPending && importKnute.variables === k.id}
                  onImport={() => {
                    haptics.medium()
                    importKnute.mutate(k.id)
                  }}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </>
  )
}

function PackCard({
  pack,
  importing,
  result,
  onImport,
}: {
  pack: LibraryPack
  importing: boolean
  result: ImportPackResponse | null
  onImport: () => void
}) {
  return (
    <View style={styles.packCard}>
      <Text style={styles.packName}>{pack.name}</Text>
      {pack.description ? <Text style={styles.packDesc}>{pack.description}</Text> : null}
      <Text style={styles.packMeta}>{formatNumber(pack.knuteCount)} knuter</Text>
      {result ? (
        <Text style={styles.packResult}>
          ✓ La til {formatNumber(result.imported)} knuter
          {result.skipped > 0 ? ` (${formatNumber(result.skipped)} fantes alt)` : ''} i{' '}
          {formatNumber(result.folders.length)} mapper
        </Text>
      ) : (
        <View style={styles.packButton}>
          <Button
            label={`Importer alle (${formatNumber(pack.knuteCount)})`}
            onPress={onImport}
            loading={importing}
            fullWidth
            accessibilityHint="Legger alle knutene i pakka til skolen din, sortert i mapper."
          />
        </View>
      )}
    </View>
  )
}

function FolderPills({
  selected,
  onSelect,
}: {
  selected: string | null
  onSelect: (folder: string | null) => void
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.pills}
    >
      <Pill label="Alle" active={selected === null} onPress={() => onSelect(null)} />
      {FOLDERS.map((f) => (
        <Pill key={f} label={f} active={selected === f} onPress={() => onSelect(f)} />
      ))}
    </ScrollView>
  )
}

function Pill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      style={[styles.pill, active && styles.pillActive]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Filtrer på ${label}`}
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </Pressable>
  )
}

function LibKnuteRow({
  knute,
  importing,
  onImport,
}: {
  knute: LibraryKnute
  importing: boolean
  onImport: () => void
}) {
  const ageLabel = knute.minAge >= 18 ? '18+' : null
  return (
    <View style={styles.row}>
      <View style={styles.rowTextBlock}>
        <Text style={styles.rowTitle} numberOfLines={2}>
          {knute.title}
        </Text>
        <View style={styles.rowMeta}>
          <View style={styles.pointsBadge}>
            <Text style={styles.pointsText}>{formatNumber(knute.points)} p</Text>
          </View>
          <Text style={styles.folderTag}>{knute.suggestedFolder}</Text>
          {knute.evidenceType === 'text' ? <Text style={styles.flagTag}>Tekst</Text> : null}
          {ageLabel ? <Text style={[styles.flagTag, styles.ageTag]}>{ageLabel}</Text> : null}
        </View>
        {knute.description ? (
          <Text style={styles.rowDesc} numberOfLines={2}>
            {knute.description}
          </Text>
        ) : null}
      </View>
      {knute.imported ? (
        <View style={styles.addedBadge} accessibilityLabel={`${knute.title} er lagt til`}>
          <Text style={styles.addedText}>✓ Lagt til</Text>
        </View>
      ) : (
        <Pressable
          style={[styles.addButton, importing && styles.addButtonBusy]}
          onPress={onImport}
          disabled={importing}
          haptic="none"
          accessibilityRole="button"
          accessibilityLabel={`Legg ${knute.title} til skolen`}
          accessibilityHint="Kopierer knuten inn i skolens liste."
        >
          <Text style={styles.addText}>{importing ? 'Legger til…' : '+ Legg til'}</Text>
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.base, paddingTop: spacing.base, paddingBottom: spacing.sm },
  heading: {
    color: colors.text.primary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.xs,
  },
  muted: { color: colors.text.muted, fontSize: fontSize.sm, marginTop: spacing['2xs'] },
  packCard: {
    backgroundColor: colors.surface,
    borderWidth: borderWidth.medium,
    borderColor: colors.borderInk,
    borderRadius: radius.lg,
    padding: spacing.base,
    marginHorizontal: spacing.base,
    marginBottom: spacing.base,
    gap: spacing.xs,
  },
  packName: { color: colors.ink, fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  packDesc: { color: colors.text.secondary, fontSize: fontSize.sm },
  packMeta: { color: colors.text.muted, fontSize: fontSize.sm },
  packButton: { marginTop: spacing.sm },
  packResult: {
    marginTop: spacing.sm,
    color: colors.success,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  pills: { gap: spacing.sm, paddingHorizontal: spacing.base, paddingBottom: spacing.sm },
  pill: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: borderWidth.thin,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  pillActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  pillText: { color: colors.text.secondary, fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  pillTextActive: { color: colors.text.inverse, fontWeight: fontWeight.semibold },
  searchWrap: { paddingHorizontal: spacing.base, paddingBottom: spacing.sm },
  search: {
    minHeight: size.searchMinHeight,
    backgroundColor: colors.surface,
    borderWidth: borderWidth.thin,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.base,
    color: colors.text.primary,
    fontSize: fontSize.base,
  },
  list: { paddingHorizontal: spacing.base, gap: spacing.sm },
  skeletonRow: { height: size.controlHeightLg, borderRadius: radius.md },
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
  rowTextBlock: { flex: 1 },
  rowTitle: {
    color: colors.text.primary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.xs,
  },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  rowDesc: { color: colors.text.secondary, fontSize: fontSize.sm, marginTop: spacing.xs },
  pointsBadge: {
    backgroundColor: colors.brand.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing['2xs'],
    borderRadius: radius.sm,
  },
  pointsText: { color: colors.text.inverse, fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  folderTag: { color: colors.text.secondary, fontSize: fontSize.sm },
  flagTag: {
    color: colors.text.secondary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing['2xs'],
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  ageTag: { color: colors.text.inverse, backgroundColor: colors.warning },
  addButton: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.ink,
    minHeight: size.actionMinHeight,
    justifyContent: 'center',
  },
  addButtonBusy: { opacity: 0.6 },
  addText: { color: colors.text.inverse, fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  addedBadge: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.status.approvedBg,
  },
  addedText: { color: colors.success, fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    minHeight: size.emptyMinHeight,
  },
  errorTitle: {
    color: colors.error,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  retryButton: {
    marginTop: spacing.base,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.brand.primary,
    borderRadius: radius.md,
  },
  retryText: { color: colors.text.inverse, fontSize: fontSize.base, fontWeight: fontWeight.semibold },
})
