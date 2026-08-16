import type { Context } from '@deepseek-ai/cordis'
import { ForkDiff } from './ForkDiff.tsx'
import type {
  ConnectionFace, SessionId, SessionsFace, SlotsFace,
} from './contract.ts'
import { diffUnits } from './diff.ts'
import { loadCompleteHistory } from './history.ts'
import { findComparisonCandidates } from './lineage.ts'
import { createTranslate } from './locales.ts'
import { normalizeHistory } from './normalize.ts'
import { installStyles } from './styles.ts'
import { diffText } from './text-diff.ts'

export const name = 'dsh-fork-diff'
export const inject = ['connection', 'sessions', 'slots']

export function apply(ctx: Context): void {
  const connection = ctx.get('connection') as ConnectionFace
  const sessions = ctx.get('sessions') as SessionsFace
  const slots = ctx.get('slots') as SlotsFace
  const t = createTranslate()

  ctx.effect(() => installStyles(), 'dsh-fork-diff: stylesheet')

  slots.inject('conversation.session.header.actions', () => slots.register({
    name: 'conversation.session.header.actions',
    id: 'fork-diff',
    order: 16,
    registrant: name,
    inject: (sessionId: string) => ({
      sessionId,
      hooks: { sessionList: sessions.list },
      open: (id: SessionId) => { sessions.open(id) },
      loadHistory: (id: SessionId, signal: AbortSignal) => loadCompleteHistory(
        connection.api.sessions,
        id,
        signal,
      ),
      t,
    }),
  }, ForkDiff))
}

export type { ForkDiffProps } from './ForkDiff.tsx'
export type {
  ComparisonCandidate, ComparisonUnit, DiffResult, DiffRow, DiffStatus,
  NormalizedHistory, SessionMetrics, UnitKind,
} from './types.ts'
export { diffText, diffUnits, findComparisonCandidates, loadCompleteHistory, normalizeHistory }
