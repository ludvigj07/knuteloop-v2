import { StyleSheet } from 'react-native'
import { Home, Play, Shield, Trophy, UserRound } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { KnoteIcon, Pressable, Stack, Text } from './primitives'
import {
  borderWidth,
  colors,
  opacity,
  radius,
  size,
  spacing,
  sticker,
} from '../lib/theme'

export type AppTabKey = 'home' | 'knuter' | 'toppliste' | 'oyeblikk' | 'knutesjef' | 'profil'

type TabItem = {
  key: AppTabKey
  href: '/' | '/knuter' | '/leaderboard' | '/feed' | '/admin' | '/profile'
  label: string
}

const HOME_TAB: TabItem = { key: 'home', href: '/', label: 'Hjem' }
const KNUTER_TAB: TabItem = { key: 'knuter', href: '/knuter', label: 'Knuter' }
const FEED_TAB: TabItem = { key: 'oyeblikk', href: '/feed', label: 'Øyeblikk' }
const LEADERBOARD_TAB: TabItem = {
  key: 'toppliste',
  href: '/leaderboard',
  label: 'Toppliste',
}
const PROFILE_TAB: TabItem = { key: 'profil', href: '/profile', label: 'Profil' }
const KNUTESJEF_TAB: TabItem = {
  key: 'knutesjef',
  href: '/admin',
  label: 'Knutesjef',
}

const STUDENT_TABS = [HOME_TAB, KNUTER_TAB, FEED_TAB, LEADERBOARD_TAB, PROFILE_TAB] as const

const KNUTESJEF_TABS = [HOME_TAB, KNUTER_TAB, FEED_TAB, LEADERBOARD_TAB, KNUTESJEF_TAB] as const

export function AppTabBar({ active }: { active: AppTabKey }) {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const tabs = active === 'knutesjef' ? KNUTESJEF_TABS : STUDENT_TABS

  return (
    <Stack
      style={[
        styles.wrap,
        {
          right: insets.right + spacing.sm,
          bottom: insets.bottom + size.bottomNavBottomOffset,
          left: insets.left + spacing.sm,
        },
      ]}
      align="center"
      pointerEvents="box-none"
    >
      <Stack
        direction="row"
        align="center"
        justify="center"
        gap="xs"
        padding="xs"
        style={styles.bar}
        accessibilityRole="tablist"
        accessibilityLabel="Hovednavigasjon"
      >
        {tabs.map((item) => {
          const isActive = item.key === active

          return (
            <Pressable
              key={item.key}
              style={[styles.tabItem, isActive ? styles.tabItemActive : null]}
              onPress={() => {
                if (!isActive) router.replace(item.href)
              }}
              haptic="selection"
              accessibilityRole="tab"
              accessibilityLabel={item.label}
              accessibilityHint={`Åpner ${item.label.toLocaleLowerCase('nb-NO')}.`}
              accessibilityState={{ selected: isActive }}
              hitSlop={spacing.xs}
            >
              <TabIcon name={item.key} active={isActive} />
              {isActive ? (
                <Text
                  size="xs"
                  weight="bold"
                  color={sticker.color.textInverse}
                  numberOfLines={1}
                  style={styles.activeLabel}
                >
                  {item.label}
                </Text>
              ) : null}
            </Pressable>
          )
        })}
      </Stack>
    </Stack>
  )
}

function TabIcon({ name, active }: { name: AppTabKey; active: boolean }) {
  const color = active ? sticker.color.textInverse : sticker.color.ink
  const iconProps = {
    size: size.bottomNavIcon,
    color,
    strokeWidth: borderWidth.medium,
  }

  return (
    <Stack
      style={styles.iconBox}
      align="center"
      justify="center"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {name === 'home' ? <Home {...iconProps} /> : null}
      {name === 'knuter' ? (
        <KnoteIcon name="knute" size={size.bottomNavIcon} color={color} />
      ) : null}
      {name === 'oyeblikk' ? <Play {...iconProps} /> : null}
      {name === 'toppliste' ? <Trophy {...iconProps} /> : null}
      {name === 'knutesjef' ? <Shield {...iconProps} /> : null}
      {name === 'profil' ? <UserRound {...iconProps} /> : null}
    </Stack>
  )
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    alignItems: 'center',
  },
  bar: {
    minHeight: size.bottomNavMinHeight,
    borderRadius: radius.full,
    borderWidth: borderWidth.thick,
    borderColor: sticker.color.ink,
    backgroundColor: sticker.color.card,
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
    borderColor: sticker.color.ink,
    backgroundColor: sticker.color.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemActive: {
    // minWidth (not width): the pill must grow with the label —
    // adjustsFontSizeToFit is a no-op on react-native-web, so shrinking
    // the text can never be the overflow fix here.
    minWidth: size.bottomNavActiveWidth,
    flexDirection: 'row',
    gap: size.bottomNavContentGap,
    paddingHorizontal: spacing.sm,
    backgroundColor: sticker.color.primary,
  },
  activeLabel: {
    flexShrink: 1,
  },
  iconBox: {
    width: size.bottomNavIcon,
    height: size.bottomNavIcon,
  },
})
