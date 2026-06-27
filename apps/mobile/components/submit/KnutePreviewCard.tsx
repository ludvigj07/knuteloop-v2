import { StyleSheet, View } from 'react-native'
import { Badge, Chip, KnoteIcon, StickerCard, Text } from '../primitives'
import { GlyphTile } from '../knute/GlyphTile'
import type { Knute } from '../../lib/api'
import { difficultyTone } from '../../lib/knute-ui'
import { formatNumber } from '../../lib/format'
import { sticker, spacing } from '../../lib/theme'

// The selected-knute summary shown at the top of the Send inn flow — the focal
// "what you're proving" element. Reuses the sticker knute vocabulary (glyph tile
// + title + meta chips) in a fuller card form. Gullknuter get the amber tile +
// gold knot + ★; text-only knuter get a "Tekst" badge.

export function KnutePreviewCard({ knute }: { knute: Knute }) {
  const isText = knute.evidenceType === 'text'
  return (
    <StickerCard tone="surface" radius="lg" shadow="base" padding="base">
      <View style={styles.row}>
        <GlyphTile size={52} tone={knute.isGold ? 'accent' : 'primary'}>
          <KnoteIcon
            name="knute"
            size={28}
            color={knute.isGold ? sticker.color.gold : sticker.color.primary}
          />
        </GlyphTile>
        <View style={styles.body}>
          <Text
            font="display"
            weight="bold"
            size="lg"
            color={sticker.color.ink}
            numberOfLines={2}
            accessibilityRole="header"
          >
            {knute.isGold ? <Text color={sticker.color.gold}>★ </Text> : null}
            {knute.title}
          </Text>
          <View style={styles.meta}>
            <Chip label={`${formatNumber(knute.points)} P`} tone="accent" mono />
            <Chip label={knute.difficulty} tone={difficultyTone(knute.difficulty)} />
            {isText ? <Badge label="Tekst" /> : null}
          </View>
        </View>
      </View>
      {knute.description ? (
        <Text size="sm" color={sticker.color.textMuted} style={styles.desc}>
          {knute.description}
        </Text>
      ) : null}
    </StickerCard>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  body: { flex: 1, gap: spacing.xs },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  desc: { marginTop: spacing.sm },
})
