import { StyleSheet, View } from 'react-native'
import { PackagePlus } from 'lucide-react-native'
import { Eyebrow, StickerButton, StickerCard, Text } from '../primitives'
import type { LibraryPack } from '../../lib/api'
import { formatNumber } from '../../lib/format'
import { sticker, spacing } from '../../lib/theme'

// The recommended-pack promo: a royal-blue sticker card with the golden hero CTA
// to bulk-import the whole pack. Feedback after import is a toast (the screen
// owns it) — no permanent banner that hides the button.

export function PackHero({
  pack,
  importing,
  onImport,
}: {
  pack: LibraryPack
  importing: boolean
  onImport: () => void
}) {
  return (
    <StickerCard tone="primary" radius="lg" style={styles.card}>
      <Eyebrow color={sticker.color.accent}>Pakke · {formatNumber(pack.knuteCount)} knuter</Eyebrow>
      <Text font="display" weight="bold" size="xl" color={sticker.color.textInverse}>
        {pack.name}
      </Text>
      {pack.description ? (
        <Text size="sm" color={sticker.color.textInverse} style={styles.desc}>
          {pack.description}
        </Text>
      ) : null}
      <View style={styles.action}>
        <StickerButton
          label={`Legg til alle (${formatNumber(pack.knuteCount)})`}
          variant="accent"
          onPress={onImport}
          loading={importing}
          fullWidth
          icon={<PackagePlus size={sticker.icon.sm} color={sticker.color.ink} strokeWidth={2} />}
          accessibilityHint="Legger alle knutene i pakka til skolen din, sortert i mapper."
        />
      </View>
    </StickerCard>
  )
}

const styles = StyleSheet.create({
  card: { marginHorizontal: spacing.base, marginBottom: spacing.base, gap: spacing.xs },
  desc: { opacity: 0.9, marginBottom: spacing.xs },
  action: { marginTop: spacing.sm },
})
