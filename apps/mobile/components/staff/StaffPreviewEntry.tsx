import { useRouter } from 'expo-router'
import { Stack, StickerCard, Text } from '../primitives'
import { sticker } from '../../lib/theme'

export function StaffPreviewEntry() {
  const router = useRouter()
  if (!__DEV__) return null
  return (
    <StickerCard
      tone="soft"
      onPress={() => router.push('/superadmin-preview')}
      accessibilityRole="link"
      accessibilityLabel="Åpne superadmin-forhåndsvisningen"
      accessibilityHint="Prøv ansattverktøyene med eksempeldata."
    >
      <Stack gap="xs">
        <Text font="display" size="lg" weight="bold" color={sticker.color.ink}>Superadmin · forhåndsvisning</Text>
        <Text size="sm" color={sticker.color.textMuted}>For oss i Knuteloop. Prøv rapportkøen med eksempeldata.</Text>
        <Text size="sm" weight="semibold" color={sticker.color.primary}>Åpne forhåndsvisningen →</Text>
      </Stack>
    </StickerCard>
  )
}
