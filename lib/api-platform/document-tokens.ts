import type { ReusableSnippet } from "@/lib/api-platform/types"

const snippetTokenPattern = /\{\{(?:snippet|include):([a-z0-9-]+)\}\}/g
const exampleTokenPattern = /\{\{example:([a-z0-9-]+)\}\}/g

export function extractSnippetReferences(content: string) {
  return [...content.matchAll(snippetTokenPattern)].map((match) => match[1])
}

export function extractExampleReferences(content: string) {
  return [...content.matchAll(exampleTokenPattern)].map((match) => match[1])
}

export function resolveSnippetContent(content: string, snippets: ReusableSnippet[], depth = 0): string {
  if (depth > 4) {
    return content
  }

  const bySlug = new Map(snippets.map((snippet) => [snippet.slug, snippet.content]))
  return content.replace(snippetTokenPattern, (_match, slug: string) => {
    const snippet = bySlug.get(slug)
    if (!snippet) {
      return `> Missing snippet: ${slug}`
    }
    return resolveSnippetContent(snippet, snippets, depth + 1)
  })
}
