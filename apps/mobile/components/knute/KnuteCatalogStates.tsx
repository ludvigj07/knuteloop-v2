import { StyleSheet } from 'react-native'
import { Stack as RouterStack } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AppTabBar } from '../AppTabBar'
import { Skeleton, Stack, StickerButton, StickerCard, Text } from '../primitives'
import { size, spacing, sticker } from '../../lib/theme'

export function KnuteCatalogLoading() {
  const insets = useSafeAreaInsets()

  return (
    <Stack style={styles.root}>
      <RouterStack.Screen options={{ headerShown: false }} />
      <Stack
        style={[
          styles.content,
          {
            paddingTop: insets.top + spacing.lg,
            paddingRight: insets.right + spacing.base,
            paddingBottom: insets.bottom + size.bottomNavMinHeight + spacing.xl,
            paddingLeft: insets.left + spacing.base,
          },
        ]}
        gap="base"
      >
        <Skeleton style={styles.skeletonHeading} />
        <Skeleton style={styles.skeletonSearch} />
        {[1, 2, 3, 4].map((item) => (
          <Stack key={item} style={styles.skeletonCard} gap="sm">
            <Skeleton style={styles.skeletonRowTitle} />
            <Skeleton style={styles.skeletonRowMeta} />
          </Stack>
        ))}
      </Stack>
      <AppTabBar active="knuter" />
    </Stack>
  )
}

export function KnuteCatalogError({ message, onRetry }: { message: string; onRetry: () => void }) {
  const insets = useSafeAreaInsets()

  return (
    <Stack style={styles.root}>
      <RouterStack.Screen options={{ headerShown: false }} />
      <Stack
        style={[
          styles.center,
          {
            paddingTop: insets.top + spacing.lg,
            paddingRight: insets.right + spacing.lg,
            paddingBottom: insets.bottom + size.bottomNavMinHeight + spacing.xl,
            paddingLeft: insets.left + spacing.lg,
          },
        ]}
        align="stretch"
        justify="center"
      >
        <StickerCard radius="lg" shadow="sm">
          <Stack align="start" gap="md">
            <Text font="display" weight="bold" size="xl" color={sticker.color.ink}>
              Kunne ikke laste knutene
            </Text>
            <Text size="sm" color={sticker.color.textMuted}>
              {message}
            </Text>
            <StickerButton label="Prøv igjen" variant="primary" onPress={onRetry} />
          </Stack>
        </StickerCard>
      </Stack>
      <AppTabBar active="knuter" />
    </Stack>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: sticker.color.paper,
  },
  content: {
    flex: 1,
  },
  center: {
    flex: 1,
  },
  skeletonHeading: {
    width: size.skeletonTitleWidth,
    height: size.skeletonTitleHeight,
  },
  skeletonSearch: {
    minHeight: size.searchMinHeight,
    borderRadius: sticker.radius.sm,
  },
  skeletonCard: {
    backgroundColor: sticker.color.card,
    borderWidth: sticker.borderWidth,
    borderColor: sticker.color.ink,
    borderRadius: sticker.radius.md,
    padding: spacing.base,
  },
  skeletonRowTitle: {
    height: size.skeletonRowTitleHeight,
  },
  skeletonRowMeta: {
    width: size.skeletonTitleWidth,
    height: size.skeletonRowMetaHeight,
  },
})
