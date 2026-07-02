import { useCallback } from 'react'
import {
  View,
  StyleSheet,
  FlatList,
  useWindowDimensions,
  type ListRenderItemInfo,
} from 'react-native'
import { Image } from 'expo-image'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Stack, useRouter } from 'expo-router'
import { X } from 'lucide-react-native'
import { AppTabBar } from '../components/AppTabBar'
import { Chip, KnoteIcon, Skeleton, StickerButton, StickerCard, Text } from '../components/primitives'
import { fetchFeed, type FeedItem } from '../lib/api'
import { formatNumber } from '../lib/format'
import { animation, colors, fontSize, size, spacing, sticker } from '../lib/theme'

// TikTok-style fullscreen feed: one approved submission per screen, vertical
// swipe between them. The photo is shown WHOLE (contain) — never cropped —
// and the leftover screen area is filled with a blurred, zoomed copy of the
// same photo so it still reads as fullscreen. The chrome (info card, close
// button, states) is sticker-styled so the feed matches the rest of the app.
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
          <StickerCard radius="lg" style={styles.stateCard}>
            <View style={styles.stateContent}>
              <Skeleton style={styles.skeletonTitle} />
              <Skeleton style={styles.skeletonLine} />
              <Skeleton style={styles.skeletonLineShort} />
            </View>
          </StickerCard>
        </View>
      ) : error ? (
        <View style={styles.centerFill}>
          <StickerCard radius="lg" style={styles.stateCard}>
            <View style={styles.stateContent}>
              <Text weight="bold" size="lg" color={sticker.color.danger}>
                Kunne ikke laste feeden
              </Text>
              <Text size="sm" color={sticker.color.textMuted} style={styles.stateText}>
                {(error as Error).message}
              </Text>
              <StickerButton label="Prøv igjen" variant="primary" onPress={() => void refetch()} />
            </View>
          </StickerCard>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.centerFill}>
          <StickerCard radius="lg" style={styles.stateCard}>
            <View style={styles.stateContent}>
              <KnoteIcon name="knute" size={sticker.icon.lg} color={sticker.color.primary} />
              <Text weight="bold" size="lg" color={sticker.color.ink} style={styles.stateText}>
                Ingen godkjente innsendinger ennå
              </Text>
              <Text size="sm" color={sticker.color.textMuted} style={styles.stateText}>
                Når noen fullfører en knute og knutesjefen godkjenner den, dukker den opp her.
              </Text>
              <StickerButton
                label="Se knutene"
                variant="accent"
                onPress={() => router.push('/')}
                accessibilityHint="Åpner knutekatalogen."
              />
            </View>
          </StickerCard>
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

      <View style={[styles.closeWrap, { top: insets.top + spacing.sm }]}>
        <StickerCard
          radius="full"
          shadow="sm"
          padding="none"
          onPress={() => router.back()}
          haptic="light"
          accessibilityRole="button"
          accessibilityLabel="Lukk feeden"
        >
          <View style={styles.closeContent}>
            <X size={sticker.icon.md} color={sticker.color.ink} strokeWidth={2.5} />
          </View>
        </StickerCard>
      </View>

      <AppTabBar active="oyeblikk" />
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
  // imageUrl is null for legacy placeholder keys (no real upload) — show a
  // placeholder for those; render the photo when there's a real URL.
  const url = item.imageUrl
  // Text-only submission (Sex folder etc.) — render the caption as a sticker
  // quote card instead of a photo (ADR-0014).
  const isText = item.evidenceType === 'text'

  return (
    <View
      style={[styles.card, { height, width }]}
      accessibilityLabel={`${item.russenavn} fullførte ${item.knuteTitle}, ${formatNumber(item.knutePoints)} poeng`}
    >
      {isText ? (
        <View style={styles.quoteWrap}>
          <StickerCard tone="accent" radius="xl" style={styles.quoteCard}>
            <Text font="display" weight="bold" style={styles.quoteText} numberOfLines={8}>
              {item.caption ?? item.knuteTitle}
            </Text>
          </StickerCard>
        </View>
      ) : url ? (
        <>
          {/* Blurred fill behind — zoomed to cover, so no black bars */}
          <Image
            source={{ uri: url }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            blurRadius={24}
            accessibilityElementsHidden
          />
          <View style={styles.dim} />
          {/* The actual photo — whole, never cropped */}
          <Image
            source={{ uri: url }}
            style={styles.photo}
            contentFit="contain"
            transition={animation.duration.fast}
            accessibilityRole="image"
            accessibilityLabel={item.caption ?? `Bilde av ${item.knuteTitle}`}
          />
        </>
      ) : (
        <View style={styles.quoteWrap}>
          <StickerCard tone="media" radius="xl" style={styles.quoteCard}>
            <View style={styles.placeholderContent}>
              <KnoteIcon name="knute" size={sticker.icon.lg} color={sticker.color.textMuted} />
              <Text size="sm" color={sticker.color.textMuted} style={styles.stateText}>
                Bildet kommer når lagring er koblet på
              </Text>
            </View>
          </StickerCard>
        </View>
      )}

      <View
        style={[styles.overlay, { paddingBottom: bottomInset + size.bottomNavMinHeight + spacing.lg }]}
      >
        <StickerCard radius="lg" shadow="sm" padding="md">
          <View style={styles.infoContent}>
            <Text font="display" weight="bold" size="lg" color={sticker.color.ink} numberOfLines={1}>
              {item.russenavn}
            </Text>
            <Text size="sm" color={sticker.color.textSoft} numberOfLines={2}>
              {item.knuteTitle}
            </Text>
            <View style={styles.chipRow}>
              <Chip label={`+${formatNumber(item.knutePoints)} P`} tone="accent" mono />
              <Chip label="Godkjent" tone="success" />
            </View>
            {!isText && item.caption ? (
              <Text size="sm" color={sticker.color.textMuted} numberOfLines={3}>
                {item.caption}
              </Text>
            ) : null}
          </View>
        </StickerCard>
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
  quoteWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  quoteCard: {
    alignSelf: 'stretch',
  },
  quoteText: {
    color: sticker.color.ink,
    fontSize: fontSize.xl,
    lineHeight: fontSize.xl * 1.25,
    textAlign: 'center',
  },
  placeholderContent: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.base,
  },
  infoContent: {
    gap: spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  closeWrap: {
    position: 'absolute',
    right: spacing.base,
    zIndex: 10,
  },
  closeContent: {
    width: size.actionMinHeight,
    height: size.actionMinHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerFill: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  stateCard: {
    alignSelf: 'stretch',
  },
  stateContent: {
    alignItems: 'center',
    gap: spacing.md,
  },
  stateText: {
    textAlign: 'center',
  },
  skeletonTitle: {
    width: size.skeletonTitleWidth,
    height: size.skeletonTitleHeight,
  },
  skeletonLine: {
    alignSelf: 'stretch',
    height: size.skeletonRowTitleHeight,
  },
  skeletonLineShort: {
    width: size.skeletonTitleWidth,
    height: size.skeletonRowMetaHeight,
  },
})
