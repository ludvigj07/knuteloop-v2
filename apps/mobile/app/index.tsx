import { useState } from 'react'
import { RefreshControl, ScrollView, StyleSheet } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { Stack as RouterStack, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AppTabBar } from '../components/AppTabBar'
import { HomeActivityCard } from '../components/home/HomeActivityCard'
import { HomeDagensKnuteCard } from '../components/home/HomeDagensKnuteCard'
import { HomeCatalogCard } from '../components/home/HomeNavigationCards'
import { HomeOverviewCard } from '../components/home/HomeOverviewCard'
import { HomeErrorState, HomeLoadingState } from '../components/home/HomeScreenStates'
import { HomeTopThree } from '../components/home/HomeTopThree'
import { UserPeekSheet } from '../components/profile/UserPeekSheet'
import { Stack, Text } from '../components/primitives'
import {
  fetchDagensKnute,
  fetchFeed,
  fetchKnuter,
  fetchLeaderboard,
  fetchMe,
} from '../lib/api'
import { size, spacing, sticker } from '../lib/theme'

const HOME_LEADER_COUNT = 3

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [peekUserId, setPeekUserId] = useState<string | null>(null)
  const meQuery = useQuery({ queryKey: ['me'], queryFn: fetchMe })
  const feedQuery = useQuery({ queryKey: ['feed', 'home'], queryFn: () => fetchFeed() })
  const leaderboardQuery = useQuery({ queryKey: ['leaderboard'], queryFn: fetchLeaderboard })
  const knuterQuery = useQuery({ queryKey: ['knuter'], queryFn: fetchKnuter })
  const dagensKnuteQuery = useQuery({
    queryKey: ['knuter', 'dagens'],
    queryFn: fetchDagensKnute,
  })

  const refresh = () => {
    void Promise.all([
      meQuery.refetch(),
      feedQuery.refetch(),
      leaderboardQuery.refetch(),
      knuterQuery.refetch(),
      dagensKnuteQuery.refetch(),
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
  const dagensKnute = dagensKnuteQuery.data?.dagens ?? null
  const dagensKnuteStatus = knuter.find((knute) => knute.id === dagensKnute?.id)?.myStatus ?? null
  const availableKnuter = knuter.filter((knute) => knute.myStatus === null).length
  const isRefreshing =
    meQuery.isRefetching ||
    feedQuery.isRefetching ||
    leaderboardQuery.isRefetching ||
    knuterQuery.isRefetching ||
    dagensKnuteQuery.isRefetching

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

        <HomeDagensKnuteCard
          knute={dagensKnute}
          isLoading={dagensKnuteQuery.isLoading}
          error={(dagensKnuteQuery.error as Error | null) ?? null}
          isCompleted={dagensKnuteStatus !== null}
          onRetry={() => void dagensKnuteQuery.refetch()}
          onOpen={(knuteId) => router.push(`/knute/${knuteId}`)}
        />

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
          onOpenProfile={setPeekUserId}
          onOpenLeaderboard={() => router.replace('/leaderboard')}
        />

      </ScrollView>
      <UserPeekSheet
        userId={peekUserId}
        onClose={() => setPeekUserId(null)}
        onOpenFullProfile={(userId) => router.push(`/user/${userId}`)}
      />
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
