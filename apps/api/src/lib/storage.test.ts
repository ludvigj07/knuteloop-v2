import { describe, it, expect } from 'vitest'
import {
  isValidImageKey,
  newSubmissionImageKey,
  PENDING_CARD_VARIANT,
  publicUrlForKey,
  withImageVariant,
} from './storage.js'

const KEY = 'submissions/123e4567-e89b-42d3-a456-426614174000.jpg'
const ORIGIN = 'http://localhost:3000'

describe('withImageVariant', () => {
  it('appends Bunny Optimizer width + quality params', () => {
    expect(withImageVariant(`https://cdn.example/${KEY}`, { width: 750, quality: 80 })).toBe(
      `https://cdn.example/${KEY}?width=750&quality=80`,
    )
  })
})

describe('publicUrlForKey', () => {
  it('returns the untouched original while BUNNY_OPTIMIZER_ENABLED is false (default)', () => {
    // The whole point of the seam: passing a variant changes NOTHING until the
    // paid add-on is bought and the flag flipped — dev/test/prod-before-purchase
    // all serve identical URLs.
    expect(publicUrlForKey(KEY, ORIGIN, PENDING_CARD_VARIANT)).toBe(`${ORIGIN}/uploads/${KEY}`)
  })

  it('variant-less calls are unchanged too', () => {
    expect(publicUrlForKey(KEY, ORIGIN)).toBe(`${ORIGIN}/uploads/${KEY}`)
  })
})

describe('image keys', () => {
  it('freshly minted keys pass the allowlist pattern', () => {
    expect(isValidImageKey(newSubmissionImageKey())).toBe(true)
  })

  it('rejects traversal-shaped keys', () => {
    expect(isValidImageKey('submissions/../../etc/passwd')).toBe(false)
    expect(isValidImageKey('submissions/not-a-uuid.jpg')).toBe(false)
  })
})
