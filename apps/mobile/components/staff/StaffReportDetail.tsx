import { useState } from 'react'
import { StyleSheet } from 'react-native'
import { KnoteIcon, Pressable, Stack, StickerButton, StickerCard, Text } from '../primitives'
import { size, spacing, sticker } from '../../lib/theme'
import { actionLabel, type StaffDecision, type StaffReport } from './staff-preview-data'

type Action = StaffDecision['action']
type Duration = NonNullable<StaffDecision['duration']>

const ACTIONS: { value: Action; label: string; description: string }[] = [
  { value: 'keep', label: 'La stå', description: 'Avslutt saken og la innholdet være synlig.' },
  { value: 'remove', label: 'Fjern innhold', description: 'Skjul den rapporterte innsendingen.' },
  {
    value: 'suspend',
    label: 'Fjern og utesteng',
    description: 'Skjul innsendingen og velg en midlertidig utestenging.',
  },
]

const KEEP_REASONS = ['Bryter ikke retningslinjene', 'Rapporten gjelder feil innsending']
const REMOVE_REASONS = [
  'Trakassering eller mobbing',
  'Fare for liv eller helse',
  'Nakenhet eller seksuelt innhold',
  'Innhold delt uten samtykke',
]
const DURATIONS: { value: Duration; label: string }[] = [
  { value: 'day', label: '24 timer' },
  { value: 'week', label: '7 dager' },
]

export function StaffReportDetail({
  report,
  onResolve,
}: {
  report: StaffReport
  onResolve: (decision: StaffDecision) => void
}) {
  return (
    <Stack gap="lg">
      <Stack gap="sm">
        <Text font="mono" size="sm" color={sticker.color.textMuted}>
          Sak {report.id} · {report.decision ? 'Avsluttet' : 'Venter på vurdering'}
        </Text>
        <Text font="display" weight="bold" size="2xl" color={sticker.color.ink} accessibilityRole="header">
          {report.title}
        </Text>
        <Text size="sm" color={sticker.color.textMuted}>
          {report.school}
        </Text>
      </Stack>

      <StickerCard tone="soft" shadow="none">
        <Stack gap="sm">
          <Text weight="semibold" color={sticker.color.ink}>
            Hvorfor ser du sak {report.id}?
          </Text>
          <Text size="sm" color={sticker.color.textMuted}>{report.escalation}</Text>
          {report.urgent ? (
            <Text size="sm" weight="semibold" color={sticker.color.ink}>
              Haster · bør vurderes først
            </Text>
          ) : null}
        </Stack>
      </StickerCard>

      <ReportContent report={report} />
      {report.decision ? (
        <StickerCard tone="soft" shadow="none">
          <Stack gap="sm" accessibilityLiveRegion="polite">
            <Text font="display" weight="bold" size="xl" color={sticker.color.ink} accessibilityRole="header">
              Saken er avsluttet
            </Text>
            <Text weight="semibold" color={sticker.color.ink}>{actionLabel(report.decision)}</Text>
            <Text size="sm" color={sticker.color.textMuted}>
              Begrunnelse: {report.decision.reason}
            </Text>
            <Text size="sm" color={sticker.color.textMuted}>
              Avgjørelsen gjelder bare denne forhåndsvisningen.
            </Text>
          </Stack>
        </StickerCard>
      ) : (
        <DecisionForm report={report} onResolve={onResolve} />
      )}
    </Stack>
  )
}

// Oslo time, like the queue rows — a report's "received" moment must read the
// same wherever the reviewer happens to be.
const receivedFormat = new Intl.DateTimeFormat('nb-NO', {
  day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Oslo',
})

function ReportContent({ report }: { report: StaffReport }) {
  const received = receivedFormat.format(new Date(report.receivedAt))

  return (
    <StickerCard shadow="sm">
      <Stack gap="base">
        <Stack gap="xs">
          <Text font="display" weight="bold" size="lg" color={sticker.color.ink} accessibilityRole="header">
            Rapportert innhold
          </Text>
          <Text size="sm" color={sticker.color.textMuted}>
            {report.visibility === 'hidden' ? 'Skjult i forhåndsvisningen' : 'Synlig i forhåndsvisningen'}
          </Text>
        </Stack>
        <Stack align="center" justify="center" gap="sm" style={styles.placeholder}>
          <KnoteIcon name="knute" size={sticker.icon.lg} color={sticker.color.textMuted} />
          <Text weight="semibold" color={sticker.color.ink} align="center">Eksempelinnhold</Text>
          <Text size="sm" color={sticker.color.textMuted} align="center">
            Illustrasjon uten bilder eller video av personer.
          </Text>
        </Stack>
        <Stack gap="xs">
          <Text size="sm" color={sticker.color.textMuted}>Knute</Text>
          <Text weight="semibold" color={sticker.color.ink}>{report.knute}</Text>
        </Stack>
        <Stack gap="xs">
          <Text size="sm" color={sticker.color.textMuted}>Russenavn i eksempelet</Text>
          <Text weight="semibold" color={sticker.color.ink}>{report.russenavn}</Text>
        </Stack>
        <Stack gap="sm" style={styles.reportNote}>
          <Text weight="semibold" color={sticker.color.ink}>Dette gjelder rapporten</Text>
          <Text size="sm" color={sticker.color.textMuted}>{report.description}</Text>
          <Text size="sm" color={sticker.color.textMuted}>Mottatt {received}</Text>
        </Stack>
      </Stack>
    </StickerCard>
  )
}

function DecisionForm({
  report,
  onResolve,
}: {
  report: StaffReport
  onResolve: (decision: StaffDecision) => void
}) {
  const [action, setAction] = useState<Action | null>(null)
  const [reason, setReason] = useState<string | null>(null)
  const [duration, setDuration] = useState<Duration | null>(null)
  const [reviewing, setReviewing] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const reasons = action === 'keep' ? KEEP_REASONS : REMOVE_REASONS
  const ready = action !== null && reason !== null && (action !== 'suspend' || duration !== null)
  const decision: StaffDecision | null = ready && action && reason
    ? { action, reason, ...(action === 'suspend' && duration ? { duration } : {}) }
    : null

  const chooseAction = (nextAction: Action) => {
    if (nextAction === action) return
    setAction(nextAction)
    setReason(null)
    setDuration(null)
  }
  const cancel = () => {
    setReviewing(false)
    setAction(null)
    setReason(null)
    setDuration(null)
  }

  if (reviewing && decision) {
    return (
      <StickerCard tone="soft" shadow="sm">
        <Stack gap="base">
          <Stack gap="sm" accessibilityLiveRegion="polite">
            <Text font="display" size="xl" weight="bold" color={sticker.color.ink} accessibilityRole="header">
              Se over avgjørelsen
            </Text>
            <Text size="sm" color={sticker.color.textMuted}>Sak {report.id} · {report.school}</Text>
            <Text weight="semibold" color={sticker.color.ink}>{actionLabel(decision)}</Text>
            <Text size="sm" color={sticker.color.textMuted}>Begrunnelse: {decision.reason}</Text>
            <Text size="sm" color={sticker.color.textMuted}>
              {decision.action === 'keep'
                ? 'Innholdet blir stående som synlig, og saken avsluttes i forhåndsvisningen.'
                : 'Innsendingen markeres som skjult, og saken avsluttes i forhåndsvisningen.'}
            </Text>
            {decision.action === 'suspend' ? (
              <Text size="sm" color={sticker.color.textMuted}>
                {report.russenavn} markeres som utestengt i {decision.duration === 'day' ? '24 timer' : '7 dager'} i eksempelet.
              </Text>
            ) : null}
            <Text size="sm" weight="semibold" color={sticker.color.ink}>
              Kun eksempeldata endres. Ingen ekte brukere berøres, og ingen melding sendes.
            </Text>
          </Stack>
          <StickerButton
            label="Bekreft valget"
            fullWidth
            disabled={confirmed}
            onPress={() => {
              if (confirmed) return
              setConfirmed(true)
              onResolve(decision)
            }}
            accessibilityHint="Avslutter bare eksempelsaken med avgjørelsen du har valgt."
          />
          <StickerButton
            label="Endre valgene"
            variant="secondary"
            fullWidth
            disabled={confirmed}
            onPress={() => setReviewing(false)}
          />
          <StickerButton label="Avbryt" variant="ghost" fullWidth disabled={confirmed} onPress={cancel} />
        </Stack>
      </StickerCard>
    )
  }

  const reasonChoices = action ? (
    <Stack gap="sm">
      <Text weight="semibold" color={sticker.color.ink} accessibilityRole="header">Velg begrunnelse</Text>
      {reasons.map((item) => (
        <Choice key={item} label={item} selected={reason === item} onPress={() => setReason(item)} />
      ))}
    </Stack>
  ) : null
  const durationChoices = action === 'suspend' ? (
    <Stack gap="sm">
      <Text weight="semibold" color={sticker.color.ink} accessibilityRole="header">Velg varighet</Text>
      {DURATIONS.map((item) => (
        <Choice
          key={item.value}
          label={item.label}
          selected={duration === item.value}
          onPress={() => setDuration(item.value)}
        />
      ))}
    </Stack>
  ) : null

  return (
    <Stack gap="lg">
      <Stack gap="sm">
        <Text font="display" weight="bold" size="xl" color={sticker.color.ink} accessibilityRole="header">
          Vurder saken
        </Text>
        <Text size="sm" color={sticker.color.textMuted}>
          Velg en handling. Du får se over alt før du bekrefter.
        </Text>
        {ACTIONS.map((item) => (
          <Choice
            key={item.value}
            label={item.label}
            description={item.description}
            selected={action === item.value}
            onPress={() => chooseAction(item.value)}
          />
        ))}
      </Stack>
      {reasonChoices}
      {durationChoices}
      <Stack gap="sm">
        {!ready ? (
          <Text size="sm" color={sticker.color.textMuted} accessibilityLiveRegion="polite">
            {action === 'suspend'
              ? 'Velg begrunnelse og varighet for å gå videre.'
              : 'Velg handling og begrunnelse for å gå videre.'}
          </Text>
        ) : null}
        <StickerButton
          label="Se over avgjørelsen"
          fullWidth
          disabled={!ready}
          onPress={() => setReviewing(true)}
          accessibilityHint="Viser valgene dine for bekreftelse før eksempelsaken avsluttes."
        />
      </Stack>
    </Stack>
  )
}

function Choice({
  label,
  description,
  selected,
  onPress,
}: {
  label: string
  description?: string
  selected: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityHint={description}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[styles.choice, selected ? styles.selectedChoice : null]}
    >
      <Stack gap="xs">
        <Text weight="semibold" color={sticker.color.ink}>{label}</Text>
        {description ? <Text size="sm" color={sticker.color.textMuted}>{description}</Text> : null}
        {selected ? <Text size="sm" weight="semibold" color={sticker.color.primary}>Valgt</Text> : null}
      </Stack>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  placeholder: {
    padding: spacing.base,
    paddingVertical: spacing.lg,
    backgroundColor: sticker.color.surfaceMedia,
    borderRadius: sticker.radius.md,
  },
  reportNote: {
    borderTopWidth: sticker.borderWidth,
    borderTopColor: sticker.color.line,
    paddingTop: spacing.base,
  },
  choice: {
    minHeight: size.minTapTarget,
    padding: spacing.base,
    borderRadius: sticker.radius.md,
    borderWidth: sticker.borderWidth,
    borderColor: sticker.color.line,
    backgroundColor: sticker.color.card,
  },
  selectedChoice: {
    borderColor: sticker.color.primary,
    backgroundColor: sticker.color.primaryBg,
  },
})
