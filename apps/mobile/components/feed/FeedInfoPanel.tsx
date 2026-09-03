import { StyleSheet } from 'react-native'
import { BlurView } from 'expo-blur'
import { ChevronRight } from 'lucide-react-native'
import { Chip, Pressable, Stack, Text } from '../primitives'
import { BookmarkButton } from '../knute/BookmarkButton'
import type { FeedItem } from '../../lib/api'
import { formatNumber, formatShortDate } from '../../lib/format'
import { colors, glass, size, spacing, sticker } from '../../lib/theme'

const FIRST_INITIAL_LENGTH = 1

export function FeedInfoPanel({
  item,
  onOpenProfile,
}: {
  item: FeedItem
  onOpenProfile: () => void
}) {
  return (
    // Frosted glass rather than an opaque slab: the photo stays visible behind
    // the panel, the way every other fullscreen feed does it. The BlurView only
    // blurs — the tint and the hairline highlight live on the inner Stack.
    <BlurView
      intensity={glass.intensity}
      tint="dark"
      experimentalBlurMethod={glass.androidMethod}
      style={styles.panel}
    >
      <Stack style={styles.panelInner} padding="md" gap="sm">
        <Stack direction="row" align="center" justify="between" gap="sm">
          <Pressable
            onPress={onOpenProfile}
            haptic="light"
            accessibilityRole="link"
            accessibilityLabel={`Se profilen til ${item.russenavn}`}
            accessibilityHint="Viser en rask profiloversikt."
            style={styles.profile}
          >
            <Stack style={styles.avatar} align="center" justify="center" accessibilityElementsHidden>
              <Text font="display" weight="bold" color={colors.feed.panelText}>
                {item.russenavn
                  .slice(spacing.none, FIRST_INITIAL_LENGTH)
                  .toLocaleUpperCase('nb-NO')}
              </Text>
            </Stack>
            <Stack style={styles.profileText} gap="2xs">
              <Text weight="bold" color={colors.feed.panelText} numberOfLines={1}>
                {item.russenavn}
              </Text>
              <Text size="xs" color={colors.feed.panelTextMuted}>
                {formatShortDate(item.createdAt)}
              </Text>
            </Stack>
            <ChevronRight
              size={sticker.icon.sm}
              color={colors.feed.panelTextMuted}
              strokeWidth={sticker.borderWidth}
            />
          </Pressable>
          <Chip label={`+${formatNumber(item.knutePoints)} P`} tone="accent" mono />
        </Stack>

        {/* The bookmark sits ON the knute title, not up by the person: next to
            the name it would read as a reaction to the post; here it reads as
            «save this knute» — which is what it is. */}
        <Stack direction="row" align="center" gap="sm">
          <Text
            font="display"
            weight="bold"
            size="lg"
            color={colors.feed.panelText}
            numberOfLines={2}
            style={styles.title}
          >
            {item.knuteTitle}
          </Text>
          <BookmarkButton
            knuteId={item.knuteId}
            bookmarked={item.isBookmarked}
            color={colors.feed.panelText}
          />
        </Stack>

        {item.evidenceType !== 'text' && item.caption ? (
          <Text size="sm" color={colors.feed.panelTextMuted} numberOfLines={3}>
            {item.caption}
          </Text>
        ) : null}
      </Stack>
    </BlurView>
  )
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: sticker.radius.lg,
    // The blur has to be clipped to the rounded corners — without this it
    // spills out as a square on Android and web.
    overflow: 'hidden',
  },
  panelInner: {
    backgroundColor: colors.feed.panel,
    borderWidth: sticker.borderWidth,
    borderColor: colors.feed.panelBorder,
    borderRadius: sticker.radius.lg,
  },
  profile: {
    minWidth: spacing.none,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: size.actionMinHeight,
    height: size.actionMinHeight,
    borderRadius: sticker.radius.full,
    borderWidth: sticker.borderWidth,
    borderColor: colors.feed.panelBorder,
    backgroundColor: colors.feed.avatar,
  },
  profileText: { minWidth: spacing.none, flex: 1 },
  title: { minWidth: spacing.none, flex: 1 },
})
