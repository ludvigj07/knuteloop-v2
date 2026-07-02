import { StyleSheet, View } from 'react-native'
import { PackagePlus } from 'lucide-react-native'
import { Eyebrow, StickerButton, StickerCard, Text } from '../primitives'
import type { LibraryPack } from '../../lib/api'
import { formatNumber } from '../../lib/format'
import { sticker, spacing } from '../../lib/theme'

// The recommended-pack promo: a royal-blue sticker card whose CTA opens the
// see-before-you-add PackSheet (contents + «Legg til N nye») — never a blind
// bulk import (Ludvig's demo).

export function PackHero({ pack, onOpen }: { pack: LibraryPack; onOpen: () => void }) {
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
          label={`Åpne pakka (${formatNumber(pack.knuteCount)})`}
          variant="accent"
          onPress={onOpen}
          fullWidth
          icon={<PackagePlus size={sticker.icon.sm} color={sticker.color.ink} strokeWidth={2} />}
          accessibilityHint="Viser innholdet i pakka før du legger til."
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
