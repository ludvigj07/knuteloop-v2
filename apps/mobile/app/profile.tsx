import { type ReactNode, useState } from 'react'
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Stack as RouterStack, useRouter } from 'expo-router'
import { Check, GraduationCap } from 'lucide-react-native'
import { AppTabBar } from '../components/AppTabBar'
import { CategoryRing } from '../components/profile/CategoryRing'
import {
  Chip,
  CountUp,
  Eyebrow,
  type KnoteGlyph,
  Sheet,
  Skeleton,
  StickerButton,
  StickerCard,
  Text,
  Toast,
  useToast,
} from '../components/primitives'
import {
  fetchLeaderboard,
  fetchMe,
  fetchMyClasses,
  setMyClass,
  type KnuteCategory,
  type LeaderboardEntry,
  type MeResponse,
  type MySubmission,
  type RussType,
  type SchoolClass,
} from '../lib/api'
import { formatNumber, formatShortDate } from '../lib/format'
import { animation, size, spacing, sticker } from '../lib/theme'

const ROLE_LABEL: Record<string, string> = {
  student: 'russ',
  knutesjef: 'knutesjef',
  admin: 'admin',
}

const RUSS_TYPE_LABEL: Record<RussType, string> = {
  red: 'Rødruss',
  blue: 'Blåruss',
}

// The five folders → short display label, sticker accent colour, and the knot
// glyph shown on each ring. Colours are sticker tokens (semantic accents, never
// the russ-red brand mark, which is reserved for icon/splash).
const CATEGORY_META: Record<KnuteCategory, { label: string; color: string; glyph: KnoteGlyph }> = {
  Generelle: { label: 'Generelle', color: sticker.color.primary, glyph: 'generelle' },
  Dobbelknuter: { label: 'Dobbel', color: sticker.color.success, glyph: 'dobbel' },
  Alkoholknuter: { label: 'Alkohol', color: sticker.color.warning, glyph: 'alkohol' },
  Sexknuter: { label: 'Sex', color: sticker.color.danger, glyph: 'sex' },
  'Fordervett-knuter': { label: 'Rampestrek', color: sticker.color.gold, glyph: 'fordervett' },
}

const STATUS_META: Record<MySubmission['status'], { label: string; tone: 'success' | 'warning' | 'danger' }> = {
  approved: { label: 'Godkjent', tone: 'success' },
  pending: { label: 'Venter', tone: 'warning' },
  rejected: { label: 'Avvist', tone: 'danger' },
}

const STAGGER_STEP_MS = 60
const FIRST_INITIAL_LENGTH = 1
const MAX_OTHERS = 12

// Big mono numbers in flex:1 stat cards must shrink instead of clipping at
// 1.3×+ font scale (frontend.md §9) — same treatment as the StatTile primitive.
const FIT_NUMBER = { numberOfLines: 1, adjustsFontSizeToFit: true, minimumFontScale: 0.6 } as const

export default function ProfileScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const reduceMotion = useReducedMotion()
  const qc = useQueryClient()
  const toast = useToast()
  const [classSheetOpen, setClassSheetOpen] = useState(false)

  const meQuery = useQuery({ queryKey: ['me'], queryFn: fetchMe })
  // Rank isn't on /api/me — derive it from the (school-scoped, cached) leaderboard.
  const leaderboardQuery = useQuery({ queryKey: ['leaderboard'], queryFn: fetchLeaderboard })
  // The class list is only needed when the picker opens — fetch it lazily.
  const classesQuery = useQuery({
    queryKey: ['me', 'classes'],
    queryFn: fetchMyClasses,
    enabled: classSheetOpen,
  })

  const setClass = useMutation({
    mutationFn: setMyClass,
    onSuccess: (res) => {
      // The claim changes both the profile (className) and every leaderboard
      // view («Klassen min» / «Klassekamp»), so invalidate both.
      void qc.invalidateQueries({ queryKey: ['me'] })
      void qc.invalidateQueries({ queryKey: ['leaderboard'] })
      setClassSheetOpen(false)
      toast.show(res.className ? `Klasse satt til ${res.className}` : 'Klassevalg fjernet')
    },
    onError: (e) => toast.show((e as Error).message),
  })

  if (meQuery.isLoading) return <ProfileSkeleton />

  if (meQuery.error || !meQuery.data) {
    return (
      <Screen>
        <View style={styles.centerFill}>
          <StickerCard radius="lg" style={styles.errorCard}>
            <View style={styles.errorInner}>
              <Text weight="bold" size="lg" color={sticker.color.danger}>
                Kunne ikke laste profilen
              </Text>
              <Text size="sm" color={sticker.color.textMuted} align="center">
                {(meQuery.error as Error | undefined)?.message ?? 'Ukjent feil'}
              </Text>
              <StickerButton label="Prøv igjen" variant="primary" onPress={() => void meQuery.refetch()} />
            </View>
          </StickerCard>
        </View>
      </Screen>
    )
  }

  const { user, submissions, completedCount, goldCount, streak, categories } = meQuery.data
  const myEntry = leaderboardQuery.data?.leaderboard.find((e) => e.isCurrentUser)
  const totalRanked = leaderboardQuery.data?.leaderboard.length ?? 0
  const others = (leaderboardQuery.data?.leaderboard ?? [])
    .filter((e) => !e.isCurrentUser)
    .slice(0, MAX_OTHERS)

  // Each section fades + slides in just below the previous one (capped delay).
  const section = (index: number) =>
    reduceMotion ? undefined : FadeInDown.duration(animation.duration.base).delay(index * STAGGER_STEP_MS)

  return (
    <Screen>
      <ScrollView
        style={styles.fill}
        contentContainerStyle={{
          paddingTop: insets.top + spacing.lg,
          paddingBottom: insets.bottom + size.bottomNavMinHeight + spacing.xl,
        }}
        refreshControl={
          <RefreshControl
            refreshing={meQuery.isRefetching}
            onRefresh={() => void meQuery.refetch()}
            tintColor={sticker.color.ink}
          />
        }
      >
        <Animated.View entering={section(0)}>
          <IdentityCard user={user} />
        </Animated.View>

        <Animated.View entering={section(1)}>
          <StatTrio streak={streak} points={user.points} rank={myEntry?.rank ?? null} totalRanked={totalRanked} />
        </Animated.View>

        <Animated.View entering={section(2)}>
          <ClassCard className={user.className} onOpen={() => setClassSheetOpen(true)} />
        </Animated.View>

        <Animated.View entering={section(3)}>
          <CategorySection categories={categories} completedCount={completedCount} goldCount={goldCount} />
        </Animated.View>

        {others.length > 0 ? (
          <Animated.View entering={section(4)}>
            <OthersRow others={others} />
          </Animated.View>
        ) : null}

        <Animated.View entering={section(5)}>
          <SectionHeading>Siste innsendinger</SectionHeading>
        </Animated.View>
        {submissions.length === 0 ? (
          <StickerCard tone="soft" radius="lg" shadow="sm" style={styles.blockWrap}>
            <View style={styles.emptyInner}>
              <Text size="sm" color={sticker.color.textMuted}>
                Ingen innsendinger ennå.
              </Text>
            </View>
          </StickerCard>
        ) : (
          submissions.map((s) => <SubmissionRow key={s.id} submission={s} />)
        )}

        {__DEV__ ? (
          <View style={styles.devRow}>
            <StickerButton
              label="Bytt bruker (dev)"
              variant="ghost"
              fullWidth
              onPress={() => router.push('/dev-login')}
            />
          </View>
        ) : null}
      </ScrollView>

      <ClassPickerSheet
        open={classSheetOpen}
        onClose={() => setClassSheetOpen(false)}
        classes={classesQuery.data?.classes ?? []}
        isLoading={classesQuery.isLoading}
        currentClassId={user.classId}
        onSelect={(classId) => {
          // Re-selecting the current class is a no-op — just close.
          if (classId === user.classId) {
            setClassSheetOpen(false)
            return
          }
          setClass.mutate(classId)
        }}
        pending={setClass.isPending}
      />

      <AppTabBar active="profil" />
      <Toast message={toast.message} bottomOffset={insets.bottom + size.bottomNavMinHeight} />
    </Screen>
  )
}

function Screen({ children }: { children: ReactNode }) {
  return (
    <View style={styles.root}>
      <RouterStack.Screen options={{ headerShown: false }} />
      {children}
    </View>
  )
}

function IdentityCard({ user }: { user: MeResponse['user'] }) {
  const isLead = user.role === 'knutesjef' || user.role === 'admin'
  return (
    <View style={styles.blockWrap}>
      <StickerCard radius="lg" shadow="base">
        <View style={styles.heroInner}>
          <View style={styles.avatar}>
            <Text font="display" size="3xl" weight="bold" color={sticker.color.textInverse}>
              {user.russenavn.slice(0, FIRST_INITIAL_LENGTH).toLocaleUpperCase('nb-NO')}
            </Text>
          </View>
          <Text font="display" size="2xl" weight="bold" color={sticker.color.ink} align="center" accessibilityRole="header">
            {user.russenavn}
          </Text>
          <View style={styles.chipRow}>
            <Chip label={ROLE_LABEL[user.role] ?? user.role} tone={isLead ? 'primary' : 'neutral'} />
            <Chip label={RUSS_TYPE_LABEL[user.russType]} tone="neutral" />
          </View>
          {user.quote ? (
            <View style={styles.quoteBubble}>
              <Text size="sm" color={sticker.color.textMuted} align="center">
                {`“${user.quote}”`}
              </Text>
            </View>
          ) : null}
        </View>
      </StickerCard>
    </View>
  )
}

function StatTrio({
  streak,
  points,
  rank,
  totalRanked,
}: {
  streak: number
  points: number
  rank: number | null
  totalRanked: number
}) {
  return (
    <View style={styles.statRow}>
      <StatCard
        value={<CountUp value={streak} font="mono" size="2xl" weight="bold" color={sticker.color.warning} {...FIT_NUMBER} />}
        label="dagers streak"
        accessibilityLabel={`Streak: ${streak} dager`}
      />
      <StatCard
        value={<CountUp value={points} font="mono" size="2xl" weight="bold" color={sticker.color.primary} {...FIT_NUMBER} />}
        label="poeng"
        accessibilityLabel={`${formatNumber(points)} poeng`}
      />
      <StatCard
        value={
          rank != null ? (
            <CountUp value={rank} prefix="#" font="mono" size="2xl" weight="bold" color={sticker.color.ink} {...FIT_NUMBER} />
          ) : (
            <Text font="mono" size="2xl" weight="bold" color={sticker.color.textMuted}>
              –
            </Text>
          )
        }
        label={rank != null ? `av ${formatNumber(totalRanked)}` : 'plass'}
        accessibilityLabel={rank != null ? `Plass nummer ${rank} av ${totalRanked}` : 'Plass ukjent'}
      />
    </View>
  )
}

function StatCard({
  value,
  label,
  accessibilityLabel,
}: {
  value: ReactNode
  label: string
  accessibilityLabel: string
}) {
  return (
    <StickerCard radius="md" shadow="sm" padding="md" style={styles.statCard}>
      <View style={styles.statInner} accessible accessibilityLabel={accessibilityLabel}>
        {value}
        <Text size="xs" weight="semibold" color={sticker.color.textMuted} align="center">
          {label}
        </Text>
      </View>
    </StickerCard>
  )
}

// The «Velg klasse» card — the one accent (loud) moment on the screen when the
// russ hasn't picked a class yet; quiet «Bytt» once they have.
function ClassCard({ className, onOpen }: { className: string | null; onOpen: () => void }) {
  const chosen = className != null
  return (
    <View style={styles.blockWrap}>
      <StickerCard radius="lg" shadow="base">
        <View style={styles.classInner}>
          <View style={styles.classText}>
            <Eyebrow>Klasse</Eyebrow>
            <Text font="display" size="lg" weight="bold" color={chosen ? sticker.color.ink : sticker.color.textMuted}>
              {className ?? 'Ikke valgt ennå'}
            </Text>
            {!chosen ? (
              <Text size="xs" color={sticker.color.textMuted}>
                Velg klassen din for å bli med i Klassekamp.
              </Text>
            ) : null}
          </View>
          <StickerButton
            label={chosen ? 'Bytt' : 'Velg klasse'}
            variant={chosen ? 'secondary' : 'accent'}
            size="sm"
            icon={<GraduationCap size={sticker.icon.sm} color={sticker.color.ink} strokeWidth={2.2} />}
            onPress={onOpen}
            accessibilityHint="Åpner listen over klasser."
          />
        </View>
      </StickerCard>
    </View>
  )
}

function ClassPickerSheet({
  open,
  onClose,
  classes,
  isLoading,
  currentClassId,
  onSelect,
  pending,
}: {
  open: boolean
  onClose: () => void
  classes: SchoolClass[]
  isLoading: boolean
  currentClassId: string | null
  onSelect: (classId: string | null) => void
  pending: boolean
}) {
  return (
    <Sheet open={open} onClose={onClose}>
      <View style={styles.sheetContent}>
        <Text font="display" size="xl" weight="bold" color={sticker.color.ink}>
          Velg klasse
        </Text>
        <Text size="sm" color={sticker.color.textMuted}>
          Klassen din brukes i «Klassen min» og «Klassekamp» på topplista.
        </Text>

        {isLoading ? (
          <View style={styles.classList}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} style={styles.classOptionSkeleton} />
            ))}
          </View>
        ) : classes.length === 0 ? (
          <View style={styles.emptyInner}>
            <Text size="sm" color={sticker.color.textMuted} align="center">
              Ingen klasser er opprettet ennå. Knutesjefen din legger dem inn.
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.classScroll} contentContainerStyle={styles.classList}>
            {classes.map((cls) => (
              <ClassOption
                key={cls.id}
                label={cls.name}
                selected={cls.id === currentClassId}
                disabled={pending}
                onPress={() => onSelect(cls.id)}
              />
            ))}
            {currentClassId != null ? (
              <ClassOption
                label="Ingen klasse"
                selected={false}
                disabled={pending}
                onPress={() => onSelect(null)}
              />
            ) : null}
          </ScrollView>
        )}
      </View>
    </Sheet>
  )
}

function ClassOption({
  label,
  selected,
  disabled,
  onPress,
}: {
  label: string
  selected: boolean
  disabled: boolean
  onPress: () => void
}) {
  return (
    <StickerCard
      tone={selected ? 'primary' : 'soft'}
      radius="md"
      shadow="sm"
      padding="md"
      onPress={onPress}
      disabled={disabled}
      haptic="selection"
      accessibilityLabel={label}
      accessibilitySelected={selected}
      accessibilityHint={selected ? undefined : 'Velg denne klassen.'}
    >
      <View style={styles.classOptionInner}>
        <Text
          font="display"
          weight="bold"
          size="base"
          color={selected ? sticker.color.textInverse : sticker.color.ink}
        >
          {label}
        </Text>
        {selected ? <Check size={sticker.icon.md} color={sticker.color.textInverse} strokeWidth={2.5} /> : null}
      </View>
    </StickerCard>
  )
}

function CategorySection({
  categories,
  completedCount,
  goldCount,
}: {
  categories: MeResponse['categories']
  completedCount: number
  goldCount: number
}) {
  return (
    <View>
      <SectionHeading>Knote-kategorier</SectionHeading>
      <View style={styles.blockWrap}>
        <StickerCard radius="lg" shadow="base">
          <View style={styles.ringGrid}>
            {categories.map((ring) => {
              const meta = CATEGORY_META[ring.category]
              return (
                <CategoryRing
                  key={ring.category}
                  label={meta.label}
                  completed={ring.completed}
                  total={ring.total}
                  color={meta.color}
                  glyph={meta.glyph}
                />
              )
            })}
          </View>
        </StickerCard>
      </View>
      <View style={styles.statRow}>
        <StatCard
          value={<CountUp value={completedCount} font="mono" size="xl" weight="bold" color={sticker.color.ink} {...FIT_NUMBER} />}
          label="knuter fullført"
          accessibilityLabel={`${completedCount} knuter fullført`}
        />
        <StatCard
          value={<CountUp value={goldCount} font="mono" size="xl" weight="bold" color={sticker.color.gold} {...FIT_NUMBER} />}
          label="gull-knuter"
          accessibilityLabel={`${goldCount} gull-knuter`}
        />
      </View>
    </View>
  )
}

function OthersRow({ others }: { others: LeaderboardEntry[] }) {
  return (
    <View>
      <SectionHeading>Andre på appen</SectionHeading>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.othersContent}>
        {others.map((entry) => (
          <View
            key={entry.userId}
            style={styles.otherCard}
            accessible
            accessibilityLabel={`${entry.russenavn}, plass nummer ${entry.rank}`}
          >
            <View style={styles.otherAvatar}>
              <Text font="display" size="lg" weight="bold" color={sticker.color.textSoft}>
                {entry.russenavn.slice(0, FIRST_INITIAL_LENGTH).toLocaleUpperCase('nb-NO')}
              </Text>
            </View>
            <Text size="xs" weight="semibold" numberOfLines={1} align="center" color={sticker.color.ink}>
              {entry.russenavn}
            </Text>
            <Text font="mono" size="xs" color={sticker.color.textMuted}>
              #{formatNumber(entry.rank)}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <Text font="display" size="lg" weight="bold" color={sticker.color.ink} style={styles.sectionHeading}>
      {children}
    </Text>
  )
}

function SubmissionRow({ submission }: { submission: MySubmission }) {
  const meta = STATUS_META[submission.status]
  return (
    <StickerCard radius="md" shadow="sm" padding="md" style={styles.subRow}>
      <View style={styles.subInner}>
        <View style={styles.subText}>
          <Text size="base" weight="semibold" color={sticker.color.ink} numberOfLines={2}>
            {submission.knuteTitle}
          </Text>
          <Text font="mono" size="xs" color={sticker.color.textMuted}>
            {formatShortDate(submission.createdAt)} · {formatNumber(submission.knutePoints)} p
          </Text>
        </View>
        <Chip label={meta.label} tone={meta.tone} />
      </View>
    </StickerCard>
  )
}

function ProfileSkeleton() {
  return (
    <Screen>
      <View style={styles.skeletonWrap}>
        <Skeleton style={styles.skeletonHero} />
        <View style={styles.statRow}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} style={styles.skeletonStat} />
          ))}
        </View>
        <Skeleton style={styles.skeletonBlock} />
        <Skeleton style={styles.skeletonBlock} />
      </View>
    </Screen>
  )
}

const H_PAD = spacing.base

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: sticker.color.paper },
  fill: { flex: 1 },
  centerFill: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  errorCard: { alignSelf: 'stretch' },
  errorInner: { alignItems: 'center', gap: spacing.md },
  // Every top-level block shares the same horizontal inset + vertical rhythm.
  blockWrap: { paddingHorizontal: H_PAD, marginTop: spacing.sm },
  heroInner: { alignItems: 'center', gap: spacing.sm },
  avatar: {
    width: size.profileAvatar,
    height: size.profileAvatar,
    borderRadius: sticker.radius.full,
    borderWidth: sticker.borderWidth,
    borderColor: sticker.color.ink,
    backgroundColor: sticker.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipRow: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap', justifyContent: 'center' },
  quoteBubble: {
    marginTop: spacing.xs,
    alignSelf: 'stretch',
    backgroundColor: sticker.color.surfaceSoft,
    borderRadius: sticker.radius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  statRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: H_PAD, marginTop: spacing.sm },
  statCard: { flex: 1 },
  statInner: { alignItems: 'center', gap: spacing['2xs'] },
  classInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  classText: { flex: 1, minWidth: spacing.none, gap: spacing['2xs'] },
  sectionHeading: { marginHorizontal: H_PAD, marginTop: spacing.lg, marginBottom: spacing.xs },
  ringGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.base,
  },
  othersContent: { gap: spacing.sm, paddingHorizontal: H_PAD, paddingVertical: spacing.xs },
  otherCard: { width: size.controlHeightLg, alignItems: 'center', gap: spacing.xs },
  otherAvatar: {
    width: size.otherAvatar,
    height: size.otherAvatar,
    borderRadius: sticker.radius.full,
    borderWidth: sticker.borderWidth,
    borderColor: sticker.color.ink,
    backgroundColor: sticker.color.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subRow: { marginHorizontal: H_PAD, marginTop: spacing.sm },
  subInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  subText: { flex: 1, minWidth: spacing.none, gap: spacing['2xs'] },
  emptyInner: { alignItems: 'center', paddingVertical: spacing.lg },
  devRow: { paddingHorizontal: H_PAD, marginTop: spacing.lg },
  // Sheet
  sheetContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.sm },
  classScroll: { maxHeight: size.emptyMinHeight * 1.4 },
  classList: { gap: spacing.sm, paddingTop: spacing.xs, paddingBottom: spacing.sm },
  classOptionInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  classOptionSkeleton: { height: size.controlHeightLg, borderRadius: sticker.radius.md },
  // Skeleton
  skeletonWrap: { flex: 1, paddingHorizontal: H_PAD, paddingTop: spacing.xl, gap: spacing.base },
  skeletonHero: { height: size.emptyMinHeight, borderRadius: sticker.radius.lg },
  skeletonStat: { flex: 1, height: size.controlHeightLg * 1.4, borderRadius: sticker.radius.md },
  skeletonBlock: { height: size.emptyMinHeight, borderRadius: sticker.radius.lg },
})
