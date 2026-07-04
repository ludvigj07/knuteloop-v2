import { memo, useCallback, useMemo, useState } from 'react'
import { RefreshControl, StyleSheet, View } from 'react-native'
import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list'
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated'
import { useQuery } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Stack } from 'expo-router'
import { AppTabBar } from '../components/AppTabBar'
import {
  Chip,
  Pressable,
  Skeleton,
  StickerButton,
  StickerCard,
  Text,
} from '../components/primitives'
import { fetchLeaderboard, type LeaderboardEntry } from '../lib/api'
import { formatNumber } from '../lib/format'
import { classStandings, classmatesOf, type ClassStanding } from '../lib/leaderboard-ui'
import { animation, fontSize, size, spacing, sticker } from '../lib/theme'

// Toppliste i sticker-designet, tre visninger fra samme data (v1-paritet,
// Ludvig 2026-07-05): «Skolen» (alle individuelt), «Klassen min» (klassen din
// individuelt), «Klassekamp» (klassene mot hverandre, rangert på SNITT — og
// snittet er også tallet som VISES; aldri v1-feilen «viser sum, rangerer
// snitt»). Så enkel som mulig: sentrert tittel, segmentvelger, rader.

// Only the first screenful staggers in; FlashList recycles cells, so rows
// mounted later during scroll must appear instantly (same rule as hjem).
const STAGGER_STEP_MS = 40
const STAGGER_MAX_STEPS = 8

// FlashList sizing hint: rank badge/avatar row + card padding + separator.
const ESTIMATED_ROW_HEIGHT = 78

// Row artwork sizes (props, not styles — same precedent as GlyphTile size={44}).
const RANK_BADGE_SIZE = 38
const AVATAR_SIZE = 44

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

type ViewKey = 'skolen' | 'klassen' | 'klassekamp'

// One list, three shapes: russ rows (Skolen/Klassen min) or class rows
// (Klassekamp). displayRank is view-local (a russ can be #14 at school and #2
// in their class) — medals follow the view, titles stay school-wide.
type RowItem =
  | { kind: 'russ'; entry: LeaderboardEntry; displayRank: number }
  | { kind: 'klasse'; standing: ClassStanding }

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
  const [view, setView] = useState<ViewKey>('skolen')

  const { data, error, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: fetchLeaderboard,
  })

  const entries = useMemo(() => data?.leaderboard ?? [], [data])
  const me = useMemo(() => entries.find((e) => e.isCurrentUser) ?? null, [entries])
  const classmates = useMemo(() => classmatesOf(entries, me), [entries, me])
  const standings = useMemo(() => classStandings(entries), [entries])

  const rows = useMemo<RowItem[]>(() => {
    if (view === 'klassekamp') {
      return standings.map((standing) => ({ kind: 'klasse', standing }))
    }
    const pool = view === 'klassen' ? classmates : entries
    return pool.map((entry, idx) => ({ kind: 'russ', entry, displayRank: idx + 1 }))
  }, [view, entries, classmates, standings])

  const renderRow = useCallback(
    ({ item, index }: ListRenderItemInfo<RowItem>) => (
      <Animated.View
        entering={
          reduceMotion || index >= STAGGER_MAX_STEPS
            ? undefined
            : FadeInDown.duration(animation.duration.base).delay(index * STAGGER_STEP_MS)
        }
      >
        {item.kind === 'russ' ? (
          <LeaderRow entry={item.entry} displayRank={item.displayRank} />
        ) : (
          <ClassRow standing={item.standing} />
        )}
      </Animated.View>
    ),
    [reduceMotion],
  )

  if (isLoading) return <LoadingState />
  if (error)
    return <ErrorState message={(error as Error).message} onRetry={() => void refetch()} />

  const bottomPadding = insets.bottom + size.bottomNavMinHeight + spacing.xl

  // Empty copy per view: class-less users get a friendly nudge, never a wall.
  const emptyTitle =
    view === 'klassen' && !me?.className
      ? 'Du har ikke valgt klasse ennå'
      : view === 'klassekamp'
        ? 'Ingen klasser ennå'
        : 'Ingen poeng ennå'
  const emptyText =
    view === 'klassen' && !me?.className
      ? 'Klassevalg kommer i appen snart — da dukker klassekameratene dine opp her.'
      : view === 'klassekamp'
        ? 'Når russ har valgt klasse, kjemper klassene her — rangert på snittpoeng.'
        : 'Når russ får godkjent knuter, dukker topplisten opp her.'

  const listHeader = (
    <View style={styles.header}>
      <Text
        font="display"
        weight="bold"
        style={styles.heading}
        accessibilityRole="header"
        accessibilityLabel="Toppliste"
      >
        Toppliste
      </Text>
      <View style={styles.segmented} accessibilityRole="tablist">
        <ViewSegment
          label="Skolen"
          active={view === 'skolen'}
          onPress={() => setView('skolen')}
          hint="Viser alle russ på skolen."
        />
        <ViewSegment
          label="Klassen min"
          active={view === 'klassen'}
          onPress={() => setView('klassen')}
          hint="Viser bare klassen din."
        />
        <ViewSegment
          label="Klassekamp"
          active={view === 'klassekamp'}
          onPress={() => setView('klassekamp')}
          hint="Viser klassene mot hverandre, rangert på snittpoeng."
        />
      </View>
    </View>
  )

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <FlashList
        data={rows}
        keyExtractor={(item) => (item.kind === 'russ' ? item.entry.userId : item.standing.className)}
        renderItem={renderRow}
        estimatedItemSize={ESTIMATED_ROW_HEIGHT}
        ItemSeparatorComponent={ListGap}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <StickerCard tone="soft" radius="lg" shadow="sm">
            <View style={styles.emptyState}>
              <Text weight="bold" size="base" color={sticker.color.ink}>
                {emptyTitle}
              </Text>
              <Text size="sm" color={sticker.color.textMuted} style={styles.centerText}>
                {emptyText}
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
      <AppTabBar active="toppliste" />
    </View>
  )
}

// One segment of the Skolen/Klassen min/Klassekamp control — same pattern as
// hjem-skjermens Tilgjengelige/Fullført: the ACTIVE segment names what is on
// screen, and every alternative stays one tap away.
function ViewSegment({
  label,
  active,
  onPress,
  hint,
}: {
  label: string
  active: boolean
  onPress: () => void
  hint: string
}) {
  return (
    <Pressable
      onPress={onPress}
      haptic="selection"
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ selected: active }}
      style={[styles.segment, active ? styles.segmentActive : null]}
    >
      <Text
        size="sm"
        weight="bold"
        color={active ? sticker.color.textInverse : sticker.color.textSoft}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  )
}

// One russ row. memo: a few hundred rows per school — parent re-renders
// (view/refresh state) must not re-render them all. Non-pressable (public
// profiles are not in v2), so the row is ONE screen-reader element.
const LeaderRow = memo(function LeaderRow({
  entry,
  displayRank,
}: {
  entry: LeaderboardEntry
  displayRank: number
}) {
  const medal = MEDAL_COLOR[displayRank]
  return (
    <StickerCard radius="md" shadow="sm" padding="md">
      <View
        style={styles.row}
        accessible
        accessibilityLabel={`Plass ${formatNumber(displayRank)}, ${entry.russenavn}, ${entry.rankTitle}, ${formatNumber(entry.points)} poeng${entry.isCurrentUser ? ', det er deg' : ''}`}
      >
        <View style={[styles.rankBadge, medal ? { backgroundColor: medal } : null]}>
          <Text
            font="mono"
            weight="bold"
            size="sm"
            color={medal ? sticker.color.textInverse : sticker.color.textSoft}
          >
            {formatNumber(displayRank)}
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
            {entry.className ? ` · ${entry.className}` : ''}
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

// One class row in Klassekamp. The BIG number is the average — the exact
// number the ranking uses (rule #1 from v1's sum-vs-snitt confusion).
const ClassRow = memo(function ClassRow({ standing }: { standing: ClassStanding }) {
  const medal = MEDAL_COLOR[standing.rank]
  return (
    <StickerCard radius="md" shadow="sm" padding="md">
      <View
        style={styles.row}
        accessible
        accessibilityLabel={`Plass ${formatNumber(standing.rank)}, klasse ${standing.className}, ${formatNumber(standing.memberCount)} russ, ${formatNumber(standing.averagePoints)} poeng i snitt${standing.isMyClass ? ', klassen din' : ''}`}
      >
        <View style={[styles.rankBadge, medal ? { backgroundColor: medal } : null]}>
          <Text
            font="mono"
            weight="bold"
            size="sm"
            color={medal ? sticker.color.textInverse : sticker.color.textSoft}
          >
            {formatNumber(standing.rank)}
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
              {standing.className}
            </Text>
            {standing.isMyClass ? <Chip label="Deg" tone="accent" /> : null}
          </View>
          <Text size="xs" weight="semibold" color={sticker.color.textMuted} numberOfLines={1}>
            {formatNumber(standing.memberCount)} russ
          </Text>
        </View>
        <View style={styles.pointsBlock}>
          <Text font="mono" weight="bold" size="lg" color={sticker.color.ink}>
            {formatNumber(standing.averagePoints)}
          </Text>
          <Text size="xs" color={sticker.color.textMuted}>
            snittpoeng
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
  header: {
    gap: spacing.base,
    paddingBottom: spacing.base,
  },
  heading: {
    fontSize: fontSize['2xl'],
    lineHeight: fontSize['2xl'] * 1.1,
    color: sticker.color.ink,
    textAlign: 'center',
  },
  segmented: {
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.xs,
    borderRadius: sticker.radius.full,
    borderWidth: sticker.borderWidth,
    borderColor: sticker.color.ink,
    backgroundColor: sticker.color.surfaceSoft,
  },
  segment: {
    flex: 1,
    minHeight: size.actionMinHeight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    borderRadius: sticker.radius.full,
  },
  segmentActive: {
    backgroundColor: sticker.color.primary,
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
