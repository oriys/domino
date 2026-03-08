"use client"

import { useCallback, useRef } from "react"

interface HistoryEntry<T> {
  state: T
  description: string
}

const MAX_HISTORY = 50

export function useUndoRedo<T>(
  current: T,
  onApply: (state: T) => void,
) {
  const pastRef = useRef<HistoryEntry<T>[]>([])
  const futureRef = useRef<HistoryEntry<T>[]>([])

  const pushState = useCallback(
    (description: string, previous: T) => {
      pastRef.current = [
        ...pastRef.current.slice(-(MAX_HISTORY - 1)),
        { state: previous, description },
      ]
      futureRef.current = []
    },
    [],
  )

  const undo = useCallback(() => {
    if (pastRef.current.length === 0) return
    const entry = pastRef.current[pastRef.current.length - 1]
    pastRef.current = pastRef.current.slice(0, -1)
    futureRef.current = [
      ...futureRef.current,
      { state: current, description: entry.description },
    ]
    onApply(entry.state)
  }, [current, onApply])

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return
    const entry = futureRef.current[futureRef.current.length - 1]
    futureRef.current = futureRef.current.slice(0, -1)
    pastRef.current = [
      ...pastRef.current,
      { state: current, description: entry.description },
    ]
    onApply(entry.state)
  }, [current, onApply])

  return {
    pushState,
    undo,
    redo,
    canUndo: pastRef.current.length > 0,
    canRedo: futureRef.current.length > 0,
    undoCount: pastRef.current.length,
    redoCount: futureRef.current.length,
  }
}
