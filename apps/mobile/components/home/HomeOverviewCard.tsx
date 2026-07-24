import { StyleSheet } from 'react-native'
import { Stack, StickerCard, Text } from '../primitives'
import type { LeaderboardEntry, MeResponse } from '../../lib/api'
import { formatNumber } from '../../lib/format'
import { minimumFontScale, spacing, sticker } from '../../lib/theme'

export function HomeOverviewCard({
  me,
  leaderboardEntry,
}: {
  me: MeResponse
  leaderboardEntry: LeaderboardEntry | null
}) {
  return (
    <Stack gap="md">
      <Text font="display" size="xl" weight="bold" color={sticker.color.ink}>
        Din russetid
      </Text>
      <StickerCard tone="primary" shadow="sm">
        <Stack gap="lg">
          <Stack gap="xs">
            <Text size="sm" weight="semibold" color={sticker.color.accent}>
              {leaderboardEntry?.rankTitle ?? 'Din oversikt'}
            </Text>
            <Text font="display" size="xl" weight="bold" color={sticker.color.textInverse}>
              {me.user.russenavn}
            </Text>
            {me.user.className ? (
              <Text size="sm" color={sticker.color.textInverse}>
                {me.user.className}
              </Text>
            ) : null}
          </Stack>

          <Stack
            direction="row"
            align="stretch"
            accessible
            accessibilityLabel={`${formatNumber(me.user.points)} poeng, ${
              leaderboardEntry
                ? `plass ${formatNumber(leaderboardEntry.rank)}`
                : 'plassering ikke klar'
            }, ${formatNumber(me.completedCount)} fullførte knuter`}
          >
            <OverviewStat value={formatNumber(me.user.points)} label="poeng" />
            <Stack style={styles.divider} />
            <OverviewStat
              value={leaderboardEntry ? `#${formatNumber(leaderboardEntry.rank)}` : '–'}
              label="plass"
            />
            <Stack style={styles.divider} />
            <OverviewStat value={formatNumber(me.completedCount)} label="fullført" />
          </Stack>
        </Stack>
      </StickerCard>
    </Stack>
  )
}

function OverviewStat({ value, label }: { value: string; label: string }) {
  return (
    <Stack style={styles.stat} align="center" gap="2xs">
      <Text
        font="mono"
        size="xl"
        weight="bold"
        color={sticker.color.textInverse}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={minimumFontScale.compactNumber}
      >
        {value}
      </Text>
      <Text size="xs" weight="semibold" color={sticker.color.textInverse}>
        {label}
      </Text>
    </Stack>
  )
}

const styles = StyleSheet.create({
  stat: {
    flex: 1,
    minWidth: spacing.none,
  },
  divider: {
    width: sticker.borderWidth,
    backgroundColor: sticker.color.primarySoft,
    marginHorizontal: spacing.sm,
  },
})
