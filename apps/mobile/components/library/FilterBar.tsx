import { ScrollView, StyleSheet, TextInput, View } from 'react-native'
import { Search, X } from 'lucide-react-native'
import { Pressable, Text } from '../primitives'
import { sticker, spacing, fontSize, size } from '../../lib/theme'

// Browse filters for the library: the folder (theme) axis, the region (geography)
// axis, and free-text search. Two scrollable pill rows + a sticker search field.

// The five library themes (suggestedFolder). null = "Alle".
const FOLDERS = ['Generelle', 'Dobbel', 'Rampestrek', 'Alkohol', 'Sex'] as const

// Geography axis. value is what the API expects: 'nasjonalt' → region IS NULL,
// 'Stavanger' → exact match, null → no region filter. (Seed regions for now.)
const REGIONS: { label: string; value: string | null }[] = [
  { label: 'Alle steder', value: null },
  { label: 'Nasjonalt', value: 'nasjonalt' },
  { label: 'Stavanger', value: 'Stavanger' },
]

export function FilterBar({
  folder,
  onFolder,
  region,
  onRegion,
  search,
  onSearch,
}: {
  folder: string | null
  onFolder: (f: string | null) => void
  region: string | null
  onRegion: (r: string | null) => void
  search: string
  onSearch: (s: string) => void
}) {
  return (
    <View style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills}>
        <Pill label="Alle" active={folder === null} onPress={() => onFolder(null)} />
        {FOLDERS.map((f) => (
          <Pill key={f} label={f} active={folder === f} onPress={() => onFolder(f)} />
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills}>
        {REGIONS.map((r) => (
          <Pill
            key={r.label}
            label={r.label}
            active={region === r.value}
            onPress={() => onRegion(r.value)}
          />
        ))}
      </ScrollView>

      <View style={styles.searchRow}>
        <Search size={sticker.icon.sm} color={sticker.color.textMuted} strokeWidth={2} />
        <TextInput
          style={styles.input}
          value={search}
          onChangeText={onSearch}
          placeholder="Søk i biblioteket…"
          placeholderTextColor={sticker.color.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Søk i biblioteket"
        />
        {search.length > 0 ? (
          <Pressable
            onPress={() => onSearch('')}
            haptic="light"
            accessibilityLabel="Tøm søk"
            style={styles.clear}
          >
            <X size={sticker.icon.sm} color={sticker.color.textMuted} strokeWidth={2} />
          </Pressable>
        ) : null}
      </View>
    </View>
  )
}

function Pill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      haptic="selection"
      accessibilityLabel={`Filtrer på ${label}`}
      accessibilityState={{ selected: active }}
      style={[styles.pill, active ? styles.pillActive : styles.pillIdle]}
    >
      <Text
        size="sm"
        weight="semibold"
        color={active ? sticker.color.textInverse : sticker.color.text}
      >
        {label}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm, paddingBottom: spacing.sm },
  pills: { gap: spacing.sm, paddingHorizontal: spacing.base },
  pill: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: sticker.radius.full,
    borderWidth: sticker.borderWidth,
  },
  pillIdle: { backgroundColor: sticker.color.card, borderColor: sticker.color.ink },
  pillActive: { backgroundColor: sticker.color.ink, borderColor: sticker.color.ink },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.base,
    paddingHorizontal: spacing.base,
    minHeight: size.searchMinHeight,
    backgroundColor: sticker.color.card,
    borderWidth: sticker.borderWidth,
    borderColor: sticker.color.ink,
    borderRadius: sticker.radius.full,
  },
  input: {
    flex: 1,
    color: sticker.color.text,
    fontSize: fontSize.base,
    fontFamily: 'Inter_400Regular',
    paddingVertical: spacing.sm,
  },
  clear: { padding: spacing['2xs'] },
})
