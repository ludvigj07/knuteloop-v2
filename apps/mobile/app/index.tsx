import { useMemo, useState } from 'react'
import { View, ScrollView, StyleSheet, RefreshControl, TextInput } from 'react-native'
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Stack, useRouter } from 'expo-router'
import { Shuffle } from 'lucide-react-native'
import { AppTabBar } from '../components/AppTabBar'
import { FolderChips } from '../components/knute/FolderChips'
import { KnuteListCard } from '../components/knute/KnuteListCard'
import {
  CountUp,
  Eyebrow,
  Pressable,
  Skeleton,
  StickerButton,
  StickerCard,
  Text,
} from '../components/primitives'
import { fetchFolders, fetchKnuter, fetchKnuterInFolder, type Knute } from '../lib/api'
import { formatNumber } from '../lib/format'
import { animation, fontFamily, fontSize, size, spacing, sticker } from '../lib/theme'

// Each list card fades + slides in just after the one above it, so the list
// assembles itself rather than snapping in. Capped so a long list doesn't keep
// delaying — cards past the cap all share the last delay.
const STAGGER_STEP_MS = 40
const STAGGER_MAX_STEPS = 8

// Student-facing difficulty labels (the enum keeps v1's mixed vocabulary).
const DIFFICULTY_LABEL: Record<Knute['difficulty'], string> = {
  Lett: 'Lett',
  Medium: 'Middels',
  Hard: 'Vanskelig',
  Valgfri: 'Valgfri',
}

export default function KnuterScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const reduceMotion = useReducedMotion()
  const [search, setSearch] = useState('')
  // null = "Alle" (the whole catalog); otherwise the selected folder's id.
  const [folderId, setFolderId] = useState<string | null>(null)
  // Tilgjengelige/Fullført: the catalog is a TO-DO list by default — only
  // knuter without an active (pending/approved) submission. The segmented
  // control flips to «Fullført» (sent in / approved). Two views, never a
  // combined list; the ACTIVE segment always names what you are looking at.
  const [view, setView] = useState<'available' | 'completed'>('available')

  const foldersQuery = useQuery({ queryKey: ['folders'], queryFn: fetchFolders })

  // "Alle" reuses the shared ['knuter'] entry (same one the knute-detail screen reads);
  // a folder gets its own entry. keepPreviousData keeps the list on screen while a new
  // folder loads instead of flashing the skeleton.
  const { data, error, isLoading, refetch, isRefetching } = useQuery({
    queryKey: folderId ? (['knuter', 'folder', folderId] as const) : (['knuter'] as const),
    queryFn: () => (folderId ? fetchKnuterInFolder(folderId) : fetchKnuter()),
    placeholderData: keepPreviousData,
  })

  const folders = foldersQuery.data?.folders ?? []
  const selectedFolder = folders.find((f) => f.id === folderId) ?? null
  const knuter = data?.knuter ?? []
  const searchTerm = search.trim().toLocaleLowerCase('nb-NO')
  const availableCount = knuter.filter((k) => k.myStatus === null).length
  const completedCount = knuter.length - availableCount
  const visibleKnuter = useMemo(() => {
    const pool = knuter.filter((k) =>
      view === 'available' ? k.myStatus === null : k.myStatus !== null,
    )
    if (!searchTerm) return pool

    return pool.filter((knute) => {
      const haystack = [
        knute.title,
        knute.description ?? '',
        DIFFICULTY_LABEL[knute.difficulty],
        formatNumber(knute.points),
      ]
        .join(' ')
        .toLocaleLowerCase('nb-NO')

      return haystack.includes(searchTerm)
    })
  }, [knuter, searchTerm, view])

  if (isLoading) return <LoadingState />
  // Only take over the whole screen when we have nothing to show. With keepPreviousData,
  // a failed folder switch keeps the previous list + chips on screen instead of trapping
  // the user on an error page with no way back to "Alle".
  if (error && !data)
    return <ErrorState message={(error as Error).message} onRetry={() => void refetch()} />

  const bottomPadding = insets.bottom + size.bottomNavMinHeight + spacing.xl

  // Distinguish: everything completed (celebrate!), nothing completed yet
  // (invite!), a genuinely empty folder, or a search that matched nothing.
  const isEmptyFolder = folderId !== null && !searchTerm && knuter.length === spacing.none
  const allCompleted =
    view === 'available' &&
    !searchTerm &&
    knuter.length > spacing.none &&
    visibleKnuter.length === spacing.none
  const noneCompleted =
    view === 'completed' && !searchTerm && visibleKnuter.length === spacing.none && !isEmptyFolder
  const emptyTitle = allCompleted
    ? 'Alt fullført ✓'
    : noneCompleted
      ? 'Ingenting fullført ennå'
      : isEmptyFolder
        ? 'Tom mappe'
        : 'Ingen treff'
  const emptyText = allCompleted
    ? 'Du har fullført alt her. Sterkt! Se samlingen under «Fullført».'
    : noneCompleted
      ? 'Knutene du fullfører havner her. Gå til «Tilgjengelige» og sett i gang!'
      : isEmptyFolder
        ? `Ingen knuter i «${selectedFolder?.name ?? 'mappa'}» ennå. Velg «Alle» for hele knuteboka.`
        : 'Prøv et annet søk, eller trykk Tilfeldig når listen har knuter igjen.'

  const openRandomKnute = () => {
    const randomKnute = visibleKnuter[Math.floor(Math.random() * visibleKnuter.length)]
    if (randomKnute) router.push(`/knute/${randomKnute.id}`)
  }

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.lg, paddingBottom: bottomPadding },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
            tintColor={sticker.color.ink}
          />
        }
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <Eyebrow>Knuteloop</Eyebrow>
          <Text
            font="display"
            weight="bold"
            style={styles.heading}
            accessibilityRole="header"
            accessibilityLabel="Hva tar du i dag?"
          >
            Hva tar du <Text font="display" weight="bold" style={[styles.heading, styles.headingHighlight]}>i dag?</Text>
          </Text>
          <View style={styles.countChip}>
            <CountUp value={knuter.length} suffix=" knuter" style={styles.countChipText} />
          </View>
        </View>

        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Søk etter knute..."
          placeholderTextColor={sticker.color.textMuted}
          selectionColor={sticker.color.accent}
          autoCorrect={false}
          returnKeyType="search"
          accessibilityRole="search"
          accessibilityLabel="Søk etter knute"
        />

        {folders.length > 0 ? (
          <FolderChips folders={folders} selected={folderId} onSelect={setFolderId} />
        ) : null}

        <View style={styles.segmented} accessibilityRole="tablist">
          <ViewSegment
            label="Tilgjengelige"
            count={availableCount}
            active={view === 'available'}
            onPress={() => setView('available')}
            hint="Viser knutene du kan ta nå."
          />
          <ViewSegment
            label="Fullført"
            count={completedCount}
            active={view === 'completed'}
            onPress={() => setView('completed')}
            hint="Viser knutene du har sendt inn eller fått godkjent."
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text weight="semibold" size="lg" color={sticker.color.ink}>
            {selectedFolder?.name ?? 'Alle knuter'}
          </Text>
          <Text size="sm" color={sticker.color.textMuted}>
            {formatNumber(visibleKnuter.length)}/
            {formatNumber(view === 'available' ? availableCount : completedCount)} synlig
          </Text>
        </View>

        <View style={styles.toolbar}>
          <StickerButton
            label="Tilfeldig"
            variant="secondary"
            size="sm"
            icon={<Shuffle size={sticker.icon.sm} color={sticker.color.ink} strokeWidth={2.5} />}
            onPress={openRandomKnute}
            disabled={visibleKnuter.length === spacing.none}
            accessibilityHint="Åpner en tilfeldig knute fra listen som vises."
          />
        </View>

        {visibleKnuter.length === spacing.none ? (
          <StickerCard tone="soft" radius="lg" shadow="sm">
            <View style={styles.emptyState}>
              <Text weight="bold" size="base" color={sticker.color.ink}>
                {emptyTitle}
              </Text>
              <Text size="sm" color={sticker.color.textMuted} style={styles.emptyText}>
                {emptyText}
              </Text>
            </View>
          </StickerCard>
        ) : (
          <View style={styles.list}>
            {visibleKnuter.map((knute, index) => (
              <Animated.View
                key={knute.id}
                entering={
                  reduceMotion
                    ? undefined
                    : FadeInDown.duration(animation.duration.base).delay(
                        Math.min(index, STAGGER_MAX_STEPS) * STAGGER_STEP_MS,
                      )
                }
              >
                <KnuteListCard
                  knute={knute}
                  difficultyLabel={DIFFICULTY_LABEL[knute.difficulty]}
                  onPress={() => router.push(`/knute/${knute.id}`)}
                />
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>
      <AppTabBar active="knuter" />
    </View>
  )
}

// One segment of the Tilgjengelige/Fullført control. The ACTIVE segment names
// what is on screen right now; both stay visible so the alternative is always
// one tap away (never a label that flips meaning under your finger).
function ViewSegment({
  label,
  count,
  active,
  onPress,
  hint,
}: {
  label: string
  count: number
  active: boolean
  onPress: () => void
  hint: string
}) {
  return (
    <Pressable
      onPress={onPress}
      haptic="selection"
      accessibilityRole="tab"
      accessibilityLabel={`${label}, ${formatNumber(count)} knuter`}
      accessibilityHint={hint}
      accessibilityState={{ selected: active }}
      style={[styles.segment, active ? styles.segmentActive : null]}
    >
      <Text
        size="sm"
        weight="bold"
        color={active ? sticker.color.textInverse : sticker.color.textSoft}
      >
        {label}
      </Text>
      <Text
        size="xs"
        weight="semibold"
        font="mono"
        color={active ? sticker.color.textInverse : sticker.color.textMuted}
      >
        {formatNumber(count)}
      </Text>
    </Pressable>
  )
}

function LoadingState() {
  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.loadingContent}>
        <Skeleton style={styles.skeletonHeading} />
        <Skeleton style={styles.skeletonSearch} />
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={styles.skeletonCard}>
            <Skeleton style={styles.skeletonRowTitle} />
            <Skeleton style={styles.skeletonRowMeta} />
          </View>
        ))}
      </View>
    </View>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.center}>
      <Stack.Screen options={{ headerShown: false }} />
      <StickerCard radius="lg" style={styles.errorCard}>
        <View style={styles.errorContent}>
          <Text weight="bold" size="lg" color={sticker.color.danger}>
            Kunne ikke laste knutene
          </Text>
          <Text size="sm" color={sticker.color.textMuted} style={styles.emptyText}>
            {message}
          </Text>
          <StickerButton label="Prøv igjen" variant="primary" onPress={onRetry} />
        </View>
      </StickerCard>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: sticker.color.paper,
  },
  scroll: {
    flex: 1,
    backgroundColor: sticker.color.paper,
  },
  content: {
    paddingHorizontal: spacing.base,
    gap: spacing.base,
  },
  hero: {
    gap: spacing.sm,
  },
  heading: {
    fontSize: fontSize['2xl'],
    lineHeight: fontSize['2xl'] * 1.1,
    color: sticker.color.ink,
  },
  headingHighlight: {
    backgroundColor: sticker.color.accent,
  },
  countChip: {
    alignSelf: 'flex-start',
    backgroundColor: sticker.color.ink,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: sticker.radius.full,
  },
  countChipText: {
    color: sticker.color.textInverse,
    fontSize: fontSize.xs,
    fontFamily: fontFamily.mono.semibold,
  },
  searchInput: {
    minHeight: size.searchMinHeight,
    borderWidth: sticker.borderWidth,
    borderColor: sticker.color.ink,
    borderRadius: sticker.radius.sm,
    backgroundColor: sticker.color.card,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    color: sticker.color.ink,
    fontSize: fontSize.base,
    fontFamily: fontFamily.sans.medium,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  segmented: {
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.xs,
    borderRadius: sticker.radius.full,
    borderWidth: sticker.borderWidth,
    borderColor: sticker.color.ink,
    backgroundColor: sticker.color.surfaceSoft,
  },
  segment: {
    flex: 1,
    minHeight: size.actionMinHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: sticker.radius.full,
  },
  segmentActive: {
    backgroundColor: sticker.color.primary,
  },
  list: {
    gap: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.xs,
  },
  emptyText: {
    textAlign: 'center',
  },
  loadingContent: {
    flex: 1,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xl,
    gap: spacing.base,
  },
  skeletonHeading: {
    width: size.skeletonTitleWidth,
    height: size.skeletonTitleHeight,
  },
  skeletonSearch: {
    minHeight: size.searchMinHeight,
    borderRadius: sticker.radius.sm,
  },
  skeletonCard: {
    backgroundColor: sticker.color.card,
    borderWidth: sticker.borderWidth,
    borderColor: sticker.color.ink,
    borderRadius: sticker.radius.md,
    padding: spacing.base,
    gap: spacing.sm,
  },
  skeletonRowTitle: {
    height: size.skeletonRowTitleHeight,
  },
  skeletonRowMeta: {
    width: size.skeletonTitleWidth,
    height: size.skeletonRowMetaHeight,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: sticker.color.paper,
  },
  errorCard: {
    alignSelf: 'stretch',
  },
  errorContent: {
    alignItems: 'center',
    gap: spacing.md,
  },
})
