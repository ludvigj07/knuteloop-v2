import { StyleSheet } from 'react-native'
import { ChevronRight, Trophy } from 'lucide-react-native'
import { Chip, Pressable, Skeleton, Stack, StickerButton, StickerCard, Text } from '../primitives'
import type { LeaderboardEntry } from '../../lib/api'
import { formatNumber } from '../../lib/format'
import { minimumFontScale, size, spacing, sticker } from '../../lib/theme'

export function HomeTopThree({
  entries,
  isLoading,
  error,
  onRetry,
  onOpenProfile,
  onOpenLeaderboard,
}: {
  entries: LeaderboardEntry[]
  isLoading: boolean
  error: Error | null
  onRetry: () => void
  onOpenProfile: (userId: string) => void
  onOpenLeaderboard: () => void
}) {
  return (
    <Stack gap="md">
      <Text font="display" size="xl" weight="bold" color={sticker.color.ink}>
        På skolen
      </Text>
      <StickerCard padding="none" shadow="sm">
        <Stack padding="base" gap="md">
          <Stack direction="row" align="center" gap="sm">
            <Trophy
              size={sticker.icon.md}
              color={sticker.color.gold}
              strokeWidth={sticker.borderWidth}
            />
            <Stack style={styles.copy} gap="2xs">
              <Text font="display" size="lg" weight="bold" color={sticker.color.ink}>
                Topp tre akkurat nå
              </Text>
              <Text size="sm" color={sticker.color.textMuted}>
                Skolens plasseringer oppdateres når knuter godkjennes.
              </Text>
            </Stack>
          </Stack>

          {isLoading ? (
            <Stack gap="sm">
              {[1, 2, 3].map((rank) => (
                <Stack key={rank} direction="row" align="center" gap="sm" style={styles.row}>
                  <Skeleton style={styles.rankSkeleton} />
                  <Stack style={styles.copy} gap="xs">
                    <Skeleton style={styles.nameSkeleton} />
                    <Skeleton style={styles.metaSkeleton} />
                  </Stack>
                </Stack>
              ))}
            </Stack>
          ) : error && entries.length === spacing.none ? (
            <Stack gap="md" align="start">
              <Text size="sm" color={sticker.color.textMuted}>
                {error.message}
              </Text>
              <StickerButton label="Prøv igjen" variant="secondary" size="sm" onPress={onRetry} />
            </Stack>
          ) : entries.length === spacing.none ? (
            <Stack gap="xs" style={styles.empty}>
              <Text weight="semibold" color={sticker.color.ink}>
                Ingen plasseringer ennå
              </Text>
              <Text size="sm" color={sticker.color.textMuted}>
                Topplisten fylles når skolen får sine første godkjente knuter.
              </Text>
            </Stack>
          ) : (
            <Stack>
              {entries.map((entry, index) => (
                <LeaderboardPreviewRow
                  key={entry.userId}
                  entry={entry}
                  showDivider={index < entries.length - 1}
                  onOpenProfile={onOpenProfile}
                />
              ))}
            </Stack>
          )}

          {!isLoading && !error && entries.length > spacing.none ? (
            <StickerButton
              label="Se hele topplisten"
              variant="ghost"
              size="sm"
              fullWidth
              onPress={onOpenLeaderboard}
              accessibilityHint="Åpner topplisten for skolen og klassene."
            />
          ) : null}
        </Stack>
      </StickerCard>
    </Stack>
  )
}

function LeaderboardPreviewRow({
  entry,
  showDivider,
  onOpenProfile,
}: {
  entry: LeaderboardEntry
  showDivider: boolean
  onOpenProfile: (userId: string) => void
}) {
  const medalStyle =
    entry.rank === 1
      ? styles.rankGold
      : entry.rank === 2
        ? styles.rankSilver
        : entry.rank === 3
          ? styles.rankBronze
          : styles.rankNeutral

  return (
    <Pressable
      onPress={() => onOpenProfile(entry.userId)}
      haptic="light"
      accessibilityRole="link"
      accessibilityLabel={`Plass ${formatNumber(entry.rank)}: ${entry.russenavn}, ${formatNumber(entry.points)} poeng, ${entry.rankTitle}`}
      accessibilityHint="Åpner profilen."
      style={[styles.previewRow, showDivider ? styles.previewRowDivider : null]}
    >
      <Stack style={[styles.rankBadge, medalStyle]} align="center" justify="center">
        <Text font="mono" weight="bold" color={sticker.color.ink}>
          {formatNumber(entry.rank)}
        </Text>
      </Stack>
      <Stack style={styles.copy} gap="2xs">
        <Stack direction="row" align="center" gap="xs">
          <Text weight="semibold" color={sticker.color.ink} numberOfLines={1} style={styles.copy}>
            {entry.russenavn}
          </Text>
          {entry.isCurrentUser ? <Chip label="Deg" tone="primary" /> : null}
        </Stack>
        <Text size="xs" color={sticker.color.textMuted} numberOfLines={1}>
          {entry.rankTitle}
        </Text>
      </Stack>
      <Text
        font="mono"
        size="sm"
        weight="bold"
        color={sticker.color.primary}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={minimumFontScale.compactNumber}
        style={styles.points}
      >
        {formatNumber(entry.points)} P
      </Text>
      <ChevronRight
        size={sticker.icon.sm}
        color={sticker.color.textMuted}
        strokeWidth={sticker.borderWidth}
      />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  copy: {
    flex: 1,
    minWidth: spacing.none,
  },
  points: {
    flexShrink: 1,
  },
  row: {
    minHeight: size.leaderboardRowMinHeight,
  },
  previewRow: {
    minHeight: size.leaderboardRowMinHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  previewRowDivider: {
    borderBottomWidth: sticker.borderWidth,
    borderBottomColor: sticker.color.line,
  },
  rankBadge: {
    width: size.leaderboardRank,
    height: size.leaderboardRank,
    borderRadius: sticker.radius.full,
    borderWidth: sticker.borderWidth,
    borderColor: sticker.color.ink,
  },
  rankGold: {
    backgroundColor: sticker.color.gold,
  },
  rankSilver: {
    backgroundColor: sticker.color.silver,
  },
  rankBronze: {
    backgroundColor: sticker.color.bronze,
  },
  rankNeutral: {
    backgroundColor: sticker.color.primaryBg,
  },
  empty: {
    paddingVertical: spacing.md,
  },
  rankSkeleton: {
    width: size.leaderboardRank,
    height: size.leaderboardRank,
    borderRadius: sticker.radius.full,
  },
  nameSkeleton: {
    width: size.skeletonTitleWidth,
    height: size.skeletonRowTitleHeight,
  },
  metaSkeleton: {
    width: size.leaderboardSelectWidth,
    height: size.skeletonRowMetaHeight,
  },
})
