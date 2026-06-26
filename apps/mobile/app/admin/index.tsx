import { View, StyleSheet, RefreshControl } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useQuery } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Stack, useRouter } from 'expo-router'
import { ChevronRight, Inbox, LibraryBig, SquarePen } from 'lucide-react-native'
import { AppTabBar } from '../../components/AppTabBar'
import {
  Badge,
  Chip,
  Eyebrow,
  KnoteIcon,
  Pressable,
  Skeleton,
  StickerButton,
  StickerCard,
  Text,
} from '../../components/primitives'
import { GlyphTile } from '../../components/knute/GlyphTile'
import { ApiError, fetchAllKnuter, tryFetchPendingCount, type Knute } from '../../lib/api'
import { formatNumber } from '../../lib/format'
import { difficultyTone } from '../../lib/knute-ui'
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
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} style={styles.skeletonRow} />
            ))}
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
              {isForbidden ? 'Du må være knutesjef' : 'Kunne ikke laste knutene'}
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

  const allKnuter = data?.knuter ?? []
  const active = allKnuter.filter((k) => k.isActive)
  const inactive = allKnuter.filter((k) => !k.isActive)
  const pending = pendingCount.data ?? 0
  const pendingLabel =
    pending === 1 ? '1 innsending venter' : `${formatNumber(pending)} innsendinger venter`

  const header = (
    <View style={{ paddingTop: topPad }}>
      <View style={styles.headerBlock}>
        <Eyebrow>Knutesjef</Eyebrow>
        <Text font="display" weight="bold" size="3xl" color={sticker.color.ink}>
          Verktøy
        </Text>
        <Text color={sticker.color.textMuted}>Innsendinger, knuter og verktøy for skolen.</Text>
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
          icon={<SquarePen size={sticker.icon.sm} color={sticker.color.accentStrong} strokeWidth={2} />}
          tone="accent"
          title="Ny knute"
          meta="Legg til et nytt oppdrag for skolen."
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

      <View style={styles.sectionHead}>
        <Text font="display" weight="bold" size="xl" color={sticker.color.ink}>
          Skolens knuter
        </Text>
        <Text size="sm" color={sticker.color.textMuted}>
          {formatNumber(active.length)} aktive · {formatNumber(inactive.length)} arkivert
        </Text>
      </View>
    </View>
  )

  const footer =
    inactive.length > 0 ? (
      <View>
        <Text size="sm" weight="semibold" color={sticker.color.textMuted} style={styles.archivedHead}>
          Arkivert
        </Text>
        {inactive.map((k) => (
          <KnuteRow key={k.id} knute={k} inactive onPress={() => router.push(`/admin/edit/${k.id}`)} />
        ))}
      </View>
    ) : null

  return (
    <Screen>
      <FlashList
        data={active}
        keyExtractor={(k) => k.id}
        estimatedItemSize={84}
        contentContainerStyle={{ paddingBottom: bottomPad }}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        ListEmptyComponent={
          <View style={styles.gutter}>
            <StickerCard tone="soft" shadow="sm">
              <Text color={sticker.color.textMuted}>Ingen aktive knuter. Lag en med «Ny knute» over.</Text>
            </StickerCard>
          </View>
        }
        renderItem={({ item }) => (
          <KnuteRow knute={item} onPress={() => router.push(`/admin/edit/${item.id}`)} />
        )}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
            tintColor={sticker.color.primary}
          />
        }
      />
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

function KnuteRow({
  knute,
  inactive,
  onPress,
}: {
  knute: Knute
  inactive?: boolean
  onPress: () => void
}) {
  return (
    <StickerCard
      onPress={onPress}
      radius="md"
      shadow="sm"
      padding="md"
      style={[styles.knuteRow, inactive ? styles.dim : null]}
      accessibilityLabel={`Rediger ${knute.isGold ? 'gullknute ' : ''}${knute.title}, ${formatNumber(knute.points)} poeng, ${knute.difficulty}${inactive ? ', arkivert' : ''}`}
    >
      <View style={styles.knuteRowInner}>
        <GlyphTile size={44} tone={knute.isGold ? 'accent' : 'primary'}>
          <KnoteIcon name="knute" size={24} color={knute.isGold ? sticker.color.gold : sticker.color.primary} />
        </GlyphTile>
        <View style={styles.knuteText}>
          <Text weight="semibold" size="base" color={sticker.color.ink} numberOfLines={2}>
            {knute.isGold ? <Text color={sticker.color.gold}>★ </Text> : null}
            {knute.title}
          </Text>
          <View style={styles.knuteMeta}>
            <Chip label={`${formatNumber(knute.points)} P`} tone="accent" mono />
            <Chip label={knute.difficulty} tone={difficultyTone(knute.difficulty)} />
            {inactive ? <Badge label="Arkivert" /> : null}
          </View>
        </View>
        <ChevronRight size={sticker.icon.md} color={sticker.color.textMuted} strokeWidth={2} />
      </View>
    </StickerCard>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: sticker.color.paper },
  gutter: { paddingHorizontal: spacing.base },
  headerBlock: { paddingHorizontal: spacing.base, paddingBottom: spacing.base, gap: spacing['2xs'] },
  skeletonList: { marginTop: spacing.base, gap: spacing.sm },
  skeletonRow: { height: size.controlHeightLg, borderRadius: sticker.radius.md },
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
  sectionHead: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing['2xs'],
  },
  archivedHead: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  knuteRow: { marginHorizontal: spacing.base, marginBottom: spacing.sm },
  dim: { opacity: 0.6 },
  knuteRowInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  knuteText: { flex: 1, gap: spacing.xs },
  knuteMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
})
