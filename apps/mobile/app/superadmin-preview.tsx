import { lazy, Suspense } from 'react'
import { StyleSheet } from 'react-native'
import { Redirect, Stack as RouterStack, type ErrorBoundaryProps } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Skeleton, Stack, StickerButton, Text } from '../components/primitives'
import { size, spacing, sticker } from '../lib/theme'

// A dev preview is not employee authorization. No school role enables this
// route in a release build, and no platform data is fetched here.
const StaffPreview = lazy(() => import('../components/staff/StaffPreview'))

export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  const insets = useSafeAreaInsets()
  return (
    <Stack gap="base" style={[styles.loading, {
      paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg,
      paddingLeft: insets.left + spacing.base, paddingRight: insets.right + spacing.base,
    }]}>
      <Text font="display" size="xl" weight="bold" color={sticker.color.ink} accessibilityRole="header">Kunne ikke åpne forhåndsvisningen</Text>
      <Text color={sticker.color.textMuted}>Prøv å laste den på nytt.</Text>
      <StickerButton label="Prøv igjen" onPress={() => void retry()} />
    </Stack>
  )
}

export default function StaffPreviewRoute() {
  if (!__DEV__) return <Redirect href="/" />
  return (
    <>
      <RouterStack.Screen options={{ headerShown: false }} />
      <Suspense fallback={<PreviewLoading />}><StaffPreview /></Suspense>
    </>
  )
}

function PreviewLoading() {
  const insets = useSafeAreaInsets()
  return (
    <Stack gap="base" style={[styles.loading, {
      paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg,
      paddingLeft: insets.left + spacing.base, paddingRight: insets.right + spacing.base,
    }]} accessibilityLabel="Laster forhåndsvisningen">
      <Skeleton style={styles.title} />
      <Skeleton style={styles.card} />
    </Stack>
  )
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: sticker.color.paper },
  title: { width: size.skeletonTitleWidth, height: size.skeletonTitleHeight },
  card: { height: size.staffListItemEstimate, borderRadius: sticker.radius.lg },
})
