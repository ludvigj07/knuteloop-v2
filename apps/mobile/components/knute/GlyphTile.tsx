import { type ReactNode } from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { sticker } from '../../lib/theme'

// A rounded-square sticker tile that frames a category/knot glyph (or any icon).
// 2px ink border + a tint that encodes sensitivity: blue normally, amber for
// sensitive folders. The recurring leading element on every sticker knute row.

export type GlyphTileTone = 'primary' | 'accent' | 'plain'

const BG: Record<GlyphTileTone, string> = {
  primary: sticker.color.primaryBg,
  accent: sticker.color.accentBg,
  plain: sticker.color.surfaceSoft,
}

export type GlyphTileProps = {
  size?: number
  tone?: GlyphTileTone
  children: ReactNode
  style?: StyleProp<ViewStyle>
}

export function GlyphTile({ size = 44, tone = 'primary', children, style }: GlyphTileProps) {
  return (
    <View style={[styles.tile, { width: size, height: size, backgroundColor: BG[tone] }, style]}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  tile: {
    borderWidth: sticker.borderWidth,
    borderColor: sticker.color.ink,
    borderRadius: sticker.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
