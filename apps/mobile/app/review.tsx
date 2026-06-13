import { View, ScrollView, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Stack } from 'expo-router'
import { Pressable, Text } from '../components/primitives'
import {
  fetchPendingSubmissions,
  approveSubmission,
  rejectSubmission,
  ApiError,
  type PendingSubmission,
} from '../lib/api'
import { colors, spacing, radius, fontSize, fontWeight } from '../lib/theme'

export default function ReviewScreen() {
  const insets = useSafeAreaInsets()
  const qc = useQueryClient()

  const { data, error, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['submissions', 'pending'],
    queryFn: fetchPendingSubmissions,
  })

  const approve = useMutation({
    mutationFn: approveSubmission,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['submissions', 'pending'] })
    },
  })

  const reject = useMutation({
    mutationFn: rejectSubmission,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['submissions', 'pending'] })
    },
  })

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Til godkjenning' }} />
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand.primary} />
        </View>
      </>
    )
  }

  if (error) {
    return (
      <>
        <Stack.Screen options={{ title: 'Til godkjenning' }} />
        <ErrorState
          message={
            error instanceof ApiError && error.status === 403
              ? 'Du må være knutesjef for å se denne siden.'
              : (error as Error).message
          }
          onRetry={error instanceof ApiError && error.status === 403 ? undefined : () => void refetch()}
        />
      </>
    )
  }

  const pending = data?.submissions ?? []

  return (
    <>
      <Stack.Screen options={{ title: 'Til godkjenning' }} />
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
          <Text style={styles.heading}>
            {pending.length} {pending.length === 1 ? 'venter' : 'venter'}
          </Text>
        </View>

        {pending.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.muted}>Ingenting å godkjenne. Bra jobbet, knutesjef.</Text>
          </View>
        ) : (
          pending.map((s) => (
            <PendingCard
              key={s.id}
              submission={s}
              onApprove={() => approve.mutate(s.id)}
              onReject={() => reject.mutate(s.id)}
              busy={
                (approve.isPending && approve.variables === s.id) ||
                (reject.isPending && reject.variables === s.id)
              }
            />
          ))
        )}
      </ScrollView>
    </>
  )
}

function PendingCard({
  submission,
  onApprove,
  onReject,
  busy,
}: {
  submission: PendingSubmission
  onApprove: () => void
  onReject: () => void
  busy: boolean
}) {
  return (
    <View
      style={styles.card}
      accessibilityLabel={`Innsending fra ${submission.russenavn} for ${submission.knuteTitle}, ${submission.knutePoints} poeng`}
    >
      <Text style={styles.cardTitle}>{submission.knuteTitle}</Text>
      <View style={styles.metaRow}>
        <Text style={styles.muted}>Fra </Text>
        <Text style={styles.russenavn}>{submission.russenavn}</Text>
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsText}>{submission.knutePoints} p</Text>
        </View>
      </View>
      {submission.caption ? <Text style={styles.caption}>{submission.caption}</Text> : null}

      <View style={styles.actions}>
        <Pressable
          style={[styles.button, styles.rejectButton, busy && styles.buttonDisabled]}
          onPress={onReject}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="Avvis"
        >
          <Text style={styles.rejectText}>Avvis</Text>
        </Pressable>
        <Pressable
          style={[styles.button, styles.approveButton, busy && styles.buttonDisabled]}
          onPress={onApprove}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="Godkjenn"
        >
          <Text style={styles.approveText}>Godkjenn</Text>
        </Pressable>
      </View>
    </View>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.center}>
      <Text style={styles.errorTitle}>Kan ikke vise godkjenningskøen</Text>
      <Text style={styles.muted}>{message}</Text>
      {onRetry && (
        <Pressable
          style={styles.retryButton}
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Prøv igjen"
        >
          <Text style={styles.retryText}>Prøv igjen</Text>
        </Pressable>
      )}
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
  card: {
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: radius.md,
    marginHorizontal: spacing.base,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: fontSize.base,
    color: colors.text.primary,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  russenavn: {
    fontSize: fontSize.sm,
    color: colors.text.primary,
    fontWeight: fontWeight.medium,
    marginRight: spacing.sm,
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
  caption: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    fontStyle: 'italic',
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  approveButton: { backgroundColor: colors.success },
  rejectButton: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong },
  approveText: { color: colors.text.inverse, fontWeight: fontWeight.semibold, fontSize: fontSize.base },
  rejectText: { color: colors.text.primary, fontWeight: fontWeight.medium, fontSize: fontSize.base },
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
