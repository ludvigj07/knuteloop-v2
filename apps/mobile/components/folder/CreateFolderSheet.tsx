import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetTextInput,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet'
import { Eyebrow, StickerButton, Text } from '../primitives'
import { fontSize, sticker, spacing } from '../../lib/theme'

// "Ny mappe" sheet — a single name field + create action. Controlled via `open`.

export function CreateFolderSheet({
  open,
  creating,
  onClose,
  onCreate,
}: {
  open: boolean
  creating: boolean
  onClose: () => void
  onCreate: (name: string) => void
}) {
  const ref = useRef<BottomSheetModal>(null)
  const snapPoints = useMemo(() => ['48%'], [])
  const [name, setName] = useState('')

  useEffect(() => {
    if (open) {
      setName('')
      ref.current?.present()
    } else {
      ref.current?.dismiss()
    }
  }, [open])

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.45} />
    ),
    [],
  )

  const trimmed = name.trim()

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      enablePanDownToClose
      keyboardBehavior="interactive"
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.handle}
      backgroundStyle={styles.sheetBg}
    >
      <BottomSheetView style={styles.content}>
        <Eyebrow>Knuteboka</Eyebrow>
        <Text font="display" weight="bold" size="xl" color={sticker.color.ink}>
          Ny mappe
        </Text>
        <Text size="sm" color={sticker.color.textMuted}>
          Navn på mappa
        </Text>
        <BottomSheetTextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="F.eks. Sosialt, Tradisjon …"
          placeholderTextColor={sticker.color.textMuted}
          autoFocus
          maxLength={100}
          returnKeyType="done"
          onSubmitEditing={() => {
            // Mirror the button's guard — don't fire a second createFolder while
            // one is already in flight (the autofocused keyboard stays up).
            if (trimmed.length >= 2 && !creating) onCreate(trimmed)
          }}
          accessibilityLabel="Navn på mappa"
        />
        <View style={styles.action}>
          <StickerButton
            label="Opprett mappe"
            variant="accent"
            fullWidth
            disabled={trimmed.length < 2}
            loading={creating}
            onPress={() => onCreate(trimmed)}
          />
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  )
}

const styles = StyleSheet.create({
  sheetBg: {
    backgroundColor: sticker.color.card,
    borderColor: sticker.color.ink,
    borderWidth: sticker.borderWidth,
    borderTopLeftRadius: sticker.radius.xl,
    borderTopRightRadius: sticker.radius.xl,
  },
  handle: { backgroundColor: sticker.color.lineStrong, width: 44 },
  content: { padding: spacing.lg, gap: spacing.sm },
  input: {
    marginTop: spacing.xs,
    minHeight: 52,
    backgroundColor: sticker.color.card,
    borderWidth: sticker.borderWidth,
    borderColor: sticker.color.ink,
    borderRadius: sticker.radius.md,
    paddingHorizontal: spacing.base,
    color: sticker.color.text,
    fontSize: fontSize.base,
    fontFamily: 'Inter_400Regular',
  },
  action: { marginTop: spacing.sm },
})
