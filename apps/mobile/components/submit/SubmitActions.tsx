import { StyleSheet, View } from 'react-native'
import { Lock, Megaphone } from 'lucide-react-native'
import { StickerButton, Text } from '../primitives'
import { sticker, spacing } from '../../lib/theme'

// The Send inn action pair (ADR-0021 + ADR-0022): WHICH button you press IS
// the visibility choice — «Del i feeden» (shared) or «Send inn» (private, only
// the knutesjef sees it). No checkboxes, no preselected default: an active
// choice per publication. Points are identical either way.
//
// ADR-0022 (the feed is visual): sharing requires a photo. On a media knute
// without one, the share button stays VISIBLE but disabled — it teaches that
// photos can be shared, without nagging. On text knuter it is not rendered at
// all (they can never be shared — the sensitive content stays off the feed).

export type SubmitChoice = 'shared' | 'private'

type SubmitActionsProps = {
  onSubmit: (visibility: SubmitChoice) => void
  onCancel: () => void
  /** Render the share button at all? false for text knuter (never shareable). */
  showShare: boolean
  /** Share enabled — requires a photo (ADR-0022). */
  canShare: boolean
  /** Private submit enabled — the validity rule (caption OR photo). */
  canSend: boolean
  /** The single context line under the buttons (bokmål). The screen decides which. */
  hint: string
  /** The in-flight choice: that button spins, both lock against double-submit. */
  busyChoice: SubmitChoice | null
  /** Already pending/approved → hide the pair, keep only the back action. */
  locked: boolean
}

export function SubmitActions({
  onSubmit,
  onCancel,
  showShare,
  canShare,
  canSend,
  hint,
  busyChoice,
  locked,
}: SubmitActionsProps) {
  const busy = busyChoice !== null
  return (
    <View style={styles.root}>
      {locked ? null : (
        <>
          {showShare ? (
            <StickerButton
              label="Del i feeden"
              variant="accent"
              fullWidth
              loading={busyChoice === 'shared'}
              disabled={!canShare || busy}
              icon={
                <Megaphone size={sticker.icon.md} color={sticker.color.ink} strokeWidth={2.5} />
              }
              accessibilityHint="Sendes til godkjenning og vises i feeden når den er godkjent — krever bilde"
              onPress={() => onSubmit('shared')}
            />
          ) : null}
          <StickerButton
            label="Send inn"
            variant="secondary"
            fullWidth
            loading={busyChoice === 'private'}
            disabled={!canSend || busy}
            icon={<Lock size={sticker.icon.md} color={sticker.color.ink} strokeWidth={2.5} />}
            accessibilityHint="Sendes til godkjenning — bare knutesjefen ser den"
            onPress={() => onSubmit('private')}
          />
          <Text size="xs" color={sticker.color.textMuted} align="center">
            {hint}
          </Text>
        </>
      )}
      <StickerButton
        label={locked ? 'Tilbake' : 'Avbryt'}
        variant="ghost"
        fullWidth
        disabled={busy}
        onPress={onCancel}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { gap: spacing.sm, marginTop: spacing.xs },
})
