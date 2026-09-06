import { StyleSheet } from 'react-native'
import { ArrowRight, CheckCheck, ShieldCheck } from 'lucide-react-native'
import { Stack, StickerButton, StickerCard, Text } from '../primitives'
import { formatNumber } from '../../lib/format'
import { size, spacing, sticker } from '../../lib/theme'
import type { StaffReport } from './staff-preview-data'

export function StaffOverview({
  reports,
  onOpenQueue,
  onOpenReport,
}: {
  reports: StaffReport[]
  onOpenQueue: () => void
  onOpenReport: (id: string) => void
}) {
  const pending = reports.filter((report) => !report.decision)
    .sort((a, b) => Number(b.urgent) - Number(a.urgent) || a.receivedAt.localeCompare(b.receivedAt))
  const urgent = pending.filter((report) => report.urgent)
  const next = urgent[0] ?? pending[0]

  return (
    <Stack gap="lg">
      <StickerCard tone="primary">
        <Stack gap="base">
          <ShieldCheck size={sticker.icon.lg} color={sticker.color.textInverse} />
          <Text font="display" size="2xl" weight="bold" color={sticker.color.textInverse} accessibilityRole="header">
            {pending.length ? 'Det som trenger deg.' : 'Alt er fulgt opp.'}
          </Text>
          <Text color={sticker.color.textInverse}>
            {pending.length
              ? 'Her samles sakene som trenger hjelp fra oss i Knuteloop.'
              : 'Ingen saker venter på deg. Du finner avgjørelsene under Behandlet.'}
          </Text>
          <StickerButton
            label={pending.length ? 'Gå til rapportkøen' : 'Se behandlede saker'}
            variant="accent"
            onPress={onOpenQueue}
            icon={<ArrowRight size={sticker.icon.sm} color={sticker.color.ink} />}
            iconPosition="right"
          />
        </Stack>
      </StickerCard>

      <Stack direction="row" gap="sm" style={styles.metrics}>
        <Metric value={pending.length} label="Venter" />
        <Metric value={urgent.length} label="Haster" />
        <Metric value={reports.length - pending.length} label="Behandlet" />
      </Stack>

      {next ? (
        <Stack gap="sm">
          <Text font="display" size="xl" weight="bold" color={sticker.color.ink} accessibilityRole="header">
            Start her
          </Text>
          <StickerCard
            tone={next.urgent ? 'accent' : 'surface'}
            onPress={() => onOpenReport(next.id)}
            accessibilityRole="button"
            accessibilityLabel={`Åpne neste sak, ${next.id}. ${next.title}`}
            accessibilityHint="Viser rapporten og valgene for å behandle den."
          >
            <Stack gap="sm">
              <Text size="sm" weight="semibold" color={sticker.color.ink}>
                {next.urgent ? 'Haster · ' : ''}{next.id}
              </Text>
              <Text font="display" size="xl" weight="bold" color={sticker.color.ink}>{next.title}</Text>
              <Text size="sm" color={sticker.color.ink}>{next.school}</Text>
              <Text size="sm" color={sticker.color.ink}>{next.escalation}</Text>
              <Text weight="semibold" color={sticker.color.primary}>Åpne saken →</Text>
            </Stack>
          </StickerCard>
        </Stack>
      ) : (
        <Stack gap="sm" align="start">
          <CheckCheck size={sticker.icon.lg} color={sticker.color.primary} />
          <Text color={sticker.color.textMuted}>Du har behandlet alle eksempelsakene.</Text>
        </Stack>
      )}
    </Stack>
  )
}

function Metric({ value, label }: { value: number; label: string }) {
  return (
    <Stack style={styles.metric} gap="xs">
      <Text font="mono" size="2xl" weight="bold" color={sticker.color.ink}>{formatNumber(value)}</Text>
      <Text size="sm" color={sticker.color.textMuted}>{label}</Text>
    </Stack>
  )
}

const styles = StyleSheet.create({
  metrics: { flexWrap: 'wrap' },
  metric: {
    flex: 1,
    minWidth: size.staffMetricMinWidth,
    padding: spacing.md,
    backgroundColor: sticker.color.surfaceSoft,
    borderRadius: sticker.radius.sm,
  },
})
