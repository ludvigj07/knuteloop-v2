import { View, Text, StyleSheet, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { borderWidth, colors, fontSize, fontWeight, opacity, radius, size, spacing } from '../lib/theme'

export type AppTabKey = 'knuter' | 'toppliste' | 'oyeblikk' | 'knutesjef' | 'profil'

type TabItem = {
  key: AppTabKey
  href: '/' | '/leaderboard' | '/feed' | '/admin' | '/profile'
  label: string
}

const TAB_ITEMS: readonly TabItem[] = [
  { key: 'knuter', href: '/', label: 'Knuter' },
  { key: 'toppliste', href: '/leaderboard', label: 'Toppliste' },
  { key: 'oyeblikk', href: '/feed', label: 'Øyeblikk' },
  { key: 'knutesjef', href: '/admin', label: 'Knutesjef' },
  { key: 'profil', href: '/profile', label: 'Profil' },
]

export function AppTabBar({ active }: { active: AppTabKey }) {
  const insets = useSafeAreaInsets()
  const router = useRouter()

  return (
    <View
      style={[styles.wrap, { bottom: insets.bottom + size.bottomNavBottomOffset }]}
      pointerEvents="box-none"
    >
      <View style={styles.bar} accessibilityRole="tablist" accessibilityLabel="Hovednavigasjon">
        {TAB_ITEMS.map((item) => {
          const isActive = item.key === active

          return (
            <Pressable
              key={item.key}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
              onPress={() => router.push(item.href)}
              accessibilityRole="tab"
              accessibilityLabel={item.label}
              accessibilityHint={`Åpner ${item.label.toLocaleLowerCase('nb-NO')}.`}
              accessibilityState={{ selected: isActive }}
              hitSlop={spacing.xs}
            >
              <TabIcon name={item.key} active={isActive} />
              {isActive ? <Text style={styles.activeLabel}>{item.label}</Text> : null}
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

function TabIcon({ name, active }: { name: AppTabKey; active: boolean }) {
  if (name === 'knuter') return <StackIcon active={active} />
  if (name === 'toppliste') return <TrophyIcon active={active} />
  if (name === 'oyeblikk') return <PlayIcon active={active} />
  if (name === 'knutesjef') return <ShieldIcon active={active} />
  return <PersonIcon active={active} />
}

function StackIcon({ active }: { active: boolean }) {
  return (
    <View style={styles.iconBox} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[styles.stackLine, active && styles.iconFillActive]} />
      <View style={[styles.stackLine, styles.stackLineShort, active && styles.iconFillActive]} />
      <View style={[styles.stackLine, active && styles.iconFillActive]} />
    </View>
  )
}

function TrophyIcon({ active }: { active: boolean }) {
  return (
    <View style={styles.iconBox} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[styles.trophyCup, active && styles.iconStrokeActive]} />
      <View style={[styles.trophyStem, active && styles.iconFillActive]} />
      <View style={[styles.trophyBase, active && styles.iconFillActive]} />
    </View>
  )
}

function PlayIcon({ active }: { active: boolean }) {
  return (
    <View style={styles.iconBox} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[styles.playTriangle, active && styles.playTriangleActive]} />
    </View>
  )
}

function PersonIcon({ active }: { active: boolean }) {
  return (
    <View style={styles.iconBox} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[styles.personHead, active && styles.iconStrokeActive]} />
      <View style={[styles.personShoulders, active && styles.iconStrokeActive]} />
    </View>
  )
}

function ShieldIcon({ active }: { active: boolean }) {
  return (
    <View style={styles.iconBox} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[styles.shield, active && styles.iconStrokeActive]}>
        <View style={[styles.shieldMark, active && styles.iconFillActive]} />
      </View>
    </View>
  )
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
    borderRadius: radius.full,
    borderWidth: borderWidth.thick,
    borderColor: colors.borderInk,
    backgroundColor: colors.tabBar.surface,
    shadowColor: colors.tabBar.shadow,
    shadowOffset: { width: spacing.none, height: size.bottomNavShadowOffsetY },
    shadowOpacity: opacity.shadow,
    shadowRadius: size.bottomNavShadowRadius,
    elevation: size.bottomNavElevation,
  },
  tabItem: {
    width: size.bottomNavButton,
    minHeight: size.bottomNavButton,
    borderRadius: radius.full,
    borderWidth: borderWidth.medium,
    borderColor: colors.borderInk,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemActive: {
    width: size.bottomNavActiveWidth,
    flexDirection: 'row',
    gap: size.bottomNavContentGap,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.tabBar.active,
  },
  activeLabel: {
    color: colors.text.inverse,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  iconBox: {
    width: size.bottomNavIcon,
    height: size.bottomNavIcon,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing['2xs'],
  },
  stackLine: {
    width: size.iconLineLong,
    height: size.iconLineHeight,
    borderRadius: radius.full,
    backgroundColor: colors.tabBar.icon,
  },
  stackLineShort: {
    width: size.iconLineShort,
  },
  trophyCup: {
    width: size.iconTrophyCupWidth,
    height: size.iconTrophyCupHeight,
    borderWidth: borderWidth.medium,
    borderColor: colors.tabBar.icon,
    borderRadius: radius.sm,
  },
  trophyStem: {
    width: size.iconTrophyStemWidth,
    height: size.iconTrophyStemHeight,
    backgroundColor: colors.tabBar.icon,
  },
  trophyBase: {
    width: size.iconTrophyBaseWidth,
    height: size.iconTrophyBaseHeight,
    borderRadius: radius.full,
    backgroundColor: colors.tabBar.icon,
  },
  playTriangle: {
    width: spacing.none,
    height: spacing.none,
    borderTopWidth: size.iconPlayTop,
    borderBottomWidth: size.iconPlayTop,
    borderLeftWidth: size.iconPlayLeft,
    borderTopColor: colors.transparent,
    borderBottomColor: colors.transparent,
    borderLeftColor: colors.tabBar.icon,
  },
  playTriangleActive: {
    borderLeftColor: colors.text.inverse,
  },
  personHead: {
    width: size.iconPersonHead,
    height: size.iconPersonHead,
    borderRadius: radius.full,
    borderWidth: borderWidth.medium,
    borderColor: colors.tabBar.icon,
  },
  personShoulders: {
    width: size.iconPersonShouldersWidth,
    height: size.iconPersonShouldersHeight,
    borderTopLeftRadius: radius.full,
    borderTopRightRadius: radius.full,
    borderWidth: borderWidth.medium,
    borderColor: colors.tabBar.icon,
  },
  shield: {
    width: size.iconShieldWidth,
    height: size.iconShieldHeight,
    borderWidth: borderWidth.medium,
    borderColor: colors.tabBar.icon,
    borderTopLeftRadius: radius.sm,
    borderTopRightRadius: radius.sm,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldMark: {
    width: size.iconShieldMark,
    height: size.iconShieldMark,
    borderRadius: radius.full,
    backgroundColor: colors.tabBar.icon,
  },
  iconFillActive: {
    backgroundColor: colors.text.inverse,
  },
  iconStrokeActive: {
    borderColor: colors.text.inverse,
  },
})
