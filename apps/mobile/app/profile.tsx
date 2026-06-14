import { type ReactNode } from 'react'
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated'
import { useQuery } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Stack as RouterStack, useRouter } from 'expo-router'
import { AppTabBar } from '../components/AppTabBar'
import { CategoryRing } from '../components/profile/CategoryRing'
import { Button, CountUp, Stack, Text } from '../components/primitives'
import {
  fetchLeaderboard,
  fetchMe,
  type KnuteCategory,
  type LeaderboardEntry,
  type MeResponse,
  type MySubmission,
  type RussType,
} from '../lib/api'
import { formatNumber, formatShortDate } from '../lib/format'
import { animation, borderWidth, colors, radius, size, spacing } from '../lib/theme'

const ROLE_LABEL: Record<string, string> = {
  student: 'russ',
  knutesjef: 'knutesjef',
  admin: 'admin',
}

const RUSS_TYPE_META: Record<RussType, { label: string; color: string }> = {
  red: { label: 'Rødruss', color: colors.brand.primary },
  blue: { label: 'Blåruss', color: colors.leaderboard.points },
}

// The five folders → short display labels (v1's "Knote-kategorier") + an accent.
// All colours are theme tokens.
const CATEGORY_META: Record<KnuteCategory, { label: string; color: string }> = {
  Generelle: { label: 'Generelle', color: colors.ink },
  Dobbelknuter: { label: 'Dobbel', color: colors.leaderboard.points },
  Alkoholknuter: { label: 'Alkohol', color: colors.warning },
  Sexknuter: { label: 'Sex', color: colors.brand.primary },
  'Fordervett-knuter': { label: 'Rampestrek', color: colors.success },
}

const STATUS_META: Record<MySubmission['status'], { label: string; color: string; bg: string }> = {
  approved: { label: 'Godkjent', color: colors.success, bg: colors.status.approvedBg },
  pending: { label: 'Venter', color: colors.warning, bg: colors.status.pendingBg },
  rejected: { label: 'Avvist', color: colors.error, bg: colors.status.rejectedBg },
}

const STAGGER_STEP_MS = 60

export default function ProfileScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const reduceMotion = useReducedMotion()
  const meQuery = useQuery({ queryKey: ['me'], queryFn: fetchMe })
  // Rank isn't on /api/me — derive it from the (school-scoped, cached) leaderboard.
  const leaderboardQuery = useQuery({ queryKey: ['leaderboard'], queryFn: fetchLeaderboard })

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

  const { user, submissions, completedCount, goldCount, streak, categories } = meQuery.data
  const myEntry = leaderboardQuery.data?.leaderboard.find((e) => e.isCurrentUser)
  const totalRanked = leaderboardQuery.data?.leaderboard.length ?? 0
  const others = (leaderboardQuery.data?.leaderboard ?? []).filter((e) => !e.isCurrentUser).slice(0, 12)

  // Each section fades + slides in just below the previous one (capped delay).
  const section = (index: number) =>
    reduceMotion ? undefined : FadeInDown.duration(animation.duration.base).delay(index * STAGGER_STEP_MS)

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
        <Animated.View entering={section(0)}>
          <IdentityCard user={user} />
        </Animated.View>

        <Animated.View entering={section(1)}>
          <StatTrio streak={streak} points={user.points} rank={myEntry?.rank ?? null} totalRanked={totalRanked} />
        </Animated.View>

        <Animated.View entering={section(2)}>
          <CategorySection categories={categories} completedCount={completedCount} goldCount={goldCount} />
        </Animated.View>

        {others.length > 0 ? (
          <Animated.View entering={section(3)}>
            <OthersRow others={others} />
          </Animated.View>
        ) : null}

        <Animated.View entering={section(4)}>
          <SectionHeading>Siste innsendinger</SectionHeading>
        </Animated.View>
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

function Badge({ label, color, filled }: { label: string; color: string; filled?: boolean }) {
  return (
    <View
      style={[
        styles.badge,
        { borderColor: color },
        filled ? { backgroundColor: color } : null,
      ]}
    >
      <Text size="xs" weight="bold" color={filled ? 'inverse' : color}>
        {label}
      </Text>
    </View>
  )
}

function IdentityCard({ user }: { user: MeResponse['user'] }) {
  const russType = RUSS_TYPE_META[user.russType]
  const isLead = user.role === 'knutesjef' || user.role === 'admin'
  return (
    <Stack align="center" gap="sm" style={styles.heroCard}>
      <Stack align="center" justify="center" style={styles.avatar}>
        <Text size="3xl" weight="bold" color="inverse">
          {user.russenavn.slice(0, 1).toUpperCase()}
        </Text>
      </Stack>
      <Text size="2xl" weight="bold" align="center" accessibilityRole="header">
        {user.russenavn}
      </Text>
      <Stack direction="row" gap="xs" justify="center" style={styles.badgeRow}>
        <Badge label={ROLE_LABEL[user.role] ?? user.role} color={colors.ink} filled={isLead} />
        <Badge label={russType.label} color={russType.color} />
      </Stack>
      {user.quote ? (
        <View style={styles.quoteBubble}>
          <Text size="sm" color="secondary" align="center">
            {`“${user.quote}”`}
          </Text>
        </View>
      ) : null}
    </Stack>
  )
}

function StatTrio({
  streak,
  points,
  rank,
  totalRanked,
}: {
  streak: number
  points: number
  rank: number | null
  totalRanked: number
}) {
  return (
    <Stack direction="row" gap="sm" style={styles.statRow}>
      <StatCard
        value={<CountUp value={streak} size="2xl" weight="bold" color="warning" />}
        label="dagers streak"
        accessibilityLabel={`Streak: ${streak} dager`}
      />
      <StatCard
        value={<CountUp value={points} size="2xl" weight="bold" color="brand" />}
        label="poeng"
        accessibilityLabel={`${formatNumber(points)} poeng`}
      />
      <StatCard
        value={
          rank != null ? (
            <CountUp value={rank} prefix="#" size="2xl" weight="bold" color="ink" />
          ) : (
            <Text size="2xl" weight="bold" color="muted">
              –
            </Text>
          )
        }
        label={rank != null ? `av ${formatNumber(totalRanked)}` : 'plass'}
        accessibilityLabel={rank != null ? `Plass nummer ${rank} av ${totalRanked}` : 'Plass ukjent'}
      />
    </Stack>
  )
}

function StatCard({
  value,
  label,
  accessibilityLabel,
}: {
  value: ReactNode
  label: string
  accessibilityLabel: string
}) {
  return (
    <Stack align="center" gap="2xs" style={styles.statCard} accessibilityLabel={accessibilityLabel}>
      {value}
      <Text size="xs" color="muted" align="center">
        {label}
      </Text>
    </Stack>
  )
}

function CategorySection({
  categories,
  completedCount,
  goldCount,
}: {
  categories: MeResponse['categories']
  completedCount: number
  goldCount: number
}) {
  return (
    <View>
      <SectionHeading>Knote-kategorier</SectionHeading>
      <View style={styles.ringGrid}>
        {categories.map((ring) => {
          const meta = CATEGORY_META[ring.category]
          return (
            <CategoryRing
              key={ring.category}
              label={meta.label}
              completed={ring.completed}
              total={ring.total}
              color={meta.color}
            />
          )
        })}
      </View>
      <Stack direction="row" gap="sm" style={styles.tileRow}>
        <Stack align="center" gap="2xs" style={styles.tile} accessibilityLabel={`${completedCount} knuter fullført`}>
          <CountUp value={completedCount} size="xl" weight="bold" color="ink" />
          <Text size="xs" color="muted">
            knuter fullført
          </Text>
        </Stack>
        <Stack align="center" gap="2xs" style={styles.tile} accessibilityLabel={`${goldCount} gull-knuter`}>
          <CountUp value={goldCount} size="xl" weight="bold" color="warning" />
          <Text size="xs" color="muted">
            gull-knuter
          </Text>
        </Stack>
      </Stack>
    </View>
  )
}

function OthersRow({ others }: { others: LeaderboardEntry[] }) {
  return (
    <View>
      <SectionHeading>Andre på appen</SectionHeading>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.othersContent}
      >
        {others.map((entry) => (
          <Stack
            key={entry.userId}
            align="center"
            gap="xs"
            style={styles.otherCard}
            accessibilityLabel={`${entry.russenavn}, plass nummer ${entry.rank}`}
          >
            <Stack align="center" justify="center" style={styles.otherAvatar}>
              <Text size="lg" weight="bold" color="inverse">
                {entry.russenavn.slice(0, 1).toUpperCase()}
              </Text>
            </Stack>
            <Text size="xs" weight="medium" numberOfLines={1} align="center">
              {entry.russenavn}
            </Text>
            <Text size="xs" color="muted">
              #{formatNumber(entry.rank)}
            </Text>
          </Stack>
        ))}
      </ScrollView>
    </View>
  )
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <Text size="lg" weight="semibold" style={styles.sectionHeading}>
      {children}
    </Text>
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
    width: size.profileAvatar,
    height: size.profileAvatar,
    borderRadius: radius.full,
    backgroundColor: colors.brand.primary,
  },
  badgeRow: { flexWrap: 'wrap' },
  badge: {
    borderWidth: borderWidth.medium,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  quoteBubble: {
    marginTop: spacing.xs,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    alignSelf: 'stretch',
  },
  statRow: { marginHorizontal: spacing.base, marginTop: spacing.sm },
  statCard: {
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
  ringGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.base,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    marginHorizontal: spacing.base,
    borderRadius: radius.lg,
    borderWidth: borderWidth.thin,
    borderColor: colors.border,
  },
  tileRow: { marginHorizontal: spacing.base, marginTop: spacing.sm },
  tile: {
    flex: 1,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: borderWidth.thin,
    borderColor: colors.border,
  },
  othersContent: {
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
  },
  otherCard: {
    width: size.controlHeightLg,
  },
  otherAvatar: {
    width: size.otherAvatar,
    height: size.otherAvatar,
    borderRadius: radius.full,
    backgroundColor: colors.ink,
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
  skeletonAvatar: { width: size.profileAvatar, height: size.profileAvatar, borderRadius: radius.full },
  skeletonLineWide: { width: size.leaderboardSelectWidth, height: size.skeletonTitleHeight },
  skeletonLineNarrow: { width: size.skeletonTitleWidth, height: size.skeletonRowMetaHeight },
  skeletonStat: { flex: 1, height: size.emptyMinHeight / 2 },
})
