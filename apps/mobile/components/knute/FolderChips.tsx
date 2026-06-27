import { type ReactNode } from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { Pressable, Text } from '../primitives'
import { folderIconFor } from '../../lib/folder-icons'
import type { Folder } from '../../lib/api'
import { borderWidth, colors, fontSize, fontWeight, radius, size, spacing } from '../../lib/theme'

// Horizontal folder filter for the student catalog. "Alle" + the school's folders
// (each with its lucide icon). Folders are the student's primary browse axis
// ("Spotify for knuter") — selecting one filters the knute list to that folder.
// Styled with the legacy tokens so it matches the (pre-sticker) Knuter tab.

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
      contentContainerStyle={styles.row}
      keyboardShouldPersistTaps="handled"
    >
      <Chip label="Alle" active={selected === null} onPress={() => onSelect(null)} />
      {folders.map((folder) => {
        const Icon = folderIconFor(folder.icon)
        const active = selected === folder.id
        return (
          <Chip
            key={folder.id}
            label={folder.name}
            active={active}
            onPress={() => onSelect(folder.id)}
            icon={
              <Icon
                size={fontSize.base}
                color={active ? colors.text.inverse : colors.ink}
                strokeWidth={2.5}
              />
            }
          />
        )
      })}
    </ScrollView>
  )
}

function Chip({
  label,
  icon,
  active,
  onPress,
}: {
  label: string
  icon?: ReactNode
  active: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      haptic="selection"
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Viser knuter i denne mappa."
      accessibilityState={{ selected: active }}
      style={[styles.chip, active ? styles.chipActive : styles.chipIdle]}
    >
      {icon}
      <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextIdle]}>
        {label}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingRight: spacing.base,
  },
  chip: {
    minHeight: size.actionMinHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: borderWidth.thin,
  },
  chipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipIdle: { backgroundColor: colors.surface, borderColor: colors.borderInk },
  chipText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  chipTextActive: { color: colors.text.inverse },
  chipTextIdle: { color: colors.ink },
})
