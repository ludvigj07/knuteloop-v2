import { describe, it, expect } from 'vitest'
import { pickDagensKnute } from './dagens-knute.js'

describe('pickDagensKnute', () => {
  const a = { id: 'aaaaaaaa-0000-0000-0000-000000000000', title: 'Sist i alfabetet' }
  const b = { id: 'bbbbbbbb-0000-0000-0000-000000000000', title: 'Midt i' }
  const c = { id: 'cccccccc-0000-0000-0000-000000000000', title: 'Først' }

  it('returns null for an empty pool', () => {
    expect(pickDagensKnute([], 20260724)).toBeNull()
  })

  it('picks seed % length from the id-sorted pool', () => {
    expect(pickDagensKnute([a, b, c], 0)).toBe(a)
    expect(pickDagensKnute([a, b, c], 1)).toBe(b)
    expect(pickDagensKnute([a, b, c], 2)).toBe(c)
    expect(pickDagensKnute([a, b, c], 4)).toBe(b) // 4 % 3 = 1
  })

  it('is input-order independent (sorts by id, not arrival order)', () => {
    expect(pickDagensKnute([c, a, b], 0)).toBe(a)
    expect(pickDagensKnute([b, c, a], 0)).toBe(a)
  })

  it('a single-knute pool always yields that knute', () => {
    expect(pickDagensKnute([b], 20260724)).toBe(b)
    expect(pickDagensKnute([b], 20270517)).toBe(b)
  })

  it('consecutive days walk the pool', () => {
    // Realistic YYYYMMDD seeds one day apart differ by 1 → adjacent picks.
    const first = pickDagensKnute([a, b, c], 20260723)
    const second = pickDagensKnute([a, b, c], 20260724)
    expect(first).not.toBe(second)
  })
})
