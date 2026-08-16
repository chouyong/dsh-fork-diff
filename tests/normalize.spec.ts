import { describe, expect, it } from 'vitest'
import { contentText, formatArguments, normalizeHistory, visibleSurfaceSequences } from '../src/client/normalize.ts'
import { event, textMessage } from './fixtures.ts'

describe('normalizeHistory', () => {
  it('folds replacements and summarizes visible messages, tools, usage, and duration', () => {
    const events = [
      event(0, 'turn/start', { turn: 1 }),
      event(1, 'user/message', { ...textMessage('old prompt'), source: { kind: 'human' } }, { surfaceOp: 'append' }),
      event(2, 'assistant/message', {
        turn: 1, step: 1, message: textMessage('old answer'),
        usage: { inputTokens: 10, outputTokens: 5, cacheReadTokens: 2, reasoningTokens: 1 },
      }, { surfaceOp: 'append' }),
      event(3, 'user/message', textMessage('summary'), { surfaceOp: { op: 'replace', start: 1, end: 2 } }),
      event(4, 'tool/call', { turn: 1, step: 2, callId: 'c1', name: 'bash', arguments: '{"b":2,"a":1}' }),
      event(5, 'tool/result', {
        turn: 1, step: 2, message: { ...textMessage('failed'), isError: true }, error: { name: 'Error', code: 'x' },
      }, { surfaceOp: 'append' }),
      event(6, 'turn/end', { turn: 1, reason: 'complete' }),
      event(7, 'plugin/required', {}),
      event(8, 'plugin/note', {}, { ignorable: true }),
    ]
    const value = normalizeHistory(events)
    expect(value.units.map(unit => [unit.kind, unit.body])).toEqual([
      ['user', 'summary'],
      ['tool-call', '{\n  "a": 1,\n  "b": 2\n}'],
      ['tool-result', 'failed'],
    ])
    expect(value.metrics).toMatchObject({
      userMessages: 1, assistantMessages: 0, toolCalls: 1, toolErrors: 1, durationMs: 600,
      inputTokens: 10, outputTokens: 5, cacheReadTokens: 2, reasoningTokens: 1,
    })
    expect(value.unsupportedRequiredTypes).toEqual(['plugin/required'])
    expect([...visibleSurfaceSequences(events)]).toEqual([3, 5])
  })

  it('omits reasoning and tool calls from final-answer text while preserving images', () => {
    expect(contentText([
      { type: 'reasoning', text: 'hidden' },
      { type: 'text', text: 'visible' },
      { type: 'tool-call', name: 'bash', arguments: '{}' },
      { type: 'image-ref' },
    ], { includeReasoning: false, includeToolCalls: false })).toBe('visible\n\n[图片]')
  })

  it('preserves malformed tool arguments and canonicalizes valid JSON', () => {
    expect(formatArguments('{oops')).toBe('{oops')
    expect(formatArguments('{"z":1,"a":{"b":2,"a":1}}')).toBe('{\n  "a": {\n    "a": 1,\n    "b": 2\n  },\n  "z": 1\n}')
  })
})
