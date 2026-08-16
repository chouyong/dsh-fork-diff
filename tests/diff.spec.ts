import { describe, expect, it } from 'vitest'
import { diffUnits } from '../src/client/diff.ts'
import type { ComparisonUnit, UnitKind } from '../src/client/types.ts'

function unit(id: string, kind: UnitKind, body = id): ComparisonUnit {
  return {
    id,
    seq: Number(id.replace(/\D/g, '')) || 0,
    time: 1,
    kind,
    title: kind,
    body,
    fingerprint: JSON.stringify([kind, body]),
  }
}

describe('diffUnits', () => {
  it('keeps the exact prefix and pairs same-kind divergence as changed', () => {
    const left = [unit('u0', 'user', 'shared'), unit('a1', 'assistant', 'left answer'), unit('t2', 'tool-call', 'left tool')]
    const right = [unit('u0r', 'user', 'shared'), unit('a1r', 'assistant', 'right answer'), unit('u2r', 'user', 'extra')]
    const value = diffUnits(left, right)
    expect(value.commonPrefixUnits).toBe(1)
    expect(value.rows.map(row => row.status)).toEqual(['same', 'changed', 'left-only', 'right-only'])
    expect(value.counts).toEqual({ same: 1, changed: 1, 'left-only': 1, 'right-only': 1 })
    expect(value.approximate).toBe(false)
  })

  it('uses an increasing exact match to anchor insertions', () => {
    const left = [unit('a0', 'assistant', 'A'), unit('a1', 'assistant', 'B')]
    const right = [unit('u0', 'user', 'new'), unit('a0r', 'assistant', 'A'), unit('a1r', 'assistant', 'B')]
    expect(diffUnits(left, right).rows.map(row => row.status)).toEqual(['right-only', 'same', 'same'])
  })

  it('declares the bounded fast path for a large divergent middle', () => {
    const left = Array.from({ length: 700 }, (_, index) => unit(`l${String(index)}`, 'assistant', `left-${String(index)}`))
    const right = Array.from({ length: 700 }, (_, index) => unit(`r${String(index)}`, 'assistant', `right-${String(index)}`))
    expect(diffUnits(left, right).approximate).toBe(true)
  })

  it('finishes the fast path when a repeated fingerprint exhausts its right-side matches', () => {
    const left = Array.from({ length: 700 }, (_, index) => unit(`l${String(index)}`, 'assistant', 'repeated'))
    const right = Array.from({ length: 700 }, (_, index) => unit(
      `r${String(index)}`,
      'assistant',
      index === 1 ? 'repeated' : `right-${String(index)}`,
    ))

    const value = diffUnits(left, right)
    expect(value.approximate).toBe(true)
    expect(value.counts.same).toBe(1)
    expect(value.rows).toHaveLength(701)
  })
})
