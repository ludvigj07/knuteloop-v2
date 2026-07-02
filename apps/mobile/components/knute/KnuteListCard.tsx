import { StyleSheet, View } from 'react-native'
import { ChevronRight } from 'lucide-react-native'
import { Chip, KnoteIcon, StickerCard, Text } from '../primitives'
import { GlyphTile } from './GlyphTile'
import type { Knute } from '../../lib/api'
import { difficultyTone } from '../../lib/knute-ui'
import { formatNumber } from '../../lib/format'
import { spacing, sticker } from '../../lib/theme'

// A knute in the STUDENT catalog, as a tappable sticker card → opens the
// submit screen (/knute/[id]). Sibling of SchoolKnuteRow (the knutesjef's
// row, which opens the editor) — student cards never expose admin actions.

const STATUS_LABEL = { approved: 'Godkjent', pending: 'Venter' } as const

export function KnuteListCard({
  knute,
  difficultyLabel,
  onPress,
}: {
  knute: Knute
  /** Student-facing bokmål label (Medium → «Middels» etc.), mapped by the screen. */
  difficultyLabel: string
  onPress: () => void
}) {
  const statusLabel = knute.myStatus ? STATUS_LABEL[knute.myStatus] : null
  return (
    <StickerCard
      radius="md"
      shadow="sm"
      padding="md"
      onPress={onPress}
      haptic="light"
      accessibilityRole="link"
      accessibilityLabel={`${knute.isGold ? 'Gullknute' : 'Knute'}: ${knute.title}, ${formatNumber(knute.points)} poeng, ${difficultyLabel}${statusLabel ? `, ${statusLabel.toLocaleLowerCase('nb-NO')}` : ''}`}
      accessibilityHint="Åpner innsending for denne knuten."
    >
      <View style={styles.row}>
        <GlyphTile size={44} tone={knute.isGold ? 'accent' : 'primary'}>
          <KnoteIcon
            name="knute"
            size={sticker.icon.md}
            color={knute.isGold ? sticker.color.gold : sticker.color.primary}
          />
        </GlyphTile>
        <View style={styles.body}>
          <Text weight="semibold" size="base" color={sticker.color.ink} numberOfLines={2}>
            {knute.isGold ? <Text color={sticker.color.gold}>★ </Text> : null}
            {knute.title}
          </Text>
          <View style={styles.meta}>
            <Chip label={`${formatNumber(knute.points)} P`} tone="accent" mono />
            <Chip label={difficultyLabel} tone={difficultyTone(knute.difficulty)} />
            {knute.myStatus === 'approved' ? <Chip label="Godkjent ✓" tone="success" /> : null}
            {knute.myStatus === 'pending' ? <Chip label="Venter" tone="warning" /> : null}
          </View>
        </View>
        <ChevronRight size={sticker.icon.md} color={sticker.color.textMuted} strokeWidth={2} />
      </View>
    </StickerCard>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  body: { flex: 1, gap: spacing.xs },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
})
