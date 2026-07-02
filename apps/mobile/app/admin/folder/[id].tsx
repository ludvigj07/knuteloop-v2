import { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { ConfirmSheet, Skeleton, StickerButton, StickerCard, Text, Toast, useToast } from '../../../components/primitives'
import { SchoolKnuteRow } from '../../../components/knute/SchoolKnuteRow'
import { AddOwnKnuterSheet } from '../../../components/folder/AddOwnKnuterSheet'
import {
  addKnuteToFolder,
  deleteFolder,
  fetchAllKnuter,
  fetchFolders,
  fetchKnuterByFolder,
  removeKnuteFromFolder,
  updateKnute,
} from '../../../lib/api'
import { formatNumber } from '../../../lib/format'
import { haptics } from '../../../lib/haptics'
import { sticker, spacing } from '../../../lib/theme'

// A folder is a WORKBENCH, not just a list ("alt skal kunne gjøres fra alt"):
// from here the knutesjef fills it from the library, from the school's own
// knuter, or by writing a new knute directly into it. The actions are always
// visible — an empty folder is an invitation, never a dead end.

export default function FolderViewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const folderId = id ?? ''
  const isAll = folderId === 'alle'
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const qc = useQueryClient()
  const toast = useToast()
  const [addOpen, setAddOpen] = useState(false)

  // Folder names are needed in BOTH views: the header title, and the
  // per-knute folder chips in the Alle-view (D4).
  const folders = useQuery({ queryKey: ['folders'], queryFn: fetchFolders })
  const knuter = useQuery({
    queryKey: isAll ? ['knuter', 'all'] : ['knuter', 'folder', folderId],
    queryFn: isAll ? fetchAllKnuter : () => fetchKnuterByFolder(folderId),
  })
  // Candidates for "Legg til egne knuter": every school knute minus the folder's.
  const allKnuter = useQuery({
    queryKey: ['knuter', 'all'],
    queryFn: fetchAllKnuter,
    enabled: !isAll,
  })

  const folderName = isAll
    ? 'Alle knuter'
    : (folders.data?.folders.find((f) => f.id === folderId)?.name ?? 'Mappe')

  const items = knuter.data?.knuter ?? []
  const inFolder = new Set(items.map((k) => k.id))
  const candidates = (allKnuter.data?.knuter ?? []).filter(
    (k) => k.isActive && !inFolder.has(k.id),
  )

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['knuter'] })
    void qc.invalidateQueries({ queryKey: ['folders'] })
  }

  const addMutation = useMutation({
    mutationFn: async (knuteIds: string[]) => {
      await Promise.all(knuteIds.map((knuteId) => addKnuteToFolder(folderId, knuteId)))
      return knuteIds.length
    },
    onSuccess: (count) => {
      haptics.success()
      invalidate()
      setAddOpen(false)
      toast.show(`La til ${formatNumber(count)} i «${folderName}» ✓`)
    },
    onError: (err) => toast.show((err as Error).message),
  })

  const removeMutation = useMutation({
    mutationFn: ({ knuteId }: { knuteId: string; title: string }) =>
      removeKnuteFromFolder(folderId, knuteId),
    onSuccess: (_res, { title }) => {
      haptics.success()
      invalidate()
      // Reassure: removing from a folder never deletes the knute (demo copy).
      toast.show(`«${title}» fjernet fra ${folderName} — ligger fortsatt i Alle`)
    },
    onError: (err) => toast.show((err as Error).message),
  })

  // Destructive confirms as ConfirmSheet — Alert.alert is a silent no-op on
  // RN-web, so the buttons looked dead in the browser.
  const [confirm, setConfirm] = useState<
    { kind: 'archive'; knuteId: string; title: string } | { kind: 'delete' } | null
  >(null)

  // «Fjern fra knuteboka» (the Alle-view X): archive — instantly gone from
  // the student catalog/search; submissions and history stay intact.
  const archiveMutation = useMutation({
    mutationFn: ({ knuteId }: { knuteId: string; title: string }) =>
      updateKnute(knuteId, { isActive: false }),
    onSuccess: (_res, { title }) => {
      haptics.success()
      invalidate()
      void qc.invalidateQueries({ queryKey: ['library'] })
      setConfirm(null)
      toast.show(`«${title}» fjernet fra knuteboka`)
    },
    onError: (err) => toast.show((err as Error).message),
  })

  const confirmArchive = (knuteId: string, title: string) =>
    setConfirm({ kind: 'archive', knuteId, title })

  const deleteMutation = useMutation({
    mutationFn: () => deleteFolder(folderId),
    onSuccess: () => {
      haptics.success()
      invalidate()
      setConfirm(null)
      router.back()
    },
    onError: (err) => toast.show((err as Error).message),
  })

  const confirmDelete = () => setConfirm({ kind: 'delete' })

  const screen = (
    <Stack.Screen
      options={{
        title: folderName,
        headerStyle: { backgroundColor: sticker.color.paper },
        headerTintColor: sticker.color.ink,
        headerShadowVisible: false,
      }}
    />
  )

  // The workbench actions live at the TOP (Ludvig's demo) — filling the folder
  // is the primary job, so it must never be a scroll away. Always rendered once
  // the folder has loaded, empty or not.
  const actions = (
    <View style={[styles.gutter, styles.actions]}>
      <StickerButton
        label="Legg til fra biblioteket"
        variant="accent"
        fullWidth
        onPress={() =>
          // From a folder the library opens in fill-this-folder mode: context
          // banner + the add-sheet pre-checks this folder (D2, Ludvig's demo).
          router.push(isAll ? '/admin/bibliotek' : `/admin/bibliotek?folderId=${folderId}`)
        }
      />
      {!isAll ? (
        <StickerButton
          label="Legg til egne knuter"
          variant="secondary"
          fullWidth
          onPress={() => setAddOpen(true)}
        />
      ) : null}
      <StickerButton
        label="Lag egen knute her"
        variant="secondary"
        fullWidth
        onPress={() =>
          router.push(isAll ? '/admin/edit/new' : `/admin/edit/new?folderId=${folderId}`)
        }
      />
    </View>
  )
  const deleteFooter = !isAll ? (
    <View style={[styles.gutter, styles.footer]}>
      <StickerButton label="Slett mappe" variant="ghost" fullWidth onPress={confirmDelete} />
    </View>
  ) : null
  const showActions = !knuter.isLoading && !knuter.isError

  return (
    <View style={styles.root}>
      {screen}
      <FlashList
        data={items}
        keyExtractor={(k) => k.id}
        estimatedItemSize={84}
        contentContainerStyle={{ paddingTop: spacing.base, paddingBottom: insets.bottom + spacing.xl }}
        ListHeaderComponent={showActions ? actions : null}
        ListEmptyComponent={
          <EmptyOrLoading
            isLoading={knuter.isLoading}
            isError={knuter.isError}
            error={knuter.error}
            isAll={isAll}
            onRetry={() => void knuter.refetch()}
          />
        }
        ListFooterComponent={showActions ? deleteFooter : null}
        renderItem={({ item }) => (
          <SchoolKnuteRow
            knute={item}
            inactive={!item.isActive}
            folderNames={
              isAll
                ? item.folderIds
                    .map((id) => folders.data?.folders.find((f) => f.id === id)?.name)
                    .filter((n): n is string => Boolean(n))
                : undefined
            }
            onPress={() => router.push(`/admin/edit/${item.id}`)}
            onRemove={
              isAll
                ? item.isActive
                  ? () => confirmArchive(item.id, item.title)
                  : undefined
                : () => removeMutation.mutate({ knuteId: item.id, title: item.title })
            }
            removeLabel={isAll ? `Fjern ${item.title} fra knuteboka` : undefined}
            removing={
              (removeMutation.isPending && removeMutation.variables?.knuteId === item.id) ||
              (archiveMutation.isPending && archiveMutation.variables?.knuteId === item.id)
            }
          />
        )}
      />

      <AddOwnKnuterSheet
        open={addOpen}
        folderName={folderName}
        candidates={candidates}
        adding={addMutation.isPending}
        onClose={() => setAddOpen(false)}
        onConfirm={(ids) => addMutation.mutate(ids)}
      />

      <ConfirmSheet
        open={confirm !== null}
        title={
          confirm?.kind === 'archive' ? `Fjerne «${confirm.title}»?` : `Slette «${folderName}»?`
        }
        message={
          confirm?.kind === 'archive'
            ? 'Knuten forsvinner fra elevenes katalog og søk. Innsendinger og historikk beholdes.'
            : 'Mappa forsvinner, men knutene blir liggende i skolens liste.'
        }
        confirmLabel={confirm?.kind === 'archive' ? 'Fjern fra knuteboka' : 'Slett mappe'}
        confirming={archiveMutation.isPending || deleteMutation.isPending}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm?.kind === 'archive')
            archiveMutation.mutate({ knuteId: confirm.knuteId, title: confirm.title })
          else if (confirm?.kind === 'delete') deleteMutation.mutate()
        }}
      />

      <Toast message={toast.message} bottomOffset={insets.bottom + spacing.lg} />
    </View>
  )
}

function EmptyOrLoading({
  isLoading,
  isError,
  error,
  isAll,
  onRetry,
}: {
  isLoading: boolean
  isError: boolean
  error: unknown
  isAll: boolean
  onRetry: () => void
}) {
  if (isLoading) {
    return (
      <View style={[styles.gutter, styles.loadingList]}>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} style={styles.skeletonRow} />
        ))}
      </View>
    )
  }
  if (isError) {
    return (
      <View style={styles.gutter}>
        <StickerCard tone="surface" style={styles.errorCard}>
          <Text font="display" weight="bold" size="lg" color={sticker.color.ink}>
            Kunne ikke laste
          </Text>
          <Text color={sticker.color.textMuted}>{(error as Error).message}</Text>
          <StickerButton label="Prøv igjen" variant="secondary" size="sm" onPress={onRetry} />
        </StickerCard>
      </View>
    )
  }
  return (
    <View style={styles.gutter}>
      <StickerCard tone="soft" shadow="sm">
        <Text color={sticker.color.textMuted}>
          {isAll
            ? 'Ingen knuter ennå. Fyll boka fra biblioteket, eller lag en egen.'
            : 'Tom mappe — fyll den! Hent fra biblioteket, plukk blant egne knuter, eller skriv en ny rett inn her.'}
        </Text>
      </StickerCard>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: sticker.color.paper },
  gutter: { paddingHorizontal: spacing.base },
  actions: { marginBottom: spacing.base, gap: spacing.sm },
  footer: { marginTop: spacing.lg },
  loadingList: { gap: spacing.sm },
  skeletonRow: { height: 76, borderRadius: sticker.radius.md, marginBottom: spacing.sm },
  errorCard: { gap: spacing.sm, alignItems: 'flex-start' },
})
