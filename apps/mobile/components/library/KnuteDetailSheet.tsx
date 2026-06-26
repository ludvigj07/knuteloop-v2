import { useCallback, useEffect, useMemo, useRef } from 'react'
import { StyleSheet, View } from 'react-native'
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet'
import { Check, TriangleAlert } from 'lucide-react-native'
import {
  Chip,
  Eyebrow,
  KnoteIcon,
  StickerButton,
  StickerCard,
  Text,
} from '../primitives'
import { GlyphTile } from '../knute/GlyphTile'
import type { LibraryKnute } from '../../lib/api'
import { difficultyTone, folderGlyph, isSensitiveFolder } from '../../lib/knute-ui'
import { formatNumber } from '../../lib/format'
import { sticker, spacing } from '../../lib/theme'

// Bottom sheet shown when a library knute is tapped: full description, a meta
// grid, a sensitive-folder warning, and the import action. Controlled by the
// `knute` prop (present → open, null → dismiss); `onClose` fires on dismiss.

export function KnuteDetailSheet({
  knute,
  importing,
  onClose,
  onImport,
}: {
  knute: LibraryKnute | null
  importing: boolean
  onClose: () => void
  onImport: (knute: LibraryKnute) => void
}) {
  const ref = useRef<BottomSheetModal>(null)
  const snapPoints = useMemo(() => ['70%'], [])

  useEffect(() => {
    if (knute) ref.current?.present()
    else ref.current?.dismiss()
  }, [knute])

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.45} />
    ),
    [],
  )

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      enablePanDownToClose
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.handle}
      backgroundStyle={styles.sheetBg}
    >
      <BottomSheetScrollView contentContainerStyle={styles.content}>
        {knute ? <Body knute={knute} importing={importing} onImport={() => onImport(knute)} /> : null}
      </BottomSheetScrollView>
    </BottomSheetModal>
  )
}

function Body({
  knute,
  importing,
  onImport,
}: {
  knute: LibraryKnute
  importing: boolean
  onImport: () => void
}) {
  const sensitive = isSensitiveFolder(knute.suggestedFolder)
  const isText = knute.evidenceType === 'text'

  return (
    <>
      <View style={styles.header}>
        <GlyphTile size={56} tone={sensitive ? 'accent' : 'primary'}>
          <KnoteIcon
            name={folderGlyph(knute.suggestedFolder)}
            size={30}
            color={sensitive ? sticker.color.accentStrong : sticker.color.primary}
          />
        </GlyphTile>
        <View style={styles.headerText}>
          <Eyebrow>{knute.suggestedFolder}</Eyebrow>
          <Text font="display" weight="bold" size="xl" color={sticker.color.ink}>
            {knute.title}
          </Text>
        </View>
      </View>

      <View style={styles.chips}>
        <Chip label={`${formatNumber(knute.points)} P`} tone="accent" mono />
        <Chip label={knute.difficulty} tone={difficultyTone(knute.difficulty)} />
      </View>

      {knute.description ? (
        <Text color={sticker.color.textSoft} style={styles.desc}>
          {knute.description}
        </Text>
      ) : null}

      <View style={styles.grid}>
        <MetaCell label="Hjemmemappe" value={knute.suggestedFolder} />
        <MetaCell label="Vanskelighet" value={knute.difficulty} />
        <MetaCell label="Bevis" value={isText ? 'Tekst' : 'Bilde / video'} />
        <MetaCell label="Alder" value={knute.minAge >= 18 ? '18+' : '17+'} />
      </View>

      {sensitive ? (
        <StickerCard tone="accent" shadow="none" radius="md" padding="md" style={styles.warn}>
          <View style={styles.warnRow}>
            <TriangleAlert size={sticker.icon.sm} color={sticker.color.accentStrong} strokeWidth={2} />
            <Text size="sm" weight="semibold" color={sticker.color.accentStrong} style={styles.warnText}>
              Sensitiv knute{knute.minAge >= 18 ? ' (18+)' : ''}
              {isText ? ' — kun tekst-bevis' : ''}. Pass på at den passer for kullet.
            </Text>
          </View>
        </StickerCard>
      ) : null}

      <View style={styles.action}>
        {knute.imported ? (
          <View style={styles.addedNote}>
            <Check size={sticker.icon.sm} color={sticker.color.success} strokeWidth={2.5} />
            <Text weight="semibold" color={sticker.color.success}>
              Allerede i knuteboka
            </Text>
          </View>
        ) : (
          <StickerButton
            label="Legg til i knuteboka"
            variant="accent"
            onPress={onImport}
            loading={importing}
            fullWidth
          />
        )}
      </View>
    </>
  )
}

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <StickerCard tone="soft" shadow="none" radius="sm" padding="md" style={styles.cell}>
      <Text size="xs" weight="bold" color={sticker.color.textMuted} style={styles.cellLabel}>
        {label}
      </Text>
      <Text weight="semibold" color={sticker.color.ink}>
        {value}
      </Text>
    </StickerCard>
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
  content: { padding: spacing.lg, paddingBottom: spacing['2xl'], gap: spacing.base },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerText: { flex: 1, gap: spacing['2xs'] },
  chips: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  desc: { lineHeight: 22 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  cell: { flexGrow: 1, flexBasis: '46%', gap: spacing['2xs'] },
  cellLabel: { textTransform: 'uppercase', letterSpacing: 0.5 },
  warn: {},
  warnRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  warnText: { flex: 1, lineHeight: 20 },
  action: { marginTop: spacing.xs },
  addedNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
})
