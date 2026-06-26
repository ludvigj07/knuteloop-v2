import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native'
import {
  colors,
  fontFamily,
  fontSize,
  fontWeight,
  type FontFamilyToken,
} from '../../lib/theme'

// Design-system Text. NEVER use raw react-native Text in screens — use this so
// size/weight/colour/family all flow from theme tokens (frontend.md §4).

type ColorToken =
  | 'primary'
  | 'secondary'
  | 'muted'
  | 'inverse'
  | 'ink'
  | 'brand'
  | 'success'
  | 'warning'
  | 'error'

const COLOR: Record<ColorToken, string> = {
  primary: colors.text.primary,
  secondary: colors.text.secondary,
  muted: colors.text.muted,
  inverse: colors.text.inverse,
  ink: colors.ink,
  brand: colors.brand.primary,
  success: colors.success,
  warning: colors.warning,
  error: colors.error,
}

export type TextProps = RNTextProps & {
  size?: keyof typeof fontSize
  weight?: keyof typeof fontWeight
  /** Font family: 'sans' (Inter, default), 'display' (Bricolage), 'mono' (JetBrains). */
  font?: FontFamilyToken
  /** A theme colour token, or a raw colour string for one-off cases. */
  color?: ColorToken | string
  align?: TextStyle['textAlign']
}

export function Text({
  size = 'base',
  weight = 'regular',
  font = 'sans',
  color = 'primary',
  align,
  style,
  ...rest
}: TextProps) {
  const resolvedColor = color in COLOR ? COLOR[color as ColorToken] : color
  // The weight is baked into the family name (single-weight font files), so we
  // set fontFamily and deliberately omit fontWeight — pairing both causes
  // faux-bold on Android.
  return (
    <RNText
      style={[
        {
          fontFamily: fontFamily[font][weight],
          fontSize: fontSize[size],
          color: resolvedColor,
          textAlign: align,
        },
        style,
      ]}
      {...rest}
    />
  )
}
