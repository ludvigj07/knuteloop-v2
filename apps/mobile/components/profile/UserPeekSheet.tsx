import { ScrollView, StyleSheet, View } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react-native'
import { Chip, Pressable, Sheet, Skeleton, StickerButton, StickerCard, Text } from '../primitives'
import {
  fetchUserProfile,
  fetchUserSubmissions,
  type PublicProfile,
  type RussType,
} from '../../lib/api'
import { formatNumber } from '../../lib/format'
import { size, spacing, sticker } from '../../lib/theme'

const RUSS_TYPE_LABEL: Record<RussType, string> = {
  red: 'Rødruss',
  blue: 'Blåruss',
}

export function UserPeekSheet({
  userId,
  onClose,
  onOpenFullProfile,
}: {
  userId: string | null
  onClose: () => void
  onOpenFullProfile: (userId: string) => void
}) {
  const profile = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUserProfile(userId!),
    enabled: userId !== null,
  })
  const recent = useQuery({
    queryKey: ['user', userId, 'submissions', 'peek'],
    queryFn: () => fetchUserSubmissions(userId!),
    enabled: userId !== null,
    staleTime: 30_000,
  })

  const openFullProfile = () => {
    if (!userId) return
    onClose()
    onOpenFullProfile(userId)
  }

  return (
    <Sheet open={userId !== null} onClose={onClose}>
      <View style={styles.headerRow}>
        <Text font="display" weight="bold" size="lg" color={sticker.color.ink}>
          Profil
        </Text>
        <Pressable
          onPress={onClose}
          haptic="light"
          accessibilityRole="button"
          accessibilityLabel="Lukk profiloversikten"
          style={styles.closeButton}
        >
          <X size={sticker.icon.md} color={sticker.color.ink} strokeWidth={sticker.borderWidth} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {profile.isLoading ? (
          <PeekLoading />
        ) : profile.error || !profile.data ? (
          <StickerCard tone="soft" radius="lg" shadow="sm">
            <View style={styles.stateContent}>
              <Text weight="bold" color={sticker.color.danger}>
                Kunne ikke laste profilen
              </Text>
              <StickerButton label="Prøv igjen" variant="secondary" onPress={() => void profile.refetch()} />
            </View>
          </StickerCard>
        ) : (
          <PeekContent
            profile={profile.data}
            recentTitles={(recent.data?.submissions ?? []).slice(0, 3).map((item) => ({
              id: item.id,
              title: item.knuteTitle,
              points: item.knutePoints,
            }))}
            recentLoading={recent.isLoading}
          />
        )}
      </ScrollView>

      {profile.data ? (
        <View style={styles.footer}>
          <StickerButton
            label="Se hele profilen"
            variant="primary"
            fullWidth
            onPress={openFullProfile}
            accessibilityHint="Åpner profilsiden med alle delte knuter."
          />
        </View>
      ) : null}
    </Sheet>
  )
}

function PeekContent({
  profile,
  recentTitles,
  recentLoading,
}: {
  profile: PublicProfile
  recentTitles: { id: string; title: string; points: number }[]
  recentLoading: boolean
}) {
  const { user } = profile
  return (
    <View style={styles.body}>
      <View style={styles.identity}>
        <View style={styles.avatar} accessibilityElementsHidden>
          <Text font="display" weight="bold" size="xl" color={sticker.color.primary}>
            {user.russenavn.slice(0, 1).toLocaleUpperCase('nb-NO')}
          </Text>
        </View>
        <View style={styles.identityText}>
          <Text font="display" weight="bold" size="2xl" color={sticker.color.ink} numberOfLines={2}>
            {user.russenavn}
          </Text>
          <View style={styles.chips}>
            <Chip label={RUSS_TYPE_LABEL[user.russType]} tone={user.russType === 'red' ? 'danger' : 'primary'} />
            {user.className ? <Chip label={user.className} tone="neutral" /> : null}
          </View>
        </View>
      </View>

      {user.quote ? (
        <Text size="sm" color={sticker.color.textMuted} style={styles.quote}>
          «{user.quote}»
        </Text>
      ) : null}

      <View style={styles.stats}>
        <PeekStat value={`#${formatNumber(user.rank)}`} label="plass" />
        <PeekStat value={formatNumber(user.points)} label="poeng" />
        <PeekStat value={formatNumber(user.completedCount)} label="fullført" />
      </View>

      <Text weight="bold" size="sm" color={sticker.color.ink}>
        Siste delte knuter
      </Text>
      {recentLoading ? (
        <Skeleton style={styles.recentSkeleton} />
      ) : recentTitles.length > 0 ? (
        <View style={styles.recentList}>
          {recentTitles.map((item) => (
            <View key={item.id} style={styles.recentRow}>
              <Text size="sm" weight="semibold" color={sticker.color.ink} numberOfLines={1} style={styles.recentTitle}>
                {item.title}
              </Text>
              <Text font="mono" size="sm" weight="bold" color={sticker.color.primary}>
                +{formatNumber(item.points)} p
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text size="sm" color={sticker.color.textMuted}>
          Ingen delte knuter ennå.
        </Text>
      )}
    </View>
  )
}

function PeekStat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat} accessibilityLabel={`${value} ${label}`}>
      <Text font="mono" weight="bold" size="lg" color={sticker.color.ink}>
        {value}
      </Text>
      <Text size="xs" weight="semibold" color={sticker.color.textMuted}>
        {label}
      </Text>
    </View>
  )
}

function PeekLoading() {
  return (
    <View style={styles.body}>
      <Skeleton style={styles.nameSkeleton} />
      <Skeleton style={styles.lineSkeleton} />
      <Skeleton style={styles.recentSkeleton} />
    </View>
  )
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  closeButton: {
    width: size.minTapTarget,
    height: size.minTapTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { paddingHorizontal: spacing.base },
  body: { gap: spacing.md, paddingBottom: spacing.base },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: size.profileAvatar,
    height: size.profileAvatar,
    borderRadius: sticker.radius.lg,
    backgroundColor: sticker.color.surfaceSoft,
    borderWidth: sticker.borderWidth,
    borderColor: sticker.color.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityText: { flex: 1, gap: spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  quote: { fontStyle: 'italic' },
  stats: { flexDirection: 'row', gap: spacing.sm },
  stat: {
    flex: 1,
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: sticker.radius.md,
    backgroundColor: sticker.color.paper,
  },
  recentList: { gap: spacing.xs },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  recentTitle: { flex: 1 },
  footer: { paddingHorizontal: spacing.base, paddingTop: spacing.sm },
  stateContent: { alignItems: 'center', gap: spacing.md, padding: spacing.sm },
  nameSkeleton: { width: size.skeletonTitleWidth, height: size.skeletonTitleHeight },
  lineSkeleton: { alignSelf: 'stretch', height: size.skeletonRowTitleHeight },
  recentSkeleton: { alignSelf: 'stretch', height: size.controlHeightLg },
})
