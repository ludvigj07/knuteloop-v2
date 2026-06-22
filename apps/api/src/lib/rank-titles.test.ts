import { describe, it, expect } from 'vitest'
import { getRankTitle } from './rank-titles.js'

describe('getRankTitle', () => {
  it('rank 1 is the unique top title', () => {
    expect(getRankTitle(1)).toBe("O' Store Knutemester")
    expect(getRankTitle(2)).not.toBe("O' Store Knutemester")
  })

  it('maps each tier at its lower and upper boundary (v1-spec §6)', () => {
    // [lowerBound, upperBound, title] for every tier.
    const cases: Array<[number, number, string]> = [
      [2, 3, 'Knutemester'],
      [4, 10, 'Knutebaron'],
      [11, 20, 'Knuteridder'],
      [21, 35, 'Knutesersjant'],
      [36, 55, 'Knuteknekt'],
      [56, 80, 'Knutelærling'],
      [81, 110, 'Knuteamatør'],
      [111, 145, 'Knuteprøvling'],
      [146, 185, 'Knutetabbe'],
      [186, 220, 'Knutenybegynner'],
    ]
    for (const [lo, hi, title] of cases) {
      expect(getRankTitle(lo)).toBe(title)
      expect(getRankTitle(hi)).toBe(title)
    }
  })

  it('ranks past the last tier fall through to Knutekatastrofen', () => {
    expect(getRankTitle(221)).toBe('Knutekatastrofen')
    expect(getRankTitle(10_000)).toBe('Knutekatastrofen')
  })

  it('invalid ranks (< 1 or non-integer) are Knutekatastrofen', () => {
    expect(getRankTitle(0)).toBe('Knutekatastrofen')
    expect(getRankTitle(-5)).toBe('Knutekatastrofen')
    expect(getRankTitle(1.5)).toBe('Knutekatastrofen')
    expect(getRankTitle(NaN)).toBe('Knutekatastrofen')
    expect(getRankTitle(Infinity)).toBe('Knutekatastrofen')
  })
})
