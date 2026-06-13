import { useMemo, useState } from 'react'
import { View, ScrollView, StyleSheet, RefreshControl, TextInput } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Stack, useRouter } from 'expo-router'
import { AppTabBar } from '../components/AppTabBar'
import { Pressable, Text } from '../components/primitives'
import { fetchKnuter, type Knute } from '../lib/api'
import { formatNumber } from '../lib/format'
import {
  borderWidth,
  colors,
  fontSize,
  fontWeight,
  opacity,
  radius,
  size,
  spacing,
} from '../lib/theme'

const DIFFICULTY_LABEL: Record<Knute['difficulty'], string> = {
  Lett: 'Lett',
  Medium: 'Middels',
  Hard: 'Vanskelig',
  Valgfri: 'Valgfri',
}

export default function KnuterScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [search, setSearch] = useState('')

  const { data, error, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['knuter'],
    queryFn: fetchKnuter,
  })

  const knuter = data?.knuter ?? []
  const searchTerm = search.trim().toLocaleLowerCase('nb-NO')
  const visibleKnuter = useMemo(() => {
    if (!searchTerm) return knuter

    return knuter.filter((knute) => {
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
  }, [knuter, searchTerm])

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState message={(error as Error).message} onRetry={() => void refetch()} />

  const bottomPadding = insets.bottom + size.bottomNavMinHeight + spacing.xl

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
            tintColor={colors.ink}
          />
        }
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <Text style={styles.heading} accessibilityRole="header" accessibilityLabel="Hva tar du i dag?">
            Hva tar du <Text style={styles.headingHighlight}>i dag?</Text>
          </Text>
          <View style={styles.countChip}>
            <Text style={styles.countChipText}>{formatNumber(knuter.length)} knuter</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Alle knuter</Text>
          <Text style={styles.sectionMeta}>
            {formatNumber(visibleKnuter.length)}/{formatNumber(knuter.length)} synlig
          </Text>
        </View>

        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Søk etter knute..."
          placeholderTextColor={colors.knuter.muted}
          selectionColor={colors.accent.yellow}
          autoCorrect={false}
          returnKeyType="search"
          accessibilityRole="search"
          accessibilityLabel="Søk etter knute"
        />

        <View style={styles.toolbar}>
          <Pressable
            style={[styles.randomButton, visibleKnuter.length === spacing.none && styles.buttonDisabled]}
            onPress={openRandomKnute}
            disabled={visibleKnuter.length === spacing.none}
            accessibilityRole="button"
            accessibilityLabel="Velg en tilfeldig knute"
            accessibilityHint="Åpner en tilfeldig knute fra listen som vises."
            accessibilityState={{ disabled: visibleKnuter.length === spacing.none }}
          >
            <Text style={styles.randomIcon}>↝</Text>
            <Text style={styles.randomText}>Tilfeldig</Text>
          </Pressable>
          <View style={styles.sortPill} accessibilityLabel="Standard sortering">
            <Text style={styles.sortText}>Standard</Text>
          </View>
        </View>

        <View style={styles.listPanel}>
          {visibleKnuter.length === spacing.none ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Ingen treff</Text>
              <Text style={styles.emptyText}>
                Prøv et annet søk, eller trykk Tilfeldig når listen har knuter igjen.
              </Text>
            </View>
          ) : (
            visibleKnuter.map((knute, index) => (
              <KnuteRow
                key={knute.id}
                knute={knute}
                isLast={index === visibleKnuter.length - 1}
                onPress={() => router.push(`/knute/${knute.id}`)}
              />
            ))
          )}
        </View>
      </ScrollView>
      <AppTabBar active="knuter" />
    </View>
  )
}

function KnuteRow({
  knute,
  isLast,
  onPress,
}: {
  knute: Knute
  isLast: boolean
  onPress: () => void
}) {
  const difficulty = DIFFICULTY_LABEL[knute.difficulty]

  return (
    <Pressable
      style={[styles.knuteRow, isLast && styles.knuteRowLast]}
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={`Ta knute: ${knute.title}, ${formatNumber(knute.points)} poeng, ${difficulty}`}
      accessibilityHint="Åpner innsending for denne knuten."
    >
      <View style={styles.knuteTextBlock}>
        <Text style={styles.knuteTitle} numberOfLines={1}>
          {knute.title}
        </Text>
        <Text style={styles.knuteDifficulty}>{difficulty}</Text>
      </View>
      <View style={styles.pointsBadge}>
        <Text style={styles.pointsText}>{formatNumber(knute.points)} p</Text>
      </View>
      <View style={styles.takeButton}>
        <Text style={styles.takeButtonText}>Ta knute</Text>
      </View>
    </Pressable>
  )
}

function LoadingState() {
  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.loadingContent}>
        <View style={[styles.skeleton, styles.skeletonHeading]} />
        <View style={[styles.skeleton, styles.skeletonSearch]} />
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={styles.skeletonRow}>
            <View style={[styles.skeleton, styles.skeletonRowTitle]} />
            <View style={[styles.skeleton, styles.skeletonRowMeta]} />
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
      <Text style={styles.errorTitle}>Kunne ikke laste knutene</Text>
      <Text style={styles.muted}>{message}</Text>
      <Pressable
        style={styles.retryButton}
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel="Prøv igjen"
      >
        <Text style={styles.retryText}>Prøv igjen</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.knuter.canvas,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.knuter.canvas,
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
    fontWeight: fontWeight.bold,
    color: colors.ink,
  },
  headingHighlight: {
    backgroundColor: colors.accent.yellow,
    color: colors.ink,
  },
  countChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.ink,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  countChipText: {
    color: colors.text.inverse,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  sectionMeta: {
    color: colors.knuter.muted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  searchInput: {
    minHeight: size.searchMinHeight,
    borderWidth: borderWidth.thick,
    borderColor: colors.borderInk,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    color: colors.ink,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  randomButton: {
    minHeight: size.actionMinHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accent.yellow,
    borderWidth: borderWidth.thin,
    borderColor: colors.borderInk,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  randomIcon: {
    color: colors.ink,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  randomText: {
    color: colors.ink,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  sortPill: {
    minHeight: size.actionMinHeight,
    justifyContent: 'center',
    borderWidth: borderWidth.thin,
    borderColor: colors.borderStrong,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  sortText: {
    color: colors.ink,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  listPanel: {
    overflow: 'hidden',
    backgroundColor: colors.knuter.panel,
    borderWidth: borderWidth.medium,
    borderColor: colors.borderInk,
    borderRadius: radius.lg,
  },
  knuteRow: {
    minHeight: size.bottomNavMinHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: borderWidth.thin,
    borderBottomColor: colors.knuter.divider,
  },
  knuteRowLast: {
    borderBottomWidth: borderWidth.none,
  },
  knuteTextBlock: {
    flex: 1,
    minWidth: spacing.none,
    gap: spacing['2xs'],
  },
  knuteTitle: {
    color: colors.ink,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  knuteDifficulty: {
    color: colors.knuter.muted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  pointsBadge: {
    backgroundColor: colors.accent.yellow,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  pointsText: {
    color: colors.ink,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  takeButton: {
    minWidth: size.knuteActionMinWidth,
    minHeight: size.actionMinHeight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
  },
  takeButtonText: {
    color: colors.text.inverse,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xl,
    gap: spacing.xs,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  emptyText: {
    color: colors.knuter.muted,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  buttonDisabled: {
    opacity: opacity.disabled,
  },
  loadingContent: {
    flex: 1,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xl,
    gap: spacing.base,
  },
  skeleton: {
    backgroundColor: colors.knuter.divider,
    borderRadius: radius.md,
  },
  skeletonHeading: {
    width: size.skeletonTitleWidth,
    height: size.skeletonTitleHeight,
  },
  skeletonSearch: {
    minHeight: size.searchMinHeight,
    borderRadius: radius.full,
  },
  skeletonRow: {
    backgroundColor: colors.knuter.panel,
    borderWidth: borderWidth.medium,
    borderColor: colors.borderInk,
    borderRadius: radius.lg,
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
    backgroundColor: colors.knuter.canvas,
  },
  errorTitle: {
    color: colors.error,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  muted: {
    color: colors.knuter.muted,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.base,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.ink,
    borderRadius: radius.md,
  },
  retryText: {
    color: colors.text.inverse,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
})
