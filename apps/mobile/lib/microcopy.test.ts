import { pickSubmissionReceipt, type ReceiptContext } from './microcopy'

// `random` is called at most twice: the rare roll, then the index. A queue of
// fixed values makes every branch deterministic.
const sequence = (...values: number[]) => {
  let i = 0
  return () => values[Math.min(i++, values.length - 1)] as number
}

// 0.5 clears the rare threshold (0.025), so the second value picks the index.
const noRare = (index: number) => sequence(0.5, index)

describe('pickSubmissionReceipt', () => {
  const contexts: ReceiptContext[] = ['shared', 'private', 'resubmission']

  it.each(contexts)('returns a non-empty line for context "%s"', (context) => {
    expect(pickSubmissionReceipt(context, noRare(0))).not.toBe('')
  })

  it('gives each context its own wording', () => {
    const shared = pickSubmissionReceipt('shared', noRare(0))
    const priv = pickSubmissionReceipt('private', noRare(0))
    const retry = pickSubmissionReceipt('resubmission', noRare(0))

    expect(new Set([shared, priv, retry]).size).toBe(3)
  })

  it('walks the whole list rather than always returning the first line', () => {
    // 0.99 lands on the last entry of whichever list is used.
    expect(pickSubmissionReceipt('private', noRare(0))).not.toBe(
      pickSubmissionReceipt('private', noRare(0.99)),
    )
  })

  it('returns the rare line when the roll comes up under the threshold', () => {
    const rare = pickSubmissionReceipt('private', sequence(0.001))
    const ordinary = pickSubmissionReceipt('private', noRare(0))

    expect(rare).not.toBe(ordinary)
    // The rare line is shared across contexts — it is the easter egg, not a
    // fourth context.
    expect(pickSubmissionReceipt('shared', sequence(0.001))).toBe(rare)
  })

  it('stays in range for every possible random value', () => {
    for (const context of contexts) {
      for (const r of [0, 0.25, 0.5, 0.75, 0.999, 1]) {
        const line = pickSubmissionReceipt(context, sequence(0.5, r))
        expect(typeof line).toBe('string')
        expect(line.length).toBeGreaterThan(0)
      }
    }
  })

  it('is usable without injecting random', () => {
    expect(pickSubmissionReceipt('private').length).toBeGreaterThan(0)
  })
})
