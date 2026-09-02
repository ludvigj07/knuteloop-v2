import { useEffect } from 'react'
import { StyleSheet } from 'react-native'
import { Check, Play, Star, Sun } from 'lucide-react-native'
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { Skeleton, Stack, StickerButton, StickerCard, Text } from '../primitives'
import type { DagensKnuteResponse } from '../../lib/api'
import { formatNumber } from '../../lib/format'
import { animation, opacity, size, spacing, sticker } from '../../lib/theme'

type DagensKnute = NonNullable<DagensKnuteResponse['dagens']>

type HomeDagensKnuteCardProps = {
  knute: DagensKnute | null
  isLoading: boolean
  error: Error | null
  isCompleted: boolean
  onRetry: () => void
  onOpen: (knuteId: string) => void
}

export function HomeDagensKnuteCard({
  knute,
  isLoading,
  error,
  isCompleted,
  onRetry,
  onOpen,
}: HomeDagensKnuteCardProps) {
  const reduceMotion = useReducedMotion()
  const actionLift = useSharedValue<number>(spacing.none)
  const shineX = useSharedValue<number>(-spacing.lg)

  useEffect(() => {
    if (reduceMotion || !knute || isCompleted) return

    actionLift.value = withSequence(
      withTiming(-sticker.shadowOffset.sm, {
        duration: animation.duration.fast,
      }),
      withTiming(spacing.none, {
        duration: animation.duration.base,
      }),
    )

    shineX.value = withTiming(size.dailyKnotShineTravel, {
      duration: animation.duration.slow,
    })

    return () => {
      cancelAnimation(actionLift)
      cancelAnimation(shineX)
    }
  }, [actionLift, isCompleted, knute, reduceMotion, shineX])

  const actionStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: actionLift.value }],
  }))

  const shineStyle = useAnimatedStyle(() => ({
    opacity: opacity.shine,
    transform: [{ translateX: shineX.value }],
  }))

  if (isLoading && !knute) {
    return (
      <StickerCard tone="surface" radius="md" shadow="sm" padding="md">
        <Stack direction="row" align="center" gap="md">
          <Stack style={styles.copy} gap="xs">
            <Skeleton style={styles.eyebrowSkeleton} />
            <Skeleton style={styles.titleSkeleton} />
          </Stack>
          <Skeleton style={styles.pointsSkeleton} />
        </Stack>
      </StickerCard>
    )
  }

  if (error && !knute) {
    return (
      <StickerCard tone="soft" radius="md" shadow="sm" padding="md">
        <Stack direction="row" align="center" gap="md">
          <Stack style={styles.iconTile} align="center" justify="center">
            <Sun
              size={sticker.icon.sm}
              color={sticker.color.accentStrong}
              strokeWidth={sticker.borderWidth}
            />
          </Stack>
          <Stack style={styles.copy} gap="2xs">
            <Text weight="semibold" color={sticker.color.ink}>
              Kunne ikke laste dagens knute
            </Text>
            <Text size="xs" color={sticker.color.textMuted}>
              Prøv på nytt når du er klar.
            </Text>
          </Stack>
          <StickerButton label="Prøv igjen" variant="secondary" size="sm" onPress={onRetry} />
        </Stack>
      </StickerCard>
    )
  }

  if (!knute) {
    return (
      <StickerCard tone="soft" radius="md" shadow="sm" padding="md">
        <Stack direction="row" align="center" gap="md">
          <Stack style={styles.iconTile} align="center" justify="center">
            <Sun
              size={sticker.icon.sm}
              color={sticker.color.accentStrong}
              strokeWidth={sticker.borderWidth}
            />
          </Stack>
          <Stack style={styles.copy} gap="2xs">
            <Text weight="semibold" color={sticker.color.ink}>
              Ingen dagens knute akkurat nå
            </Text>
            <Text size="xs" color={sticker.color.textMuted}>
              Knutesjefen fyller på med flere knuter.
            </Text>
          </Stack>
        </Stack>
      </StickerCard>
    )
  }

  if (isCompleted) {
    return (
      <StickerCard tone="soft" radius="md" shadow="none" padding="md">
        <Stack
          direction="row"
          align="center"
          gap="md"
          accessible
          accessibilityLabel="Dagens knute er sendt inn. Kom tilbake i morgen."
        >
          <Stack style={styles.completedIconTile} align="center" justify="center">
            <Check
              size={sticker.icon.sm}
              color={sticker.color.success}
              strokeWidth={sticker.borderWidth}
            />
          </Stack>
          <Stack style={styles.copy} gap="2xs">
            <Text weight="semibold" color={sticker.color.ink}>
              Dagens knute er sendt inn
            </Text>
            <Text size="xs" color={sticker.color.textMuted}>
              Kom tilbake i morgen.
            </Text>
          </Stack>
        </Stack>
      </StickerCard>
    )
  }

  const pointsLabel = `${formatNumber(knute.points)} P`

  return (
    <StickerCard
      tone="daily"
      radius="md"
      shadow="base"
      frame="featured"
      padding="md"
      onPress={() => onOpen(knute.id)}
      haptic="light"
      accessibilityRole="link"
      accessibilityLabel={`Dagens knute: ${knute.title}, ${formatNumber(knute.points)} poeng`}
      accessibilityHint="Åpner knuten, slik at du kan sende den inn."
    >
      <Stack direction="row" align="center" gap="md">
        <Stack style={styles.copy} gap="xs">
          <Stack direction="row" align="center" gap="sm" style={styles.meta}>
            <Text size="xs" weight="semibold" color={sticker.color.primary}>
              Dagens knute
            </Text>
            <Stack direction="row" align="center" gap="2xs">
              <Star
                size={sticker.icon.sm}
                color={sticker.color.gold}
                fill={sticker.color.gold}
                strokeWidth={sticker.borderWidth}
              />
              <Text font="mono" size="xs" weight="bold" color={sticker.color.ink}>
                {pointsLabel}
              </Text>
            </Stack>
          </Stack>
          <Text
            font="display"
            size="base"
            weight="bold"
            color={sticker.color.ink}
            numberOfLines={2}
          >
            {knute.title}
          </Text>
        </Stack>
        <Animated.View style={actionStyle}>
          <Stack style={styles.actionWrap}>
            <Stack style={styles.actionBase} />
            <Stack style={styles.actionFace} direction="row" align="center" gap="xs">
              <Stack style={styles.actionTopLight} />
              <Animated.View
                pointerEvents="none"
                style={[styles.actionShine, shineStyle]}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              />
              <Play
                size={sticker.icon.sm}
                color={sticker.color.ink}
                fill={sticker.color.ink}
                strokeWidth={sticker.borderWidth}
              />
              <Text font="display" size="sm" weight="bold" color={sticker.color.ink}>
                Ta knuten
              </Text>
            </Stack>
          </Stack>
        </Animated.View>
      </Stack>
    </StickerCard>
  )
}

const styles = StyleSheet.create({
  copy: {
    flex: 1,
    minWidth: spacing.none,
  },
  meta: {
    flexWrap: 'wrap',
  },
  iconTile: {
    width: size.otherAvatar,
    height: size.otherAvatar,
    borderRadius: sticker.radius.md,
    backgroundColor: sticker.color.accentBg,
  },
  actionWrap: {
    position: 'relative',
    marginRight: sticker.shadowOffset.base,
    marginBottom: sticker.shadowOffset.base,
  },
  actionBase: {
    position: 'absolute',
    top: sticker.shadowOffset.base,
    right: -sticker.shadowOffset.base,
    bottom: -sticker.shadowOffset.base,
    left: sticker.shadowOffset.base,
    borderRadius: sticker.radius.md,
    borderWidth: sticker.borderWidth,
    borderColor: sticker.color.ink,
    backgroundColor: sticker.color.accentStrong,
  },
  actionFace: {
    minHeight: sticker.tap.min,
    paddingHorizontal: spacing.sm,
    borderRadius: sticker.radius.md,
    borderWidth: sticker.borderWidth,
    borderColor: sticker.color.ink,
    backgroundColor: sticker.color.accent,
    overflow: 'hidden',
  },
  actionTopLight: {
    position: 'absolute',
    top: spacing['2xs'],
    right: spacing.sm,
    left: spacing.sm,
    height: spacing['2xs'],
    borderRadius: sticker.radius.full,
    backgroundColor: sticker.color.card,
  },
  actionShine: {
    position: 'absolute',
    top: spacing.xs,
    bottom: spacing.xs,
    left: spacing.none,
    width: spacing.lg,
    borderRadius: sticker.radius.full,
    backgroundColor: sticker.color.card,
  },
  completedIconTile: {
    width: size.otherAvatar,
    height: size.otherAvatar,
    borderRadius: sticker.radius.md,
    backgroundColor: sticker.color.successBg,
  },
  eyebrowSkeleton: {
    width: size.skeletonTitleWidth,
    height: size.skeletonRowMetaHeight,
  },
  titleSkeleton: {
    height: size.skeletonRowTitleHeight,
  },
  pointsSkeleton: {
    width: size.knuteActionMinWidth,
    height: sticker.tap.min,
    borderRadius: sticker.radius.md,
  },
})
