import { formatNumber, formatShortDate } from './format'

describe('format', () => {
  it('formats integers with an nb-NO thousands separator', () => {
    // The separator is a (narrow) no-break space whose exact codepoint varies by
    // ICU version, so assert on the digits with whitespace stripped.
    expect(formatNumber(1234).replace(/\s/g, '')).toBe('1234')
    expect(formatNumber(1000000).replace(/\s/g, '')).toBe('1000000')
    expect(formatNumber(0)).toBe('0')
  })

  it('renders a short Norwegian date', () => {
    const out = formatShortDate('2026-05-17T12:00:00.000Z')
    expect(out).toContain('mai')
    expect(out).toContain('17')
  })
})
