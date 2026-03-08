"use client"

import { useEffect, useState } from "react"
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  File,
  FileText,
  FolderOpen,
  Search,
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DocumentRenderer } from "@/components/api-platform/document-renderer"
import { getContentLibrarySnapshot, getProductTree, listDocPageVersions } from "@/lib/api-platform/docs-client"
import type { ExampleSetResolved, ProductTree, CategoryTreeNode, DocPage, DocPageVersion, PageType, ReusableSnippet } from "@/lib/api-platform/types"
import { cn } from "@/lib/utils"

interface DocPortalProps {
  productId: string
  onBack: () => void
}

export function DocPortal({ productId, onBack }: DocPortalProps) {
  const [tree, setTree] = useState<ProductTree | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")
  const [pageVersions, setPageVersions] = useState<DocPageVersion[]>([])
  const [selectedVersionId, setSelectedVersionId] = useState<string>("latest")
  const [snippets, setSnippets] = useState<ReusableSnippet[]>([])
  const [examples, setExamples] = useState<ExampleSetResolved[]>([])

  useEffect(() => {
    async function load() {
      try {
        const [data, assets] = await Promise.all([getProductTree(productId), getContentLibrarySnapshot()])
        setTree(data)
        setSnippets(assets.snippets)
        setExamples(assets.examples)
        // Auto-expand all and select first page
        const catIds = new Set<string>()
        let firstPageId: string | null = null

        function collectCategories(cats: CategoryTreeNode[]) {
          for (const cat of cats) {
            catIds.add(cat.id)
            if (!firstPageId && cat.pages.length > 0) {
              firstPageId = cat.pages[0].id
            }
            collectCategories(cat.children)
          }
        }
        collectCategories(data.categories)
        setExpandedCategories(catIds)
        if (firstPageId) setSelectedPageId(firstPageId)
      } catch (err) {
        console.error("Failed to load doc space tree:", err)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [productId])

  // Fetch versions when selected page changes
  useEffect(() => {
    if (!selectedPageId) {
      setPageVersions([])
      setSelectedVersionId("latest")
      return
    }
    async function loadVersions() {
      try {
        const v = await listDocPageVersions(selectedPageId!)
        setPageVersions(v)
        setSelectedVersionId("latest")
      } catch (err) {
        console.error("Failed to load versions:", err)
      }
    }
    void loadVersions()
  }, [selectedPageId])

  function toggleCategory(id: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // Flatten all pages from the tree
  function getAllPages(): DocPage[] {
    if (!tree) return []
    const pages: DocPage[] = []
    function collect(cats: CategoryTreeNode[]) {
      for (const cat of cats) {
        pages.push(...cat.pages)
        collect(cat.children)
      }
    }
    collect(tree.categories)
    return pages
  }

  const allPages = getAllPages()
  const selectedPage = allPages.find((p) => p.id === selectedPageId) ?? null

  // If a specific version is selected, use that version's content; otherwise use published/draft
  const selectedVersion = selectedVersionId !== "latest"
    ? pageVersions.find((v) => v.id === selectedVersionId)
    : null
  const displayContent = selectedVersion
    ? selectedVersion.content
    : (selectedPage?.publishedContent ?? selectedPage?.content ?? "")

  // Search filter
  const filteredPages = searchQuery.trim()
    ? allPages.filter(
        (p) =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.content.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : null

  // Generate TOC from markdown headings
  function extractHeadings(md: string) {
    const headings: { level: number; text: string; id: string }[] = []
    for (const line of md.split("\n")) {
      const match = line.match(/^(#{1,3})\s+(.+)/)
      if (match) {
        const text = match[2].trim()
        headings.push({
          level: match[1].length,
          text,
          id: text.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        })
      }
    }
    return headings
  }

  const headings = extractHeadings(displayContent)

  const pageTypeIcons: Record<PageType, typeof File> = {
    overview: BookOpen,
    guide: FileText,
    api_reference: File,
    changelog: FileText,
    custom: File,
  }

  function renderSidebarCategory(cat: CategoryTreeNode, depth: number = 0) {
    const isExpanded = expandedCategories.has(cat.id)
    const hasActiveChild = cat.pages.some((p) => p.id === selectedPageId)

    return (
      <div key={cat.id}>
        <div
          className={cn(
            "flex items-center gap-1.5 rounded-md py-1.5 pr-2 text-sm cursor-pointer hover:bg-accent/50",
            hasActiveChild && "bg-accent/30",
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => toggleCategory(cat.id)}
        >
          {isExpanded ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
          <FolderOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="flex-1 truncate text-xs font-medium">{cat.name}</span>
        </div>
        {isExpanded && (
          <>
            {cat.children.map((child) => renderSidebarCategory(child, depth + 1))}
            {cat.pages.map((page) => {
              const Icon = pageTypeIcons[page.pageType] || File
              return (
                <div
                  key={page.id}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md py-1 pr-2 text-xs cursor-pointer hover:bg-accent/50",
                    page.id === selectedPageId && "bg-primary/10 text-primary font-medium",
                  )}
                  style={{ paddingLeft: `${(depth + 1) * 12 + 8}px` }}
                  onClick={() => setSelectedPageId(page.id)}
                >
                  <Icon className="h-3 w-3 shrink-0" />
                  <span className="truncate">{page.title}</span>
                </div>
              )
            })}
          </>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading portal...
      </div>
    )
  }

  if (!tree) {
    return (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Doc space not found
        </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Portal header */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" aria-label="Back to documents" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">{tree.name} Documentation</h2>
              <Badge variant="outline" className="text-[10px]">{tree.currentVersion}</Badge>
              <Badge variant="secondary" className="text-[10px]">{tree.visibility}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{tree.description || "Documentation portal"}</p>
          </div>
        </div>
        <Badge variant="outline" className="text-[10px]">
          <ExternalLink className="mr-1 h-3 w-3" /> Preview Mode
        </Badge>
      </div>

      {/* Three-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - Navigation */}
        <div className="w-56 shrink-0 border-r bg-muted/20">
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search docs..."
                className="h-7 pl-8 text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="h-full pb-4">
            {searchQuery.trim() && filteredPages ? (
              <div className="px-2">
                <div className="mb-2 px-2 text-[10px] font-medium text-muted-foreground uppercase">
                  {filteredPages.length} results
                </div>
                {filteredPages.map((page) => (
                  <div
                    key={page.id}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs cursor-pointer hover:bg-accent/50",
                      page.id === selectedPageId && "bg-primary/10 text-primary font-medium",
                    )}
                    onClick={() => {
                      setSelectedPageId(page.id)
                      setSearchQuery("")
                    }}
                  >
                    <File className="h-3 w-3 shrink-0" />
                    <span className="truncate">{page.title}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-2">
                {tree.categories.map((cat) => renderSidebarCategory(cat))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Center - Content */}
        <ScrollArea className="flex-1">
          {selectedPage ? (
            <div className="mx-auto max-w-3xl px-8 py-6">
              <div className="mb-4 flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">{selectedPage.pageType}</Badge>
                {selectedPage.status === "published" && (
                  <Badge className="text-[10px]">Published</Badge>
                )}
                {selectedPage.publishedAt && (
                  <span className="text-[10px] text-muted-foreground">
                    Last published: {new Date(selectedPage.publishedAt).toLocaleDateString()}
                  </span>
                )}
                {pageVersions.length > 0 && (
                  <Select value={selectedVersionId} onValueChange={setSelectedVersionId}>
                    <SelectTrigger className="h-6 w-auto min-w-[80px] text-[10px] gap-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="latest" className="text-xs">Latest</SelectItem>
                      {pageVersions.map((v) => (
                        <SelectItem key={v.id} value={v.id} className="text-xs">
                          {v.version}{v.changelog ? ` — ${v.changelog}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <article className="prose dark:prose-invert max-w-none">
                <DocumentRenderer content={displayContent} snippets={snippets} examples={examples} />
              </article>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
              <BookOpen className="mb-2 h-8 w-8 opacity-50" />
              <p className="text-sm">Select a page from the sidebar</p>
            </div>
          )}
        </ScrollArea>

        {/* Right sidebar - TOC */}
        {headings.length > 0 && (
          <div className="w-48 shrink-0 border-l bg-muted/10 p-4">
            <div className="mb-2 text-[10px] font-medium text-muted-foreground uppercase">
              On this page
            </div>
            <nav className="space-y-1">
              {headings.map((h, i) => (
                <a
                  key={i}
                  href={`#${h.id}`}
                  className={cn(
                    "block text-xs text-muted-foreground hover:text-foreground transition-colors",
                    h.level === 1 && "font-medium text-foreground",
                    h.level === 2 && "pl-2",
                    h.level === 3 && "pl-4",
                  )}
                >
                  {h.text}
                </a>
              ))}
            </nav>
          </div>
        )}
      </div>
    </div>
  )
}
