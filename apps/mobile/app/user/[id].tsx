import { StyleSheet, View } from 'react-native'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { FlashList } from '@shopify/flash-list'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { Chip, Eyebrow, Skeleton, StickerButton, StickerCard, Text } from '../../components/primitives'
import { ProfileGridTile } from '../../components/profile/ProfileGridTile'
import {
  fetchMe,
  fetchUserProfile,
  fetchUserSubmissions,
  type ProfileGridItem,
  type RussType,
} from '../../lib/api'
import { formatNumber } from '../../lib/format'
import { size, spacing, sticker } from '../../lib/theme'

// Public profile («stalke»-flow): tap a russ anywhere → who they are + the
// grid of what they CHOSE to share (ADR-0021/0022 — server-side filtered).
// Design note (Ludvig's July feedback): flat header on paper, colour via the
// medal/gold tokens — no card-in-card box soup. The ambitious profile redesign
// (trofévegg, signaturknute) is a later epic; this screen is the plumbing + a
// clean baseline.

const GRID_COLUMNS = 3
const ESTIMATED_TILE_SIZE = 130

const RUSS_TYPE_LABEL: Record<RussType, string> = {
  red: 'Rødruss',
  blue: 'Blåruss',
}

// Medal colours for topp-3 ranks, same vocabulary as the leaderboard.
const MEDAL_COLOR: Record<number, string> = {
  1: sticker.color.gold,
  2: sticker.color.silver,
  3: sticker.color.bronze,
}

const screenOptions = {
  title: 'Profil',
  headerStyle: { backgroundColor: sticker.color.paper },
  headerTintColor: sticker.color.ink,
  headerShadowVisible: false,
} as const

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const profile = useQuery({
    queryKey: ['user', id],
    queryFn: () => fetchUserProfile(id!),
    enabled: Boolean(id),
  })
  const me = useQuery({ queryKey: ['me'], queryFn: fetchMe })
  const grid = useInfiniteQuery({
    queryKey: ['user', id, 'submissions'],
    queryFn: ({ pageParam }) => fetchUserSubmissions(id!, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: Boolean(id),
    staleTime: 30_000,
  })

  if (profile.isLoading) {
    return (
      <View style={styles.root}>
        <Stack.Screen options={screenOptions} />
        <View style={styles.content}>
          <Skeleton style={styles.skelName} />
          <Skeleton style={styles.skelLine} />
          <Skeleton style={styles.skelGrid} />
        </View>
      </View>
    )
  }

  if (profile.error || !profile.data) {
    return (
      <View style={styles.root}>
        <Stack.Screen options={screenOptions} />
        <View style={styles.centerFill}>
          <StickerCard radius="lg" style={styles.stateCard}>
            <View style={styles.stateContent}>
              <Text weight="bold" size="lg" color={sticker.color.danger}>
                Fant ikke profilen
              </Text>
              <Text size="sm" color={sticker.color.textMuted} align="center">
                {(profile.error as Error | undefined)?.message ?? 'Brukeren finnes ikke.'}
              </Text>
              <StickerButton label="Tilbake" variant="secondary" onPress={() => router.back()} />
            </View>
          </StickerCard>
        </View>
      </View>
    )
  }

  const user = profile.data.user
  const isMe = me.data?.user.id === user.id
  const medal = MEDAL_COLOR[user.rank]
  const items = grid.data?.pages.flatMap((p) => p.submissions) ?? []

  // Flat header on paper (no outer card): identity, one stat line with colour,
  // then the grid. Rendered as the list header so everything scrolls together.
  const listHeader = (
    <View style={styles.header}>
      <View style={styles.nameRow}>
        <Text font="display" weight="bold" size="2xl" color={sticker.color.ink} style={styles.name}>
          {user.russenavn}
        </Text>
        {isMe ? <Chip label="Deg" tone="accent" /> : null}
      </View>
      <View style={styles.chipRow}>
        <Chip
          label={RUSS_TYPE_LABEL[user.russType]}
          tone={user.russType === 'red' ? 'danger' : 'primary'}
        />
        {user.className ? <Chip label={user.className} tone="neutral" /> : null}
        {user.role === 'knutesjef' ? <Chip label="Knutesjef" tone="accent" /> : null}
      </View>
      {user.quote ? (
        <Text size="sm" color={sticker.color.textMuted} style={styles.quote}>
          «{user.quote}»
        </Text>
      ) : null}

      <View style={styles.statLine}>
        <View style={styles.stat}>
          <Text font="mono" weight="bold" size="xl" color={medal ?? sticker.color.ink}>
            #{formatNumber(user.rank)}
          </Text>
          <Text size="xs" weight="semibold" color={sticker.color.textMuted} numberOfLines={1}>
            {user.rankTitle}
          </Text>
        </View>
        <View style={styles.stat}>
          <Text font="mono" weight="bold" size="xl" color={sticker.color.primary}>
            {formatNumber(user.points)}
          </Text>
          <Text size="xs" weight="semibold" color={sticker.color.textMuted}>
            poeng
          </Text>
        </View>
        <View style={styles.stat}>
          <Text font="mono" weight="bold" size="xl" color={sticker.color.success}>
            {formatNumber(user.completedCount)}
          </Text>
          <Text size="xs" weight="semibold" color={sticker.color.textMuted}>
            fullført
          </Text>
        </View>
        <View style={styles.stat}>
          <Text font="mono" weight="bold" size="xl" color={sticker.color.gold}>
            {formatNumber(user.goldCount)}
          </Text>
          <Text size="xs" weight="semibold" color={sticker.color.textMuted}>
            gull
          </Text>
        </View>
      </View>

      <Eyebrow>Delte knuter</Eyebrow>
    </View>
  )

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ ...screenOptions, title: user.russenavn }} />
      <FlashList
        data={items}
        numColumns={GRID_COLUMNS}
        keyExtractor={(item: ProfileGridItem) => item.id}
        renderItem={({ item }) => (
          <View style={styles.tileWrap}>
            <ProfileGridTile item={item} />
          </View>
        )}
        estimatedItemSize={ESTIMATED_TILE_SIZE}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          grid.isLoading ? (
            <Skeleton style={styles.skelGrid} />
          ) : (
            <StickerCard tone="soft" radius="lg" shadow="sm">
              <View style={styles.stateContent}>
                <Text weight="bold" size="base" color={sticker.color.ink}>
                  Ingen delte knuter ennå
                </Text>
                <Text size="sm" color={sticker.color.textMuted} align="center">
                  {isMe
                    ? 'Trykk «Del i feeden» når du sender inn, så dukker de opp her.'
                    : `${user.russenavn} har ikke delt noen knuter ennå.`}
                </Text>
              </View>
            </StickerCard>
          )
        }
        contentContainerStyle={{
          paddingHorizontal: spacing.base,
          paddingBottom: insets.bottom + spacing.xl,
        }}
        onEndReached={() => {
          if (grid.hasNextPage && !grid.isFetchingNextPage) void grid.fetchNextPage()
        }}
        onEndReachedThreshold={0.5}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: sticker.color.paper },
  content: { padding: spacing.base, gap: spacing.md },
  header: { gap: spacing.sm, paddingTop: spacing.base, paddingBottom: spacing.md },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { flexShrink: 1 },
  chipRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  quote: { fontStyle: 'italic' },
  statLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.lg,
    paddingVertical: spacing.sm,
    flexWrap: 'wrap',
  },
  stat: { alignItems: 'flex-start', gap: spacing.xs / 2 },
  tileWrap: { flex: 1, padding: spacing.xs / 2 },
  centerFill: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  stateCard: { alignSelf: 'stretch' },
  stateContent: { alignItems: 'center', gap: spacing.md, padding: spacing.sm },
  // Skeleton sizes reuse the shared size tokens (no raw values).
  skelName: { width: size.skeletonTitleWidth, height: size.skeletonTitleHeight },
  skelLine: { alignSelf: 'stretch', height: size.skeletonRowTitleHeight },
  skelGrid: { alignSelf: 'stretch', height: size.emptyMinHeight },
})
