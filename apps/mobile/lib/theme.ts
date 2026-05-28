// Design tokens. The ONLY file that contains raw color / spacing values —
// every component reads from here. This is the seed of frontend.md §3.

export const colors = {
  background: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  text: {
    primary: '#0A0A0A',
    secondary: '#525252',
    muted: '#A3A3A3',
    inverse: '#FFFFFF',
  },
  brand: {
    primary: '#C8102E', // russ-red
    primaryDark: '#8B0918',
  },
  border: '#E5E5E5',
  borderStrong: '#D4D4D4',
  success: '#16A34A',
  warning: '#F59E0B',
  error: '#DC2626',
} as const

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
} as const

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  full: 9999,
} as const

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 22,
  '2xl': 28,
  '3xl': 36,
} as const

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const
