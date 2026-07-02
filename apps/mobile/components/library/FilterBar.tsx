import { useState } from 'react'
import { ScrollView, StyleSheet, TextInput, View } from 'react-native'
import { Check, MapPin, Search, X } from 'lucide-react-native'
import { Pressable, Sheet, Text } from '../primitives'
import { fontFamily, fontSize, size, spacing, sticker } from '../../lib/theme'

// Browse filters for the library. The TYPE axis (folder chips) + free-text
// search are always visible; the GEOGRAPHY axis (region) is a secondary
// discovery filter ("don't show Oslo the Breiavannet knuter") and lives behind
// one small button → a sheet. Keeps the top calm: search + one chip row.

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
  const [regionOpen, setRegionOpen] = useState(false)
  const activeRegion = REGIONS.find((r) => r.value === region) ?? REGIONS[0]!
  const regionActive = region !== null

  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
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

        <Pressable
          onPress={() => setRegionOpen(true)}
          haptic="light"
          accessibilityLabel={`Sted: ${activeRegion.label}`}
          accessibilityHint="Velg hvilket sted knutene skal passe for."
          style={[styles.regionBtn, regionActive ? styles.regionBtnActive : null]}
        >
          <MapPin
            size={sticker.icon.sm}
            color={regionActive ? sticker.color.textInverse : sticker.color.ink}
            strokeWidth={2.2}
          />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pills}
        keyboardShouldPersistTaps="handled"
      >
        <Pill label="Alle" active={folder === null} onPress={() => onFolder(null)} />
        {FOLDERS.map((f) => (
          <Pill key={f} label={f} active={folder === f} onPress={() => onFolder(f)} />
        ))}
      </ScrollView>

      <Sheet open={regionOpen} onClose={() => setRegionOpen(false)}>
        <View style={styles.sheetBody}>
          <Text font="display" weight="bold" size="xl" color={sticker.color.ink}>
            Sted
          </Text>
          <Text size="sm" color={sticker.color.textMuted}>
            Vis knuter som passer der dere er — «Nasjonalt» funker overalt.
          </Text>
          <View style={styles.regionList}>
            {REGIONS.map((r) => {
              const selected = r.value === region
              return (
                <Pressable
                  key={r.label}
                  onPress={() => {
                    onRegion(r.value)
                    setRegionOpen(false)
                  }}
                  haptic="selection"
                  accessibilityLabel={r.label}
                  accessibilityState={{ selected }}
                  style={[styles.regionRow, selected ? styles.regionRowActive : null]}
                >
                  <Text
                    weight={selected ? 'bold' : 'medium'}
                    color={selected ? sticker.color.textInverse : sticker.color.ink}
                  >
                    {r.label}
                  </Text>
                  {selected ? (
                    <Check size={sticker.icon.sm} color={sticker.color.textInverse} strokeWidth={2.5} />
                  ) : null}
                </Pressable>
              )
            })}
          </View>
        </View>
      </Sheet>
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
  },
  searchRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
    fontFamily: fontFamily.sans.regular,
    paddingVertical: spacing.sm,
  },
  clear: { padding: spacing['2xs'] },
  regionBtn: {
    width: size.searchMinHeight,
    height: size.searchMinHeight,
    borderRadius: sticker.radius.full,
    borderWidth: sticker.borderWidth,
    borderColor: sticker.color.ink,
    backgroundColor: sticker.color.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  regionBtnActive: { backgroundColor: sticker.color.primary },
  pills: { gap: spacing.sm, paddingHorizontal: spacing.base },
  pill: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: sticker.radius.full,
    borderWidth: sticker.borderWidth,
  },
  pillIdle: { backgroundColor: sticker.color.card, borderColor: sticker.color.ink },
  pillActive: { backgroundColor: sticker.color.ink, borderColor: sticker.color.ink },
  sheetBody: { gap: spacing.sm },
  regionList: { marginTop: spacing.sm, gap: spacing.sm },
  regionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: size.actionMinHeight,
    paddingHorizontal: spacing.base,
    borderRadius: sticker.radius.md,
    borderWidth: sticker.borderWidth,
    borderColor: sticker.color.ink,
    backgroundColor: sticker.color.card,
  },
  regionRowActive: { backgroundColor: sticker.color.primary },
})
