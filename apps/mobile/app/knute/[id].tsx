import { useState } from 'react'
import {
  View,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Pressable, Text } from '../../components/primitives'
import { fetchKnuter, fetchMe, createSubmission } from '../../lib/api'
import { colors, spacing, radius, fontSize, fontWeight } from '../../lib/theme'

export default function KnuteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()
  const insets = useSafeAreaInsets()
  const [caption, setCaption] = useState('')

  const { data, isLoading } = useQuery({ queryKey: ['knuter'], queryFn: fetchKnuter })
  const knute = data?.knuter.find((k) => k.id === id)

  // Look up the user's prior submission for THIS knute to lock the form
  // proactively. The backend also enforces this (returns 409), but UX is
  // better if Send-inn just isn't tappable when it can't succeed.
  const me = useQuery({ queryKey: ['me'], queryFn: fetchMe })
  const prior = me.data?.submissions.find(
    (s) => s.knuteTitle && knute && s.knuteTitle === knute.title && (s.status === 'pending' || s.status === 'approved'),
  )
  // Note: matching by title is correct here because /api/me already filters
  // by user — and submissions only join in titles for the current user's school.
  const lockReason: string | null = prior
    ? prior.status === 'pending'
      ? 'Du har allerede sendt inn denne — venter på godkjenning.'
      : 'Du har allerede fått godkjent denne knuten.'
    : null

  const submit = useMutation({
    mutationFn: () => {
      if (!id) throw new Error('Mangler knute-id')
      // Placeholder imageKey until Bunny upload is wired up. The backend
      // currently accepts any non-empty string — that gets swapped for a
      // real signed-URL flow when storage is ready.
      const placeholderKey = `placeholder/${id}-${Date.now()}.webp`
      return createSubmission({
        knuteId: id,
        imageKey: placeholderKey,
        caption: caption.trim() || undefined,
      })
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['me'] })
      void qc.invalidateQueries({ queryKey: ['submissions', 'pending'] })
      void qc.invalidateQueries({ queryKey: ['submissions', 'pending', 'count'] })
      Alert.alert('Innsending lagret', 'Knutesjefen får den til godkjenning.', [
        { text: 'OK', onPress: () => router.back() },
      ])
    },
    onError: (err) => {
      Alert.alert('Kunne ikke sende inn', (err as Error).message)
    },
  })

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Knute' }} />
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand.primary} />
        </View>
      </>
    )
  }

  if (!knute) {
    return (
      <>
        <Stack.Screen options={{ title: 'Knute' }} />
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Fant ikke knuten</Text>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Tilbake"
          >
            <Text style={styles.backText}>Tilbake</Text>
          </Pressable>
        </View>
      </>
    )
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Send inn' }} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          padding: spacing.base,
          paddingBottom: insets.bottom + spacing.lg,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.knuteCard}>
          <Text style={styles.knuteTitle} accessibilityRole="header">
            {knute.title}
          </Text>
          {knute.description ? <Text style={styles.knuteDesc}>{knute.description}</Text> : null}
          <View style={styles.knuteMetaRow}>
            <View style={styles.pointsBadge}>
              <Text style={styles.pointsText}>{knute.points} p</Text>
            </View>
            <Text style={styles.difficulty}>{knute.difficulty}</Text>
          </View>
        </View>

        {lockReason && (
          <View style={styles.lockBanner} accessibilityRole="alert">
            <Text style={styles.lockBannerText}>{lockReason}</Text>
          </View>
        )}

        <View style={styles.imagePlaceholder}>
          <Text style={styles.cameraIcon}>📷</Text>
          <Text style={styles.muted}>Bilde-opplasting kommer snart</Text>
        </View>

        <Text style={styles.label}>Beskrivelse (valgfritt)</Text>
        <TextInput
          style={[styles.input, lockReason && styles.inputDisabled]}
          value={caption}
          onChangeText={setCaption}
          placeholder="Hva gjorde du? Hvem var med?"
          placeholderTextColor={colors.text.muted}
          multiline
          maxLength={500}
          editable={!lockReason}
          accessibilityLabel="Skriv en beskrivelse"
        />
        <Text style={styles.charCount}>{caption.length}/500</Text>

        <Pressable
          style={[
            styles.submitButton,
            (submit.isPending || lockReason !== null) && styles.buttonDisabled,
          ]}
          onPress={() => submit.mutate()}
          disabled={submit.isPending || lockReason !== null}
          accessibilityRole="button"
          accessibilityLabel={lockReason ? 'Send inn (låst)' : 'Send inn knute'}
        >
          <Text style={styles.submitText}>
            {lockReason
              ? 'Allerede sendt inn'
              : submit.isPending
                ? 'Sender inn…'
                : 'Send inn'}
          </Text>
        </Pressable>

        <Pressable
          style={styles.cancelButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Avbryt"
          disabled={submit.isPending}
        >
          <Text style={styles.cancelText}>Avbryt</Text>
        </Pressable>
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  knuteCard: {
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.base,
  },
  knuteTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  knuteDesc: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  knuteMetaRow: {
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
  imagePlaceholder: {
    height: 140,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
  },
  cameraIcon: {
    fontSize: 36,
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.base,
    fontSize: fontSize.base,
    color: colors.text.primary,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
    textAlign: 'right',
    marginTop: spacing.xs,
    marginBottom: spacing.base,
  },
  submitButton: {
    backgroundColor: colors.brand.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  submitText: {
    color: colors.text.inverse,
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.base,
  },
  cancelButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  cancelText: {
    color: colors.text.secondary,
    fontSize: fontSize.base,
  },
  buttonDisabled: { opacity: 0.5 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
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
  },
  backButton: {
    marginTop: spacing.base,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  backText: {
    color: colors.text.primary,
    fontWeight: fontWeight.semibold,
  },
  lockBanner: {
    backgroundColor: '#FFF7E6',
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
    padding: spacing.base,
    borderRadius: radius.md,
    marginBottom: spacing.base,
  },
  lockBannerText: {
    color: colors.text.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  inputDisabled: {
    backgroundColor: colors.background,
    color: colors.text.muted,
  },
})
