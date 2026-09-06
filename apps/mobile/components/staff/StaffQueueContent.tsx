import { StyleSheet } from 'react-native'
import { Chip, Pressable, Stack, StickerCard, Text } from '../primitives'
import { spacing, sticker } from '../../lib/theme'
import { actionLabel, type StaffEvent, type StaffReport } from './staff-preview-data'

export type QueueFilter = 'pending' | 'urgent' | 'resolved'
export type StaffTab = 'overview' | 'reports' | 'log'

const timeFormat = new Intl.DateTimeFormat('nb-NO', {
  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Oslo',
})

export function StaffTabs({ tab, onChange }: { tab: StaffTab; onChange: (tab: StaffTab) => void }) {
  const tabs = [['overview', 'Oversikt'], ['reports', 'Rapporter'], ['log', 'Logg']] as const
  return (
    <Stack direction="row" gap="xs" style={styles.wrap}>
      {tabs.map(([value, label]) => (
        <Pressable
          key={value}
          onPress={() => onChange(value)}
          accessibilityRole="tab"
          accessibilityLabel={label}
          accessibilityState={{ selected: tab === value }}
          style={[styles.tab, tab === value && styles.selected]}
        >
          <Text weight="semibold" size="sm" color={tab === value ? sticker.color.textInverse : sticker.color.ink}>{label}</Text>
        </Pressable>
      ))}
    </Stack>
  )
}

export function StaffQueueFilters({ filter, onChange }: { filter: QueueFilter; onChange: (filter: QueueFilter) => void }) {
  const filters = [['pending', 'Venter'], ['urgent', 'Haster'], ['resolved', 'Behandlet']] as const
  return (
    <Stack direction="row" gap="sm" style={styles.wrap}>
      {filters.map(([value, label]) => (
        <Pressable
          key={value}
          onPress={() => onChange(value)}
          accessibilityRole="button"
          accessibilityLabel={`Vis ${label.toLocaleLowerCase('nb-NO')} saker`}
          accessibilityState={{ selected: filter === value }}
          style={[styles.filter, filter === value && styles.filterSelected]}
        >
          <Text size="sm" weight="semibold" color={sticker.color.primary}>{label}</Text>
        </Pressable>
      ))}
    </Stack>
  )
}

export function StaffReportRow({ report, onOpen }: { report: StaffReport; onOpen: () => void }) {
  return (
    <StickerCard
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`Åpne sak ${report.id}. ${report.title}. ${report.decision ? 'Behandlet' : report.urgent ? 'Haster' : 'Venter'}`}
      accessibilityHint="Viser detaljer om denne rapporten."
    >
      <Stack gap="sm">
        <Stack direction="row" gap="sm" style={styles.wrap} align="center">
          <Text font="mono" size="xs" color={sticker.color.textMuted}>{report.id}</Text>
          <Chip label={report.decision ? 'Behandlet' : report.urgent ? 'Haster' : 'Venter'} tone={report.urgent && !report.decision ? 'accent' : 'primary'} />
          <Chip label={report.visibility === 'hidden' ? 'Innhold skjult' : 'Innhold synlig'} />
        </Stack>
        <Text font="display" size="lg" weight="bold" color={sticker.color.ink}>{report.title}</Text>
        <Text size="sm" color={sticker.color.textMuted}>{report.school} · {report.knute}</Text>
        <Text size="sm" color={sticker.color.textMuted}>
          {report.decision ? actionLabel(report.decision) : `Mottatt ${timeFormat.format(new Date(report.receivedAt))}`}
        </Text>
        <Text size="sm" weight="semibold" color={sticker.color.primary}>{report.decision ? 'Se avgjørelse →' : 'Behandle saken →'}</Text>
      </Stack>
    </StickerCard>
  )
}

export function StaffEventRow({ event, onOpen }: { event: StaffEvent; onOpen: () => void }) {
  return (
    <StickerCard shadow="none" onPress={onOpen} accessibilityRole="button" accessibilityLabel={`Åpne sak ${event.reportId}. ${event.description}`}>
      <Stack gap="sm">
        <Text font="mono" size="xs" color={sticker.color.textMuted}>{timeFormat.format(new Date(event.createdAt))} · {event.reportId}</Text>
        <Text size="sm" color={sticker.color.ink}>{event.description}</Text>
        <Text size="sm" weight="semibold" color={sticker.color.primary}>Se saken →</Text>
      </Stack>
    </StickerCard>
  )
}

export function StaffEmptyState({ title, message }: { title: string; message: string }) {
  return (
    <StickerCard tone="soft" shadow="none">
      <Stack gap="sm">
        <Text font="display" size="xl" weight="bold" color={sticker.color.ink} accessibilityRole="header">{title}</Text>
        <Text color={sticker.color.textMuted}>{message}</Text>
      </Stack>
    </StickerCard>
  )
}

const styles = StyleSheet.create({
  wrap: { flexWrap: 'wrap' },
  tab: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', minHeight: sticker.tap.size, padding: spacing.sm, borderRadius: sticker.radius.sm },
  selected: { backgroundColor: sticker.color.primary },
  filter: { minHeight: sticker.tap.min, paddingHorizontal: spacing.md, justifyContent: 'center', borderRadius: sticker.radius.full },
  filterSelected: { backgroundColor: sticker.color.primaryBg },
})
