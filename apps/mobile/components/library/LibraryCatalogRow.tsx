import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { Check, Plus } from 'lucide-react-native'
import { Badge, Chip, KnoteIcon, Pressable, Text } from '../primitives'
import { GlyphTile } from '../knute/GlyphTile'
import type { LibraryKnute } from '../../lib/api'
import { difficultyTone, folderGlyph, isSensitiveKnute } from '../../lib/knute-ui'
import { formatNumber } from '../../lib/format'
import { size, sticker, spacing } from '../../lib/theme'

// One library knute as a DENSE catalog row — the browse list is one continuous
// panel (hairline dividers, ink side borders, capped first/last row), not a
// stack of individual sticker cards. ~500 knuter must scan fast: title + the
// one-line description IS the decision surface ("Spotify for knuter").
//
// The row content and the add toggle are SEPARATE sibling pressables — nesting
// them made taps land on the wrong target (see the old LibraryRow's lesson).

export function LibraryCatalogRow({
  knute,
  importing,
  isFirst,
  isLast,
  onOpen,
  onAdd,
}: {
  knute: LibraryKnute
  importing: boolean
  isFirst: boolean
  isLast: boolean
  onOpen: () => void
  onAdd: () => void
}) {
  const sensitive = isSensitiveKnute(knute)
  const isText = knute.evidenceType === 'text'
  const isAdult = knute.minAge >= 18

  return (
    <View style={styles.gutter}>
      <View
        style={[
          styles.segment,
          isFirst ? styles.segmentFirst : null,
          isLast ? styles.segmentLast : null,
        ]}
      >
        <View style={[styles.row, !isFirst ? styles.rowDivider : null]}>
          <Pressable
            onPress={onOpen}
            haptic="light"
            accessibilityLabel={`${knute.title}. ${formatNumber(knute.points)} poeng. Trykk for detaljer.`}
            style={styles.openArea}
          >
            <GlyphTile size={40} tone={sensitive ? 'accent' : 'primary'}>
              <KnoteIcon
                name={folderGlyph(knute.suggestedFolder)}
                size={sticker.icon.md}
                color={sensitive ? sticker.color.accentStrong : sticker.color.primary}
              />
            </GlyphTile>

            <View style={styles.body}>
              <Text weight="semibold" size="base" color={sticker.color.ink} numberOfLines={1}>
                {knute.title}
              </Text>
              {knute.description ? (
                <Text size="sm" color={sticker.color.textMuted} numberOfLines={1}>
                  {knute.description}
                </Text>
              ) : null}
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
      </View>
    </View>
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
  gutter: { paddingHorizontal: spacing.base },
  // Each row draws the panel's side borders; the first/last rows cap the panel
  // with the top/bottom border + radius. Together the rows read as ONE card.
  segment: {
    backgroundColor: sticker.color.card,
    borderLeftWidth: sticker.borderWidth,
    borderRightWidth: sticker.borderWidth,
    borderColor: sticker.color.ink,
  },
  segmentFirst: {
    borderTopWidth: sticker.borderWidth,
    borderTopLeftRadius: sticker.radius.lg,
    borderTopRightRadius: sticker.radius.lg,
  },
  segmentLast: {
    borderBottomWidth: sticker.borderWidth,
    borderBottomLeftRadius: sticker.radius.lg,
    borderBottomRightRadius: sticker.radius.lg,
    marginBottom: spacing.base,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: sticker.color.line,
  },
  openArea: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  body: { flex: 1, gap: spacing['2xs'] },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
    marginTop: spacing['2xs'],
  },
  toggle: {
    width: size.actionMinHeight,
    height: size.actionMinHeight,
    borderRadius: sticker.radius.full,
    borderWidth: sticker.borderWidth,
    borderColor: sticker.color.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleAdd: { backgroundColor: sticker.color.card },
  toggleAdded: { backgroundColor: sticker.color.ink },
})
