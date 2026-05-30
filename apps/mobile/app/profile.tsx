import { View, Text, ScrollView, StyleSheet, Pressable, RefreshControl } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Stack } from 'expo-router'
import { fetchMe, type MySubmission } from '../lib/api'
import { colors, spacing, radius, fontSize, fontWeight } from '../lib/theme'

const formatPoints = (n: number) => new Intl.NumberFormat('nb-NO').format(n)
const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('nb-NO', { day: 'numeric', month: 'short' }).format(new Date(iso))

const ROLE_LABEL: Record<string, string> = {
  student: 'russ',
  knutesjef: 'knutesjef',
  admin: 'admin',
}

const STATUS_META: Record<MySubmission['status'], { label: string; color: string; bg: string }> = {
  approved: { label: 'Godkjent', color: colors.success, bg: '#E8F7EE' },
  pending: { label: 'Venter', color: colors.warning, bg: '#FFF7E6' },
  rejected: { label: 'Avvist', color: colors.error, bg: '#FDECEC' },
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets()
  const { data, error, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['me'],
    queryFn: fetchMe,
  })

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Min profil' }} />
        <View style={styles.center}>
          <Text style={styles.muted}>Laster…</Text>
        </View>
      </>
    )
  }

  if (error || !data) {
    return (
      <>
        <Stack.Screen options={{ title: 'Min profil' }} />
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Kunne ikke laste profilen</Text>
          <Text style={styles.muted}>{(error as Error | undefined)?.message ?? 'Ukjent feil'}</Text>
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

  const { user, submissions, counts } = data

  return (
    <>
      <Stack.Screen options={{ title: 'Min profil' }} />
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
        <View style={styles.heroCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.russenavn.slice(0, 1).toUpperCase()}</Text>
          </View>
          <Text style={styles.russenavn} accessibilityRole="header">
            {user.russenavn}
          </Text>
          <Text style={styles.role}>{ROLE_LABEL[user.role] ?? user.role}</Text>

          <View style={styles.pointsRow}>
            <Text style={styles.pointsBig}>{formatPoints(user.points)}</Text>
            <Text style={styles.pointsLabel}>poeng totalt</Text>
          </View>
        </View>

        <View style={styles.statRow}>
          <StatBox count={counts.approved} label="godkjent" color={colors.success} />
          <StatBox count={counts.pending} label="venter" color={colors.warning} />
          <StatBox count={counts.rejected} label="avvist" color={colors.error} />
        </View>

        <Text style={styles.sectionHeading}>Siste innsendinger</Text>
        {submissions.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.muted}>Ingen innsendinger ennå.</Text>
          </View>
        ) : (
          submissions.map((s) => <SubmissionRow key={s.id} submission={s} />)
        )}
      </ScrollView>
    </>
  )
}

function StatBox({ count, label, color }: { count: number; label: string; color: string }) {
  return (
    <View style={styles.statBox} accessibilityLabel={`${count} ${label}`}>
      <Text style={[styles.statCount, { color }]}>{count}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

function SubmissionRow({ submission }: { submission: MySubmission }) {
  const meta = STATUS_META[submission.status]
  return (
    <View style={styles.subRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.subTitle} numberOfLines={2}>
          {submission.knuteTitle}
        </Text>
        <Text style={styles.subMeta}>
          {formatDate(submission.createdAt)} · {submission.knutePoints} p
        </Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
        <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  heroCard: {
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    backgroundColor: colors.surface,
    marginHorizontal: spacing.base,
    marginTop: spacing.base,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: {
    fontSize: fontSize['2xl'],
    color: colors.text.inverse,
    fontWeight: fontWeight.bold,
  },
  russenavn: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  role: {
    fontSize: fontSize.sm,
    color: colors.text.muted,
    marginTop: 2,
  },
  pointsRow: {
    alignItems: 'center',
    marginTop: spacing.base,
  },
  pointsBig: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: colors.brand.primary,
  },
  pointsLabel: {
    fontSize: fontSize.sm,
    color: colors.text.muted,
    marginTop: -spacing.xs,
  },
  statRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.base,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statCount: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginHorizontal: spacing.base,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  subRow: {
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
    gap: spacing.sm,
  },
  subTitle: {
    fontSize: fontSize.base,
    color: colors.text.primary,
    fontWeight: fontWeight.medium,
  },
  subMeta: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  center: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
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
