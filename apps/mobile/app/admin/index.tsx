import { View, Text, ScrollView, StyleSheet, Pressable, RefreshControl, ActivityIndicator } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Stack, Link, useRouter } from 'expo-router'
import { fetchAllKnuter, type Knute, ApiError } from '../../lib/api'
import { colors, spacing, radius, fontSize, fontWeight } from '../../lib/theme'

export default function KnutesjefPanel() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { data, error, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['knuter', 'all'],
    queryFn: fetchAllKnuter,
  })

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Knutesjef-panel' }} />
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
        <Stack.Screen options={{ title: 'Knutesjef-panel' }} />
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

  return (
    <>
      <Stack.Screen options={{ title: 'Knutesjef-panel' }} />
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
          <Text style={styles.heading}>Skolens knuter</Text>
          <Text style={styles.muted}>
            {active.length} aktive · {inactive.length} arkivert
          </Text>
        </View>

        <Link href="/admin/edit/new" asChild>
          <Pressable
            style={styles.newButton}
            accessibilityRole="link"
            accessibilityLabel="Lag ny knute"
          >
            <Text style={styles.newButtonText}>+ Ny knute</Text>
          </Pressable>
        </Link>

        {active.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.muted}>Ingen aktive knuter. Lag en med knappen over.</Text>
          </View>
        ) : (
          active.map((k) => (
            <KnuteRow key={k.id} knute={k} onPress={() => router.push(`/admin/edit/${k.id}`)} />
          ))
        )}

        {inactive.length > 0 && (
          <>
            <Text style={styles.sectionHeading}>Arkivert</Text>
            {inactive.map((k) => (
              <KnuteRow
                key={k.id}
                knute={k}
                inactive
                onPress={() => router.push(`/admin/edit/${k.id}`)}
              />
            ))}
          </>
        )}
      </ScrollView>
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
      accessibilityLabel={`Rediger ${knute.title}, ${knute.points} poeng, ${knute.difficulty}${inactive ? ', arkivert' : ''}`}
    >
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, inactive && styles.rowTextDim]} numberOfLines={2}>
          {knute.title}
        </Text>
        <View style={styles.rowMeta}>
          <View style={[styles.pointsBadge, inactive && styles.pointsBadgeDim]}>
            <Text style={styles.pointsText}>{knute.points} p</Text>
          </View>
          <Text style={[styles.difficulty, inactive && styles.rowTextDim]}>{knute.difficulty}</Text>
        </View>
      </View>
      <Text style={[styles.editArrow, inactive && styles.rowTextDim]}>›</Text>
    </Pressable>
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
    marginBottom: spacing.xs,
  },
  newButton: {
    backgroundColor: colors.brand.primary,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.base,
    marginBottom: spacing.base,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  newButtonText: {
    color: colors.text.inverse,
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.base,
  },
  sectionHeading: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.muted,
    marginHorizontal: spacing.base,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    gap: spacing.sm,
  },
  rowInactive: {
    backgroundColor: colors.background,
    borderStyle: 'dashed',
  },
  rowTitle: {
    fontSize: fontSize.base,
    color: colors.text.primary,
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
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  pointsBadgeDim: {
    backgroundColor: colors.text.muted,
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
  editArrow: {
    fontSize: fontSize.xl,
    color: colors.text.muted,
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
    marginTop: 2,
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
