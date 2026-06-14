import { useEffect, useState } from 'react'
import {
  View,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Pressable, Text } from '../../../components/primitives'
import {
  fetchAllKnuter,
  createKnute,
  updateKnute,
  type CreateKnuteInput,
  type UpdateKnuteInput,
} from '../../../lib/api'
import { colors, spacing, radius, fontSize, fontWeight } from '../../../lib/theme'

type Difficulty = 'Lett' | 'Medium' | 'Hard' | 'Valgfri'
const DIFFICULTIES: Difficulty[] = ['Lett', 'Medium', 'Hard', 'Valgfri']

export default function EditKnuteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()
  const insets = useSafeAreaInsets()

  const isNew = id === 'new'

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [pointsText, setPointsText] = useState('10')
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium')
  const [isGold, setIsGold] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [loaded, setLoaded] = useState(false)

  // Hydrate edit form from cached /api/knuter?all=1.
  const list = useQuery({
    queryKey: ['knuter', 'all'],
    queryFn: fetchAllKnuter,
    enabled: !isNew,
  })

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
    void qc.invalidateQueries({ queryKey: ['knuter', 'all'] })
  }

  const create = useMutation({
    mutationFn: (input: CreateKnuteInput) => createKnute(input),
    onSuccess: () => {
      invalidateAll()
      router.back()
    },
    onError: (err) => Alert.alert('Kunne ikke lage knuten', (err as Error).message),
  })

  const update = useMutation({
    mutationFn: (input: UpdateKnuteInput) => updateKnute(id!, input),
    onSuccess: () => {
      invalidateAll()
      router.back()
    },
    onError: (err) => Alert.alert('Kunne ikke lagre', (err as Error).message),
  })

  const busy = create.isPending || update.isPending

  // Loading for edit before we have the cached data:
  if (!isNew && !loaded) {
    return (
      <>
        <Stack.Screen options={{ title: 'Rediger knute' }} />
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand.primary} />
        </View>
      </>
    )
  }

  function handleSubmit() {
    const titleTrim = title.trim()
    if (!titleTrim) {
      Alert.alert('Tittel mangler', 'Knuten må ha en tittel.')
      return
    }
    const points = Number.parseInt(pointsText, 10)
    if (!Number.isFinite(points) || points < 0 || points > 1000) {
      Alert.alert('Ugyldig poeng', 'Poeng må være et tall mellom 0 og 1000.')
      return
    }
    const descTrim = description.trim()

    if (isNew) {
      create.mutate({
        title: titleTrim,
        description: descTrim || undefined,
        points,
        difficulty,
        isGold,
      })
    } else {
      update.mutate({
        title: titleTrim,
        description: descTrim || null,
        points,
        difficulty,
        isGold,
        isActive,
      })
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: isNew ? 'Ny knute' : 'Rediger knute' }} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          padding: spacing.base,
          paddingBottom: insets.bottom + spacing.lg,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>Tittel</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="F.eks. Spis frokost under pulten"
          placeholderTextColor={colors.text.muted}
          maxLength={200}
          accessibilityLabel="Tittel"
        />

        <Text style={styles.label}>Beskrivelse (valgfritt)</Text>
        <TextInput
          style={[styles.input, styles.inputMulti]}
          value={description}
          onChangeText={setDescription}
          placeholder="Detaljer om hva som teller som godkjent"
          placeholderTextColor={colors.text.muted}
          multiline
          maxLength={2000}
          accessibilityLabel="Beskrivelse"
        />

        <Text style={styles.label}>Poeng</Text>
        <TextInput
          style={styles.input}
          value={pointsText}
          onChangeText={(v) => setPointsText(v.replace(/[^0-9]/g, '').slice(0, 4))}
          placeholder="10"
          placeholderTextColor={colors.text.muted}
          keyboardType="number-pad"
          accessibilityLabel="Poeng"
        />

        <Text style={styles.label}>Vanskelighet</Text>
        <View style={styles.diffRow}>
          {DIFFICULTIES.map((d) => (
            <Pressable
              key={d}
              style={[styles.diffChip, difficulty === d && styles.diffChipActive]}
              onPress={() => setDifficulty(d)}
              accessibilityRole="button"
              accessibilityLabel={`Velg ${d}`}
              accessibilityState={{ selected: difficulty === d }}
            >
              <Text
                style={[styles.diffText, difficulty === d && styles.diffTextActive]}
              >
                {d}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleLabel}>Gullknute ★</Text>
            <Text style={styles.muted}>
              Marker spesielle, tradisjonelle knuter som gull. Vises med gullfarge i appen.
            </Text>
          </View>
          <Switch
            value={isGold}
            onValueChange={setIsGold}
            trackColor={{ true: colors.gold, false: colors.borderStrong }}
            accessibilityLabel="Gullknute"
          />
        </View>

        {!isNew && (
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>Aktiv</Text>
              <Text style={styles.muted}>
                Skru av for å arkivere — knuten skjules fra listen, men gamle innsendinger beholder titlen.
              </Text>
            </View>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ true: colors.brand.primary, false: colors.borderStrong }}
              accessibilityLabel="Aktiv"
            />
          </View>
        )}

        <Pressable
          style={[styles.saveButton, busy && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={isNew ? 'Lag knute' : 'Lagre endringer'}
        >
          <Text style={styles.saveText}>
            {busy ? 'Lagrer…' : isNew ? 'Lag knute' : 'Lagre endringer'}
          </Text>
        </Pressable>

        <Pressable
          style={styles.cancelButton}
          onPress={() => router.back()}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="Avbryt"
        >
          <Text style={styles.cancelText}>Avbryt</Text>
        </Pressable>
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  label: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.xs,
    marginTop: spacing.base,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.base,
    fontSize: fontSize.base,
    color: colors.text.primary,
  },
  inputMulti: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  diffRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  diffChip: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  diffChipActive: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  diffText: {
    fontSize: fontSize.sm,
    color: colors.text.primary,
    fontWeight: fontWeight.medium,
  },
  diffTextActive: {
    color: colors.text.inverse,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.lg,
    gap: spacing.base,
  },
  toggleLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  muted: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginTop: 2,
  },
  saveButton: {
    backgroundColor: colors.brand.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  saveText: {
    color: colors.text.inverse,
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.base,
  },
  cancelButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xs,
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
})
