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
  accent: {
    yellow: '#FFD530',
  },
  // Gullknute styling — a deeper, metallic gold than the brand yellow, with a
  // soft tint for backgrounds/badges. Used wherever a gold knute is shown.
  gold: '#B8860B',
  goldSoft: '#FBF1D6',
  ink: '#111A32',
  border: '#E5E5E5',
  borderStrong: '#D4D4D4',
  borderInk: '#111A32',
  transparent: 'transparent',
  success: '#16A34A',
  warning: '#F59E0B',
  error: '#DC2626',
  knuter: {
    canvas: '#F6EFDF',
    panel: '#FFFEFA',
    divider: '#D7D2C7',
    muted: '#667085',
  },
  leaderboard: {
    canvas: '#F6EFDF',
    panel: '#FFFEFA',
    row: '#FFFFFF',
    first: '#FFE58A',
    second: '#E8EEF6',
    third: '#F3C7A6',
    points: '#4C6FEF',
    pointsShadow: 'rgba(76, 111, 239, 0.28)',
    chip: '#EEF1F5',
  },
  tabBar: {
    surface: '#FFFEFA',
    active: '#111A32',
    icon: '#111A32',
    shadow: 'rgba(17, 26, 50, 0.18)',
  },
  // Fullscreen feed (TikTok-style) runs on a dark backdrop regardless of theme.
  feed: {
    backdrop: '#0A0A0F',
    overlay: 'rgba(0, 0, 0, 0.55)',
    textShadow: 'rgba(0, 0, 0, 0.8)',
  },
  // Soft backgrounds for submission-status badges (text uses success/warning/error).
  status: {
    approvedBg: '#E8F7EE',
    pendingBg: '#FFF7E6',
    rejectedBg: '#FDECEC',
  },
} as const

export const spacing = {
  none: 0,
  '2xs': 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
} as const

export const borderWidth = {
  none: 0,
  thin: 1,
  medium: 2,
  thick: 3,
} as const

export const opacity = {
  disabled: 0.5,
  shadow: 0.18,
  // Skeleton shimmer pulses between these two opacities.
  shimmerLow: 0.45,
  shimmerHigh: 1,
} as const

// Soft drop shadows for cards. iOS reads shadow*, Android reads elevation —
// both are set so depth looks right on each platform. Tinted with ink (navy)
// rather than pure black so it matches the warm v1 palette.
export const shadows = {
  sm: {
    shadowColor: '#111A32',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#111A32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  lg: {
    shadowColor: '#111A32',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 9,
  },
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
  '4xl': 44,
} as const

export const size = {
  bottomNavButton: 44,
  bottomNavActiveWidth: 104,
  bottomNavMinHeight: 60,
  bottomNavIcon: 24,
  bottomNavBottomOffset: 8,
  bottomNavContentGap: 6,
  bottomNavShadowRadius: 14,
  bottomNavShadowOffsetY: 6,
  bottomNavElevation: 8,
  iconLineLong: 20,
  iconLineShort: 14,
  iconLineHeight: 4,
  iconTrophyCupWidth: 18,
  iconTrophyCupHeight: 12,
  iconTrophyStemWidth: 4,
  iconTrophyStemHeight: 6,
  iconTrophyBaseWidth: 16,
  iconTrophyBaseHeight: 3,
  iconPlayTop: 7,
  iconPlayLeft: 11,
  iconPersonHead: 8,
  iconPersonShouldersWidth: 18,
  iconPersonShouldersHeight: 9,
  iconShieldWidth: 18,
  iconShieldHeight: 20,
  iconShieldMark: 6,
  leaderboardRank: 36,
  leaderboardAvatar: 36,
  leaderboardRowMinHeight: 56,
  leaderboardSelectWidth: 188,
  leaderboardPanelActionMinWidth: 132,
  searchMinHeight: 48,
  actionMinHeight: 40,
  knuteActionMinWidth: 88,
  emptyMinHeight: 200,
  skeletonTitleWidth: 120,
  skeletonTitleHeight: 24,
  skeletonRowTitleHeight: 16,
  skeletonRowMetaHeight: 12,
  controlHeightSm: 40,
  controlHeightBase: 48,
  controlHeightLg: 56,
  // Profile + status screen
  profileAvatar: 72,
  otherAvatar: 44,
  categoryRing: 60,
  progressBarHeight: 6,
  // Review queue — height of the evidence photo / text-quote / placeholder well.
  reviewEvidenceHeight: 220,
} as const

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const

// Motion tokens. Durations in ms; springs are Reanimated withSpring configs.
// pressScale is the brand "tap" feel — every Pressable primitive scales to this.
export const animation = {
  duration: {
    fast: 150,
    base: 250,
    slow: 400,
    // One half-cycle of the skeleton shimmer pulse.
    shimmer: 900,
  },
  spring: {
    gentle: { damping: 25, stiffness: 150 },
    base: { damping: 18, stiffness: 200 },
    bouncy: { damping: 12, stiffness: 200 },
  },
  pressScale: 0.96,
} as const

// ============================================================
// Font families — the three Google Fonts loaded in app/_layout.tsx.
// Custom fonts in RN are single-weight files, so the weight is baked into the
// family name (NEVER pair these with `fontWeight` — that causes faux-bold on
// Android). The Text primitive resolves (font, weight) -> the right family here.
// Keys MUST match the registered names in useFonts (the @expo-google-fonts ids).
// ============================================================
export const fontFamily = {
  // Inter — body + UI. Near-identical to the system sans, so making it the app
  // default is a safe, on-brand upgrade from the previous system font.
  sans: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semibold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
  },
  // Bricolage Grotesque — display / headings. Big, condensed personality.
  display: {
    regular: 'BricolageGrotesque_700Bold',
    medium: 'BricolageGrotesque_700Bold',
    semibold: 'BricolageGrotesque_700Bold',
    bold: 'BricolageGrotesque_800ExtraBold',
  },
  // JetBrains Mono — numerals (points, ranks, counts, times).
  mono: {
    regular: 'JetBrainsMono_400Regular',
    medium: 'JetBrainsMono_500Medium',
    semibold: 'JetBrainsMono_500Medium',
    bold: 'JetBrainsMono_700Bold',
  },
} as const

export type FontFamilyToken = keyof typeof fontFamily

// ============================================================
// STICKER design system (the live v1 "sticker" identity, ported to RN).
// Warm cream paper, royal-blue primary, golden-yellow accent, deep-navy ink,
// 2px ink borders + hard offset shadows. Source of truth: the /knuteloop-design
// skill tokens. Kept as its own namespace so it layers on top of the existing
// tokens without changing any screen that hasn't opted in.
//
// HSL values from the design tokens, resolved to hex; color-mix tints precomputed.
// ============================================================
export const sticker = {
  color: {
    paper: '#FBF8EF', // background — warm cream (hsl 48 60% 96%)
    ink: '#0F1A2E', // foreground — deep navy (borders + text)
    card: '#FFFFFF',
    surfaceSoft: '#F3EFE2', // secondary — warm off-white panels
    surfaceMedia: '#F3F0E8', // muted — photo/placeholder wells

    primary: '#12327D', // royal blue (hsl 222 75% 28%)
    primaryStrong: '#112D6D',
    primarySoft: 'rgba(18, 50, 125, 0.14)',
    primaryBg: '#E7EAF2', // pale blue tint behind glyph tiles

    accent: '#FFCD29', // golden yellow (hsl 46 100% 58%)
    accentBg: '#FFF7DD', // pale amber tint (sensitive folder tiles)
    accentStrong: '#7B6A2C', // readable text/icon on amber tints

    line: 'rgba(27, 33, 45, 0.16)', // hairline dividers
    lineStrong: '#1B212D',

    text: '#0F1A2E',
    textSoft: '#112D6C',
    textMuted: '#576175',
    textInverse: '#FBF8EF', // text on primary/ink surfaces

    success: '#2F9E63',
    successBg: 'rgba(47, 158, 99, 0.14)',
    warning: '#E6A417',
    warningBg: 'rgba(230, 164, 23, 0.16)',
    danger: '#D6483F',
    dangerStrong: '#B53A32',
    dangerBg: 'rgba(214, 72, 63, 0.12)',

    gold: '#D6A429', // gullknute star / accents + toppliste-medalje for 1. plass
    silver: '#9EA4AD', // toppliste-medalje — 2. plass (design-systemets MEDAL[2])
    bronze: '#B07A47', // toppliste-medalje — 3. plass (design-systemets MEDAL[3])
  },
  // Generous, friendly radii (much rounder than the legacy `radius` scale).
  radius: {
    sm: 14, // chips, inputs
    md: 18, // buttons, rows
    lg: 22, // cards
    xl: 26, // hero panels, sheets
    full: 999,
  },
  borderWidth: 2,
  // The hard offset shadow distance, by size. Rendered as a solid ink backing
  // View (StickerCard) so it works identically on iOS and Android.
  shadowOffset: {
    sm: 2,
    base: 4,
    lg: 6,
  },
  tap: { size: 52, min: 44 },
  icon: { sm: 18, md: 22, lg: 28 },
} as const

export type StickerTone = 'surface' | 'soft' | 'media' | 'primary' | 'accent'
