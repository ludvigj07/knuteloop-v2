import { StyleSheet } from 'react-native'
import { Bookmark } from 'lucide-react-native'
import { Pressable } from '../primitives'
import { useToggleBookmark } from '../../hooks/useBookmark'
import { size, sticker } from '../../lib/theme'

// The bookmark toggle for a knute. A bookmark, not a heart: it means «save this
// so I find it again», never «I like this post» — there is no count and nothing
// is published (ADR-0023). Filled with the accent when set, outlined when not.
// The icon itself stays small; the Pressable primitive pads the hit area out
// to 44 px invisibly.
export function BookmarkButton({
  knuteId,
  bookmarked,
  color = sticker.color.ink,
  compact = false,
}: {
  knuteId: string
  bookmarked: boolean
  /** Outline colour for the unset state — ink on paper, white on the dark feed. */
  color?: string
  /** Icon-sized only (no 40 px frame) — for list rows where the button must not
      change the row's layout. The Pressable still pads the hit area to 44 px. */
  compact?: boolean
}) {
  const toggle = useToggleBookmark()

  return (
    <Pressable
      onPress={() => toggle.mutate({ knuteId, next: !bookmarked })}
      haptic="light"
      accessibilityRole="button"
      accessibilityLabel={bookmarked ? 'Fjern bokmerke' : 'Bokmerk knuten'}
      accessibilityHint="Bokmerkede knuter ligger under «Bokmerker» i knuteboka."
      accessibilityState={{ selected: bookmarked }}
      style={compact ? null : styles.button}
    >
      <Bookmark
        size={sticker.icon.md}
        color={bookmarked ? sticker.color.accent : color}
        fill={bookmarked ? sticker.color.accent : 'transparent'}
        strokeWidth={sticker.borderWidth}
      />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    width: size.actionMinHeight,
    height: size.actionMinHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
