import { View, type ViewProps, type ViewStyle } from 'react-native'
import { spacing } from '../../lib/theme'

// Design-system layout primitive. Replaces raw View for flex layouts so gaps and
// padding always come from spacing tokens (frontend.md §4).

type Align = 'start' | 'center' | 'end' | 'stretch'
type Justify = 'start' | 'center' | 'end' | 'between' | 'around'

const ALIGN: Record<Align, ViewStyle['alignItems']> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
}

const JUSTIFY: Record<Justify, ViewStyle['justifyContent']> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
  around: 'space-around',
}

export type StackProps = ViewProps & {
  direction?: 'row' | 'column'
  gap?: keyof typeof spacing
  align?: Align
  justify?: Justify
  padding?: keyof typeof spacing
  paddingX?: keyof typeof spacing
  paddingY?: keyof typeof spacing
}

export function Stack({
  direction = 'column',
  gap,
  align,
  justify,
  padding,
  paddingX,
  paddingY,
  style,
  ...rest
}: StackProps) {
  return (
    <View
      style={[
        {
          flexDirection: direction,
          gap: gap != null ? spacing[gap] : undefined,
          alignItems: align != null ? ALIGN[align] : undefined,
          justifyContent: justify != null ? JUSTIFY[justify] : undefined,
          padding: padding != null ? spacing[padding] : undefined,
          paddingHorizontal: paddingX != null ? spacing[paddingX] : undefined,
          paddingVertical: paddingY != null ? spacing[paddingY] : undefined,
        },
        style,
      ]}
      {...rest}
    />
  )
}
