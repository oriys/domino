import { asc, desc, eq } from "drizzle-orm"

import { writeAuditLog } from "@/lib/api-platform/audit"
import type {
  Category,
  CategoryTreeNode,
  CategoryWriteInput,
  CollectionWriteInput,
  DocCollection,
  DocPage,
  DocPageVersion,
  DocPageWriteInput,
  Product,
  ProductTree,
  ProductWriteInput,
} from "@/lib/api-platform/types"
import {
  categoryWriteSchema,
  collectionWriteSchema,
  docPageWriteSchema,
  productWriteSchema,
} from "@/lib/api-platform/types"
import { getDb } from "@/lib/db"
import { categories, docCollections, docPages, docPageVersions, products } from "@/lib/db/schema"

// ── Error Classes ────────────────────────────────────────────────────────────

export class ProductNotFoundError extends Error {
  constructor(id: string) {
    super(`Doc space ${id} was not found.`)
    this.name = "ProductNotFoundError"
  }
}

export class DocCollectionNotFoundError extends Error {
  constructor(id: string) {
    super(`Collection ${id} was not found.`)
    this.name = "DocCollectionNotFoundError"
  }
}

export class CategoryNotFoundError extends Error {
  constructor(id: string) {
    super(`Category ${id} was not found.`)
    this.name = "CategoryNotFoundError"
  }
}

export class DocPageNotFoundError extends Error {
  constructor(id: string) {
    super(`Doc page ${id} was not found.`)
    this.name = "DocPageNotFoundError"
  }
}

// ── Row Converters ───────────────────────────────────────────────────────────

type ProductRow = {
  id: string
  name: string
  slug: string
  description: string
  docType: Product["docType"]
  collectionId: string | null
  collectionName: string | null
  visibility: Product["visibility"]
  icon: string | null
  orderNo: number
  currentVersion: string
  createdAt: Date
  updatedAt: Date
}
type CollectionRow = typeof docCollections.$inferSelect
type CategoryRow = typeof categories.$inferSelect
type DocPageRow = typeof docPages.$inferSelect

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    || "untitled"
}

function getLegacyCollectionName(docType: Product["docType"]) {
  if (docType === "rest_api") return "REST API"
  if (docType === "graphql_api") return "GraphQL"
  if (docType === "webhook") return "Webhook"
  if (docType === "collection") return "Collection"
  return "Guideline"
}

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    docType: row.docType,
    collectionId: row.collectionId,
    collectionName: row.collectionName,
    visibility: row.visibility,
    icon: row.icon,
    orderNo: row.orderNo,
    currentVersion: row.currentVersion,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function toCollection(row: CollectionRow): DocCollection {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    orderNo: row.orderNo,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function toCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    productId: row.productId,
    parentId: row.parentId,
    name: row.name,
    slug: row.slug,
    description: row.description,
    orderNo: row.orderNo,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function toDocPage(row: DocPageRow): DocPage {
  return {
    id: row.id,
    categoryId: row.categoryId,
    title: row.title,
    slug: row.slug,
    pageType: row.pageType,
    content: row.content,
    publishedContent: row.publishedContent,
    status: row.status,
    orderNo: row.orderNo,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

type DocPageVersionRow = typeof docPageVersions.$inferSelect

function toDocPageVersion(row: DocPageVersionRow): DocPageVersion {
  return {
    id: row.id,
    pageId: row.pageId,
    version: row.version,
    title: row.title,
    content: row.content,
    publishedBy: row.publishedBy,
    changelog: row.changelog,
    createdAt: row.createdAt.toISOString(),
  }
}

// ── Products CRUD ────────────────────────────────────────────────────────────

async function ensureCollectionId(collectionId: string | null | undefined, docType: Product["docType"]) {
  if (collectionId) {
    await getCollectionById(collectionId)
    return collectionId
  }

  const collection = await ensureCollection({
    name: getLegacyCollectionName(docType),
    slug: slugify(getLegacyCollectionName(docType)),
    description: "",
  })
  return collection.id
}

async function ensureCollection(input: CollectionWriteInput): Promise<DocCollection> {
  const values = collectionWriteSchema.parse(input)
  const db = getDb()
  const [existing] = await db.select().from(docCollections).where(eq(docCollections.slug, values.slug)).limit(1)

  if (existing) {
    return toCollection(existing)
  }

  const maxOrder = await db.select({ orderNo: docCollections.orderNo }).from(docCollections).orderBy(asc(docCollections.orderNo))
  const nextOrder = maxOrder.length > 0 ? Math.max(...maxOrder.map((row) => row.orderNo)) + 1 : 0

  const [row] = await db.insert(docCollections).values({
    name: values.name,
    slug: values.slug,
    description: values.description,
    orderNo: nextOrder,
  }).returning()

  return toCollection(row)
}

// ── Collections CRUD ────────────────────────────────────────────────────────

export async function listDocCollections(): Promise<DocCollection[]> {
  const rows = await getDb().select().from(docCollections).orderBy(asc(docCollections.orderNo), asc(docCollections.createdAt))
  return rows.map(toCollection)
}

export async function getCollectionById(id: string): Promise<DocCollection> {
  const [row] = await getDb().select().from(docCollections).where(eq(docCollections.id, id)).limit(1)
  if (!row) throw new DocCollectionNotFoundError(id)
  return toCollection(row)
}

export async function createDocCollection(input: unknown): Promise<DocCollection> {
  const collection = await ensureCollection(collectionWriteSchema.parse(input))
  void writeAuditLog({
    action: "create",
    resourceType: "doc_collection",
    resourceId: collection.id,
    summary: `Created collection "${collection.name}"`,
    afterSnapshot: collection,
  })
  return collection
}

export async function updateDocCollection(id: string, input: unknown): Promise<DocCollection> {
  const values = collectionWriteSchema.parse(input)
  const [row] = await getDb()
    .update(docCollections)
    .set({
      name: values.name,
      slug: values.slug,
      description: values.description,
      updatedAt: new Date(),
    })
    .where(eq(docCollections.id, id))
    .returning()

  if (!row) throw new DocCollectionNotFoundError(id)
  return toCollection(row)
}

export async function deleteDocCollection(id: string): Promise<void> {
  const [deleted] = await getDb().delete(docCollections).where(eq(docCollections.id, id)).returning({ id: docCollections.id })
  if (!deleted) throw new DocCollectionNotFoundError(id)
}

export async function reorderDocCollections(orderedIds: string[]): Promise<DocCollection[]> {
  const db = getDb()
  await db.transaction(async (tx) => {
    for (let i = 0; i < orderedIds.length; i += 1) {
      await tx.update(docCollections).set({ orderNo: i, updatedAt: new Date() }).where(eq(docCollections.id, orderedIds[i]))
    }
  })
  return listDocCollections()
}

export async function listProducts(): Promise<Product[]> {
  const rows = await getDb()
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      description: products.description,
      docType: products.docType,
      collectionId: products.collectionId,
      collectionName: docCollections.name,
      visibility: products.visibility,
      icon: products.icon,
      orderNo: products.orderNo,
      currentVersion: products.currentVersion,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
    })
    .from(products)
    .leftJoin(docCollections, eq(products.collectionId, docCollections.id))
    .orderBy(asc(products.orderNo), asc(products.createdAt))
  return rows.map(toProduct)
}

export async function getProductById(id: string): Promise<Product> {
  const [row] = await getDb()
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      description: products.description,
      docType: products.docType,
      collectionId: products.collectionId,
      collectionName: docCollections.name,
      visibility: products.visibility,
      icon: products.icon,
      orderNo: products.orderNo,
      currentVersion: products.currentVersion,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
    })
    .from(products)
    .leftJoin(docCollections, eq(products.collectionId, docCollections.id))
    .where(eq(products.id, id))
    .limit(1)
  if (!row) throw new ProductNotFoundError(id)
  return toProduct(row)
}

export async function createProduct(input: unknown): Promise<Product> {
  const values = productWriteSchema.parse(input)
  const maxOrder = await getDb().select({ orderNo: products.orderNo }).from(products).orderBy(asc(products.orderNo))
  const nextOrder = maxOrder.length > 0 ? Math.max(...maxOrder.map((r) => r.orderNo)) + 1 : 0
  const collectionId = await ensureCollectionId(values.collectionId, values.docType)

  const [row] = await getDb()
    .insert(products)
    .values({
      name: values.name,
      slug: values.slug,
      description: values.description,
      docType: values.docType,
      collectionId,
      visibility: values.visibility,
      icon: values.icon ?? null,
      currentVersion: values.currentVersion,
      orderNo: nextOrder,
    })
    .returning()

  const product = await getProductById(row.id)
  void writeAuditLog({ action: "create", resourceType: "product", resourceId: product.id, summary: `Created doc space "${product.name}"`, afterSnapshot: product })
  return product
}

export async function updateProduct(id: string, input: unknown): Promise<Product> {
  const values = productWriteSchema.parse(input)
  const existing = await getProductById(id)
  const collectionId = await ensureCollectionId(values.collectionId ?? existing.collectionId, values.docType)
  const [row] = await getDb()
    .update(products)
    .set({
      name: values.name,
      slug: values.slug,
      description: values.description,
      docType: values.docType,
      collectionId,
      visibility: values.visibility,
      icon: values.icon ?? null,
      currentVersion: values.currentVersion,
      updatedAt: new Date(),
    })
    .where(eq(products.id, id))
    .returning()

  if (!row) throw new ProductNotFoundError(id)
  return getProductById(row.id)
}

export async function deleteProduct(id: string): Promise<void> {
  const [deleted] = await getDb().delete(products).where(eq(products.id, id)).returning({ id: products.id })
  if (!deleted) throw new ProductNotFoundError(id)
  void writeAuditLog({ action: "delete", resourceType: "product", resourceId: id, summary: `Deleted doc space ${id}` })
}

export async function reorderProducts(orderedIds: string[]): Promise<Product[]> {
  const db = getDb()
  await db.transaction(async (tx) => {
    for (let i = 0; i < orderedIds.length; i++) {
      await tx.update(products).set({ orderNo: i, updatedAt: new Date() }).where(eq(products.id, orderedIds[i]))
    }
  })
  return listProducts()
}

// ── Categories CRUD ──────────────────────────────────────────────────────────

export async function listCategories(productId: string): Promise<Category[]> {
  const rows = await getDb()
    .select()
    .from(categories)
    .where(eq(categories.productId, productId))
    .orderBy(asc(categories.orderNo), asc(categories.createdAt))
  return rows.map(toCategory)
}

export async function getCategoryById(id: string): Promise<Category> {
  const [row] = await getDb().select().from(categories).where(eq(categories.id, id)).limit(1)
  if (!row) throw new CategoryNotFoundError(id)
  return toCategory(row)
}

export async function createCategory(input: unknown): Promise<Category> {
  const values = categoryWriteSchema.parse(input)
  const existing = await getDb()
    .select({ orderNo: categories.orderNo })
    .from(categories)
    .where(eq(categories.productId, values.productId))
  const nextOrder = existing.length > 0 ? Math.max(...existing.map((r) => r.orderNo)) + 1 : 0

  const [row] = await getDb()
    .insert(categories)
    .values({
      productId: values.productId,
      parentId: values.parentId ?? null,
      name: values.name,
      slug: values.slug,
      description: values.description,
      orderNo: nextOrder,
    })
    .returning()

  return toCategory(row)
}

export async function updateCategory(id: string, input: unknown): Promise<Category> {
  const values = categoryWriteSchema.parse(input)
  const [row] = await getDb()
    .update(categories)
    .set({
      name: values.name,
      slug: values.slug,
      description: values.description,
      parentId: values.parentId ?? null,
      updatedAt: new Date(),
    })
    .where(eq(categories.id, id))
    .returning()

  if (!row) throw new CategoryNotFoundError(id)
  return toCategory(row)
}

export async function deleteCategory(id: string): Promise<void> {
  const [deleted] = await getDb().delete(categories).where(eq(categories.id, id)).returning({ id: categories.id })
  if (!deleted) throw new CategoryNotFoundError(id)
}

export async function reorderCategories(productId: string, orderedIds: string[]): Promise<Category[]> {
  const db = getDb()
  await db.transaction(async (tx) => {
    for (let i = 0; i < orderedIds.length; i++) {
      await tx.update(categories).set({ orderNo: i, updatedAt: new Date() }).where(eq(categories.id, orderedIds[i]))
    }
  })
  return listCategories(productId)
}

// ── Doc Pages CRUD ───────────────────────────────────────────────────────────

export async function listDocPages(categoryId: string): Promise<DocPage[]> {
  const rows = await getDb()
    .select()
    .from(docPages)
    .where(eq(docPages.categoryId, categoryId))
    .orderBy(asc(docPages.orderNo), asc(docPages.createdAt))
  return rows.map(toDocPage)
}

export async function getDocPageById(id: string): Promise<DocPage> {
  const [row] = await getDb().select().from(docPages).where(eq(docPages.id, id)).limit(1)
  if (!row) throw new DocPageNotFoundError(id)
  return toDocPage(row)
}

export async function createDocPage(input: unknown): Promise<DocPage> {
  const values = docPageWriteSchema.parse(input)
  const existing = await getDb()
    .select({ orderNo: docPages.orderNo })
    .from(docPages)
    .where(eq(docPages.categoryId, values.categoryId))
  const nextOrder = existing.length > 0 ? Math.max(...existing.map((r) => r.orderNo)) + 1 : 0

  const [row] = await getDb()
    .insert(docPages)
    .values({
      categoryId: values.categoryId,
      title: values.title,
      slug: values.slug,
      pageType: values.pageType,
      content: values.content,
      orderNo: nextOrder,
    })
    .returning()

  const page = toDocPage(row)
  void writeAuditLog({ action: "create", resourceType: "doc_page", resourceId: page.id, summary: `Created page "${page.title}"`, afterSnapshot: page })
  return page
}

export async function updateDocPage(id: string, input: unknown): Promise<DocPage> {
  const values = docPageWriteSchema.parse(input)
  const existing = await getDocPageById(id)
  const [row] = await getDb()
    .update(docPages)
    .set({
      title: values.title,
      slug: values.slug,
      pageType: values.pageType,
      content: values.content,
      status: existing.status === "published" ? "draft" : existing.status,
      updatedAt: new Date(),
    })
    .where(eq(docPages.id, id))
    .returning()

  if (!row) throw new DocPageNotFoundError(id)
  return toDocPage(row)
}

export async function updateDocPageContent(id: string, content: string): Promise<DocPage> {
  const page = await getDocPageById(id)
  const [row] = await getDb()
    .update(docPages)
    .set({
      content,
      status: page.status === "published" ? "draft" : page.status,
      updatedAt: new Date(),
    })
    .where(eq(docPages.id, id))
    .returning()

  if (!row) throw new DocPageNotFoundError(id)
  return toDocPage(row)
}

export async function publishDocPage(id: string, changelog?: string, actor?: string): Promise<DocPage> {
  const page = await getDocPageById(id)

  const now = new Date()

  // Determine next version number
  const existingVersions = await listDocPageVersions(id)
  const nextVersionNum = existingVersions.length + 1
  const version = `v${nextVersionNum}`

  const db = getDb()

  // Update the page status + published content
  const [row] = await db
    .update(docPages)
    .set({
      status: "published",
      publishedContent: page.content,
      publishedAt: now,
      updatedAt: now,
    })
    .where(eq(docPages.id, id))
    .returning()

  if (!row) throw new DocPageNotFoundError(id)

  // Create version snapshot
  await db.insert(docPageVersions).values({
    pageId: id,
    version,
    title: page.title,
    content: page.content,
    publishedBy: actor ?? "system",
    changelog: changelog ?? "",
    createdAt: now,
  })

  const published = toDocPage(row)
  void writeAuditLog({ actor: actor ?? "system", action: "publish", resourceType: "doc_page", resourceId: id, summary: `Published page "${published.title}" (${version})` })
  return published
}

export async function unpublishDocPage(id: string, actor?: string): Promise<DocPage> {
  const [row] = await getDb()
    .update(docPages)
    .set({
      status: "draft",
      updatedAt: new Date(),
    })
    .where(eq(docPages.id, id))
    .returning()

  if (!row) throw new DocPageNotFoundError(id)
  const unpublished = toDocPage(row)
  void writeAuditLog({ actor: actor ?? "system", action: "unpublish", resourceType: "doc_page", resourceId: id, summary: `Unpublished page "${unpublished.title}"` })
  return unpublished
}

export async function deleteDocPage(id: string): Promise<void> {
  const [deleted] = await getDb().delete(docPages).where(eq(docPages.id, id)).returning({ id: docPages.id })
  if (!deleted) throw new DocPageNotFoundError(id)
}

export async function reorderDocPages(categoryId: string, orderedIds: string[]): Promise<DocPage[]> {
  const db = getDb()
  await db.transaction(async (tx) => {
    for (let i = 0; i < orderedIds.length; i++) {
      await tx.update(docPages).set({ orderNo: i, updatedAt: new Date() }).where(eq(docPages.id, orderedIds[i]))
    }
  })
  return listDocPages(categoryId)
}

// ── Doc Page Versions ─────────────────────────────────────────────────────────

export async function listDocPageVersions(pageId: string): Promise<DocPageVersion[]> {
  const rows = await getDb()
    .select()
    .from(docPageVersions)
    .where(eq(docPageVersions.pageId, pageId))
    .orderBy(desc(docPageVersions.createdAt))
  return rows.map(toDocPageVersion)
}

export async function getDocPageVersion(versionId: string): Promise<DocPageVersion> {
  const [row] = await getDb()
    .select()
    .from(docPageVersions)
    .where(eq(docPageVersions.id, versionId))
  if (!row) throw new Error("Version not found")
  return toDocPageVersion(row)
}

// ── Product Tree (full hierarchy) ────────────────────────────────────────────

export async function getProductTree(productId: string): Promise<ProductTree> {
  const product = await getProductById(productId)
  const allCategories = await listCategories(productId)

  const allPages: DocPage[] = []
  for (const cat of allCategories) {
    const pages = await listDocPages(cat.id)
    allPages.push(...pages)
  }

  const pagesByCategoryId = new Map<string, DocPage[]>()
  for (const page of allPages) {
    const list = pagesByCategoryId.get(page.categoryId) ?? []
    list.push(page)
    pagesByCategoryId.set(page.categoryId, list)
  }

  function buildCategoryTree(parentId: string | null): CategoryTreeNode[] {
    return allCategories
      .filter((c) => c.parentId === parentId)
      .sort((a, b) => a.orderNo - b.orderNo)
      .map((c) => ({
        ...c,
        children: buildCategoryTree(c.id),
        pages: pagesByCategoryId.get(c.id) ?? [],
      }))
  }

  return {
    ...product,
    categories: buildCategoryTree(null),
  }
}

export async function listProductTrees(): Promise<ProductTree[]> {
  const allProducts = await listProducts()
  const trees: ProductTree[] = []

  for (const product of allProducts) {
    const tree = await getProductTree(product.id)
    trees.push(tree)
  }

  return trees
}

// ── Full-text Search ─────────────────────────────────────────────────────────

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

export async function searchAll(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return []

  const db = getDb()
  const q = `%${query.toLowerCase()}%`
  const results: SearchResult[] = []

  // Search products
  const allProducts = await db.select().from(products)
  const allCollections = await db.select().from(docCollections)
  for (const p of allProducts) {
    if (
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.description.toLowerCase().includes(query.toLowerCase()) ||
      p.slug.toLowerCase().includes(query.toLowerCase()) ||
      (allCollections.find((collection) => collection.id === p.collectionId)?.name.toLowerCase().includes(query.toLowerCase()) ?? false)
    ) {
      results.push({
        type: "product",
        id: p.id,
        title: p.name,
        snippet: p.description || p.slug,
      })
    }
  }

  // Search doc pages (with category and product context)
  const allPages = await db.select().from(docPages)
  const allCategories = await db.select().from(categories)

  const categoryMap = new Map(allCategories.map((c) => [c.id, c]))
  const productMap = new Map(allProducts.map((p) => [p.id, p]))

  for (const page of allPages) {
    const matchTitle = page.title.toLowerCase().includes(query.toLowerCase())
    const matchContent = page.content.toLowerCase().includes(query.toLowerCase())
    const matchSlug = page.slug.toLowerCase().includes(query.toLowerCase())

    if (matchTitle || matchContent || matchSlug) {
      const cat = categoryMap.get(page.categoryId)
      const prod = cat ? productMap.get(cat.productId) : undefined

      // Extract a snippet around the match in content
      let snippet = page.title
      if (matchContent) {
        const idx = page.content.toLowerCase().indexOf(query.toLowerCase())
        const start = Math.max(0, idx - 40)
        const end = Math.min(page.content.length, idx + query.length + 40)
        snippet = (start > 0 ? "…" : "") + page.content.slice(start, end).replace(/\n/g, " ") + (end < page.content.length ? "…" : "")
      }

      results.push({
        type: "doc_page",
        id: page.id,
        title: page.title,
        snippet,
        productId: prod?.id,
        productName: prod?.name,
        categoryId: cat?.id,
        categoryName: cat?.name,
        pageType: page.pageType,
        status: page.status,
      })
    }
  }

  // Search categories
  for (const cat of allCategories) {
    if (
      cat.name.toLowerCase().includes(query.toLowerCase()) ||
      cat.slug.toLowerCase().includes(query.toLowerCase())
    ) {
      const prod = productMap.get(cat.productId)
      results.push({
        type: "category",
        id: cat.id,
        title: cat.name,
        snippet: prod?.name ?? cat.slug,
        productId: prod?.id,
        productName: prod?.name,
      })
    }
  }

  return results
}
