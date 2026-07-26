import { StyleSheet } from 'react-native'
import { BookOpen, ChevronRight, ShieldCheck } from 'lucide-react-native'
import { Skeleton, Stack, StickerCard, Text } from '../primitives'
import { formatNumber } from '../../lib/format'
import { size, spacing, sticker } from '../../lib/theme'

export function HomeCatalogCard({
  total,
  available,
  isLoading,
  hasError,
  onOpen,
}: {
  total: number
  available: number
  isLoading: boolean
  hasError: boolean
  onOpen: () => void
}) {
  const summary = hasError
    ? 'Statusen kunne ikke lastes, men katalogen er fortsatt åpen.'
    : total === spacing.none
      ? 'Knuteboka fylles av knutesjefen.'
      : available === spacing.none
        ? 'Du har sendt inn alle knutene i katalogen.'
        : available === 1
          ? 'Én knute er klar for deg.'
          : `${formatNumber(available)} knuter er klare for deg.`

  return (
    <Stack gap="md">
      <Text font="display" size="xl" weight="bold" color={sticker.color.ink}>
        Knutekatalogen
      </Text>
      <StickerCard
        tone="accent"
        shadow="sm"
        onPress={onOpen}
        haptic="light"
        accessibilityRole="link"
        accessibilityLabel={isLoading ? 'Åpne knutekatalogen' : `Åpne knutekatalogen. ${summary}`}
        accessibilityHint="Viser alle tilgjengelige og fullførte knuter."
      >
        <Stack direction="row" align="center" gap="md">
          <Stack style={styles.iconTile} align="center" justify="center">
            <BookOpen
              size={sticker.icon.md}
              color={sticker.color.textInverse}
              strokeWidth={sticker.borderWidth}
            />
          </Stack>
          <Stack style={styles.copy} gap="xs">
            <Text font="display" size="lg" weight="bold" color={sticker.color.ink}>
              Finn neste knute
            </Text>
            {isLoading ? (
              <Skeleton style={styles.summarySkeleton} />
            ) : (
              <Text size="sm" color={sticker.color.ink}>
                {summary}
              </Text>
            )}
          </Stack>
          <ChevronRight
            size={sticker.icon.md}
            color={sticker.color.ink}
            strokeWidth={sticker.borderWidth}
          />
        </Stack>
      </StickerCard>
    </Stack>
  )
}

export function HomeKnutesjefCard({
  pendingCount,
  isLoading,
  onOpen,
}: {
  pendingCount: number | null
  isLoading: boolean
  onOpen: () => void
}) {
  const summary =
    pendingCount == null
      ? 'Åpne verktøyene for skolen.'
      : pendingCount === spacing.none
        ? 'Ingen innsendinger venter.'
        : pendingCount === 1
          ? 'Én innsending venter.'
          : `${formatNumber(pendingCount)} innsendinger venter.`

  return (
    <StickerCard
      tone="soft"
      shadow="sm"
      onPress={onOpen}
      haptic="light"
      accessibilityRole="link"
      accessibilityLabel={`For knutesjef. ${summary}`}
      accessibilityHint="Åpner køen og knutesjef-verktøyene."
    >
      <Stack direction="row" align="center" gap="md">
        <Stack style={styles.leadIconTile} align="center" justify="center">
          <ShieldCheck
            size={sticker.icon.md}
            color={sticker.color.primary}
            strokeWidth={sticker.borderWidth}
          />
        </Stack>
        <Stack style={styles.copy} gap="xs">
          <Text font="display" size="lg" weight="bold" color={sticker.color.ink}>
            For knutesjef
          </Text>
          {isLoading ? (
            <Skeleton style={styles.summarySkeleton} />
          ) : (
            <Text size="sm" color={sticker.color.textMuted}>
              {summary}
            </Text>
          )}
        </Stack>
        <ChevronRight
          size={sticker.icon.md}
          color={sticker.color.textMuted}
          strokeWidth={sticker.borderWidth}
        />
      </Stack>
    </StickerCard>
  )
}

const styles = StyleSheet.create({
  iconTile: {
    width: size.otherAvatar,
    height: size.otherAvatar,
    borderRadius: sticker.radius.md,
    backgroundColor: sticker.color.primary,
  },
  leadIconTile: {
    width: size.otherAvatar,
    height: size.otherAvatar,
    borderRadius: sticker.radius.md,
    backgroundColor: sticker.color.primaryBg,
  },
  copy: {
    flex: 1,
    minWidth: spacing.none,
  },
  summarySkeleton: {
    width: size.skeletonTitleWidth,
    height: size.skeletonRowMetaHeight,
  },
})
