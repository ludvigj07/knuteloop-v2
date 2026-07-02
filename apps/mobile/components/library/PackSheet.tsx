import { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { Check, Lock } from 'lucide-react-native'
import { Eyebrow, Sheet, Skeleton, StickerButton, Text } from '../primitives'
import { fetchLibraryPack } from '../../lib/api'
import { formatNumber } from '../../lib/format'
import { size, spacing, sticker } from '../../lib/theme'

// See-before-you-add (Ludvig's demo): the pack card opens this sheet with the
// full contents — each member shows its points, the folder it will be filed
// under, and a lock when the school already has it. The CTA counts only the
// NEW ones, and the whole flow stays idempotent.

export function PackSheet({
  packId,
  importing,
  onClose,
  onImport,
}: {
  packId: string | null
  importing: boolean
  onClose: () => void
  onImport: (packId: string) => void
}) {
  // Keep the last pack rendered through the close animation.
  const [shownId, setShownId] = useState<string | null>(packId)
  useEffect(() => {
    if (packId) setShownId(packId)
  }, [packId])

  const detail = useQuery({
    queryKey: ['library', 'pack', shownId],
    queryFn: () => fetchLibraryPack(shownId!),
    enabled: shownId !== null,
  })

  const pack = detail.data?.pack
  const members = detail.data?.knuter ?? []
  const newCount = members.filter((k) => !k.imported).length

  return (
    <Sheet open={packId !== null} onClose={onClose}>
      <View style={styles.body}>
        <Eyebrow>Pakke · Knuteloop anbefaler</Eyebrow>
        <Text font="display" weight="bold" size="xl" color={sticker.color.ink} numberOfLines={2}>
          {pack?.name ?? 'Pakke'}
        </Text>
        {pack?.description ? (
          <Text size="sm" color={sticker.color.textMuted}>
            {pack.description}
          </Text>
        ) : null}
        <Text size="xs" color={sticker.color.textMuted}>
          Legges i «Alle knuter» + forslags-mappa si. Alt kan endres etterpå — kopiene er dine.
        </Text>

        {detail.isLoading ? (
          <View style={styles.loading}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} style={styles.skeletonRow} />
            ))}
          </View>
        ) : (
          <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
            {members.map((k) => (
              <View
                key={k.id}
                style={styles.row}
                accessible
                accessibilityLabel={`${k.title}, ${formatNumber(k.points)} poeng, ${k.suggestedFolder}${k.imported ? ', allerede lagt til' : ''}`}
              >
                <View style={styles.rowBody}>
                  <Text weight="semibold" size="base" color={sticker.color.ink} numberOfLines={1}>
                    {k.title}
                  </Text>
                  <Text size="xs" color={sticker.color.textMuted}>
                    {formatNumber(k.points)} P · → {k.suggestedFolder}
                    {k.imported ? ' · allerede lagt til' : ''}
                  </Text>
                </View>
                <View style={[styles.mark, k.imported ? styles.markLocked : styles.markNew]}>
                  {k.imported ? (
                    <Lock size={14} color={sticker.color.textInverse} strokeWidth={2.4} />
                  ) : (
                    <Check size={14} color={sticker.color.textInverse} strokeWidth={2.8} />
                  )}
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        <StickerButton
          label={
            newCount > 0
              ? `Legg til ${formatNumber(newCount)} nye`
              : 'Alt i pakka er allerede lagt til'
          }
          variant="accent"
          fullWidth
          disabled={newCount === 0 || detail.isLoading}
          loading={importing}
          onPress={() => {
            if (shownId) onImport(shownId)
          }}
          accessibilityHint="Kopierer de nye knutene inn i skolen, sortert i forslags-mapper."
        />
      </View>
    </Sheet>
  )
}

const styles = StyleSheet.create({
  body: { gap: spacing.sm, flexShrink: 1 },
  loading: { gap: spacing.sm, marginVertical: spacing.sm },
  skeletonRow: { height: 52, borderRadius: sticker.radius.md },
  list: { flexGrow: 0, flexShrink: 1, maxHeight: 360, marginVertical: spacing.xs },
  row: {
    minHeight: size.actionMinHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: sticker.color.line,
  },
  rowBody: { flex: 1, gap: spacing['2xs'] },
  mark: {
    width: 26,
    height: 26,
    borderRadius: sticker.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markLocked: { backgroundColor: sticker.color.ink },
  markNew: { backgroundColor: sticker.color.success },
})
