import { View, Text, ScrollView, StyleSheet, Pressable, RefreshControl } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Link } from 'expo-router'
import { fetchKnuter, tryFetchPendingCount, type Knute } from '../lib/api'
import { colors, spacing, radius, fontSize, fontWeight } from '../lib/theme'

export default function KnuterScreen() {
  const insets = useSafeAreaInsets()
  const { data, error, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['knuter'],
    queryFn: fetchKnuter,
  })

  // null → not knutesjef (or 403); number → pending count to display.
  const pendingCount = useQuery({
    queryKey: ['submissions', 'pending', 'count'],
    queryFn: tryFetchPendingCount,
    staleTime: 10_000,
  })

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState message={(error as Error).message} onRetry={() => void refetch()} />

  const knuter = data?.knuter ?? []
  const showReviewLink = typeof pendingCount.data === 'number'

  return (
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
        <Text style={styles.heading} accessibilityRole="header">
          {knuter.length} {knuter.length === 1 ? 'knute' : 'knuter'}
        </Text>
        {isRefetching && <Text style={styles.muted}>Oppdaterer…</Text>}
      </View>

      <Link href="/leaderboard" asChild>
        <Pressable
          style={styles.navLink}
          accessibilityRole="link"
          accessibilityLabel="Se topplisten"
        >
          <Text style={styles.navLinkText}>Toppliste</Text>
          <Text style={styles.navLinkArrow}>›</Text>
        </Pressable>
      </Link>

      {showReviewLink && (
        <Link href="/review" asChild>
          <Pressable
            style={styles.reviewLink}
            accessibilityRole="link"
            accessibilityLabel={`${pendingCount.data} venter på godkjenning`}
          >
            <Text style={styles.reviewLinkText}>
              {pendingCount.data === 0
                ? 'Ingen innsendinger venter'
                : `${pendingCount.data} innsendinger venter på godkjenning`}
            </Text>
            <Text style={styles.reviewLinkArrow}>›</Text>
          </Pressable>
        </Link>
      )}
      {knuter.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.muted}>Ingen knuter ennå. Knutesjefen lager dem fra knutesjef-panelet.</Text>
        </View>
      ) : (
        knuter.map((k) => <KnuteCard key={k.id} knute={k} />)
      )}
    </ScrollView>
  )
}

function KnuteCard({ knute }: { knute: Knute }) {
  return (
    <View
      style={styles.card}
      accessibilityRole="text"
      accessibilityLabel={`${knute.title}, ${knute.points} poeng, ${knute.difficulty}`}
    >
      <Text style={styles.cardTitle}>{knute.title}</Text>
      <View style={styles.cardRow}>
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsText}>{knute.points} p</Text>
        </View>
        <Text style={styles.difficulty}>{knute.difficulty}</Text>
      </View>
    </View>
  )
}

function LoadingState() {
  return (
    <View style={styles.scroll}>
      <View style={styles.header}>
        <View style={[styles.skeleton, { width: 120, height: 24 }]} />
      </View>
      {[0, 1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.card}>
          <View style={[styles.skeleton, { width: '70%', height: 16, marginBottom: spacing.sm }]} />
          <View style={[styles.skeleton, { width: '40%', height: 12 }]} />
        </View>
      ))}
    </View>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.center}>
      <Text style={styles.errorTitle}>Kunne ikke laste knutene</Text>
      <Text style={styles.muted}>{message}</Text>
      <Pressable
        style={styles.retryButton}
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel="Prøv igjen"
      >
        <Text style={styles.retryText}>Prøv igjen</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
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
  card: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    marginHorizontal: spacing.base,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: fontSize.base,
    color: colors.text.primary,
    marginBottom: spacing.xs,
    fontWeight: fontWeight.medium,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pointsBadge: {
    backgroundColor: colors.brand.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  pointsText: {
    fontSize: fontSize.xs,
    color: colors.text.inverse,
    fontWeight: fontWeight.semibold,
  },
  difficulty: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
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
  retryText: {
    color: colors.text.inverse,
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.base,
  },
  skeleton: {
    backgroundColor: colors.border,
    borderRadius: radius.sm,
  },
  reviewLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.base,
    marginBottom: spacing.base,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colors.brand.primary,
    borderRadius: radius.md,
  },
  reviewLinkText: {
    color: colors.text.inverse,
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.base,
  },
  reviewLinkArrow: {
    color: colors.text.inverse,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  navLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.base,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  navLinkText: {
    color: colors.text.primary,
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.base,
  },
  navLinkArrow: {
    color: colors.text.muted,
    fontSize: fontSize.xl,
  },
})
