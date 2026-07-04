import { FlatList, RefreshControl, StyleSheet, View } from 'react-native'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Stack } from 'expo-router'
import { KnutesjefTabBar } from '../components/KnutesjefTabBar'
import { PendingCard } from '../components/review/PendingCard'
import {
  KnoteIcon,
  Skeleton,
  StickerButton,
  StickerCard,
  Text,
  Toast,
  useToast,
} from '../components/primitives'
import {
  ApiError,
  approveSubmission,
  fetchPendingSubmissions,
  rejectSubmission,
  tryFetchPendingCount,
  type PendingResponse,
  type PendingSubmission,
} from '../lib/api'
import { haptics } from '../lib/haptics'
import { size, spacing, sticker } from '../lib/theme'

const SCREEN_OPTIONS = {
  title: 'Til godkjenning',
  headerStyle: { backgroundColor: sticker.color.paper },
  headerTintColor: sticker.color.ink,
  headerShadowVisible: false,
} as const

// Approve/reject shifts the page boundaries between the sequential page
// refetches, so an item can transiently appear in two loaded pages. Duplicate
// FlatList keys break the list — dedupe by id, first occurrence wins.
function dedupeById(pages: PendingResponse[] | undefined): PendingSubmission[] {
  const seen = new Set<string>()
  const out: PendingSubmission[] = []
  for (const page of pages ?? []) {
    for (const s of page.submissions) {
      if (!seen.has(s.id)) {
        seen.add(s.id)
        out.push(s)
      }
    }
  }
  return out
}

export default function ReviewScreen() {
  const insets = useSafeAreaInsets()
  const qc = useQueryClient()
  const toast = useToast()

  const {
    data,
    error,
    isLoading,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['submissions', 'pending'],
    queryFn: ({ pageParam }) => fetchPendingSubmissions(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })

  // Header total. The queue itself is paginated, so «X venter» comes from the
  // count endpoint (same cache entry as the tab-bar badge — no extra request);
  // until it lands, the loaded count is a fine stand-in.
  const countQuery = useQuery({
    queryKey: ['submissions', 'pending', 'count'],
    queryFn: tryFetchPendingCount,
    staleTime: 30_000,
  })

  // Both actions clear the queue + its badge count and flip the catalog's
  // myStatus (Venter → Godkjent on approve, → available again on reject).
  const invalidateQueue = () => {
    void qc.invalidateQueries({ queryKey: ['submissions', 'pending'] })
    void qc.invalidateQueries({ queryKey: ['submissions', 'pending', 'count'] })
    void qc.invalidateQueries({ queryKey: ['knuter'] })
  }

  const approve = useMutation({
    mutationFn: approveSubmission,
    onSuccess: () => {
      void haptics.success()
      // Approval also moves the submission into the feed and awards points.
      invalidateQueue()
      void qc.invalidateQueries({ queryKey: ['feed'] })
      void qc.invalidateQueries({ queryKey: ['leaderboard'] })
    },
    onError: (e) => toast.show((e as Error).message),
  })

  const reject = useMutation({
    mutationFn: rejectSubmission,
    onSuccess: invalidateQueue,
    onError: (e) => toast.show((e as Error).message),
  })

  if (isLoading) {
    return (
      <View style={styles.root}>
        <Stack.Screen options={SCREEN_OPTIONS} />
        <View style={styles.listContent}>
          <PendingSkeleton />
          <PendingSkeleton />
        </View>
        <KnutesjefTabBar active="ko" />
      </View>
    )
  }

  if (error) {
    const forbidden = error instanceof ApiError && error.status === 403
    return (
      <View style={styles.root}>
        <Stack.Screen options={SCREEN_OPTIONS} />
        <View style={styles.centered}>
          <StickerCard tone="surface" radius="lg" style={styles.stateCard}>
            <View style={styles.stateContent}>
              <Text font="display" weight="bold" size="lg" color={sticker.color.danger} align="center">
                Kan ikke vise køen
              </Text>
              <Text size="sm" color={sticker.color.textMuted} align="center">
                {forbidden
                  ? 'Du må være knutesjef for å se denne siden.'
                  : (error as Error).message}
              </Text>
              {!forbidden ? (
                <StickerButton label="Prøv igjen" variant="primary" onPress={() => void refetch()} />
              ) : null}
            </View>
          </StickerCard>
        </View>
        {/* No knutesjef bar for non-knutesjefer — its Kø query would 403 too. */}
        {!forbidden ? <KnutesjefTabBar active="ko" /> : null}
      </View>
    )
  }

  const pending = dedupeById(data?.pages)
  const totalPending = countQuery.data ?? pending.length
  // Changes whenever a different card enters/leaves review. FlatList is a
  // PureComponent, so without extraData it wouldn't re-render a row when this
  // external mutation state flips (the tapped card's spinner would never show).
  const activeReviewKey = `${approve.isPending ? (approve.variables ?? '') : ''}|${
    reject.isPending ? (reject.variables ?? '') : ''
  }`

  return (
    <View style={styles.root}>
      <Stack.Screen options={SCREEN_OPTIONS} />
      <FlatList
        data={pending}
        keyExtractor={(s) => s.id}
        renderItem={({ item }) => {
          const pendingAction =
            approve.isPending && approve.variables === item.id
              ? 'approve'
              : reject.isPending && reject.variables === item.id
                ? 'reject'
                : null
          return (
            <PendingCard
              submission={item}
              pendingAction={pendingAction}
              onApprove={approve.mutate}
              onReject={reject.mutate}
            />
          )
        }}
        extraData={activeReviewKey}
        ListHeaderComponent={
          pending.length > 0 ? (
            <View style={styles.header}>
              <Text font="display" weight="bold" size="xl" color={sticker.color.ink}>
                {totalPending} venter
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={isFetchingNextPage ? <PendingSkeleton /> : null}
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) void fetchNextPage()
        }}
        ListEmptyComponent={
          <View style={styles.centered}>
            <StickerCard tone="surface" radius="lg" style={styles.stateCard}>
              <View style={styles.stateContent}>
                <KnoteIcon name="knute" size={sticker.icon.lg} color={sticker.color.primary} />
                <Text font="display" weight="bold" size="lg" color={sticker.color.ink} align="center">
                  Alt er godkjent
                </Text>
                <Text size="sm" color={sticker.color.textMuted} align="center">
                  Ingenting å vurdere akkurat nå. Bra jobbet, knutesjef.
                </Text>
              </View>
            </StickerCard>
          </View>
        }
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + size.bottomNavMinHeight + spacing.lg },
          pending.length === 0 ? styles.listContentEmpty : null,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
            tintColor={sticker.color.primary}
          />
        }
      />
      <Toast message={toast.message} bottomOffset={insets.bottom + spacing.lg} />
      <KnutesjefTabBar active="ko" />
    </View>
  )
}

// Two card-shaped skeletons while the queue loads — matches the real card layout
// (evidence well, title, meta, two action buttons) so the swap is calm.
function PendingSkeleton() {
  return (
    <StickerCard tone="surface" radius="lg" style={styles.skelCard}>
      <View style={styles.skelBody}>
        <Skeleton style={styles.skelWell} />
        <Skeleton style={styles.skelTitle} />
        <Skeleton style={styles.skelMeta} />
        <View style={styles.skelActions}>
          <Skeleton style={styles.skelButton} />
          <Skeleton style={styles.skelButton} />
        </View>
      </View>
    </StickerCard>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: sticker.color.paper },
  header: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing.sm,
  },
  listContent: { paddingTop: spacing.sm },
  listContentEmpty: { flexGrow: 1, justifyContent: 'center' },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    minHeight: size.emptyMinHeight,
  },
  stateCard: { alignSelf: 'stretch' },
  stateContent: { alignItems: 'center', gap: spacing.md },
  // Skeleton card mirrors PendingCard's spacing.
  skelCard: { marginHorizontal: spacing.base, marginBottom: spacing.md },
  skelBody: { gap: spacing.sm },
  skelWell: { alignSelf: 'stretch', height: size.reviewEvidenceHeight, borderRadius: sticker.radius.md },
  skelTitle: { width: size.skeletonTitleWidth, height: size.skeletonTitleHeight },
  skelMeta: { width: size.leaderboardSelectWidth, height: size.skeletonRowTitleHeight },
  skelActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  skelButton: { flex: 1, height: sticker.tap.size, borderRadius: sticker.radius.md },
})
