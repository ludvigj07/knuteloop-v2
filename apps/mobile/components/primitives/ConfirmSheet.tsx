import { StyleSheet, View } from 'react-native'
import { TriangleAlert } from 'lucide-react-native'
import { Sheet } from './Sheet'
import { StickerButton } from './StickerButton'
import { Text } from './Text'
import { spacing, sticker } from '../../lib/theme'

// Destructive confirmation as a sticker sheet. Replaces Alert.alert for
// confirmations: RN-web silently no-ops multi-button Alert.alert, which made
// «Fjern fra knuteboka» a dead button in the browser — and a sheet is the
// on-brand pattern anyway (frontend.md: sheets over modals).

export function ConfirmSheet({
  open,
  title,
  message,
  confirmLabel,
  confirming = false,
  onCancel,
  onConfirm,
}: {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  confirming?: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <Sheet open={open} onClose={onCancel}>
      <View style={styles.body}>
        <View style={styles.iconWrap}>
          <TriangleAlert size={sticker.icon.lg} color={sticker.color.danger} strokeWidth={2.2} />
        </View>
        <Text font="display" weight="bold" size="xl" color={sticker.color.ink} align="center">
          {title}
        </Text>
        <Text size="sm" color={sticker.color.textMuted} align="center" style={styles.message}>
          {message}
        </Text>
        <View style={styles.actions}>
          <StickerButton
            label={confirmLabel}
            variant="destructive"
            fullWidth
            loading={confirming}
            onPress={onConfirm}
          />
          <StickerButton
            label="Avbryt"
            variant="secondary"
            fullWidth
            disabled={confirming}
            onPress={onCancel}
          />
        </View>
      </View>
    </Sheet>
  )
}

const styles = StyleSheet.create({
  body: { gap: spacing.sm, alignItems: 'center' },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: sticker.radius.full,
    borderWidth: sticker.borderWidth,
    borderColor: sticker.color.danger,
    backgroundColor: sticker.color.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: { lineHeight: 20, paddingHorizontal: spacing.sm },
  actions: { alignSelf: 'stretch', gap: spacing.sm, marginTop: spacing.sm },
})
