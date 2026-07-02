import { StyleSheet, View } from 'react-native'
import { Image } from 'expo-image'
import { Chip, KnoteIcon, StickerButton, StickerCard, Text } from '../primitives'
import type { PendingSubmission } from '../../lib/api'
import { formatNumber } from '../../lib/format'
import { animation, size, spacing, sticker } from '../../lib/theme'

// One card in the knutesjef review queue. Shows the evidence (a photo, or the
// written caption for text-only knuter, or a "storage not wired yet" placeholder),
// who sent it and for how many points, then the Avvis / Godkjenn actions.
// Sticker-styled to match the rest of the app (ADR-0017).

export type PendingCardProps = {
  submission: PendingSubmission
  onApprove: () => void
  onReject: () => void
  /** Which action is in flight for THIS card, or null. Drives the spinner +
   *  disables both buttons so a double-tap can't fire two reviews. */
  pendingAction: 'approve' | 'reject' | null
}

export function PendingCard({ submission, onApprove, onReject, pendingAction }: PendingCardProps) {
  const isText = submission.evidenceType === 'text'
  const busy = pendingAction !== null

  return (
    <StickerCard tone="surface" radius="lg" shadow="base" style={styles.card}>
      <View style={styles.body}>
        <Evidence submission={submission} isText={isText} />

        <View style={styles.headerBlock}>
          <Text font="display" weight="bold" size="lg" color={sticker.color.ink} numberOfLines={2}>
            {submission.knuteTitle}
          </Text>
          <View style={styles.metaRow}>
            <Text size="sm" color={sticker.color.textMuted}>
              Fra{' '}
            </Text>
            <Text
              size="sm"
              weight="semibold"
              color={sticker.color.textSoft}
              numberOfLines={1}
              style={styles.flex}
            >
              {submission.russenavn}
            </Text>
            <Chip label={`+${formatNumber(submission.knutePoints)} P`} tone="accent" mono />
          </View>
        </View>

        {/* For media knuter the caption is an optional extra note; for text knuter
            it IS the evidence and is already rendered inside <Evidence>. */}
        {!isText && submission.caption ? (
          <Text size="sm" color={sticker.color.textMuted} numberOfLines={4} style={styles.caption}>
            {submission.caption}
          </Text>
        ) : null}

        <View style={styles.actions}>
          <View style={styles.flex}>
            <StickerButton
              label="Avvis"
              variant="secondary"
              fullWidth
              disabled={busy}
              loading={pendingAction === 'reject'}
              onPress={onReject}
              accessibilityHint={`Avviser innsendingen fra ${submission.russenavn}.`}
            />
          </View>
          <View style={styles.flex}>
            <StickerButton
              label="Godkjenn"
              variant="primary"
              fullWidth
              disabled={busy}
              loading={pendingAction === 'approve'}
              onPress={onApprove}
              accessibilityHint={`Godkjenner og gir ${formatNumber(submission.knutePoints)} poeng.`}
            />
          </View>
        </View>
      </View>
    </StickerCard>
  )
}

// The evidence well: a real photo, the written caption (text-only knuter), or a
// placeholder for media knuter whose upload hasn't landed (dev / legacy keys).
function Evidence({ submission, isText }: { submission: PendingSubmission; isText: boolean }) {
  if (isText) {
    return (
      <StickerCard tone="soft" radius="md" shadow="none" padding="base" style={styles.well}>
        <Text
          font="display"
          weight="bold"
          size="base"
          color={sticker.color.ink}
          align="center"
          numberOfLines={6}
        >
          {submission.caption ?? submission.knuteTitle}
        </Text>
      </StickerCard>
    )
  }

  if (submission.imageUrl) {
    return (
      <Image
        source={{ uri: submission.imageUrl }}
        style={styles.image}
        contentFit="cover"
        transition={animation.duration.fast}
        accessibilityRole="image"
        accessibilityLabel={`Bevis for ${submission.knuteTitle}`}
      />
    )
  }

  return (
    <StickerCard tone="media" radius="md" shadow="none" padding="base" style={styles.well}>
      <View style={styles.placeholder}>
        <KnoteIcon name="knute" size={sticker.icon.lg} color={sticker.color.textMuted} />
        <Text size="sm" color={sticker.color.textMuted} align="center">
          Bildet kommer når lagring er koblet på
        </Text>
      </View>
    </StickerCard>
  )
}

const styles = StyleSheet.create({
  card: { marginHorizontal: spacing.base, marginBottom: spacing.md },
  body: { gap: spacing.sm },
  flex: { flex: 1 },
  image: {
    width: '100%',
    height: size.reviewEvidenceHeight,
    borderRadius: sticker.radius.md,
    borderWidth: sticker.borderWidth,
    borderColor: sticker.color.ink,
    backgroundColor: sticker.color.surfaceMedia,
  },
  well: {
    alignSelf: 'stretch',
    minHeight: size.reviewEvidenceHeight,
    justifyContent: 'center',
  },
  placeholder: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  headerBlock: { gap: spacing['2xs'] },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  caption: { fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
})
