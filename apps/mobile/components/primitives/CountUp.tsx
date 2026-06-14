import { useCountUp } from '../../hooks/useCountUp'
import { Text, type TextProps } from './Text'
import { formatNumber } from '../../lib/format'

// Renders a number that counts up to its target — the small brand detail that
// makes points/rank/stats feel earned rather than just printed. The animation
// itself lives in the tested `useCountUp` hook; this just formats the value in
// Norwegian and renders it through the Text primitive. frontend.md §7.

type CountUpProps = Omit<TextProps, 'children'> & {
  value: number
  /** Count-up time in ms. Defaults to the hook's own default. */
  duration?: number
  /** Formatter for the number. Defaults to nb-NO thousands grouping. */
  format?: (n: number) => string
  /** Static text appended after the number (e.g. " knuter", " p"). */
  suffix?: string
}

export function CountUp({
  value,
  duration,
  format = formatNumber,
  suffix = '',
  ...textProps
}: CountUpProps) {
  const display = useCountUp(value, duration)
  return <Text {...textProps}>{`${format(display)}${suffix}`}</Text>
}
