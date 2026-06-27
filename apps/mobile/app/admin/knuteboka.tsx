import { useState } from 'react'
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Stack, useRouter } from 'expo-router'
import { ChevronRight, Folder, FolderPlus, LibraryBig, Star } from 'lucide-react-native'
import {
  Eyebrow,
  KnoteIcon,
  Skeleton,
  StatTile,
  StickerButton,
  StickerCard,
  Text,
  Toast,
  useToast,
} from '../../components/primitives'
import { GlyphTile } from '../../components/knute/GlyphTile'
import {
  ApiError,
  createFolder,
  fetchAllKnuter,
  fetchFolders,
  type Folder as FolderType,
} from '../../lib/api'
import type { FolderIconKey } from '@knuteloop/shared'
import { CreateFolderSheet } from '../../components/folder/CreateFolderSheet'
import { folderIconFor } from '../../lib/folder-icons'
import { formatNumber } from '../../lib/format'
import { haptics } from '../../lib/haptics'
import { sticker, spacing } from '../../lib/theme'

export default function KnutebokaScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const qc = useQueryClient()
  const toast = useToast()
  const [creatingFolder, setCreatingFolder] = useState(false)

  const knuter = useQuery({ queryKey: ['knuter', 'all'], queryFn: fetchAllKnuter })
  const folders = useQuery({ queryKey: ['folders'], queryFn: fetchFolders })

  const createFolderMutation = useMutation({
    mutationFn: ({ name, icon }: { name: string; icon: FolderIconKey }) => createFolder(name, icon),
    onSuccess: () => {
      haptics.success()
      void qc.invalidateQueries({ queryKey: ['folders'] })
      setCreatingFolder(false)
      toast.show('Mappe opprettet ✓')
    },
    onError: (err) => toast.show((err as Error).message),
  })

  const sheetHeader = (
    <Stack.Screen
      options={{
        title: 'Knuteboka',
        headerStyle: { backgroundColor: sticker.color.paper },
        headerTintColor: sticker.color.ink,
        headerShadowVisible: false,
      }}
    />
  )

  if (knuter.isLoading || folders.isLoading) {
    return (
      <View style={styles.root}>
        {sheetHeader}
        <View style={[styles.gutter, styles.loadingList]}>
          <Skeleton style={styles.skeletonStats} />
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} style={styles.skeletonRow} />
          ))}
        </View>
      </View>
    )
  }

  // Handle a failure in EITHER query — a folders-only failure must not fall
  // through to a misleading "0 mapper / Ingen mapper ennå" empty state.
  if (knuter.isError || folders.isError) {
    const err = knuter.error ?? folders.error
    const isForbidden = err instanceof ApiError && err.status === 403
    const retry = () => {
      void knuter.refetch()
      void folders.refetch()
    }
    return (
      <View style={styles.root}>
        {sheetHeader}
        <View style={styles.center}>
          <StickerCard tone="surface" style={styles.errorCard}>
            <Text font="display" weight="bold" size="lg" color={sticker.color.ink}>
              {isForbidden ? 'Du må være knutesjef' : 'Kunne ikke laste'}
            </Text>
            <Text color={sticker.color.textMuted}>
              {isForbidden ? 'Denne siden er kun for knutesjefer.' : (err as Error).message}
            </Text>
            {!isForbidden ? (
              <StickerButton label="Prøv igjen" variant="secondary" size="sm" onPress={retry} />
            ) : null}
          </StickerCard>
        </View>
      </View>
    )
  }

  const active = (knuter.data?.knuter ?? []).filter((k) => k.isActive)
  const totalPoints = active.reduce((sum, k) => sum + k.points, 0)
  const folderList = folders.data?.folders ?? []

  return (
    <View style={styles.root}>
      {sheetHeader}
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing['2xl'] }}
        refreshControl={
          <RefreshControl
            refreshing={knuter.isRefetching || folders.isRefetching}
            onRefresh={() => {
              void knuter.refetch()
              void folders.refetch()
            }}
            tintColor={sticker.color.primary}
          />
        }
      >
        <View style={styles.headerBlock}>
          <Eyebrow>Knuteboka</Eyebrow>
          <Text font="display" weight="bold" size="3xl" color={sticker.color.ink}>
            Skolens mapper
          </Text>
          <Text color={sticker.color.textMuted}>Organiser knutene i mapper kullet kjenner igjen.</Text>
        </View>

        <View style={[styles.gutter, styles.stats]}>
          <StatTile
            tone="primary"
            value={formatNumber(active.length)}
            label="Knuter"
            style={styles.stat}
            icon={<KnoteIcon name="knute" size={22} color={sticker.color.textInverse} />}
          />
          <StatTile
            tone="accent"
            value={formatNumber(totalPoints)}
            label="Poeng"
            style={styles.stat}
            icon={<Star size={20} color={sticker.color.ink} strokeWidth={2} fill={sticker.color.ink} />}
          />
          <StatTile
            tone="surface"
            value={formatNumber(folderList.length)}
            label="Mapper"
            style={styles.stat}
            icon={<Folder size={20} color={sticker.color.primary} strokeWidth={2} />}
          />
        </View>

        <View style={styles.gutter}>
          <StickerCard
            tone="surface"
            radius="md"
            onPress={() => router.push('/admin/folder/alle')}
            accessibilityLabel={`Alle knuter, ${formatNumber(active.length)} knuter`}
          >
            <View style={styles.row}>
              <GlyphTile size={46} tone="accent">
                <LibraryBig size={24} color={sticker.color.accentStrong} strokeWidth={2} />
              </GlyphTile>
              <View style={styles.rowText}>
                <Text font="display" weight="bold" size="base" color={sticker.color.ink}>
                  Alle knuter
                </Text>
                <Text size="sm" color={sticker.color.textMuted}>
                  Hele knuteboka · {formatNumber(active.length)} knuter
                </Text>
              </View>
              <ChevronRight size={sticker.icon.md} color={sticker.color.textMuted} strokeWidth={2} />
            </View>
          </StickerCard>
        </View>

        <View style={styles.sectionHead}>
          <Text font="display" weight="bold" size="xl" color={sticker.color.ink}>
            Mappene dine
          </Text>
          <Text size="sm" color={sticker.color.textMuted}>{formatNumber(folderList.length)} mapper</Text>
        </View>

        {folderList.length === 0 ? (
          <View style={styles.gutter}>
            <StickerCard tone="soft" shadow="sm">
              <Text color={sticker.color.textMuted}>
                Ingen mapper ennå. Lag en, eller importer en pakke fra biblioteket — den lager mapper for deg.
              </Text>
            </StickerCard>
          </View>
        ) : (
          folderList.map((f) => (
            <FolderRow key={f.id} folder={f} onPress={() => router.push(`/admin/folder/${f.id}`)} />
          ))
        )}

        <View style={[styles.gutter, styles.actions]}>
          <StickerButton
            label="Ny mappe"
            variant="secondary"
            fullWidth
            icon={<FolderPlus size={sticker.icon.sm} color={sticker.color.ink} strokeWidth={2} />}
            onPress={() => setCreatingFolder(true)}
          />
          <StickerButton
            label="Lag egen knute"
            variant="accent"
            fullWidth
            onPress={() => router.push('/admin/edit/new')}
          />
          <StickerButton
            label="Finn flere i biblioteket"
            variant="ghost"
            fullWidth
            onPress={() => router.push('/admin/bibliotek')}
          />
        </View>
      </ScrollView>

      <CreateFolderSheet
        open={creatingFolder}
        creating={createFolderMutation.isPending}
        onClose={() => setCreatingFolder(false)}
        onCreate={(name, icon) => createFolderMutation.mutate({ name, icon })}
      />
      <Toast message={toast.message} bottomOffset={insets.bottom + spacing.lg} />
    </View>
  )
}

function FolderRow({ folder, onPress }: { folder: FolderType; onPress: () => void }) {
  const count = folder.knuteCount
  const sub = count === 0 ? 'Tom mappe' : `${formatNumber(count)} knuter`
  const FolderIcon = folderIconFor(folder.icon)
  return (
    <View style={styles.gutter}>
      <StickerCard
        tone="surface"
        radius="md"
        shadow="sm"
        onPress={onPress}
        style={styles.folderCard}
        accessibilityLabel={`${folder.name}, ${sub}`}
      >
        <View style={styles.row}>
          <GlyphTile size={44} tone="primary">
            <FolderIcon size={22} color={sticker.color.primary} strokeWidth={2} />
          </GlyphTile>
          <View style={styles.rowText}>
            <Text font="display" weight="bold" size="base" color={sticker.color.ink} numberOfLines={1}>
              {folder.name}
            </Text>
            <Text size="sm" color={sticker.color.textMuted}>{sub}</Text>
          </View>
          <ChevronRight size={sticker.icon.md} color={sticker.color.textMuted} strokeWidth={2} />
        </View>
      </StickerCard>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: sticker.color.paper },
  gutter: { paddingHorizontal: spacing.base },
  headerBlock: { paddingHorizontal: spacing.base, paddingTop: spacing.base, paddingBottom: spacing.base, gap: spacing['2xs'] },
  stats: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.base },
  stat: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowText: { flex: 1, gap: spacing['2xs'] },
  sectionHead: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing['2xs'],
  },
  folderCard: { marginBottom: spacing.sm },
  actions: { marginTop: spacing.lg, gap: spacing.sm },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.base },
  errorCard: { gap: spacing.sm, alignItems: 'flex-start' },
  loadingList: { paddingTop: spacing.lg, gap: spacing.sm },
  skeletonStats: { height: 90, borderRadius: sticker.radius.md, marginBottom: spacing.sm },
  skeletonRow: { height: 72, borderRadius: sticker.radius.md },
})
