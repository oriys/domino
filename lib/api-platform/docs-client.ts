import { getUserHeaders } from "@/lib/api-platform/client"
import type {
  Category,
  CollectionWriteInput,
  DocCollection,
  CategoryWriteInput,
  DocPage,
  DocPageVersion,
  ExampleSet,
  ExampleSetResolved,
  DocPageWriteInput,
  Product,
  ProductTree,
  ProductWriteInput,
  ReusableSnippet,
  ReusableSnippetWriteInput,
  ExampleSetWriteInput,
} from "@/lib/api-platform/types"

async function apiRequest<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...getUserHeaders(),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  })

  if (!response.ok) {
    let message = "Request failed."
    try {
      const body = (await response.json()) as { error?: string }
      if (body.error) message = body.error
    } catch {
      // ignore
    }
    throw new Error(message)
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

// ── Products ─────────────────────────────────────────────────────────────────

export function listDocCollections() {
  return apiRequest<DocCollection[]>("/api/doc-collections")
}

export function getDocCollection(id: string) {
  return apiRequest<DocCollection>(`/api/doc-collections/${id}`)
}

export function createDocCollection(input: CollectionWriteInput) {
  return apiRequest<DocCollection>("/api/doc-collections", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function updateDocCollection(id: string, input: CollectionWriteInput) {
  return apiRequest<DocCollection>(`/api/doc-collections/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  })
}

export function deleteDocCollection(id: string) {
  return apiRequest<void>(`/api/doc-collections/${id}`, { method: "DELETE" })
}

export function reorderDocCollections(orderedIds: string[]) {
  return apiRequest<DocCollection[]>("/api/doc-collections", {
    method: "POST",
    body: JSON.stringify({ _action: "reorder", orderedIds }),
  })
}

export function listProducts() {
  return apiRequest<Product[]>("/api/products")
}

export function getProduct(id: string) {
  return apiRequest<Product>(`/api/products/${id}`)
}

export function createProduct(input: ProductWriteInput) {
  return apiRequest<Product>("/api/products", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function updateProduct(id: string, input: ProductWriteInput) {
  return apiRequest<Product>(`/api/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  })
}

export function deleteProduct(id: string) {
  return apiRequest<void>(`/api/products/${id}`, { method: "DELETE" })
}

export function reorderProducts(orderedIds: string[]) {
  return apiRequest<Product[]>("/api/products", {
    method: "POST",
    body: JSON.stringify({ _action: "reorder", orderedIds }),
  })
}

// ── Categories ───────────────────────────────────────────────────────────────

export function listCategories(productId: string) {
  return apiRequest<Category[]>(`/api/categories?productId=${productId}`)
}

export function getCategory(id: string) {
  return apiRequest<Category>(`/api/categories/${id}`)
}

export function createCategory(input: CategoryWriteInput) {
  return apiRequest<Category>("/api/categories", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function updateCategory(id: string, input: CategoryWriteInput) {
  return apiRequest<Category>(`/api/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  })
}

export function deleteCategory(id: string) {
  return apiRequest<void>(`/api/categories/${id}`, { method: "DELETE" })
}

export function reorderCategories(productId: string, orderedIds: string[]) {
  return apiRequest<Category[]>("/api/categories", {
    method: "POST",
    body: JSON.stringify({ _action: "reorder", productId, orderedIds }),
  })
}

// ── Doc Pages ────────────────────────────────────────────────────────────────

export function listDocPages(categoryId: string) {
  return apiRequest<DocPage[]>(`/api/doc-pages?categoryId=${categoryId}`)
}

export function getDocPage(id: string) {
  return apiRequest<DocPage>(`/api/doc-pages/${id}`)
}

export function createDocPage(input: DocPageWriteInput) {
  return apiRequest<DocPage>("/api/doc-pages", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function updateDocPage(id: string, input: DocPageWriteInput) {
  return apiRequest<DocPage>(`/api/doc-pages/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  })
}

export function updateDocPageContent(id: string, content: string) {
  return apiRequest<DocPage>(`/api/doc-pages/${id}`, {
    method: "PUT",
    body: JSON.stringify({ _action: "updateContent", content }),
  })
}

export function publishDocPage(id: string, changelog?: string, actorId?: string) {
  return apiRequest<DocPage>(`/api/doc-pages/${id}`, {
    method: "PUT",
    body: JSON.stringify({ _action: "publish", changelog, actorId }),
  })
}

export function unpublishDocPage(id: string, actorId?: string) {
  return apiRequest<DocPage>(`/api/doc-pages/${id}`, {
    method: "PUT",
    body: JSON.stringify({ _action: "unpublish", actorId }),
  })
}

export function deleteDocPage(id: string) {
  return apiRequest<void>(`/api/doc-pages/${id}`, { method: "DELETE" })
}

export function reorderDocPages(categoryId: string, orderedIds: string[]) {
  return apiRequest<DocPage[]>("/api/doc-pages", {
    method: "POST",
    body: JSON.stringify({ _action: "reorder", categoryId, orderedIds }),
  })
}

// ── Product Trees ────────────────────────────────────────────────────────────

export function listProductTrees() {
  return apiRequest<ProductTree[]>("/api/product-trees")
}

export function getProductTree(productId: string) {
  return apiRequest<ProductTree>(`/api/product-trees?productId=${productId}`)
}

// ── Doc Page Versions ────────────────────────────────────────────────────────

export function listDocPageVersions(pageId: string) {
  return apiRequest<DocPageVersion[]>(`/api/doc-pages/${pageId}/versions`)
}

export function getDocPageVersion(pageId: string, versionId: string) {
  return apiRequest<DocPageVersion>(`/api/doc-pages/${pageId}/versions?versionId=${versionId}`)
}

// ── Search ───────────────────────────────────────────────────────────────────

export interface SearchResult {
  type: "product" | "category" | "doc_page"
  id: string
  title: string
  snippet: string
  productId?: string
  productName?: string
  categoryId?: string
  categoryName?: string
  pageType?: string
  status?: string
}

export function searchDocs(query: string) {
  return apiRequest<SearchResult[]>(`/api/search?q=${encodeURIComponent(query)}`)
}

export function listReusableSnippets() {
  return apiRequest<ReusableSnippet[]>("/api/snippets")
}

export function createReusableSnippet(input: ReusableSnippetWriteInput) {
  return apiRequest<ReusableSnippet>("/api/snippets", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function updateReusableSnippet(id: string, input: ReusableSnippetWriteInput) {
  return apiRequest<ReusableSnippet>(`/api/snippets/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  })
}

export function deleteReusableSnippet(id: string) {
  return apiRequest<void>(`/api/snippets/${id}`, { method: "DELETE" })
}

export function listExampleSets() {
  return apiRequest<ExampleSetResolved[]>("/api/example-sets")
}

export function createExampleSet(input: ExampleSetWriteInput) {
  return apiRequest<ExampleSet>("/api/example-sets", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function updateExampleSet(id: string, input: ExampleSetWriteInput) {
  return apiRequest<ExampleSet>(`/api/example-sets/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  })
}

export function deleteExampleSet(id: string) {
  return apiRequest<void>(`/api/example-sets/${id}`, { method: "DELETE" })
}

export function getContentLibrarySnapshot() {
  return apiRequest<{ snippets: ReusableSnippet[]; examples: ExampleSetResolved[] }>("/api/content-library")
}
