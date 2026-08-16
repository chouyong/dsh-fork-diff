import { describe, expect, it } from 'vitest'
import { contentText, formatArguments, normalizeHistory, visibleSurfaceSequences } from '../src/client/normalize.ts'
import { event, textMessage } from './fixtures.ts'

describe('normalizeHistory', () => {
  it('folds replacements and summarizes visible messages, tools, usage, and duration', () => {
    const events = [
      event(0, 'turn/start', { turn: 1 }),
      event(1, 'user/message', { ...textMessage('old prompt'), source: { kind: 'user' } }, { surfaceOp: 'append' }),
      event(2, 'assistant/message', {
        turn: 1, step: 1, message: textMessage('old answer'),
        usage: { inputTokens: 10, outputTokens: 5, cacheReadTokens: 2, reasoningTokens: 1 },
      }, { surfaceOp: 'append' }),
      event(3, 'user/message', { ...textMessage('summary'), source: { kind: 'user' } }, { surfaceOp: { op: 'replace', start: 1, end: 2 } }),
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

  it('compares only direct user prompts and ignores known runtime metadata', () => {
    const value = normalizeHistory([
      event(0, 'user/message', { ...textMessage('direct prompt'), source: { kind: 'user' } }, { surfaceOp: 'append' }),
      event(1, 'user/message', { ...textMessage('agent rules'), source: { kind: 'agent-instructions' } }, { surfaceOp: 'append' }),
      event(2, 'user/message', { ...textMessage('plugin context'), source: { kind: 'plugin' } }, { surfaceOp: 'append' }),
      event(3, 'user/message', { ...textMessage('skill catalog'), source: { kind: 'skill-catalog' } }, { surfaceOp: 'append' }),
      event(4, 'agent/inbox/spliced', {}),
      event(5, 'approval/policy', {}),
      event(6, 'permission/preset', {}),
      event(7, 'sandbox/mode', {}),
      event(8, 'session/title-llm-request', {}),
      event(9, 'future/required', {}),
    ])

    expect(value.units.map(unit => [unit.kind, unit.body])).toEqual([
      ['user', 'direct prompt'],
    ])
    expect(value.metrics.userMessages).toBe(1)
    expect(value.unsupportedRequiredTypes).toEqual(['future/required'])
  })

  it('reads nested tool-result text and detects block-level errors', () => {
    const value = normalizeHistory([
      event(0, 'tool/result', {
        turn: 1,
        step: 1,
        message: {
          content: [{
            type: 'tool-result',
            isError: true,
            content: [{ type: 'text', text: 'Error: unknown tool "mock_tool"' }],
          }],
        },
      }, { surfaceOp: 'append' }),
    ])

    expect(value.units).toHaveLength(1)
    expect(value.units[0]).toMatchObject({
      kind: 'tool-result',
      title: '工具错误',
      body: 'Error: unknown tool "mock_tool"',
      error: true,
    })
    expect(value.metrics.toolErrors).toBe(1)
  })

  it('preserves malformed tool arguments and canonicalizes valid JSON', () => {
    expect(formatArguments('{oops')).toBe('{oops')
    expect(formatArguments('{"z":1,"a":{"b":2,"a":1}}')).toBe('{\n  "a": {\n    "a": 1,\n    "b": 2\n  },\n  "z": 1\n}')
  })
})
