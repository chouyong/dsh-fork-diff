import type {
  HistoryEntry, SessionEvent, SessionHistoryApi, SessionId,
} from './contract.ts'

export const HISTORY_PAGE_MESSAGES = 50
const DEFAULT_MAX_PAGES = 1_000

export class HistoryLoadError extends Error {
  constructor(
    message: string,
    readonly code: 'rpc' | 'invalid-page' | 'no-progress' | 'page-limit',
  ) {
    super(message)
    this.name = 'HistoryLoadError'
  }
}

export interface LoadHistoryOptions {
  readonly maxPages?: number
  readonly pageMessages?: number
}

/** Read an entire session without opening it, walking message-aligned pages backwards. */
export async function loadCompleteHistory(
  api: SessionHistoryApi,
  sessionId: SessionId,
  signal?: AbortSignal,
  options: LoadHistoryOptions = {},
): Promise<readonly SessionEvent[]> {
  const maxPages = options.maxPages ?? DEFAULT_MAX_PAGES
  const pageMessages = options.pageMessages ?? HISTORY_PAGE_MESSAGES
  if (!Number.isSafeInteger(maxPages) || maxPages < 1) {
    throw new HistoryLoadError('maxPages must be a positive safe integer', 'page-limit')
  }
  if (!Number.isSafeInteger(pageMessages) || pageMessages < 1) {
    throw new HistoryLoadError('pageMessages must be a positive safe integer', 'invalid-page')
  }

  const pages: HistoryEntry[][] = []
  const seen = new Set<number>()
  let beforeSeq: number | undefined

  for (let pageIndex = 0; pageIndex < maxPages; pageIndex++) {
    signal?.throwIfAborted()
    const response = await api.history({
      sessionId,
      maxMessages: pageMessages,
      ...(beforeSeq === undefined ? {} : { beforeSeq }),
    }, signal)
    if (!response.result.ok) {
      throw new HistoryLoadError(
        `${response.result.error.code}: ${response.result.error.message}`,
        'rpc',
      )
    }

    const entries = [...response.result.value.events]
    validatePage(entries, seen, beforeSeq)
    pages.unshift(entries)

    if (!response.result.value.hasMore) {
      const events = pages.flatMap(page => page.map(entry => entry.event))
      validateCompleteSequence(events)
      return events
    }
    if (entries.length === 0) {
      throw new HistoryLoadError('history reported hasMore with an empty page', 'no-progress')
    }

    const nextBefore = entries[0]?.event.seq
    if (nextBefore === undefined || (beforeSeq !== undefined && nextBefore >= beforeSeq)) {
      throw new HistoryLoadError('history pagination did not move to an older sequence', 'no-progress')
    }
    beforeSeq = nextBefore
  }

  throw new HistoryLoadError(`history exceeded the ${String(maxPages)} page safety limit`, 'page-limit')
}

function validatePage(
  entries: readonly HistoryEntry[],
  seen: Set<number>,
  beforeSeq: number | undefined,
): void {
  let previous = -1
  for (const entry of entries) {
    const { seq, time, type } = entry.event
    if (!Number.isSafeInteger(seq) || seq < 0 || !Number.isFinite(time) || typeof type !== 'string' || type === '') {
      throw new HistoryLoadError('history page contains an invalid event envelope', 'invalid-page')
    }
    if (seq <= previous) {
      throw new HistoryLoadError('history page event sequences are not strictly increasing', 'invalid-page')
    }
    if (beforeSeq !== undefined && seq >= beforeSeq) {
      throw new HistoryLoadError('history page crossed its beforeSeq boundary', 'invalid-page')
    }
    if (seen.has(seq)) {
      throw new HistoryLoadError(`history repeated event sequence ${String(seq)}`, 'no-progress')
    }
    seen.add(seq)
    previous = seq
  }
}

function validateCompleteSequence(events: readonly SessionEvent[]): void {
  for (let index = 0; index < events.length; index++) {
    if (events[index]?.seq !== index) {
      throw new HistoryLoadError(
        `complete history is not contiguous at index ${String(index)}`,
        'invalid-page',
      )
    }
  }
}
