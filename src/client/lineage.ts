import type { SessionId, SessionListState, SessionSummary } from './contract.ts'
import type { CandidateRelation, ComparisonCandidate } from './types.ts'

function eligible(summary: SessionSummary | undefined, currentId: SessionId): summary is SessionSummary {
  return summary !== undefined
    && summary.id !== currentId
    && summary.origin !== 'subagent'
    && !summary.blank
}

/** Related user-created forks, ordered sibling → parent → child and host-list stable. */
export function findComparisonCandidates(
  state: Pick<SessionListState, 'ids' | 'byId'>,
  currentId: SessionId,
): readonly ComparisonCandidate[] {
  const current = state.byId[currentId]
  if (current === undefined || current.origin === 'subagent') return []

  const rows: Array<{ summary: SessionSummary; relation: CandidateRelation }> = []
  const seen = new Set<string>()
  const add = (summary: SessionSummary | undefined, relation: CandidateRelation): void => {
    if (!eligible(summary, currentId) || seen.has(summary.id)) return
    seen.add(summary.id)
    rows.push({ summary, relation })
  }

  if (current.parentId !== undefined) {
    for (const id of state.ids) {
      const summary = state.byId[id]
      if (summary?.parentId === current.parentId) add(summary, 'sibling')
    }
    add(state.byId[current.parentId], 'parent')
  }

  for (const id of state.ids) {
    const summary = state.byId[id]
    if (summary?.parentId === currentId) add(summary, 'child')
  }

  return rows.map(({ summary, relation }) => ({
    id: summary.id,
    title: summary.displayTitle,
    relation,
    running: summary.running,
  }))
}
