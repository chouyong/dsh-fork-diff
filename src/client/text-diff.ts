export interface DiffTextLine {
  readonly text: string
  readonly changed: boolean
}

export interface TextDiff {
  readonly left: readonly DiffTextLine[]
  readonly right: readonly DiffTextLine[]
  readonly approximate: boolean
}

const MAX_LINE_CELLS = 40_000

/** Line-level marks for a changed structural row. */
export function diffText(leftText: string, rightText: string): TextDiff {
  const left = lines(leftText)
  const right = lines(rightText)
  if (left.length * right.length > MAX_LINE_CELLS) {
    return {
      left: left.map(text => ({ text, changed: true })),
      right: right.map(text => ({ text, changed: true })),
      approximate: true,
    }
  }

  const width = right.length + 1
  const cells = new Uint32Array((left.length + 1) * width)
  for (let leftIndex = left.length - 1; leftIndex >= 0; leftIndex--) {
    for (let rightIndex = right.length - 1; rightIndex >= 0; rightIndex--) {
      const offset = leftIndex * width + rightIndex
      cells[offset] = left[leftIndex] === right[rightIndex]
        ? 1 + (cells[(leftIndex + 1) * width + rightIndex + 1] ?? 0)
        : Math.max(
            cells[(leftIndex + 1) * width + rightIndex] ?? 0,
            cells[leftIndex * width + rightIndex + 1] ?? 0,
          )
    }
  }

  const unchangedLeft = new Set<number>()
  const unchangedRight = new Set<number>()
  let leftIndex = 0
  let rightIndex = 0
  while (leftIndex < left.length && rightIndex < right.length) {
    if (left[leftIndex] === right[rightIndex]) {
      unchangedLeft.add(leftIndex)
      unchangedRight.add(rightIndex)
      leftIndex++
      rightIndex++
    } else if (
      (cells[(leftIndex + 1) * width + rightIndex] ?? 0)
      >= (cells[leftIndex * width + rightIndex + 1] ?? 0)
    ) leftIndex++
    else rightIndex++
  }

  return {
    left: left.map((text, index) => ({ text, changed: !unchangedLeft.has(index) })),
    right: right.map((text, index) => ({ text, changed: !unchangedRight.has(index) })),
    approximate: false,
  }
}

function lines(value: string): string[] {
  return value === '' ? [''] : value.replace(/\r\n/g, '\n').split('\n')
}
