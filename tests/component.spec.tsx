// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SnapshotSelectorHook } from '@deepseek-ai/dsh-client-ui-slots'
import { ForkDiff } from '../src/client/ForkDiff.tsx'
import type { SessionListState } from '../src/client/contract.ts'
import { SessionId } from '../src/client/contract.ts'
import { createTranslate } from '../src/client/locales.ts'
import { event, id, textMessage } from './fixtures.ts'

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  document.documentElement.lang = 'zh-CN'
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => window.setTimeout(() => { callback(0) }, 0))
  vi.stubGlobal('cancelAnimationFrame', (handle: number) => { clearTimeout(handle) })
})

afterEach(async () => {
  await act(async () => { root.unmount() })
  document.body.replaceChildren()
  vi.unstubAllGlobals()
})

describe('ForkDiff', () => {
  it('renders only with a related branch, loads both histories, and closes with Escape', async () => {
    const state: SessionListState = {
      ids: [id('parent'), id('left'), id('right')],
      byId: {
        parent: { id: id('parent'), displayTitle: 'Parent', running: false, blank: false, updatedAt: 1 },
        left: { id: id('left'), displayTitle: 'Left', parentId: id('parent'), running: false, blank: false, updatedAt: 2 },
        right: { id: id('right'), displayTitle: 'Right', parentId: id('parent'), running: false, blank: false, updatedAt: 3 },
      },
      current: id('left'),
    }
    const useSessionList = ((selector: (value: SessionListState) => unknown) => selector(state)) as SnapshotSelectorHook<SessionListState>
    const histories = {
      left: [event(0, 'user/message', textMessage('same'), { surfaceOp: 'append' }), event(1, 'assistant/message', { turn: 1, step: 1, message: textMessage('left') }, { surfaceOp: 'append' })],
      right: [event(0, 'user/message', textMessage('same'), { surfaceOp: 'append' }), event(1, 'assistant/message', { turn: 1, step: 1, message: textMessage('right') }, { surfaceOp: 'append' })],
    }
    const loadHistory = vi.fn(async (sessionId: SessionId) => histories[sessionId as keyof typeof histories] ?? [])

    await act(async () => {
      root.render(<ForkDiff
        sessionId="left"
        useSessionList={useSessionList}
        open={vi.fn()}
        loadHistory={loadHistory}
        t={createTranslate()}
      />)
    })
    const trigger = container.querySelector('button')
    expect(trigger?.textContent).toContain('比较分支')
    await act(async () => { trigger?.click() })
    await act(async () => { await Promise.resolve() })
    expect(document.querySelector('[role="dialog"]')).not.toBeNull()
    expect(loadHistory).toHaveBeenCalledTimes(2)
    expect(document.body.textContent).toContain('left')
    expect(document.body.textContent).toContain('right')
    await act(async () => {
      document.querySelector('[role="dialog"]')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    })
    expect(document.querySelector('[role="dialog"]')).toBeNull()
    expect(document.activeElement).toBe(trigger)
  })

  it('renders nothing without a related fork', async () => {
    const state: SessionListState = {
      ids: [id('only')],
      byId: { only: { id: id('only'), displayTitle: 'Only', running: false, blank: false, updatedAt: 1 } },
      current: id('only'),
    }
    const useSessionList = ((selector: (value: SessionListState) => unknown) => selector(state)) as SnapshotSelectorHook<SessionListState>
    await act(async () => {
      root.render(<ForkDiff
        sessionId="only"
        useSessionList={useSessionList}
        open={vi.fn()}
        loadHistory={vi.fn(async () => [])}
        t={createTranslate()}
      />)
    })
    expect(container.textContent).toBe('')
  })
})
