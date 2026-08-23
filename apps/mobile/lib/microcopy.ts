// Varied confirmation copy.
//
// v1 shipped several phrasings per situation and picked one at random, so the
// app kept a voice without ever reaching for confetti or sound. That is exactly
// the celebration ADR-0023 allows: personality in the WORDS, stillness in the
// pixels. The lines below are v1's own, trimmed to headline length — the screen
// underneath still explains who sees the submission.
//
// Source and reasoning: docs/v1-detaljer.md §8.

/**
 * Which situation the user is in when the receipt is shown.
 * - `shared` — headed for the feed once the knutesjef approves (ADR-0021).
 * - `private` — only the knutesjef will ever see it.
 * - `resubmission` — sending again after a rejection. Deserves its own tone:
 *   acknowledge the effort, don't repeat the first-time copy.
 */
export type ReceiptContext = 'shared' | 'private' | 'resubmission'

const RECEIPTS: Record<ReceiptContext, readonly string[]> = {
  private: ['Sterkt levert.', 'Ryddig levert.', 'Boom. Knuten er sendt.', 'Nydelig innsending.'],
  shared: ['Posta og klar.', 'Delt og sendt.', 'La folk se leveringen din.'],
  resubmission: ['Ny runde, ny levering.', 'Fin justering.', 'Oppdatert og sendt på nytt.'],
}

// The easter egg. v1 had one too, and it was the detail people talked about —
// rare enough that finding it feels like a small secret rather than a gimmick.
const RARE_RECEIPT = 'Knuten er inne. Du kjente det, ikke sant?'
const RARE_CHANCE = 0.025

/**
 * Pick a confirmation headline for a completed submission.
 *
 * Call this ONCE per submission and hold the result — re-picking on every
 * render would reshuffle the words while the user is reading them.
 *
 * @param context Which situation the user is in.
 * @param random Injectable for tests. Called at most twice: first for the rare
 *   roll, then for the index into the context's list.
 */
export function pickSubmissionReceipt(
  context: ReceiptContext,
  random: () => number = Math.random,
): string {
  if (random() < RARE_CHANCE) return RARE_RECEIPT

  const options = RECEIPTS[context]
  // Math.min guards against a random() that returns exactly 1 (allowed by an
  // injected implementation, though Math.random never does).
  const index = Math.min(Math.floor(random() * options.length), options.length - 1)
  return options[index] as string
}
