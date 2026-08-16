import type { Branded } from '@deepseek-ai/dsh-brand'
import type { HostObservable, SlotCore } from '@deepseek-ai/dsh-client-ui-slots'

export type SessionId = Branded<'SessionId'>

export function SessionId(id: string): SessionId {
  return id as SessionId
}

export interface SessionSummary {
  readonly id: SessionId
  readonly displayTitle: string
  readonly title?: string
  readonly parentId?: SessionId
  readonly origin?: 'subagent'
  readonly running: boolean
  readonly blank: boolean
  readonly updatedAt: number
}

export interface SessionListState {
  readonly ids: readonly SessionId[]
  readonly byId: Readonly<Record<string, SessionSummary>>
  readonly current: SessionId | undefined
}

export interface SessionsFace {
  readonly list: HostObservable<SessionListState>
  open(id: SessionId): void
}

export interface RpcError {
  readonly code: string
  readonly message: string
  readonly details?: unknown
}

export type RpcResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: RpcError }

export interface RpcResponse<T> {
  readonly result: RpcResult<T>
}

export interface SessionEvent {
  readonly type: string
  readonly seq: number
  readonly time: number
  readonly data: unknown
  readonly ignorable?: true
  readonly sourceEventSeqs?: readonly number[]
  readonly surfaceOp?: 'append' | { readonly op: 'replace'; readonly start: number; readonly end: number }
}

export interface HistoryEntry {
  readonly event: SessionEvent
  readonly view?: unknown
}

export interface HistoryPage {
  readonly events: readonly HistoryEntry[]
  readonly hasMore: boolean
  readonly projections?: unknown
}

export interface SessionHistoryApi {
  history(
    payload: { readonly sessionId: SessionId; readonly beforeSeq?: number; readonly maxMessages?: number },
    signal?: AbortSignal,
  ): Promise<RpcResponse<HistoryPage>>
}

export interface ConnectionFace {
  readonly api: {
    readonly sessions: SessionHistoryApi
  }
}

export type SlotInjectionEffect = () => void

export interface SlotsFace {
  readonly register: SlotCore['register']
  inject(key: 'conversation.session.header.actions', callback: () => SlotInjectionEffect): () => void
}

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface SlotMap {
    'conversation.session.header.actions': {
      kind: 'list'
      scope: 'session'
      owner: ConversationHeaderActionOwnerProps
    }
  }
}

export interface ConversationHeaderActionOwnerProps {}
