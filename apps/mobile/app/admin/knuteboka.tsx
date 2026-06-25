import { useState } from 'react'
import { View, ScrollView, StyleSheet, TextInput, Alert, RefreshControl } from 'react-native'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Stack, useRouter } from 'expo-router'
import { Button, Pressable, Sheet, Skeleton, Text } from '../../components/primitives'
import { FolderRow } from '../../components/library/folderUi'
import { createFolder, fetchFolders } from '../../lib/api'
import { haptics } from '../../lib/haptics'
import { borderWidth, colors, fontSize, fontWeight, radius, size, spacing } from '../../lib/theme'

const MAX_FOLDER_NAME = 100

export default function KnutebokaScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const qc = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)

  const folders = useQuery({ queryKey: ['folders'], queryFn: fetchFolders })

  const create = useMutation({
    mutationFn: createFolder,
    onSuccess: () => {
      haptics.success()
      setCreateOpen(false)
      void qc.invalidateQueries({ queryKey: ['folders'] })
    },
    onError: (err) => Alert.alert('Kunne ikke lage mappa', (err as Error).message),
  })

  const list = folders.data?.folders ?? []
  const bottomPadding = insets.bottom + spacing.xl

  return (
    <>
      <Stack.Screen options={{ title: 'Knuteboka' }} />
      <View style={styles.root}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: bottomPadding }}
          refreshControl={
            <RefreshControl
              refreshing={folders.isRefetching}
              onRefresh={() => void folders.refetch()}
              tintColor={colors.brand.primary}
            />
          }
        >
          <View style={styles.header}>
            <Text style={styles.heading}>Knuteboka</Text>
            <Text style={styles.muted}>
              Skolens mapper. Importerte knuter havner her — sorter dem som du vil.
            </Text>
          </View>

          {folders.isLoading ? (
            <View style={styles.list}>
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} style={styles.skeletonRow} />
              ))}
            </View>
          ) : folders.error ? (
            <View style={styles.center}>
              <Text style={styles.errorTitle}>Kunne ikke laste mappene</Text>
              <Text style={styles.muted}>{(folders.error as Error).message}</Text>
              <Pressable
                style={styles.retryButton}
                onPress={() => void folders.refetch()}
                accessibilityRole="button"
                accessibilityLabel="Prøv igjen"
              >
                <Text style={styles.retryText}>Prøv igjen</Text>
              </Pressable>
            </View>
          ) : list.length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.muted}>
                Ingen mapper ennå. Lag én, eller importer en pakke fra biblioteket.
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {list.map((folder) => (
                <FolderRow
                  key={folder.id}
                  folder={folder}
                  onPress={() =>
                    router.push({ pathname: '/admin/folder/[id]', params: { id: folder.id, name: folder.name } })
                  }
                />
              ))}
            </View>
          )}

          <View style={styles.actions}>
            <Button
              label="Ny mappe"
              onPress={() => setCreateOpen(true)}
              variant="secondary"
              fullWidth
              accessibilityHint="Åpner skjema for å lage en ny mappe."
            />
            <Button
              label="Finn flere i biblioteket"
              onPress={() => router.push('/admin/bibliotek')}
              variant="ghost"
              fullWidth
              accessibilityHint="Åpner biblioteket for å importere ferdige knuter."
            />
          </View>
        </ScrollView>
      </View>

      <CreateFolderSheet
        visible={createOpen}
        creating={create.isPending}
        onClose={() => setCreateOpen(false)}
        onCreate={(name) => create.mutate(name)}
      />
    </>
  )
}

function CreateFolderSheet({
  visible,
  creating,
  onClose,
  onCreate,
}: {
  visible: boolean
  creating: boolean
  onClose: () => void
  onCreate: (name: string) => void
}) {
  const [name, setName] = useState('')
  const trimmed = name.trim()
  const valid = trimmed.length > 0 && trimmed.length <= MAX_FOLDER_NAME

  return (
    <Sheet
      visible={visible}
      onClose={() => {
        setName('')
        onClose()
      }}
      accessibilityLabel="Lag ny mappe"
    >
      <Text size="xl" weight="bold" accessibilityRole="header">
        Ny mappe
      </Text>
      <Text size="sm" color="muted" style={styles.sheetLede}>
        Gi mappa et navn, f.eks. «Fadderuka» eller «Klassiske».
      </Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Navn på mappa"
        placeholderTextColor={colors.text.muted}
        maxLength={MAX_FOLDER_NAME}
        autoFocus
        accessibilityLabel="Navn på mappa"
        returnKeyType="done"
        onSubmitEditing={() => valid && onCreate(trimmed)}
      />
      <View style={styles.sheetAction}>
        <Button
          label={creating ? 'Lager…' : 'Opprett mappe'}
          onPress={() => onCreate(trimmed)}
          variant="secondary"
          loading={creating}
          disabled={!valid}
          fullWidth
        />
      </View>
    </Sheet>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.base, paddingTop: spacing.base, paddingBottom: spacing.sm },
  heading: {
    color: colors.text.primary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.xs,
  },
  muted: { color: colors.text.muted, fontSize: fontSize.sm, marginTop: spacing['2xs'] },
  list: { paddingHorizontal: spacing.base, gap: spacing.sm },
  skeletonRow: { height: size.controlHeightLg, borderRadius: radius.md },
  actions: { paddingHorizontal: spacing.base, paddingTop: spacing.lg, gap: spacing.sm },
  sheetLede: { marginTop: spacing['2xs'], marginBottom: spacing.base },
  input: {
    minHeight: size.searchMinHeight,
    backgroundColor: colors.surface,
    borderWidth: borderWidth.thin,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.base,
    color: colors.text.primary,
    fontSize: fontSize.base,
  },
  sheetAction: { marginTop: spacing.base },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    minHeight: size.emptyMinHeight,
  },
  errorTitle: {
    color: colors.error,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  retryButton: {
    marginTop: spacing.base,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.brand.primary,
    borderRadius: radius.md,
  },
  retryText: { color: colors.text.inverse, fontSize: fontSize.base, fontWeight: fontWeight.semibold },
})
