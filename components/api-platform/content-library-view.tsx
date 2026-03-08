"use client"

import { useEffect, useState } from "react"
import { Copy, FileCode, FlaskConical, LibraryBig, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  createExampleSet,
  createReusableSnippet,
  deleteExampleSet,
  deleteReusableSnippet,
  listExampleSets,
  listReusableSnippets,
  updateExampleSet,
  updateReusableSnippet,
} from "@/lib/api-platform/docs-client"
import type { ExampleSetResolved, ExampleVariant, ReusableSnippet, SnippetScope } from "@/lib/api-platform/types"

type DialogState =
  | null
  | { kind: "snippet"; mode: "create" | "edit"; item?: ReusableSnippet }
  | { kind: "example"; mode: "create" | "edit"; item?: ExampleSetResolved }

const defaultVariants: ExampleVariant[] = [
  { language: "bash", label: "cURL", code: "" },
  { language: "javascript", label: "JavaScript", code: "" },
  { language: "python", label: "Python", code: "" },
  { language: "go", label: "Go", code: "" },
]

function copyToken(token: string) {
  void navigator.clipboard.writeText(token)
  toast.success("Token copied")
}

function withDefaultVariants(variants?: ExampleVariant[]) {
  const byLanguage = new Map((variants ?? []).map((variant) => [variant.language, variant]))
  return defaultVariants.map((variant) => byLanguage.get(variant.language) ?? variant)
}

export function ContentLibraryView() {
  const [snippets, setSnippets] = useState<ReusableSnippet[]>([])
  const [examples, setExamples] = useState<ExampleSetResolved[]>([])
  const [loading, setLoading] = useState(true)
  const [dialog, setDialog] = useState<DialogState>(null)

  const [slug, setSlug] = useState("")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [scope, setScope] = useState<SnippetScope>("global")
  const [content, setContent] = useState("")
  const [variants, setVariants] = useState<ExampleVariant[]>(defaultVariants)

  async function reload() {
    const [nextSnippets, nextExamples] = await Promise.all([
      listReusableSnippets(),
      listExampleSets(),
    ])
    setSnippets(nextSnippets)
    setExamples(nextExamples)
  }

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [nextSnippets, nextExamples] = await Promise.all([
          listReusableSnippets(),
          listExampleSets(),
        ])

        if (cancelled) return

        setSnippets(nextSnippets)
        setExamples(nextExamples)
      } catch (error) {
        console.error("Failed to load content library:", error)
        if (!cancelled) {
          toast.error("Load failed")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  function openDialog(next: NonNullable<DialogState>) {
    setDialog(next)

    if (next.kind === "snippet") {
      setSlug(next.item?.slug ?? "")
      setName(next.item?.name ?? "")
      setDescription(next.item?.description ?? "")
      setScope(next.item?.scope ?? "global")
      setContent(next.item?.content ?? "")
      setVariants(defaultVariants)
      return
    }

    setSlug(next.item?.slug ?? "")
    setName(next.item?.title ?? "")
    setDescription(next.item?.description ?? "")
    setScope("global")
    setContent("")
    setVariants(withDefaultVariants(next.item?.variants))
  }

  function updateVariant(language: ExampleVariant["language"], code: string) {
    setVariants((current) =>
      current.map((variant) =>
        variant.language === language ? { ...variant, code } : variant,
      ),
    )
  }

  async function handleSubmit() {
    if (!dialog) return

    try {
      if (dialog.kind === "snippet") {
        const payload = {
          slug,
          name,
          description,
          scope,
          productId: null,
          content,
          tags: [],
        }

        if (dialog.mode === "edit" && dialog.item) {
          await updateReusableSnippet(dialog.item.id, payload)
        } else {
          await createReusableSnippet(payload)
        }
      } else {
        const payload = {
          slug,
          title: name,
          description,
          variants: variants.filter((variant) => variant.code.trim().length > 0),
        }

        if (dialog.mode === "edit" && dialog.item) {
          await updateExampleSet(dialog.item.id, payload)
        } else {
          await createExampleSet(payload)
        }
      }

      setDialog(null)
      await reload()
    } catch (error) {
      console.error("Save failed:", error)
      toast.error("Save failed", { description: error instanceof Error ? error.message : "Request failed." })
    }
  }

  async function handleDeleteSnippet(item: ReusableSnippet) {
    if (!confirm(`Delete snippet "${item.name}"?`)) return
    await deleteReusableSnippet(item.id)
    await reload()
  }

  async function handleDeleteExample(item: ExampleSetResolved) {
    if (!confirm(`Delete example set "${item.title}"?`)) return
    await deleteExampleSet(item.id)
    await reload()
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading content library...
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Content Library</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Manage reusable snippets and multi-language example sets for your docs. Insert them with{" "}
            <code>{'{{snippet:slug}}'}</code> and <code>{'{{example:slug}}'}</code>.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => openDialog({ kind: "snippet", mode: "create" })}>
            <Plus className="mr-2 h-4 w-4" />
            New Snippet
          </Button>
          <Button onClick={() => openDialog({ kind: "example", mode: "create" })}>
            <Plus className="mr-2 h-4 w-4" />
            New Example Set
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Reusable snippets</CardDescription>
            <CardTitle>{snippets.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Shared markdown blocks for auth, rate limits, errors, and reusable guidance.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Example sets</CardDescription>
            <CardTitle>{examples.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Curated code examples across cURL, JavaScript, Python, and Go.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Total usage</CardDescription>
            <CardTitle>{snippets.reduce((sum, item) => sum + item.usageCount, 0) + examples.reduce((sum, item) => sum + item.usageCount, 0)}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Count of snippet and example tokens currently referenced in documents.
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="snippets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="snippets">Snippets</TabsTrigger>
          <TabsTrigger value="examples">Example Sets</TabsTrigger>
        </TabsList>

        <TabsContent value="snippets" className="space-y-3">
          {snippets.length === 0 ? (
            <Empty className="border-dashed">
              <EmptyMedia variant="icon">
                <FileCode className="h-6 w-6" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>No snippets yet</EmptyTitle>
                <EmptyDescription>Create your first shared block and include it across pages.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            snippets.map((item) => (
              <Card key={item.id}>
                <CardHeader className="border-b">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle className="text-base">{item.name}</CardTitle>
                      <CardDescription>{item.description || "Reusable shared markdown block."}</CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{item.scope}</Badge>
                      <Badge variant="outline">{item.usageCount} use</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-4">
                  <div className="rounded-lg border bg-muted/20 px-3 py-2 font-mono text-xs">{`{{snippet:${item.slug}}}`}</div>
                  <pre className="overflow-x-auto rounded-lg border bg-background px-4 py-3 text-xs text-muted-foreground whitespace-pre-wrap">{item.content}</pre>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => copyToken(`{{snippet:${item.slug}}}`)}>
                      <Copy className="mr-1.5 h-3.5 w-3.5" />
                      Copy token
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openDialog({ kind: "snippet", mode: "edit", item })}>
                      <Pencil className="mr-1.5 h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => void handleDeleteSnippet(item)}>
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="examples" className="space-y-3">
          {examples.length === 0 ? (
            <Empty className="border-dashed">
              <EmptyMedia variant="icon">
                <FlaskConical className="h-6 w-6" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>No example sets yet</EmptyTitle>
                <EmptyDescription>Create an example set once and reuse it across your documentation pages.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            examples.map((item) => {
              const firstVariant = item.variants.find((variant) => variant.code.trim().length > 0) ?? item.variants[0]

              return (
                <Card key={item.id}>
                  <CardHeader className="border-b">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <CardTitle className="text-base">{item.title}</CardTitle>
                        <CardDescription>{item.description || "Reusable multi-language example set."}</CardDescription>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{item.variants.length} variants</Badge>
                        <Badge variant="outline">{item.usageCount} use</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-4">
                    <div className="rounded-lg border bg-muted/20 px-3 py-2 font-mono text-xs">{`{{example:${item.slug}}}`}</div>
                    <div className="flex flex-wrap gap-2">
                      {item.variants.map((variant) => (
                        <Badge key={variant.label} variant="secondary">{variant.label}</Badge>
                      ))}
                    </div>
                    <div className="rounded-lg border bg-background px-4 py-3 text-xs text-muted-foreground">
                      {firstVariant?.code ? (
                        <pre className="overflow-x-auto whitespace-pre-wrap">{firstVariant.code}</pre>
                      ) : (
                        "Add at least one language variant to this example set."
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => copyToken(`{{example:${item.slug}}}`)}>
                        <Copy className="mr-1.5 h-3.5 w-3.5" />
                        Copy token
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openDialog({ kind: "example", mode: "edit", item })}>
                        <Pencil className="mr-1.5 h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => void handleDeleteExample(item)}>
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={dialog !== null} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {dialog?.kind === "snippet"
                ? dialog.mode === "edit" ? "Edit Snippet" : "New Snippet"
                : dialog?.mode === "edit" ? "Edit Example Set" : "New Example Set"}
            </DialogTitle>
            <DialogDescription>
              {dialog?.kind === "snippet"
                ? "Create markdown content once and include it everywhere with a snippet token."
                : "Store reusable code examples directly in the content library, without linking them to a separate API entity."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>{dialog?.kind === "snippet" ? "Name" : "Title"}</Label>
                <Input value={name} onChange={(event) => setName(event.target.value)} />
              </div>
              <div>
                <Label>Slug</Label>
                <Input value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="auth-basics" />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={2} />
            </div>
            {dialog?.kind === "snippet" ? (
              <>
                <div>
                  <Label>Scope</Label>
                  <Input value={scope} readOnly />
                </div>
                <div>
                  <Label>Markdown Content</Label>
                  <Textarea value={content} onChange={(event) => setContent(event.target.value)} rows={12} />
                </div>
              </>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {variants.map((variant) => (
                  <div key={variant.language}>
                    <Label>{variant.label}</Label>
                    <Textarea
                      value={variant.code}
                      onChange={(event) => updateVariant(variant.language, event.target.value)}
                      rows={8}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            <Button onClick={() => void handleSubmit()} disabled={!slug.trim() || !name.trim()}>
              <LibraryBig className="mr-2 h-4 w-4" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
