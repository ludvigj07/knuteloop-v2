import { memo, useCallback, useRef } from 'react'
import { RefreshControl, StyleSheet, View } from 'react-native'
import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list'
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated'
import { useQuery } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Stack } from 'expo-router'
import { AppTabBar } from '../components/AppTabBar'
import {
  Chip,
  CountUp,
  Eyebrow,
  Skeleton,
  StickerButton,
  StickerCard,
  Text,
} from '../components/primitives'
import { fetchLeaderboard, type LeaderboardEntry } from '../lib/api'
import { formatNumber } from '../lib/format'
import { nextPlaceText } from '../lib/leaderboard-ui'
import { animation, fontFamily, fontSize, size, spacing, sticker } from '../lib/theme'

// Toppliste i sticker-designet: én rad per russ (medalje-badge for topp 3,
// russenavn + rangtittel, mono-poeng), og et FESTET «min plass»-kort nederst —
// skjermens ene aksent — som ruller lista til din rad. Tonen er bevisst vennlig
// og lavterskel («vennlig oversikt», aldri «du taper»).

// Only the first screenful staggers in; FlashList recycles cells, so rows
// mounted later during scroll must appear instantly (same rule as hjem).
const STAGGER_STEP_MS = 40
const STAGGER_MAX_STEPS = 8

// FlashList sizing hint: rank badge/avatar row + card padding + separator.
const ESTIMATED_ROW_HEIGHT = 78

// Row artwork sizes (props, not styles — same precedent as GlyphTile size={44}).
const RANK_BADGE_SIZE = 38
const AVATAR_SIZE = 44

// Clearance so the last rows can scroll up past the pinned «min plass» card.
const MY_PLACE_CLEARANCE = 92

const FIRST_INITIAL_LENGTH = 1
const MAX_INITIALS = 2

// Medal fills for the podium (design-system MEDAL map). Everyone else gets the
// soft neutral badge — the ladder is communicated by rank + title, not color
// alone (a11y).
const MEDAL_COLOR: Record<number, string> = {
  1: sticker.color.gold,
  2: sticker.color.silver,
  3: sticker.color.bronze,
}

function getInitials(name: string) {
  const letters = name
    .trim()
    .split(/\s+/)
    .map((part) => part.slice(spacing.none, FIRST_INITIAL_LENGTH))
    .join('')
    .slice(spacing.none, MAX_INITIALS)
    .toLocaleUpperCase('nb-NO')

  return letters || 'R'
}

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets()
  const reduceMotion = useReducedMotion()
  const listRef = useRef<FlashList<LeaderboardEntry>>(null)

  const { data, error, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: fetchLeaderboard,
  })

  const entries = data?.leaderboard ?? []
  const myIndex = entries.findIndex((e) => e.isCurrentUser)
  const me = myIndex >= 0 ? entries[myIndex]! : null

  const goToMyPlace = useCallback(() => {
    if (myIndex >= 0) {
      listRef.current?.scrollToIndex({ index: myIndex, animated: true, viewPosition: 0.4 })
    }
  }, [myIndex])

  const renderRow = useCallback(
    ({ item, index }: ListRenderItemInfo<LeaderboardEntry>) => (
      <Animated.View
        entering={
          reduceMotion || index >= STAGGER_MAX_STEPS
            ? undefined
            : FadeInDown.duration(animation.duration.base).delay(index * STAGGER_STEP_MS)
        }
      >
        <LeaderRow entry={item} />
      </Animated.View>
    ),
    [reduceMotion],
  )

  if (isLoading) return <LoadingState />
  if (error)
    return <ErrorState message={(error as Error).message} onRetry={() => void refetch()} />

  const bottomPadding =
    insets.bottom +
    size.bottomNavMinHeight +
    spacing.xl +
    (me ? MY_PLACE_CLEARANCE : spacing.none)

  const listHeader = (
    <View style={styles.hero}>
      <Eyebrow>Knuteloop</Eyebrow>
      <Text
        font="display"
        weight="bold"
        style={styles.heading}
        accessibilityRole="header"
        accessibilityLabel="Toppliste"
      >
        Toppliste
      </Text>
      <Text size="sm" color={sticker.color.textMuted}>
        Vennlig oversikt over deltakelsen i kullet.
      </Text>
      <View style={styles.countChip}>
        <CountUp value={entries.length} suffix=" russ" style={styles.countChipText} />
      </View>
    </View>
  )

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <FlashList
        ref={listRef}
        data={entries}
        keyExtractor={(entry) => entry.userId}
        renderItem={renderRow}
        estimatedItemSize={ESTIMATED_ROW_HEIGHT}
        ItemSeparatorComponent={ListGap}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <StickerCard tone="soft" radius="lg" shadow="sm">
            <View style={styles.emptyState}>
              <Text weight="bold" size="base" color={sticker.color.ink}>
                Ingen poeng ennå
              </Text>
              <Text size="sm" color={sticker.color.textMuted} style={styles.centerText}>
                Når russ får godkjent knuter, dukker topplisten opp her.
              </Text>
            </View>
          </StickerCard>
        }
        contentContainerStyle={{
          paddingHorizontal: spacing.base,
          paddingTop: insets.top + spacing.lg,
          paddingBottom: bottomPadding,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
            tintColor={sticker.color.ink}
          />
        }
      />

      {me ? (
        <View
          style={[
            styles.myPlaceWrap,
            { bottom: insets.bottom + size.bottomNavMinHeight + spacing.md },
          ]}
          pointerEvents="box-none"
        >
          <StickerCard
            tone="accent"
            radius="lg"
            shadow="base"
            padding="md"
            onPress={goToMyPlace}
            haptic="light"
            accessibilityRole="button"
            accessibilityLabel={`Din plass: ${formatNumber(me.rank)}. ${me.rankTitle}, ${formatNumber(me.points)} poeng`}
            accessibilityHint="Ruller listen til din plassering."
          >
            <View style={styles.myPlaceRow}>
              <Text font="mono" weight="bold" style={styles.myPlaceRank}>
                #{formatNumber(me.rank)}
              </Text>
              <View style={styles.myPlaceBody}>
                <Text
                  font="display"
                  weight="bold"
                  size="base"
                  color={sticker.color.ink}
                  numberOfLines={1}
                >
                  {me.rankTitle}
                </Text>
                <Text size="xs" weight="semibold" color={sticker.color.ink} numberOfLines={1}>
                  {nextPlaceText(entries, me)}
                </Text>
              </View>
              <Text font="mono" weight="bold" size="base" color={sticker.color.ink}>
                {formatNumber(me.points)} p
              </Text>
            </View>
          </StickerCard>
        </View>
      ) : null}

      <AppTabBar active="toppliste" />
    </View>
  )
}

// One row of the toppliste. memo: a few hundred rows per school — parent
// re-renders (refresh state etc.) must not re-render them all. Non-pressable
// (public profiles are not in v2), so the row is ONE screen-reader element via
// the inner accessible View.
const LeaderRow = memo(function LeaderRow({ entry }: { entry: LeaderboardEntry }) {
  const medal = MEDAL_COLOR[entry.rank]
  return (
    <StickerCard radius="md" shadow="sm" padding="md">
      <View
        style={styles.row}
        accessible
        accessibilityLabel={`Plass ${formatNumber(entry.rank)}, ${entry.russenavn}, ${entry.rankTitle}, ${formatNumber(entry.points)} poeng${entry.isCurrentUser ? ', det er deg' : ''}`}
      >
        <View style={[styles.rankBadge, medal ? { backgroundColor: medal } : null]}>
          <Text
            font="mono"
            weight="bold"
            size="sm"
            color={medal ? sticker.color.textInverse : sticker.color.textSoft}
          >
            {formatNumber(entry.rank)}
          </Text>
        </View>
        <View style={styles.avatar}>
          <Text weight="bold" size="sm" color={sticker.color.textSoft}>
            {getInitials(entry.russenavn)}
          </Text>
        </View>
        <View style={styles.nameBlock}>
          <View style={styles.nameLine}>
            <Text
              font="display"
              weight="bold"
              size="base"
              color={sticker.color.ink}
              numberOfLines={1}
              style={styles.nameText}
            >
              {entry.russenavn}
            </Text>
            {entry.isCurrentUser ? <Chip label="Deg" tone="accent" /> : null}
          </View>
          <Text size="xs" weight="semibold" color={sticker.color.textMuted} numberOfLines={1}>
            {entry.rankTitle}
          </Text>
        </View>
        <View style={styles.pointsBlock}>
          <Text font="mono" weight="bold" size="lg" color={sticker.color.ink}>
            {formatNumber(entry.points)}
          </Text>
          <Text size="xs" color={sticker.color.textMuted}>
            poeng
          </Text>
        </View>
      </View>
    </StickerCard>
  )
})

// Spacing between rows. FlashList has no `gap` — a separator keeps row heights
// predictable for recycling.
function ListGap() {
  return <View style={styles.listGap} />
}

function LoadingState() {
  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.loadingContent}>
        <Skeleton style={styles.skeletonHeading} />
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} style={styles.skeletonRow} />
        ))}
      </View>
    </View>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.center}>
      <Stack.Screen options={{ headerShown: false }} />
      <StickerCard radius="lg" style={styles.errorCard}>
        <View style={styles.errorContent}>
          <Text weight="bold" size="lg" color={sticker.color.danger}>
            Kunne ikke laste topplisten
          </Text>
          <Text size="sm" color={sticker.color.textMuted} style={styles.centerText}>
            {message}
          </Text>
          <StickerButton label="Prøv igjen" variant="primary" onPress={onRetry} />
        </View>
      </StickerCard>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: sticker.color.paper,
  },
  hero: {
    gap: spacing.sm,
    paddingBottom: spacing.base,
  },
  heading: {
    fontSize: fontSize['2xl'],
    lineHeight: fontSize['2xl'] * 1.1,
    color: sticker.color.ink,
  },
  countChip: {
    alignSelf: 'flex-start',
    backgroundColor: sticker.color.ink,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: sticker.radius.full,
  },
  countChipText: {
    color: sticker.color.textInverse,
    fontSize: fontSize.xs,
    fontFamily: fontFamily.mono.semibold,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rankBadge: {
    width: RANK_BADGE_SIZE,
    height: RANK_BADGE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: sticker.radius.full,
    borderWidth: sticker.borderWidth,
    borderColor: sticker.color.ink,
    backgroundColor: sticker.color.surfaceSoft,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: sticker.radius.full,
    borderWidth: sticker.borderWidth,
    borderColor: sticker.color.ink,
    backgroundColor: sticker.color.primaryBg,
  },
  nameBlock: {
    flex: 1,
    minWidth: spacing.none,
    gap: spacing.xs,
  },
  nameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  nameText: {
    flexShrink: 1,
  },
  pointsBlock: {
    alignItems: 'flex-end',
  },
  listGap: {
    height: spacing.md,
  },
  myPlaceWrap: {
    position: 'absolute',
    left: spacing.base,
    right: spacing.base,
    zIndex: 10,
  },
  myPlaceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  myPlaceRank: {
    fontSize: fontSize.xl,
    color: sticker.color.ink,
  },
  myPlaceBody: {
    flex: 1,
    minWidth: spacing.none,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.xs,
  },
  centerText: {
    textAlign: 'center',
  },
  loadingContent: {
    flex: 1,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xl,
    gap: spacing.base,
  },
  skeletonHeading: {
    width: size.skeletonTitleWidth,
    height: size.skeletonTitleHeight,
  },
  skeletonRow: {
    height: ESTIMATED_ROW_HEIGHT,
    borderRadius: sticker.radius.md,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: sticker.color.paper,
  },
  errorCard: {
    alignSelf: 'stretch',
  },
  errorContent: {
    alignItems: 'center',
    gap: spacing.md,
  },
})
