"use client"

import { useEffect, useState, useMemo } from "react"
import {
  BookText,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Tag,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { getUserHeaders } from "@/lib/api-platform/client"

interface GlossaryTerm {
  id: string
  term: string
  definition: string
  category: string
  aliases: string[]
  createdBy: string
  createdAt: string
  updatedAt: string
}

interface FormData {
  term: string
  definition: string
  category: string
  aliases: string
}

const emptyForm: FormData = { term: "", definition: "", category: "", aliases: "" }

export function GlossaryView() {
  const [terms, setTerms] = useState<GlossaryTerm[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<GlossaryTerm | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [saving, setSaving] = useState(false)

  async function loadTerms() {
    try {
      const res = await fetch("/api/glossary", { cache: "no-store" })
      if (res.ok) setTerms(await res.json())
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadTerms() }, [])

  const filteredTerms = useMemo(() => {
    if (!search.trim()) return terms
    const q = search.toLowerCase()
    return terms.filter(
      (t) =>
        t.term.toLowerCase().includes(q) ||
        t.definition.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.aliases.some((a) => a.toLowerCase().includes(q)),
    )
  }, [terms, search])

  const categories = useMemo(() => {
    const cats = new Set(terms.map((t) => t.category).filter(Boolean))
    return Array.from(cats).sort()
  }, [terms])

  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)

  const displayedTerms = useMemo(() => {
    if (!categoryFilter) return filteredTerms
    return filteredTerms.filter((t) => t.category === categoryFilter)
  }, [filteredTerms, categoryFilter])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEdit(term: GlossaryTerm) {
    setEditing(term)
    setForm({
      term: term.term,
      definition: term.definition,
      category: term.category,
      aliases: term.aliases.join(", "),
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const payload = {
        term: form.term,
        definition: form.definition,
        category: form.category,
        aliases: form.aliases
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean),
      }
      const url = editing ? `/api/glossary/${editing.id}` : "/api/glossary"
      const method = editing ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...getUserHeaders() },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        setDialogOpen(false)
        await loadTerms()
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/glossary/${id}`, {
      method: "DELETE",
      headers: getUserHeaders(),
    })
    await loadTerms()
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading glossary…
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Glossary</h2>
            <p className="text-sm text-muted-foreground">
              Maintain a shared vocabulary for your API documentation
            </p>
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Term
          </Button>
        </div>

        {/* Search + category filter */}
        <div className="mt-4 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search terms…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {categoryFilter && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer gap-1"
                  onClick={() => setCategoryFilter(null)}
                >
                  {categoryFilter}
                  <X className="h-3 w-3" />
                </Badge>
              )}
              {!categoryFilter &&
                categories.map((cat) => (
                  <Badge
                    key={cat}
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => setCategoryFilter(cat)}
                  >
                    <Tag className="mr-1 h-3 w-3" />
                    {cat}
                  </Badge>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Term list */}
      <ScrollArea className="flex-1">
        {displayedTerms.length === 0 ? (
          <Empty className="rounded-xl border bg-card py-16">
            <EmptyMedia variant="icon">
              <BookText className="h-6 w-6" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No terms found</EmptyTitle>
              <EmptyDescription>Add your first glossary term to get started.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="divide-y">
            {displayedTerms.map((term) => (
              <div
                key={term.id}
                className="group flex items-start gap-4 px-6 py-4 hover:bg-muted/40 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{term.term}</span>
                    {term.category && (
                      <Badge variant="secondary" className="text-[10px]">
                        {term.category}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {term.definition}
                  </p>
                  {term.aliases.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {term.aliases.map((alias) => (
                        <Badge key={alias} variant="outline" className="text-[10px] font-normal">
                          {alias}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(term)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(term.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Term" : "Add Term"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update this glossary term." : "Add a new term to the shared glossary."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="term">Term</Label>
              <Input
                id="term"
                value={form.term}
                onChange={(e) => setForm({ ...form, term: e.target.value })}
                placeholder="e.g. Bearer Token"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="definition">Definition</Label>
              <Textarea
                id="definition"
                value={form.definition}
                onChange={(e) => setForm({ ...form, definition: e.target.value })}
                placeholder="A short explanation of what this term means…"
                rows={3}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="e.g. Authentication"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="aliases">Aliases (comma-separated)</Label>
              <Input
                id="aliases"
                value={form.aliases}
                onChange={(e) => setForm({ ...form, aliases: e.target.value })}
                placeholder="e.g. JWT, JSON Web Token"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !form.term.trim() || !form.definition.trim()}>
              {saving ? "Saving…" : editing ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
