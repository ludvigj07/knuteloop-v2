import { RefreshControl, ScrollView, StyleSheet } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { Stack as RouterStack, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AppTabBar } from '../components/AppTabBar'
import { HomeActivityCard } from '../components/home/HomeActivityCard'
import { HomeCatalogCard, HomeKnutesjefCard } from '../components/home/HomeNavigationCards'
import { HomeOverviewCard } from '../components/home/HomeOverviewCard'
import { HomeErrorState, HomeLoadingState } from '../components/home/HomeScreenStates'
import { HomeTopThree } from '../components/home/HomeTopThree'
import { Stack, Text } from '../components/primitives'
import { fetchFeed, fetchKnuter, fetchLeaderboard, fetchMe, tryFetchPendingCount } from '../lib/api'
import { size, spacing, sticker } from '../lib/theme'

const HOME_LEADER_COUNT = 3

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const meQuery = useQuery({ queryKey: ['me'], queryFn: fetchMe })
  const feedQuery = useQuery({ queryKey: ['feed', 'home'], queryFn: () => fetchFeed() })
  const leaderboardQuery = useQuery({ queryKey: ['leaderboard'], queryFn: fetchLeaderboard })
  const knuterQuery = useQuery({ queryKey: ['knuter'], queryFn: fetchKnuter })
  const isKnutesjef = meQuery.data?.user.role === 'knutesjef' || meQuery.data?.user.role === 'admin'
  const pendingQuery = useQuery({
    queryKey: ['submissions', 'pending', 'count'],
    queryFn: tryFetchPendingCount,
    enabled: isKnutesjef,
  })

  const refresh = () => {
    void Promise.all([
      meQuery.refetch(),
      feedQuery.refetch(),
      leaderboardQuery.refetch(),
      knuterQuery.refetch(),
      ...(isKnutesjef ? [pendingQuery.refetch()] : []),
    ])
  }

  // Only take over the whole screen when we have nothing to show — a failed
  // refresh must not discard an already rendered home (same rule as knuter.tsx).
  if (meQuery.error && !meQuery.data) {
    return (
      <HomeErrorState
        message={(meQuery.error as Error | null)?.message ?? 'Ukjent feil'}
        onRetry={refresh}
      />
    )
  }

  if (!meQuery.data) return <HomeLoadingState />

  const me = meQuery.data
  const leaderboard = leaderboardQuery.data?.leaderboard ?? []
  const myEntry = leaderboard.find((entry) => entry.isCurrentUser) ?? null
  const topThree = leaderboard
    .filter((entry) => entry.points > spacing.none)
    .slice(spacing.none, HOME_LEADER_COUNT)
  const knuter = knuterQuery.data?.knuter ?? []
  const availableKnuter = knuter.filter((knute) => knute.myStatus === null).length
  const isRefreshing =
    meQuery.isRefetching ||
    feedQuery.isRefetching ||
    leaderboardQuery.isRefetching ||
    knuterQuery.isRefetching ||
    pendingQuery.isRefetching

  return (
    <Stack style={styles.root}>
      <RouterStack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + spacing.lg,
            paddingRight: insets.right + spacing.base,
            paddingBottom: insets.bottom + size.bottomNavMinHeight + spacing.xl,
            paddingLeft: insets.left + spacing.base,
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={sticker.color.primary}
          />
        }
      >
        <Stack gap="xs">
          <Text size="sm" weight="semibold" color={sticker.color.primary}>
            Knuteloop
          </Text>
          <Text
            font="display"
            size="3xl"
            weight="bold"
            color={sticker.color.ink}
            accessibilityRole="header"
          >
            Hei, {me.user.russenavn}.
          </Text>
          <Text color={sticker.color.textMuted}>
            Her er det som skjer i russetiden på skolen din.
          </Text>
        </Stack>

        <HomeActivityCard
          item={feedQuery.data?.feed[0] ?? null}
          isLoading={feedQuery.isLoading}
          error={(feedQuery.error as Error | null) ?? null}
          onRetry={() => void feedQuery.refetch()}
          onOpenFeed={() => router.replace('/feed')}
          onOpenKnuter={() => router.replace('/knuter')}
        />

        <HomeOverviewCard me={me} leaderboardEntry={myEntry} />

        <HomeCatalogCard
          total={knuter.length}
          available={availableKnuter}
          isLoading={knuterQuery.isLoading}
          hasError={knuterQuery.isError}
          onOpen={() => router.replace('/knuter')}
        />

        <HomeTopThree
          entries={topThree}
          isLoading={leaderboardQuery.isLoading}
          error={(leaderboardQuery.error as Error | null) ?? null}
          onRetry={() => void leaderboardQuery.refetch()}
          onOpenProfile={(userId) => router.push(`/user/${userId}`)}
          onOpenLeaderboard={() => router.replace('/leaderboard')}
        />

        {isKnutesjef ? (
          <HomeKnutesjefCard
            pendingCount={pendingQuery.data ?? null}
            isLoading={pendingQuery.isLoading}
            onOpen={() => router.push('/review')}
          />
        ) : null}
      </ScrollView>
      <AppTabBar active="home" />
    </Stack>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: sticker.color.paper,
  },
  content: {
    gap: spacing.xl,
  },
})
