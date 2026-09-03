import { memo, useCallback, useRef, useState } from 'react'
import {
  View,
  StyleSheet,
  FlatList,
  useWindowDimensions,
  type ListRenderItemInfo,
  type ViewToken,
} from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { Image } from 'expo-image'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Stack, useRouter } from 'expo-router'
import { AppTabBar } from '../components/AppTabBar'
import { FeedInfoPanel } from '../components/feed/FeedInfoPanel'
import { UserPeekSheet } from '../components/profile/UserPeekSheet'
import { KnoteIcon, Skeleton, StickerButton, StickerCard, Text } from '../components/primitives'
import { fetchFeed, type FeedItem } from '../lib/api'
import { formatNumber } from '../lib/format'
import { animation, colors, fontSize, interaction, size, spacing, sticker } from '../lib/theme'

// TikTok-style fullscreen feed: one approved submission per screen, vertical
// swipe between them. The photo is shown WHOLE (contain) — never cropped —
// and the leftover screen area is filled with a blurred, zoomed copy of the
// same photo so it still reads as fullscreen. The chrome (info card, close
// button, states) is sticker-styled so the feed matches the rest of the app.
//
// «Tom visning» (clear view): pinch the photo and ALL chrome — info panel and
// tab bar — fades away, leaving only the photo. TikTok's version leaves a
// progress bar and an exit button behind; ours leaves nothing. The pinch
// also really zooms while held (a pinch that does not zoom feels broken)
// and springs back on release. Pinch again to bring the chrome back; swiping
// to the next post always resets, so clear view is per photo, not a mode.

export default function FeedScreen() {
  const { height, width } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const reduceMotion = useReducedMotion()
  const [peekUserId, setPeekUserId] = useState<string | null>(null)
  // Clear view is owned here (not per card) because it also hides the tab
  // bar, which lives outside the list. Only the active card can be in it.
  const [chromeHidden, setChromeHidden] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const chromeDuration = reduceMotion ? 0 : animation.duration.fast

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

  // FlatList requires these two to keep their identity for the list's lifetime.
  // Swiping to a new post ends clear view — it is per photo, never sticky.
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems.find((v) => v.isViewable)
    if (!first) return
    setActiveId((first.item as FeedItem).id)
    setChromeHidden(false)
  }).current

  const toggleChrome = useCallback(() => setChromeHidden((hidden) => !hidden), [])

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<FeedItem>) => (
      <FeedCard
        item={item}
        height={height}
        width={width}
        bottomInset={insets.bottom}
        chromeHidden={chromeHidden && item.id === activeId}
        chromeDuration={chromeDuration}
        onToggleChrome={toggleChrome}
        onOpenProfile={() => setPeekUserId(item.userId)}
      />
    ),
    [height, width, insets.bottom, chromeHidden, activeId, chromeDuration, toggleChrome],
  )

  const tabBarStyle = useAnimatedStyle(() => ({
    opacity: withTiming(chromeHidden ? 0 : 1, { duration: chromeDuration }),
  }))

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
                onPress={() => router.push('/knuter')}
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
          viewabilityConfig={viewabilityConfig}
          onViewableItemsChanged={onViewableItemsChanged}
          // Every page is a full screen with two decoded copies of the photo
          // (blur backdrop + contain), so the default render window (~21
          // screens) pins hundreds of MB of bitmaps. Keep the current page +
          // 2 neighbors each way; the NEXT API page is still fetched 2
          // screens early via onEndReachedThreshold, so swiping stays smooth.
          initialNumToRender={1}
          maxToRenderPerBatch={2}
          windowSize={5}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) void fetchNextPage()
          }}
          onEndReachedThreshold={2}
        />
      )}

      <UserPeekSheet
        userId={peekUserId}
        onClose={() => setPeekUserId(null)}
        onOpenFullProfile={(userId) => router.push(`/user/${userId}`)}
      />

      {/* In clear view the bar is invisible AND untouchable — a hidden bar that
          still eats taps would be exactly the kind of leftover we are removing. */}
      <Animated.View style={tabBarStyle} pointerEvents={chromeHidden ? 'none' : 'auto'}>
        <AppTabBar active="oyeblikk" />
      </Animated.View>
    </View>
  )
}

// memo: fetching the next feed page rebuilds the items array, but the page
// objects keep their identity — already-mounted fullscreen cards (each holding
// decoded photos) must not re-render just because pagination advanced.
const FeedCard = memo(function FeedCard({
  item,
  height,
  width,
  bottomInset,
  chromeHidden,
  chromeDuration,
  onToggleChrome,
  onOpenProfile,
}: {
  item: FeedItem
  height: number
  width: number
  bottomInset: number
  chromeHidden: boolean
  chromeDuration: number
  onToggleChrome: () => void
  onOpenProfile: () => void
}) {
  // imageUrl is null for legacy placeholder keys (no real upload) — show a
  // placeholder for those; render the photo when there's a real URL.
  const url = item.imageUrl
  // Text-only submission (Sex folder etc.) — render the caption as a sticker
  // quote card instead of a photo (ADR-0014).
  const isText = item.evidenceType === 'text'

  // Pinch: toggles clear view on touch-down (so it feels instant), zooms the
  // photo while held, springs back on release. The toggle lives on the screen
  // (it also hides the tab bar); the zoom is local to this card.
  const scale = useSharedValue(1)
  const pinch = Gesture.Pinch()
    .onBegin(() => {
      runOnJS(onToggleChrome)()
    })
    .onUpdate((e) => {
      scale.value = Math.min(Math.max(e.scale, 1), interaction.pinch.maxScale)
    })
    .onFinalize(() => {
      scale.value = withSpring(1, animation.spring.base)
    })

  const photoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))
  const chromeStyle = useAnimatedStyle(() => ({
    opacity: withTiming(chromeHidden ? 0 : 1, { duration: chromeDuration }),
  }))

  return (
    <GestureDetector gesture={pinch}>
      <View
        style={[styles.card, { height, width }]}
        accessibilityLabel={`${item.russenavn} fullførte ${item.knuteTitle}, ${formatNumber(item.knutePoints)} poeng`}
        accessibilityHint="Knip med to fingre for å se bare bildet. Knip igjen for å få alt tilbake."
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
            <Animated.View style={[styles.photo, photoStyle]}>
              <Image
                source={{ uri: url }}
                style={styles.photo}
                contentFit="contain"
                transition={animation.duration.fast}
                accessibilityRole="image"
                accessibilityLabel={item.caption ?? `Bilde av ${item.knuteTitle}`}
              />
            </Animated.View>
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

        <Animated.View
          style={[
            styles.overlay,
            { paddingBottom: bottomInset + size.bottomNavMinHeight + spacing.lg },
            chromeStyle,
          ]}
          pointerEvents={chromeHidden ? 'none' : 'auto'}
        >
          <FeedInfoPanel item={item} onOpenProfile={onOpenProfile} />
        </Animated.View>
      </View>
    </GestureDetector>
  )
})

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
