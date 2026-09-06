import { useState } from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import { ConfirmSheet, Pressable, Stack, StickerButton, Text } from '../primitives'
import { useStaffPreview } from '../../hooks/useStaffPreview'
import { size, spacing, sticker } from '../../lib/theme'
import { StaffOverview } from './StaffOverview'
import { StaffReportDetail } from './StaffReportDetail'
import {
  StaffEmptyState, StaffEventRow, StaffQueueFilters, StaffReportRow, StaffTabs,
  type QueueFilter, type StaffTab,
} from './StaffQueueContent'

// Local demonstration state only. This is deliberately separate from school
// admin and the API client; employee permissions must eventually come from the server.
export default function StaffPreview() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { reports, events, openReport, resolveReport, reset } = useStaffPreview()
  const [tab, setTab] = useState<StaffTab>('overview')
  const [filter, setFilter] = useState<QueueFilter>('pending')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [resetOpen, setResetOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const selected = reports.find((report) => report.id === selectedId)
  const visibleReports = reports
    .filter((report) => filter === 'resolved' ? !!report.decision : !report.decision && (filter !== 'urgent' || report.urgent))
    .sort((a, b) => Number(b.urgent) - Number(a.urgent) || a.receivedAt.localeCompare(b.receivedAt))

  const open = (id: string) => {
    openReport(id)
    setSelectedId(id)
    setNotice('')
  }
  const changeTab = (value: StaffTab) => {
    setTab(value)
    setNotice('')
  }
  const emptyQueue = filter === 'resolved'
    ? { title: 'Ingen behandlede saker ennå', message: 'Når du behandler en eksempelsak, finner du avgjørelsen her.' }
    : filter === 'urgent'
      ? { title: 'Ingen hastesaker venter', message: 'Se resten av køen under Venter.' }
      : { title: 'Ingen rapporter venter', message: 'Alle eksempelsakene er fulgt opp. Du finner dem under Behandlet.' }

  return (
    <Stack style={[styles.root, {
      paddingTop: insets.top + spacing.sm,
      paddingLeft: insets.left + spacing.base,
      paddingRight: insets.right + spacing.base,
      paddingBottom: insets.bottom + spacing.sm,
    }]}>
      <Stack style={styles.content} gap="sm">
        <Stack direction="row" align="center" gap="sm">
          <Pressable
            onPress={() => {
              if (selected) setSelectedId(null)
              else if (router.canGoBack()) router.back()
              else router.replace('/dev-login')
            }}
            accessibilityRole="button"
            accessibilityLabel={selected ? 'Tilbake til oversikten' : 'Lukk forhåndsvisningen'}
            style={styles.back}
          >
            <ArrowLeft size={sticker.icon.md} color={sticker.color.ink} />
          </Pressable>
          <Stack style={styles.title} gap="2xs">
            <Text size="sm" color={sticker.color.primary} weight="semibold">Knuteloop · for ansatte</Text>
            <Text font="display" size="xl" weight="bold" color={sticker.color.ink} accessibilityRole="header">
              {selected ? `Sak ${selected.id}` : 'Superadmin'}
            </Text>
          </Stack>
        </Stack>
        <Stack style={styles.demo}>
          <Text size="xs" weight="semibold" color={sticker.color.ink}>Demo · bare eksempeldata. Endringer lagres ikke.</Text>
        </Stack>

        {selected ? (
          <ScrollView key={selected.id} contentContainerStyle={styles.scrollContent}>
            <StaffReportDetail
              key={selected.id}
              report={selected}
              onResolve={(decision) => {
                resolveReport(selected.id, decision)
                setSelectedId(null)
                setTab('reports')
                setFilter('pending')
                setNotice(`Sak ${selected.id} er behandlet i demoen.`)
              }}
            />
          </ScrollView>
        ) : (
          <>
            <StaffTabs tab={tab} onChange={changeTab} />
            {notice ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" size="sm" color={sticker.color.primary}>{notice}</Text> : null}
            {tab === 'overview' ? (
              <ScrollView contentContainerStyle={styles.scrollContent}>
                <StaffOverview reports={reports} onOpenReport={open} onOpenQueue={() => {
                  setFilter(reports.some((report) => !report.decision) ? 'pending' : 'resolved')
                  setTab('reports')
                }} />
                <StickerButton label="Nullstill eksemplene" variant="ghost" onPress={() => setResetOpen(true)} />
              </ScrollView>
            ) : tab === 'reports' ? (
              <Stack style={styles.fill} gap="sm">
                <StaffQueueFilters filter={filter} onChange={setFilter} />
                <FlashList
                  key={`reports-${filter}`}
                  data={visibleReports}
                  keyExtractor={(report) => report.id}
                  estimatedItemSize={size.staffListItemEstimate}
                  renderItem={({ item }) => <StaffReportRow report={item} onOpen={() => open(item.id)} />}
                  ItemSeparatorComponent={ListSeparator}
                  ListEmptyComponent={<StaffEmptyState {...emptyQueue} />}
                  contentContainerStyle={styles.listContent}
                />
              </Stack>
            ) : (
              <Stack style={styles.fill} gap="sm">
                <Text size="sm" color={sticker.color.textMuted}>Åpninger og avgjørelser i denne demoøkten, nyeste først.</Text>
                <FlashList
                  key="events"
                  data={events}
                  keyExtractor={(event) => event.id}
                  estimatedItemSize={size.staffListItemEstimate}
                  renderItem={({ item }) => <StaffEventRow event={item} onOpen={() => open(item.reportId)} />}
                  ItemSeparatorComponent={ListSeparator}
                  ListEmptyComponent={<StaffEmptyState title="Ingen handlinger ennå" message="Åpne en eksempelsak for å prøve loggen." />}
                  contentContainerStyle={styles.listContent}
                />
              </Stack>
            )}
          </>
        )}
      </Stack>
      <ConfirmSheet
        open={resetOpen}
        title="Begynne på nytt?"
        message="Eksempelsakene åpnes igjen, og den lokale demologgen tømmes."
        confirmLabel="Nullstill eksemplene"
        onCancel={() => setResetOpen(false)}
        onConfirm={() => {
          reset()
          setResetOpen(false)
          setSelectedId(null)
          setFilter('pending')
          setNotice('Eksemplene er nullstilt.')
        }}
      />
    </Stack>
  )
}

function ListSeparator() { return <Stack style={styles.separator} /> }

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: sticker.color.paper },
  content: { flex: 1, maxWidth: size.staffContentMaxWidth, width: '100%', alignSelf: 'center' },
  fill: { flex: 1 },
  title: { flex: 1 },
  back: { minWidth: sticker.tap.min, minHeight: sticker.tap.min, alignItems: 'center', justifyContent: 'center' },
  demo: { backgroundColor: sticker.color.accentBg, padding: spacing.sm, borderRadius: sticker.radius.sm },
  scrollContent: { gap: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.lg, paddingRight: sticker.shadowOffset.base },
  listContent: { paddingTop: spacing.sm, paddingBottom: spacing.lg, paddingRight: sticker.shadowOffset.base },
  separator: { height: spacing.base },
})
