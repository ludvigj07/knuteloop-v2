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
import { difficultyTone, folderGlyph, isSensitiveFolder } from '../../lib/knute-ui'
import { formatNumber } from '../../lib/format'
import { sticker, spacing } from '../../lib/theme'

// One library knute as a sticker row: category glyph tile, title + meta chips,
// and a circular add toggle (Plus → Check). Tapping the body opens the detail
// sheet; the toggle is the quick-add. Sensitive folders get the amber tint.

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
  const sensitive = isSensitiveFolder(knute.suggestedFolder)
  const isText = knute.evidenceType === 'text'
  const isAdult = knute.minAge >= 18

  return (
    <StickerCard
      onPress={onOpen}
      radius="md"
      shadow="sm"
      padding="md"
      style={styles.card}
      accessibilityLabel={`${knute.title}. ${formatNumber(knute.points)} poeng. Trykk for detaljer.`}
    >
      <View style={styles.row}>
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
