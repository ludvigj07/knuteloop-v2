import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { Check, Plus } from 'lucide-react-native'
import {
  Badge,
  Chip,
  KnoteIcon,
  Pressable,
  StickerCard,
  Text,
} from '../primitives'
import { GlyphTile } from '../knute/GlyphTile'
import type { LibraryKnute } from '../../lib/api'
import { difficultyTone, folderGlyph, isSensitiveKnute } from '../../lib/knute-ui'
import { formatNumber } from '../../lib/format'
import { sticker, spacing } from '../../lib/theme'

// One library knute as a sticker row. The card itself is NOT pressable; instead
// the left/content area and the add toggle are two SEPARATE sibling pressables.
// (Nesting a pressable add button inside a pressable card made taps land on the
// wrong target — sometimes opening the sheet instead of adding.)

export function LibraryRow({
  knute,
  importing,
  onOpen,
  onAdd,
}: {
  knute: LibraryKnute
  importing: boolean
  onOpen: () => void
  onAdd: () => void
}) {
  const sensitive = isSensitiveKnute(knute)
  const isText = knute.evidenceType === 'text'
  const isAdult = knute.minAge >= 18

  return (
    <StickerCard radius="md" shadow="sm" padding="md" style={styles.card}>
      <View style={styles.row}>
        <Pressable
          onPress={onOpen}
          haptic="light"
          accessibilityLabel={`${knute.title}. ${formatNumber(knute.points)} poeng. Trykk for detaljer.`}
          style={styles.openArea}
        >
          <GlyphTile size={44} tone={sensitive ? 'accent' : 'primary'}>
            <KnoteIcon
              name={folderGlyph(knute.suggestedFolder)}
              size={24}
              color={sensitive ? sticker.color.accentStrong : sticker.color.primary}
            />
          </GlyphTile>

          <View style={styles.body}>
            <Text weight="semibold" size="base" color={sticker.color.ink} numberOfLines={1}>
              {knute.title}
            </Text>
            <View style={styles.meta}>
              <Chip label={`${formatNumber(knute.points)} P`} tone="accent" mono />
              <Chip label={knute.difficulty} tone={difficultyTone(knute.difficulty)} />
              {isText ? <Badge label="Tekst" /> : null}
              {isAdult ? <Badge label="18+" tone="age" /> : null}
            </View>
          </View>
        </Pressable>

        <AddToggle imported={knute.imported} importing={importing} onAdd={onAdd} title={knute.title} />
      </View>
    </StickerCard>
  )
}

function AddToggle({
  imported,
  importing,
  onAdd,
  title,
}: {
  imported: boolean
  importing: boolean
  onAdd: () => void
  title: string
}) {
  if (imported) {
    return (
      <View
        style={[styles.toggle, styles.toggleAdded]}
        accessible
        accessibilityLabel={`${title} er lagt til`}
      >
        <Check size={sticker.icon.sm} color={sticker.color.textInverse} strokeWidth={2.5} />
      </View>
    )
  }
  return (
    <Pressable
      onPress={onAdd}
      disabled={importing}
      haptic="medium"
      accessibilityLabel={`Legg ${title} til i knuteboka`}
      accessibilityHint="Kopierer knuten inn i skolens liste."
      hitSlop={8}
      style={[styles.toggle, styles.toggleAdd]}
    >
      {importing ? (
        <ActivityIndicator size="small" color={sticker.color.ink} />
      ) : (
        <Plus size={sticker.icon.sm} color={sticker.color.ink} strokeWidth={2.5} />
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: { marginHorizontal: spacing.base, marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  openArea: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  body: { flex: 1, gap: spacing.xs },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  toggle: {
    width: 40,
    height: 40,
    borderRadius: sticker.radius.full,
    borderWidth: sticker.borderWidth,
    borderColor: sticker.color.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleAdd: { backgroundColor: sticker.color.card },
  toggleAdded: { backgroundColor: sticker.color.ink },
})
