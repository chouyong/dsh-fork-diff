import type { SessionId, SessionEvent } from './contract.ts'

export type CandidateRelation = 'sibling' | 'parent' | 'child'

export interface ComparisonCandidate {
  readonly id: SessionId
  readonly title: string
  readonly relation: CandidateRelation
  readonly running: boolean
}

export type UnitKind = 'user' | 'assistant' | 'tool-call' | 'tool-result'

export interface ComparisonUnit {
  readonly id: string
  readonly seq: number
  readonly turn?: number
  readonly step?: number
  readonly time: number
  readonly kind: UnitKind
  readonly title: string
  readonly body: string
  readonly fingerprint: string
  readonly error?: boolean
}

export interface NormalizedHistory {
  readonly events: readonly SessionEvent[]
  readonly units: readonly ComparisonUnit[]
  readonly unsupportedRequiredTypes: readonly string[]
  readonly metrics: SessionMetrics
}

export interface SessionMetrics {
  readonly userMessages: number
  readonly assistantMessages: number
  readonly toolCalls: number
  readonly toolErrors: number
  readonly durationMs: number | undefined
  readonly inputTokens: number
  readonly outputTokens: number
  readonly cacheReadTokens: number
  readonly reasoningTokens: number
}

export type DiffStatus = 'same' | 'changed' | 'left-only' | 'right-only'

export interface DiffRow {
  readonly id: string
  readonly status: DiffStatus
  readonly kind: UnitKind
  readonly left?: ComparisonUnit
  readonly right?: ComparisonUnit
}

export interface DiffResult {
  readonly rows: readonly DiffRow[]
  readonly approximate: boolean
  readonly commonPrefixUnits: number
  readonly counts: Readonly<Record<DiffStatus, number>>
}
