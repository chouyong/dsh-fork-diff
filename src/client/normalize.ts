import type { SessionEvent } from './contract.ts'
import type {
  ComparisonUnit, NormalizedHistory, SessionMetrics, UnitKind,
} from './types.ts'

type UnknownRecord = Readonly<Record<string, unknown>>

const CORE_EVENT_TYPES = new Set([
  'turn/start',
  'turn/end',
  'step/start',
  'step/end',
  'user/message',
  'assistant/chunk',
  'assistant/message',
  'tool/call',
  'tool/result',
  'todo/write',
  'request/header',
  'request/context',
  'session/end-seed',
  'session/title',
])

const KNOWN_NON_COMPARISON_EVENT_TYPES = new Set([
  'agent/inbox/spliced',
  'approval/policy',
  'permission/preset',
  'sandbox/mode',
  'session/title-llm-request',
])

const SURFACE_TYPES = new Set(['user/message', 'assistant/message', 'tool/result'])

export function normalizeHistory(events: readonly SessionEvent[]): NormalizedHistory {
  const visibleSurface = visibleSurfaceSequences(events)
  const units: ComparisonUnit[] = []
  const unsupported = new Set<string>()
  let currentTurn: number | undefined
  let currentStep: number | undefined

  for (const event of events) {
    if (
      !CORE_EVENT_TYPES.has(event.type)
      && !KNOWN_NON_COMPARISON_EVENT_TYPES.has(event.type)
      && event.ignorable !== true
    ) unsupported.add(event.type)
    const data = asRecord(event.data)
    if (event.type === 'turn/start') currentTurn = safeInteger(data?.turn)
    if (event.type === 'step/start') currentStep = safeInteger(data?.step)

    if (SURFACE_TYPES.has(event.type) && !visibleSurface.has(event.seq)) continue
    const unit = unitOf(event, data, currentTurn, currentStep)
    if (unit !== undefined) units.push(unit)

    if (event.type === 'step/end') currentStep = undefined
    if (event.type === 'turn/end') {
      currentTurn = undefined
      currentStep = undefined
    }
  }

  return {
    events,
    units,
    unsupportedRequiredTypes: [...unsupported].sort(),
    metrics: metricsOf(events, units),
  }
}

/** Fold the public surface markers so replaced messages are not shown twice. */
export function visibleSurfaceSequences(events: readonly SessionEvent[]): ReadonlySet<number> {
  const surface: number[] = []
  for (const event of events) {
    if (!SURFACE_TYPES.has(event.type) || event.surfaceOp === undefined) continue
    if (event.surfaceOp === 'append') {
      surface.push(event.seq)
      continue
    }
    const start = surface.indexOf(event.surfaceOp.start)
    const end = surface.indexOf(event.surfaceOp.end)
    if (start < 0 || end < start) continue
    surface.splice(start, end - start + 1, event.seq)
  }
  return new Set(surface)
}

function unitOf(
  event: SessionEvent,
  data: UnknownRecord | undefined,
  currentTurn: number | undefined,
  currentStep: number | undefined,
): ComparisonUnit | undefined {
  switch (event.type) {
    case 'user/message': {
      const source = asRecord(data?.source)
      if (source?.kind !== 'user') return undefined
      const body = contentText(data?.content)
      if (body === '') return undefined
      return makeUnit(event, 'user', '用户消息', body, currentTurn, currentStep)
    }
    case 'assistant/message': {
      const message = asRecord(data?.message)
      const body = contentText(message?.content, { includeReasoning: false, includeToolCalls: false })
      if (body === '') return undefined
      return makeUnit(
        event,
        'assistant',
        '最终回答',
        body,
        safeInteger(data?.turn) ?? currentTurn,
        safeInteger(data?.step) ?? currentStep,
      )
    }
    case 'tool/call': {
      const name = safeString(data?.name) ?? '未知工具'
      const body = formatArguments(safeString(data?.arguments) ?? '')
      return makeUnit(
        event,
        'tool-call',
        name,
        body,
        safeInteger(data?.turn) ?? currentTurn,
        safeInteger(data?.step) ?? currentStep,
      )
    }
    case 'tool/result': {
      const message = asRecord(data?.message)
      const body = contentText(message?.content)
      const isError = message?.isError === true
        || contentHasToolError(message?.content)
        || data?.error !== undefined
      return makeUnit(
        event,
        'tool-result',
        isError ? '工具错误' : '工具结果',
        body,
        safeInteger(data?.turn) ?? currentTurn,
        safeInteger(data?.step) ?? currentStep,
        isError,
      )
    }
    default:
      return undefined
  }
}

function makeUnit(
  event: SessionEvent,
  kind: UnitKind,
  title: string,
  body: string,
  turn: number | undefined,
  step: number | undefined,
  error?: boolean,
): ComparisonUnit {
  const normalizedBody = body.replace(/\r\n/g, '\n').trim()
  return {
    id: `${kind}:${String(event.seq)}`,
    seq: event.seq,
    time: event.time,
    kind,
    title,
    body: normalizedBody,
    fingerprint: JSON.stringify([kind, title, normalizedBody, error === true]),
    ...(turn === undefined ? {} : { turn }),
    ...(step === undefined ? {} : { step }),
    ...(error === undefined ? {} : { error }),
  }
}

interface ContentTextOptions {
  readonly includeReasoning?: boolean
  readonly includeToolCalls?: boolean
}

export function contentText(content: unknown, options: ContentTextOptions = {}): string {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''
  const parts: string[] = []
  for (const value of content) {
    const block = asRecord(value)
    if (block === undefined) continue
    const type = safeString(block.type)
    if (type === 'text') {
      const text = safeString(block.text)
      if (text !== undefined) parts.push(text)
    } else if (type === 'reasoning' && options.includeReasoning === true) {
      const text = safeString(block.text)
      if (text !== undefined) parts.push(text)
    } else if (type === 'tool-call' && options.includeToolCalls === true) {
      const name = safeString(block.name) ?? 'tool'
      parts.push(`${name}(${formatArguments(safeString(block.arguments) ?? '')})`)
    } else if (type === 'tool-result') {
      const text = contentText(block.content, options)
      if (text !== '') parts.push(text)
    } else if (type === 'image' || type === 'image-ref') {
      parts.push('[图片]')
    }
  }
  return parts.join('\n\n')
}

function contentHasToolError(content: unknown): boolean {
  if (!Array.isArray(content)) return false
  return content.some((value) => {
    const block = asRecord(value)
    if (block === undefined) return false
    return block.isError === true || contentHasToolError(block.content)
  })
}

export function formatArguments(value: string): string {
  const trimmed = value.trim()
  if (trimmed === '') return ''
  try {
    return JSON.stringify(sortJson(JSON.parse(trimmed) as unknown), null, 2)
  } catch {
    return trimmed
  }
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJson)
  const record = asRecord(value)
  if (record === undefined) return value
  return Object.fromEntries(
    Object.keys(record).sort().map(key => [key, sortJson(record[key])]),
  )
}

function metricsOf(events: readonly SessionEvent[], units: readonly ComparisonUnit[]): SessionMetrics {
  const starts = new Map<number, number>()
  let durationMs = 0
  let completedTurns = 0
  let inputTokens = 0
  let outputTokens = 0
  let cacheReadTokens = 0
  let reasoningTokens = 0

  for (const event of events) {
    const data = asRecord(event.data)
    const turn = safeInteger(data?.turn)
    if (event.type === 'turn/start' && turn !== undefined) starts.set(turn, event.time)
    if (event.type === 'turn/end' && turn !== undefined) {
      const start = starts.get(turn)
      if (start !== undefined && event.time >= start) {
        durationMs += event.time - start
        completedTurns++
      }
    }
    if (event.type === 'assistant/message') {
      const usage = asRecord(data?.usage)
      inputTokens += nonNegativeNumber(usage?.inputTokens)
      outputTokens += nonNegativeNumber(usage?.outputTokens)
      cacheReadTokens += nonNegativeNumber(usage?.cacheReadTokens)
      reasoningTokens += nonNegativeNumber(usage?.reasoningTokens)
    }
  }

  return {
    userMessages: units.filter(unit => unit.kind === 'user').length,
    assistantMessages: units.filter(unit => unit.kind === 'assistant').length,
    toolCalls: units.filter(unit => unit.kind === 'tool-call').length,
    toolErrors: units.filter(unit => unit.kind === 'tool-result' && unit.error === true).length,
    durationMs: completedTurns === 0 ? undefined : durationMs,
    inputTokens,
    outputTokens,
    cacheReadTokens,
    reasoningTokens,
  }
}

function asRecord(value: unknown): UnknownRecord | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as UnknownRecord
    : undefined
}

function safeString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function safeInteger(value: unknown): number | undefined {
  return Number.isSafeInteger(value) ? value as number : undefined
}

function nonNegativeNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0
}
