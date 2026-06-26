import { Text, type TextProps } from './Text'
import { sticker } from '../../lib/theme'

// The small uppercase kicker above sticker screen headings (e.g. "KNUTESJEF").
// Tracked + bold, primary-blue by default.

export type EyebrowProps = Omit<TextProps, 'size' | 'weight'> & {
  children: TextProps['children']
}

export function Eyebrow({ color = sticker.color.primary, style, children, ...rest }: EyebrowProps) {
  return (
    <Text size="xs" weight="bold" color={color} style={[{ textTransform: 'uppercase', letterSpacing: 1 }, style]} {...rest}>
      {children}
    </Text>
  )
}
