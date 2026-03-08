"use client"

import { useEffect, useState } from "react"
import {
  Clock,
  FileText,
  Package,
  RotateCcw,
  Shield,
  Upload,
  Trash2,
  Edit,
  Eye,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { ScrollArea } from "@/components/ui/scroll-area"
import { auditActionColors } from "@/lib/api-platform/status-styles"
import type { AuditLogEntry, AuditAction } from "@/lib/api-platform/types"

const actionIcons: Record<AuditAction, typeof FileText> = {
  create: FileText,
  update: Edit,
  delete: Trash2,
  publish: Upload,
  unpublish: Eye,
  import: Package,
  schedule: Clock,
  rollback: RotateCcw,
}

const actionColors: Record<AuditAction, string> = {
  create: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  update: "bg-chart-1/20 text-chart-1",
  delete: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  publish: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  unpublish: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  import: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300",
  schedule: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  rollback: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
}

function formatResourceType(resourceType: string) {
  if (resourceType === "product") return "doc space"
  if (resourceType === "doc_collection") return "collection"
  if (resourceType === "doc_page") return "page"
  return resourceType.replace(/_/g, " ")
}

function formatAuditSummary(summary: string) {
  return summary
    .replace(/\bProducts\b/g, "Doc Spaces")
    .replace(/\bProduct\b/g, "Doc Space")
    .replace(/\bproducts\b/g, "doc spaces")
    .replace(/\bproduct\b/g, "doc space")
}

export function AuditLogView() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/audit-logs?limit=200", { cache: "no-store" })
        if (response.ok) {
          const data = await response.json() as AuditLogEntry[]
          setLogs(data)
        }
      } catch (err) {
        console.error("Failed to load audit logs:", err)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading audit logs...
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-6 py-4">
        <h2 className="text-lg font-semibold">Audit Log</h2>
        <p className="text-sm text-muted-foreground">
          Track all changes across your documentation platform
        </p>
      </div>

      <ScrollArea className="flex-1">
        {logs.length === 0 ? (
          <Empty className="rounded-xl border bg-card py-16">
            <EmptyMedia variant="icon">
              <Shield className="h-6 w-6" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No audit events recorded yet</EmptyTitle>
              <EmptyDescription>Actions on doc spaces, categories, and pages will appear here.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="divide-y">
            {logs.map((log) => {
              const Icon = actionIcons[log.action] || FileText
              return (
                <div key={log.id} className="flex items-start gap-3 px-6 py-3">
                  <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${auditActionColors[log.action]}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{formatAuditSummary(log.summary)}</span>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {log.action}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{log.actor}</span>
                      <span>·</span>
                      <span>{formatResourceType(log.resourceType)}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
