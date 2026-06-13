import { ScrollView, StyleSheet, View } from 'react-native'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Stack as RouterStack, useRouter } from 'expo-router'
import { Button, Pressable, Stack, Text } from '../components/primitives'
import { fetchDevUsers, type DevUser } from '../lib/api'
import { getActiveUser, setActiveIdentity } from '../lib/auth'
import { borderWidth, colors, radius, spacing } from '../lib/theme'

// Dev-only identity switcher. Lists every seeded user (from the gated
// /api/dev/users) so you can act as a knutesjef or student at either school and
// test submit → approve → feed → leaderboard + tenant isolation, no restart.

const ROLE_LABEL: Record<DevUser['role'], string> = {
  student: 'russ',
  knutesjef: 'knutesjef',
  admin: 'admin',
}

export default function DevLoginScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const qc = useQueryClient()
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dev', 'users'],
    queryFn: fetchDevUsers,
  })
  const activeId = getActiveUser()?.userId

  const pick = (user: DevUser) => {
    setActiveIdentity(user.token, user)
    qc.clear() // every cached query belonged to the previous identity
    router.replace('/')
  }

  return (
    <View style={styles.root}>
      <RouterStack.Screen options={{ title: 'Bytt bruker (dev)' }} />
      <ScrollView
        contentContainerStyle={{
          padding: spacing.base,
          paddingTop: insets.top + spacing.base,
          paddingBottom: insets.bottom + spacing.xl,
          gap: spacing.lg,
        }}
      >
        <Text size="sm" color="muted">
          Kun for lokal testing. Velg hvem du vil opptre som — appen byttes umiddelbart.
        </Text>

        {isLoading ? (
          <Text color="muted">Laster brukere…</Text>
        ) : error ? (
          <Stack gap="sm" align="start">
            <Text color="error" weight="semibold">
              Kunne ikke hente dev-brukere
            </Text>
            <Text size="sm" color="muted">
              {(error as Error).message}
            </Text>
            <Button label="Prøv igjen" variant="secondary" onPress={() => void refetch()} />
          </Stack>
        ) : (
          groupBySchool(data?.users ?? []).map(([school, schoolUsers]) => (
            <Stack key={school} gap="sm">
              <Text size="lg" weight="bold">
                {school}
              </Text>
              {schoolUsers.map((u) => {
                const isActive = u.userId === activeId
                return (
                  <Pressable
                    key={u.userId}
                    onPress={() => pick(u)}
                    haptic="medium"
                    accessibilityLabel={`Logg inn som ${u.russenavn}, ${ROLE_LABEL[u.role]}, ${school}`}
                    style={[styles.card, isActive && styles.cardActive]}
                  >
                    <Stack gap="2xs">
                      <Text weight="semibold">
                        {u.russenavn}
                        {isActive ? '  ✓ aktiv' : ''}
                      </Text>
                      <Text size="xs" color="muted">
                        {ROLE_LABEL[u.role]}
                      </Text>
                    </Stack>
                  </Pressable>
                )
              })}
            </Stack>
          ))
        )}
      </ScrollView>
    </View>
  )
}

function groupBySchool(users: DevUser[]): [string, DevUser[]][] {
  const map = new Map<string, DevUser[]>()
  for (const u of users) {
    const list = map.get(u.schoolName) ?? []
    list.push(u)
    map.set(u.schoolName, list)
  }
  return [...map.entries()]
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  card: {
    backgroundColor: colors.surface,
    borderWidth: borderWidth.thin,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  cardActive: {
    borderColor: colors.brand.primary,
    borderWidth: borderWidth.medium,
  },
})
