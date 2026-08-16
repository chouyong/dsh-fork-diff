import { describe, expect, it, vi } from 'vitest'
import type { SessionHistoryApi } from '../src/client/contract.ts'
import { HistoryLoadError, loadCompleteHistory } from '../src/client/history.ts'
import { event, failure, id, page } from './fixtures.ts'

describe('loadCompleteHistory', () => {
  it('prepends older message-aligned pages and forwards beforeSeq', async () => {
    const calls: unknown[] = []
    const api: SessionHistoryApi = {
      async history(payload) {
        calls.push(payload)
        return payload.beforeSeq === undefined
          ? page([event(2, 'turn/start', { turn: 2 }), event(3, 'turn/end', { turn: 2 })], true)
          : page([event(0, 'turn/start', { turn: 1 }), event(1, 'turn/end', { turn: 1 })])
      },
    }
    const result = await loadCompleteHistory(api, id('session'))
    expect(result.map(value => value.seq)).toEqual([0, 1, 2, 3])
    expect(calls).toEqual([
      { sessionId: 'session', maxMessages: 50 },
      { sessionId: 'session', maxMessages: 50, beforeSeq: 2 },
    ])
  })

  it('surfaces RPC failures with their code', async () => {
    const api: SessionHistoryApi = { history: vi.fn(async () => failure('denied', 'not readable')) }
    await expect(loadCompleteHistory(api, id('session'))).rejects.toMatchObject({
      name: 'HistoryLoadError', code: 'rpc', message: 'denied: not readable',
    })
  })

  it('fails closed when hasMore makes no progress', async () => {
    const api: SessionHistoryApi = { history: vi.fn(async () => page([], true)) }
    await expect(loadCompleteHistory(api, id('session'))).rejects.toMatchObject({ code: 'no-progress' })
  })

  it('rejects non-contiguous complete history', async () => {
    const api: SessionHistoryApi = { history: vi.fn(async () => page([event(1, 'turn/start', { turn: 1 })])) }
    await expect(loadCompleteHistory(api, id('session'))).rejects.toMatchObject({ code: 'invalid-page' })
  })

  it('enforces the page safety limit', async () => {
    const api: SessionHistoryApi = {
      history: vi.fn(async payload => page([event((payload.beforeSeq ?? 3) - 1, 'turn/start', { turn: 1 })], true)),
    }
    await expect(loadCompleteHistory(api, id('session'), undefined, { maxPages: 2 })).rejects.toBeInstanceOf(HistoryLoadError)
  })

  it('honors an already-aborted signal before the request', async () => {
    const controller = new AbortController()
    controller.abort()
    const history = vi.fn(async () => page([]))
    await expect(loadCompleteHistory({ history }, id('session'), controller.signal)).rejects.toMatchObject({ name: 'AbortError' })
    expect(history).not.toHaveBeenCalled()
  })
})
