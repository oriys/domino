"use client"

import { useEffect, useState } from "react"
import {
  ChevronDown,
  ChevronRight,
  File,
  FileText,
  FolderOpen,
  MoreHorizontal,
  Package,
  Plus,
  Trash2,
  Pencil,
  BookOpen,
  Eye,
  Upload,
} from "lucide-react"

import {
  SortableItem,
  SortableList,
  DragHandle,
} from "@/components/ui/sortable"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useCurrentUser } from "@/hooks/use-current-user"
import {
  blockLabels,
  createComponentPageTemplate,
  type ComponentPageTemplate,
} from "@/lib/api-platform/doc-blocks"
import {
  listDocCollections,
  createDocCollection,
  updateDocCollection,
  deleteDocCollection,
  listProductTrees,
  createProduct,
  updateProduct,
  deleteProduct,
  createCategory,
  updateCategory,
  deleteCategory,
  createDocPage,
  deleteDocPage,
  publishDocPage,
  unpublishDocPage,
  reorderProducts,
  reorderCategories,
  reorderDocPages,
} from "@/lib/api-platform/docs-client"
import type { CategoryTreeNode, DocCollection, DocPage, PageType, ProductTree, Visibility } from "@/lib/api-platform/types"
import { cn } from "@/lib/utils"

// ── Slugify helper ───────────────────────────────────────────────────────────

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    || "untitled"
}

function updatePagesInTree(
  cats: CategoryTreeNode[],
  categoryId: string,
  newPages: DocPage[],
): CategoryTreeNode[] {
  return cats.map((cat) => {
    if (cat.id === categoryId) return { ...cat, pages: newPages }
    if (cat.children.length > 0) {
      return { ...cat, children: updatePagesInTree(cat.children, categoryId, newPages) }
    }
    return cat
  })
}

// ── Page content templates ───────────────────────────────────────────────────

function getPageTemplate(name: string, pageType: PageType): string {
  if (pageType === "overview") {
    return `# ${name}

## Overview

Use this page to introduce the section, scope, ownership, and intended audience.

## What to expect

- Key workflows covered in this section
- Important dependencies and prerequisites
- Related pages and follow-up actions
`
  }

  if (pageType === "guide") {
    return `# ${name}

## Goal

Describe the outcome this guide helps readers achieve.

## Prerequisites

- Access to the relevant environment
- Required permissions or credentials

## Steps

1. Complete the initial setup.
2. Validate the expected behavior.
3. Link the next related workflow.
`
  }

  if (pageType === "api_reference") {
    return `# ${name}

## Summary

Document the request shape, expected inputs, outputs, and operational notes here.

## Request

\`\`\`json
{
  "example": true
}
\`\`\`

## Response

\`\`\`json
{
  "ok": true
}
\`\`\`
`
  }

  if (pageType === "changelog") {
    return `# ${name}

## Latest changes

- Added:
- Updated:
- Deprecated:
`
  }

  return `# ${name}

Start writing here.
`
}

const componentPageTemplates: ComponentPageTemplate[] = [
  "rest_endpoint",
  "graphql_operation",
  "graphql_schema",
  "webhook_event",
  "webhook_verify",
  "webhook_retry",
  "steps",
  "dos_donts",
  "param_table",
  "auth_config",
  "error_responses",
  "field_table",
  "server_config",
  "schema_model",
  "rate_limit",
  "pagination_config",
  "response_headers",
  "security_scheme",
]

const componentTemplateDefaultPageType: Record<ComponentPageTemplate, PageType> = {
  rest_endpoint: "api_reference",
  graphql_operation: "api_reference",
  graphql_schema: "api_reference",
  webhook_event: "api_reference",
  webhook_verify: "api_reference",
  webhook_retry: "api_reference",
  steps: "guide",
  dos_donts: "guide",
  param_table: "api_reference",
  auth_config: "api_reference",
  error_responses: "api_reference",
  field_table: "api_reference",
  server_config: "api_reference",
  schema_model: "api_reference",
  rate_limit: "api_reference",
  pagination_config: "api_reference",
  response_headers: "api_reference",
  security_scheme: "api_reference",
}

// ── Component ────────────────────────────────────────────────────────────────

interface DocsManageViewProps {
  onEditPage: (page: DocPage) => void
  onPreviewProduct: (productId: string) => void
}

const docSpaceLabel = "Doc Space"
const docSpaceLabelPlural = "Doc Spaces"

type DialogMode =
  | null
  | { type: "collection"; intent: "create" }
  | { type: "collection"; intent: "edit"; collectionId: string }
  | { type: "product"; intent: "create" }
  | { type: "product"; intent: "edit"; productId: string }
  | { type: "category"; intent: "create"; productId: string }
  | { type: "category"; intent: "edit"; categoryId: string; productId: string }
  | { type: "page"; categoryId: string; productId: string }

export function DocsManageView({ onEditPage, onPreviewProduct }: DocsManageViewProps) {
  const { can } = useCurrentUser()
  const [collections, setCollections] = useState<DocCollection[]>([])
  const [trees, setTrees] = useState<ProductTree[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set())
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  // Dialog state
  const [dialogMode, setDialogMode] = useState<DialogMode>(null)
  const [dialogName, setDialogName] = useState("")
  const [dialogDescription, setDialogDescription] = useState("")
  const [dialogVisibility, setDialogVisibility] = useState<Visibility>("public")
  const [dialogCollectionId, setDialogCollectionId] = useState("")
  const [dialogPageType, setDialogPageType] = useState<PageType>("custom")
  const [dialogPageTemplate, setDialogPageTemplate] = useState<"blank" | ComponentPageTemplate>("blank")
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null)

  const filteredTrees = activeCollectionId
    ? trees.filter((tree) => tree.collectionId === activeCollectionId)
    : trees

  function findCategory(categoryId: string) {
    const stack = trees.flatMap((tree) => tree.categories)
    const queue = [...stack]

    while (queue.length > 0) {
      const current = queue.shift()
      if (!current) {
        continue
      }
      if (current.id === categoryId) {
        return current
      }
      queue.push(...current.children)
    }

    return null
  }

  async function reload() {
    try {
      const [nextCollections, nextTrees] = await Promise.all([
        listDocCollections(),
        listProductTrees(),
      ])
      setCollections(nextCollections)
      setTrees(nextTrees)
      setActiveCollectionId((prev) => {
        if (!prev) {
          return prev
        }
        return nextCollections.some((collection) => collection.id === prev) ? prev : null
      })
      if (nextTrees.length > 0 && expandedProducts.size === 0) {
        setExpandedProducts(new Set(nextTrees.map((product) => product.id)))
      }
    } catch (err) {
      console.error("Failed to load documents:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        const [nextCollections, nextTrees] = await Promise.all([
          listDocCollections(),
          listProductTrees(),
        ])
        if (!mounted) {
          return
        }

        setCollections(nextCollections)
        setTrees(nextTrees)
        setExpandedProducts((prev) => {
          if (prev.size > 0 || nextTrees.length === 0) {
            return prev
          }

          return new Set(nextTrees.map((product) => product.id))
        })
      } catch (err) {
        console.error("Failed to load documents:", err)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      mounted = false
    }
  }, [])

  function toggleProduct(id: string) {
    setExpandedProducts((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleCategory(id: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function openDialog(mode: NonNullable<DialogMode>) {
    if (mode.type === "collection" && mode.intent === "edit") {
      const collection = collections.find((item) => item.id === mode.collectionId)
      if (!collection) {
        return
      }

      setDialogMode(mode)
      setDialogName(collection.name)
      setDialogDescription(collection.description)
      setDialogCollectionId(collection.id)
      setDialogPageType("custom")
      setDialogPageTemplate("blank")
      return
    }

    if (mode.type === "product" && mode.intent === "edit") {
      const product = trees.find((tree) => tree.id === mode.productId)
      if (!product) {
        return
      }

      setDialogMode(mode)
      setDialogName(product.name)
      setDialogDescription(product.description)
      setDialogVisibility(product.visibility)
      setDialogCollectionId(product.collectionId ?? "")
      setDialogPageType("custom")
      setDialogPageTemplate("blank")
      return
    }

    if (mode.type === "category" && mode.intent === "edit") {
      const category = findCategory(mode.categoryId)
      if (!category) {
        return
      }

      setDialogMode(mode)
      setDialogName(category.name)
      setDialogDescription(category.description)
      setDialogPageType("custom")
      setDialogPageTemplate("blank")
      return
    }

    setDialogMode(mode)
    setDialogName("")
    setDialogDescription("")
    setDialogVisibility("public")
    setDialogCollectionId(activeCollectionId ?? collections[0]?.id ?? "")
    setDialogPageType("custom")
    setDialogPageTemplate("blank")
  }

  async function handleDialogSubmit() {
    if (!dialogMode) return
    const name = dialogName.trim()
    if (!name) return

    try {
      if (dialogMode.type === "collection") {
        const payload = {
          name,
          slug: dialogMode.intent === "edit"
            ? collections.find((item) => item.id === dialogMode.collectionId)?.slug ?? slugify(name)
            : slugify(name),
          description: dialogDescription,
        }

        if (dialogMode.intent === "edit") {
          await updateDocCollection(dialogMode.collectionId, payload)
        } else {
          await createDocCollection(payload)
        }
      } else if (dialogMode.type === "product") {
        const currentProduct =
          dialogMode.intent === "edit"
            ? trees.find((tree) => tree.id === dialogMode.productId) ?? null
            : null

        if (dialogMode.intent === "edit" && !currentProduct) {
          return
        }

        const payload = {
          name,
          slug: currentProduct?.slug ?? slugify(name),
          description: dialogDescription,
          docType: currentProduct?.docType ?? "collection",
          collectionId: dialogCollectionId || null,
          visibility: dialogVisibility,
          icon: currentProduct?.icon ?? null,
          currentVersion: currentProduct?.currentVersion ?? "v1.0.0",
        }

        if (dialogMode.intent === "edit") {
          await updateProduct(dialogMode.productId, payload)
        } else {
          await createProduct(payload)
        }
      } else if (dialogMode.type === "category") {
        const payload = {
          productId: dialogMode.productId,
          name,
          slug: dialogMode.intent === "edit"
            ? findCategory(dialogMode.categoryId)?.slug ?? slugify(name)
            : slugify(name),
          description: dialogDescription,
        }

        if (dialogMode.intent === "edit") {
          await updateCategory(dialogMode.categoryId, payload)
        } else {
          await createCategory(payload)
          setExpandedProducts((prev) => new Set([...prev, dialogMode.productId]))
        }
      } else if (dialogMode.type === "page") {
        const content = dialogPageTemplate === "blank"
          ? getPageTemplate(name, dialogPageType)
          : createComponentPageTemplate(dialogPageTemplate, name)

        await createDocPage({
          categoryId: dialogMode.categoryId,
          title: name,
          slug: slugify(name),
          pageType: dialogPageType,
          content,
        })
        setExpandedCategories((prev) => new Set([...prev, dialogMode.categoryId]))
      }

      setDialogMode(null)
      await reload()
    } catch (err) {
      console.error("Create failed:", err)
    }
  }

  async function handleDeleteCollection(id: string) {
    if (!confirm("Delete this collection? Doc spaces inside it will remain, but they will no longer appear under a collection tab.")) return
    try {
      await deleteDocCollection(id)
      await reload()
    } catch (err) {
      console.error("Delete collection failed:", err)
    }
  }

  async function handleDeleteProduct(id: string) {
    if (!confirm("Delete this doc space? This will permanently remove all its categories and pages. This cannot be undone.")) return
    try {
      await deleteProduct(id)
      await reload()
    } catch (err) {
      console.error("Delete product failed:", err)
    }
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm("Delete this category? All pages inside it will be permanently removed. This cannot be undone.")) return
    try {
      await deleteCategory(id)
      await reload()
    } catch (err) {
      console.error("Delete category failed:", err)
    }
  }

  async function handleDeletePage(id: string) {
    if (!confirm("Delete this page? This cannot be undone.")) return
    try {
      await deleteDocPage(id)
      await reload()
    } catch (err) {
      console.error("Delete page failed:", err)
    }
  }

  async function handleTogglePublish(page: DocPage) {
    if (page.status !== "draft" && page.status !== "published") {
      return
    }

    try {
      if (page.status === "published") {
        await unpublishDocPage(page.id)
      } else {
        await publishDocPage(page.id)
      }
      await reload()
    } catch (err) {
      console.error("Toggle publish failed:", err)
    }
  }

  async function handleReorderProducts(reorderedTrees: ProductTree[]) {
    setTrees((prev) => {
      const reorderedIds = new Set(reorderedTrees.map((t) => t.id))
      const others = prev.filter((t) => !reorderedIds.has(t.id))
      return [...reorderedTrees, ...others]
    })
    try {
      await reorderProducts(reorderedTrees.map((t) => t.id))
    } catch (err) {
      console.error("Failed to reorder products:", err)
      void reload()
    }
  }

  async function handleReorderCategories(productId: string, reorderedCats: CategoryTreeNode[]) {
    setTrees((prev) =>
      prev.map((t) =>
        t.id === productId ? { ...t, categories: reorderedCats } : t,
      ),
    )
    try {
      await reorderCategories(productId, reorderedCats.map((c) => c.id))
    } catch (err) {
      console.error("Failed to reorder categories:", err)
      void reload()
    }
  }

  async function handleReorderPages(categoryId: string, reorderedPages: DocPage[]) {
    setTrees((prev) =>
      prev.map((t) => ({
        ...t,
        categories: updatePagesInTree(t.categories, categoryId, reorderedPages),
      })),
    )
    try {
      await reorderDocPages(categoryId, reorderedPages.map((p) => p.id))
    } catch (err) {
      console.error("Failed to reorder pages:", err)
      void reload()
    }
  }

  const pageTypeIcons: Record<PageType, typeof File> = {
    overview: BookOpen,
    guide: FileText,
    api_reference: File,
    changelog: FileText,
    custom: File,
  }
  const activeCollection = activeCollectionId
    ? collections.find((collection) => collection.id === activeCollectionId) ?? null
    : null
  const dialogTitle =
    dialogMode?.type === "collection"
      ? dialogMode.intent === "edit"
        ? "Edit Collection"
        : "New Collection"
      : dialogMode?.type === "product"
        ? dialogMode.intent === "edit"
          ? `Edit ${docSpaceLabel}`
          : `New ${docSpaceLabel}`
      : dialogMode?.type === "category"
        ? dialogMode.intent === "edit"
          ? "Edit Category"
          : "New Category"
        : "New Page"
  const dialogDescriptionText =
    dialogMode?.type === "collection"
      ? dialogMode.intent === "edit"
        ? "Update the collection name and description used by the document tabs."
        : `Create a reusable collection for grouping ${docSpaceLabelPlural.toLowerCase()} at the top of the Documents view.`
      : dialogMode?.type === "product"
        ? dialogMode.intent === "edit"
          ? `Update the ${docSpaceLabel.toLowerCase()} details and choose which collection it belongs to.`
          : `Create a new documentation ${docSpaceLabel.toLowerCase()} and assign it to a collection.`
      : dialogMode?.type === "category"
        ? dialogMode.intent === "edit"
          ? "Update this category."
          : "Add a category to group related pages."
        : "Create a new documentation page."
  const dialogNamePlaceholder =
    dialogMode?.type === "collection"
      ? "e.g. Merchant Platform"
      : dialogMode?.type === "product"
        ? "e.g. Payments Platform"
      : dialogMode?.type === "category"
        ? "e.g. Orders"
        : "e.g. Getting Started"
  const dialogSubmitLabel =
    (dialogMode?.type === "product" ||
      dialogMode?.type === "collection" ||
      dialogMode?.type === "category") &&
    dialogMode.intent === "edit"
      ? "Save Changes"
      : "Create"

  function handlePageTemplateChange(value: string) {
    if (value === "blank") {
      setDialogPageTemplate("blank")
      return
    }

    const template = value as ComponentPageTemplate
    setDialogPageTemplate(template)
    setDialogPageType(componentTemplateDefaultPageType[template])
  }

  function renderPage(page: DocPage) {
    const Icon = pageTypeIcons[page.pageType] || File
    return (
      <div
        className="group flex items-center gap-2 rounded-md py-1.5 pl-12 pr-2 text-sm hover:bg-accent/50 cursor-pointer"
        onClick={() => onEditPage(page)}
      >
        <DragHandle className="h-5 w-5 opacity-0 group-hover:opacity-100" />
        <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="flex-1 truncate">{page.title}</span>
        <Badge variant={page.status === "published" ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
          {page.status}
        </Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100" aria-label="More options" onClick={(e) => e.stopPropagation()}>
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEditPage(page)}>
              <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
            </DropdownMenuItem>
            {page.status === "published" && (
              <DropdownMenuItem disabled={!can("canPublish")} onClick={() => handleTogglePublish(page)}>
                <Upload className="mr-2 h-3.5 w-3.5" /> Unpublish
              </DropdownMenuItem>
            )}
            {page.status === "draft" && (
              <DropdownMenuItem disabled={!can("canPublish")} onClick={() => handleTogglePublish(page)}>
                <Upload className="mr-2 h-3.5 w-3.5" /> Publish
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={() => handleDeletePage(page.id)}>
              <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete Page
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  function renderCategory(cat: CategoryTreeNode, depth: number = 0) {
    const isExpanded = expandedCategories.has(cat.id)
    return (
      <div key={cat.id}>
        <div
          className="group flex items-center gap-1.5 rounded-md py-1.5 pr-2 text-sm hover:bg-accent/50 cursor-pointer"
          style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}
          onClick={() => toggleCategory(cat.id)}
        >
          <DragHandle className="h-5 w-5 opacity-0 group-hover:opacity-100" />
          {isExpanded ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
          <FolderOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="flex-1 truncate font-medium">{cat.name}</span>
          <span className="text-xs text-muted-foreground mr-1">{cat.pages.length}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100" aria-label="More options" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openDialog({ type: "category", intent: "edit", categoryId: cat.id, productId: cat.productId })}>
                <Pencil className="mr-2 h-3.5 w-3.5" /> Edit Category
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openDialog({ type: "page", categoryId: cat.id, productId: cat.productId })}>
                <Plus className="mr-2 h-3.5 w-3.5" /> Add Page
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteCategory(cat.id)}>
                <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete Category
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {isExpanded && (
          <>
            {cat.children.map((child) => renderCategory(child, depth + 1))}
            <SortableList
              items={cat.pages}
              onReorder={(reordered) => handleReorderPages(cat.id, reordered)}
              renderItem={(page) => (
                <SortableItem key={page.id} id={page.id}>
                  {renderPage(page)}
                </SortableItem>
              )}
            />
            {cat.pages.length === 0 && cat.children.length === 0 && (
              <div
                className="py-1.5 text-xs text-muted-foreground cursor-pointer hover:text-foreground"
                style={{ paddingLeft: `${(depth + 2) * 16 + 8}px` }}
                onClick={() => openDialog({ type: "page", categoryId: cat.id, productId: cat.productId })}
              >
                + Add first page
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  function renderProduct(product: ProductTree) {
    const isExpanded = expandedProducts.has(product.id)
    const totalPages = product.categories.reduce(
      (sum, cat) => sum + cat.pages.length + cat.children.reduce((s, c) => s + c.pages.length, 0),
      0,
    )

    return (
      <div className="mb-2">
        <div
          className="group flex items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent/50 cursor-pointer"
          onClick={() => toggleProduct(product.id)}
        >
          <DragHandle className="opacity-0 group-hover:opacity-100" />
          {isExpanded ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
          <Package className="h-4 w-4 shrink-0 text-primary" />
          <span className="flex-1 truncate font-semibold">{product.name}</span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {product.collectionName ?? "Unassigned"}
          </Badge>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {product.visibility}
          </Badge>
          <span className="text-xs text-muted-foreground">{totalPages} {totalPages === 1 ? "page" : "pages"}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 opacity-0 group-hover:opacity-100" aria-label="More options" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openDialog({ type: "product", intent: "edit", productId: product.id })}>
                <Pencil className="mr-2 h-3.5 w-3.5" /> Edit Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openDialog({ type: "category", intent: "create", productId: product.id })}>
                <Plus className="mr-2 h-3.5 w-3.5" /> Add Category
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onPreviewProduct(product.id)}>
                <Eye className="mr-2 h-3.5 w-3.5" /> Preview Portal
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteProduct(product.id)}>
                <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete {docSpaceLabel}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {isExpanded && (
          <>
            <SortableList
              items={product.categories}
              onReorder={(reordered) => handleReorderCategories(product.id, reordered)}
              renderItem={(cat) => (
                <SortableItem key={cat.id} id={cat.id}>
                  {renderCategory(cat, 0)}
                </SortableItem>
              )}
            />
            {product.categories.length === 0 && (
              <div
                className="py-2 pl-10 text-xs text-muted-foreground cursor-pointer hover:text-foreground"
                onClick={() => openDialog({ type: "category", intent: "create", productId: product.id })}
              >
                + Add first category
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading document tree...
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="border-b px-6 pt-4 pb-0">
        <div data-tour="docs-toolbar" className="flex items-center justify-between pb-3">
          <div>
            <h2 className="text-lg font-semibold">Documents</h2>
            <p className="text-sm text-muted-foreground">
              {filteredTrees.length} {filteredTrees.length !== 1 ? docSpaceLabelPlural.toLowerCase() : docSpaceLabel.toLowerCase()} ·{" "}
              {(() => {
                const count = filteredTrees.reduce(
                  (sum, p) =>
                    sum +
                    p.categories.reduce(
                      (s, c) => s + c.pages.length + c.children.reduce((s2, c2) => s2 + c2.pages.length, 0),
                      0,
                    ),
                  0,
                )
                return `${count} ${count === 1 ? "page" : "pages"}`
              })()}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => openDialog({ type: "collection", intent: "create" })}>
              <Plus className="mr-2 h-4 w-4" /> New Collection
            </Button>
          </div>
        </div>
        <div className="flex gap-1 -mb-px">
          <button
            className={cn(
              "inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              activeCollectionId === null
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setActiveCollectionId(null)}
          >
            All
            <span className="ml-1 text-xs text-muted-foreground">{trees.length}</span>
          </button>
          {collections.map((collection) => {
            const count = trees.filter((tree) => tree.collectionId === collection.id).length
            return (
              <div key={collection.id} className="group flex items-center gap-1">
                <button
                  className={cn(
                    "inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                    activeCollectionId === collection.id
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                  onClick={() => setActiveCollectionId(collection.id)}
                >
                  <FolderOpen className="h-3.5 w-3.5" />
                  {collection.name}
                  {count > 0 && (
                    <span className="ml-1 text-xs text-muted-foreground">{count}</span>
                  )}
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label={`Manage ${collection.name}`}
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openDialog({ type: "collection", intent: "edit", collectionId: collection.id })}>
                      <Pencil className="mr-2 h-3.5 w-3.5" /> Edit Collection
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteCollection(collection.id)}>
                      <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete Collection
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tree */}
      <ScrollArea data-tour="docs-tree" className="flex-1 p-4">
        {filteredTrees.length === 0 && trees.length > 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Package className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="text-lg font-medium">
              {activeCollection ? `No ${docSpaceLabelPlural.toLowerCase()} in ${activeCollection.name}` : `No ${docSpaceLabelPlural.toLowerCase()} found`}
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              {activeCollection
                ? `Create a new ${docSpaceLabel.toLowerCase()} in this collection, or rename the collection from the tab actions.`
                : `Create a new ${docSpaceLabel.toLowerCase()} to get started.`}
            </p>
            <div className="flex gap-2">
              <Button onClick={() => openDialog({ type: "product", intent: "create" })}>
                <Plus className="mr-2 h-4 w-4" /> New {docSpaceLabel}
              </Button>
            </div>
          </div>
        ) : filteredTrees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Package className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="text-lg font-medium">No {docSpaceLabelPlural.toLowerCase()} or collections yet</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              {`Start by creating a collection, then add ${docSpaceLabelPlural.toLowerCase()} under it.`}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => openDialog({ type: "collection", intent: "create" })}>
                <Plus className="mr-2 h-4 w-4" /> New Collection
              </Button>
              <Button onClick={() => openDialog({ type: "product", intent: "create" })}>
                <Plus className="mr-2 h-4 w-4" /> New {docSpaceLabel}
              </Button>
            </div>
          </div>
        ) : (
          <SortableList
            items={filteredTrees}
            onReorder={handleReorderProducts}
            renderItem={(product) => (
              <SortableItem key={product.id} id={product.id}>
                {renderProduct(product)}
              </SortableItem>
            )}
          />
        )}
      </ScrollArea>

      {/* Create Dialog */}
      <Dialog open={dialogMode !== null} onOpenChange={(open) => !open && setDialogMode(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescriptionText}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Name</Label>
              <Input
                value={dialogName}
                onChange={(e) => setDialogName(e.target.value)}
                placeholder={dialogNamePlaceholder}
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleDialogSubmit()}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={dialogDescription}
                onChange={(e) => setDialogDescription(e.target.value)}
                placeholder="Optional description"
                rows={2}
              />
            </div>
            {dialogMode?.type === "product" && (
              <div>
                <Label>{docSpaceLabel} Collection</Label>
                <Select value={dialogCollectionId} onValueChange={setDialogCollectionId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a collection" />
                  </SelectTrigger>
                  <SelectContent>
                    {collections.map((collection) => (
                      <SelectItem key={collection.id} value={collection.id}>
                        {collection.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {dialogMode?.type === "product" && (
              <div>
                <Label>Visibility</Label>
                <Select value={dialogVisibility} onValueChange={(v) => setDialogVisibility(v as Visibility)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="partner">Partner</SelectItem>
                    <SelectItem value="internal">Internal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {dialogMode?.type === "page" && (
              <div>
                <Label>Starter Template</Label>
                <Select value={dialogPageTemplate} onValueChange={handlePageTemplateChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blank">Blank page</SelectItem>
                    {componentPageTemplates.map((template) => (
                      <SelectItem key={template} value={template}>
                        {blockLabels[template]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {dialogMode?.type === "page" && (
              <div>
                <Label>Page Type</Label>
                <Select value={dialogPageType} onValueChange={(v) => setDialogPageType(v as PageType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="overview">Overview</SelectItem>
                    <SelectItem value="guide">Guide</SelectItem>
                    <SelectItem value="api_reference">API Reference</SelectItem>
                    <SelectItem value="changelog">Changelog</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogMode(null)}>Cancel</Button>
            <Button
              onClick={handleDialogSubmit}
              disabled={!dialogName.trim() || (dialogMode?.type === "product" && !dialogCollectionId)}
            >
              {dialogSubmitLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
