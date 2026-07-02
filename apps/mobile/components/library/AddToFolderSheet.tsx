import { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, TextInput, View } from 'react-native'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, FolderPlus, Lock, Pencil, TriangleAlert, X } from 'lucide-react-native'
import type { FolderIconKey } from '@knuteloop/shared'
import { Eyebrow, Pressable, Sheet, StickerButton, StickerCard, Text } from '../primitives'
import { createFolder, fetchFolders, type Folder, type LibraryKnute } from '../../lib/api'
import { folderIconFor, folderIconKeys } from '../../lib/folder-icons'
import { isSensitiveKnute } from '../../lib/knute-ui'
import { formatNumber } from '../../lib/format'
import { haptics } from '../../lib/haptics'
import { fontSize, size, sticker, spacing } from '../../lib/theme'

// "Legg til i …" — the "+" on a library knute opens this sheet (Ludvig's demo,
// locked 2026-07-02):
//   • The theme folder comes PRE-CHECKED with a «Foreslått»-badge; if the school
//     has no folder with that name, a synthetic «Ny mappe: <tema>» row is
//     pre-checked instead (created on confirm).
//   • Browsing from a folder (contextFolderId) pre-checks THAT folder instead.
//   • MINST ÉN mappe — the CTA is locked at zero (ADR-0018 allows folderless
//     imports at the API level; the product does not).
//   • A locked «Alle knuter»-row explains the implicit membership.
//   • ✏️ toggles inline editing of title/points/description — the school's COPY
//     is saved with the edits ("biblioteket er bare et forslag").

export type AddToFolderPayload = {
  /** Existing school folders to file the copy into. */
  folderIds: string[]
  /** Names for the toast (includes newFolderName when set). */
  folderNames: string[]
  /** Create this folder first and include it (the suggested theme folder). */
  newFolderName: string | null
  /** Edited copy fields; null = saved as-is. */
  overrides: { title?: string; description?: string | null; points?: number } | null
}

export function AddToFolderSheet({
  knute,
  mode = 'add',
  copy,
  initialFolderIds,
  contextFolderId,
  confirming,
  onClose,
  onConfirm,
  onRemove,
}: {
  knute: LibraryKnute | null
  /** 'add' = import flow; 'manage' = the ✓ — edit the existing copy's folders/text. */
  mode?: 'add' | 'manage'
  /** Manage mode: the school's copy (its CURRENT title/points/description). */
  copy?: { title: string; description: string | null; points: number } | null
  /** Manage mode: the copy's current folder memberships (pre-checked). */
  initialFolderIds?: string[]
  /** Set when browsing the library FROM a folder — pre-checks that folder. */
  contextFolderId?: string | null
  confirming: boolean
  onClose: () => void
  onConfirm: (knute: LibraryKnute, payload: AddToFolderPayload) => void
  /** Manage mode: «Fjern fra knuteboka» — archives the copy (students stop seeing it). */
  onRemove?: () => void
}) {
  // Keep the last knute rendered through the close animation.
  const [shown, setShown] = useState<LibraryKnute | null>(knute)
  useEffect(() => {
    if (knute) setShown(knute)
  }, [knute])

  return (
    <Sheet open={knute !== null} onClose={onClose}>
      {shown ? (
        // key resets selection + edit state when a different knute opens.
        <Picker
          key={`${mode}-${shown.id}`}
          knute={shown}
          mode={mode}
          copy={copy ?? null}
          initialFolderIds={initialFolderIds ?? null}
          contextFolderId={contextFolderId ?? null}
          confirming={confirming}
          onConfirm={(payload) => onConfirm(shown, payload)}
          onRemove={onRemove ?? null}
        />
      ) : null}
    </Sheet>
  )
}

function Picker({
  knute,
  mode,
  copy,
  initialFolderIds,
  contextFolderId,
  confirming,
  onConfirm,
  onRemove,
}: {
  knute: LibraryKnute
  mode: 'add' | 'manage'
  copy: { title: string; description: string | null; points: number } | null
  initialFolderIds: string[] | null
  contextFolderId: string | null
  confirming: boolean
  onConfirm: (payload: AddToFolderPayload) => void
  onRemove: (() => void) | null
}) {
  const qc = useQueryClient()
  const folders = useQuery({ queryKey: ['folders'], queryFn: fetchFolders })
  const [selected, setSelected] = useState<string[]>([])
  const [suggestNewOn, setSuggestNewOn] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [showNew, setShowNew] = useState(false)

  // Inline edit ("rediger før lagring" / manage: edit the copy). Baseline =
  // the copy in manage mode, else the library values.
  const base = {
    title: copy?.title ?? knute.title,
    points: copy?.points ?? knute.points,
    description: (copy ? copy.description : knute.description) ?? '',
  }
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(base.title)
  const [pointsText, setPointsText] = useState(String(base.points))
  const [description, setDescription] = useState(base.description)

  const list = folders.data?.folders ?? []
  const themeName = knute.suggestedFolder
  const themeMatch = list.find(
    (f) => f.name.toLocaleLowerCase('nb-NO') === themeName.toLocaleLowerCase('nb-NO'),
  )

  // Pre-check once folders have loaded. Add: context folder wins, else the
  // theme folder, else the synthetic «Ny mappe: <tema>» row. Manage: the
  // copy's CURRENT memberships.
  useEffect(() => {
    if (initialized || folders.isLoading) return
    if (mode === 'manage') {
      setSelected(initialFolderIds ?? [])
    } else if (contextFolderId && list.some((f) => f.id === contextFolderId)) {
      setSelected([contextFolderId])
    } else if (themeMatch) {
      setSelected([themeMatch.id])
    } else {
      setSuggestNewOn(true)
    }
    setInitialized(true)
  }, [initialized, folders.isLoading, list, mode, initialFolderIds, contextFolderId, themeMatch])

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

  const points = Number.parseInt(pointsText, 10)
  const titleTrim = title.trim()
  const descTrim = description.trim()
  const edited =
    titleTrim !== base.title ||
    (Number.isFinite(points) && points !== base.points) ||
    descTrim !== base.description
  const editValid = titleTrim.length > 0 && Number.isFinite(points) && points >= 0 && points <= 1000

  const count = selected.length + (suggestNewOn ? 1 : 0)
  // Add: minst én mappe. Manage: zero is legal — the knute then lives only in
  // «Alle knuter» (matching the folder-view's remove semantics).
  const canConfirm = (mode === 'manage' || count > 0) && !editing && editValid

  const handleConfirm = () => {
    const overrides = edited
      ? {
          ...(titleTrim !== base.title ? { title: titleTrim } : {}),
          ...(Number.isFinite(points) && points !== base.points ? { points } : {}),
          ...(descTrim !== base.description ? { description: descTrim || null } : {}),
        }
      : null
    onConfirm({
      folderIds: selected,
      folderNames: [
        ...selected.map((id) => list.find((f) => f.id === id)?.name ?? ''),
        ...(suggestNewOn ? [themeName] : []),
      ].filter(Boolean),
      newFolderName: suggestNewOn ? themeName : null,
      overrides,
    })
  }

  return (
    // Scrollable content + a PINNED footer: the CTA (and «Fjern») must never
    // scroll out of view — Ludvig's feedback from the floating web-sheet.
    <View style={styles.sheetBody}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
      <View style={styles.headRow}>
        <View style={styles.headText}>
          <Eyebrow>{mode === 'manage' ? 'Endre kopien' : 'Legg til'}</Eyebrow>
          {editing ? null : (
            <Text font="display" weight="bold" size="xl" color={sticker.color.ink} numberOfLines={2}>
              {titleTrim || knute.title}
            </Text>
          )}
        </View>
        <Pressable
          onPress={() => {
            if (editing && !editValid) return
            setEditing((v) => !v)
          }}
          haptic="light"
          accessibilityRole="button"
          accessibilityLabel={editing ? 'Ferdig med redigering' : 'Rediger knuten før lagring'}
          accessibilityState={{ selected: editing }}
          style={[styles.pen, editing ? styles.penOn : null]}
        >
          {editing ? (
            <Check size={sticker.icon.sm} color={sticker.color.textInverse} strokeWidth={2.5} />
          ) : (
            <Pencil size={sticker.icon.sm} color={sticker.color.ink} strokeWidth={2.2} />
          )}
        </Pressable>
      </View>

      {editing ? (
        <View style={styles.editForm}>
          <Text size="xs" weight="bold" color={sticker.color.textMuted}>
            NAVN
          </Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            maxLength={200}
            accessibilityLabel="Navn på knuten"
          />
          <Text size="xs" weight="bold" color={sticker.color.textMuted}>
            POENG
          </Text>
          <TextInput
            style={[styles.input, styles.inputSmall]}
            value={pointsText}
            onChangeText={(v) => setPointsText(v.replace(/[^0-9]/g, '').slice(0, 4))}
            keyboardType="number-pad"
            accessibilityLabel="Poeng"
          />
          <Text size="xs" weight="bold" color={sticker.color.textMuted}>
            BESKRIVELSE
          </Text>
          <TextInput
            style={[styles.input, styles.inputMulti]}
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={2000}
            accessibilityLabel="Beskrivelse"
          />
          <Text size="xs" color={sticker.color.textMuted}>
            Endringene lagres på skolens kopi — biblioteket er bare et forslag.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.metaRow}>
            <View style={styles.pill}>
              <Text size="xs" weight="semibold" font="mono" color={sticker.color.ink}>
                {formatNumber(Number.isFinite(points) ? points : base.points)} P
              </Text>
            </View>
            {edited ? (
              <Text size="xs" weight="semibold" color={sticker.color.primary}>
                Redigert
              </Text>
            ) : null}
          </View>
          {descTrim ? (
            <Text size="sm" color={sticker.color.textMuted} numberOfLines={3}>
              {descTrim}
            </Text>
          ) : null}
        </>
      )}

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

      {/* The implicit membership, made visible (Ludvig's demo). */}
      <View style={styles.alleRow} accessible accessibilityLabel="Alle knuter — havner her uansett">
        <View style={[styles.folderIcon, styles.alleTile]}>
          <Lock size={sticker.icon.sm} color={sticker.color.textInverse} strokeWidth={2.2} />
        </View>
        <View style={styles.folderText}>
          <Text weight="semibold" color={sticker.color.ink}>
            Alle knuter
          </Text>
          <Text size="xs" color={sticker.color.textMuted}>
            Havner her uansett
          </Text>
        </View>
      </View>

      <View style={styles.pickHead}>
        <Text size="xs" weight="bold" color={sticker.color.textMuted}>
          VELG MAPPE
        </Text>
        {mode === 'add' ? (
          <Text size="xs" color={sticker.color.textMuted}>
            Minst én
          </Text>
        ) : null}
      </View>

      <View style={styles.folders}>
        {mode === 'add' && !themeMatch && initialized ? (
          <SuggestedNewRow
            name={themeName}
            selected={suggestNewOn}
            onToggle={() => setSuggestNewOn((v) => !v)}
          />
        ) : null}
        {list.map((f) => (
          <FolderToggle
            key={f.id}
            folder={f}
            suggested={mode === 'add' && themeMatch?.id === f.id}
            selected={selected.includes(f.id)}
            onToggle={() => toggle(f.id)}
          />
        ))}
        {list.length === 0 && !folders.isLoading && themeMatch ? (
          <Text size="sm" color={sticker.color.textMuted}>
            Ingen mapper ennå. Lag en under.
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

      </ScrollView>

      <View style={styles.footer}>
        <StickerButton
          label={
            mode === 'manage'
              ? 'Lagre'
              : count <= 1
                ? 'Legg til i 1 mappe'
                : `Legg til i ${count} mapper`
          }
          variant="accent"
          fullWidth
          disabled={!canConfirm}
          loading={confirming}
          onPress={handleConfirm}
          accessibilityHint={
            editing
              ? 'Fullfør redigeringen med haken først.'
              : mode === 'manage'
                ? 'Lagrer mappevalg og tekst på skolens kopi.'
                : 'Kopierer knuten inn i valgte mapper.'
          }
        />
        {mode === 'manage' && onRemove ? (
          <Pressable
            onPress={onRemove}
            haptic="medium"
            accessibilityRole="button"
            accessibilityLabel="Fjern fra knuteboka"
            accessibilityHint="Knuten forsvinner fra elevenes katalog. Innsendinger beholdes."
            style={styles.removeRow}
          >
            <Text weight="semibold" color={sticker.color.danger}>
              Fjern fra knuteboka
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  )
}

function SuggestedNewRow({
  name,
  selected,
  onToggle,
}: {
  name: string
  selected: boolean
  onToggle: () => void
}) {
  return (
    <Pressable
      onPress={onToggle}
      haptic="selection"
      accessibilityRole="button"
      accessibilityLabel={`Ny mappe: ${name}`}
      accessibilityHint="Mappa opprettes når du legger til."
      accessibilityState={{ selected }}
      style={[styles.folderRow, selected ? styles.folderRowOn : styles.folderRowOff]}
    >
      <View style={[styles.folderIcon, selected ? styles.tileOn : styles.tileOff]}>
        <FolderPlus
          size={sticker.icon.sm}
          color={selected ? sticker.color.textInverse : sticker.color.ink}
          strokeWidth={2}
        />
      </View>
      <View style={styles.folderText}>
        <Text weight="semibold" color={sticker.color.ink} numberOfLines={1}>
          Ny mappe: {name}
        </Text>
        <Text size="xs" color={sticker.color.textMuted}>
          Opprettes når du legger til
        </Text>
      </View>
      <SuggestBadge />
      <View style={[styles.checkbox, selected ? styles.tileOn : styles.checkboxOff]}>
        {selected ? (
          <Check size={sticker.icon.sm} color={sticker.color.textInverse} strokeWidth={3} />
        ) : null}
      </View>
    </Pressable>
  )
}

function SuggestBadge() {
  return (
    <View style={styles.sugg}>
      <Text size="xs" weight="bold" color={sticker.color.primary}>
        Foreslått
      </Text>
    </View>
  )
}

function FolderToggle({
  folder,
  suggested,
  selected,
  onToggle,
}: {
  folder: Folder
  suggested: boolean
  selected: boolean
  onToggle: () => void
}) {
  const Icon = folderIconFor(folder.icon)
  return (
    <Pressable
      onPress={onToggle}
      haptic="selection"
      accessibilityRole="button"
      accessibilityLabel={`${folder.name}, ${folder.knuteCount} ${folder.knuteCount === 1 ? 'knute' : 'knuter'}${suggested ? ', foreslått' : ''}`}
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
      {suggested ? <SuggestBadge /> : null}
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
  // Shrinks inside the Sheet panel's maxHeight; the footer below never scrolls away.
  sheetBody: { flexShrink: 1 },
  scroll: { flexGrow: 0, flexShrink: 1 },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.sm },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: sticker.color.line,
  },
  headRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  headText: { flex: 1, gap: spacing['2xs'] },
  pen: {
    width: size.actionMinHeight,
    height: size.actionMinHeight,
    borderRadius: sticker.radius.full,
    borderWidth: sticker.borderWidth,
    borderColor: sticker.color.ink,
    backgroundColor: sticker.color.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  penOn: { backgroundColor: sticker.color.ink },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pill: {
    backgroundColor: sticker.color.accent,
    borderRadius: sticker.radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing['2xs'],
  },
  editForm: { gap: spacing.xs },
  inputSmall: { width: 110 },
  inputMulti: { minHeight: 72, textAlignVertical: 'top' },
  warnRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  warnText: { flex: 1, lineHeight: 20 },
  alleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm,
    borderRadius: sticker.radius.md,
    borderWidth: sticker.borderWidth,
    borderColor: sticker.color.line,
    backgroundColor: sticker.color.surfaceSoft,
    marginTop: spacing.xs,
  },
  alleTile: { backgroundColor: sticker.color.ink, borderColor: sticker.color.ink },
  pickHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  folders: { gap: spacing.sm },
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
  sugg: {
    borderWidth: 1.5,
    borderColor: sticker.color.primary,
    borderRadius: sticker.radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing['2xs'],
  },
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
  removeRow: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: sticker.tap.min,
    marginTop: spacing.xs,
  },
})
