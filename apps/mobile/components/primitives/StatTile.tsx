import { type ReactNode } from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { StickerCard } from './StickerCard'
import { Text } from './Text'
import { sticker, spacing } from '../../lib/theme'

// A compact stat card: big mono value + label + icon. Used in the Knuteboka
// header (Knuter / Poeng / Mapper). Tone tints the whole sticker.

type Tone = 'surface' | 'primary' | 'accent'

const FG: Record<Tone, { value: string; label: string }> = {
  surface: { value: sticker.color.ink, label: sticker.color.textMuted },
  primary: { value: sticker.color.textInverse, label: sticker.color.textInverse },
  accent: { value: sticker.color.ink, label: sticker.color.accentStrong },
}

export type StatTileProps = {
  value: string
  label: string
  icon?: ReactNode
  tone?: Tone
  style?: StyleProp<ViewStyle>
}

export function StatTile({ value, label, icon, tone = 'surface', style }: StatTileProps) {
  const fg = FG[tone]
  return (
    <StickerCard tone={tone} radius="md" shadow="sm" padding="md" style={style}>
      <View style={styles.inner}>
        {icon}
        <Text
          font="mono"
          weight="bold"
          size="2xl"
          color={fg.value}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
        >
          {value}
        </Text>
        <Text size="xs" weight="semibold" color={fg.label}>
          {label}
        </Text>
      </View>
    </StickerCard>
  )
}

const styles = StyleSheet.create({
  inner: { alignItems: 'center', gap: spacing['2xs'] },
})
