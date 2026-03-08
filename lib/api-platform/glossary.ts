import { asc, desc, eq, ilike, or } from "drizzle-orm"

import { writeAuditLog } from "@/lib/api-platform/audit"
import { getDb } from "@/lib/db"
import { glossaryTerms } from "@/lib/db/schema"

// ── Types ────────────────────────────────────────────────────────────────────

export interface GlossaryTerm {
  id: string
  term: string
  definition: string
  category: string
  aliases: string[]
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface GlossaryTermWriteInput {
  term: string
  definition: string
  category?: string
  aliases?: string[]
}

type GlossaryRow = typeof glossaryTerms.$inferSelect

function toGlossaryTerm(row: GlossaryRow): GlossaryTerm {
  return {
    id: row.id,
    term: row.term,
    definition: row.definition,
    category: row.category,
    aliases: row.aliases ?? [],
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

// ── CRUD ─────────────────────────────────────────────────────────────────────

export async function listGlossaryTerms(search?: string): Promise<GlossaryTerm[]> {
  const db = getDb()
  if (search) {
    const pattern = `%${search}%`
    const rows = await db
      .select()
      .from(glossaryTerms)
      .where(or(ilike(glossaryTerms.term, pattern), ilike(glossaryTerms.definition, pattern)))
      .orderBy(asc(glossaryTerms.term))
    return rows.map(toGlossaryTerm)
  }
  const rows = await db.select().from(glossaryTerms).orderBy(asc(glossaryTerms.term))
  return rows.map(toGlossaryTerm)
}

export async function getGlossaryTermById(id: string): Promise<GlossaryTerm | null> {
  const [row] = await getDb().select().from(glossaryTerms).where(eq(glossaryTerms.id, id))
  return row ? toGlossaryTerm(row) : null
}

export async function createGlossaryTerm(input: GlossaryTermWriteInput, actor?: string): Promise<GlossaryTerm> {
  const [row] = await getDb()
    .insert(glossaryTerms)
    .values({
      term: input.term,
      definition: input.definition,
      category: input.category ?? "",
      aliases: input.aliases ?? [],
      createdBy: actor ?? "system",
    })
    .returning()

  const result = toGlossaryTerm(row)
  void writeAuditLog({
    actor: actor ?? "system",
    action: "create",
    resourceType: "glossary_term",
    resourceId: result.id,
    summary: `Created glossary term "${result.term}"`,
    afterSnapshot: result,
  })
  return result
}

export async function updateGlossaryTerm(id: string, input: GlossaryTermWriteInput, actor?: string): Promise<GlossaryTerm> {
  const before = await getGlossaryTermById(id)
  const [row] = await getDb()
    .update(glossaryTerms)
    .set({
      term: input.term,
      definition: input.definition,
      category: input.category ?? "",
      aliases: input.aliases ?? [],
      updatedAt: new Date(),
    })
    .where(eq(glossaryTerms.id, id))
    .returning()

  if (!row) throw new Error(`Glossary term ${id} not found`)

  const result = toGlossaryTerm(row)
  void writeAuditLog({
    actor: actor ?? "system",
    action: "update",
    resourceType: "glossary_term",
    resourceId: id,
    summary: `Updated glossary term "${result.term}"`,
    beforeSnapshot: before,
    afterSnapshot: result,
  })
  return result
}

export async function deleteGlossaryTerm(id: string, actor?: string): Promise<void> {
  const before = await getGlossaryTermById(id)
  const [deleted] = await getDb().delete(glossaryTerms).where(eq(glossaryTerms.id, id)).returning({ id: glossaryTerms.id })
  if (!deleted) throw new Error(`Glossary term ${id} not found`)

  void writeAuditLog({
    actor: actor ?? "system",
    action: "delete",
    resourceType: "glossary_term",
    resourceId: id,
    summary: `Deleted glossary term "${before?.term ?? id}"`,
    beforeSnapshot: before,
  })
}
