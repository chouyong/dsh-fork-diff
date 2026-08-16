import {
  useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent,
} from 'react'
import { createPortal } from 'react-dom'
import type { SnapshotSelectorHook } from '@deepseek-ai/dsh-client-ui-slots'
import { IconBranchOutline16, IconCloseOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'
import { SessionId, type SessionEvent, type SessionListState } from './contract.ts'
import { diffUnits } from './diff.ts'
import { findComparisonCandidates } from './lineage.ts'
import type { Translate } from './locales.ts'
import { normalizeHistory } from './normalize.ts'
import { CSS_PREFIX } from './styles.ts'
import { diffText } from './text-diff.ts'
import type {
  ComparisonCandidate, DiffResult, DiffRow, NormalizedHistory, SessionMetrics,
} from './types.ts'

export interface ForkDiffProps {
  readonly sessionId: string
  readonly useSessionList: SnapshotSelectorHook<SessionListState>
  readonly open: (id: SessionId) => void
  readonly loadHistory: (id: SessionId, signal: AbortSignal) => Promise<readonly SessionEvent[]>
  readonly t: Translate
}

interface LoadedComparison {
  readonly left: NormalizedHistory
  readonly right: NormalizedHistory
  readonly diff: DiffResult
}

type LoadState =
  | { readonly status: 'idle' | 'loading' }
  | { readonly status: 'error'; readonly message: string }
  | { readonly status: 'ready'; readonly value: LoadedComparison }

export function ForkDiff({ sessionId, useSessionList, open, loadHistory, t }: ForkDiffProps) {
  const ids = useSessionList(state => state.ids)
  const byId = useSessionList(state => state.byId)
  const current = useSessionList(state => state.current)
  const candidates = useMemo(
    () => findComparisonCandidates({ ids, byId }, SessionId(sessionId)),
    [ids, byId, sessionId],
  )
  const [openPanel, setOpenPanel] = useState(false)
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const [filter, setFilter] = useState<'changes' | 'all'>('changes')
  const [retry, setRetry] = useState(0)
  const [loadState, setLoadState] = useState<LoadState>({ status: 'idle' })
  const triggerRef = useRef<HTMLButtonElement>(null)

  const selected = candidates.find(candidate => candidate.id === selectedId) ?? candidates[0]
  const selectedSessionId = selected?.id

  useEffect(() => {
    if (candidates.length > 0 || !openPanel) return
    setOpenPanel(false)
  }, [candidates.length, openPanel])

  useEffect(() => {
    if (!openPanel || selectedSessionId === undefined) return
    const controller = new AbortController()
    setLoadState({ status: 'loading' })
    void Promise.all([
      loadHistory(SessionId(sessionId), controller.signal),
      loadHistory(selectedSessionId, controller.signal),
    ]).then(([leftEvents, rightEvents]) => {
      if (controller.signal.aborted) return
      const left = normalizeHistory(leftEvents)
      const right = normalizeHistory(rightEvents)
      setLoadState({
        status: 'ready',
        value: { left, right, diff: diffUnits(left.units, right.units) },
      })
    }, (error: unknown) => {
      if (controller.signal.aborted) return
      setLoadState({ status: 'error', message: errorMessage(error) })
    })
    return () => { controller.abort() }
  }, [loadHistory, openPanel, retry, selectedSessionId, sessionId])

  if (candidates.length === 0) return null

  const close = (): void => {
    setOpenPanel(false)
    queueMicrotask(() => { triggerRef.current?.focus() })
  }

  return (
    <div className={CSS_PREFIX}>
      <button
        ref={triggerRef}
        type="button"
        className={`${CSS_PREFIX}__trigger`}
        aria-haspopup="dialog"
        aria-expanded={openPanel}
        onClick={() => { setOpenPanel(value => !value) }}
      >
        <IconBranchOutline16 size={16} />
        <span>{t('trigger')}</span>
      </button>
      {openPanel && selected !== undefined && typeof document !== 'undefined'
        ? createPortal(
            <DiffDialog
              sessionId={SessionId(sessionId)}
              currentId={current}
              currentTitle={byId[sessionId]?.displayTitle ?? sessionId}
              selected={selected}
              candidates={candidates}
              filter={filter}
              loadState={loadState}
              t={t}
              onClose={close}
              onFilter={setFilter}
              onSelect={(event) => { setSelectedId(event.target.value) }}
              onRetry={() => { setRetry(value => value + 1) }}
              onOpen={(id) => {
                close()
                open(id)
              }}
            />,
            document.body,
          )
        : null}
    </div>
  )
}

interface DiffDialogProps {
  readonly sessionId: SessionId
  readonly currentId: SessionId | undefined
  readonly currentTitle: string
  readonly selected: ComparisonCandidate
  readonly candidates: readonly ComparisonCandidate[]
  readonly filter: 'changes' | 'all'
  readonly loadState: LoadState
  readonly t: Translate
  readonly onClose: () => void
  readonly onFilter: (filter: 'changes' | 'all') => void
  readonly onSelect: (event: ChangeEvent<HTMLSelectElement>) => void
  readonly onRetry: () => void
  readonly onOpen: (id: SessionId) => void
}

function DiffDialog(props: DiffDialogProps) {
  const {
    sessionId, currentId, currentTitle, selected, candidates, filter, loadState, t,
    onClose, onFilter, onSelect, onRetry, onOpen,
  } = props
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const frame = requestAnimationFrame(() => { closeRef.current?.focus() })
    return () => {
      cancelAnimationFrame(frame)
      document.body.style.overflow = previous
    }
  }, [])

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
      return
    }
    if (event.key !== 'Tab') return
    const focusable = focusableElements(dialogRef.current)
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last?.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first?.focus()
    }
  }

  const comparison = loadState.status === 'ready' ? loadState.value : undefined
  const rows = comparison === undefined
    ? []
    : comparison.diff.rows.filter(row => filter === 'all' || row.status !== 'same')

  return (
    <div
      className={`${CSS_PREFIX}__backdrop`}
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}
    >
      <div
        ref={dialogRef}
        className={`${CSS_PREFIX}__dialog`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dsh-fork-diff-title"
        onKeyDown={onKeyDown}
      >
        <div className={`${CSS_PREFIX}__topbar`}>
          <h2 id="dsh-fork-diff-title" className={`${CSS_PREFIX}__title`}>{t('dialog.title')}</h2>
          <button
            ref={closeRef}
            type="button"
            className={`${CSS_PREFIX}__icon-button`}
            aria-label={t('dialog.close')}
            title={t('dialog.close')}
            onClick={onClose}
          >
            <IconCloseOutline16 size={16} />
          </button>
        </div>
        <div className={`${CSS_PREFIX}__controls`}>
          <label className={`${CSS_PREFIX}__field`}>
            <span>{t('dialog.compareWith')}</span>
            <select className={`${CSS_PREFIX}__select`} value={selected.id} onChange={onSelect}>
              {candidates.map(candidate => (
                <option key={candidate.id} value={candidate.id}>
                  {t(`relation.${candidate.relation}`)} · {candidate.title}
                </option>
              ))}
            </select>
          </label>
          <div className={`${CSS_PREFIX}__segments`} aria-label="Diff filter">
            <button
              type="button"
              className={segmentClass(filter === 'changes')}
              aria-pressed={filter === 'changes'}
              onClick={() => { onFilter('changes') }}
            >{t('filter.changes')}</button>
            <button
              type="button"
              className={segmentClass(filter === 'all')}
              aria-pressed={filter === 'all'}
              onClick={() => { onFilter('all') }}
            >{t('filter.all')}</button>
          </div>
        </div>
        <div className={`${CSS_PREFIX}__content`} aria-live="polite">
          {comparison === undefined
            ? <LoadStatus state={loadState} t={t} onRetry={onRetry} />
            : (
              <>
                <div className={`${CSS_PREFIX}__branches`}>
                  <BranchHeader
                    id={sessionId}
                    title={currentTitle}
                    current={currentId === sessionId}
                    metrics={comparison.left.metrics}
                    t={t}
                    onOpen={onOpen}
                  />
                  <BranchHeader
                    id={selected.id}
                    title={selected.title}
                    current={currentId === selected.id}
                    metrics={comparison.right.metrics}
                    t={t}
                    onOpen={onOpen}
                  />
                </div>
                <ComparisonNotices value={comparison} />
                {rows.length === 0
                  ? <div className={`${CSS_PREFIX}__state`}>{t('state.empty')}</div>
                  : <div className={`${CSS_PREFIX}__rows`}>{rows.map(row => <DiffRowView key={row.id} row={row} t={t} />)}</div>}
              </>
            )}
        </div>
      </div>
    </div>
  )
}

function LoadStatus({ state, t, onRetry }: { readonly state: LoadState; readonly t: Translate; readonly onRetry: () => void }) {
  if (state.status !== 'error') return <div className={`${CSS_PREFIX}__state`}>{t('state.loading')}</div>
  return (
    <div className={`${CSS_PREFIX}__state`} role="alert">
      <div>{state.message}</div>
      <button type="button" className={`${CSS_PREFIX}__retry`} onClick={onRetry}>{t('state.retry')}</button>
    </div>
  )
}

function BranchHeader(props: {
  readonly id: SessionId
  readonly title: string
  readonly current: boolean
  readonly metrics: SessionMetrics
  readonly t: Translate
  readonly onOpen: (id: SessionId) => void
}) {
  const { id, title, current, metrics, t, onOpen } = props
  return (
    <section className={`${CSS_PREFIX}__branch`} aria-label={title}>
      <div className={`${CSS_PREFIX}__branch-name-row`}>
        <span className={`${CSS_PREFIX}__branch-name`} title={title}>{title}</span>
        {current ? <span className={`${CSS_PREFIX}__tag`}>{t('dialog.current')}</span> : null}
      </div>
      <div className={`${CSS_PREFIX}__metrics`}>
        <span>{metrics.userMessages} 用户</span>
        <span>{metrics.assistantMessages} 回答</span>
        <span>{metrics.toolCalls} 工具</span>
        <span>{formatDuration(metrics.durationMs)}</span>
        <span>{metrics.inputTokens + metrics.outputTokens} tokens</span>
      </div>
      <button type="button" className={`${CSS_PREFIX}__command`} onClick={() => { onOpen(id) }}>
        <IconBranchOutline16 size={16} />
        <span>{t('dialog.openSession')}</span>
      </button>
    </section>
  )
}

function ComparisonNotices({ value }: { readonly value: LoadedComparison }) {
  const unsupported = [...new Set([
    ...value.left.unsupportedRequiredTypes,
    ...value.right.unsupportedRequiredTypes,
  ])]
  const messages: string[] = []
  if (value.diff.approximate) messages.push('历史较大，结构对齐使用快速模式。')
  if (unsupported.length > 0) messages.push(`未渲染的必需事件类型：${unsupported.join('、')}`)
  if (messages.length === 0) return null
  return <div className={`${CSS_PREFIX}__notice`}>{messages.join(' ')}</div>
}

function DiffRowView({ row, t }: { readonly row: DiffRow; readonly t: Translate }) {
  const bodyDiff = diffText(row.left?.body ?? '', row.right?.body ?? '')
  return (
    <article className={`${CSS_PREFIX}__row ${CSS_PREFIX}__row--${row.status}`}>
      <div className={`${CSS_PREFIX}__row-head`}>
        <span className={`${CSS_PREFIX}__row-kind`}>{kindLabel(row)}</span>
        <span>{t(`status.${row.status}`)}</span>
        {bodyDiff.approximate ? <span>长文本快速高亮</span> : null}
      </div>
      <DiffCell unit={row.left} lines={bodyDiff.left} side="left" />
      <DiffCell unit={row.right} lines={bodyDiff.right} side="right" />
    </article>
  )
}

function DiffCell(props: {
  readonly unit: DiffRow['left']
  readonly lines: ReturnType<typeof diffText>['left']
  readonly side: 'left' | 'right'
}) {
  const { unit, lines, side } = props
  if (unit === undefined) return <div className={`${CSS_PREFIX}__cell ${CSS_PREFIX}__cell--empty`}>—</div>
  return (
    <div className={`${CSS_PREFIX}__cell`}>
      <div className={`${CSS_PREFIX}__cell-title`}>
        {unit.title}{unit.turn === undefined ? '' : ` · Turn ${String(unit.turn)}`}
      </div>
      <pre className={`${CSS_PREFIX}__pre`}>
        {lines.map((line, index) => (
          <span
            key={`${String(index)}:${line.text}`}
            className={`${CSS_PREFIX}__line${line.changed ? ` ${CSS_PREFIX}__line--${side === 'left' ? 'removed' : 'added'}` : ''}`}
          >{line.text || ' '}</span>
        ))}
      </pre>
    </div>
  )
}

function segmentClass(active: boolean): string {
  return `${CSS_PREFIX}__segment${active ? ` ${CSS_PREFIX}__segment--active` : ''}`
}

function kindLabel(row: DiffRow): string {
  const unit = row.left ?? row.right
  return unit?.title ?? row.kind
}

function formatDuration(value: number | undefined): string {
  if (value === undefined) return '耗时 —'
  if (value < 1_000) return `${String(Math.round(value))} ms`
  if (value < 60_000) return `${(value / 1_000).toFixed(1)} s`
  return `${Math.floor(value / 60_000)}m ${Math.round(value % 60_000 / 1_000)}s`
}

function focusableElements(root: HTMLElement | null): HTMLElement[] {
  if (root === null) return []
  return [...root.querySelectorAll<HTMLElement>(
    'button:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
  )].filter(element => element.offsetParent !== null)
}

function errorMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === 'AbortError') return '历史读取已取消。'
  return error instanceof Error ? error.message : '读取历史失败。'
}
