import type { ComparisonUnit, DiffResult, DiffRow, DiffStatus } from './types.ts'

const MAX_EXACT_CELLS = 400_000

/** Align two normalized histories. Large divergent middles use a declared fast fallback. */
export function diffUnits(
  left: readonly ComparisonUnit[],
  right: readonly ComparisonUnit[],
): DiffResult {
  let prefix = 0
  while (
    prefix < left.length
    && prefix < right.length
    && left[prefix]?.fingerprint === right[prefix]?.fingerprint
  ) prefix++

  let suffix = 0
  while (
    suffix < left.length - prefix
    && suffix < right.length - prefix
    && left[left.length - 1 - suffix]?.fingerprint === right[right.length - 1 - suffix]?.fingerprint
  ) suffix++

  const leftMiddle = left.slice(prefix, left.length - suffix)
  const rightMiddle = right.slice(prefix, right.length - suffix)
  const exact = leftMiddle.length * rightMiddle.length <= MAX_EXACT_CELLS
  const matches = exact
    ? lcsMatches(leftMiddle, rightMiddle)
    : greedyMatches(leftMiddle, rightMiddle)

  const rows: DiffRow[] = []
  for (let index = 0; index < prefix; index++) {
    const leftUnit = left[index]
    const rightUnit = right[index]
    if (leftUnit !== undefined && rightUnit !== undefined) rows.push(sameRow(leftUnit, rightUnit))
  }

  let leftCursor = 0
  let rightCursor = 0
  for (const [leftIndex, rightIndex] of [...matches, [leftMiddle.length, rightMiddle.length] as const]) {
    rows.push(...alignGap(
      leftMiddle.slice(leftCursor, leftIndex),
      rightMiddle.slice(rightCursor, rightIndex),
    ))
    if (leftIndex < leftMiddle.length && rightIndex < rightMiddle.length) {
      const leftUnit = leftMiddle[leftIndex]
      const rightUnit = rightMiddle[rightIndex]
      if (leftUnit !== undefined && rightUnit !== undefined) rows.push(sameRow(leftUnit, rightUnit))
    }
    leftCursor = leftIndex + 1
    rightCursor = rightIndex + 1
  }

  for (let index = suffix; index > 0; index--) {
    const leftUnit = left[left.length - index]
    const rightUnit = right[right.length - index]
    if (leftUnit !== undefined && rightUnit !== undefined) rows.push(sameRow(leftUnit, rightUnit))
  }

  return {
    rows,
    approximate: !exact,
    commonPrefixUnits: prefix,
    counts: countStatuses(rows),
  }
}

function lcsMatches(
  left: readonly ComparisonUnit[],
  right: readonly ComparisonUnit[],
): ReadonlyArray<readonly [number, number]> {
  const width = right.length + 1
  const cells = new Uint32Array((left.length + 1) * width)
  for (let leftIndex = left.length - 1; leftIndex >= 0; leftIndex--) {
    for (let rightIndex = right.length - 1; rightIndex >= 0; rightIndex--) {
      const offset = leftIndex * width + rightIndex
      cells[offset] = left[leftIndex]?.fingerprint === right[rightIndex]?.fingerprint
        ? 1 + (cells[(leftIndex + 1) * width + rightIndex + 1] ?? 0)
        : Math.max(
            cells[(leftIndex + 1) * width + rightIndex] ?? 0,
            cells[leftIndex * width + rightIndex + 1] ?? 0,
          )
    }
  }

  const matches: Array<readonly [number, number]> = []
  let leftIndex = 0
  let rightIndex = 0
  while (leftIndex < left.length && rightIndex < right.length) {
    if (left[leftIndex]?.fingerprint === right[rightIndex]?.fingerprint) {
      matches.push([leftIndex, rightIndex])
      leftIndex++
      rightIndex++
    } else if (
      (cells[(leftIndex + 1) * width + rightIndex] ?? 0)
      >= (cells[leftIndex * width + rightIndex + 1] ?? 0)
    ) leftIndex++
    else rightIndex++
  }
  return matches
}

/** Deterministic increasing exact matches for histories too large for the exact matrix. */
function greedyMatches(
  left: readonly ComparisonUnit[],
  right: readonly ComparisonUnit[],
): ReadonlyArray<readonly [number, number]> {
  const positions = new Map<string, number[]>()
  for (let index = 0; index < right.length; index++) {
    const fingerprint = right[index]?.fingerprint
    if (fingerprint === undefined) continue
    const bucket = positions.get(fingerprint) ?? []
    bucket.push(index)
    positions.set(fingerprint, bucket)
  }
  const offsets = new Map<string, number>()
  const matches: Array<readonly [number, number]> = []
  let rightFloor = 0
  for (let leftIndex = 0; leftIndex < left.length; leftIndex++) {
    const fingerprint = left[leftIndex]?.fingerprint
    if (fingerprint === undefined) continue
    const bucket = positions.get(fingerprint)
    if (bucket === undefined) continue
    let offset = offsets.get(fingerprint) ?? 0
    while (offset < bucket.length && (bucket[offset] ?? 0) < rightFloor) offset++
    if (offset >= bucket.length) {
      offsets.set(fingerprint, offset)
      continue
    }
    const rightIndex = bucket[offset]
    offsets.set(fingerprint, offset + 1)
    if (rightIndex === undefined) continue
    matches.push([leftIndex, rightIndex])
    rightFloor = rightIndex + 1
  }
  return matches
}

function alignGap(
  left: readonly ComparisonUnit[],
  right: readonly ComparisonUnit[],
): readonly DiffRow[] {
  const rows: DiffRow[] = []
  let leftIndex = 0
  let rightIndex = 0
  while (leftIndex < left.length || rightIndex < right.length) {
    const leftUnit = left[leftIndex]
    const rightUnit = right[rightIndex]
    if (leftUnit !== undefined && rightUnit !== undefined && leftUnit.kind === rightUnit.kind) {
      rows.push({
        id: `changed:${leftUnit.id}:${rightUnit.id}`,
        status: 'changed',
        kind: leftUnit.kind,
        left: leftUnit,
        right: rightUnit,
      })
      leftIndex++
      rightIndex++
      continue
    }

    const leftKindAhead = leftUnit === undefined
      ? -1
      : right.slice(rightIndex + 1).findIndex(unit => unit.kind === leftUnit.kind)
    const rightKindAhead = rightUnit === undefined
      ? -1
      : left.slice(leftIndex + 1).findIndex(unit => unit.kind === rightUnit.kind)
    if (leftUnit !== undefined && (rightUnit === undefined || leftKindAhead < 0 || rightKindAhead >= 0 && rightKindAhead < leftKindAhead)) {
      rows.push({ id: `left:${leftUnit.id}`, status: 'left-only', kind: leftUnit.kind, left: leftUnit })
      leftIndex++
    } else if (rightUnit !== undefined) {
      rows.push({ id: `right:${rightUnit.id}`, status: 'right-only', kind: rightUnit.kind, right: rightUnit })
      rightIndex++
    }
  }
  return rows
}

function sameRow(left: ComparisonUnit, right: ComparisonUnit): DiffRow {
  return {
    id: `same:${left.id}:${right.id}`,
    status: 'same',
    kind: left.kind,
    left,
    right,
  }
}

function countStatuses(rows: readonly DiffRow[]): Readonly<Record<DiffStatus, number>> {
  const counts: Record<DiffStatus, number> = {
    same: 0,
    changed: 0,
    'left-only': 0,
    'right-only': 0,
  }
  for (const row of rows) counts[row.status]++
  return counts
}
