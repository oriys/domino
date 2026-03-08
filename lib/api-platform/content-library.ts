import { eq } from "drizzle-orm"

import { extractExampleReferences, extractSnippetReferences } from "@/lib/api-platform/document-tokens"
import type {
  ExampleSet,
  ReusableSnippet,
} from "@/lib/api-platform/types"
import { exampleSetWriteSchema, reusableSnippetWriteSchema } from "@/lib/api-platform/types"
import { getDb } from "@/lib/db"
import { docPages, exampleSets, reusableSnippets } from "@/lib/db/schema"

type ReusableSnippetRow = typeof reusableSnippets.$inferSelect
type ExampleSetRow = typeof exampleSets.$inferSelect

function countUsages(contents: string[]) {
  const snippetUsage = new Map<string, number>()
  const exampleUsage = new Map<string, number>()

  for (const content of contents) {
    for (const slug of extractSnippetReferences(content)) {
      snippetUsage.set(slug, (snippetUsage.get(slug) ?? 0) + 1)
    }
    for (const slug of extractExampleReferences(content)) {
      exampleUsage.set(slug, (exampleUsage.get(slug) ?? 0) + 1)
    }
  }

  return { snippetUsage, exampleUsage }
}

async function getUsageMaps() {
  const rows = await getDb().select({ content: docPages.content }).from(docPages)
  return countUsages(rows.map((row) => row.content ?? ""))
}

function toReusableSnippet(row: ReusableSnippetRow, usageCount: number): ReusableSnippet {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    scope: row.scope,
    productId: row.productId,
    content: row.content,
    tags: row.tags ?? [],
    usageCount,
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function toExampleSet(row: ExampleSetRow, usageCount: number): ExampleSet {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    variants: row.variants ?? [],
    usageCount,
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export async function listReusableSnippets(): Promise<ReusableSnippet[]> {
  const [rows, usage] = await Promise.all([
    getDb().select().from(reusableSnippets),
    getUsageMaps(),
  ])

  return rows.map((row) => toReusableSnippet(row, usage.snippetUsage.get(row.slug) ?? 0))
}

export async function getReusableSnippet(id: string): Promise<ReusableSnippet | null> {
  const [row] = await getDb().select().from(reusableSnippets).where(eq(reusableSnippets.id, id))
  if (!row) return null
  const usage = await getUsageMaps()
  return toReusableSnippet(row, usage.snippetUsage.get(row.slug) ?? 0)
}

export async function createReusableSnippet(input: unknown, actor?: string): Promise<ReusableSnippet> {
  const values = reusableSnippetWriteSchema.parse(input)
  const [row] = await getDb()
    .insert(reusableSnippets)
    .values({
      slug: values.slug,
      name: values.name,
      description: values.description,
      scope: values.scope,
      productId: values.productId ?? null,
      content: values.content,
      tags: values.tags,
      createdBy: actor ?? "system",
      updatedAt: new Date(),
    })
    .returning()

  return toReusableSnippet(row, 0)
}

export async function updateReusableSnippet(id: string, input: unknown): Promise<ReusableSnippet> {
  const values = reusableSnippetWriteSchema.parse(input)
  const [row] = await getDb()
    .update(reusableSnippets)
    .set({
      slug: values.slug,
      name: values.name,
      description: values.description,
      scope: values.scope,
      productId: values.productId ?? null,
      content: values.content,
      tags: values.tags,
      updatedAt: new Date(),
    })
    .where(eq(reusableSnippets.id, id))
    .returning()

  if (!row) {
    throw new Error(`Snippet ${id} not found.`)
  }

  const usage = await getUsageMaps()
  return toReusableSnippet(row, usage.snippetUsage.get(row.slug) ?? 0)
}

export async function deleteReusableSnippet(id: string) {
  const [row] = await getDb().delete(reusableSnippets).where(eq(reusableSnippets.id, id)).returning()
  if (!row) {
    throw new Error(`Snippet ${id} not found.`)
  }
}

export async function listExampleSets(): Promise<ExampleSet[]> {
  const [rows, usage] = await Promise.all([
    getDb().select().from(exampleSets),
    getUsageMaps(),
  ])

  return rows.map((row) => toExampleSet(row, usage.exampleUsage.get(row.slug) ?? 0))
}

export async function listResolvedExampleSets() {
  return listExampleSets()
}

export async function getExampleSet(id: string): Promise<ExampleSet | null> {
  const [row] = await getDb().select().from(exampleSets).where(eq(exampleSets.id, id))
  if (!row) return null
  const usage = await getUsageMaps()
  return toExampleSet(row, usage.exampleUsage.get(row.slug) ?? 0)
}

export async function createExampleSet(input: unknown, actor?: string): Promise<ExampleSet> {
  const values = exampleSetWriteSchema.parse(input)
  const [row] = await getDb()
    .insert(exampleSets)
    .values({
      slug: values.slug,
      title: values.title,
      description: values.description,
      variants: values.variants,
      createdBy: actor ?? "system",
      updatedAt: new Date(),
    })
    .returning()

  return toExampleSet(row, 0)
}

export async function updateExampleSet(id: string, input: unknown): Promise<ExampleSet> {
  const values = exampleSetWriteSchema.parse(input)
  const [row] = await getDb()
    .update(exampleSets)
    .set({
      slug: values.slug,
      title: values.title,
      description: values.description,
      variants: values.variants,
      updatedAt: new Date(),
    })
    .where(eq(exampleSets.id, id))
    .returning()

  if (!row) {
    throw new Error(`Example set ${id} not found.`)
  }

  const usage = await getUsageMaps()
  return toExampleSet(row, usage.exampleUsage.get(row.slug) ?? 0)
}

export async function deleteExampleSet(id: string) {
  const [row] = await getDb().delete(exampleSets).where(eq(exampleSets.id, id)).returning()
  if (!row) {
    throw new Error(`Example set ${id} not found.`)
  }
}

export async function getContentLibrarySnapshot() {
  const [snippets, examples] = await Promise.all([
    listReusableSnippets(),
    listResolvedExampleSets(),
  ])

  return {
    snippets,
    examples,
  }
}
