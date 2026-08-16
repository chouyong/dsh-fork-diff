import type { HistoryEntry, HistoryPage, RpcResponse, SessionEvent, SessionId } from '../src/client/contract.ts'

export function event(
  seq: number,
  type: string,
  data: unknown,
  extra: Partial<SessionEvent> = {},
): SessionEvent {
  return { type, seq, time: 1_000 + seq * 100, data, ...extra }
}

export function entry(value: SessionEvent): HistoryEntry {
  return { event: value }
}

export function page(events: readonly SessionEvent[], hasMore = false): RpcResponse<HistoryPage> {
  return { result: { ok: true, value: { events: events.map(entry), hasMore } } }
}

export function failure(code = 'session-not-found', message = 'missing'): RpcResponse<HistoryPage> {
  return { result: { ok: false, error: { code, message } } }
}

export function id(value: string): SessionId {
  return value as SessionId
}

export function textMessage(text: string): { readonly content: readonly [{ readonly type: 'text'; readonly text: string }] } {
  return { content: [{ type: 'text', text }] }
}
