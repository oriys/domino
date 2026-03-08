export type TextDiffLineKind = "context" | "added" | "removed"

export interface TextDiffLine {
  kind: TextDiffLineKind
  oldLineNumber: number | null
  newLineNumber: number | null
  content: string
}

export interface TextDiffStats {
  added: number
  removed: number
  context: number
}

export interface TextDiff {
  lines: TextDiffLine[]
  stats: TextDiffStats
}

export interface TextDiffSeparator {
  kind: "separator"
  hiddenCount: number
}

export type TextDiffDisplayLine = TextDiffLine | TextDiffSeparator

function toLines(text: string) {
  if (!text) return []
  return text.replace(/\r\n?/g, "\n").split("\n")
}

export function computeTextDiff(previousText: string, currentText: string): TextDiff {
  const previousLines = toLines(previousText)
  const currentLines = toLines(currentText)
  const previousLength = previousLines.length
  const currentLength = currentLines.length
  const matrix = Array.from({ length: previousLength + 1 }, () => Array<number>(currentLength + 1).fill(0))

  for (let previousIndex = previousLength - 1; previousIndex >= 0; previousIndex -= 1) {
    for (let currentIndex = currentLength - 1; currentIndex >= 0; currentIndex -= 1) {
      matrix[previousIndex][currentIndex] =
        previousLines[previousIndex] === currentLines[currentIndex]
          ? matrix[previousIndex + 1][currentIndex + 1] + 1
          : Math.max(matrix[previousIndex + 1][currentIndex], matrix[previousIndex][currentIndex + 1])
    }
  }

  const lines: TextDiffLine[] = []
  const stats: TextDiffStats = { added: 0, removed: 0, context: 0 }
  let previousIndex = 0
  let currentIndex = 0
  let previousLineNumber = 1
  let currentLineNumber = 1

  while (previousIndex < previousLength && currentIndex < currentLength) {
    if (previousLines[previousIndex] === currentLines[currentIndex]) {
      lines.push({
        kind: "context",
        oldLineNumber: previousLineNumber,
        newLineNumber: currentLineNumber,
        content: previousLines[previousIndex],
      })
      stats.context += 1
      previousIndex += 1
      currentIndex += 1
      previousLineNumber += 1
      currentLineNumber += 1
      continue
    }

    if (matrix[previousIndex + 1][currentIndex] >= matrix[previousIndex][currentIndex + 1]) {
      lines.push({
        kind: "removed",
        oldLineNumber: previousLineNumber,
        newLineNumber: null,
        content: previousLines[previousIndex],
      })
      stats.removed += 1
      previousIndex += 1
      previousLineNumber += 1
      continue
    }

    lines.push({
      kind: "added",
      oldLineNumber: null,
      newLineNumber: currentLineNumber,
      content: currentLines[currentIndex],
    })
    stats.added += 1
    currentIndex += 1
    currentLineNumber += 1
  }

  while (previousIndex < previousLength) {
    lines.push({
      kind: "removed",
      oldLineNumber: previousLineNumber,
      newLineNumber: null,
      content: previousLines[previousIndex],
    })
    stats.removed += 1
    previousIndex += 1
    previousLineNumber += 1
  }

  while (currentIndex < currentLength) {
    lines.push({
      kind: "added",
      oldLineNumber: null,
      newLineNumber: currentLineNumber,
      content: currentLines[currentIndex],
    })
    stats.added += 1
    currentIndex += 1
    currentLineNumber += 1
  }

  return { lines, stats }
}

export function buildTextDiffDisplayLines(
  lines: TextDiffLine[],
  mode: "all" | "changes",
  contextWindow: number = 3,
): TextDiffDisplayLine[] {
  if (mode === "all") {
    return lines
  }

  const changedIndexes = lines
    .map((line, index) => (line.kind === "context" ? null : index))
    .filter((index): index is number => index !== null)

  if (changedIndexes.length === 0) {
    return []
  }

  const keepIndexes = new Set<number>()
  for (const changedIndex of changedIndexes) {
    const start = Math.max(0, changedIndex - contextWindow)
    const end = Math.min(lines.length - 1, changedIndex + contextWindow)
    for (let index = start; index <= end; index += 1) {
      keepIndexes.add(index)
    }
  }

  const displayLines: TextDiffDisplayLine[] = []
  let hiddenCount = 0

  for (let index = 0; index < lines.length; index += 1) {
    if (keepIndexes.has(index)) {
      if (hiddenCount > 0) {
        displayLines.push({ kind: "separator", hiddenCount })
        hiddenCount = 0
      }
      displayLines.push(lines[index])
      continue
    }

    hiddenCount += 1
  }

  if (hiddenCount > 0) {
    displayLines.push({ kind: "separator", hiddenCount })
  }

  return displayLines
}
