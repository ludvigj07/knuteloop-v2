import { useState } from 'react'
import { View, ScrollView, StyleSheet, TextInput, Alert, RefreshControl } from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Stack } from 'expo-router'
import { Button, Pressable, Sheet, Skeleton, Text } from '../../components/primitives'
import { LibraryKnuteRow } from '../../components/library/LibraryKnuteRow'
import { KnuteDetailSheet } from '../../components/library/KnuteDetailSheet'
import { isSensitive } from '../../components/library/libraryMeta'
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
  // Sheets are keyed by id (not the object) so they track the freshest data after
  // an import flips `imported` — the open sheet then reflects "Lagt til".
  const [detailKnuteId, setDetailKnuteId] = useState<string | null>(null)
  const [confirmKnuteId, setConfirmKnuteId] = useState<string | null>(null)

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

  const list = knuter.data?.knuter ?? []
  const detailKnute = detailKnuteId ? (list.find((k) => k.id === detailKnuteId) ?? null) : null
  const confirmKnute = confirmKnuteId ? (list.find((k) => k.id === confirmKnuteId) ?? null) : null
  const isImporting = (id: string) => importKnute.isPending && importKnute.variables === id

  // The one gate every import goes through. Sensitive (18+) knuter pop a confirm
  // first (ADR-0015); everything else imports straight away.
  const requestImport = (k: LibraryKnute) => {
    if (k.imported) return
    if (isSensitive(k)) {
      setDetailKnuteId(null)
      setConfirmKnuteId(k.id)
      void haptics.warning()
      return
    }
    void haptics.medium()
    importKnute.mutate(k.id)
  }

  const confirmSensitive = () => {
    if (!confirmKnute) return
    void haptics.medium()
    importKnute.mutate(confirmKnute.id, { onSuccess: () => setConfirmKnuteId(null) })
  }

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
          ) : list.length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.muted}>Ingen knuter her. Prøv et annet filter eller søk.</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {list.map((k) => (
                <LibraryKnuteRow
                  key={k.id}
                  knute={k}
                  importing={isImporting(k.id)}
                  onOpen={() => setDetailKnuteId(k.id)}
                  onImport={() => requestImport(k)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </View>

      <KnuteDetailSheet
        knute={detailKnute}
        importing={detailKnute ? isImporting(detailKnute.id) : false}
        onClose={() => setDetailKnuteId(null)}
        onImport={() => detailKnute && requestImport(detailKnute)}
      />

      <SensitiveImportSheet
        knute={confirmKnute}
        importing={confirmKnute ? isImporting(confirmKnute.id) : false}
        onCancel={() => setConfirmKnuteId(null)}
        onConfirm={confirmSensitive}
      />
    </>
  )
}

function SensitiveImportSheet({
  knute,
  importing,
  onCancel,
  onConfirm,
}: {
  knute: LibraryKnute | null
  importing: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <Sheet visible={knute !== null} onClose={onCancel} accessibilityLabel="Bekreft sensitiv knute">
      {knute ? (
        <View>
          <Text size="xl" weight="bold" accessibilityRole="header">
            Sensitiv knute
          </Text>
          <Text size="base" color="secondary" style={styles.confirmBody}>
            «{knute.title}» er en 18+-knute i {knute.suggestedFolder}-temaet
            {knute.evidenceType === 'text' ? ' (kun tekst-bevis)' : ''}. Legg den til i skolens
            liste?
          </Text>
          <View style={styles.confirmRow}>
            <View style={styles.confirmBtn}>
              <Button label="Avbryt" variant="ghost" onPress={onCancel} fullWidth />
            </View>
            <View style={styles.confirmBtn}>
              <Button
                label="Legg til"
                variant="secondary"
                onPress={onConfirm}
                loading={importing}
                fullWidth
              />
            </View>
          </View>
        </View>
      ) : null}
    </Sheet>
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
  confirmBody: { marginTop: spacing.sm, lineHeight: fontSize.base * 1.5 },
  confirmRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  confirmBtn: { flex: 1 },
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
