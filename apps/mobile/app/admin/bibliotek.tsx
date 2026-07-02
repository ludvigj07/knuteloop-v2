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
import { Stack } from 'expo-router'
import {
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
import { AddToFolderSheet } from '../../components/library/AddToFolderSheet'
import {
  fetchLibraryKnuter,
  fetchLibraryPacks,
  importLibraryKnute,
  importLibraryPack,
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

  const [folder, setFolder] = useState<string | null>(null)
  const [region, setRegion] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<LibraryKnute | null>(null)
  // The knute whose "Legg til i …" folder picker is open (null = closed).
  const [addTarget, setAddTarget] = useState<LibraryKnute | null>(null)

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
    mutationFn: ({ id, folderIds }: { id: string; folderIds: string[] }) =>
      importLibraryKnute(id, folderIds),
    onSuccess: (_res, { id }) => {
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
      toast.show('Lagt til i knuteboka ✓')
    },
    onError: (err) => toast.show((err as Error).message),
  })

  const importPack = useMutation({
    mutationFn: importLibraryPack,
    onSuccess: (res) => {
      haptics.success()
      invalidateAfterImport()
      toast.show(
        res.imported > 0
          ? `La til ${formatNumber(res.imported)} knuter ✓`
          : 'Alt i pakka er allerede lagt til',
      )
    },
    onError: (err) => toast.show((err as Error).message),
  })

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
        <PackHero
          key={pack.id}
          pack={pack}
          importing={importPack.isPending && importPack.variables === pack.id}
          onImport={() => importPack.mutate(pack.id)}
        />
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
        confirming={importKnute.isPending}
        onClose={() => setAddTarget(null)}
        onConfirm={(k, folderIds) => importKnute.mutate({ id: k.id, folderIds })}
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
  gutter: { paddingHorizontal: spacing.base },
  packBlock: { paddingTop: spacing.xs },
  listTopSpacer: { height: spacing.xs },
  skeletonList: { gap: spacing.sm },
  skeletonRow: { height: 88, borderRadius: sticker.radius.md, marginBottom: spacing.sm },
  errorCard: { gap: spacing.sm, alignItems: 'flex-start' },
})
