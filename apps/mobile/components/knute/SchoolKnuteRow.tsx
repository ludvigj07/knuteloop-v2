import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { ChevronRight, Trash2 } from 'lucide-react-native'
import { Badge, Chip, KnoteIcon, Pressable, StickerCard, Text } from '../primitives'
import { GlyphTile } from './GlyphTile'
import type { Knute } from '../../lib/api'
import { difficultyTone } from '../../lib/knute-ui'
import { formatNumber } from '../../lib/format'
import { sticker, spacing } from '../../lib/theme'

// A school-owned knute as a sticker row. Shared by the knutesjef panel (tap to
// edit, chevron trailing) and the folder view (tap to edit + a remove button).

export function SchoolKnuteRow({
  knute,
  inactive,
  onPress,
  onRemove,
  removing,
}: {
  knute: Knute
  inactive?: boolean
  onPress: () => void
  onRemove?: () => void
  removing?: boolean
}) {
  return (
    <StickerCard
      onPress={onPress}
      radius="md"
      shadow="sm"
      padding="md"
      style={[styles.card, inactive ? styles.dim : null]}
      accessibilityLabel={`Rediger ${knute.isGold ? 'gullknute ' : ''}${knute.title}, ${formatNumber(knute.points)} poeng, ${knute.difficulty}${inactive ? ', arkivert' : ''}`}
    >
      <View style={styles.row}>
        <GlyphTile size={44} tone={knute.isGold ? 'accent' : 'primary'}>
          <KnoteIcon name="knute" size={24} color={knute.isGold ? sticker.color.gold : sticker.color.primary} />
        </GlyphTile>
        <View style={styles.body}>
          <Text weight="semibold" size="base" color={sticker.color.ink} numberOfLines={2}>
            {knute.isGold ? <Text color={sticker.color.gold}>★ </Text> : null}
            {knute.title}
          </Text>
          <View style={styles.meta}>
            <Chip label={`${formatNumber(knute.points)} P`} tone="accent" mono />
            <Chip label={knute.difficulty} tone={difficultyTone(knute.difficulty)} />
            {inactive ? <Badge label="Arkivert" /> : null}
          </View>
        </View>
        {onRemove ? (
          <Pressable
            onPress={onRemove}
            disabled={removing}
            haptic="medium"
            accessibilityLabel={`Fjern ${knute.title} fra mappa`}
            style={[styles.removeBtn]}
          >
            {removing ? (
              <ActivityIndicator size="small" color={sticker.color.danger} />
            ) : (
              <Trash2 size={sticker.icon.sm} color={sticker.color.danger} strokeWidth={2} />
            )}
          </Pressable>
        ) : (
          <ChevronRight size={sticker.icon.md} color={sticker.color.textMuted} strokeWidth={2} />
        )}
      </View>
    </StickerCard>
  )
}

const styles = StyleSheet.create({
  card: { marginHorizontal: spacing.base, marginBottom: spacing.sm },
  dim: { opacity: 0.6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  body: { flex: 1, gap: spacing.xs },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  removeBtn: {
    width: 40,
    height: 40,
    borderRadius: sticker.radius.full,
    borderWidth: sticker.borderWidth,
    borderColor: sticker.color.danger,
    backgroundColor: sticker.color.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
