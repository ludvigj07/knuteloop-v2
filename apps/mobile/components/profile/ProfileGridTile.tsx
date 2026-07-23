import { StyleSheet, View } from 'react-native'
import { Image } from 'expo-image'
import { Star } from 'lucide-react-native'
import { KnoteIcon, Text } from '../primitives'
import type { ProfileGridItem } from '../../lib/api'
import { animation, fontSize, spacing, sticker } from '../../lib/theme'

// One square in the public profile's 3-column submissions grid (TikTok model).
// Photos fill the square; text submissions render as a mini quote tile;
// gullknuter get a gold star badge. The grid only ever contains SHARED
// approved submissions (ADR-0021/0022) — filtering happens server-side.

export function ProfileGridTile({ item }: { item: ProfileGridItem }) {
  const isText = item.evidenceType === 'text'
  const label = `${item.knuteTitle}${item.isGold ? ', gullknute' : ''}`

  return (
    <View style={styles.tile} accessibilityRole="image" accessibilityLabel={label}>
      {isText ? (
        <View style={styles.textTile}>
          <Text
            size="xs"
            weight="semibold"
            color={sticker.color.ink}
            numberOfLines={4}
            style={styles.textQuote}
          >
            {item.caption ?? item.knuteTitle}
          </Text>
        </View>
      ) : item.imageUrl ? (
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.photo}
          contentFit="cover"
          transition={animation.duration.fast}
        />
      ) : (
        <View style={styles.placeholder}>
          <KnoteIcon name="knute" size={sticker.icon.md} color={sticker.color.textMuted} />
        </View>
      )}
      {item.isGold ? (
        <View style={styles.goldBadge}>
          <Star size={fontSize.xs} color={sticker.color.ink} fill={sticker.color.gold} strokeWidth={2} />
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: sticker.radius.sm,
    borderWidth: sticker.borderWidth,
    borderColor: sticker.color.ink,
    overflow: 'hidden',
    backgroundColor: sticker.color.card,
  },
  photo: { width: '100%', height: '100%' },
  textTile: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.sm,
    backgroundColor: sticker.color.accentBg,
  },
  textQuote: { textAlign: 'center' },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: sticker.color.surfaceSoft,
  },
  goldBadge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: sticker.color.gold,
    borderWidth: sticker.borderWidth,
    borderColor: sticker.color.ink,
    borderRadius: sticker.radius.full,
    padding: spacing.xs / 2,
  },
})
