// @vitest-environment jsdom

import { afterEach, describe, expect, it } from 'vitest'
import { installStyles } from '../src/client/styles.ts'

afterEach(() => { document.head.replaceChildren() })

describe('installStyles', () => {
  it('reference-counts holders and removes the tag on the last dispose', () => {
    const first = installStyles()
    const second = installStyles()
    expect(document.querySelectorAll('#dsh-fork-diff-style')).toHaveLength(1)
    first()
    expect(document.getElementById('dsh-fork-diff-style')).not.toBeNull()
    first()
    second()
    expect(document.getElementById('dsh-fork-diff-style')).toBeNull()
  })
})
