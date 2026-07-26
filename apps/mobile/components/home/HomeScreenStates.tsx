import { StyleSheet } from 'react-native'
import { Stack as RouterStack } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AppTabBar } from '../AppTabBar'
import { Skeleton, Stack, StickerButton, StickerCard, Text } from '../primitives'
import { size, spacing, sticker } from '../../lib/theme'

export function HomeLoadingState() {
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
        gap="lg"
      >
        <Stack gap="sm">
          <Skeleton style={styles.skeletonKicker} />
          <Skeleton style={styles.skeletonHeading} />
          <Skeleton style={styles.skeletonIntro} />
        </Stack>
        <StickerCard padding="none" shadow="sm">
          <Skeleton style={styles.skeletonMedia} />
          <Stack padding="base" gap="sm">
            <Skeleton style={styles.skeletonKicker} />
            <Skeleton style={styles.skeletonCardTitle} />
          </Stack>
        </StickerCard>
        {[1, 2].map((item) => (
          <StickerCard key={item} shadow="sm">
            <Stack gap="sm">
              <Skeleton style={styles.skeletonCardTitle} />
              <Skeleton style={styles.skeletonIntro} />
            </Stack>
          </StickerCard>
        ))}
      </Stack>
      <AppTabBar active="home" />
    </Stack>
  )
}

export function HomeErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
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
        <StickerCard shadow="sm">
          <Stack gap="md" align="start">
            <Text font="display" size="xl" weight="bold" color={sticker.color.ink}>
              Kunne ikke laste innholdet
            </Text>
            <Text size="sm" color={sticker.color.textMuted}>
              {message}
            </Text>
            <StickerButton label="Prøv igjen" variant="primary" onPress={onRetry} />
          </Stack>
        </StickerCard>
      </Stack>
      <AppTabBar active="home" />
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
  skeletonKicker: {
    width: size.skeletonTitleWidth,
    height: size.skeletonRowMetaHeight,
  },
  skeletonHeading: {
    height: size.skeletonTitleHeight,
  },
  skeletonIntro: {
    width: size.leaderboardSelectWidth,
    height: size.skeletonRowTitleHeight,
  },
  skeletonMedia: {
    height: size.homeActivityMediaHeight,
    borderTopLeftRadius: sticker.radius.lg,
    borderTopRightRadius: sticker.radius.lg,
  },
  skeletonCardTitle: {
    height: size.skeletonRowTitleHeight,
  },
})
