import { asc, desc, eq } from "drizzle-orm"

import type { AuditAction, AuditLogEntry } from "@/lib/api-platform/types"
import { getDb } from "@/lib/db"
import { auditLogs } from "@/lib/db/schema"

type AuditLogRow = typeof auditLogs.$inferSelect

function toAuditLogEntry(row: AuditLogRow): AuditLogEntry {
  return {
    id: row.id,
    actor: row.actor,
    action: row.action,
    resourceType: row.resourceType,
    resourceId: row.resourceId,
    summary: row.summary,
    beforeSnapshot: row.beforeSnapshot,
    afterSnapshot: row.afterSnapshot,
    createdAt: row.createdAt.toISOString(),
  }
}

export async function listAuditLogs(limit: number = 100): Promise<AuditLogEntry[]> {
  const rows = await getDb()
    .select()
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
  return rows.map(toAuditLogEntry)
}

export async function listAuditLogsByResource(resourceType: string, resourceId: string): Promise<AuditLogEntry[]> {
  const rows = await getDb()
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.resourceId, resourceId))
    .orderBy(desc(auditLogs.createdAt))
  return rows.map(toAuditLogEntry)
}

export async function writeAuditLog(params: {
  actor?: string
  action: AuditAction
  resourceType: string
  resourceId?: string
  summary: string
  beforeSnapshot?: unknown
  afterSnapshot?: unknown
}): Promise<AuditLogEntry> {
  const [row] = await getDb()
    .insert(auditLogs)
    .values({
      actor: params.actor ?? "system",
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId ?? null,
      summary: params.summary,
      beforeSnapshot: params.beforeSnapshot ?? null,
      afterSnapshot: params.afterSnapshot ?? null,
    })
    .returning()

  return toAuditLogEntry(row)
}
