import { describe, expect, it } from 'vitest'
import type { SessionListState, SessionSummary } from '../src/client/contract.ts'
import { findComparisonCandidates } from '../src/client/lineage.ts'
import { id } from './fixtures.ts'

function row(value: string, parent?: string, options: Partial<SessionSummary> = {}): SessionSummary {
  return {
    id: id(value),
    displayTitle: value,
    running: false,
    blank: false,
    updatedAt: 1,
    ...(parent === undefined ? {} : { parentId: id(parent) }),
    ...options,
  }
}

describe('findComparisonCandidates', () => {
  it('orders siblings before parent and children while preserving host order', () => {
    const rows = [
      row('root'), row('sibling-b', 'root'), row('current', 'root'), row('sibling-a', 'root'),
      row('child-b', 'current'), row('child-a', 'current'),
    ]
    const state: Pick<SessionListState, 'ids' | 'byId'> = {
      ids: rows.map(value => value.id),
      byId: Object.fromEntries(rows.map(value => [value.id, value])),
    }
    expect(findComparisonCandidates(state, id('current')).map(value => [value.id, value.relation])).toEqual([
      ['sibling-b', 'sibling'],
      ['sibling-a', 'sibling'],
      ['root', 'parent'],
      ['child-b', 'child'],
      ['child-a', 'child'],
    ])
  })

  it('excludes blank and subagent rows and refuses a subagent focus', () => {
    const rows = [
      row('root'),
      row('current', 'root'),
      row('blank', 'root', { blank: true }),
      row('subagent', 'root', { origin: 'subagent' }),
    ]
    const state = {
      ids: rows.map(value => value.id),
      byId: Object.fromEntries(rows.map(value => [value.id, value])),
    }
    expect(findComparisonCandidates(state, id('current')).map(value => value.id)).toEqual(['root'])
    expect(findComparisonCandidates(state, id('subagent'))).toEqual([])
  })

  it('returns no candidates for an unknown focus', () => {
    expect(findComparisonCandidates({ ids: [], byId: {} }, id('missing'))).toEqual([])
  })
})
