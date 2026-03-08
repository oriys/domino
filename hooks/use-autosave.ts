"use client"

import { useCallback, useEffect, useRef } from "react"

const DRAFT_PREFIX = "domino-draft-"

interface UseAutosaveOptions {
  pageId: string
  content: string
  dirty: boolean
  saving: boolean
  readOnly: boolean
  onSave: () => Promise<unknown>
  debounceMs?: number
}

export function useAutosave({
  pageId,
  content,
  dirty,
  saving,
  readOnly,
  onSave,
  debounceMs = 3000,
}: UseAutosaveOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const contentRef = useRef(content)
  contentRef.current = content

  // Debounced autosave
  useEffect(() => {
    if (!dirty || saving || readOnly) return

    timerRef.current = setTimeout(() => {
      void onSave()
    }, debounceMs)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [content, dirty, saving, readOnly, onSave, debounceMs])

  // Persist draft to localStorage on every content change
  useEffect(() => {
    if (!pageId || readOnly) return
    try {
      localStorage.setItem(`${DRAFT_PREFIX}${pageId}`, content)
    } catch {
      // localStorage full or unavailable — silent fail
    }
  }, [pageId, content, readOnly])

  // Clear draft after successful save
  useEffect(() => {
    if (!dirty && pageId) {
      try {
        localStorage.removeItem(`${DRAFT_PREFIX}${pageId}`)
      } catch {
        // ignore
      }
    }
  }, [dirty, pageId])

  // beforeunload warning
  useEffect(() => {
    if (!dirty) return
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault()
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [dirty])

  const recoverDraft = useCallback(
    (serverContent: string): string | null => {
      try {
        const draft = localStorage.getItem(`${DRAFT_PREFIX}${pageId}`)
        if (draft && draft !== serverContent) {
          return draft
        }
      } catch {
        // ignore
      }
      return null
    },
    [pageId],
  )

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(`${DRAFT_PREFIX}${pageId}`)
    } catch {
      // ignore
    }
  }, [pageId])

  return { recoverDraft, clearDraft }
}
