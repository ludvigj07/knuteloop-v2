import { Alert, StyleSheet, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { Skeleton, StickerButton, StickerCard, Text, Toast, useToast } from '../../../components/primitives'
import { SchoolKnuteRow } from '../../../components/knute/SchoolKnuteRow'
import {
  deleteFolder,
  fetchAllKnuter,
  fetchFolders,
  fetchKnuterByFolder,
  removeKnuteFromFolder,
} from '../../../lib/api'
import { haptics } from '../../../lib/haptics'
import { sticker, spacing } from '../../../lib/theme'

export default function FolderViewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const folderId = id ?? ''
  const isAll = folderId === 'alle'
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const qc = useQueryClient()
  const toast = useToast()

  const folders = useQuery({ queryKey: ['folders'], queryFn: fetchFolders, enabled: !isAll })
  const knuter = useQuery({
    queryKey: isAll ? ['knuter', 'all'] : ['knuter', 'folder', folderId],
    queryFn: isAll ? fetchAllKnuter : () => fetchKnuterByFolder(folderId),
  })

  const folderName = isAll
    ? 'Alle knuter'
    : (folders.data?.folders.find((f) => f.id === folderId)?.name ?? 'Mappe')

  const removeMutation = useMutation({
    mutationFn: (knuteId: string) => removeKnuteFromFolder(folderId, knuteId),
    onSuccess: () => {
      haptics.success()
      void qc.invalidateQueries({ queryKey: ['knuter'] })
      void qc.invalidateQueries({ queryKey: ['folders'] })
      toast.show('Fjernet fra mappa')
    },
    onError: (err) => toast.show((err as Error).message),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteFolder(folderId),
    onSuccess: () => {
      haptics.success()
      void qc.invalidateQueries({ queryKey: ['folders'] })
      void qc.invalidateQueries({ queryKey: ['knuter'] })
      router.back()
    },
    onError: (err) => toast.show((err as Error).message),
  })

  const confirmDelete = () => {
    Alert.alert(
      `Slette «${folderName}»?`,
      'Mappa forsvinner, men knutene blir liggende i skolens liste.',
      [
        { text: 'Avbryt', style: 'cancel' },
        { text: 'Slett mappe', style: 'destructive', onPress: () => deleteMutation.mutate() },
      ],
    )
  }

  const screen = (
    <Stack.Screen
      options={{
        title: folderName,
        headerStyle: { backgroundColor: sticker.color.paper },
        headerTintColor: sticker.color.ink,
        headerShadowVisible: false,
      }}
    />
  )

  const items = knuter.data?.knuter ?? []

  const footer = (
    <View style={[styles.gutter, styles.actions]}>
      <StickerButton
        label="Legg til flere fra biblioteket"
        variant="secondary"
        fullWidth
        onPress={() => router.push('/admin/bibliotek')}
      />
      {!isAll ? (
        <StickerButton label="Slett mappe" variant="ghost" fullWidth onPress={confirmDelete} />
      ) : null}
    </View>
  )

  return (
    <View style={styles.root}>
      {screen}
      <FlashList
        data={items}
        keyExtractor={(k) => k.id}
        estimatedItemSize={84}
        contentContainerStyle={{ paddingTop: spacing.base, paddingBottom: insets.bottom + spacing.xl }}
        ListEmptyComponent={
          <EmptyOrLoading
            isLoading={knuter.isLoading}
            isError={knuter.isError}
            error={knuter.error}
            isAll={isAll}
            onRetry={() => void knuter.refetch()}
          />
        }
        ListFooterComponent={items.length > 0 ? footer : null}
        renderItem={({ item }) => (
          <SchoolKnuteRow
            knute={item}
            inactive={!item.isActive}
            onPress={() => router.push(`/admin/edit/${item.id}`)}
            onRemove={isAll ? undefined : () => removeMutation.mutate(item.id)}
            removing={removeMutation.isPending && removeMutation.variables === item.id}
          />
        )}
      />
      <Toast message={toast.message} bottomOffset={insets.bottom + spacing.lg} />
    </View>
  )
}

function EmptyOrLoading({
  isLoading,
  isError,
  error,
  isAll,
  onRetry,
}: {
  isLoading: boolean
  isError: boolean
  error: unknown
  isAll: boolean
  onRetry: () => void
}) {
  if (isLoading) {
    return (
      <View style={[styles.gutter, styles.loadingList]}>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} style={styles.skeletonRow} />
        ))}
      </View>
    )
  }
  if (isError) {
    return (
      <View style={styles.gutter}>
        <StickerCard tone="surface" style={styles.errorCard}>
          <Text font="display" weight="bold" size="lg" color={sticker.color.ink}>
            Kunne ikke laste
          </Text>
          <Text color={sticker.color.textMuted}>{(error as Error).message}</Text>
          <StickerButton label="Prøv igjen" variant="secondary" size="sm" onPress={onRetry} />
        </StickerCard>
      </View>
    )
  }
  return (
    <View style={styles.gutter}>
      <StickerCard tone="soft" shadow="sm">
        <Text color={sticker.color.textMuted}>
          {isAll
            ? 'Ingen knuter ennå. Lag en egen eller importer fra biblioteket.'
            : 'Tom mappe. Legg til knuter fra biblioteket.'}
        </Text>
      </StickerCard>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: sticker.color.paper },
  gutter: { paddingHorizontal: spacing.base },
  actions: { marginTop: spacing.lg, gap: spacing.sm },
  loadingList: { gap: spacing.sm },
  skeletonRow: { height: 76, borderRadius: sticker.radius.md, marginBottom: spacing.sm },
  errorCard: { gap: spacing.sm, alignItems: 'flex-start' },
})
