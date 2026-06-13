import { useRef, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  RefreshControl,
  type LayoutChangeEvent,
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Stack } from 'expo-router'
import { AppTabBar } from '../components/AppTabBar'
import { fetchLeaderboard, type LeaderboardEntry } from '../lib/api'
import { borderWidth, colors, fontSize, fontWeight, opacity, radius, size, spacing } from '../lib/theme'

const TOP_RANK_LIMIT = 3
const FIRST_INITIAL_LENGTH = 1
const MAX_INITIALS = 2
const formatPoints = (n: number) => new Intl.NumberFormat('nb-NO').format(n)

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets()
  const scrollRef = useRef<ScrollView>(null)
  const [myPlaceY, setMyPlaceY] = useState<number | null>(null)
  const { data, error, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: fetchLeaderboard,
  })

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Toppliste' }} />
        <View style={styles.center}>
          <Text style={styles.muted}>Laster topplisten...</Text>
        </View>
      </>
    )
  }

  if (error) {
    return (
      <>
        <Stack.Screen options={{ title: 'Toppliste' }} />
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Kunne ikke laste topplisten</Text>
          <Text style={styles.muted}>{(error as Error).message}</Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => void refetch()}
            accessibilityRole="button"
            accessibilityLabel="Prøv igjen"
          >
            <Text style={styles.retryText}>Prøv igjen</Text>
          </Pressable>
        </View>
      </>
    )
  }

  const entries = data?.leaderboard ?? []
  const currentUser = entries.find((entry) => entry.isCurrentUser)
  const bottomPadding = insets.bottom + size.bottomNavMinHeight + spacing.xl

  const goToMyPlace = () => {
    if (myPlaceY === null) return

    scrollRef.current?.scrollTo({
      y: Math.max(myPlaceY - spacing.lg, spacing.none),
      animated: true,
    })
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Toppliste' }} />
      <View style={styles.root}>
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => void refetch()}
              tintColor={colors.ink}
            />
          }
        >
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>Visning</Text>
            <Text style={styles.heading} accessibilityRole="header">
              Topplisten
            </Text>
            <Text style={styles.heroText}>Se deltakelse i kullet på en vennlig og lavterskel måte.</Text>
          </View>

          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <View style={styles.panelTitleBlock}>
                <Text style={styles.panelTitle}>Toppliste</Text>
                <Text style={styles.panelText}>En vennlig oversikt over aktivitet og deltakelse i kullet.</Text>
              </View>

              {currentUser ? (
                <Pressable
                  style={styles.myPlaceButton}
                  onPress={goToMyPlace}
                  accessibilityRole="button"
                  accessibilityLabel={`Gå til min plass, plass ${formatPoints(currentUser.rank)}`}
                  accessibilityHint="Ruller listen til din plassering."
                >
                  <Text style={styles.myPlaceText}>Gå til min plass</Text>
                </Pressable>
              ) : null}
            </View>

            <View style={styles.filterBlock}>
              <Text style={styles.filterLabel}>Statistikktype</Text>
              <View style={styles.selectBox} accessibilityLabel="Statistikktype: Skole">
                <Text style={styles.selectText}>Skole</Text>
                <Text style={styles.selectArrow}>⌄</Text>
              </View>
            </View>

            {entries.length === spacing.none ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>Ingen poeng ennå</Text>
                <Text style={styles.emptyText}>Når russ får godkjent knuter, dukker topplisten opp her.</Text>
              </View>
            ) : (
              <View style={styles.list}>
                {entries.map((entry) => (
                  <LeaderboardRow
                    key={entry.userId}
                    entry={entry}
                    onCurrentUserLayout={entry.isCurrentUser ? setMyPlaceY : undefined}
                  />
                ))}
              </View>
            )}
          </View>
        </ScrollView>
        <AppTabBar active="toppliste" />
      </View>
    </>
  )
}

function LeaderboardRow({
  entry,
  onCurrentUserLayout,
}: {
  entry: LeaderboardEntry
  onCurrentUserLayout?: (y: number) => void
}) {
  const statusLabel = entry.isCurrentUser
    ? 'Deg'
    : entry.rank <= TOP_RANK_LIMIT
      ? 'Topplass'
      : 'Russ'

  const handleLayout = (event: LayoutChangeEvent) => {
    onCurrentUserLayout?.(event.nativeEvent.layout.y)
  }

  return (
    <View
      style={[
        styles.row,
        entry.rank === 1 && styles.rowFirst,
        entry.rank === 2 && styles.rowSecond,
        entry.rank === TOP_RANK_LIMIT && styles.rowThird,
        entry.isCurrentUser && styles.rowCurrentUser,
      ]}
      onLayout={entry.isCurrentUser ? handleLayout : undefined}
      accessibilityLabel={`Plass ${formatPoints(entry.rank)}, ${entry.russenavn}, ${formatPoints(entry.points)} poeng${entry.isCurrentUser ? ', det er deg' : ''}`}
    >
      <View
        style={[
          styles.rankBadge,
          entry.rank <= TOP_RANK_LIMIT && styles.rankBadgeTop,
          entry.isCurrentUser && styles.rankBadgeCurrentUser,
        ]}
      >
        <Text style={[styles.rankText, entry.isCurrentUser && styles.rankTextCurrentUser]}>
          #{formatPoints(entry.rank)}
        </Text>
      </View>

      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{getInitials(entry.russenavn)}</Text>
      </View>

      <View style={styles.nameBlock}>
        <Text style={[styles.russenavn, entry.isCurrentUser && styles.bold]} numberOfLines={1}>
          {entry.russenavn}
        </Text>
        <View style={styles.metaRow}>
          <View style={styles.metaChip}>
            <Text style={styles.metaChipText}>{statusLabel}</Text>
          </View>
          {entry.rank <= TOP_RANK_LIMIT ? (
            <Text style={styles.rankNote}>{getTopRankLabel(entry.rank)}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.pointsBadge}>
        <Text style={styles.pointsText}>{formatPoints(entry.points)} p</Text>
      </View>
    </View>
  )
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

function getTopRankLabel(rank: number) {
  if (rank === 1) return 'Leder'
  if (rank === 2) return 'Jakter'
  if (rank === TOP_RANK_LIMIT) return 'På pallen'
  return ''
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.leaderboard.canvas,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.leaderboard.canvas,
  },
  content: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    gap: spacing.lg,
  },
  hero: {
    gap: spacing.xs,
  },
  eyebrow: {
    color: colors.ink,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  heading: {
    color: colors.ink,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
  },
  heroText: {
    color: colors.knuter.muted,
    fontSize: fontSize.sm,
  },
  panel: {
    backgroundColor: colors.leaderboard.panel,
    borderWidth: borderWidth.medium,
    borderColor: colors.borderInk,
    borderRadius: radius.lg,
    padding: spacing.base,
    gap: spacing.base,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  panelTitleBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  panelTitle: {
    color: colors.ink,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  panelText: {
    color: colors.knuter.muted,
    fontSize: fontSize.sm,
  },
  myPlaceButton: {
    minHeight: size.actionMinHeight,
    minWidth: size.leaderboardPanelActionMinWidth,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: borderWidth.medium,
    borderColor: colors.borderInk,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  myPlaceText: {
    color: colors.ink,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  filterBlock: {
    alignSelf: 'flex-start',
    gap: spacing.xs,
  },
  filterLabel: {
    color: colors.knuter.muted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  selectBox: {
    width: size.leaderboardSelectWidth,
    minHeight: size.actionMinHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: borderWidth.medium,
    borderColor: colors.borderInk,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  selectText: {
    color: colors.ink,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  selectArrow: {
    color: colors.ink,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  list: {
    gap: spacing.sm,
  },
  row: {
    minHeight: size.leaderboardRowMinHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.leaderboard.row,
    borderWidth: borderWidth.medium,
    borderColor: colors.borderInk,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  rowFirst: {
    backgroundColor: colors.leaderboard.first,
    borderColor: colors.accent.yellow,
  },
  rowSecond: {
    backgroundColor: colors.leaderboard.second,
    borderColor: colors.borderStrong,
  },
  rowThird: {
    backgroundColor: colors.leaderboard.third,
    borderColor: colors.warning,
  },
  rowCurrentUser: {
    borderWidth: borderWidth.thick,
  },
  rankBadge: {
    width: size.leaderboardRank,
    height: size.leaderboardRank,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: borderWidth.medium,
    borderColor: colors.borderInk,
    borderRadius: radius.full,
    backgroundColor: colors.accent.yellow,
  },
  rankBadgeTop: {
    backgroundColor: colors.accent.yellow,
  },
  rankBadgeCurrentUser: {
    backgroundColor: colors.ink,
  },
  rankText: {
    color: colors.ink,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  rankTextCurrentUser: {
    color: colors.text.inverse,
  },
  avatar: {
    width: size.leaderboardAvatar,
    height: size.leaderboardAvatar,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: borderWidth.thin,
    borderColor: colors.borderInk,
    borderRadius: radius.full,
    backgroundColor: colors.leaderboard.chip,
  },
  avatarText: {
    color: colors.ink,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  nameBlock: {
    flex: 1,
    minWidth: spacing.none,
    gap: spacing.xs,
  },
  russenavn: {
    color: colors.ink,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  bold: {
    fontWeight: fontWeight.bold,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.leaderboard.chip,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing['2xs'],
  },
  metaChipText: {
    color: colors.knuter.muted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  rankNote: {
    color: colors.ink,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  pointsBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    backgroundColor: colors.leaderboard.points,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    shadowColor: colors.leaderboard.pointsShadow,
    shadowOffset: { width: spacing.none, height: spacing.xs },
    shadowOpacity: opacity.shadow,
    shadowRadius: spacing.sm,
    elevation: spacing.xs,
  },
  pointsText: {
    color: colors.text.inverse,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xl,
    gap: spacing.xs,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  emptyText: {
    color: colors.knuter.muted,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    minHeight: size.emptyMinHeight,
    backgroundColor: colors.leaderboard.canvas,
  },
  errorTitle: {
    color: colors.error,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  muted: {
    color: colors.text.muted,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.base,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.ink,
    borderRadius: radius.md,
  },
  retryText: {
    color: colors.text.inverse,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
})
