import { type ReactNode, useState } from 'react'
import { ScrollView, StyleSheet, TextInput, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import * as ImageManipulator from 'expo-image-manipulator'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated'
import { Check, Clock } from 'lucide-react-native'
import {
  Eyebrow,
  Skeleton,
  StickerButton,
  StickerCard,
  Text,
  Toast,
  useToast,
} from '../../components/primitives'
import { KnutePreviewCard } from '../../components/submit/KnutePreviewCard'
import { PhotoEvidence } from '../../components/submit/PhotoEvidence'
import {
  createSubmission,
  fetchKnuter,
  fetchMe,
  fetchUploadUrl,
  uploadImageBinary,
} from '../../lib/api'
import { haptics } from '../../lib/haptics'
import { animation, fontSize, size, spacing, sticker } from '../../lib/theme'

// Photos are compressed to ~1MB before upload: resize to max 1280px wide, JPEG
// at 0.6 quality. Keeps uploads fast on school WiFi and CDN bandwidth low.
const MAX_WIDTH = 1280
const JPEG_QUALITY = 0.6
const MAX_CAPTION = 500

const screenOptions = {
  title: 'Send inn',
  headerStyle: { backgroundColor: sticker.color.paper },
  headerTintColor: sticker.color.ink,
  headerShadowVisible: false,
} as const

export default function KnuteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()
  const insets = useSafeAreaInsets()
  const toast = useToast()

  const [caption, setCaption] = useState('')
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [picking, setPicking] = useState(false)

  const { data, isLoading } = useQuery({ queryKey: ['knuter'], queryFn: fetchKnuter })
  const knute = data?.knuter.find((k) => k.id === id)
  // Text-only knuter (Sex folder, lapdances) are submitted with a written caption,
  // no photo (ADR-0014). The whole image flow is hidden + the caption is required.
  const isText = knute?.evidenceType === 'text'

  // Look up the user's prior submission for THIS knute to lock the form
  // proactively. The backend also enforces this (returns 409), but UX is better
  // if Send-inn just isn't tappable when it can't succeed. Match by knute ID, NOT
  // title — two knuter can share a title and a title match would wrongly lock (H-7).
  const me = useQuery({ queryKey: ['me'], queryFn: fetchMe })
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
        toast.show(
          source === 'camera'
            ? 'Gi Knuteloop tilgang til kameraet i Innstillinger.'
            : 'Gi Knuteloop tilgang til bildene i Innstillinger.',
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
      toast.show((err as Error).message)
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
      // The catalog carries myStatus (Tilgjengelige/Fullført) — refresh it so the
      // knute moves to «Fullført» the moment you land back, no manual refresh.
      // Prefix match also covers the per-folder entries ['knuter', 'folder', id].
      void qc.invalidateQueries({ queryKey: ['knuter'] })
    },
    onError: (err) => toast.show((err as Error).message),
  })

  if (isLoading) {
    return (
      <View style={styles.root}>
        <Stack.Screen options={screenOptions} />
        <View style={styles.content}>
          <Skeleton style={styles.skelCard} />
          <Skeleton style={styles.skelWell} />
          <Skeleton style={styles.skelField} />
        </View>
      </View>
    )
  }

  if (!knute) {
    return (
      <View style={styles.root}>
        <Stack.Screen options={screenOptions} />
        <CenterState
          title="Fant ikke knuten"
          body="Den kan ha blitt arkivert eller fjernet."
          actionLabel="Tilbake"
          onAction={() => router.back()}
        />
      </View>
    )
  }

  if (submit.isSuccess) {
    return (
      <View style={styles.root}>
        <Stack.Screen options={{ ...screenOptions, headerBackVisible: false }} />
        <CenterState
          icon={
            <View style={styles.successCircle}>
              <Check size={sticker.icon.lg} color={sticker.color.success} strokeWidth={3} />
            </View>
          }
          title="Sendt til godkjenning!"
          body={`Knutesjefen får «${knute.title}» til vurdering. Du får varsel når den er godkjent.`}
          actionLabel="Ferdig"
          actionVariant="accent"
          onAction={() => router.back()}
        />
      </View>
    )
  }

  const busy = submit.isPending
  const canSubmit =
    (isText ? caption.trim().length > 0 : imageUri !== null) && lockReason === null && !busy

  const submitLabel = lockReason
    ? 'Allerede sendt inn'
    : busy
      ? 'Sender inn…'
      : isText
        ? caption.trim().length === 0
          ? 'Skriv en beskrivelse'
          : 'Send inn'
        : !imageUri
          ? 'Legg til et bilde'
          : 'Send inn'

  return (
    <View style={styles.root}>
      <Stack.Screen options={screenOptions} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <Eyebrow>Valgt knute</Eyebrow>
          <KnutePreviewCard knute={knute} />
        </View>

        {lockReason ? (
          <StickerCard tone="soft" radius="md" shadow="sm" padding="md">
            <View style={styles.lockRow}>
              <Clock size={sticker.icon.md} color={sticker.color.warning} strokeWidth={2} />
              <Text size="sm" weight="semibold" color={sticker.color.ink} style={styles.flex}>
                {lockReason}
              </Text>
            </View>
          </StickerCard>
        ) : null}

        <View style={styles.section}>
          <Eyebrow>Bevis</Eyebrow>
          {isText ? (
            <StickerCard tone="soft" radius="md" shadow="sm" padding="base">
              <Text size="sm" color={sticker.color.text}>
                Denne knuten sendes inn med tekst — ikke bilde. Skriv kort hva du gjorde under.
              </Text>
            </StickerCard>
          ) : (
            <PhotoEvidence
              imageUri={imageUri}
              picking={picking}
              disabled={lockReason !== null}
              onPickCamera={() => void pickImage('camera')}
              onPickLibrary={() => void pickImage('library')}
              onRemove={() => setImageUri(null)}
            />
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.captionHeader}>
            <Eyebrow>{isText ? 'Beskrivelse (påkrevd)' : 'Beskrivelse (valgfritt)'}</Eyebrow>
            <Text size="xs" font="mono" color={sticker.color.textMuted}>
              {caption.length}/{MAX_CAPTION}
            </Text>
          </View>
          <TextInput
            style={[styles.input, lockReason ? styles.inputDisabled : null]}
            value={caption}
            onChangeText={setCaption}
            placeholder="Hva gjorde du? Hvem var med?"
            placeholderTextColor={sticker.color.textMuted}
            multiline
            maxLength={MAX_CAPTION}
            editable={!lockReason}
            accessibilityLabel="Skriv en beskrivelse"
          />
        </View>

        <View style={styles.actions}>
          <StickerButton
            label={submitLabel}
            variant="accent"
            fullWidth
            loading={busy}
            disabled={!canSubmit}
            icon={
              canSubmit ? (
                <Check size={sticker.icon.md} color={sticker.color.ink} strokeWidth={2.5} />
              ) : undefined
            }
            onPress={() => submit.mutate()}
          />
          <StickerButton
            label="Avbryt"
            variant="ghost"
            fullWidth
            disabled={busy}
            onPress={() => router.back()}
          />
        </View>
      </ScrollView>
      <Toast message={toast.message} bottomOffset={insets.bottom + spacing.lg} />
    </View>
  )
}

// Centered single-card state (not-found + post-submit success). Fades in for a
// little polish; respects reduced motion.
function CenterState({
  icon,
  title,
  body,
  actionLabel,
  actionVariant = 'secondary',
  onAction,
}: {
  icon?: ReactNode
  title: string
  body: string
  actionLabel: string
  actionVariant?: 'accent' | 'secondary'
  onAction: () => void
}) {
  const reduceMotion = useReducedMotion()
  return (
    <View style={styles.centered}>
      <Animated.View
        entering={reduceMotion ? undefined : FadeInDown.duration(animation.duration.base)}
        style={styles.centerCard}
      >
        <StickerCard tone="surface" radius="xl" shadow="lg">
          <View style={styles.cardInner}>
            {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
            <Text
              font="display"
              weight="bold"
              size="2xl"
              color={sticker.color.ink}
              align="center"
              accessibilityRole="header"
            >
              {title}
            </Text>
            <Text size="base" color={sticker.color.textMuted} align="center">
              {body}
            </Text>
            <StickerButton label={actionLabel} variant={actionVariant} fullWidth onPress={onAction} />
          </View>
        </StickerCard>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: sticker.color.paper },
  content: { padding: spacing.base, gap: spacing.lg },
  section: { gap: spacing.sm },
  flex: { flex: 1 },
  lockRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  captionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  input: {
    backgroundColor: sticker.color.card,
    borderWidth: sticker.borderWidth,
    borderColor: sticker.color.ink,
    borderRadius: sticker.radius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontSize: fontSize.base,
    fontFamily: 'Inter_400Regular',
    color: sticker.color.text,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputDisabled: { backgroundColor: sticker.color.surfaceSoft, color: sticker.color.textMuted },
  actions: { gap: spacing.sm, marginTop: spacing.xs },
  // Centered states
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  centerCard: { width: '100%' },
  cardInner: { gap: spacing.base },
  iconWrap: { alignItems: 'center' },
  successCircle: {
    width: size.profileAvatar,
    height: size.profileAvatar,
    borderRadius: sticker.radius.full,
    borderWidth: sticker.borderWidth,
    borderColor: sticker.color.ink,
    backgroundColor: sticker.color.successBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Loading skeletons
  skelCard: { height: 96, borderRadius: sticker.radius.lg },
  skelWell: { height: size.emptyMinHeight, borderRadius: sticker.radius.lg },
  skelField: { height: 100, borderRadius: sticker.radius.md },
})
