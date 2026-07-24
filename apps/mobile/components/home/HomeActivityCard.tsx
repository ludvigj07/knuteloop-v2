import { Image } from 'expo-image'
import { StyleSheet } from 'react-native'
import { ChevronRight } from 'lucide-react-native'
import { useReducedMotion } from 'react-native-reanimated'
import {
  Chip,
  KnoteIcon,
  Pressable,
  Skeleton,
  Stack,
  StickerButton,
  StickerCard,
  Text,
} from '../primitives'
import type { FeedItem } from '../../lib/api'
import { formatNumber, formatShortDate } from '../../lib/format'
import { animation, size, spacing, sticker } from '../../lib/theme'

type HomeActivityCardProps = {
  item: FeedItem | null
  isLoading: boolean
  error: Error | null
  onRetry: () => void
  onOpenFeed: () => void
  onOpenKnuter: () => void
}

export function HomeActivityCard({
  item,
  isLoading,
  error,
  onRetry,
  onOpenFeed,
  onOpenKnuter,
}: HomeActivityCardProps) {
  return (
    <Stack gap="md">
      <Stack direction="row" align="center" justify="between" gap="sm">
        <Text
          font="display"
          size="xl"
          weight="bold"
          color={sticker.color.ink}
          style={styles.headerTitle}
        >
          Siste øyeblikk
        </Text>
        {item ? (
          <Pressable
            onPress={onOpenFeed}
            haptic="light"
            accessibilityRole="link"
            accessibilityLabel="Se alle øyeblikk"
            accessibilityHint="Åpner feeden med godkjente knuter fra skolen."
            style={styles.headerLink}
          >
            <Text size="sm" weight="semibold" color={sticker.color.primary}>
              Se alle
            </Text>
            <ChevronRight
              size={sticker.icon.sm}
              color={sticker.color.primary}
              strokeWidth={sticker.borderWidth}
            />
          </Pressable>
        ) : null}
      </Stack>

      {isLoading ? (
        <StickerCard padding="none" shadow="sm">
          <Skeleton style={styles.media} />
          <Stack padding="base" gap="sm">
            <Skeleton style={styles.skeletonAuthor} />
            <Skeleton style={styles.skeletonTitle} />
          </Stack>
        </StickerCard>
      ) : error && !item ? (
        <StickerCard tone="soft" shadow="sm">
          <Stack gap="md" align="start">
            <Text weight="bold" color={sticker.color.ink}>
              Kunne ikke laste øyeblikkene
            </Text>
            <Text size="sm" color={sticker.color.textMuted}>
              {error.message}
            </Text>
            <StickerButton label="Prøv igjen" variant="secondary" size="sm" onPress={onRetry} />
          </Stack>
        </StickerCard>
      ) : item ? (
        <StickerCard
          padding="none"
          shadow="base"
          onPress={onOpenFeed}
          haptic="light"
          accessibilityRole="link"
          accessibilityLabel={`${item.russenavn} fullførte ${item.knuteTitle}, ${formatNumber(item.knutePoints)} poeng`}
          accessibilityHint="Åpner feeden med flere øyeblikk fra skolen."
        >
          <ActivityMedia item={item} />
          <Stack padding="base" gap="sm">
            <Stack direction="row" align="center" justify="between" gap="sm">
              <Text
                weight="semibold"
                color={sticker.color.primary}
                numberOfLines={1}
                style={styles.authorName}
              >
                {item.russenavn}
              </Text>
              <Text size="xs" color={sticker.color.textMuted}>
                {formatShortDate(item.createdAt)}
              </Text>
            </Stack>
            <Stack direction="row" align="center" justify="between" gap="sm">
              <Text
                font="display"
                size="lg"
                weight="bold"
                color={sticker.color.ink}
                style={styles.activityTitle}
              >
                {item.knuteTitle}
              </Text>
              <Chip label={`${formatNumber(item.knutePoints)} P`} tone="accent" mono />
            </Stack>
            {item.caption ? (
              <Text size="sm" color={sticker.color.textMuted} numberOfLines={2}>
                {item.caption}
              </Text>
            ) : null}
          </Stack>
        </StickerCard>
      ) : (
        <StickerCard tone="soft" shadow="sm">
          <Stack gap="md" align="start">
            <KnoteIcon name="knute" size={sticker.icon.lg} color={sticker.color.primary} />
            <Stack gap="xs">
              <Text font="display" size="lg" weight="bold" color={sticker.color.ink}>
                Det er stille akkurat nå
              </Text>
              <Text size="sm" color={sticker.color.textMuted}>
                Når knuter blir godkjent og delt, kommer skolens øyeblikk hit.
              </Text>
            </Stack>
            <StickerButton
              label="Finn en knute"
              variant="accent"
              size="sm"
              onPress={onOpenKnuter}
              accessibilityHint="Åpner hele knutekatalogen."
            />
          </Stack>
        </StickerCard>
      )}
    </Stack>
  )
}

function ActivityMedia({ item }: { item: FeedItem }) {
  const reduceMotion = useReducedMotion()

  if (item.imageUrl) {
    return (
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.media}
        contentFit="cover"
        transition={reduceMotion ? spacing.none : animation.duration.base}
        accessible={false}
      />
    )
  }

  return (
    <Stack style={styles.mediaWell} align="center" justify="center" padding="lg">
      <KnoteIcon
        name="knute"
        size={sticker.icon.lg}
        color={item.evidenceType === 'text' ? sticker.color.accentStrong : sticker.color.primary}
      />
      {item.evidenceType === 'text' ? (
        <Text
          font="display"
          size="lg"
          weight="bold"
          color={sticker.color.ink}
          align="center"
          numberOfLines={4}
        >
          «{item.caption ?? item.knuteTitle}»
        </Text>
      ) : (
        <Text size="sm" color={sticker.color.textMuted} align="center">
          Bildet er ikke tilgjengelig ennå.
        </Text>
      )}
    </Stack>
  )
}

const styles = StyleSheet.create({
  headerLink: {
    minHeight: sticker.tap.min,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: sticker.radius.full,
  },
  headerTitle: {
    flexShrink: 1,
  },
  authorName: {
    flexShrink: 1,
  },
  media: {
    height: size.homeActivityMediaHeight,
    backgroundColor: sticker.color.surfaceMedia,
    borderTopLeftRadius: sticker.radius.lg,
    borderTopRightRadius: sticker.radius.lg,
    overflow: 'hidden',
  },
  // Text evidence grows with font scale instead of clipping (PendingCard convention).
  mediaWell: {
    minHeight: size.homeActivityMediaHeight,
    backgroundColor: sticker.color.surfaceMedia,
    borderTopLeftRadius: sticker.radius.lg,
    borderTopRightRadius: sticker.radius.lg,
    overflow: 'hidden',
    gap: spacing.sm,
  },
  activityTitle: {
    flex: 1,
  },
  skeletonAuthor: {
    width: size.skeletonTitleWidth,
    height: size.skeletonRowTitleHeight,
  },
  skeletonTitle: {
    height: size.skeletonTitleHeight,
  },
})
