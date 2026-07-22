import { StyleSheet, View } from 'react-native'
import { Lock, Megaphone } from 'lucide-react-native'
import { StickerButton, Text } from '../primitives'
import { sticker, spacing } from '../../lib/theme'

// The Send inn action pair (ADR-0021): WHICH button you press IS the
// visibility choice — «Del i feeden» (shared) or «Send inn» (private, only the
// knutesjef sees it). Two full-width buttons, no checkboxes and no preselected
// default: an active choice per publication. This deliberately replaces v1's
// mode pills + one submit button, which caused the checkbox confusion.
// Points are identical either way — only the evidence's audience differs.

export type SubmitChoice = 'shared' | 'private'

type SubmitActionsProps = {
  onSubmit: (visibility: SubmitChoice) => void
  onCancel: () => void
  /** Evidence rule satisfied? When false both buttons disable and missingHint shows. */
  canSubmit: boolean
  /** What is missing when canSubmit is false (bokmål), e.g. «Legg til et bilde først.» */
  missingHint: string | null
  /** The in-flight choice: that button spins, both lock against double-submit. */
  busyChoice: SubmitChoice | null
  /** Already pending/approved → hide the pair, keep only the back action. */
  locked: boolean
}

export function SubmitActions({
  onSubmit,
  onCancel,
  canSubmit,
  missingHint,
  busyChoice,
  locked,
}: SubmitActionsProps) {
  const busy = busyChoice !== null
  return (
    <View style={styles.root}>
      {locked ? null : (
        <>
          <StickerButton
            label="Del i feeden"
            variant="accent"
            fullWidth
            loading={busyChoice === 'shared'}
            disabled={!canSubmit || busy}
            icon={<Megaphone size={sticker.icon.md} color={sticker.color.ink} strokeWidth={2.5} />}
            accessibilityHint="Sendes til godkjenning og vises i feeden når den er godkjent"
            onPress={() => onSubmit('shared')}
          />
          <StickerButton
            label="Send inn"
            variant="secondary"
            fullWidth
            loading={busyChoice === 'private'}
            disabled={!canSubmit || busy}
            icon={<Lock size={sticker.icon.md} color={sticker.color.ink} strokeWidth={2.5} />}
            accessibilityHint="Sendes til godkjenning — bare knutesjefen ser den"
            onPress={() => onSubmit('private')}
          />
          <Text size="xs" color={sticker.color.textMuted} align="center">
            {missingHint ?? 'Begge gir poeng — «Send inn» viser den bare til knutesjefen.'}
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
