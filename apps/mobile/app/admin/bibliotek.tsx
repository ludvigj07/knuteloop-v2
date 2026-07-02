import { useEffect, useState } from 'react'
import { RefreshControl, StyleSheet, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { X } from 'lucide-react-native'
import {
  ConfirmSheet,
  Pressable,
  Skeleton,
  StickerButton,
  StickerCard,
  Text,
  Toast,
  useToast,
} from '../../components/primitives'
import { KnutesjefTabBar } from '../../components/KnutesjefTabBar'
import { FilterBar } from '../../components/library/FilterBar'
import { PackHero } from '../../components/library/PackHero'
import { LibraryCatalogRow } from '../../components/library/LibraryCatalogRow'
import { KnuteDetailSheet } from '../../components/library/KnuteDetailSheet'
import { PackSheet } from '../../components/library/PackSheet'
import {
  AddToFolderSheet,
  type AddToFolderPayload,
} from '../../components/library/AddToFolderSheet'
import {
  addKnuteToFolder,
  createFolder,
  fetchAllKnuter,
  fetchFolders,
  fetchLibraryKnuter,
  fetchLibraryPacks,
  importLibraryKnute,
  importLibraryPack,
  removeKnuteFromFolder,
  updateKnute,
  type LibraryKnute,
  type LibraryKnuterResponse,
} from '../../lib/api'
import { formatNumber } from '../../lib/format'
import { haptics } from '../../lib/haptics'
import { size, sticker, spacing } from '../../lib/theme'

const PAGE = 30

// The knutesjef's browse-and-import surface ("Spotify for knuter"). Layout:
// search + folder chips stay PINNED (fast triage while scrolling 500 knuter);
// the pack promo scrolls with the list; the knuter render as one dense,
// continuous catalog panel (LibraryCatalogRow) — not a stack of cards.
export default function BibliotekScreen() {
  const insets = useSafeAreaInsets()
  const qc = useQueryClient()
  const toast = useToast()
  const router = useRouter()
  // Fill-this-folder mode (D2): arriving from a folder puts its id here — a
  // pinned banner shows the context and the add-sheet pre-checks the folder.
  const { folderId: ctxFolderId } = useLocalSearchParams<{ folderId?: string }>()
  const foldersQuery = useQuery({ queryKey: ['folders'], queryFn: fetchFolders })
  const ctxFolder = ctxFolderId
    ? (foldersQuery.data?.folders.find((f) => f.id === ctxFolderId) ?? null)
    : null

  const [folder, setFolder] = useState<string | null>(null)
  const [region, setRegion] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<LibraryKnute | null>(null)
  // The knute whose "Legg til i …" folder picker is open (null = closed).
  const [addTarget, setAddTarget] = useState<LibraryKnute | null>(null)
  // The ✓-flow: manage the already-imported COPY (folders + text).
  const [manageTarget, setManageTarget] = useState<LibraryKnute | null>(null)
  // The school's own knuter — resolves the copy behind a ✓ (folderIds + current text).
  const schoolKnuter = useQuery({ queryKey: ['knuter', 'all'], queryFn: fetchAllKnuter })
  const manageCopy = manageTarget?.importedKnuteId
    ? (schoolKnuter.data?.knuter.find((k) => k.id === manageTarget.importedKnuteId) ?? null)
    : null

  // Debounce the term that drives the query key so each keystroke doesn't spawn a
  // new request + cache entry. The TextInput stays controlled by `search`.
  const [debouncedQ, setDebouncedQ] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  const q = debouncedQ
  const knuterKey = ['library', 'knuter', folder, region, q] as const

  const packs = useQuery({ queryKey: ['library', 'packs'], queryFn: fetchLibraryPacks })

  const knuter = useInfiniteQuery({
    queryKey: knuterKey,
    queryFn: ({ pageParam }) =>
      fetchLibraryKnuter({
        folder: folder ?? undefined,
        region: region ?? undefined,
        q: q || undefined,
        limit: PAGE,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((n, p) => n + p.knuter.length, 0)
      return lastPage.knuter.length < PAGE ? undefined : loaded
    },
    // Keep showing the previous results while a new folder/region/search loads,
    // so the list doesn't flash to skeletons on every filter change.
    placeholderData: keepPreviousData,
  })

  const items = knuter.data?.pages.flatMap((p) => p.knuter) ?? []

  const invalidateAfterImport = () => {
    void qc.invalidateQueries({ queryKey: ['library'] })
    void qc.invalidateQueries({ queryKey: ['knuter'] })
    void qc.invalidateQueries({ queryKey: ['folders'] })
  }

  const importKnute = useMutation({
    // The whole add-flow in one mutation: create the suggested theme folder if
    // the sheet asked for it, import the copy into the chosen folders, then save
    // any inline edits onto the copy (the library stays untouched — ADR-0014).
    mutationFn: async ({ id, payload }: { id: string; payload: AddToFolderPayload }) => {
      const folderIds = [...payload.folderIds]
      if (payload.newFolderName) {
        const created = await createFolder(payload.newFolderName, 'folder')
        folderIds.push(created.folder.id)
      }
      const res = await importLibraryKnute(id, folderIds)
      if (payload.overrides) await updateKnute(res.knuteId, payload.overrides)
      return res
    },
    onSuccess: (_res, { id, payload }) => {
      haptics.success()
      // Optimistically flip the row to "added" so the "+" turns into a check, then reconcile.
      qc.setQueryData<InfiniteData<LibraryKnuterResponse>>(knuterKey, (old) =>
        old
          ? {
              ...old,
              pages: old.pages.map((p) => ({
                ...p,
                knuter: p.knuter.map((k) => (k.id === id ? { ...k, imported: true } : k)),
              })),
            }
          : old,
      )
      invalidateAfterImport()
      setAddTarget(null)
      const names = payload.folderNames.join(', ')
      toast.show(
        `Lagt til i ${names}${payload.overrides ? ' (redigert)' : ''} ✓`,
      )
    },
    onError: (err) => toast.show((err as Error).message),
  })

  // Which pack's contents-sheet is open (see-before-you-add).
  const [packOpenId, setPackOpenId] = useState<string | null>(null)

  const importPack = useMutation({
    mutationFn: importLibraryPack,
    onSuccess: (res) => {
      haptics.success()
      invalidateAfterImport()
      void qc.invalidateQueries({ queryKey: ['library', 'pack'] })
      setPackOpenId(null)
      toast.show(
        res.imported > 0
          ? `La til ${formatNumber(res.imported)} knuter ✓`
          : 'Alt i pakka er allerede lagt til',
      )
    },
    onError: (err) => toast.show((err as Error).message),
  })

  // The ✓-flow: change folders / edit text on the school's existing copy.
  const manageKnute = useMutation({
    mutationFn: async ({
      copyId,
      currentFolderIds,
      payload,
    }: {
      copyId: string
      currentFolderIds: string[]
      payload: AddToFolderPayload
    }) => {
      const wanted = [...payload.folderIds]
      if (payload.newFolderName) {
        const created = await createFolder(payload.newFolderName, 'folder')
        wanted.push(created.folder.id)
      }
      const toAdd = wanted.filter((id) => !currentFolderIds.includes(id))
      const toRemove = currentFolderIds.filter((id) => !wanted.includes(id))
      await Promise.all([
        ...toAdd.map((folderId) => addKnuteToFolder(folderId, copyId)),
        ...toRemove.map((folderId) => removeKnuteFromFolder(folderId, copyId)),
      ])
      if (payload.overrides) await updateKnute(copyId, payload.overrides)
    },
    onSuccess: () => {
      haptics.success()
      invalidateAfterImport()
      setManageTarget(null)
      toast.show('Kopien er oppdatert ✓')
    },
    onError: (err) => toast.show((err as Error).message),
  })

  // «Fjern fra knuteboka» (manage-sheet): archive the copy — gone from the
  // student catalog instantly, submissions/history intact. The library row
  // flips back to + (imported = active copy only), and + revives the copy.
  // Confirmed via ConfirmSheet, NOT Alert.alert — RN-web no-ops multi-button
  // alerts, which made this a dead button in the browser.
  const [removeConfirm, setRemoveConfirm] = useState<{ copyId: string; title: string } | null>(null)

  const removeCopy = useMutation({
    mutationFn: (copyId: string) => updateKnute(copyId, { isActive: false }),
    onSuccess: () => {
      haptics.success()
      invalidateAfterImport()
      setRemoveConfirm(null)
      toast.show('Fjernet fra knuteboka — elevene ser den ikke lenger')
    },
    onError: (err) => toast.show((err as Error).message),
  })

  const confirmRemoveCopy = () => {
    if (!manageCopy) return
    // Close the manage-sheet first — sequential sheets, no modal stacking.
    setManageTarget(null)
    setRemoveConfirm({ copyId: manageCopy.id, title: manageCopy.title })
  }

  const onAddRow = (k: LibraryKnute) => {
    // The "+" opens the "Legg til i …" folder picker ("add to playlist"). Sensitivity
    // is signalled inline (amber tint + 18+/Tekst badges) and again in the picker;
    // tapping the row body still opens the detail sheet with the full context.
    setAddTarget(k)
  }

  const showPacks = q === '' && folder === null && region === null
  const listHeader = showPacks ? (
    <View style={styles.packBlock}>
      {packs.data?.packs.map((pack) => (
        <PackHero key={pack.id} pack={pack} onOpen={() => setPackOpenId(pack.id)} />
      ))}
    </View>
  ) : (
    <View style={styles.listTopSpacer} />
  )

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Biblioteket',
          headerStyle: { backgroundColor: sticker.color.paper },
          headerTintColor: sticker.color.ink,
          headerShadowVisible: false,
        }}
      />
      <View style={styles.root}>
        <View style={styles.pinned}>
          {ctxFolder ? (
            <View style={styles.ctxBanner}>
              <Text size="sm" weight="semibold" color={sticker.color.primary} style={styles.ctxText}>
                Velger knuter til: <Text weight="bold" color={sticker.color.primary}>{ctxFolder.name}</Text>
              </Text>
              <Pressable
                onPress={() => router.back()}
                haptic="light"
                accessibilityRole="button"
                accessibilityLabel="Ferdig — tilbake til mappa"
                hitSlop={8}
                style={styles.ctxClose}
              >
                <X size={sticker.icon.sm} color={sticker.color.primary} strokeWidth={2.5} />
              </Pressable>
            </View>
          ) : null}
          <FilterBar
            folder={folder}
            onFolder={setFolder}
            region={region}
            onRegion={setRegion}
            search={search}
            onSearch={setSearch}
          />
        </View>

        <FlashList
          data={items}
          keyExtractor={(k) => k.id}
          estimatedItemSize={96}
          keyboardDismissMode="on-drag"
          contentContainerStyle={{
            paddingBottom: insets.bottom + size.bottomNavMinHeight + spacing.xl,
          }}
          ListHeaderComponent={listHeader}
          extraData={`${items.length}:${importKnute.isPending ? (importKnute.variables?.id ?? '') : ''}`}
          renderItem={({ item, index }) => (
            <LibraryCatalogRow
              knute={item}
              importing={importKnute.isPending && importKnute.variables?.id === item.id}
              isFirst={index === 0}
              isLast={index === items.length - 1}
              onOpen={() => setSelected(item)}
              onAdd={() => onAddRow(item)}
              onManage={() => setManageTarget(item)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              isLoading={knuter.isLoading}
              isError={knuter.isError}
              error={knuter.error}
              onRetry={() => void knuter.refetch()}
            />
          }
          ListFooterComponent={
            knuter.isFetchingNextPage ? (
              <View style={styles.gutter}>
                <Skeleton style={styles.skeletonRow} />
              </View>
            ) : null
          }
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (knuter.hasNextPage && !knuter.isFetchingNextPage) void knuter.fetchNextPage()
          }}
          refreshControl={
            <RefreshControl
              refreshing={knuter.isRefetching || packs.isRefetching}
              onRefresh={() => {
                void knuter.refetch()
                void packs.refetch()
              }}
              tintColor={sticker.color.primary}
            />
          }
        />
        <KnutesjefTabBar active="bibliotek" />
      </View>

      <KnuteDetailSheet
        knute={selected}
        importing={false}
        onClose={() => setSelected(null)}
        onImport={(k) => {
          // Hand off to the folder picker (close the detail sheet first so only one
          // sheet is mounted at a time).
          setSelected(null)
          setAddTarget(k)
        }}
      />

      <AddToFolderSheet
        knute={addTarget}
        contextFolderId={ctxFolder?.id ?? null}
        confirming={importKnute.isPending}
        onClose={() => setAddTarget(null)}
        onConfirm={(k, payload) => importKnute.mutate({ id: k.id, payload })}
      />

      <PackSheet
        packId={packOpenId}
        importing={importPack.isPending}
        onClose={() => setPackOpenId(null)}
        onImport={(id) => importPack.mutate(id)}
      />

      <AddToFolderSheet
        knute={manageCopy ? manageTarget : null}
        mode="manage"
        copy={manageCopy}
        initialFolderIds={manageCopy?.folderIds ?? []}
        confirming={manageKnute.isPending}
        onRemove={confirmRemoveCopy}
        onClose={() => setManageTarget(null)}
        onConfirm={(_k, payload) => {
          if (!manageCopy) return
          manageKnute.mutate({
            copyId: manageCopy.id,
            currentFolderIds: manageCopy.folderIds,
            payload,
          })
        }}
      />

      <ConfirmSheet
        open={removeConfirm !== null}
        title={`Fjerne «${removeConfirm?.title ?? ''}»?`}
        message="Knuten forsvinner fra elevenes katalog og søk. Innsendinger og historikk beholdes, og du kan hente den inn igjen fra biblioteket."
        confirmLabel="Fjern fra knuteboka"
        confirming={removeCopy.isPending}
        onCancel={() => setRemoveConfirm(null)}
        onConfirm={() => {
          if (removeConfirm) removeCopy.mutate(removeConfirm.copyId)
        }}
      />

      <Toast
        message={toast.message}
        bottomOffset={insets.bottom + size.bottomNavMinHeight + spacing.lg}
      />
    </>
  )
}

function EmptyState({
  isLoading,
  isError,
  error,
  onRetry,
}: {
  isLoading: boolean
  isError: boolean
  error: unknown
  onRetry: () => void
}) {
  if (isLoading) {
    return (
      <View style={[styles.gutter, styles.skeletonList]}>
        {[0, 1, 2, 3, 4].map((i) => (
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
            Kunne ikke laste biblioteket
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
        <Text color={sticker.color.textMuted}>Ingen treff. Prøv et annet filter eller søk.</Text>
      </StickerCard>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: sticker.color.paper },
  pinned: { paddingTop: spacing.sm },
  ctxBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.base,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: sticker.radius.md,
    borderWidth: sticker.borderWidth,
    borderColor: sticker.color.primary,
    backgroundColor: sticker.color.primaryBg,
  },
  ctxText: { flex: 1 },
  ctxClose: {
    width: size.actionMinHeight,
    height: size.actionMinHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gutter: { paddingHorizontal: spacing.base },
  packBlock: { paddingTop: spacing.xs },
  listTopSpacer: { height: spacing.xs },
  skeletonList: { gap: spacing.sm },
  skeletonRow: { height: 88, borderRadius: sticker.radius.md, marginBottom: spacing.sm },
  errorCard: { gap: spacing.sm, alignItems: 'flex-start' },
})
