import { View, ScrollView, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Stack, useRouter } from 'expo-router'
import { AppTabBar } from '../../components/AppTabBar'
import { Pressable, Text } from '../../components/primitives'
import { ApiError, fetchAllKnuter, tryFetchPendingCount, type Knute } from '../../lib/api'
import { formatNumber } from '../../lib/format'
import { borderWidth, colors, fontSize, fontWeight, radius, size, spacing } from '../../lib/theme'

export default function KnutesjefPanel() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { data, error, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['knuter', 'all'],
    queryFn: fetchAllKnuter,
  })
  const pendingCount = useQuery({
    queryKey: ['submissions', 'pending', 'count'],
    queryFn: tryFetchPendingCount,
    staleTime: 10_000,
  })

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Knutesjef' }} />
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand.primary} />
        </View>
      </>
    )
  }

  if (error) {
    const isForbidden = error instanceof ApiError && error.status === 403
    return (
      <>
        <Stack.Screen options={{ title: 'Knutesjef' }} />
        <View style={styles.center}>
          <Text style={styles.errorTitle}>
            {isForbidden ? 'Du må være knutesjef' : 'Kunne ikke laste knutene'}
          </Text>
          <Text style={styles.muted}>
            {isForbidden ? 'Denne siden er kun for knutesjefer.' : (error as Error).message}
          </Text>
          {!isForbidden && (
            <Pressable
              style={styles.retryButton}
              onPress={() => void refetch()}
              accessibilityRole="button"
              accessibilityLabel="Prøv igjen"
            >
              <Text style={styles.retryText}>Prøv igjen</Text>
            </Pressable>
          )}
        </View>
      </>
    )
  }

  const allKnuter = data?.knuter ?? []
  const active = allKnuter.filter((k) => k.isActive)
  const inactive = allKnuter.filter((k) => !k.isActive)
  const pendingLabel =
    pendingCount.data === 1
      ? '1 innsending venter'
      : `${formatNumber(pendingCount.data ?? spacing.none)} innsendinger venter`
  const bottomPadding = insets.bottom + size.bottomNavMinHeight + spacing.xl

  return (
    <>
      <Stack.Screen options={{ title: 'Knutesjef' }} />
      <View style={styles.root}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: bottomPadding }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => void refetch()}
              tintColor={colors.brand.primary}
            />
          }
        >
          <View style={styles.header}>
            <Text style={styles.heading}>Knutesjef</Text>
            <Text style={styles.muted}>Innsendinger, knuter og verktøy for skolen.</Text>
          </View>

          <View style={styles.toolPanel}>
            <Pressable
              style={styles.toolRow}
              onPress={() => router.push('/review')}
              accessibilityRole="link"
              accessibilityLabel={pendingLabel}
              accessibilityHint="Åpner innsendinger som venter på godkjenning."
            >
              <View style={styles.toolTextBlock}>
                <Text style={styles.toolTitle}>Innsendinger</Text>
                <Text style={styles.toolMeta}>{pendingLabel}</Text>
              </View>
              <Text style={styles.toolArrow}>›</Text>
            </Pressable>

            <Pressable
              style={[styles.toolRow, styles.toolRowLast]}
              onPress={() => router.push('/admin/edit/new')}
              accessibilityRole="link"
              accessibilityLabel="Lag ny knute"
              accessibilityHint="Åpner skjema for å lage en ny knute."
            >
              <View style={styles.toolTextBlock}>
                <Text style={styles.toolTitle}>Ny knute</Text>
                <Text style={styles.toolMeta}>Legg til et nytt oppdrag for skolen.</Text>
              </View>
              <Text style={styles.toolArrow}>›</Text>
            </Pressable>
          </View>

          <View style={styles.header}>
            <Text style={styles.subHeading}>Skolens knuter</Text>
            <Text style={styles.muted}>
              {formatNumber(active.length)} aktive · {formatNumber(inactive.length)} arkivert
            </Text>
          </View>

          {active.length === spacing.none ? (
            <View style={styles.center}>
              <Text style={styles.muted}>Ingen aktive knuter. Lag en med knappen over.</Text>
            </View>
          ) : (
            active.map((knute) => (
              <KnuteRow
                key={knute.id}
                knute={knute}
                onPress={() => router.push(`/admin/edit/${knute.id}`)}
              />
            ))
          )}

          {inactive.length > spacing.none && (
            <>
              <Text style={styles.sectionHeading}>Arkivert</Text>
              {inactive.map((knute) => (
                <KnuteRow
                  key={knute.id}
                  knute={knute}
                  inactive
                  onPress={() => router.push(`/admin/edit/${knute.id}`)}
                />
              ))}
            </>
          )}
        </ScrollView>
        <AppTabBar active="knutesjef" />
      </View>
    </>
  )
}

function KnuteRow({
  knute,
  inactive,
  onPress,
}: {
  knute: Knute
  inactive?: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      style={[styles.row, inactive && styles.rowInactive]}
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={`Rediger ${knute.title}, ${formatNumber(knute.points)} poeng, ${knute.difficulty}${inactive ? ', arkivert' : ''}`}
    >
      <View style={styles.rowTextBlock}>
        <Text style={[styles.rowTitle, inactive && styles.rowTextDim]} numberOfLines={2}>
          {knute.title}
        </Text>
        <View style={styles.rowMeta}>
          <View style={[styles.pointsBadge, inactive && styles.pointsBadgeDim]}>
            <Text style={styles.pointsText}>{formatNumber(knute.points)} p</Text>
          </View>
          <Text style={[styles.difficulty, inactive && styles.rowTextDim]}>{knute.difficulty}</Text>
        </View>
      </View>
      <Text style={[styles.editArrow, inactive && styles.rowTextDim]}>›</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
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
    color: colors.text.primary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.xs,
  },
  subHeading: {
    color: colors.text.primary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.xs,
  },
  toolPanel: {
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: borderWidth.medium,
    borderColor: colors.borderInk,
    borderRadius: radius.lg,
    marginHorizontal: spacing.base,
    marginBottom: spacing.base,
  },
  toolRow: {
    minHeight: size.bottomNavMinHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: borderWidth.thin,
    borderBottomColor: colors.border,
  },
  toolRowLast: {
    borderBottomWidth: borderWidth.none,
  },
  toolTextBlock: {
    flex: 1,
    gap: spacing['2xs'],
  },
  toolTitle: {
    color: colors.ink,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  toolMeta: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
  },
  toolArrow: {
    color: colors.ink,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  sectionHeading: {
    color: colors.text.muted,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    marginHorizontal: spacing.base,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    marginHorizontal: spacing.base,
    marginBottom: spacing.sm,
    borderWidth: borderWidth.thin,
    borderColor: colors.border,
  },
  rowInactive: {
    backgroundColor: colors.background,
    borderStyle: 'dashed',
  },
  rowTextBlock: {
    flex: 1,
  },
  rowTitle: {
    color: colors.text.primary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.xs,
  },
  rowTextDim: {
    color: colors.text.muted,
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pointsBadge: {
    backgroundColor: colors.brand.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing['2xs'],
    borderRadius: radius.sm,
  },
  pointsBadgeDim: {
    backgroundColor: colors.text.muted,
  },
  pointsText: {
    color: colors.text.inverse,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  difficulty: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
  },
  editArrow: {
    color: colors.text.muted,
    fontSize: fontSize.xl,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    minHeight: size.emptyMinHeight,
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
    marginTop: spacing['2xs'],
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
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
})
