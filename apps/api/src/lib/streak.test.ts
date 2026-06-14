import { describe, it, expect } from 'vitest'
import { addDays, computeStreak } from './streak.js'

describe('addDays', () => {
  it('shifts a date forward and backward', () => {
    expect(addDays('2026-06-14', 1)).toBe('2026-06-15')
    expect(addDays('2026-06-14', -1)).toBe('2026-06-13')
  })

  it('crosses month and year boundaries', () => {
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31')
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01') // 2026 is not a leap year
  })

  it('is DST-safe (date-only math, no hour drift)', () => {
    // Last Sunday of March 2026 (29th) is the Oslo spring-forward day.
    expect(addDays('2026-03-30', -1)).toBe('2026-03-29')
    expect(addDays('2026-03-29', -1)).toBe('2026-03-28')
    // Last Sunday of October 2026 (25th) is the fall-back day.
    expect(addDays('2026-10-26', -1)).toBe('2026-10-25')
  })
})

describe('computeStreak', () => {
  const today = '2026-06-14'

  it('is 0 with no active days', () => {
    expect(computeStreak([], today)).toBe(0)
  })

  it('counts a single active day (today)', () => {
    expect(computeStreak([today], today)).toBe(1)
  })

  it('counts a consecutive run ending today', () => {
    expect(computeStreak(['2026-06-12', '2026-06-13', '2026-06-14'], today)).toBe(3)
  })

  it('grants a grace day: an active streak ending yesterday still counts', () => {
    // Nothing today yet, but yesterday + the day before are active.
    expect(computeStreak(['2026-06-12', '2026-06-13'], today)).toBe(2)
  })

  it('is 0 when the most recent activity is older than yesterday', () => {
    expect(computeStreak(['2026-06-10', '2026-06-11', '2026-06-12'], today)).toBe(0)
  })

  it('stops at the first gap', () => {
    // today active, but 2 days ago missing → run is just today.
    expect(computeStreak(['2026-06-14', '2026-06-12', '2026-06-11'], today)).toBe(1)
  })

  it('ignores duplicate and out-of-order days', () => {
    expect(computeStreak(['2026-06-13', '2026-06-14', '2026-06-13', '2026-06-12'], today)).toBe(3)
  })
})
