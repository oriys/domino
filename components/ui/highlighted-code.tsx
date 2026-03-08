"use client"

import { useEffect, useRef } from "react"
import hljs from "highlight.js/lib/core"

import bash from "highlight.js/lib/languages/bash"
import css from "highlight.js/lib/languages/css"
import go from "highlight.js/lib/languages/go"
import graphql from "highlight.js/lib/languages/graphql"
import java from "highlight.js/lib/languages/java"
import javascript from "highlight.js/lib/languages/javascript"
import json from "highlight.js/lib/languages/json"
import kotlin from "highlight.js/lib/languages/kotlin"
import php from "highlight.js/lib/languages/php"
import python from "highlight.js/lib/languages/python"
import ruby from "highlight.js/lib/languages/ruby"
import rust from "highlight.js/lib/languages/rust"
import shell from "highlight.js/lib/languages/shell"
import swift from "highlight.js/lib/languages/swift"
import typescript from "highlight.js/lib/languages/typescript"
import xml from "highlight.js/lib/languages/xml"
import yaml from "highlight.js/lib/languages/yaml"

hljs.registerLanguage("bash", bash)
hljs.registerLanguage("css", css)
hljs.registerLanguage("go", go)
hljs.registerLanguage("graphql", graphql)
hljs.registerLanguage("java", java)
hljs.registerLanguage("javascript", javascript)
hljs.registerLanguage("json", json)
hljs.registerLanguage("kotlin", kotlin)
hljs.registerLanguage("php", php)
hljs.registerLanguage("python", python)
hljs.registerLanguage("ruby", ruby)
hljs.registerLanguage("rust", rust)
hljs.registerLanguage("shell", shell)
hljs.registerLanguage("swift", swift)
hljs.registerLanguage("typescript", typescript)
hljs.registerLanguage("xml", xml)
hljs.registerLanguage("yaml", yaml)

// Aliases
hljs.registerLanguage("curl", bash)
hljs.registerLanguage("sh", bash)
hljs.registerLanguage("js", javascript)
hljs.registerLanguage("ts", typescript)
hljs.registerLanguage("py", python)
hljs.registerLanguage("rb", ruby)
hljs.registerLanguage("rs", rust)
hljs.registerLanguage("html", xml)

interface HighlightedCodeProps {
  code: string
  language?: string
  className?: string
}

export function HighlightedCode({ code, language, className }: HighlightedCodeProps) {
  const codeRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (codeRef.current) {
      codeRef.current.removeAttribute("data-highlighted")
      hljs.highlightElement(codeRef.current)
    }
  }, [code, language])

  return (
    <pre className={className}>
      <code ref={codeRef} className={language ? `language-${language}` : undefined}>
        {code}
      </code>
    </pre>
  )
}
