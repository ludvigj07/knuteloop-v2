import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Stack, useRouter } from 'expo-router'
import { ChevronRight, FolderHeart, Inbox, LibraryBig, SquarePen } from 'lucide-react-native'
import { AppTabBar } from '../../components/AppTabBar'
import { Eyebrow, Pressable, Skeleton, StickerButton, StickerCard, Text } from '../../components/primitives'
import { GlyphTile } from '../../components/knute/GlyphTile'
import { ApiError, fetchAllKnuter, tryFetchPendingCount } from '../../lib/api'
import { formatNumber } from '../../lib/format'
import { size, sticker, spacing } from '../../lib/theme'

export default function KnutesjefPanel() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { data, error, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['knuter', 'all'],
    queryFn: fetchAllKnuter,
  })
  const pendingCount = useQuery({
    queryKey: ['submissions', 'pending', 'count'],
    queryFn: tryFetchPendingCount,
    staleTime: 10_000,
  })

  const topPad = insets.top + spacing.base
  const bottomPad = insets.bottom + size.bottomNavMinHeight + spacing.xl

  if (isLoading) {
    return (
      <Screen>
        <View style={{ paddingTop: topPad }}>
          <View style={styles.gutter}>
            <Skeleton style={{ width: size.skeletonTitleWidth, height: size.skeletonTitleHeight }} />
          </View>
          <View style={[styles.gutter, styles.skeletonList]}>
            <Skeleton style={styles.skeletonPanel} />
          </View>
        </View>
      </Screen>
    )
  }

  if (error) {
    const isForbidden = error instanceof ApiError && error.status === 403
    return (
      <Screen>
        <View style={[styles.center, { paddingTop: topPad }]}>
          <StickerCard tone="surface" style={styles.errorCard}>
            <Text font="display" weight="bold" size="lg" color={sticker.color.ink}>
              {isForbidden ? 'Du må være knutesjef' : 'Kunne ikke laste'}
            </Text>
            <Text color={sticker.color.textMuted}>
              {isForbidden ? 'Denne siden er kun for knutesjefer.' : (error as Error).message}
            </Text>
            {!isForbidden ? (
              <StickerButton label="Prøv igjen" variant="secondary" size="sm" onPress={() => void refetch()} />
            ) : null}
          </StickerCard>
        </View>
      </Screen>
    )
  }

  const active = (data?.knuter ?? []).filter((k) => k.isActive)
  const pending = pendingCount.data ?? 0
  const pendingLabel =
    pending === 1 ? '1 innsending venter' : `${formatNumber(pending)} innsendinger venter`

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ paddingTop: topPad, paddingBottom: bottomPad }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
            tintColor={sticker.color.primary}
          />
        }
      >
        <View style={styles.headerBlock}>
          <Eyebrow>Knutesjef</Eyebrow>
          <Text font="display" weight="bold" size="3xl" color={sticker.color.ink}>
            Verktøy
          </Text>
          <Text color={sticker.color.textMuted}>Innsendinger, knutebok og verktøy for skolen.</Text>
        </View>

        <StickerCard padding="none" radius="lg" style={styles.gutter}>
          <ToolRow
            icon={<Inbox size={sticker.icon.sm} color={sticker.color.primary} strokeWidth={2} />}
            tone="primary"
            title="Innsendinger"
            meta={pendingLabel}
            highlight={pending > 0}
            onPress={() => router.push('/review')}
          />
          <ToolRow
            icon={<FolderHeart size={sticker.icon.sm} color={sticker.color.primary} strokeWidth={2} />}
            tone="primary"
            title="Knuteboka"
            meta={`${formatNumber(active.length)} knuter i mappene dine`}
            onPress={() => router.push('/admin/knuteboka')}
          />
          <ToolRow
            icon={<SquarePen size={sticker.icon.sm} color={sticker.color.accentStrong} strokeWidth={2} />}
            tone="accent"
            title="Ny knute"
            meta="Lag et nytt oppdrag for skolen."
            onPress={() => router.push('/admin/edit/new')}
          />
          <ToolRow
            icon={<LibraryBig size={sticker.icon.sm} color={sticker.color.primary} strokeWidth={2} />}
            tone="primary"
            title="Bibliotek"
            meta="Importer ferdige knuter — hele pakker i ett trykk."
            onPress={() => router.push('/admin/bibliotek')}
            last
          />
        </StickerCard>
      </ScrollView>
      <AppTabBar active="knutesjef" />
    </Screen>
  )
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.root}>{children}</View>
    </>
  )
}

function ToolRow({
  icon,
  tone,
  title,
  meta,
  onPress,
  highlight,
  last,
}: {
  icon: React.ReactNode
  tone: 'primary' | 'accent'
  title: string
  meta: string
  onPress: () => void
  highlight?: boolean
  last?: boolean
}) {
  return (
    <Pressable
      onPress={onPress}
      haptic="light"
      accessibilityRole="link"
      accessibilityLabel={`${title}. ${meta}`}
      style={[styles.toolRow, last ? null : styles.toolRowBorder]}
    >
      <GlyphTile size={40} tone={tone}>
        {icon}
      </GlyphTile>
      <View style={styles.toolText}>
        <Text font="display" weight="bold" size="base" color={sticker.color.ink}>
          {title}
        </Text>
        <Text size="sm" color={highlight ? sticker.color.primary : sticker.color.textMuted}>
          {meta}
        </Text>
      </View>
      <ChevronRight size={sticker.icon.md} color={sticker.color.textMuted} strokeWidth={2} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: sticker.color.paper },
  gutter: { paddingHorizontal: spacing.base },
  headerBlock: { paddingHorizontal: spacing.base, paddingBottom: spacing.base, gap: spacing['2xs'] },
  skeletonList: { marginTop: spacing.base },
  skeletonPanel: { height: 240, borderRadius: sticker.radius.lg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.base },
  errorCard: { gap: spacing.sm, alignItems: 'flex-start' },
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    minHeight: sticker.tap.size,
  },
  toolRowBorder: { borderBottomWidth: 1, borderBottomColor: sticker.color.line },
  toolText: { flex: 1, gap: spacing['2xs'] },
})
