import { useState } from 'react'
import { RefreshControl, StyleSheet, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Stack } from 'expo-router'
import {
  Eyebrow,
  Skeleton,
  StickerButton,
  StickerCard,
  Text,
  Toast,
  useToast,
} from '../../components/primitives'
import { FilterBar } from '../../components/library/FilterBar'
import { PackHero } from '../../components/library/PackHero'
import { LibraryRow } from '../../components/library/LibraryRow'
import { KnuteDetailSheet } from '../../components/library/KnuteDetailSheet'
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
import { isSensitiveFolder } from '../../lib/knute-ui'
import { sticker, spacing } from '../../lib/theme'

const PAGE = 30

export default function BibliotekScreen() {
  const insets = useSafeAreaInsets()
  const qc = useQueryClient()
  const toast = useToast()

  const [folder, setFolder] = useState<string | null>(null)
  const [region, setRegion] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<LibraryKnute | null>(null)

  const q = search.trim()
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
  })

  const items = knuter.data?.pages.flatMap((p) => p.knuter) ?? []

  const invalidateAfterImport = () => {
    void qc.invalidateQueries({ queryKey: ['library'] })
    void qc.invalidateQueries({ queryKey: ['knuter'] })
    void qc.invalidateQueries({ queryKey: ['folders'] })
  }

  const importKnute = useMutation({
    mutationFn: importLibraryKnute,
    onSuccess: (_res, libId) => {
      haptics.success()
      // Optimistically flip the row to "added" so it can't be tapped again
      // (kills the double-tap → spurious 409 window), then reconcile.
      qc.setQueryData<InfiniteData<LibraryKnuterResponse>>(knuterKey, (old) =>
        old
          ? {
              ...old,
              pages: old.pages.map((p) => ({
                ...p,
                knuter: p.knuter.map((k) => (k.id === libId ? { ...k, imported: true } : k)),
              })),
            }
          : old,
      )
      invalidateAfterImport()
      setSelected(null)
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
    // Sensitive knuter open the detail sheet first (context before adding).
    if (isSensitiveFolder(k.suggestedFolder)) {
      setSelected(k)
      return
    }
    importKnute.mutate(k.id)
  }

  const showPacks = q === '' && folder === null && region === null
  const header = (
    <View>
      <View style={styles.headerBlock}>
        <Eyebrow>Knutebibliotek</Eyebrow>
        <Text font="display" weight="bold" size="3xl" color={sticker.color.ink}>
          Biblioteket
        </Text>
        <Text color={sticker.color.textMuted}>
          Bla i ferdige knuter og legg dem til skolen. Kopiene blir dine — rediger fritt.
        </Text>
      </View>

      {showPacks
        ? packs.data?.packs.map((pack) => (
            <PackHero
              key={pack.id}
              pack={pack}
              importing={importPack.isPending && importPack.variables === pack.id}
              onImport={() => importPack.mutate(pack.id)}
            />
          ))
        : null}

      <FilterBar
        folder={folder}
        onFolder={setFolder}
        region={region}
        onRegion={setRegion}
        search={search}
        onSearch={setSearch}
      />
    </View>
  )

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Bibliotek',
          headerStyle: { backgroundColor: sticker.color.paper },
          headerTintColor: sticker.color.ink,
          headerShadowVisible: false,
        }}
      />
      <View style={styles.root}>
        <FlashList
          data={items}
          keyExtractor={(k) => k.id}
          estimatedItemSize={88}
          keyboardDismissMode="on-drag"
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
          ListHeaderComponent={header}
          renderItem={({ item }) => (
            <LibraryRow
              knute={item}
              importing={importKnute.isPending && importKnute.variables === item.id}
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
      </View>

      <KnuteDetailSheet
        knute={selected}
        importing={importKnute.isPending && importKnute.variables === selected?.id}
        onClose={() => setSelected(null)}
        onImport={(k) => importKnute.mutate(k.id)}
      />

      <Toast message={toast.message} bottomOffset={insets.bottom + spacing.lg} />
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
  gutter: { paddingHorizontal: spacing.base },
  headerBlock: { paddingHorizontal: spacing.base, paddingTop: spacing.base, paddingBottom: spacing.base, gap: spacing['2xs'] },
  skeletonList: { gap: spacing.sm },
  skeletonRow: { height: 76, borderRadius: sticker.radius.md, marginBottom: spacing.sm },
  errorCard: { gap: spacing.sm, alignItems: 'flex-start' },
})
