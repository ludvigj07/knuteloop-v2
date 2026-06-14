import { type ReactNode } from 'react'
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Stack as RouterStack, useRouter } from 'expo-router'
import { AppTabBar } from '../components/AppTabBar'
import { Button, Stack, Text } from '../components/primitives'
import { useCountUp } from '../hooks/useCountUp'
import { fetchLeaderboard, fetchMe, type MySubmission } from '../lib/api'
import { formatNumber, formatPoints, formatShortDate } from '../lib/format'
import { borderWidth, colors, radius, size, spacing } from '../lib/theme'

const ROLE_LABEL: Record<string, string> = {
  student: 'russ',
  knutesjef: 'knutesjef',
  admin: 'admin',
}

const STATUS_META: Record<MySubmission['status'], { label: string; color: string; bg: string }> = {
  approved: { label: 'Godkjent', color: colors.success, bg: colors.status.approvedBg },
  pending: { label: 'Venter', color: colors.warning, bg: colors.status.pendingBg },
  rejected: { label: 'Avvist', color: colors.error, bg: colors.status.rejectedBg },
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const meQuery = useQuery({ queryKey: ['me'], queryFn: fetchMe })
  // Rank isn't on /api/me — derive it from the (school-scoped, cached) leaderboard.
  const leaderboardQuery = useQuery({ queryKey: ['leaderboard'], queryFn: fetchLeaderboard })

  const points = meQuery.data?.user.points ?? 0
  const animatedPoints = useCountUp(points)

  if (meQuery.isLoading) return <ProfileSkeleton />

  if (meQuery.error || !meQuery.data) {
    return (
      <Screen>
        <Stack align="center" justify="center" gap="sm" style={styles.fill} paddingX="lg">
          <Text size="lg" weight="semibold" color="error">
            Kunne ikke laste profilen
          </Text>
          <Text size="sm" color="muted" align="center">
            {(meQuery.error as Error | undefined)?.message ?? 'Ukjent feil'}
          </Text>
          <Button label="Prøv igjen" onPress={() => void meQuery.refetch()} />
        </Stack>
      </Screen>
    )
  }

  const { user, submissions, counts } = meQuery.data
  const myEntry = leaderboardQuery.data?.leaderboard.find((e) => e.isCurrentUser)
  const total = leaderboardQuery.data?.leaderboard.length ?? 0

  return (
    <Screen>
      <ScrollView
        style={styles.fill}
        contentContainerStyle={{ paddingBottom: insets.bottom + size.bottomNavMinHeight + spacing.xl }}
        refreshControl={
          <RefreshControl
            refreshing={meQuery.isRefetching}
            onRefresh={() => void meQuery.refetch()}
            tintColor={colors.brand.primary}
          />
        }
      >
        <Stack align="center" gap="sm" style={styles.heroCard}>
          <Stack align="center" justify="center" style={styles.avatar}>
            <Text size="2xl" weight="bold" color="inverse">
              {user.russenavn.slice(0, 1).toUpperCase()}
            </Text>
          </Stack>
          <Text size="xl" weight="bold" accessibilityRole="header">
            {user.russenavn}
          </Text>
          <Text size="sm" color="muted">
            {ROLE_LABEL[user.role] ?? user.role}
          </Text>

          {myEntry ? (
            <View style={styles.rankChip} accessibilityLabel={`Rangering nummer ${myEntry.rank} av ${total}`}>
              <Text size="xs" weight="bold" color="inverse">
                #{formatNumber(myEntry.rank)} av {formatNumber(total)}
              </Text>
            </View>
          ) : null}

          <Stack align="center" style={styles.pointsBlock}>
            <Text size="3xl" weight="bold" color="brand">
              {formatPoints(animatedPoints)}
            </Text>
            <Text size="sm" color="muted">
              poeng totalt
            </Text>
          </Stack>
        </Stack>

        <Stack direction="row" gap="sm" style={styles.statRow}>
          <StatBox count={counts.approved} label="godkjent" color={colors.success} />
          <StatBox count={counts.pending} label="venter" color={colors.warning} />
          <StatBox count={counts.rejected} label="avvist" color={colors.error} />
        </Stack>

        <Text size="lg" weight="semibold" style={styles.sectionHeading}>
          Siste innsendinger
        </Text>
        {submissions.length === 0 ? (
          <Stack align="center" paddingY="xl">
            <Text size="sm" color="muted">
              Ingen innsendinger ennå.
            </Text>
          </Stack>
        ) : (
          submissions.map((s) => <SubmissionRow key={s.id} submission={s} />)
        )}

        {__DEV__ ? (
          <Stack paddingX="base" paddingY="base">
            <Button
              label="🔧 Bytt bruker (dev)"
              variant="ghost"
              fullWidth
              onPress={() => router.push('/dev-login')}
            />
          </Stack>
        ) : null}
      </ScrollView>
      <AppTabBar active="profil" />
    </Screen>
  )
}

function Screen({ children }: { children: ReactNode }) {
  return (
    <View style={styles.root}>
      <RouterStack.Screen options={{ title: 'Min profil' }} />
      {children}
    </View>
  )
}

function StatBox({ count, label, color }: { count: number; label: string; color: string }) {
  return (
    <Stack align="center" gap="2xs" style={styles.statBox} accessibilityLabel={`${count} ${label}`}>
      <Text size="xl" weight="bold" color={color}>
        {formatNumber(count)}
      </Text>
      <Text size="xs" color="muted">
        {label}
      </Text>
    </Stack>
  )
}

function SubmissionRow({ submission }: { submission: MySubmission }) {
  const meta = STATUS_META[submission.status]
  return (
    <Stack direction="row" align="center" gap="sm" style={styles.subRow}>
      <Stack gap="2xs" style={styles.fill}>
        <Text size="base" weight="medium" numberOfLines={2}>
          {submission.knuteTitle}
        </Text>
        <Text size="xs" color="muted">
          {formatShortDate(submission.createdAt)} · {formatNumber(submission.knutePoints)} p
        </Text>
      </Stack>
      <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
        <Text size="xs" weight="semibold" color={meta.color}>
          {meta.label}
        </Text>
      </View>
    </Stack>
  )
}

function ProfileSkeleton() {
  return (
    <Screen>
      <Stack gap="base" paddingX="base" style={styles.skeletonWrap}>
        <View style={[styles.skeleton, styles.skeletonAvatar]} />
        <View style={[styles.skeleton, styles.skeletonLineWide]} />
        <View style={[styles.skeleton, styles.skeletonLineNarrow]} />
        <Stack direction="row" gap="sm" style={styles.fullWidth}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.skeleton, styles.skeletonStat]} />
          ))}
        </Stack>
      </Stack>
    </Screen>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  fill: { flex: 1 },
  fullWidth: { alignSelf: 'stretch' },
  heroCard: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
    marginHorizontal: spacing.base,
    marginTop: spacing.base,
    borderRadius: radius.lg,
    borderWidth: borderWidth.thin,
    borderColor: colors.border,
  },
  avatar: {
    width: size.controlHeightLg,
    height: size.controlHeightLg,
    borderRadius: radius.full,
    backgroundColor: colors.brand.primary,
  },
  rankChip: {
    backgroundColor: colors.ink,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  pointsBlock: { marginTop: spacing.sm },
  statRow: { marginHorizontal: spacing.base, marginTop: spacing.sm },
  statBox: {
    flex: 1,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: borderWidth.thin,
    borderColor: colors.border,
  },
  sectionHeading: {
    marginHorizontal: spacing.base,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  subRow: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    marginHorizontal: spacing.base,
    marginBottom: spacing.sm,
    borderWidth: borderWidth.thin,
    borderColor: colors.border,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  skeletonWrap: { paddingTop: spacing.xl, alignItems: 'center' },
  skeleton: { backgroundColor: colors.border, borderRadius: radius.md },
  skeletonAvatar: { width: size.controlHeightLg, height: size.controlHeightLg, borderRadius: radius.full },
  skeletonLineWide: { width: size.leaderboardSelectWidth, height: size.skeletonTitleHeight },
  skeletonLineNarrow: { width: size.skeletonTitleWidth, height: size.skeletonRowMetaHeight },
  skeletonStat: { flex: 1, height: size.emptyMinHeight / 2 },
})
