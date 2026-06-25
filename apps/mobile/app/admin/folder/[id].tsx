import { useState } from 'react'
import { View, ScrollView, StyleSheet, Alert, RefreshControl } from 'react-native'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { Button, Pressable, Skeleton, Text } from '../../../components/primitives'
import { AddKnutePickerSheet, AdminKnuteRow } from '../../../components/library/folderUi'
import {
  addKnuteToFolder,
  deleteFolder,
  fetchAllKnuter,
  fetchKnuterByFolder,
  removeKnuteFromFolder,
} from '../../../lib/api'
import { formatNumber } from '../../../lib/format'
import { haptics } from '../../../lib/haptics'
import { colors, fontSize, fontWeight, radius, size, spacing } from '../../../lib/theme'

export default function FolderScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>()
  const folderName = name ?? 'Mappe'
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const qc = useQueryClient()
  const [pickerOpen, setPickerOpen] = useState(false)

  const folderKnuter = useQuery({
    queryKey: ['knuter', 'folder', id],
    queryFn: () => fetchKnuterByFolder(id),
    enabled: !!id,
  })
  // Loaded only while the picker is open — the pool of school knuter to add.
  const allKnuter = useQuery({
    queryKey: ['knuter', 'all'],
    queryFn: fetchAllKnuter,
    enabled: pickerOpen,
  })

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['knuter', 'folder', id] })
    void qc.invalidateQueries({ queryKey: ['folders'] })
  }

  const add = useMutation({
    mutationFn: (knuteId: string) => addKnuteToFolder(id, knuteId),
    onSuccess: () => {
      haptics.success()
      invalidate()
    },
    onError: (err) => Alert.alert('Kunne ikke legge til', (err as Error).message),
  })
  const remove = useMutation({
    mutationFn: (knuteId: string) => removeKnuteFromFolder(id, knuteId),
    onSuccess: () => {
      haptics.medium()
      invalidate()
    },
    onError: (err) => Alert.alert('Kunne ikke fjerne', (err as Error).message),
  })
  const del = useMutation({
    mutationFn: () => deleteFolder(id),
    onSuccess: () => {
      haptics.success()
      void qc.invalidateQueries({ queryKey: ['folders'] })
      router.back()
    },
    onError: (err) => Alert.alert('Kunne ikke slette mappa', (err as Error).message),
  })

  const inFolder = folderKnuter.data?.knuter ?? []
  const inFolderIds = new Set(inFolder.map((k) => k.id))
  const candidates = (allKnuter.data?.knuter ?? []).filter((k) => !inFolderIds.has(k.id))

  const confirmDelete = () => {
    Alert.alert(
      'Slette mappa?',
      `«${folderName}» slettes. Knutene blir liggende i skolen — bare mappa forsvinner.`,
      [
        { text: 'Avbryt', style: 'cancel' },
        { text: 'Slett', style: 'destructive', onPress: () => del.mutate() },
      ],
    )
  }

  const bottomPadding = insets.bottom + spacing.xl

  return (
    <>
      <Stack.Screen options={{ title: folderName }} />
      <View style={styles.root}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: bottomPadding }}
          refreshControl={
            <RefreshControl
              refreshing={folderKnuter.isRefetching}
              onRefresh={() => void folderKnuter.refetch()}
              tintColor={colors.brand.primary}
            />
          }
        >
          <View style={styles.header}>
            <Text style={styles.heading}>{folderName}</Text>
            <Text style={styles.muted}>
              {folderKnuter.isLoading
                ? 'Laster…'
                : inFolder.length === 1
                  ? '1 knute'
                  : `${formatNumber(inFolder.length)} knuter`}
            </Text>
          </View>

          {folderKnuter.isLoading ? (
            <View style={styles.list}>
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} style={styles.skeletonRow} />
              ))}
            </View>
          ) : folderKnuter.error ? (
            <View style={styles.center}>
              <Text style={styles.errorTitle}>Kunne ikke laste mappa</Text>
              <Text style={styles.muted}>{(folderKnuter.error as Error).message}</Text>
              <Pressable
                style={styles.retryButton}
                onPress={() => void folderKnuter.refetch()}
                accessibilityRole="button"
                accessibilityLabel="Prøv igjen"
              >
                <Text style={styles.retryText}>Prøv igjen</Text>
              </Pressable>
            </View>
          ) : inFolder.length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.muted}>Tom mappe. Legg til knuter under.</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {inFolder.map((k) => (
                <AdminKnuteRow
                  key={k.id}
                  knute={k}
                  action="remove"
                  busy={remove.isPending && remove.variables === k.id}
                  onAction={() => remove.mutate(k.id)}
                />
              ))}
            </View>
          )}

          <View style={styles.actions}>
            <Button
              label="Legg til knute"
              onPress={() => setPickerOpen(true)}
              variant="secondary"
              fullWidth
              accessibilityHint="Velg en av skolens knuter å legge i mappa."
            />
            <Button
              label="Importer fra biblioteket"
              onPress={() => router.push('/admin/bibliotek')}
              variant="ghost"
              fullWidth
              accessibilityHint="Åpner biblioteket for å importere ferdige knuter."
            />
            <Button
              label="Slett mappe"
              onPress={confirmDelete}
              variant="destructive"
              loading={del.isPending}
              fullWidth
              accessibilityHint="Sletter mappa. Knutene blir liggende i skolen."
            />
          </View>
        </ScrollView>
      </View>

      <AddKnutePickerSheet
        visible={pickerOpen}
        candidates={candidates}
        loading={allKnuter.isLoading}
        addingId={add.isPending ? (add.variables ?? null) : null}
        onAdd={(knuteId) => add.mutate(knuteId)}
        onClose={() => setPickerOpen(false)}
      />
    </>
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
  list: { paddingHorizontal: spacing.base, gap: spacing.sm },
  skeletonRow: { height: size.controlHeightLg, borderRadius: radius.md },
  actions: { paddingHorizontal: spacing.base, paddingTop: spacing.lg, gap: spacing.sm },
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
