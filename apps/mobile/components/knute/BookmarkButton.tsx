import { Bookmark } from 'lucide-react-native'
import { Pressable } from '../primitives'
import { useToggleBookmark } from '../../hooks/useBookmark'
import { sticker } from '../../lib/theme'

// The bookmark toggle for a knute. A bookmark, not a heart: it means «save this
// so I find it again», never «I like this post» — there is no count and nothing
// is published (ADR-0023). Filled with the accent when set, outlined when not.
// Icon-sized on purpose so it never changes the layout it sits in; the
// Pressable primitive pads the hit area out to 44 px invisibly.
export function BookmarkButton({
  knuteId,
  bookmarked,
  color = sticker.color.ink,
  hint,
}: {
  knuteId: string
  bookmarked: boolean
  /** Outline colour for the unset state — ink on paper, white on the dark feed. */
  color?: string
  /** Where the bookmark ends up — say it where that is not obvious (the feed),
      leave it out where it is (inside the knutebok itself). */
  hint?: string
}) {
  const toggle = useToggleBookmark()

  return (
    <Pressable
      onPress={() => toggle.mutate({ knuteId, next: !bookmarked })}
      haptic="light"
      accessibilityRole="button"
      accessibilityLabel={bookmarked ? 'Fjern bokmerke' : 'Bokmerk knuten'}
      accessibilityHint={hint}
      accessibilityState={{ selected: bookmarked }}
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
