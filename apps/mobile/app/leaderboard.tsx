import { View, Text, ScrollView, StyleSheet, Pressable, RefreshControl } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Stack } from 'expo-router'
import { fetchLeaderboard, type LeaderboardEntry } from '../lib/api'
import { colors, spacing, radius, fontSize, fontWeight } from '../lib/theme'

const formatPoints = (n: number) => new Intl.NumberFormat('nb-NO').format(n)

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets()
  const { data, error, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: fetchLeaderboard,
  })

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Toppliste' }} />
        <View style={styles.center}>
          <Text style={styles.muted}>Laster topplisten…</Text>
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

  return (
    <>
      <Stack.Screen options={{ title: 'Toppliste' }} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.lg }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
            tintColor={colors.brand.primary}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.heading}>Toppliste</Text>
          <Text style={styles.muted}>{entries.length} russ i konkurransen</Text>
        </View>

        {entries.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.muted}>Ingen poeng tildelt ennå.</Text>
          </View>
        ) : (
          entries.map((e) => <LeaderboardRow key={e.userId} entry={e} />)
        )}
      </ScrollView>
    </>
  )
}

function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  return (
    <View
      style={[styles.row, entry.isCurrentUser && styles.rowHighlight]}
      accessibilityLabel={`Plass ${entry.rank}, ${entry.russenavn}, ${entry.points} poeng${entry.isCurrentUser ? ', det er deg' : ''}`}
    >
      <Text style={[styles.rank, entry.rank <= 3 && styles.rankTop]}>#{entry.rank}</Text>
      <Text style={[styles.russenavn, entry.isCurrentUser && styles.bold]} numberOfLines={1}>
        {entry.russenavn}
        {entry.isCurrentUser && '  (deg)'}
      </Text>
      <Text style={[styles.points, entry.isCurrentUser && styles.bold]}>
        {formatPoints(entry.points)} p
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing.sm,
  },
  heading: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    marginHorizontal: spacing.base,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.base,
  },
  rowHighlight: {
    borderColor: colors.brand.primary,
    borderWidth: 2,
    backgroundColor: '#FFF7F8',
  },
  rank: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.muted,
    minWidth: 40,
  },
  rankTop: {
    color: colors.brand.primary,
  },
  russenavn: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.text.primary,
  },
  points: {
    fontSize: fontSize.base,
    color: colors.text.primary,
    fontWeight: fontWeight.semibold,
  },
  bold: {
    fontWeight: fontWeight.bold,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    minHeight: 200,
  },
  errorTitle: {
    fontSize: fontSize.lg,
    color: colors.error,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  muted: {
    fontSize: fontSize.sm,
    color: colors.text.muted,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.base,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.brand.primary,
    borderRadius: radius.md,
  },
  retryText: { color: colors.text.inverse, fontWeight: fontWeight.semibold, fontSize: fontSize.base },
})
