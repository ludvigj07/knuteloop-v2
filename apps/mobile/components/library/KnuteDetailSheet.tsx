import { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { Check, TriangleAlert } from 'lucide-react-native'
import { Chip, Eyebrow, KnoteIcon, Sheet, StickerButton, StickerCard, Text } from '../primitives'
import { GlyphTile } from '../knute/GlyphTile'
import type { LibraryKnute } from '../../lib/api'
import { difficultyTone, folderGlyph, isSensitiveKnute } from '../../lib/knute-ui'
import { formatNumber } from '../../lib/format'
import { sticker, spacing } from '../../lib/theme'

// Bottom sheet shown when a library knute is tapped: full description, a meta
// grid, a sensitive-folder warning, and the import action. Controlled by the
// `knute` prop (present → open, null → closed). Built on the cross-platform Sheet
// so it works on web too.

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
  // Retain the last knute so the content stays rendered during the close animation.
  const [shown, setShown] = useState<LibraryKnute | null>(knute)
  useEffect(() => {
    if (knute) setShown(knute)
  }, [knute])

  return (
    <Sheet open={knute !== null} onClose={onClose}>
      <ScrollView contentContainerStyle={styles.content}>
        {shown ? <Body knute={shown} importing={importing} onImport={() => onImport(shown)} /> : null}
      </ScrollView>
    </Sheet>
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
  const sensitive = isSensitiveKnute(knute)
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
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.base },
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
