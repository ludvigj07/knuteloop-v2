import { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  Pressable,
  Skeleton,
  StickerButton,
  StickerCard,
  Text,
  Toast,
  useToast,
} from '../../../components/primitives'
import {
  fetchAllKnuter,
  createKnute,
  updateKnute,
  type CreateKnuteInput,
  type UpdateKnuteInput,
} from '../../../lib/api'
import { fontSize, sticker, spacing } from '../../../lib/theme'

type Difficulty = 'Lett' | 'Medium' | 'Hard' | 'Valgfri'
const DIFFICULTIES: Difficulty[] = ['Lett', 'Medium', 'Hard', 'Valgfri']

export default function EditKnuteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()
  const insets = useSafeAreaInsets()
  const toast = useToast()
  const isNew = id === 'new'

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [pointsText, setPointsText] = useState('10')
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium')
  const [isGold, setIsGold] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [loaded, setLoaded] = useState(false)

  const list = useQuery({ queryKey: ['knuter', 'all'], queryFn: fetchAllKnuter, enabled: !isNew })

  useEffect(() => {
    if (isNew || loaded) return
    const k = list.data?.knuter.find((row) => row.id === id)
    if (!k) return
    setTitle(k.title)
    setDescription(k.description ?? '')
    setPointsText(String(k.points))
    setDifficulty(k.difficulty)
    setIsGold(k.isGold)
    setIsActive(k.isActive)
    setLoaded(true)
  }, [id, isNew, list.data, loaded])

  const invalidateAll = () => {
    void qc.invalidateQueries({ queryKey: ['knuter'] })
    void qc.invalidateQueries({ queryKey: ['folders'] })
  }

  const create = useMutation({
    mutationFn: (input: CreateKnuteInput) => createKnute(input),
    onSuccess: () => {
      invalidateAll()
      router.back()
    },
    onError: (err) => toast.show((err as Error).message),
  })

  const update = useMutation({
    mutationFn: (input: UpdateKnuteInput) => updateKnute(id!, input),
    onSuccess: () => {
      invalidateAll()
      router.back()
    },
    onError: (err) => toast.show((err as Error).message),
  })

  const busy = create.isPending || update.isPending

  const screen = (
    <Stack.Screen
      options={{
        title: isNew ? 'Ny knute' : 'Rediger knute',
        headerStyle: { backgroundColor: sticker.color.paper },
        headerTintColor: sticker.color.ink,
        headerShadowVisible: false,
      }}
    />
  )

  if (!isNew && !loaded) {
    return (
      <View style={styles.root}>
        {screen}
        <View style={styles.form}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} style={styles.skeletonField} />
          ))}
        </View>
      </View>
    )
  }

  function handleSubmit() {
    const titleTrim = title.trim()
    if (!titleTrim) {
      toast.show('Knuten må ha en tittel.')
      return
    }
    const points = Number.parseInt(pointsText, 10)
    if (!Number.isFinite(points) || points < 0 || points > 1000) {
      toast.show('Poeng må være et tall mellom 0 og 1000.')
      return
    }
    const descTrim = description.trim()
    if (isNew) {
      create.mutate({ title: titleTrim, description: descTrim || undefined, points, difficulty, isGold })
    } else {
      update.mutate({ title: titleTrim, description: descTrim || null, points, difficulty, isGold, isActive })
    }
  }

  return (
    <View style={styles.root}>
      {screen}
      <ScrollView
        contentContainerStyle={[styles.form, { paddingBottom: insets.bottom + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <Field label="Tittel">
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="F.eks. Spis frokost under pulten"
            placeholderTextColor={sticker.color.textMuted}
            maxLength={200}
            accessibilityLabel="Tittel"
          />
        </Field>

        <Field label="Beskrivelse (valgfritt)">
          <TextInput
            style={[styles.input, styles.inputMulti]}
            value={description}
            onChangeText={setDescription}
            placeholder="Detaljer om hva som teller som godkjent"
            placeholderTextColor={sticker.color.textMuted}
            multiline
            maxLength={2000}
            accessibilityLabel="Beskrivelse"
          />
        </Field>

        <Field label="Poeng">
          <TextInput
            style={styles.input}
            value={pointsText}
            onChangeText={(v) => setPointsText(v.replace(/[^0-9]/g, '').slice(0, 4))}
            placeholder="10"
            placeholderTextColor={sticker.color.textMuted}
            keyboardType="number-pad"
            accessibilityLabel="Poeng"
          />
        </Field>

        <Field label="Vanskelighet">
          <View style={styles.diffRow}>
            {DIFFICULTIES.map((d) => {
              const active = difficulty === d
              return (
                <Pressable
                  key={d}
                  onPress={() => setDifficulty(d)}
                  haptic="selection"
                  accessibilityLabel={`Velg ${d}`}
                  accessibilityState={{ selected: active }}
                  style={[styles.diffChip, active ? styles.diffChipActive : styles.diffChipIdle]}
                >
                  <Text size="sm" weight="semibold" color={active ? sticker.color.textInverse : sticker.color.text}>
                    {d}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </Field>

        <ToggleCard
          label="Gullknute ★"
          hint="Marker spesielle, tradisjonelle knuter som gull. Vises med gullfarge i appen."
          value={isGold}
          onValueChange={setIsGold}
          trackColor={sticker.color.gold}
        />

        {!isNew ? (
          <ToggleCard
            label="Aktiv"
            hint="Skru av for å arkivere — knuten skjules fra listen, men gamle innsendinger beholder tittelen."
            value={isActive}
            onValueChange={setIsActive}
            trackColor={sticker.color.primary}
          />
        ) : null}

        <View style={styles.actions}>
          <StickerButton
            label={isNew ? 'Lag knute' : 'Lagre endringer'}
            variant="accent"
            fullWidth
            loading={busy}
            onPress={handleSubmit}
          />
          <StickerButton label="Avbryt" variant="ghost" fullWidth disabled={busy} onPress={() => router.back()} />
        </View>
      </ScrollView>
      <Toast message={toast.message} bottomOffset={insets.bottom + spacing.lg} />
    </View>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text size="sm" weight="semibold" color={sticker.color.textMuted}>
        {label}
      </Text>
      {children}
    </View>
  )
}

function ToggleCard({
  label,
  hint,
  value,
  onValueChange,
  trackColor,
}: {
  label: string
  hint: string
  value: boolean
  onValueChange: (v: boolean) => void
  trackColor: string
}) {
  return (
    <StickerCard tone="surface" radius="md" shadow="sm" padding="md" style={styles.toggleCard}>
      <View style={styles.toggleRow}>
        <View style={styles.toggleText}>
          <Text weight="semibold" size="base" color={sticker.color.ink}>
            {label}
          </Text>
          <Text size="xs" color={sticker.color.textMuted}>
            {hint}
          </Text>
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ true: trackColor, false: sticker.color.line }}
          thumbColor={sticker.color.card}
          accessibilityLabel={label}
        />
      </View>
    </StickerCard>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: sticker.color.paper },
  form: { padding: spacing.base, gap: spacing.base },
  field: { gap: spacing.xs },
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
  },
  inputMulti: { minHeight: 100, textAlignVertical: 'top' },
  diffRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  diffChip: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: sticker.radius.full,
    borderWidth: sticker.borderWidth,
  },
  diffChipIdle: { backgroundColor: sticker.color.card, borderColor: sticker.color.ink },
  diffChipActive: { backgroundColor: sticker.color.ink, borderColor: sticker.color.ink },
  toggleCard: { marginTop: spacing.xs },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.base },
  toggleText: { flex: 1, gap: spacing['2xs'] },
  actions: { marginTop: spacing.lg, gap: spacing.sm },
  skeletonField: { height: 64, borderRadius: sticker.radius.md, marginBottom: spacing.base },
})
