import { type ReactNode } from 'react'
import { Modal, StyleSheet, View } from 'react-native'
import Animated, { SlideInDown } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Pressable } from './Pressable'
import { animation, borderWidth, colors, radius, size, spacing } from '../../lib/theme'

// A bottom sheet: a dim scrim with a panel that slides up from the bottom edge.
//
// frontend.md §13 prefers @gorhom/bottom-sheet over RN's Modal, but that package
// isn't a dependency and we don't add deps here. So the compromise lives in this
// ONE primitive: RN Modal gives us the portal + screen-reader focus trapping
// (accessibilityViewIsModal), the scrim fades via the Modal's own fade, and the
// panel slides in with Reanimated (which auto-respects reduced motion). Tap the
// scrim or use the system back gesture to dismiss.
export function Sheet({
  visible,
  onClose,
  children,
  accessibilityLabel,
}: {
  visible: boolean
  onClose: () => void
  children: ReactNode
  accessibilityLabel: string
}) {
  const insets = useSafeAreaInsets()

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable
          style={styles.scrim}
          onPress={onClose}
          haptic="none"
          scale={false}
          accessibilityLabel="Lukk"
          accessibilityHint="Lukker panelet."
        >
          <View />
        </Pressable>
        <Animated.View
          entering={SlideInDown.duration(animation.duration.base)}
          style={[styles.panel, { paddingBottom: insets.bottom + spacing.lg }]}
          accessibilityViewIsModal
          accessibilityLabel={accessibilityLabel}
        >
          <View style={styles.grab} />
          {children}
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.feed.overlay },
  panel: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: borderWidth.medium,
    borderColor: colors.borderInk,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
  },
  grab: {
    alignSelf: 'center',
    width: size.skeletonTitleWidth / 3,
    height: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.borderStrong,
    marginBottom: spacing.base,
  },
})
