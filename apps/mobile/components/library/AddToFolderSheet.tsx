import { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, TextInput, View } from 'react-native'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, FolderPlus, TriangleAlert, X } from 'lucide-react-native'
import type { FolderIconKey } from '@knuteloop/shared'
import { Eyebrow, Pressable, Sheet, StickerButton, StickerCard, Text } from '../primitives'
import { createFolder, fetchFolders, type Folder, type LibraryKnute } from '../../lib/api'
import { folderIconFor, folderIconKeys } from '../../lib/folder-icons'
import { isSensitiveKnute } from '../../lib/knute-ui'
import { haptics } from '../../lib/haptics'
import { fontSize, sticker, spacing } from '../../lib/theme'

// "Legg til i …" sheet — the "+" on a library knute opens this to choose which of the
// school's folders the knute lands in ("add to playlist"). Multi-select + an inline
// "Ny mappe" form (reuses the createFolder API). Built on the cross-platform Sheet so
// it works in the browser too. Confirm → onConfirm(knute, folderIds); an empty array
// imports into the catalog only (the backend import is idempotent + folder-agnostic).

export function AddToFolderSheet({
  knute,
  confirming,
  onClose,
  onConfirm,
}: {
  knute: LibraryKnute | null
  confirming: boolean
  onClose: () => void
  onConfirm: (knute: LibraryKnute, folderIds: string[]) => void
}) {
  // Keep the last knute rendered through the close animation.
  const [shown, setShown] = useState<LibraryKnute | null>(knute)
  useEffect(() => {
    if (knute) setShown(knute)
  }, [knute])

  return (
    <Sheet open={knute !== null} onClose={onClose}>
      {shown ? (
        // key resets the picker's selection when a different knute opens.
        <Picker
          key={shown.id}
          knute={shown}
          confirming={confirming}
          onConfirm={(folderIds) => onConfirm(shown, folderIds)}
        />
      ) : null}
    </Sheet>
  )
}

function Picker({
  knute,
  confirming,
  onConfirm,
}: {
  knute: LibraryKnute
  confirming: boolean
  onConfirm: (folderIds: string[]) => void
}) {
  const qc = useQueryClient()
  const folders = useQuery({ queryKey: ['folders'], queryFn: fetchFolders })
  const [selected, setSelected] = useState<string[]>([])
  const [showNew, setShowNew] = useState(false)

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const createMut = useMutation({
    mutationFn: ({ name, icon }: { name: string; icon: FolderIconKey }) => createFolder(name, icon),
    onSuccess: (res) => {
      haptics.success()
      void qc.invalidateQueries({ queryKey: ['folders'] })
      setSelected((prev) => [...prev, res.folder.id]) // auto-select the freshly made folder
      setShowNew(false)
    },
  })

  const list = folders.data?.folders ?? []
  const count = selected.length
  const confirmLabel =
    count === 0
      ? 'Legg til uten mappe'
      : count === 1
        ? 'Legg til i 1 mappe'
        : `Legg til i ${count} mapper`

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Eyebrow>Legg til</Eyebrow>
      <Text font="display" weight="bold" size="xl" color={sticker.color.ink} numberOfLines={2}>
        {knute.title}
      </Text>
      <Text size="sm" color={sticker.color.textMuted}>
        Velg hvilke mapper knuten skal ligge i. Du kan endre det senere.
      </Text>

      {isSensitiveKnute(knute) ? (
        <StickerCard tone="accent" shadow="none" radius="md" padding="md">
          <View style={styles.warnRow}>
            <TriangleAlert size={sticker.icon.sm} color={sticker.color.accentStrong} strokeWidth={2} />
            <Text size="sm" weight="semibold" color={sticker.color.accentStrong} style={styles.warnText}>
              Sensitiv knute{knute.minAge >= 18 ? ' (18+)' : ''}
              {knute.evidenceType === 'text' ? ' — kun tekst-bevis' : ''}. Pass på at den passer for
              kullet.
            </Text>
          </View>
        </StickerCard>
      ) : null}

      <View style={styles.folders}>
        {list.map((f) => (
          <FolderToggle
            key={f.id}
            folder={f}
            selected={selected.includes(f.id)}
            onToggle={() => toggle(f.id)}
          />
        ))}
        {list.length === 0 && !folders.isLoading ? (
          <Text size="sm" color={sticker.color.textMuted}>
            Ingen mapper ennå. Lag en under, eller legg til uten mappe.
          </Text>
        ) : null}
      </View>

      {showNew ? (
        <NewFolderForm
          creating={createMut.isPending}
          onCancel={() => setShowNew(false)}
          onCreate={(name, icon) => createMut.mutate({ name, icon })}
        />
      ) : (
        <Pressable
          onPress={() => setShowNew(true)}
          haptic="light"
          accessibilityRole="button"
          accessibilityLabel="Lag en ny mappe"
          style={styles.newRow}
        >
          <FolderPlus size={sticker.icon.sm} color={sticker.color.primary} strokeWidth={2.5} />
          <Text weight="semibold" color={sticker.color.primary}>
            Ny mappe
          </Text>
        </Pressable>
      )}

      <View style={styles.action}>
        <StickerButton
          label={confirmLabel}
          variant={count === 0 ? 'secondary' : 'accent'}
          fullWidth
          loading={confirming}
          onPress={() => onConfirm(selected)}
        />
      </View>
    </ScrollView>
  )
}

function FolderToggle({
  folder,
  selected,
  onToggle,
}: {
  folder: Folder
  selected: boolean
  onToggle: () => void
}) {
  const Icon = folderIconFor(folder.icon)
  return (
    <Pressable
      onPress={onToggle}
      haptic="selection"
      accessibilityRole="button"
      accessibilityLabel={`${folder.name}, ${folder.knuteCount} ${folder.knuteCount === 1 ? 'knute' : 'knuter'}`}
      accessibilityState={{ selected }}
      style={[styles.folderRow, selected ? styles.folderRowOn : styles.folderRowOff]}
    >
      <View style={[styles.folderIcon, selected ? styles.tileOn : styles.tileOff]}>
        <Icon
          size={sticker.icon.sm}
          color={selected ? sticker.color.textInverse : sticker.color.ink}
          strokeWidth={2}
        />
      </View>
      <View style={styles.folderText}>
        <Text weight="semibold" color={sticker.color.ink} numberOfLines={1}>
          {folder.name}
        </Text>
        <Text size="xs" color={sticker.color.textMuted}>
          {folder.knuteCount} {folder.knuteCount === 1 ? 'knute' : 'knuter'}
        </Text>
      </View>
      <View style={[styles.checkbox, selected ? styles.tileOn : styles.checkboxOff]}>
        {selected ? (
          <Check size={sticker.icon.sm} color={sticker.color.textInverse} strokeWidth={3} />
        ) : null}
      </View>
    </Pressable>
  )
}

function NewFolderForm({
  creating,
  onCancel,
  onCreate,
}: {
  creating: boolean
  onCancel: () => void
  onCreate: (name: string, icon: FolderIconKey) => void
}) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState<FolderIconKey>('folder')
  const trimmed = name.trim()
  const canCreate = trimmed.length >= 2 && !creating

  return (
    <StickerCard tone="soft" shadow="none" radius="md" padding="md" style={styles.newForm}>
      <View style={styles.newHeader}>
        <Text weight="semibold" color={sticker.color.ink}>
          Ny mappe
        </Text>
        <Pressable onPress={onCancel} haptic="light" accessibilityLabel="Avbryt ny mappe" hitSlop={8}>
          <X size={sticker.icon.sm} color={sticker.color.textMuted} strokeWidth={2} />
        </Pressable>
      </View>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="F.eks. Sport, Tradisjon …"
        placeholderTextColor={sticker.color.textMuted}
        autoFocus
        maxLength={100}
        returnKeyType="done"
        onSubmitEditing={() => {
          if (canCreate) onCreate(trimmed, icon)
        }}
        accessibilityLabel="Navn på mappa"
      />
      <View style={styles.iconGrid}>
        {folderIconKeys.map((key) => {
          const TileIcon = folderIconFor(key)
          const on = key === icon
          return (
            <Pressable
              key={key}
              onPress={() => setIcon(key)}
              haptic="selection"
              accessibilityLabel={`Velg ikon ${key}`}
              accessibilityState={{ selected: on }}
              style={[styles.iconTile, on ? styles.tileOn : styles.tileOff]}
            >
              <TileIcon
                size={sticker.icon.sm}
                color={on ? sticker.color.textInverse : sticker.color.ink}
                strokeWidth={2}
              />
            </Pressable>
          )
        })}
      </View>
      <StickerButton
        label="Opprett mappe"
        variant="primary"
        size="sm"
        fullWidth
        disabled={trimmed.length < 2}
        loading={creating}
        onPress={() => onCreate(trimmed, icon)}
      />
    </StickerCard>
  )
}

const tile = {
  width: sticker.tap.min,
  height: sticker.tap.min,
  borderRadius: sticker.radius.md,
  borderWidth: sticker.borderWidth,
  alignItems: 'center',
  justifyContent: 'center',
} as const

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.sm },
  warnRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  warnText: { flex: 1, lineHeight: 20 },
  folders: { gap: spacing.sm, marginTop: spacing.xs },
  folderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm,
    borderRadius: sticker.radius.md,
    borderWidth: sticker.borderWidth,
  },
  folderRowOn: { backgroundColor: sticker.color.surfaceSoft, borderColor: sticker.color.ink },
  folderRowOff: { backgroundColor: sticker.color.card, borderColor: sticker.color.line },
  folderIcon: { ...tile },
  folderText: { flex: 1, gap: spacing['2xs'] },
  checkbox: { ...tile },
  checkboxOff: { backgroundColor: sticker.color.card, borderColor: sticker.color.line },
  tileOn: { backgroundColor: sticker.color.ink, borderColor: sticker.color.ink },
  tileOff: { backgroundColor: sticker.color.card, borderColor: sticker.color.ink },
  newRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  newForm: { gap: spacing.sm, marginTop: spacing.xs },
  newHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  input: {
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
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  iconTile: { ...tile },
  action: { marginTop: spacing.sm },
})
