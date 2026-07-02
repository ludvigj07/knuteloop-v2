import { type ReactNode } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { KnoteIcon, StickerCard, Text } from '../primitives'
import { folderIconFor } from '../../lib/folder-icons'
import type { Folder } from '../../lib/api'
import { size, spacing, sticker } from '../../lib/theme'

// Horizontal folder filter for the student catalog — "Alle" + the school's
// folders, as die-cut sticker pills. Folders are the student's primary browse
// axis ("Spotify for knuter", ADR-0018); selecting one filters the knute list.
// Bleeds to the screen edges so the row scrolls under the screen padding.

export function FolderChips({
  folders,
  selected,
  onSelect,
}: {
  folders: Folder[]
  selected: string | null
  onSelect: (folderId: string | null) => void
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.bleed}
      contentContainerStyle={styles.row}
      keyboardShouldPersistTaps="handled"
    >
      <FolderChip
        label="Alle"
        active={selected === null}
        onPress={() => onSelect(null)}
        icon={
          <KnoteIcon
            name="knute"
            size={sticker.icon.sm}
            color={selected === null ? sticker.color.textInverse : sticker.color.ink}
          />
        }
      />
      {folders.map((folder) => {
        const Icon = folderIconFor(folder.icon)
        const active = selected === folder.id
        return (
          <FolderChip
            key={folder.id}
            label={folder.name}
            active={active}
            onPress={() => onSelect(folder.id)}
            icon={
              <Icon
                size={sticker.icon.sm}
                color={active ? sticker.color.textInverse : sticker.color.ink}
                strokeWidth={2.5}
              />
            }
          />
        )
      })}
    </ScrollView>
  )
}

function FolderChip({
  label,
  icon,
  active,
  onPress,
}: {
  label: string
  icon: ReactNode
  active: boolean
  onPress: () => void
}) {
  return (
    <StickerCard
      tone={active ? 'primary' : 'surface'}
      radius="full"
      shadow="sm"
      padding="none"
      onPress={onPress}
      haptic="selection"
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Viser knuter i denne mappa."
      accessibilitySelected={active}
    >
      <View style={styles.chipContent}>
        {icon}
        <Text
          size="sm"
          weight="semibold"
          color={active ? sticker.color.textInverse : sticker.color.ink}
        >
          {label}
        </Text>
      </View>
    </StickerCard>
  )
}

const styles = StyleSheet.create({
  bleed: {
    marginHorizontal: -spacing.base,
  },
  row: {
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    // Breathing room so the hard offset shadows are not clipped by the ScrollView.
    paddingVertical: spacing.xs,
    paddingRight: spacing.lg,
  },
  chipContent: {
    minHeight: size.actionMinHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
})
