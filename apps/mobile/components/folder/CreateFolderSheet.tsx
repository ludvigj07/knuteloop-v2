import { useEffect, useState } from 'react'
import { StyleSheet, TextInput, View } from 'react-native'
import type { FolderIconKey } from '@knuteloop/shared'
import { Eyebrow, Pressable, Sheet, StickerButton, Text } from '../primitives'
import { folderIconFor, folderIconKeys } from '../../lib/folder-icons'
import { fontSize, sticker, spacing } from '../../lib/theme'

// "Ny mappe" sheet — name field + icon picker + create action. Controlled via
// `open`. Uses the cross-platform Sheet (RN Modal) so it works on web too.

export function CreateFolderSheet({
  open,
  creating,
  onClose,
  onCreate,
}: {
  open: boolean
  creating: boolean
  onClose: () => void
  onCreate: (name: string, icon: FolderIconKey) => void
}) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState<FolderIconKey>('folder')

  // Reset the form each time the sheet opens.
  useEffect(() => {
    if (open) {
      setName('')
      setIcon('folder')
    }
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
            if (canCreate) onCreate(trimmed, icon)
          }}
          accessibilityLabel="Navn på mappa"
        />

        <Text size="sm" color={sticker.color.textMuted} style={styles.iconLabel}>
          Ikon
        </Text>
        <View style={styles.iconGrid}>
          {folderIconKeys.map((key) => {
            const Icon = folderIconFor(key)
            const selected = key === icon
            return (
              <Pressable
                key={key}
                onPress={() => setIcon(key)}
                haptic="selection"
                accessibilityLabel={`Velg ikon ${key}`}
                accessibilityState={{ selected }}
                style={[styles.iconTile, selected ? styles.iconTileActive : styles.iconTileIdle]}
              >
                <Icon
                  size={sticker.icon.md}
                  color={selected ? sticker.color.textInverse : sticker.color.ink}
                  strokeWidth={2}
                />
              </Pressable>
            )
          })}
        </View>

        <View style={styles.action}>
          <StickerButton
            label="Opprett mappe"
            variant="accent"
            fullWidth
            disabled={trimmed.length < 2}
            loading={creating}
            onPress={() => onCreate(trimmed, icon)}
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
  iconLabel: { marginTop: spacing.xs },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  iconTile: {
    width: sticker.tap.min,
    height: sticker.tap.min,
    borderRadius: sticker.radius.md,
    borderWidth: sticker.borderWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconTileIdle: { backgroundColor: sticker.color.card, borderColor: sticker.color.ink },
  iconTileActive: { backgroundColor: sticker.color.ink, borderColor: sticker.color.ink },
  action: { marginTop: spacing.sm },
})
