import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg'
import { fontFamily, sticker } from '../../lib/theme'

// Knuteloop's custom hand-drawn knot & category glyphs (ported from the
// /knuteloop-design KnoteIcon). `name` selects the glyph; stroke/fill take the
// `color` prop so size + colour come from the parent. Used for knuter and the
// five library/category folders throughout the app.

export type KnoteGlyph =
  | 'knute'
  | 'generelle'
  | 'dobbel'
  | 'alkohol'
  | 'sex'
  | 'fordervett'

export type KnoteIconProps = {
  name?: KnoteGlyph
  size?: number
  color?: string
  strokeWidth?: number
}

export function KnoteIcon({
  name = 'knute',
  size = 24,
  color = sticker.color.ink,
  strokeWidth = 1.8,
}: KnoteIconProps) {
  const stroke = {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  }

  switch (name) {
    case 'generelle': // simple double-loop knot
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M 3 12 H 7.5" {...stroke} />
          <Path d="M 16.5 12 H 21" {...stroke} />
          <Path d="M 7.5 12 C 7.5 7.8, 13.5 7.8, 13.5 12 C 13.5 16.2, 7.5 16.2, 7.5 12 Z" {...stroke} />
          <Path d="M 10.5 12 C 10.5 8, 16.5 8, 16.5 12 C 16.5 16, 10.5 16, 10.5 12 Z" {...stroke} />
          <Path d="M 9.5 10.2 L 14.5 13.8" {...stroke} />
        </Svg>
      )
    case 'dobbel': // double knot — "2x"
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <SvgText
            x="12"
            y="16.8"
            textAnchor="middle"
            fontSize="13.6"
            fontFamily={fontFamily.display.bold}
            fill={color}
          >
            2x
          </SvgText>
        </Svg>
      )
    case 'alkohol': // beer bottle
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M 6.4 8.4 H 15.8 V 20.3 H 6.4 Z" {...stroke} />
          <Path d="M 15.8 10.5 H 17.6 C 19 10.5, 20 11.6, 20 13.1 V 15.2 C 20 16.8, 19 17.9, 17.6 17.9 H 15.8" {...stroke} />
          <Path d="M 6.3 8.5 C 5.4 7.4, 6 5.8, 7.5 5.8 C 7.8 4.3, 10 4.1, 10.7 5.5 C 11.4 4, 13.6 4.2, 13.9 5.8 C 15.4 5.8, 16 7.4, 15.6 8.5" {...stroke} />
          <Path d="M 8.4 11.2 V 18.3" {...stroke} />
          <Path d="M 11.1 11.2 V 18.3" {...stroke} />
          <Path d="M 13.8 11.2 V 18.3" {...stroke} />
          <Path d="M 6.4 12.4 C 7.9 11.4, 9.6 13.2, 11.1 12.4 C 12.7 11.4, 14.2 13.2, 15.8 12.4" {...stroke} />
        </Svg>
      )
    case 'sex': // intersecting gender symbols
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx="9" cy="14" r="3.45" {...stroke} />
          <Path d="M 9 17.45 V 21" {...stroke} />
          <Path d="M 6.6 19.25 H 11.4" {...stroke} />
          <Circle cx="15" cy="8.8" r="3.45" {...stroke} />
          <Path d="M 17.45 6.35 L 20.8 3" {...stroke} />
          <Path d="M 17.8 3 H 20.8 V 6" {...stroke} />
        </Svg>
      )
    case 'fordervett': // mischief / "rampestreker" mask
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M 4 4.2 L 9.2 6.8 C 11 5.9, 13 5.9, 14.8 6.8 L 20 4.2 L 18.2 11.2 C 18.8 12.4, 19 13.6, 18.7 14.9 C 18 18.4, 15 20.5, 12 20.5 C 9 20.5, 6 18.4, 5.3 14.9 C 5 13.6, 5.2 12.4, 5.8 11.2 Z" {...stroke} />
          <Circle cx="9.2" cy="12.2" r="0.9" fill={color} />
          <Circle cx="14.8" cy="12.2" r="0.9" fill={color} />
          <Path d="M 11 15.3 L 12 16.1 L 13 15.3" {...stroke} />
          <Path d="M 12 16.1 V 17.3" {...stroke} />
        </Svg>
      )
    case 'knute': // brand loop knot (default)
    default:
      return (
        <Svg width={size} height={Math.round((size * 56) / 100)} viewBox="0 0 100 56">
          <Path
            d="M 38,28 C 44,38 56,40 66,34 L 100,28"
            stroke={color}
            strokeWidth={11}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <Path
            d="M 0,28 C 16,28 20,12 32,8 C 44,4 60,6 68,18 C 76,30 70,46 56,50 C 42,54 28,46 28,36 C 28,24 36,16 46,16 C 56,16 64,22 66,28"
            stroke={color}
            strokeWidth={11}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      )
  }
}
