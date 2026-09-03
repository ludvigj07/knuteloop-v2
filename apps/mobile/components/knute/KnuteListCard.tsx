import { memo } from 'react'
import { StyleSheet, View } from 'react-native'
import { Chip, KnoteIcon, StickerCard, Text } from '../primitives'
import { GlyphTile } from './GlyphTile'
import { BookmarkButton } from './BookmarkButton'
import type { Knute } from '../../lib/api'
import { formatNumber } from '../../lib/format'
import { spacing, sticker } from '../../lib/theme'

// A knute in the STUDENT catalog, as a tappable sticker card → opens the
// submit screen (/knute/[id]). Sibling of SchoolKnuteRow (the knutesjef's
// row, which opens the editor) — student cards never expose admin actions.
//
// memo + id-based onPressKnute (not a per-card closure): the card lives in the
// catalog FlashList, and the search field re-renders the screen per keystroke —
// only cards whose knute actually changed may re-render.

const STATUS_LABEL = { approved: 'Godkjent', pending: 'Venter' } as const

export const KnuteListCard = memo(function KnuteListCard({
  knute,
  onPressKnute,
}: {
  knute: Knute
  onPressKnute: (id: string) => void
}) {
  const statusLabel = knute.myStatus ? STATUS_LABEL[knute.myStatus] : null
  return (
    <StickerCard
      radius="md"
      shadow="sm"
      padding="md"
      onPress={() => onPressKnute(knute.id)}
      haptic="light"
      accessibilityRole="link"
      accessibilityLabel={`${knute.isGold ? 'Gullknute' : 'Knute'}: ${knute.title}, ${formatNumber(knute.points)} poeng${statusLabel ? `, ${statusLabel.toLocaleLowerCase('nb-NO')}` : ''}`}
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
            {knute.myStatus === 'approved' ? <Chip label="Godkjent ✓" tone="success" /> : null}
            {knute.myStatus === 'pending' ? <Chip label="Venter" tone="warning" /> : null}
          </View>
        </View>
        {/* Sits where the chevron used to be, at the same icon size, so the row's
            layout is untouched. The whole card is the link; the chevron was decor. */}
        <BookmarkButton knuteId={knute.id} bookmarked={knute.isBookmarked} />
      </View>
    </StickerCard>
  )
})

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  body: { flex: 1, gap: spacing.xs },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
})
