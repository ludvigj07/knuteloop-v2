import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native'
import { colors, fontSize, fontWeight } from '../../lib/theme'

// Design-system Text. NEVER use raw react-native Text in screens — use this so
// size/weight/colour all flow from theme tokens (frontend.md §4).

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
  /** A theme colour token, or a raw colour string for one-off cases. */
  color?: ColorToken | string
  align?: TextStyle['textAlign']
}

export function Text({
  size = 'base',
  weight = 'regular',
  color = 'primary',
  align,
  style,
  ...rest
}: TextProps) {
  const resolvedColor = color in COLOR ? COLOR[color as ColorToken] : color
  return (
    <RNText
      style={[
        {
          fontSize: fontSize[size],
          fontWeight: fontWeight[weight],
          color: resolvedColor,
          textAlign: align,
        },
        style,
      ]}
      {...rest}
    />
  )
}
