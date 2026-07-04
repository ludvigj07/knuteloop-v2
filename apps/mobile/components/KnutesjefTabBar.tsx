import { StyleSheet, View } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Home, Inbox, LibraryBig } from 'lucide-react-native'
import { KnoteIcon, Pressable, Text } from './primitives'
import { tryFetchPendingCount } from '../lib/api'
import { formatNumber } from '../lib/format'
import { size, spacing, sticker } from '../lib/theme'

// The knutesjef's OWN bottom nav ("egen knutesjef-verden med faner"): while in
// knutesjef mode the bar is Kø | Biblioteket | Knuteboka, plus a distinct exit
// back to the student app. Mounted on the three knutesjef main screens —
// drill-ins (folder view, edit) keep the native back stack instead.

export type KnutesjefTabKey = 'ko' | 'bibliotek' | 'knuteboka'

const TABS: { key: KnutesjefTabKey; href: '/review' | '/admin/bibliotek' | '/admin/knuteboka'; label: string }[] = [
  { key: 'ko', href: '/review', label: 'Kø' },
  { key: 'bibliotek', href: '/admin/bibliotek', label: 'Biblioteket' },
  { key: 'knuteboka', href: '/admin/knuteboka', label: 'Knuteboka' },
]

export function KnutesjefTabBar({ active }: { active: KnutesjefTabKey }) {
  const insets = useSafeAreaInsets()
  const router = useRouter()

  // Badge on Kø. Shares the query key the review screen invalidates on
  // approve/reject, so the count stays honest without extra wiring.
  const pending = useQuery({
    queryKey: ['submissions', 'pending', 'count'],
    queryFn: tryFetchPendingCount,
    staleTime: 30_000,
  })
  const pendingCount = pending.data ?? 0

  return (
    <View
      style={[styles.wrap, { bottom: insets.bottom + size.bottomNavBottomOffset }]}
      pointerEvents="box-none"
    >
      <View style={styles.bar} accessibilityRole="tablist" accessibilityLabel="Knutesjef-navigasjon">
        <Pressable
          onPress={() => router.replace('/')}
          haptic="light"
          accessibilityRole="button"
          accessibilityLabel="Tilbake til appen"
          accessibilityHint="Forlater knutesjef-verktøyene."
          style={styles.exit}
        >
          <Home size={size.bottomNavIcon - spacing.xs} color={sticker.color.textMuted} strokeWidth={2.2} />
        </Pressable>

        <View style={styles.divider} />

        {TABS.map((tab) => {
          const isActive = tab.key === active
          const badge = tab.key === 'ko' && pendingCount > 0 ? pendingCount : null
          return (
            <Pressable
              key={tab.key}
              // replace, not push: tab switches swap the screen instead of
              // stacking Kø/Bibliotek/Knuteboka copies on every switch.
              onPress={() => {
                if (!isActive) router.replace(tab.href)
              }}
              haptic="selection"
              accessibilityRole="tab"
              accessibilityLabel={
                badge !== null ? `${tab.label}, ${formatNumber(badge)} venter` : tab.label
              }
              accessibilityState={{ selected: isActive }}
              hitSlop={spacing.xs}
              style={[styles.tab, isActive ? styles.tabActive : null]}
            >
              <TabIcon name={tab.key} active={isActive} />
              {isActive ? (
                <Text size="xs" weight="bold" color={sticker.color.textInverse}>
                  {tab.label}
                </Text>
              ) : null}
              {badge !== null ? (
                <View style={styles.badge}>
                  <Text size="xs" weight="bold" color={sticker.color.textInverse} font="mono">
                    {formatNumber(badge)}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

function TabIcon({ name, active }: { name: KnutesjefTabKey; active: boolean }) {
  const color = active ? sticker.color.textInverse : sticker.color.ink
  if (name === 'ko') return <Inbox size={size.bottomNavIcon - spacing.xs} color={color} strokeWidth={2.2} />
  if (name === 'bibliotek')
    return <LibraryBig size={size.bottomNavIcon - spacing.xs} color={color} strokeWidth={2.2} />
  return <KnoteIcon name="knute" size={size.bottomNavIcon - spacing.xs} color={color} />
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: spacing.sm,
    right: spacing.sm,
    alignItems: 'center',
  },
  bar: {
    minHeight: size.bottomNavMinHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.xs,
    borderRadius: sticker.radius.full,
    borderWidth: sticker.borderWidth,
    borderColor: sticker.color.ink,
    backgroundColor: sticker.color.card,
    // Same soft elevation as the student bar so the two feel like siblings.
    shadowColor: sticker.color.ink,
    shadowOffset: { width: spacing.none, height: size.bottomNavShadowOffsetY },
    shadowOpacity: 0.18,
    shadowRadius: size.bottomNavShadowRadius,
    elevation: size.bottomNavElevation,
  },
  exit: {
    width: size.bottomNavButton,
    minHeight: size.bottomNavButton,
    borderRadius: sticker.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    width: 1,
    alignSelf: 'stretch',
    marginVertical: spacing.sm,
    backgroundColor: sticker.color.line,
  },
  tab: {
    minWidth: size.bottomNavButton,
    minHeight: size.bottomNavButton,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: size.bottomNavContentGap,
    paddingHorizontal: spacing.sm,
    borderRadius: sticker.radius.full,
    borderWidth: sticker.borderWidth,
    borderColor: sticker.color.ink,
    backgroundColor: sticker.color.card,
  },
  tabActive: {
    backgroundColor: sticker.color.primary,
    paddingHorizontal: spacing.md,
  },
  badge: {
    position: 'absolute',
    top: -spacing.xs,
    right: -spacing.xs,
    minWidth: 18,
    height: 18,
    paddingHorizontal: spacing.xs,
    borderRadius: sticker.radius.full,
    borderWidth: 1.5,
    borderColor: sticker.color.card,
    backgroundColor: sticker.color.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
