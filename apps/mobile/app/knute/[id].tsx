import { useState } from 'react'
import {
  View,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import * as ImageManipulator from 'expo-image-manipulator'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Pressable, Text } from '../../components/primitives'
import { createSubmission, fetchKnuter, fetchMe, fetchUploadUrl, uploadImageBinary } from '../../lib/api'
import { haptics } from '../../lib/haptics'
import { colors, spacing, radius, fontSize, fontWeight, size } from '../../lib/theme'

// Photos are compressed to ~1MB before upload: resize to max 1280px wide, JPEG
// at 0.6 quality. Keeps uploads fast on school WiFi and CDN bandwidth low.
const MAX_WIDTH = 1280
const JPEG_QUALITY = 0.6

export default function KnuteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()
  const insets = useSafeAreaInsets()
  const [caption, setCaption] = useState('')
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [picking, setPicking] = useState(false)

  const { data, isLoading } = useQuery({ queryKey: ['knuter'], queryFn: fetchKnuter })
  const knute = data?.knuter.find((k) => k.id === id)
  // Text-only knuter (Sex folder, lapdances) are submitted with a written caption,
  // no photo (ADR-0014). The whole image flow is hidden + the caption is required.
  const isText = knute?.evidenceType === 'text'

  // Look up the user's prior submission for THIS knute to lock the form
  // proactively. The backend also enforces this (returns 409), but UX is
  // better if Send-inn just isn't tappable when it can't succeed.
  const me = useQuery({ queryKey: ['me'], queryFn: fetchMe })
  // Match the prior submission by knute ID, NOT title — two knuter can share a
  // title, and a title match would wrongly lock the form for the other one (H-7).
  const prior = me.data?.submissions.find(
    (s) => knute && s.knuteId === knute.id && (s.status === 'pending' || s.status === 'approved'),
  )
  const lockReason: string | null = prior
    ? prior.status === 'pending'
      ? 'Du har allerede sendt inn denne — venter på godkjenning.'
      : 'Du har allerede fått godkjent denne knuten.'
    : null

  async function pickImage(source: 'camera' | 'library') {
    try {
      setPicking(true)
      const perm =
        source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!perm.granted) {
        Alert.alert(
          'Mangler tilgang',
          source === 'camera'
            ? 'Gi Knuteloop tilgang til kameraet i Innstillinger for å ta bilde.'
            : 'Gi Knuteloop tilgang til bildene i Innstillinger for å velge et bilde.',
        )
        return
      }
      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 })
          : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 })
      const asset = result.canceled ? null : result.assets[0]
      if (!asset) return

      const compressed = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: MAX_WIDTH } }],
        { compress: JPEG_QUALITY, format: ImageManipulator.SaveFormat.JPEG },
      )
      setImageUri(compressed.uri)
      void haptics.selection()
    } catch (err) {
      Alert.alert('Noe gikk galt', (err as Error).message)
    } finally {
      setPicking(false)
    }
  }

  const submit = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error('Mangler knute-id')
      // Text-only knute: the caption is the evidence — no upload, no imageKey.
      if (isText) {
        if (!caption.trim()) throw new Error('Skriv en kort beskrivelse')
        return createSubmission({ knuteId: id, caption: caption.trim() })
      }
      if (!imageUri) throw new Error('Velg eller ta et bilde først')
      // upload-url → PUT the compressed photo → create the submission with the key.
      const { uploadUrl, imageKey } = await fetchUploadUrl()
      await uploadImageBinary(uploadUrl, imageUri)
      return createSubmission({ knuteId: id, imageKey, caption: caption.trim() || undefined })
    },
    onSuccess: () => {
      void haptics.success()
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

  const busy = submit.isPending
  const canSubmit =
    (isText ? caption.trim().length > 0 : imageUri !== null) && lockReason === null && !busy

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
        <View style={[styles.knuteCard, knute.isGold && styles.knuteCardGold]}>
          <Text style={styles.knuteTitle} accessibilityRole="header">
            {knute.title}
          </Text>
          {knute.description ? <Text style={styles.knuteDesc}>{knute.description}</Text> : null}
          <View style={styles.knuteMetaRow}>
            <View style={[styles.pointsBadge, knute.isGold && styles.pointsBadgeGold]}>
              <Text style={styles.pointsText}>{knute.points} p</Text>
            </View>
            <Text style={styles.difficulty}>{knute.difficulty}</Text>
            {knute.isGold ? (
              <View style={styles.goldPill} accessibilityLabel="Gullknute">
                <Text style={styles.goldPillText}>★ Gull</Text>
              </View>
            ) : null}
          </View>
        </View>

        {lockReason && (
          <View style={styles.lockBanner} accessibilityRole="alert">
            <Text style={styles.lockBannerText}>{lockReason}</Text>
          </View>
        )}

        {isText ? (
          <View style={styles.textNote}>
            <Text style={styles.textNoteText}>
              Denne knuten sendes inn med tekst — ikke bilde. Skriv kort hva du gjorde i
              beskrivelsen under.
            </Text>
          </View>
        ) : imageUri ? (
          <View style={styles.previewWrap}>
            <Image
              source={{ uri: imageUri }}
              style={styles.preview}
              contentFit="cover"
              transition={150}
              accessibilityRole="image"
              accessibilityLabel="Valgt bilde"
            />
            {!lockReason ? (
              <Pressable
                style={styles.changeButton}
                onPress={() => void pickImage('library')}
                disabled={picking}
                accessibilityRole="button"
                accessibilityLabel="Bytt bilde"
              >
                <Text style={styles.changeText}>Bytt bilde</Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <View style={styles.pickRow}>
            <Pressable
              style={[styles.pickButton, (picking || lockReason !== null) && styles.buttonDisabled]}
              onPress={() => void pickImage('camera')}
              disabled={picking || lockReason !== null}
              accessibilityRole="button"
              accessibilityLabel="Ta bilde med kamera"
              accessibilityHint="Åpner kameraet for å ta bilde av knuten."
            >
              <Text style={styles.pickIcon}>📷</Text>
              <Text style={styles.pickText}>Ta bilde</Text>
            </Pressable>
            <Pressable
              style={[styles.pickButton, (picking || lockReason !== null) && styles.buttonDisabled]}
              onPress={() => void pickImage('library')}
              disabled={picking || lockReason !== null}
              accessibilityRole="button"
              accessibilityLabel="Velg bilde fra galleri"
              accessibilityHint="Åpner bildegalleriet."
            >
              <Text style={styles.pickIcon}>🖼️</Text>
              <Text style={styles.pickText}>Velg fra galleri</Text>
            </Pressable>
          </View>
        )}
        {picking ? (
          <Text style={styles.pickingHint}>Behandler bilde…</Text>
        ) : null}

        <Text style={styles.label}>
          {isText ? 'Beskrivelse (påkrevd)' : 'Beskrivelse (valgfritt)'}
        </Text>
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
          style={[styles.submitButton, !canSubmit && styles.buttonDisabled]}
          onPress={() => submit.mutate()}
          disabled={!canSubmit}
          accessibilityRole="button"
          accessibilityLabel={lockReason ? 'Send inn (låst)' : 'Send inn knute'}
        >
          <Text style={styles.submitText}>
            {lockReason
              ? 'Allerede sendt inn'
              : busy
                ? 'Sender inn…'
                : isText
                  ? caption.trim().length === 0
                    ? 'Skriv en beskrivelse'
                    : 'Send inn'
                  : !imageUri
                    ? 'Legg til et bilde'
                    : 'Send inn'}
          </Text>
        </Pressable>

        <Pressable
          style={styles.cancelButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Avbryt"
          disabled={busy}
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
  knuteCardGold: {
    borderColor: colors.gold,
    backgroundColor: colors.goldSoft,
  },
  pointsBadgeGold: {
    backgroundColor: colors.gold,
  },
  goldPill: {
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  goldPillText: {
    color: colors.text.inverse,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
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
  pickRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.base,
  },
  pickButton: {
    flex: 1,
    height: size.emptyMinHeight / 1.6,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  pickIcon: {
    fontSize: fontSize['2xl'],
  },
  pickText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    fontWeight: fontWeight.medium,
  },
  pickingHint: {
    fontSize: fontSize.sm,
    color: colors.text.muted,
    textAlign: 'center',
    marginBottom: spacing.base,
  },
  textNote: {
    backgroundColor: colors.knuter.canvas,
    borderRadius: radius.md,
    padding: spacing.base,
    marginBottom: spacing.base,
  },
  textNoteText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  previewWrap: {
    marginBottom: spacing.base,
  },
  preview: {
    width: '100%',
    height: size.emptyMinHeight,
    borderRadius: radius.md,
    backgroundColor: colors.knuter.divider,
  },
  changeButton: {
    alignSelf: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  changeText: {
    fontSize: fontSize.sm,
    color: colors.ink,
    fontWeight: fontWeight.semibold,
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
    backgroundColor: colors.status.pendingBg,
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
