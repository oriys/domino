"use client"

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react"
import CodeMirrorReact from "@uiw/react-codemirror"
import { EditorView } from "@codemirror/view"
import { Extension } from "@codemirror/state"
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language"
import { tags } from "@lezer/highlight"
import { json } from "@codemirror/lang-json"
import { markdown } from "@codemirror/lang-markdown"
import { languages } from "@codemirror/language-data"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// SSR guard – avoids `setMounted(true)` inside useEffect
// ---------------------------------------------------------------------------

const subscribeNoop = () => () => {}
const getTrue = () => true
const getFalse = () => false

function useIsMounted() {
  return useSyncExternalStore(subscribeNoop, getTrue, getFalse)
}

// ---------------------------------------------------------------------------
// Custom theme using design-token CSS variables
// ---------------------------------------------------------------------------

const editorTheme = EditorView.theme({
  "&": {
    fontSize: "12px",
    lineHeight: "1.625",
    fontFamily:
      'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
    height: "100%",
  },
  "&.cm-focused": {
    outline: "none",
  },
  ".cm-scroller": {
    fontFamily: "inherit",
    lineHeight: "inherit",
    overflow: "auto",
  },
  ".cm-content": {
    caretColor: "var(--foreground)",
    padding: "8px 0",
  },
  ".cm-cursor, .cm-dropCursor": {
    borderLeftColor: "var(--foreground)",
  },
  ".cm-selectionBackground": {
    background: "color-mix(in oklch, var(--ring) 25%, transparent) !important",
  },
  "&.cm-focused .cm-selectionBackground": {
    background: "color-mix(in oklch, var(--ring) 30%, transparent) !important",
  },
  ".cm-activeLine": {
    backgroundColor: "color-mix(in oklch, var(--accent) 50%, transparent)",
  },
  ".cm-gutters": {
    backgroundColor: "var(--muted)",
    color: "var(--muted-foreground)",
    border: "none",
    borderRight: "1px solid var(--border)",
    minWidth: "3em",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "color-mix(in oklch, var(--accent) 70%, transparent)",
    color: "var(--foreground)",
  },
  ".cm-lineNumbers .cm-gutterElement": {
    padding: "0 8px 0 4px",
    fontSize: "11px",
  },
  ".cm-foldGutter .cm-gutterElement": {
    padding: "0 4px",
  },
  ".cm-tooltip": {
    backgroundColor: "var(--popover)",
    color: "var(--popover-foreground)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
  },
  ".cm-tooltip-autocomplete ul li[aria-selected]": {
    backgroundColor: "var(--accent)",
    color: "var(--accent-foreground)",
  },
  ".cm-searchMatch": {
    backgroundColor: "color-mix(in oklch, var(--ring) 20%, transparent)",
    outline: "1px solid color-mix(in oklch, var(--ring) 40%, transparent)",
  },
  ".cm-searchMatch.cm-searchMatch-selected": {
    backgroundColor: "color-mix(in oklch, var(--ring) 35%, transparent)",
  },
  ".cm-placeholder": {
    color: "var(--muted-foreground)",
    fontStyle: "italic",
  },
})

// ---------------------------------------------------------------------------
// Syntax highlighting — uses light-dark() so both modes are covered
// ---------------------------------------------------------------------------

const highlightStyle = HighlightStyle.define([
  {
    tag: tags.keyword,
    color: "light-dark(oklch(0.45 0.18 280), oklch(0.72 0.16 280))",
  },
  {
    tag: [tags.name, tags.deleted, tags.character, tags.macroName],
    color: "light-dark(oklch(0.42 0.14 15), oklch(0.75 0.14 15))",
  },
  {
    tag: [tags.function(tags.variableName), tags.labelName],
    color: "light-dark(oklch(0.48 0.17 250), oklch(0.78 0.12 220))",
  },
  {
    tag: [tags.color, tags.constant(tags.name), tags.standard(tags.name)],
    color: "light-dark(oklch(0.45 0.15 55), oklch(0.78 0.12 55))",
  },
  {
    tag: [tags.definition(tags.name), tags.separator],
    color: "var(--foreground)",
  },
  {
    tag: [
      tags.typeName,
      tags.className,
      tags.number,
      tags.changed,
      tags.annotation,
      tags.modifier,
      tags.self,
      tags.namespace,
    ],
    color: "light-dark(oklch(0.50 0.16 55), oklch(0.78 0.13 65))",
  },
  {
    tag: [
      tags.operator,
      tags.operatorKeyword,
      tags.url,
      tags.escape,
      tags.regexp,
      tags.link,
      tags.special(tags.string),
    ],
    color: "light-dark(oklch(0.50 0.15 175), oklch(0.72 0.12 175))",
  },
  {
    tag: [tags.meta, tags.comment],
    color: "var(--muted-foreground)",
    fontStyle: "italic",
  },
  {
    tag: tags.strong,
    fontWeight: "bold",
  },
  {
    tag: tags.emphasis,
    fontStyle: "italic",
  },
  {
    tag: tags.strikethrough,
    textDecoration: "line-through",
  },
  {
    tag: tags.link,
    textDecoration: "underline",
  },
  {
    tag: tags.heading,
    fontWeight: "bold",
    color: "var(--foreground)",
  },
  {
    tag: [tags.atom, tags.bool, tags.special(tags.variableName)],
    color: "light-dark(oklch(0.45 0.18 280), oklch(0.72 0.16 280))",
  },
  {
    tag: [tags.processingInstruction, tags.string, tags.inserted],
    color: "light-dark(oklch(0.44 0.14 145), oklch(0.72 0.14 145))",
  },
  {
    tag: tags.invalid,
    color: "var(--destructive)",
  },
])

const themeExtensions: Extension = [
  editorTheme,
  syntaxHighlighting(highlightStyle),
]

// ---------------------------------------------------------------------------
// Language resolution helper
// ---------------------------------------------------------------------------

function useLanguageExtension(language?: string): Extension[] {
  const [ext, setExt] = useState<Extension[]>(() => {
    if (language === "json") return [json()]
    return []
  })

  useEffect(() => {
    if (!language) {
      // Wrap in rAF to satisfy the lint rule
      const id = requestAnimationFrame(() => setExt([]))
      return () => cancelAnimationFrame(id)
    }

    if (language === "json") {
      const id = requestAnimationFrame(() => setExt([json()]))
      return () => cancelAnimationFrame(id)
    }

    const desc = languages.find(
      (lang) =>
        lang.name.toLowerCase() === language.toLowerCase() ||
        lang.alias.some((a) => a.toLowerCase() === language.toLowerCase())
    )

    if (desc) {
      let cancelled = false
      desc.load().then((support) => {
        if (!cancelled) setExt([support])
      })
      return () => { cancelled = true }
    } else {
      const id = requestAnimationFrame(() => setExt([]))
      return () => cancelAnimationFrame(id)
    }
  }, [language])

  return ext
}

// ---------------------------------------------------------------------------
// Wrapper div styling (border, radius, background)
// ---------------------------------------------------------------------------

const wrapperClass =
  "overflow-hidden rounded-md border border-border bg-muted/30 dark:bg-input/30 [&_.cm-editor]:bg-transparent"

// ---------------------------------------------------------------------------
// CodeEditor
// ---------------------------------------------------------------------------

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language?: string
  readOnly?: boolean
  placeholder?: string
  minHeight?: string
  className?: string
}

export function CodeEditor({
  value,
  onChange,
  language,
  readOnly = false,
  placeholder,
  minHeight = "120px",
  className,
}: CodeEditorProps) {
  const mounted = useIsMounted()

  const langExt = useLanguageExtension(language)

  const extensions = useMemo<Extension[]>(
    () => [EditorView.lineWrapping, ...langExt],
    [langExt]
  )

  if (!mounted) {
    return (
      <div
        className={cn(wrapperClass, className)}
        style={{ minHeight }}
      >
        <pre className="p-3 font-mono text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
          {value || placeholder || ""}
        </pre>
      </div>
    )
  }

  return (
    <div className={cn(wrapperClass, className)} data-slot="code-editor">
      <CodeMirrorReact
        value={value}
        onChange={onChange}
        theme={themeExtensions}
        extensions={extensions}
        readOnly={readOnly}
        editable={!readOnly}
        placeholder={placeholder}
        minHeight={minHeight}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          highlightActiveLine: true,
          highlightActiveLineGutter: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          indentOnInput: true,
          syntaxHighlighting: false, // we provide our own
        }}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// MarkdownEditor
// ---------------------------------------------------------------------------

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
  placeholder?: string
  minHeight?: string
  className?: string
  editorRef?: React.MutableRefObject<EditorView | null>
}

export function MarkdownEditor({
  value,
  onChange,
  readOnly = false,
  placeholder,
  minHeight = "100%",
  className,
  editorRef,
}: MarkdownEditorProps) {
  const mounted = useIsMounted()

  const extensions = useMemo<Extension[]>(
    () => [
      EditorView.lineWrapping,
      markdown({ codeLanguages: languages }),
    ],
    []
  )

  const handleCreateEditor = useCallback(
    (view: EditorView) => {
      if (editorRef) {
        editorRef.current = view
      }
    },
    [editorRef]
  )

  if (!mounted) {
    return (
      <div
        className={cn(wrapperClass, "h-full", className)}
        style={{ minHeight }}
      >
        <pre className="p-3 font-mono text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
          {value || placeholder || ""}
        </pre>
      </div>
    )
  }

  return (
    <div
      className={cn(
        wrapperClass,
        "h-full min-h-0 [&_.cm-theme]:h-full [&_.cm-theme]:min-h-0 [&_.cm-editor]:h-full [&_.cm-editor]:min-h-0 [&_.cm-scroller]:h-full [&_.cm-scroller]:min-h-0 [&_.cm-content]:min-h-full",
        className,
      )}
      data-slot="markdown-editor"
    >
      <CodeMirrorReact
        value={value}
        onChange={onChange}
        theme={themeExtensions}
        extensions={extensions}
        readOnly={readOnly}
        editable={!readOnly}
        placeholder={placeholder}
        minHeight={minHeight}
        onCreateEditor={handleCreateEditor}
        basicSetup={{
          lineNumbers: false,
          foldGutter: false,
          highlightActiveLine: true,
          highlightActiveLineGutter: false,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: false,
          indentOnInput: true,
          syntaxHighlighting: false,
        }}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// insertAtCursor utility
// ---------------------------------------------------------------------------

export function insertAtCursor(
  view: EditorView,
  prefix: string,
  suffix: string = ""
) {
  const { state } = view
  const range = state.selection.main

  if (range.from !== range.to) {
    // Text is selected — wrap it with prefix/suffix
    const selected = state.sliceDoc(range.from, range.to)
    view.dispatch({
      changes: { from: range.from, to: range.to, insert: prefix + selected + suffix },
      selection: {
        anchor: range.from + prefix.length,
        head: range.from + prefix.length + selected.length,
      },
    })
  } else {
    // No selection — insert prefix + placeholder + suffix and select the placeholder
    const placeholder = "text"
    const insert = prefix + placeholder + suffix
    view.dispatch({
      changes: { from: range.from, insert },
      selection: {
        anchor: range.from + prefix.length,
        head: range.from + prefix.length + placeholder.length,
      },
    })
  }

  view.focus()
}
