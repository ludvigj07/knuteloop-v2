import { useEffect, useState } from 'react'
import { StyleSheet, TextInput, View } from 'react-native'
import { Eyebrow, Sheet, StickerButton, Text } from '../primitives'
import { fontSize, sticker, spacing } from '../../lib/theme'

// "Ny mappe" sheet — a single name field + create action. Controlled via `open`.
// Uses the cross-platform Sheet (RN Modal) so it works on web too.

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
  const [name, setName] = useState('')

  // Reset the field each time the sheet opens.
  useEffect(() => {
    if (open) setName('')
  }, [open])

  const trimmed = name.trim()
  const canCreate = trimmed.length >= 2 && !creating

  return (
    <Sheet open={open} onClose={onClose}>
      <View style={styles.content}>
        <Eyebrow>Knuteboka</Eyebrow>
        <Text font="display" weight="bold" size="xl" color={sticker.color.ink}>
          Ny mappe
        </Text>
        <Text size="sm" color={sticker.color.textMuted}>
          Navn på mappa
        </Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="F.eks. Sosialt, Tradisjon …"
          placeholderTextColor={sticker.color.textMuted}
          autoFocus
          maxLength={100}
          returnKeyType="done"
          onSubmitEditing={() => {
            if (canCreate) onCreate(trimmed)
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
      </View>
    </Sheet>
  )
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.sm },
  input: {
    marginTop: spacing.xs,
    minHeight: sticker.tap.size,
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
