import { useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { Check } from 'lucide-react-native'
import { Chip, Pressable, Sheet, StickerButton, Text } from '../primitives'
import type { Knute } from '../../lib/api'
import { formatNumber } from '../../lib/format'
import { size, spacing, sticker } from '../../lib/theme'

// "Legg til egne knuter" — from inside a folder, pick among the school's
// EXISTING knuter (the ones not already in this folder) and file them here.
// Dumb component: the screen owns the mutation; this owns only the selection.

export function AddOwnKnuterSheet({
  open,
  folderName,
  candidates,
  adding,
  onClose,
  onConfirm,
}: {
  open: boolean
  folderName: string
  /** School knuter NOT already in this folder. */
  candidates: Knute[]
  adding: boolean
  onClose: () => void
  onConfirm: (knuteIds: string[]) => void
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleClose = () => {
    setSelected(new Set())
    onClose()
  }

  return (
    <Sheet open={open} onClose={handleClose}>
      <View style={styles.body}>
        <Text font="display" weight="bold" size="xl" color={sticker.color.ink}>
          Legg til i «{folderName}»
        </Text>
        <Text size="sm" color={sticker.color.textMuted}>
          Velg blant knutene skolen allerede har.
        </Text>

        {candidates.length === 0 ? (
          <View style={styles.empty}>
            <Text color={sticker.color.textMuted}>
              Alle knutene dine ligger allerede i denne mappa.
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
            {candidates.map((knute) => {
              const isOn = selected.has(knute.id)
              return (
                <Pressable
                  key={knute.id}
                  onPress={() => toggle(knute.id)}
                  haptic="selection"
                  accessibilityRole="button"
                  accessibilityLabel={knute.title}
                  accessibilityState={{ selected: isOn }}
                  style={[styles.row, isOn ? styles.rowOn : null]}
                >
                  <View style={styles.rowBody}>
                    <Text
                      weight="semibold"
                      size="base"
                      color={isOn ? sticker.color.textInverse : sticker.color.ink}
                      numberOfLines={1}
                    >
                      {knute.isGold ? '★ ' : ''}
                      {knute.title}
                    </Text>
                    <Chip label={`${formatNumber(knute.points)} P`} tone="accent" mono />
                  </View>
                  {isOn ? (
                    <Check size={sticker.icon.sm} color={sticker.color.textInverse} strokeWidth={2.5} />
                  ) : null}
                </Pressable>
              )
            })}
          </ScrollView>
        )}

        <StickerButton
          label={selected.size > 0 ? `Legg til (${formatNumber(selected.size)})` : 'Legg til'}
          variant="accent"
          fullWidth
          disabled={selected.size === 0}
          loading={adding}
          onPress={() => onConfirm([...selected])}
          accessibilityHint="Legger de valgte knutene i mappa."
        />
      </View>
    </Sheet>
  )
}

const styles = StyleSheet.create({
  body: { gap: spacing.sm, flexShrink: 1 },
  empty: { paddingVertical: spacing.lg },
  list: { flexGrow: 0, flexShrink: 1, maxHeight: 340, marginVertical: spacing.xs },
  row: {
    minHeight: size.actionMinHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
    borderRadius: sticker.radius.md,
    borderWidth: sticker.borderWidth,
    borderColor: sticker.color.ink,
    backgroundColor: sticker.color.card,
  },
  rowOn: { backgroundColor: sticker.color.primary },
  rowBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
})
