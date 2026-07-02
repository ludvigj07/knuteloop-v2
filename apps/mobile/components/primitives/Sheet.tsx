import { type ReactNode } from 'react'
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { sticker, spacing } from '../../lib/theme'

// A bottom-sheet-style panel built on React Native's Modal — which, unlike
// @gorhom/bottom-sheet, renders reliably on react-native-web AND native. Used for
// the create-folder + knute-detail sheets so those flows work in the browser too.
// Tap the dim backdrop (or Android back) to close.

export type SheetProps = {
  open: boolean
  onClose: () => void
  children: ReactNode
}

export function Sheet({ open, onClose, children }: SheetProps) {
  const insets = useSafeAreaInsets()
  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.fill}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Lukk"
        />
        {/* The KAV spans the FULL viewport (flex:1) so the panel's %-maxHeight
            resolves against the screen on web too — with an auto-height parent
            RN-web ignored it, the panel outgrew the viewport and the CTA ended
            up below the fold. box-none lets taps outside the panel reach the
            backdrop. */}
        <KeyboardAvoidingView
          style={styles.kav}
          pointerEvents="box-none"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.panel, { paddingBottom: insets.bottom + spacing.lg }]}>
            <View style={styles.handle} />
            {children}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 26, 46, 0.45)',
  },
  kav: { flex: 1, justifyContent: 'flex-end' },
  panel: {
    maxHeight: '92%',
    flexDirection: 'column',
    backgroundColor: sticker.color.card,
    borderTopWidth: sticker.borderWidth,
    borderLeftWidth: sticker.borderWidth,
    borderRightWidth: sticker.borderWidth,
    borderColor: sticker.color.ink,
    borderTopLeftRadius: sticker.radius.xl,
    borderTopRightRadius: sticker.radius.xl,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: sticker.radius.full,
    backgroundColor: sticker.color.lineStrong,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
})
