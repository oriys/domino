import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

// ---------------------------------------------------------------------------
// API workflow statuses
// ---------------------------------------------------------------------------

const apiStatusClasses: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-success/20 text-success",
  deprecated: "bg-destructive/15 text-destructive",
}

export function getApiStatusClasses(status: string): string {
  return apiStatusClasses[status] ?? "bg-muted text-muted-foreground"
}

export function StatusBadge({
  status,
  className,
  ...props
}: { status: string } & Omit<React.ComponentProps<typeof Badge>, "variant" | "children">) {
  return (
    <Badge className={cn(getApiStatusClasses(status), className)} {...props}>
      {status.replace(/_/g, " ")}
    </Badge>
  )
}

// ---------------------------------------------------------------------------
// Validation tones (success / warning / error)
// ---------------------------------------------------------------------------

export const validationToneClasses: Record<string, string> = {
  success: "bg-success/20 text-success",
  warning: "bg-warning/20 text-warning",
  error: "bg-destructive/10 text-destructive",
}

// ---------------------------------------------------------------------------
// Document page statuses (used in publish workflow, versions, etc.)
// ---------------------------------------------------------------------------

export function getPageStatusClasses(status: string): string {
  if (status === "published") {
    return "border-success/30 bg-success/10 text-success"
  }
  return "border-warning/30 bg-warning/10 text-warning"
}

// ---------------------------------------------------------------------------
// HTTP method colors (token-based, consistent everywhere)
// ---------------------------------------------------------------------------

export const methodColors: Record<string, string> = {
  GET: "bg-chart-2/20 text-chart-2 border-chart-2/30",
  POST: "bg-chart-1/20 text-chart-1 border-chart-1/30",
  PUT: "bg-chart-3/20 text-chart-3 border-chart-3/30",
  DELETE: "bg-destructive/20 text-destructive border-destructive/30",
  PATCH: "bg-chart-4/20 text-chart-4 border-chart-4/30",
  HEAD: "bg-chart-5/20 text-chart-5 border-chart-5/30",
  OPTIONS: "bg-muted text-muted-foreground border-border",
}

export function MethodBadge({
  method,
  size = "sm",
  className,
  ...props
}: { method: string; size?: "xs" | "sm" } & Omit<React.ComponentProps<typeof Badge>, "children">) {
  return (
    <Badge
      className={cn(
        "font-mono border",
        methodColors[method] ?? methodColors.GET,
        size === "xs" ? "text-[10px] px-1.5" : "text-xs",
        className,
      )}
      {...props}
    >
      {method}
    </Badge>
  )
}

// ---------------------------------------------------------------------------
// Audit log action colors (token-based)
// ---------------------------------------------------------------------------

export const auditActionColors: Record<string, string> = {
  create: "bg-success/20 text-success",
  update: "bg-chart-1/20 text-chart-1",
  delete: "bg-destructive/15 text-destructive",
  publish: "bg-chart-4/20 text-chart-4",
  unpublish: "bg-warning/20 text-warning",
  import: "bg-chart-5/20 text-chart-5",
  schedule: "bg-chart-1/20 text-chart-1",
  rollback: "bg-warning/20 text-warning",
}

// ---------------------------------------------------------------------------
// Diff / change kind colors (token-based)
// ---------------------------------------------------------------------------

export const changeKindBadge: Record<string, string> = {
  added: "bg-success/15 text-success",
  removed: "bg-destructive/15 text-destructive",
  changed: "bg-warning/15 text-warning",
  unchanged: "bg-muted text-muted-foreground",
}

export const changeKindBg: Record<string, string> = {
  added: "bg-success/[0.04] border-success/20",
  removed: "bg-destructive/[0.04] border-destructive/20",
  changed: "bg-warning/[0.04] border-warning/20",
  unchanged: "",
}

// ---------------------------------------------------------------------------
// Doc editor variant styles (callout blocks)
// ---------------------------------------------------------------------------

export const calloutVariantStyles: Record<string, string> = {
  tip: "border-l-success bg-success/10",
  warning: "border-l-warning bg-warning/10",
  info: "border-l-chart-1 bg-chart-1/10",
}

// ---------------------------------------------------------------------------
// Release bundle statuses
// ---------------------------------------------------------------------------

export function getBundleStatusClasses(status: string): string {
  if (status === "published") return "border-success/30 bg-success/10 text-success"
  if (status === "scheduled") return "border-warning/30 bg-warning/10 text-warning"
  if (status === "rolled_back") return "border-primary/30 bg-primary/10 text-primary"
  return "bg-muted text-muted-foreground"
}
