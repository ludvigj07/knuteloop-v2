import { useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Image,
  ActivityIndicator,
  useWindowDimensions,
  type ListRenderItemInfo,
} from 'react-native'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Stack, useRouter } from 'expo-router'
import { fetchFeed, type FeedItem } from '../lib/api'
import { colors, spacing, radius, fontSize, fontWeight } from '../lib/theme'

// TikTok-style fullscreen feed: one approved submission per screen, vertical
// swipe between them. The photo is shown WHOLE (contain) — never cropped —
// and the leftover screen area is filled with a blurred, zoomed copy of the
// same photo so it still reads as fullscreen.
export default function FeedScreen() {
  const { height, width } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const {
    data,
    error,
    isLoading,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: ({ pageParam }) => fetchFeed(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 30_000,
  })

  const items = data?.pages.flatMap((p) => p.feed) ?? []

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<FeedItem>) => (
      <FeedCard item={item} height={height} width={width} bottomInset={insets.bottom} />
    ),
    [height, width, insets.bottom],
  )

  return (
    <View style={[styles.root, { height }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {isLoading ? (
        <View style={styles.centerFill}>
          <ActivityIndicator color={colors.text.inverse} />
        </View>
      ) : error ? (
        <View style={styles.centerFill}>
          <Text style={styles.errorTitle}>Kunne ikke laste feeden</Text>
          <Text style={styles.errorMessage}>{(error as Error).message}</Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => void refetch()}
            accessibilityRole="button"
            accessibilityLabel="Prøv igjen"
          >
            <Text style={styles.retryText}>Prøv igjen</Text>
          </Pressable>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.centerFill}>
          <Text style={styles.emptyTitle}>Ingen godkjente innsendinger ennå</Text>
          <Text style={styles.emptyText}>
            Når noen fullfører en knute og knutesjefen godkjenner den, dukker den opp her.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={height}
          decelerationRate="fast"
          getItemLayout={(_, index) => ({ length: height, offset: height * index, index })}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) void fetchNextPage()
          }}
          onEndReachedThreshold={2}
        />
      )}

      <Pressable
        style={[styles.closeButton, { top: insets.top + spacing.sm }]}
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Lukk feeden"
        hitSlop={spacing.md}
      >
        <Text style={styles.closeText}>✕</Text>
      </Pressable>
    </View>
  )
}

function FeedCard({
  item,
  height,
  width,
  bottomInset,
}: {
  item: FeedItem
  height: number
  width: number
  bottomInset: number
}) {
  // Until Bunny storage ships, imageKey is a placeholder string — only render
  // real <Image> when it's an actual URL.
  const isUrl = item.imageKey.startsWith('http://') || item.imageKey.startsWith('https://')

  return (
    <View
      style={[styles.card, { height, width }]}
      accessibilityLabel={`${item.russenavn} fullførte ${item.knuteTitle}, ${item.knutePoints} poeng`}
    >
      {isUrl ? (
        <>
          {/* Blurred fill behind — zoomed to cover, so no black bars */}
          <Image
            source={{ uri: item.imageKey }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            blurRadius={24}
            accessibilityElementsHidden
          />
          <View style={styles.dim} />
          {/* The actual photo — whole, never cropped */}
          <Image
            source={{ uri: item.imageKey }}
            style={styles.photo}
            resizeMode="contain"
            accessibilityRole="image"
            accessibilityLabel={item.caption ?? `Bilde av ${item.knuteTitle}`}
          />
        </>
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderEmoji}>📸</Text>
          <Text style={styles.placeholderText}>Bildet kommer når lagring er koblet på</Text>
        </View>
      )}

      <View style={[styles.overlay, { paddingBottom: bottomInset + spacing.lg }]}>
        <Text style={styles.russenavn}>{item.russenavn}</Text>
        <View style={styles.knuteRow}>
          <Text style={styles.knuteTitle} numberOfLines={2}>
            {item.knuteTitle}
          </Text>
          <View style={styles.pointsBadge}>
            <Text style={styles.pointsText}>{item.knutePoints} p</Text>
          </View>
        </View>
        {item.caption ? (
          <Text style={styles.caption} numberOfLines={3}>
            {item.caption}
          </Text>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.feed.backdrop,
  },
  card: {
    backgroundColor: colors.feed.backdrop,
    justifyContent: 'center',
  },
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.feed.overlay,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  placeholderEmoji: {
    fontSize: fontSize['3xl'],
  },
  placeholderText: {
    color: colors.text.muted,
    fontSize: fontSize.sm,
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.base,
    gap: spacing.xs,
  },
  russenavn: {
    color: colors.text.inverse,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    textShadowColor: colors.feed.textShadow,
    textShadowRadius: 8,
  },
  knuteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  knuteTitle: {
    flexShrink: 1,
    color: colors.text.inverse,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    textShadowColor: colors.feed.textShadow,
    textShadowRadius: 8,
  },
  pointsBadge: {
    backgroundColor: colors.brand.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  pointsText: {
    color: colors.text.inverse,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  caption: {
    color: colors.text.inverse,
    fontSize: fontSize.sm,
    textShadowColor: colors.feed.textShadow,
    textShadowRadius: 8,
  },
  closeButton: {
    position: 'absolute',
    right: spacing.base,
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.feed.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: colors.text.inverse,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  centerFill: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorTitle: {
    color: colors.text.inverse,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  errorMessage: {
    color: colors.text.muted,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.base,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.brand.primary,
    borderRadius: radius.md,
  },
  retryText: {
    color: colors.text.inverse,
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.base,
  },
  emptyTitle: {
    color: colors.text.inverse,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    color: colors.text.muted,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
})
