import { describe, expect, it } from 'vitest'
import { diffText } from '../src/client/text-diff.ts'

describe('diffText', () => {
  it('marks only removed and added lines', () => {
    const value = diffText('same\nleft\ntail', 'same\nright\ntail')
    expect(value.left.map(line => line.changed)).toEqual([false, true, false])
    expect(value.right.map(line => line.changed)).toEqual([false, true, false])
    expect(value.approximate).toBe(false)
  })

  it('declares fast highlighting for very large bodies', () => {
    const left = Array.from({ length: 201 }, (_, index) => `l${String(index)}`).join('\n')
    const right = Array.from({ length: 201 }, (_, index) => `r${String(index)}`).join('\n')
    expect(diffText(left, right).approximate).toBe(true)
  })
})
