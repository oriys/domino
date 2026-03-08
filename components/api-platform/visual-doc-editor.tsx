"use client"

import { useCallback, useMemo, useState } from "react"
import {
  ArrowDown,
  ArrowUp,
  Braces,
  ChevronDown,
  Code,
  Copy,
  Globe,
  GripVertical,
  Heading,
  Hexagon,
  ImageIcon,
  Info,
  Lightbulb,
  ListChecks,
  ListOrdered,
  Plus,
  Quote,
  Server,
  ShieldCheck,
  Table,
  Trash2,
  Type,
  Webhook,
  AlertTriangle,
  Key,
  Lock,
  FileWarning,
  Database,
  FileText,
  X,
} from "lucide-react"
import {
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable"

import { CodeEditor, MarkdownEditor } from "@/components/ui/code-editor"
import { Badge } from "@/components/ui/badge"
import {
  SortableItem,
  DragHandle,
  DndContext,
  SortableContext,
  closestCenter,
  verticalListSortingStrategy,
  arrayMove,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@/components/ui/sortable"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  type BlockType,
  type CommonBlockType,
  type ContentBlock,
  type VisualEditingSupportReport,
  type CalloutData,
  type CodeData,
  type DosDontsData,
  type GraphqlOperationData,
  type GraphqlSchemaData,
  type HeadingData,
  type ImageData,
  type RestEndpointData,
  type StepsData,
  type TableData,
  type TextData,
  type WebhookEventData,
  type WebhookRetryData,
  type WebhookVerifyData,
  type ParamTableData,
  type AuthConfigData,
  type ErrorResponsesData,
  type FieldTableData,
  type ServerConfigData,
  type SchemaModelData,
  type RateLimitData,
  type PaginationConfigData,
  type ResponseHeadersData,
  type SecuritySchemeData,
  availableBlocks,
  blockLabels,
  commonBlocks,
  createDefaultBlock,
  extractStandaloneCodeBlockData,
  parseMarkdownToBlocks,
  parseBlockFromMarkdown,
  serializeBlocks,
  serializeBlock,
} from "@/lib/api-platform/doc-blocks"
import {
  blockDensityLabels,
  blockPresetLabels,
  blockToneLabels,
  getBlockAppearanceClasses,
  normalizeBlockAppearance,
} from "@/lib/api-platform/block-appearance"
import { methodColors, calloutVariantStyles } from "@/lib/api-platform/status-styles"
import { apiFieldTypes } from "@/lib/api-platform/types"
import { cn } from "@/lib/utils"

// ── Language options ──────────────────────────────────────────────────────────

function serializeEditorBlock<T extends BlockType>(type: T, data: ContentBlock<T>["data"]) {
  return serializeBlock({
    id: "tmp",
    type,
    data,
    appearance: createDefaultBlock(type).appearance,
  })
}

const CODE_LANGUAGES = [
  { value: "json", label: "JSON" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "bash", label: "Bash" },
  { value: "graphql", label: "GraphQL" },
  { value: "yaml", label: "YAML" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "java", label: "Java" },
  { value: "sql", label: "SQL" },
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
  { value: "scala", label: "Scala" },
  { value: "shell", label: "Shell" },
  { value: "dockerfile", label: "Dockerfile" },
  { value: "xml", label: "XML" },
  { value: "markdown", label: "Markdown" },
  { value: "plain_text", label: "Plain Text" },
] as const

// ── Block type icons ─────────────────────────────────────────────────────────

const blockIcons: Record<BlockType, typeof Code> = {
  heading: Heading,
  text: Type,
  code: Code,
  table: Table,
  callout: Quote,
  image: ImageIcon,
  rest_endpoint: Globe,
  graphql_operation: Hexagon,
  graphql_schema: Braces,
  webhook_event: Webhook,
  webhook_verify: ShieldCheck,
  webhook_retry: Server,
  steps: ListOrdered,
  dos_donts: ListChecks,
  param_table: Database,
  auth_config: Lock,
  error_responses: FileWarning,
  field_table: FileText,
  server_config: Server,
  schema_model: Braces,
  rate_limit: AlertTriangle,
  pagination_config: ChevronDown,
  response_headers: Info,
  security_scheme: Key,
}

function getBlockIcon(type: BlockType) {
  return blockIcons[type] ?? FileText
}

function renderBlockIcon(type: BlockType, className?: string) {
  const Icon = getBlockIcon(type)
  return <Icon className={className} />
}

type BlockTemplateId =
  | "rest-endpoint"
  | "auth-overview"
  | "webhook-guide"
  | "schema-reference"
  | "delivery-policies"

interface BlockTemplateDefinition {
  id: BlockTemplateId
  title: string
  description: string
  icon: typeof Code
  buildBlocks: () => ContentBlock[]
}

function createTemplateBlock<T extends BlockType>(
  type: T,
  patch?: Partial<ContentBlock<T>["data"]>,
): ContentBlock<T> {
  const block = createDefaultBlock(type)
  if (!patch) {
    return block
  }

  return {
    ...block,
    data: {
      ...block.data,
      ...patch,
    },
  }
}

const blockTemplates: BlockTemplateDefinition[] = [
  {
    id: "rest-endpoint",
    title: "REST endpoint",
    description: "Request, parameters, auth, and error handling in one insert.",
    icon: Globe,
    buildBlocks: () => [
      createTemplateBlock("heading", {
        level: 2,
        text: "Endpoint overview",
        description: "Explain what this endpoint does, who should call it, and any prerequisites.",
      }),
      createTemplateBlock("rest_endpoint"),
      createTemplateBlock("param_table", { variant: "query" }),
      createTemplateBlock("auth_config", {
        authType: "bearer",
        description: "Describe the token, role, or scope required to call this endpoint.",
      }),
      createTemplateBlock("error_responses"),
    ],
  },
  {
    id: "auth-overview",
    title: "Authentication guide",
    description: "Document auth requirements, credentials, and reusable security schemes.",
    icon: Lock,
    buildBlocks: () => [
      createTemplateBlock("heading", {
        level: 2,
        text: "Authentication",
        description: "Tell integrators which credentials to create and how to send them with requests.",
      }),
      createTemplateBlock("auth_config", {
        authType: "oauth2",
        description: "Capture the required flow, token URL, and scopes for this integration.",
      }),
      createTemplateBlock("security_scheme", {
        name: "OAuth 2.0",
        type: "oauth2",
      }),
    ],
  },
  {
    id: "webhook-guide",
    title: "Webhook guide",
    description: "Event payload, signature verification, and retry behavior.",
    icon: Webhook,
    buildBlocks: () => [
      createTemplateBlock("heading", {
        level: 2,
        text: "Webhook integration",
        description: "Help integrators subscribe, verify signatures, and handle delivery retries.",
      }),
      createTemplateBlock("webhook_event"),
      createTemplateBlock("webhook_verify"),
      createTemplateBlock("webhook_retry"),
    ],
  },
  {
    id: "schema-reference",
    title: "Schema reference",
    description: "Model definition plus detailed field reference for payloads.",
    icon: Database,
    buildBlocks: () => [
      createTemplateBlock("heading", {
        level: 2,
        text: "Schema reference",
        description: "Use this section for reusable models, payload shapes, and field-level details.",
      }),
      createTemplateBlock("schema_model", { name: "Resource" }),
      createTemplateBlock("field_table", { title: "Field reference" }),
    ],
  },
  {
    id: "delivery-policies",
    title: "Operational policies",
    description: "Pagination, headers, and rate limiting for production usage.",
    icon: AlertTriangle,
    buildBlocks: () => [
      createTemplateBlock("heading", {
        level: 2,
        text: "Operational policies",
        description: "Capture the rules callers need when they paginate collections or approach traffic limits.",
      }),
      createTemplateBlock("pagination_config"),
      createTemplateBlock("rate_limit"),
      createTemplateBlock("response_headers"),
    ],
  },
]

function looksLikeRichMarkdown(content: string): boolean {
  return /(^|\n)\s*(?:[-*+]\s+|\d+\.\s+|>\s+|!\[.+\]\(.+\)|\[[^\]]+\]\([^)]+\)|#{1,6}\s+|\|.+\||```|<\w+)/m.test(content)
}

function stripMarkdownFormatting(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " code block ")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/\|/g, " ")
    .replace(/[*_~`]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

function summarizeText(text: string, maxLength = 180): string {
  if (!text) return ""
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 1).trimEnd()}…`
}

function PreviewChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-border/70 bg-background px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
      {children}
    </span>
  )
}

function MethodPill({ method }: { method: string }) {
  const normalizedMethod = method.toUpperCase()
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em]",
        methodColors[normalizedMethod] ?? methodColors.GET,
      )}
    >
      {normalizedMethod}
    </span>
  )
}

function PreviewCode({
  code,
  language,
  className,
}: {
  code: string
  language?: string
  className?: string
}) {
  const snippet = summarizeText(code.trim(), 180)
  if (!snippet) return null

  return (
    <div className={cn("overflow-hidden rounded-lg border border-border/70 bg-muted/25", className)}>
      <div className="border-b border-border/70 px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        {language || "code"}
      </div>
      <pre className="overflow-x-auto px-3 py-3 text-xs leading-6 text-foreground">
        <code>{snippet}</code>
      </pre>
    </div>
  )
}

function BlockPreview({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "heading": {
      const data = block.data as HeadingData
      return (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <PreviewChip>{`H${data.level}`}</PreviewChip>
          </div>
          <div className="space-y-1">
            <p className="text-base font-semibold tracking-tight">{data.text || "Untitled heading"}</p>
            {data.description.trim() ? (
              <p className="text-sm leading-6 text-muted-foreground">
                {summarizeText(data.description.trim(), 220)}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Add context for this section in the inspector.</p>
            )}
          </div>
        </div>
      )
    }

    case "text": {
      const data = block.data as TextData
      const preview = summarizeText(stripMarkdownFormatting(data.content), 240)
      const richMarkdown = looksLikeRichMarkdown(data.content)

      return (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <PreviewChip>{richMarkdown ? "Raw Markdown" : "Body copy"}</PreviewChip>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            {preview || "Write prose, links, lists, or raw Markdown for unsupported formatting here."}
          </p>
        </div>
      )
    }

    case "code": {
      const data = block.data as CodeData
      return (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <PreviewChip>{data.language || "plain text"}</PreviewChip>
            {data.caption.trim() ? <PreviewChip>{data.caption}</PreviewChip> : null}
          </div>
          <PreviewCode code={data.code} language={data.language} />
        </div>
      )
    }

    case "table": {
      const data = block.data as TableData
      const visibleHeaders = data.headers.slice(0, 3)
      const visibleRows = data.rows.slice(0, 3)
      return (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <PreviewChip>{`${data.headers.length} columns`}</PreviewChip>
            <PreviewChip>{`${data.rows.length} rows`}</PreviewChip>
          </div>
          <div className="overflow-hidden rounded-lg border border-border/70 bg-background">
            <table className="w-full text-xs">
              <thead className="bg-muted/35">
                <tr>
                  {visibleHeaders.map((header) => (
                    <th key={header} className="px-3 py-2 text-left font-medium text-muted-foreground">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-t border-border/70">
                    {row.slice(0, 3).map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-3 py-2 text-foreground">
                        {cell || "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )
    }

    case "callout": {
      const data = block.data as CalloutData
      const variantIcons = {
        tip: Lightbulb,
        warning: AlertTriangle,
        info: Info,
      }
      const Icon = variantIcons[data.variant]

      return (
        <div className={cn("rounded-lg border-l-4 p-4", calloutVariantStyles[data.variant])}>
          <div className="flex items-center gap-2 text-sm font-medium">
            <Icon className="h-4 w-4" />
            <span className="capitalize">{data.variant}</span>
          </div>
          <p className="mt-2 text-sm leading-6">{data.text || "Add the callout copy in the inspector."}</p>
        </div>
      )
    }

    case "image": {
      const data = block.data as ImageData
      return (
        <div className="space-y-3">
          {data.src ? (
            <div className="overflow-hidden rounded-lg border border-border/70 bg-muted/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={data.src} alt={data.alt} className="max-h-64 w-full object-contain" />
            </div>
          ) : (
            <div className="flex min-h-40 items-center justify-center rounded-lg border border-dashed border-border/80 bg-muted/15">
              <div className="text-center text-sm text-muted-foreground">
                <ImageIcon className="mx-auto mb-2 h-6 w-6" />
                Add an image source in the inspector.
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <PreviewChip>{data.alt.trim() ? "Alt ready" : "Missing alt"}</PreviewChip>
            {data.caption.trim() ? <PreviewChip>Caption</PreviewChip> : null}
          </div>
        </div>
      )
    }

    case "rest_endpoint": {
      const data = block.data as RestEndpointData
      return (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <MethodPill method={data.method} />
            <p className="min-w-0 flex-1 truncate text-sm font-semibold">{data.path || "/v1/resource"}</p>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            {summarizeText(data.description.trim(), 220) || "Document the endpoint contract, request shape, and response payload."}
          </p>
          <div className="flex flex-wrap gap-2">
            <PreviewChip>{`${data.headers.length} headers`}</PreviewChip>
            {data.responseStatus.trim() ? <PreviewChip>{data.responseStatus}</PreviewChip> : null}
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <PreviewCode code={data.requestBody} language="json" />
            <PreviewCode code={data.responseBody} language="json" />
          </div>
        </div>
      )
    }

    case "graphql_operation": {
      const data = block.data as GraphqlOperationData
      return (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <PreviewChip>{data.operationType}</PreviewChip>
            {data.name.trim() ? <PreviewChip>{data.name}</PreviewChip> : null}
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            {summarizeText(data.description.trim(), 220) || "Capture the intent of the query or mutation before the raw operation."}
          </p>
          <PreviewCode code={data.code} language="graphql" />
        </div>
      )
    }

    default: {
      const preview = summarizeText(stripMarkdownFormatting(serializeBlock(block)), 240)
      const secondaryMeta: Record<BlockType, string | null> = {
        heading: null,
        text: null,
        code: null,
        table: null,
        callout: null,
        image: null,
        rest_endpoint: null,
        graphql_operation: null,
        graphql_schema: "Schema",
        webhook_event: (block.data as WebhookEventData).eventName || "Event",
        webhook_verify: (block.data as WebhookVerifyData).language || "Verification",
        webhook_retry: `${(block.data as WebhookRetryData).rows.length} retry steps`,
        steps: `${(block.data as StepsData).steps.length} steps`,
        dos_donts: `${(block.data as DosDontsData).dos.length + (block.data as DosDontsData).donts.length} rules`,
        param_table: `${(block.data as ParamTableData).params.length} params`,
        auth_config: (block.data as AuthConfigData).authType,
        error_responses: `${(block.data as ErrorResponsesData).responses.length} responses`,
        field_table: `${(block.data as FieldTableData).fields.length} fields`,
        server_config: `${(block.data as ServerConfigData).servers.length} servers`,
        schema_model: (block.data as SchemaModelData).name || "Model",
        rate_limit: `${(block.data as RateLimitData).limits.length} limits`,
        pagination_config: (block.data as PaginationConfigData).style,
        response_headers: `${(block.data as ResponseHeadersData).headers.length} headers`,
        security_scheme: (block.data as SecuritySchemeData).type,
      }

      return (
        <div className="space-y-3">
          {secondaryMeta[block.type] ? (
            <div className="flex flex-wrap gap-2">
              <PreviewChip>{secondaryMeta[block.type]}</PreviewChip>
            </div>
          ) : null}
          <p className="text-sm leading-6 text-muted-foreground">
            {preview || "Select this block to edit its fields in the inspector."}
          </p>
        </div>
      )
    }
  }
}

function VisualSupportBanner({ report }: { report: VisualEditingSupportReport }) {
  const bannerConfig = {
    structured: {
      icon: ShieldCheck,
      title: "Structured visual document",
      tone: "border-success/20 bg-success/[0.08] text-success",
    },
    compatible: {
      icon: Info,
      title: "Markdown compatible with visual mode",
      tone: "border-primary/15 bg-primary/[0.06] text-primary",
    },
    warning: {
      icon: AlertTriangle,
      title: "Visual mode will normalize part of this Markdown",
      tone: "border-warning/20 bg-warning/[0.08] text-warning",
    },
  }[report.fidelity]

  const Icon = bannerConfig.icon

  return (
    <div className={cn("rounded-2xl border p-4", bannerConfig.tone)}>
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          <div>
            <p className="text-sm font-semibold text-foreground">{bannerConfig.title}</p>
            <p className="text-xs text-muted-foreground">
              {report.hasSerializedMetadata
                ? "This page already uses Domino block metadata."
                : report.roundTripSafe
                  ? "You can keep editing visually without changing the current structure."
                  : "Keep Markdown mode for edits that depend on exact source formatting."}
            </p>
          </div>
        </div>
        {report.rawMarkdownBlockCount > 0 ? (
          <Badge variant="outline" className="ml-auto whitespace-nowrap border-border/70 bg-background/80 text-[11px]">
            {`${report.rawMarkdownBlockCount} raw Markdown section${report.rawMarkdownBlockCount === 1 ? "" : "s"}`}
          </Badge>
        ) : null}
      </div>
      <ul className="mt-3 space-y-1 text-xs leading-5 text-foreground">
        {report.details.map((detail) => (
          <li key={detail}>{detail}</li>
        ))}
      </ul>
    </div>
  )
}

function TemplateShelf({
  onInsertTemplate,
}: {
  onInsertTemplate: (templateId: BlockTemplateId) => void
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Start from a task</p>
          <h3 className="mt-1 text-lg font-semibold tracking-tight">Insert a ready-made doc section</h3>
        </div>
        <p className="max-w-sm text-right text-xs leading-5 text-muted-foreground">
          Use templates when you already know the job to be done. Fall back to single blocks only for custom layouts.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {blockTemplates.map((template) => {
          const Icon = template.icon
          return (
            <button
              key={template.id}
              type="button"
              className="rounded-2xl border border-border/70 bg-card p-4 text-left transition-colors hover:border-primary/30 hover:bg-primary/[0.04]"
              onClick={() => onInsertTemplate(template.id)}
            >
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-muted/60 p-2">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium">{template.title}</p>
                  <p className="text-xs text-muted-foreground">{template.description}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}

// ── Props ────────────────────────────────────────────────────────────────────

interface VisualDocEditorProps {
  content: string
  onChange: (content: string) => void
  readOnly?: boolean
  supportReport: VisualEditingSupportReport
}

export function VisualDocEditor({
  content,
  onChange,
  readOnly,
  supportReport,
}: VisualDocEditorProps) {
  const [blocks, setBlocks] = useState<ContentBlock[]>(() => parseMarkdownToBlocks(content))
  const [lastExternalContent, setLastExternalContent] = useState(content)
  const [activeBlockId, setActiveBlockId] = useState<UniqueIdentifier | null>(null)
  const [selectedBlockId, setSelectedBlockId] = useState<UniqueIdentifier | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragStart(event: DragStartEvent) {
    setActiveBlockId(event.active.id)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveBlockId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = blocks.findIndex((b) => b.id === active.id)
    const newIndex = blocks.findIndex((b) => b.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    syncAndUpdate(arrayMove(blocks, oldIndex, newIndex))
    setSelectedBlockId(active.id)
  }

  function handleDragCancel() {
    setActiveBlockId(null)
  }

  const activeBlock = activeBlockId ? blocks.find((b) => b.id === activeBlockId) : null
  const resolvedSelectedBlockId =
    selectedBlockId && blocks.some((block) => block.id === selectedBlockId)
      ? selectedBlockId
      : blocks[0]?.id ?? null
  const selectedBlockIndex = useMemo(
    () => blocks.findIndex((block) => block.id === resolvedSelectedBlockId),
    [blocks, resolvedSelectedBlockId],
  )
  const selectedBlock = selectedBlockIndex >= 0 ? blocks[selectedBlockIndex] : null

  // Re-parse blocks when content changes externally (e.g. switching from text mode)
  if (content !== lastExternalContent && content !== serializeBlocks(blocks)) {
    setBlocks(parseMarkdownToBlocks(content))
    setLastExternalContent(content)
  }

  const syncAndUpdate = useCallback(
    (nextBlocks: ContentBlock[]) => {
      setBlocks(nextBlocks)
      onChange(serializeBlocks(nextBlocks))
    },
    [onChange],
  )

  function updateBlock(index: number, updated: ContentBlock) {
    const next = [...blocks]
    next[index] = updated
    syncAndUpdate(next)
  }

  function removeBlock(index: number) {
    const next = blocks.filter((_, i) => i !== index)
    const fallbackSelection = next[index]?.id ?? next[index - 1]?.id ?? null
    syncAndUpdate(next)
    if (blocks[index]?.id === selectedBlockId) {
      setSelectedBlockId(fallbackSelection)
    }
  }

  function moveBlock(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= blocks.length) return
    const next = [...blocks]
    ;[next[index], next[target]] = [next[target], next[index]]
    syncAndUpdate(next)
  }

  function addBlock(type: BlockType, afterIndex?: number) {
    const block = createDefaultBlock(type)
    const next = [...blocks]
    const insertAt = afterIndex !== undefined ? afterIndex + 1 : next.length
    next.splice(insertAt, 0, block)
    syncAndUpdate(next)
    setSelectedBlockId(block.id)
  }

  function duplicateBlock(index: number) {
    const original = blocks[index]
    const copy: ContentBlock = {
      ...structuredClone(original),
      id: `blk-${crypto.randomUUID().slice(0, 8)}`,
    }
    const next = [...blocks]
    next.splice(index + 1, 0, copy)
    syncAndUpdate(next)
    setSelectedBlockId(copy.id)
  }

  function addTemplate(templateId: BlockTemplateId, afterIndex?: number) {
    const template = blockTemplates.find((item) => item.id === templateId)
    if (!template) return

    const templateBlocks = template.buildBlocks()
    const next = [...blocks]
    const insertAt = afterIndex !== undefined ? afterIndex + 1 : next.length
    next.splice(insertAt, 0, ...templateBlocks)
    syncAndUpdate(next)
    setSelectedBlockId(templateBlocks[0]?.id ?? null)
  }

  const available = availableBlocks

  return (
    <div className="flex h-full min-h-0 flex-col xl:flex-row">
      <div className="min-h-0 flex-1 xl:border-r">
        <ScrollArea className="h-full">
          <div className="mx-auto max-w-5xl space-y-4 p-6">
            <VisualSupportBanner report={supportReport} />

            {!readOnly ? <TemplateShelf onInsertTemplate={addTemplate} /> : null}

            {blocks.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border bg-muted/15 p-10 text-center">
                <p className="mb-4 text-sm text-muted-foreground">
                  No blocks yet. Start from a task template or insert a single block for a custom layout.
                </p>
                {!readOnly ? (
                  <AddBlockMenu
                    types={available}
                    onAdd={(type) => addBlock(type)}
                    onAddTemplate={(templateId) => addTemplate(templateId)}
                  />
                ) : null}
              </div>
            )}

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
            >
              <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                {blocks.map((block, index) => {
                  const appearanceClasses = getBlockAppearanceClasses(block.appearance)
                  const normalizedAppearance = normalizeBlockAppearance(block.appearance)
                  const isSelected = block.id === resolvedSelectedBlockId

                  return (
                    <SortableItem key={block.id} id={block.id} className="group relative">
                      <div
                        className={cn(
                          appearanceClasses.shell,
                          "cursor-pointer transition-[box-shadow,border-color,transform] duration-150",
                          isSelected
                            ? "ring-2 ring-primary/15 shadow-md shadow-black/[0.03]"
                            : "hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/[0.025]",
                        )}
                        onClick={() => setSelectedBlockId(block.id)}
                      >
                        <div className={cn(appearanceClasses.header, "rounded-t-[inherit]")}>
                          {!readOnly ? (
                            <DragHandle className="h-5 w-5" />
                          ) : (
                            <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50" />
                          )}
                          {renderBlockIcon(block.type, appearanceClasses.icon)}
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className={cn("px-2 py-0.5", appearanceClasses.badge)}>
                                {blockLabels[block.type]}
                              </Badge>
                              <span className="text-[11px] text-muted-foreground">
                                {blockPresetLabels[normalizedAppearance.preset]}
                              </span>
                            </div>
                          </div>
                          <div className="ml-auto">
                            {isSelected ? (
                              <Badge variant="secondary" className="px-2 py-0.5 text-[10px]">
                                Inspector
                              </Badge>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">Select to edit</span>
                            )}
                          </div>
                        </div>

                        <div className={appearanceClasses.body}>
                          <BlockPreview block={block} />
                        </div>
                      </div>

                      {!readOnly ? (
                        <div className="mt-1 -mb-1.5 flex justify-center">
                          <AddBlockMenu
                            types={available}
                            onAdd={(type) => addBlock(type, index)}
                            onAddTemplate={(templateId) => addTemplate(templateId, index)}
                            compact
                          />
                        </div>
                      ) : null}
                    </SortableItem>
                  )
                })}
              </SortableContext>
              <DragOverlay dropAnimation={null}>
                {activeBlock ? (
                  <div className="rounded-lg border border-primary/30 bg-card p-3 opacity-90 shadow-lg">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50" />
                      <Badge variant="secondary" className="px-1.5 text-[10px] font-normal">
                        {blockLabels[activeBlock.type]}
                      </Badge>
                    </div>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </ScrollArea>
      </div>

      <aside className="flex min-h-[24rem] flex-col border-t bg-muted/10 xl:min-h-0 xl:w-[380px] xl:border-t-0">
        <BlockInspector
          block={selectedBlock}
          blockIndex={selectedBlockIndex}
          totalBlocks={blocks.length}
          readOnly={readOnly}
          onChange={(updated) => {
            if (selectedBlockIndex === -1) return
            updateBlock(selectedBlockIndex, updated)
          }}
          onDuplicate={() => {
            if (selectedBlockIndex === -1) return
            duplicateBlock(selectedBlockIndex)
          }}
          onMoveUp={() => {
            if (selectedBlockIndex === -1) return
            moveBlock(selectedBlockIndex, -1)
          }}
          onMoveDown={() => {
            if (selectedBlockIndex === -1) return
            moveBlock(selectedBlockIndex, 1)
          }}
          onRemove={() => {
            if (selectedBlockIndex === -1) return
            removeBlock(selectedBlockIndex)
          }}
          onAddTemplate={addTemplate}
          onAddBlock={addBlock}
        />
      </aside>
    </div>
  )
}

// ── Add Block Menu ───────────────────────────────────────────────────────────

function AddBlockMenu({
  types,
  onAdd,
  onAddTemplate,
  compact,
}: {
  types: BlockType[]
  onAdd: (type: BlockType) => void
  onAddTemplate: (templateId: BlockTemplateId) => void
  compact?: boolean
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {compact ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 gap-1 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Plus className="h-3 w-3" />
            添加
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Insert content
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-72">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Task templates
        </DropdownMenuLabel>
        {blockTemplates.map((template) => {
          const Icon = template.icon
          return (
            <DropdownMenuItem key={template.id} onClick={() => onAddTemplate(template.id)} className="items-start gap-3 py-2">
              <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="text-sm">{template.title}</p>
                <p className="text-[11px] leading-4 text-muted-foreground">{template.description}</p>
              </div>
            </DropdownMenuItem>
          )
        })}

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Single blocks
        </DropdownMenuLabel>
        {types.map((type, i) => {
          const isCommon = commonBlocks.includes(type as CommonBlockType)
          const prevIsCommon = i > 0 && commonBlocks.includes(types[i - 1] as CommonBlockType)
          return (
            <div key={type}>
              {!isCommon && prevIsCommon && <DropdownMenuSeparator />}
              <DropdownMenuItem onClick={() => onAdd(type)}>
                {renderBlockIcon(type, "mr-2 h-3.5 w-3.5")}
                {blockLabels[type]}
              </DropdownMenuItem>
            </div>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function BlockInspector({
  block,
  blockIndex,
  totalBlocks,
  readOnly,
  onChange,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onRemove,
  onAddTemplate,
  onAddBlock,
}: {
  block: ContentBlock | null
  blockIndex: number
  totalBlocks: number
  readOnly?: boolean
  onChange: (updated: ContentBlock) => void
  onDuplicate: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onRemove: () => void
  onAddTemplate: (templateId: BlockTemplateId) => void
  onAddBlock: (type: BlockType) => void
}) {
  if (!block) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b px-5 py-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Inspector</p>
          <h3 className="mt-1 text-base font-semibold tracking-tight">Nothing selected</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Choose a block on the canvas to edit it here, or start a new document section below.
          </p>
        </div>
        {!readOnly ? (
          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-6 p-5">
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Start from a template</h4>
                <div className="grid gap-2">
                  {blockTemplates.map((template) => {
                    const Icon = template.icon
                    return (
                      <button
                        key={template.id}
                        type="button"
                        className="rounded-xl border border-border/70 bg-background px-3 py-3 text-left transition-colors hover:border-primary/30 hover:bg-primary/[0.04]"
                        onClick={() => onAddTemplate(template.id)}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <div>
                            <p className="text-sm font-medium">{template.title}</p>
                            <p className="text-xs text-muted-foreground">{template.description}</p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-medium">Or insert a single block</h4>
                <AddBlockMenu
                  types={availableBlocks}
                  onAdd={onAddBlock}
                  onAddTemplate={onAddTemplate}
                />
              </div>
            </div>
          </ScrollArea>
        ) : null}
      </div>
    )
  }

  const normalizedAppearance = normalizeBlockAppearance(block.appearance)
  const rawMarkdownNotice =
    block.type === "text" && looksLikeRichMarkdown((block.data as TextData).content)

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="rounded-full bg-muted/60 p-2">
            {renderBlockIcon(block.type, "h-4 w-4")}
          </span>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Inspector</p>
            <h3 className="mt-1 text-base font-semibold tracking-tight">{blockLabels[block.type]}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {totalBlocks > 0 ? `Block ${blockIndex + 1} of ${totalBlocks}` : "No blocks yet"}
            </p>
          </div>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-6 p-5">
          {!readOnly ? (
            <div className="space-y-3 rounded-2xl border border-border/70 bg-background p-4">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-medium">Block actions</h4>
                <Badge variant="outline" className="text-[10px]">
                  {blockLabels[block.type]}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={onMoveUp} disabled={blockIndex <= 0}>
                  <ArrowUp className="mr-1.5 h-3.5 w-3.5" />
                  Move up
                </Button>
                <Button variant="outline" size="sm" onClick={onMoveDown} disabled={blockIndex >= totalBlocks - 1}>
                  <ArrowDown className="mr-1.5 h-3.5 w-3.5" />
                  Move down
                </Button>
                <Button variant="outline" size="sm" onClick={onDuplicate}>
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
                  Duplicate
                </Button>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={onRemove}>
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
            </div>
          ) : null}

          {rawMarkdownNotice ? (
            <div className="rounded-2xl border border-warning/20 bg-warning/[0.08] p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <AlertTriangle className="h-4 w-4 text-warning" />
                This section stays as raw Markdown
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Use the Markdown field below for lists, embeds, or formatting patterns that Domino does not model as structured blocks yet.
              </p>
            </div>
          ) : null}

          {!readOnly ? (
            <div className="space-y-4 rounded-2xl border border-border/70 bg-background p-4">
              <div>
                <h4 className="text-sm font-medium">Appearance</h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Visual styling is saved with the block metadata and reused by the published renderer.
                </p>
              </div>
              <FieldRow className="md:grid-cols-3">
                <div>
                  <FieldLabel>Preset</FieldLabel>
                  <Select
                    value={normalizedAppearance.preset}
                    onValueChange={(value) =>
                      onChange({
                        ...block,
                        appearance: normalizeBlockAppearance({
                          ...block.appearance,
                          preset: value as typeof normalizedAppearance.preset,
                        }),
                      })
                    }
                  >
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(blockPresetLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <FieldLabel>Tone</FieldLabel>
                  <Select
                    value={normalizedAppearance.tone}
                    onValueChange={(value) =>
                      onChange({
                        ...block,
                        appearance: normalizeBlockAppearance({
                          ...block.appearance,
                          tone: value as typeof normalizedAppearance.tone,
                        }),
                      })
                    }
                  >
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(blockToneLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <FieldLabel>Density</FieldLabel>
                  <Select
                    value={normalizedAppearance.density}
                    onValueChange={(value) =>
                      onChange({
                        ...block,
                        appearance: normalizeBlockAppearance({
                          ...block.appearance,
                          density: value as typeof normalizedAppearance.density,
                        }),
                      })
                    }
                  >
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(blockDensityLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </FieldRow>
            </div>
          ) : null}

          <div className="space-y-4 rounded-2xl border border-border/70 bg-background p-4">
            <div>
              <h4 className="text-sm font-medium">Block content</h4>
              <p className="mt-1 text-xs text-muted-foreground">
                Edit the selected block here while keeping the canvas focused on structure and order.
              </p>
            </div>
            <BlockEditor
              block={block}
              onChange={onChange}
              readOnly={readOnly}
            />
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

// ── Block Editor Dispatcher ──────────────────────────────────────────────────

function BlockEditor({
  block,
  onChange,
  readOnly,
}: {
  block: ContentBlock
  onChange: (updated: ContentBlock) => void
  readOnly?: boolean
}) {
  function update<T>(patch: Partial<T>) {
    if (block.type === "text") {
      const nextContent = (patch as Partial<TextData>).content
      if (typeof nextContent === "string") {
        const standaloneCode = extractStandaloneCodeBlockData(nextContent)
        if (standaloneCode) {
          onChange({
            id: block.id,
            type: "code",
            data: standaloneCode,
            appearance: block.appearance,
          })
          return
        }
      }
    }

    onChange({ ...block, data: { ...block.data, ...patch } })
  }

  switch (block.type) {
    case "heading":
      return <HeadingBlockEditor data={block.data as HeadingData} onChange={update} readOnly={readOnly} />
    case "text":
      return <TextBlockEditor data={block.data as TextData} onChange={update} readOnly={readOnly} />
    case "code":
      return <CodeBlockEditor data={block.data as CodeData} onChange={update} readOnly={readOnly} />
    case "table":
      return <TableBlockEditor data={block.data as TableData} onChange={update} readOnly={readOnly} />
    case "callout":
      return <CalloutBlockEditor data={block.data as CalloutData} onChange={update} readOnly={readOnly} />
    case "image":
      return <ImageBlockEditor data={block.data as ImageData} onChange={update} readOnly={readOnly} />
    case "rest_endpoint":
      return <RestEndpointBlockEditor data={block.data as RestEndpointData} onChange={update} readOnly={readOnly} />
    case "graphql_operation":
      return <GraphqlOperationBlockEditor data={block.data as GraphqlOperationData} onChange={update} readOnly={readOnly} />
    case "graphql_schema":
      return <GraphqlSchemaBlockEditor data={block.data as GraphqlSchemaData} onChange={update} readOnly={readOnly} />
    case "webhook_event":
      return <WebhookEventBlockEditor data={block.data as WebhookEventData} onChange={update} readOnly={readOnly} />
    case "webhook_verify":
      return <WebhookVerifyBlockEditor data={block.data as WebhookVerifyData} onChange={update} readOnly={readOnly} />
    case "webhook_retry":
      return <WebhookRetryBlockEditor data={block.data as WebhookRetryData} onChange={update} readOnly={readOnly} />
    case "steps":
      return <StepsBlockEditor data={block.data as StepsData} onChange={update} readOnly={readOnly} />
    case "dos_donts":
      return <DosDontsBlockEditor data={block.data as DosDontsData} onChange={update} readOnly={readOnly} />
    case "param_table":
      return <ParamTableBlockEditor data={block.data as ParamTableData} onChange={update} readOnly={readOnly} />
    case "auth_config":
      return <AuthConfigBlockEditor data={block.data as AuthConfigData} onChange={update} readOnly={readOnly} />
    case "error_responses":
      return <ErrorResponsesBlockEditor data={block.data as ErrorResponsesData} onChange={update} readOnly={readOnly} />
    case "field_table":
      return <FieldTableBlockEditor data={block.data as FieldTableData} onChange={update} readOnly={readOnly} />
    case "server_config":
      return <ServerConfigBlockEditor data={block.data as ServerConfigData} onChange={update} readOnly={readOnly} />
    case "schema_model":
      return <SchemaModelBlockEditor data={block.data as SchemaModelData} onChange={update} readOnly={readOnly} />
    case "rate_limit":
      return <RateLimitBlockEditor data={block.data as RateLimitData} onChange={update} readOnly={readOnly} />
    case "pagination_config":
      return <PaginationConfigBlockEditor data={block.data as PaginationConfigData} onChange={update} readOnly={readOnly} />
    case "response_headers":
      return <ResponseHeadersBlockEditor data={block.data as ResponseHeadersData} onChange={update} readOnly={readOnly} />
    case "security_scheme":
      return <SecuritySchemeBlockEditor data={block.data as SecuritySchemeData} onChange={update} readOnly={readOnly} />
    default:
      return <p className="text-xs text-muted-foreground">Unsupported block type</p>
  }
}

// ── Shared helpers ───────────────────────────────────────────────────────────

function FieldRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid gap-3", className)}>{children}</div>
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <Label className="text-xs text-muted-foreground">{children}</Label>
}

// ── Individual Block Editors ─────────────────────────────────────────────────

function HeadingBlockEditor({
  data,
  onChange,
  readOnly,
}: {
  data: HeadingData
  onChange: (patch: Partial<HeadingData>) => void
  readOnly?: boolean
}) {
  return (
    <div className="space-y-3">
      <FieldRow className="grid-cols-[80px_1fr]">
        <div>
          <FieldLabel>层级</FieldLabel>
          <Select
            value={String(data.level)}
            onValueChange={(v) => onChange({ level: Number(v) as 2 | 3 })}
            disabled={readOnly}
          >
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="2">H2</SelectItem>
              <SelectItem value="3">H3</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <FieldLabel>标题文本</FieldLabel>
          <Input
            value={data.text}
            onChange={(e) => onChange({ text: e.target.value })}
            className="h-8 text-sm font-semibold"
            readOnly={readOnly}
          />
        </div>
      </FieldRow>
      <div>
        <FieldLabel>描述（可选）</FieldLabel>
        <Textarea
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Section description..."
          className="text-xs min-h-16"
          rows={2}
          readOnly={readOnly}
        />
      </div>
    </div>
  )
}

function TextBlockEditor({
  data,
  onChange,
  readOnly,
}: {
  data: TextData
  onChange: (patch: Partial<TextData>) => void
  readOnly?: boolean
}) {
  return (
    <MarkdownEditor
      value={data.content}
      onChange={(value) => onChange({ content: value })}
      placeholder="Write Markdown here..."
      readOnly={readOnly}
      minHeight="220px"
    />
  )
}

function CodeBlockEditor({
  data,
  onChange,
  readOnly,
}: {
  data: CodeData
  onChange: (patch: Partial<CodeData>) => void
  readOnly?: boolean
}) {
  const selectLanguage = data.language || "plain_text"
  const editorLanguage = data.language || undefined

  return (
    <div className="space-y-3">
      <FieldRow className="grid-cols-[140px_1fr]">
        <div>
          <FieldLabel>语言</FieldLabel>
          <Select
            value={selectLanguage}
            onValueChange={(v) => onChange({ language: v === "plain_text" ? "" : v })}
            disabled={readOnly}
          >
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CODE_LANGUAGES.map((l) => (
                <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <FieldLabel>说明（可选）</FieldLabel>
          <Input
            value={data.caption}
            onChange={(e) => onChange({ caption: e.target.value })}
            className="h-8 text-xs"
            placeholder="Code block caption..."
            readOnly={readOnly}
          />
        </div>
      </FieldRow>
      <CodeEditor
        value={data.code}
        onChange={(v) => onChange({ code: v })}
        language={editorLanguage}
        placeholder="// Code here..."
        minHeight="160px"
        readOnly={readOnly}
      />
    </div>
  )
}

function TableBlockEditor({
  data,
  onChange,
  readOnly,
}: {
  data: TableData
  onChange: (patch: Partial<TableData>) => void
  readOnly?: boolean
}) {
  function updateHeader(colIdx: number, value: string) {
    const next = [...data.headers]
    next[colIdx] = value
    onChange({ headers: next })
  }

  function updateCell(rowIdx: number, colIdx: number, value: string) {
    const next = data.rows.map((r) => [...r])
    next[rowIdx][colIdx] = value
    onChange({ rows: next })
  }

  function addColumn() {
    onChange({
      headers: [...data.headers, "New Column"],
      rows: data.rows.map((r) => [...r, ""]),
    })
  }

  function removeColumn(colIdx: number) {
    onChange({
      headers: data.headers.filter((_, i) => i !== colIdx),
      rows: data.rows.map((r) => r.filter((_, i) => i !== colIdx)),
    })
  }

  function addRow() {
    onChange({ rows: [...data.rows, data.headers.map(() => "")] })
  }

  function removeRow(rowIdx: number) {
    onChange({ rows: data.rows.filter((_, i) => i !== rowIdx) })
  }

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              {data.headers.map((h, i) => (
                <th key={i} className="border-b p-1.5">
                  <div className="flex items-center gap-1">
                    <Input
                      value={h}
                      onChange={(e) => updateHeader(i, e.target.value)}
                      className="h-6 text-xs font-semibold"
                      readOnly={readOnly}
                    />
                    {!readOnly && data.headers.length > 1 && (
                      <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={() => removeColumn(i)}>
                        <Trash2 className="h-2.5 w-2.5" />
                      </Button>
                    )}
                  </div>
                </th>
              ))}
              {!readOnly && (
                <th className="w-8">
                  <Button variant="ghost" size="icon-sm" onClick={addColumn}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td key={ci} className="border-b p-1.5">
                    <Input
                      value={cell}
                      onChange={(e) => updateCell(ri, ci, e.target.value)}
                      className="h-6 text-xs"
                      readOnly={readOnly}
                    />
                  </td>
                ))}
                {!readOnly && (
                  <td className="w-8 border-b">
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => removeRow(ri)}>
                      <Trash2 className="h-2.5 w-2.5" />
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!readOnly && (
        <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={addRow}>
          <Plus className="h-3 w-3" /> 添加行
        </Button>
      )}
    </div>
  )
}

function CalloutBlockEditor({
  data,
  onChange,
  readOnly,
}: {
  data: CalloutData
  onChange: (patch: Partial<CalloutData>) => void
  readOnly?: boolean
}) {
  const variantStyles = calloutVariantStyles

  const variantIcons = {
    tip: Lightbulb,
    warning: AlertTriangle,
    info: Info,
  }

  const Icon = variantIcons[data.variant]

  return (
    <div className={cn("rounded-r-md border-l-4 p-3 space-y-2", variantStyles[data.variant])}>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <Select value={data.variant} onValueChange={(v) => onChange({ variant: v as CalloutData["variant"] })} disabled={readOnly}>
          <SelectTrigger className="h-7 w-28 text-xs bg-transparent border-0 shadow-none"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="tip">💡 Tip</SelectItem>
            <SelectItem value="warning">⚠️ Warning</SelectItem>
            <SelectItem value="info">ℹ️ Note</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Input
        value={data.text}
        onChange={(e) => onChange({ text: e.target.value })}
        className="text-sm bg-transparent border-0 shadow-none px-0 h-8"
        placeholder="Callout text..."
        readOnly={readOnly}
      />
    </div>
  )
}

function ImageBlockEditor({
  data,
  onChange,
  readOnly,
}: {
  data: ImageData
  onChange: (patch: Partial<ImageData>) => void
  readOnly?: boolean
}) {
  const [dragOver, setDragOver] = useState(false)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = () => {
        onChange({ src: reader.result as string, alt: file.name })
      }
      reader.readAsDataURL(file)
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = () => {
        onChange({ src: reader.result as string, alt: file.name })
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="space-y-3">
      {data.src ? (
        <div className="space-y-3">
          <div className="relative rounded-lg border overflow-hidden bg-muted/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.src}
              alt={data.alt}
              className="max-h-80 w-full object-contain"
            />
            {!readOnly && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 h-6 w-6 bg-background/80 hover:bg-background"
                onClick={() => onChange({ src: "", alt: "", caption: "" })}
                aria-label="Remove image"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          <FieldRow className="grid-cols-2">
            <div>
              <FieldLabel>Alt text</FieldLabel>
              <Input
                value={data.alt}
                onChange={(e) => onChange({ alt: e.target.value })}
                placeholder="Image description..."
                className="text-sm"
                readOnly={readOnly}
              />
            </div>
            <div>
              <FieldLabel>Caption</FieldLabel>
              <Input
                value={data.caption}
                onChange={(e) => onChange({ caption: e.target.value })}
                placeholder="Caption (optional)"
                className="text-sm"
                readOnly={readOnly}
              />
            </div>
          </FieldRow>
        </div>
      ) : (
        <div className="space-y-3">
          <div
            className={cn(
              "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
              dragOver ? "border-primary bg-primary/5" : "border-border",
              !readOnly && "cursor-pointer hover:border-primary/50",
            )}
            onDragOver={(e) => { e.preventDefault(); if (!readOnly) setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={!readOnly ? handleDrop : undefined}
            onClick={() => {
              if (readOnly) return
              document.getElementById(`img-upload-${data.alt || "new"}`)?.click()
            }}
          >
            <ImageIcon className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-xs text-muted-foreground">
              {readOnly ? "No image" : "Drop an image here or click to upload"}
            </p>
            {!readOnly && (
              <input
                id={`img-upload-${data.alt || "new"}`}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            )}
          </div>
          {!readOnly && (
            <div>
              <FieldLabel>Or paste image URL</FieldLabel>
              <Input
                value={data.src}
                onChange={(e) => onChange({ src: e.target.value })}
                placeholder="https://example.com/image.png"
                className="text-sm"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function RestEndpointBlockEditor({
  data,
  onChange,
  readOnly,
}: {
  data: RestEndpointData
  onChange: (patch: Partial<RestEndpointData>) => void
  readOnly?: boolean
}) {
  const [localMd, setLocalMd] = useState<string | null>(null)

  const serializedMd = serializeEditorBlock("rest_endpoint", data)
  const displayMd = localMd ?? serializedMd

  function handleMdChange(md: string) {
    setLocalMd(md)
    const parsed = parseBlockFromMarkdown("rest_endpoint", md)
    if (parsed) onChange(parsed)
  }

  function handleTabChange(value: string) {
    if (value === "ui") setLocalMd(null)
  }

  function updateHeader(idx: number, field: "key" | "value", value: string) {
    const next = [...data.headers]
    next[idx] = { ...next[idx], [field]: value }
    onChange({ headers: next })
  }

  function addHeader() {
    onChange({ headers: [...data.headers, { key: "", value: "" }] })
  }

  function removeHeader(idx: number) {
    onChange({ headers: data.headers.filter((_, i) => i !== idx) })
  }


  return (
    <Tabs defaultValue="ui" onValueChange={handleTabChange}>
      <TabsList className="h-8">
        <TabsTrigger value="ui" className="text-xs">可视化</TabsTrigger>
        <TabsTrigger value="text" className="text-xs">Markdown</TabsTrigger>
      </TabsList>
      <TabsContent value="ui" className="mt-3">
        <div className="space-y-4">
          {/* Method + Path */}
          <FieldRow className="grid-cols-[110px_1fr]">
            <div>
              <FieldLabel>方法</FieldLabel>
              <Select value={data.method} onValueChange={(v) => onChange({ method: v })} disabled={readOnly}>
                <SelectTrigger className={cn("h-8 text-xs font-mono font-bold", methodColors[data.method])}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["GET", "POST", "PUT", "DELETE", "PATCH"].map((m) => (
                    <SelectItem key={m} value={m} className="font-mono font-bold">{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <FieldLabel>路径</FieldLabel>
              <Input
                value={data.path}
                onChange={(e) => onChange({ path: e.target.value })}
                className="h-8 font-mono text-xs"
                placeholder="/v1/resource"
                readOnly={readOnly}
              />
            </div>
          </FieldRow>

          <div>
            <FieldLabel>描述</FieldLabel>
            <Input
              value={data.description}
              onChange={(e) => onChange({ description: e.target.value })}
              className="h-8 text-xs"
              placeholder="What this endpoint does..."
              readOnly={readOnly}
            />
          </div>

          {/* Headers */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <FieldLabel>请求头</FieldLabel>
              {!readOnly && (
                <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={addHeader}>
                  <Plus className="h-3 w-3" /> 添加
                </Button>
              )}
            </div>
            {data.headers.map((h, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={h.key}
                  onChange={(e) => updateHeader(i, "key", e.target.value)}
                  className="h-7 text-xs font-mono flex-1"
                  placeholder="Header name"
                  readOnly={readOnly}
                />
                <span className="text-muted-foreground text-xs">:</span>
                <Input
                  value={h.value}
                  onChange={(e) => updateHeader(i, "value", e.target.value)}
                  className="h-7 text-xs font-mono flex-1"
                  placeholder="Value"
                  readOnly={readOnly}
                />
                {!readOnly && (
                  <Button variant="ghost" size="icon-sm" className="shrink-0" onClick={() => removeHeader(i)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Request Body */}
          <div>
            <FieldLabel>请求体 (JSON)</FieldLabel>
            <CodeEditor
              value={data.requestBody}
              onChange={(v) => onChange({ requestBody: v })}
              language="json"
              placeholder='{ "key": "value" }'
              minHeight="120px"
              readOnly={readOnly}
            />
          </div>

          {/* Response */}
          <FieldRow className="grid-cols-[160px_1fr]">
            <div>
              <FieldLabel>响应状态</FieldLabel>
              <Input
                value={data.responseStatus}
                onChange={(e) => onChange({ responseStatus: e.target.value })}
                className="h-8 text-xs font-mono"
                placeholder="200 OK"
                readOnly={readOnly}
              />
            </div>
            <div>
              <FieldLabel>响应体 (JSON)</FieldLabel>
              <CodeEditor
                value={data.responseBody}
                onChange={(v) => onChange({ responseBody: v })}
                language="json"
                placeholder='{ "id": "..." }'
                minHeight="120px"
                readOnly={readOnly}
              />
            </div>
          </FieldRow>
        </div>
      </TabsContent>
      <TabsContent value="text" className="mt-3">
        <MarkdownEditor
          value={displayMd}
          onChange={handleMdChange}
          readOnly={readOnly}
          minHeight="200px"
        />
      </TabsContent>
    </Tabs>
  )
}

function GraphqlOperationBlockEditor({
  data,
  onChange,
  readOnly,
}: {
  data: GraphqlOperationData
  onChange: (patch: Partial<GraphqlOperationData>) => void
  readOnly?: boolean
}) {
  const [localMd, setLocalMd] = useState<string | null>(null)

  const serializedMd = serializeEditorBlock("graphql_operation", data)
  const displayMd = localMd ?? serializedMd

  function handleMdChange(md: string) {
    setLocalMd(md)
    const parsed = parseBlockFromMarkdown("graphql_operation", md)
    if (parsed) onChange(parsed)
  }

  function handleTabChange(value: string) {
    if (value === "ui") setLocalMd(null)
  }

  return (
    <Tabs defaultValue="ui" onValueChange={handleTabChange}>
      <TabsList className="h-8">
        <TabsTrigger value="ui" className="text-xs">可视化</TabsTrigger>
        <TabsTrigger value="text" className="text-xs">Markdown</TabsTrigger>
      </TabsList>
      <TabsContent value="ui" className="mt-3">
        <div className="space-y-3">
          <FieldRow className="grid-cols-[120px_1fr]">
            <div>
              <FieldLabel>操作类型</FieldLabel>
              <Select value={data.operationType} onValueChange={(v) => onChange({ operationType: v as "query" | "mutation" })} disabled={readOnly}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="query">Query</SelectItem>
                  <SelectItem value="mutation">Mutation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <FieldLabel>操作名称</FieldLabel>
              <Input
                value={data.name}
                onChange={(e) => onChange({ name: e.target.value })}
                className="h-8 text-xs"
                placeholder="GetResources"
                readOnly={readOnly}
              />
            </div>
          </FieldRow>

          <div>
            <FieldLabel>描述（可选）</FieldLabel>
            <Input
              value={data.description}
              onChange={(e) => onChange({ description: e.target.value })}
              className="h-8 text-xs"
              placeholder="What this operation does..."
              readOnly={readOnly}
            />
          </div>

          <div>
            <FieldLabel>GraphQL</FieldLabel>
            <CodeEditor
              value={data.code}
              onChange={(v) => onChange({ code: v })}
              language="graphql"
              placeholder="query { ... }"
              minHeight="180px"
              readOnly={readOnly}
            />
          </div>

          <div>
            <FieldLabel>变量 (JSON)</FieldLabel>
            <CodeEditor
              value={data.variables}
              onChange={(v) => onChange({ variables: v })}
              language="json"
              placeholder='{ "first": 10 }'
              minHeight="80px"
              readOnly={readOnly}
            />
          </div>
        </div>
      </TabsContent>
      <TabsContent value="text" className="mt-3">
        <MarkdownEditor
          value={displayMd}
          onChange={handleMdChange}
          readOnly={readOnly}
          minHeight="200px"
        />
      </TabsContent>
    </Tabs>
  )
}

function GraphqlSchemaBlockEditor({
  data,
  onChange,
  readOnly,
}: {
  data: GraphqlSchemaData
  onChange: (patch: Partial<GraphqlSchemaData>) => void
  readOnly?: boolean
}) {
  const [localMd, setLocalMd] = useState<string | null>(null)

  const serializedMd = serializeEditorBlock("graphql_schema", data)
  const displayMd = localMd ?? serializedMd

  function handleMdChange(md: string) {
    setLocalMd(md)
    const parsed = parseBlockFromMarkdown("graphql_schema", md)
    if (parsed) onChange(parsed)
  }

  function handleTabChange(value: string) {
    if (value === "ui") setLocalMd(null)
  }

  return (
    <Tabs defaultValue="ui" onValueChange={handleTabChange}>
      <TabsList className="h-8">
        <TabsTrigger value="ui" className="text-xs">可视化</TabsTrigger>
        <TabsTrigger value="text" className="text-xs">Markdown</TabsTrigger>
      </TabsList>
      <TabsContent value="ui" className="mt-3">
        <div>
          <FieldLabel>Schema Definition (GraphQL)</FieldLabel>
          <CodeEditor
            value={data.code}
            onChange={(v) => onChange({ code: v })}
            language="graphql"
            placeholder="type Query { ... }"
            minHeight="220px"
            readOnly={readOnly}
          />
        </div>
      </TabsContent>
      <TabsContent value="text" className="mt-3">
        <MarkdownEditor
          value={displayMd}
          onChange={handleMdChange}
          readOnly={readOnly}
          minHeight="200px"
        />
      </TabsContent>
    </Tabs>
  )
}

function WebhookEventBlockEditor({
  data,
  onChange,
  readOnly,
}: {
  data: WebhookEventData
  onChange: (patch: Partial<WebhookEventData>) => void
  readOnly?: boolean
}) {
  const [localMd, setLocalMd] = useState<string | null>(null)

  const serializedMd = serializeEditorBlock("webhook_event", data)
  const displayMd = localMd ?? serializedMd

  function handleMdChange(md: string) {
    setLocalMd(md)
    const parsed = parseBlockFromMarkdown("webhook_event", md)
    if (parsed) onChange(parsed)
  }

  function handleTabChange(value: string) {
    if (value === "ui") setLocalMd(null)
  }

  return (
    <Tabs defaultValue="ui" onValueChange={handleTabChange}>
      <TabsList className="h-8">
        <TabsTrigger value="ui" className="text-xs">可视化</TabsTrigger>
        <TabsTrigger value="text" className="text-xs">Markdown</TabsTrigger>
      </TabsList>
      <TabsContent value="ui" className="mt-3">
        <div className="space-y-3">
          <FieldRow className="grid-cols-[200px_1fr]">
            <div>
              <FieldLabel>事件名称</FieldLabel>
              <Input
                value={data.eventName}
                onChange={(e) => onChange({ eventName: e.target.value })}
                className="h-8 text-xs font-mono"
                placeholder="resource.created"
                readOnly={readOnly}
              />
            </div>
            <div>
              <FieldLabel>描述</FieldLabel>
              <Input
                value={data.description}
                onChange={(e) => onChange({ description: e.target.value })}
                className="h-8 text-xs"
                placeholder="When this event is triggered..."
                readOnly={readOnly}
              />
            </div>
          </FieldRow>
          <div>
            <FieldLabel>Payload (JSON)</FieldLabel>
            <CodeEditor
              value={data.payload}
              onChange={(v) => onChange({ payload: v })}
              language="json"
              placeholder='{ "event": "...", "data": {} }'
              minHeight="160px"
              readOnly={readOnly}
            />
          </div>
        </div>
      </TabsContent>
      <TabsContent value="text" className="mt-3">
        <MarkdownEditor
          value={displayMd}
          onChange={handleMdChange}
          readOnly={readOnly}
          minHeight="200px"
        />
      </TabsContent>
    </Tabs>
  )
}

function WebhookVerifyBlockEditor({
  data,
  onChange,
  readOnly,
}: {
  data: WebhookVerifyData
  onChange: (patch: Partial<WebhookVerifyData>) => void
  readOnly?: boolean
}) {
  const [localMd, setLocalMd] = useState<string | null>(null)

  const serializedMd = serializeEditorBlock("webhook_verify", data)
  const displayMd = localMd ?? serializedMd

  function handleMdChange(md: string) {
    setLocalMd(md)
    const parsed = parseBlockFromMarkdown("webhook_verify", md)
    if (parsed) onChange(parsed)
  }

  function handleTabChange(value: string) {
    if (value === "ui") setLocalMd(null)
  }

  return (
    <Tabs defaultValue="ui" onValueChange={handleTabChange}>
      <TabsList className="h-8">
        <TabsTrigger value="ui" className="text-xs">可视化</TabsTrigger>
        <TabsTrigger value="text" className="text-xs">Markdown</TabsTrigger>
      </TabsList>
      <TabsContent value="ui" className="mt-3">
        <div className="space-y-3">
          <div>
            <FieldLabel>说明</FieldLabel>
            <Textarea
              value={data.description}
              onChange={(e) => onChange({ description: e.target.value })}
              className="text-xs min-h-12"
              rows={2}
              readOnly={readOnly}
            />
          </div>
          <FieldRow className="grid-cols-[120px_1fr]">
            <div>
              <FieldLabel>语言</FieldLabel>
              <Select value={data.language} onValueChange={(v) => onChange({ language: v })} disabled={readOnly}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["javascript", "typescript", "python", "go", "ruby", "java"].map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </FieldRow>
          <div>
            <FieldLabel>验证代码</FieldLabel>
            <CodeEditor
              value={data.code}
              onChange={(v) => onChange({ code: v })}
              language={data.language}
              placeholder="// Verification code..."
              minHeight="180px"
              readOnly={readOnly}
            />
          </div>
        </div>
      </TabsContent>
      <TabsContent value="text" className="mt-3">
        <MarkdownEditor
          value={displayMd}
          onChange={handleMdChange}
          readOnly={readOnly}
          minHeight="200px"
        />
      </TabsContent>
    </Tabs>
  )
}

function WebhookRetryBlockEditor({
  data,
  onChange,
  readOnly,
}: {
  data: WebhookRetryData
  onChange: (patch: Partial<WebhookRetryData>) => void
  readOnly?: boolean
}) {
  const [localMd, setLocalMd] = useState<string | null>(null)

  const serializedMd = serializeEditorBlock("webhook_retry", data)
  const displayMd = localMd ?? serializedMd

  function handleMdChange(md: string) {
    setLocalMd(md)
    const parsed = parseBlockFromMarkdown("webhook_retry", md)
    if (parsed) onChange(parsed)
  }

  function handleTabChange(value: string) {
    if (value === "ui") setLocalMd(null)
  }

  function updateRow(idx: number, field: "attempt" | "delay", value: string) {
    const next = [...data.rows]
    next[idx] = { ...next[idx], [field]: value }
    onChange({ rows: next })
  }

  function addRow() {
    onChange({ rows: [...data.rows, { attempt: "", delay: "" }] })
  }

  function removeRow(idx: number) {
    onChange({ rows: data.rows.filter((_, i) => i !== idx) })
  }

  return (
    <Tabs defaultValue="ui" onValueChange={handleTabChange}>
      <TabsList className="h-8">
        <TabsTrigger value="ui" className="text-xs">可视化</TabsTrigger>
        <TabsTrigger value="text" className="text-xs">Markdown</TabsTrigger>
      </TabsList>
      <TabsContent value="ui" className="mt-3">
        <div className="space-y-3">
          <div>
            <FieldLabel>说明</FieldLabel>
            <Input
              value={data.description}
              onChange={(e) => onChange({ description: e.target.value })}
              className="h-8 text-xs"
              readOnly={readOnly}
            />
          </div>
          <div className="space-y-1.5">
            <div className="grid grid-cols-[1fr_1fr_32px] gap-2 text-[10px] font-medium text-muted-foreground px-1">
              <span>重试次数</span>
              <span>延迟</span>
            </div>
            {data.rows.map((row, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_32px] gap-2">
                <Input
                  value={row.attempt}
                  onChange={(e) => updateRow(i, "attempt", e.target.value)}
                  className="h-7 text-xs"
                  readOnly={readOnly}
                />
                <Input
                  value={row.delay}
                  onChange={(e) => updateRow(i, "delay", e.target.value)}
                  className="h-7 text-xs"
                  readOnly={readOnly}
                />
                {!readOnly && (
                  <Button variant="ghost" size="icon-sm" onClick={() => removeRow(i)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
            {!readOnly && (
              <Button variant="ghost" size="sm" className="text-xs gap-1 mt-1" onClick={addRow}>
                <Plus className="h-3 w-3" /> 添加行
              </Button>
            )}
          </div>
        </div>
      </TabsContent>
      <TabsContent value="text" className="mt-3">
        <MarkdownEditor
          value={displayMd}
          onChange={handleMdChange}
          readOnly={readOnly}
          minHeight="200px"
        />
      </TabsContent>
    </Tabs>
  )
}

function StepsBlockEditor({
  data,
  onChange,
  readOnly,
}: {
  data: StepsData
  onChange: (patch: Partial<StepsData>) => void
  readOnly?: boolean
}) {
  function updateStep(idx: number, field: "label" | "description", value: string) {
    const next = [...data.steps]
    next[idx] = { ...next[idx], [field]: value }
    onChange({ steps: next })
  }

  function addStep() {
    onChange({ steps: [...data.steps, { label: "New step", description: "" }] })
  }

  function removeStep(idx: number) {
    onChange({ steps: data.steps.filter((_, i) => i !== idx) })
  }

  return (
    <div className="space-y-3">
      <div>
        <FieldLabel>标题</FieldLabel>
        <Input
          value={data.title}
          onChange={(e) => onChange({ title: e.target.value })}
          className="h-8 text-xs"
          placeholder="Steps"
          readOnly={readOnly}
        />
      </div>
      <div className="space-y-2">
        {data.steps.map((step, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {i + 1}
            </span>
            <div className="flex-1 grid grid-cols-[1fr_1.5fr] gap-2">
              <Input
                value={step.label}
                onChange={(e) => updateStep(i, "label", e.target.value)}
                className="h-7 text-xs font-medium"
                placeholder="Step label"
                readOnly={readOnly}
              />
              <Input
                value={step.description}
                onChange={(e) => updateStep(i, "description", e.target.value)}
                className="h-7 text-xs"
                placeholder="Description..."
                readOnly={readOnly}
              />
            </div>
            {!readOnly && (
              <Button variant="ghost" size="icon-sm" className="shrink-0" onClick={() => removeStep(i)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
        {!readOnly && (
          <Button variant="ghost" size="sm" className="text-xs gap-1 mt-1" onClick={addStep}>
            <Plus className="h-3 w-3" /> 添加步骤
          </Button>
        )}
      </div>
    </div>
  )
}

function DosDontsBlockEditor({
  data,
  onChange,
  readOnly,
}: {
  data: DosDontsData
  onChange: (patch: Partial<DosDontsData>) => void
  readOnly?: boolean
}) {
  function updateItem(list: "dos" | "donts", idx: number, value: string) {
    const next = [...data[list]]
    next[idx] = value
    onChange({ [list]: next })
  }

  function addItem(list: "dos" | "donts") {
    onChange({ [list]: [...data[list], ""] })
  }

  function removeItem(list: "dos" | "donts", idx: number) {
    onChange({ [list]: data[list].filter((_, i) => i !== idx) })
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          ✅ 推荐
        </div>
        {data.dos.map((item, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="text-emerald-500 text-xs">•</span>
            <Input
              value={item}
              onChange={(e) => updateItem("dos", i, e.target.value)}
              className="h-7 text-xs flex-1"
              readOnly={readOnly}
            />
            {!readOnly && (
              <Button variant="ghost" size="icon-sm" className="shrink-0" onClick={() => removeItem("dos", i)}>
                <Trash2 className="h-2.5 w-2.5" />
              </Button>
            )}
          </div>
        ))}
        {!readOnly && (
          <Button variant="ghost" size="sm" className="text-[10px] gap-1" onClick={() => addItem("dos")}>
            <Plus className="h-3 w-3" /> 添加
          </Button>
        )}
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-destructive">
          ❌ 避免
        </div>
        {data.donts.map((item, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="text-destructive text-xs">•</span>
            <Input
              value={item}
              onChange={(e) => updateItem("donts", i, e.target.value)}
              className="h-7 text-xs flex-1"
              readOnly={readOnly}
            />
            {!readOnly && (
              <Button variant="ghost" size="icon-sm" className="shrink-0" onClick={() => removeItem("donts", i)}>
                <Trash2 className="h-2.5 w-2.5" />
              </Button>
            )}
          </div>
        ))}
        {!readOnly && (
          <Button variant="ghost" size="sm" className="text-[10px] gap-1" onClick={() => addItem("donts")}>
            <Plus className="h-3 w-3" /> 添加
          </Button>
        )}
      </div>
    </div>
  )
}

// ── Param Table Block Editor ─────────────────────────────────────────────────

const PARAM_TYPES = ["string", "integer", "number", "boolean", "array", "object"] as const

function ParamTableBlockEditor({
  data,
  onChange,
  readOnly,
}: {
  data: ParamTableData
  onChange: (patch: Partial<ParamTableData>) => void
  readOnly?: boolean
}) {
  function updateParam(idx: number, patch: Partial<ParamTableData["params"][number]>) {
    const next = [...data.params]
    next[idx] = { ...next[idx], ...patch }
    onChange({ params: next })
  }

  function addParam() {
    onChange({ params: [...data.params, { name: "", type: "string", required: false, description: "" }] })
  }

  function removeParam(idx: number) {
    onChange({ params: data.params.filter((_, i) => i !== idx) })
  }

  return (
    <div className="space-y-3">
      <FieldRow>
        <FieldLabel>参数类型</FieldLabel>
        <Select value={data.variant} onValueChange={(v) => onChange({ variant: v as ParamTableData["variant"] })} disabled={readOnly}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(["query", "path", "header", "cookie"] as const).map((v) => (
              <SelectItem key={v} value={v} className="text-xs">{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldRow>

      <div className="space-y-2">
        {data.params.length === 0 && (
          <div className="border border-dashed border-border p-6 text-center rounded-lg">
            <p className="text-xs text-muted-foreground">暂无参数，点击下方按钮添加</p>
          </div>
        )}
        {data.params.map((param, i) => (
          <div key={i} className="rounded-lg bg-muted/50 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 space-y-1">
                <FieldLabel>参数名</FieldLabel>
                <Input
                  value={param.name}
                  onChange={(e) => updateParam(i, { name: e.target.value })}
                  className="h-8 text-xs font-mono"
                  placeholder="param_name"
                  readOnly={readOnly}
                />
              </div>
              <div className="w-28 space-y-1">
                <FieldLabel>类型</FieldLabel>
                <Select value={param.type} onValueChange={(v) => updateParam(i, { type: v })} disabled={readOnly}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PARAM_TYPES.map((t) => (
                      <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-14 space-y-1 text-center">
                <FieldLabel>必填</FieldLabel>
                <div className="flex justify-center pt-1">
                  <Switch checked={param.required} onCheckedChange={(v) => updateParam(i, { required: v })} disabled={readOnly} />
                </div>
              </div>
              {!readOnly && (
                <Button variant="ghost" size="icon-sm" className="shrink-0 mt-5" onClick={() => removeParam(i)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
            <div className="space-y-1">
              <FieldLabel>描述</FieldLabel>
              <Input
                value={param.description}
                onChange={(e) => updateParam(i, { description: e.target.value })}
                className="h-8 text-xs"
                placeholder="参数说明"
                readOnly={readOnly}
              />
            </div>
          </div>
        ))}
        {!readOnly && (
          <Button variant="ghost" size="sm" className="text-xs gap-1 mt-1" onClick={addParam}>
            <Plus className="h-3 w-3" /> 添加参数
          </Button>
        )}
      </div>
    </div>
  )
}

// ── Auth Config Block Editor ─────────────────────────────────────────────────

function AuthConfigBlockEditor({
  data,
  onChange,
  readOnly,
}: {
  data: AuthConfigData
  onChange: (patch: Partial<AuthConfigData>) => void
  readOnly?: boolean
}) {
  return (
    <div className="space-y-3">
      <FieldRow>
        <FieldLabel>认证类型</FieldLabel>
        <Select value={data.authType} onValueChange={(v) => onChange({ authType: v as AuthConfigData["authType"] })} disabled={readOnly}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(["none", "api-key", "bearer", "basic", "oauth2"] as const).map((t) => (
              <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldRow>

      {data.authType === "api-key" && (
        <div className="rounded-lg bg-muted/50 p-3 space-y-3">
          <FieldRow>
            <FieldLabel>密钥名称</FieldLabel>
            <Input
              value={data.apiKeyName ?? ""}
              onChange={(e) => onChange({ apiKeyName: e.target.value })}
              className="h-8 text-xs"
              placeholder="X-API-Key"
              readOnly={readOnly}
            />
          </FieldRow>
          <FieldRow>
            <FieldLabel>位置</FieldLabel>
            <Select value={data.apiKeyIn ?? "header"} onValueChange={(v) => onChange({ apiKeyIn: v as "header" | "query" })} disabled={readOnly}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="header" className="text-xs">header</SelectItem>
                <SelectItem value="query" className="text-xs">query</SelectItem>
              </SelectContent>
            </Select>
          </FieldRow>
        </div>
      )}

      {data.authType === "bearer" && (
        <div className="rounded-lg bg-muted/50 p-3">
          <FieldRow>
            <FieldLabel>令牌格式</FieldLabel>
            <Input
              value={data.bearerFormat ?? ""}
              onChange={(e) => onChange({ bearerFormat: e.target.value })}
              className="h-8 text-xs"
              placeholder="JWT"
              readOnly={readOnly}
            />
          </FieldRow>
        </div>
      )}

      {data.authType === "oauth2" && (
        <div className="rounded-lg bg-muted/50 p-3 space-y-3">
          <FieldRow>
            <FieldLabel>流程类型</FieldLabel>
            <Select value={data.oauth2Flow ?? "client_credentials"} onValueChange={(v) => onChange({ oauth2Flow: v as AuthConfigData["oauth2Flow"] })} disabled={readOnly}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["client_credentials", "authorization_code", "implicit"] as const).map((f) => (
                  <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>
          <FieldRow>
            <FieldLabel>Token URL</FieldLabel>
            <Input
              value={data.oauth2TokenUrl ?? ""}
              onChange={(e) => onChange({ oauth2TokenUrl: e.target.value })}
              className="h-8 text-xs"
              placeholder="https://auth.example.com/token"
              readOnly={readOnly}
            />
          </FieldRow>
          {(data.oauth2Flow === "authorization_code" || data.oauth2Flow === "implicit") && (
            <FieldRow>
              <FieldLabel>授权 URL</FieldLabel>
              <Input
                value={data.oauth2AuthUrl ?? ""}
                onChange={(e) => onChange({ oauth2AuthUrl: e.target.value })}
                className="h-8 text-xs"
                placeholder="https://auth.example.com/authorize"
                readOnly={readOnly}
              />
            </FieldRow>
          )}
          <FieldRow>
            <FieldLabel>权限范围</FieldLabel>
            <Input
              value={(data.oauth2Scopes ?? []).join(", ")}
              onChange={(e) => onChange({ oauth2Scopes: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
              className="h-8 text-xs"
              placeholder="read, write, admin"
              readOnly={readOnly}
            />
          </FieldRow>
        </div>
      )}

      <FieldRow>
        <FieldLabel>说明</FieldLabel>
        <Textarea
          value={data.description ?? ""}
          onChange={(e) => onChange({ description: e.target.value })}
          className="text-xs min-h-[60px]"
          placeholder="认证方式说明..."
          readOnly={readOnly}
        />
      </FieldRow>
    </div>
  )
}

// ── Error Responses Block Editor ─────────────────────────────────────────────

const HTTP_ERROR_CODES = [400, 401, 403, 404, 405, 408, 409, 422, 429, 500, 502, 503] as const

function ErrorResponsesBlockEditor({
  data,
  onChange,
  readOnly,
}: {
  data: ErrorResponsesData
  onChange: (patch: Partial<ErrorResponsesData>) => void
  readOnly?: boolean
}) {
  function updateResponse(idx: number, patch: Partial<ErrorResponsesData["responses"][number]>) {
    const next = [...data.responses]
    next[idx] = { ...next[idx], ...patch }
    onChange({ responses: next })
  }

  function addResponse() {
    onChange({ responses: [...data.responses, { statusCode: 400, description: "", body: "" }] })
  }

  function removeResponse(idx: number) {
    onChange({ responses: data.responses.filter((_, i) => i !== idx) })
  }

  return (
    <div className="space-y-2">
      {data.responses.length === 0 && (
        <div className="border border-dashed border-border p-6 text-center rounded-lg">
          <p className="text-xs text-muted-foreground">暂无错误响应，点击下方按钮添加</p>
        </div>
      )}
      {data.responses.map((resp, i) => (
        <div key={i} className="rounded-lg bg-muted/50 p-3 space-y-2">
          <div className="flex items-start gap-2">
            <div className="w-28 space-y-1">
              <FieldLabel>状态码</FieldLabel>
              <Select value={String(resp.statusCode)} onValueChange={(v) => updateResponse(i, { statusCode: Number(v) })} disabled={readOnly}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HTTP_ERROR_CODES.map((code) => (
                    <SelectItem key={code} value={String(code)} className="text-xs">{code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-1">
              <FieldLabel>描述</FieldLabel>
              <Input
                value={resp.description}
                onChange={(e) => updateResponse(i, { description: e.target.value })}
                className="h-8 text-xs"
                placeholder="错误说明"
                readOnly={readOnly}
              />
            </div>
            {!readOnly && (
              <Button variant="ghost" size="icon-sm" className="shrink-0 mt-5" onClick={() => removeResponse(i)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
          <div className="space-y-1">
            <FieldLabel>响应体（可选）</FieldLabel>
            <CodeEditor
              value={resp.body ?? ""}
              onChange={(v) => updateResponse(i, { body: v })}
              language="json"
              className="min-h-[60px]"
              readOnly={readOnly}
            />
          </div>
        </div>
      ))}
      {!readOnly && (
        <Button variant="ghost" size="sm" className="text-xs gap-1 mt-1" onClick={addResponse}>
          <Plus className="h-3 w-3" /> 添加错误响应
        </Button>
      )}
    </div>
  )
}

// ── Field Table Block Editor ─────────────────────────────────────────────────

function FieldTableBlockEditor({
  data,
  onChange,
  readOnly,
}: {
  data: FieldTableData
  onChange: (patch: Partial<FieldTableData>) => void
  readOnly?: boolean
}) {
  function updateField(idx: number, patch: Partial<FieldTableData["fields"][number]>) {
    const next = [...data.fields]
    next[idx] = { ...next[idx], ...patch }
    onChange({ fields: next })
  }

  function addField() {
    onChange({ fields: [...data.fields, { path: "", type: "string", required: false, description: "", example: "" }] })
  }

  function removeField(idx: number) {
    onChange({ fields: data.fields.filter((_, i) => i !== idx) })
  }

  return (
    <div className="space-y-3">
      <FieldRow>
        <FieldLabel>标题</FieldLabel>
        <Input
          value={data.title}
          onChange={(e) => onChange({ title: e.target.value })}
          className="h-8 text-xs"
          placeholder="字段表标题"
          readOnly={readOnly}
        />
      </FieldRow>

      <Tabs defaultValue="fields">
        <TabsList className="h-8">
          <TabsTrigger value="fields" className="text-xs">字段编辑</TabsTrigger>
          <TabsTrigger value="json" className="text-xs">示例 JSON</TabsTrigger>
        </TabsList>

        <TabsContent value="fields" className="space-y-2 mt-2">
          {data.fields.length === 0 && (
            <div className="border border-dashed border-border p-6 text-center rounded-lg">
              <p className="text-xs text-muted-foreground">暂无字段，点击下方按钮添加</p>
            </div>
          )}
          {data.fields.map((field, i) => (
            <div key={i} className="rounded-lg bg-muted/50 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 space-y-1">
                  <FieldLabel>字段路径</FieldLabel>
                  <Input
                    value={field.path}
                    onChange={(e) => updateField(i, { path: e.target.value })}
                    className="h-8 text-xs font-mono"
                    placeholder="data.items[].id"
                    readOnly={readOnly}
                  />
                </div>
                <div className="w-28 space-y-1">
                  <FieldLabel>类型</FieldLabel>
                  <Select value={field.type} onValueChange={(v) => updateField(i, { type: v })} disabled={readOnly}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {apiFieldTypes.map((t) => (
                        <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-14 space-y-1 text-center">
                  <FieldLabel>必填</FieldLabel>
                  <div className="flex justify-center pt-1">
                    <Switch checked={field.required} onCheckedChange={(v) => updateField(i, { required: v })} disabled={readOnly} />
                  </div>
                </div>
                {!readOnly && (
                  <Button variant="ghost" size="icon-sm" className="shrink-0 mt-5" onClick={() => removeField(i)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <FieldLabel>描述</FieldLabel>
                  <Input
                    value={field.description}
                    onChange={(e) => updateField(i, { description: e.target.value })}
                    className="h-8 text-xs"
                    placeholder="字段说明"
                    readOnly={readOnly}
                  />
                </div>
                <div className="space-y-1">
                  <FieldLabel>示例</FieldLabel>
                  <Input
                    value={field.example ?? ""}
                    onChange={(e) => updateField(i, { example: e.target.value })}
                    className="h-8 text-xs"
                    placeholder="示例值"
                    readOnly={readOnly}
                  />
                </div>
              </div>
            </div>
          ))}
          {!readOnly && (
            <Button variant="ghost" size="sm" className="text-xs gap-1 mt-1" onClick={addField}>
              <Plus className="h-3 w-3" /> 添加字段
            </Button>
          )}
        </TabsContent>

        <TabsContent value="json" className="mt-2">
          <CodeEditor
            value={data.exampleJson ?? ""}
            onChange={(v) => onChange({ exampleJson: v })}
            language="json"
            className="min-h-[120px]"
            readOnly={readOnly}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ── New OpenAPI Block Editors ────────────────────────────────────────────────

function ServerConfigBlockEditor({ data, onChange, readOnly }: { data: ServerConfigData; onChange: (d: Partial<ServerConfigData>) => void; readOnly?: boolean }) {
  const [localMd, setLocalMd] = useState<string | null>(null)
  const serializedMd = serializeEditorBlock("server_config", data)
  const displayMd = localMd ?? serializedMd

  function handleMdChange(md: string) {
    setLocalMd(md)
    const parsed = parseBlockFromMarkdown("server_config", md)
    if (parsed) onChange(parsed)
  }

  function handleTabChange(value: string) {
    if (value === "ui") setLocalMd(null)
  }

  return (
    <Tabs defaultValue="ui" onValueChange={handleTabChange}>
      <TabsList className="h-8">
        <TabsTrigger value="ui" className="text-xs">可视化</TabsTrigger>
        <TabsTrigger value="text" className="text-xs">Markdown</TabsTrigger>
      </TabsList>
      <TabsContent value="ui" className="mt-3 space-y-3">
        {data.servers.map((server, idx) => (
          <div key={idx} className="rounded-lg border border-border p-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={server.url}
                onChange={(e) => {
                  const updated = [...data.servers]
                  updated[idx] = { ...updated[idx], url: e.target.value }
                  onChange({ servers: updated })
                }}
                placeholder="https://api.example.com"
                className="font-mono text-sm"
                readOnly={readOnly}
              />
              <Input
                value={server.description}
                onChange={(e) => {
                  const updated = [...data.servers]
                  updated[idx] = { ...updated[idx], description: e.target.value }
                  onChange({ servers: updated })
                }}
                placeholder="Description"
                readOnly={readOnly}
              />
            </div>
            {!readOnly && (
              <Button variant="ghost" size="sm" onClick={() => onChange({ servers: data.servers.filter((_, i) => i !== idx) })}>
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
              </Button>
            )}
          </div>
        ))}
        {!readOnly && (
          <Button variant="outline" size="sm" onClick={() => onChange({ servers: [...data.servers, { url: "", description: "", variables: [] }] })}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Server
          </Button>
        )}
      </TabsContent>
      <TabsContent value="text" className="mt-3">
        <MarkdownEditor value={displayMd} onChange={handleMdChange} readOnly={readOnly} minHeight="200px" />
      </TabsContent>
    </Tabs>
  )
}

function SchemaModelBlockEditor({ data, onChange, readOnly }: { data: SchemaModelData; onChange: (d: Partial<SchemaModelData>) => void; readOnly?: boolean }) {
  const [localMd, setLocalMd] = useState<string | null>(null)
  const serializedMd = serializeEditorBlock("schema_model", data)
  const displayMd = localMd ?? serializedMd

  function handleMdChange(md: string) {
    setLocalMd(md)
    const parsed = parseBlockFromMarkdown("schema_model", md)
    if (parsed) onChange(parsed)
  }

  function handleTabChange(value: string) {
    if (value === "ui") setLocalMd(null)
  }

  return (
    <Tabs defaultValue="ui" onValueChange={handleTabChange}>
      <TabsList className="h-8">
        <TabsTrigger value="ui" className="text-xs">可视化</TabsTrigger>
        <TabsTrigger value="text" className="text-xs">Markdown</TabsTrigger>
      </TabsList>
      <TabsContent value="ui" className="mt-3 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Input value={data.name} onChange={(e) => onChange({ name: e.target.value })} placeholder="Schema name" className="font-semibold" readOnly={readOnly} />
          <Input value={data.description} onChange={(e) => onChange({ description: e.target.value })} placeholder="Description" readOnly={readOnly} />
        </div>
        {data.properties.map((prop, idx) => (
          <div key={idx} className="grid grid-cols-5 gap-2 items-center">
            <Input value={prop.name} onChange={(e) => { const p = [...data.properties]; p[idx] = { ...p[idx], name: e.target.value }; onChange({ properties: p }) }} placeholder="Property" className="font-mono text-sm" readOnly={readOnly} />
            <Select value={prop.type} onValueChange={(v) => { const p = [...data.properties]; p[idx] = { ...p[idx], type: v }; onChange({ properties: p }) }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["string","number","integer","boolean","object","array","null"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
            <Input value={prop.description} onChange={(e) => { const p = [...data.properties]; p[idx] = { ...p[idx], description: e.target.value }; onChange({ properties: p }) }} placeholder="Description" readOnly={readOnly} />
            <Input value={prop.example} onChange={(e) => { const p = [...data.properties]; p[idx] = { ...p[idx], example: e.target.value }; onChange({ properties: p }) }} placeholder="Example" readOnly={readOnly} />
            <div className="flex items-center gap-1">
              <Switch checked={prop.required} onCheckedChange={(v) => { const p = [...data.properties]; p[idx] = { ...p[idx], required: v }; onChange({ properties: p }) }} />
              {!readOnly && <Button variant="ghost" size="icon" onClick={() => onChange({ properties: data.properties.filter((_, i) => i !== idx) })}><X className="h-3.5 w-3.5" /></Button>}
            </div>
          </div>
        ))}
        {!readOnly && (
          <Button variant="ghost" size="sm" onClick={() => onChange({ properties: [...data.properties, { name: "", type: "string", required: false, description: "", example: "" }] })}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Property
          </Button>
        )}
      </TabsContent>
      <TabsContent value="text" className="mt-3">
        <MarkdownEditor value={displayMd} onChange={handleMdChange} readOnly={readOnly} minHeight="200px" />
      </TabsContent>
    </Tabs>
  )
}

function RateLimitBlockEditor({ data, onChange, readOnly }: { data: RateLimitData; onChange: (d: Partial<RateLimitData>) => void; readOnly?: boolean }) {
  const [localMd, setLocalMd] = useState<string | null>(null)
  const serializedMd = serializeEditorBlock("rate_limit", data)
  const displayMd = localMd ?? serializedMd

  function handleMdChange(md: string) {
    setLocalMd(md)
    const parsed = parseBlockFromMarkdown("rate_limit", md)
    if (parsed) onChange(parsed)
  }

  function handleTabChange(value: string) {
    if (value === "ui") setLocalMd(null)
  }

  return (
    <Tabs defaultValue="ui" onValueChange={handleTabChange}>
      <TabsList className="h-8">
        <TabsTrigger value="ui" className="text-xs">可视化</TabsTrigger>
        <TabsTrigger value="text" className="text-xs">Markdown</TabsTrigger>
      </TabsList>
      <TabsContent value="ui" className="mt-3 space-y-3">
        <Textarea value={data.description} onChange={(e) => onChange({ description: e.target.value })} placeholder="Rate limiting policy description..." className="min-h-16" readOnly={readOnly} />
        {data.limits.map((limit, idx) => (
          <div key={idx} className="grid grid-cols-4 gap-2 items-center">
            <Input value={limit.name} onChange={(e) => { const l = [...data.limits]; l[idx] = { ...l[idx], name: e.target.value }; onChange({ limits: l }) }} placeholder="Tier name" readOnly={readOnly} />
            <Input type="number" value={limit.limit} onChange={(e) => { const l = [...data.limits]; l[idx] = { ...l[idx], limit: parseInt(e.target.value) || 0 }; onChange({ limits: l }) }} placeholder="100" readOnly={readOnly} />
            <Input value={limit.window} onChange={(e) => { const l = [...data.limits]; l[idx] = { ...l[idx], window: e.target.value }; onChange({ limits: l }) }} placeholder="1 minute" readOnly={readOnly} />
            <div className="flex items-center gap-1">
              <Input value={limit.description} onChange={(e) => { const l = [...data.limits]; l[idx] = { ...l[idx], description: e.target.value }; onChange({ limits: l }) }} placeholder="Description" className="flex-1" readOnly={readOnly} />
              {!readOnly && <Button variant="ghost" size="icon" onClick={() => onChange({ limits: data.limits.filter((_, i) => i !== idx) })}><X className="h-3.5 w-3.5" /></Button>}
            </div>
          </div>
        ))}
        {!readOnly && (
          <Button variant="ghost" size="sm" onClick={() => onChange({ limits: [...data.limits, { name: "", limit: 100, window: "1 minute", description: "" }] })}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Limit
          </Button>
        )}
        <div className="grid grid-cols-3 gap-2">
          <Input value={data.headers.limit} onChange={(e) => onChange({ headers: { ...data.headers, limit: e.target.value } })} placeholder="X-RateLimit-Limit" className="font-mono text-xs" readOnly={readOnly} />
          <Input value={data.headers.remaining} onChange={(e) => onChange({ headers: { ...data.headers, remaining: e.target.value } })} placeholder="X-RateLimit-Remaining" className="font-mono text-xs" readOnly={readOnly} />
          <Input value={data.headers.reset} onChange={(e) => onChange({ headers: { ...data.headers, reset: e.target.value } })} placeholder="X-RateLimit-Reset" className="font-mono text-xs" readOnly={readOnly} />
        </div>
      </TabsContent>
      <TabsContent value="text" className="mt-3">
        <MarkdownEditor value={displayMd} onChange={handleMdChange} readOnly={readOnly} minHeight="200px" />
      </TabsContent>
    </Tabs>
  )
}

function PaginationConfigBlockEditor({ data, onChange, readOnly }: { data: PaginationConfigData; onChange: (d: Partial<PaginationConfigData>) => void; readOnly?: boolean }) {
  const [localMd, setLocalMd] = useState<string | null>(null)
  const serializedMd = serializeEditorBlock("pagination_config", data)
  const displayMd = localMd ?? serializedMd

  function handleMdChange(md: string) {
    setLocalMd(md)
    const parsed = parseBlockFromMarkdown("pagination_config", md)
    if (parsed) onChange(parsed)
  }

  function handleTabChange(value: string) {
    if (value === "ui") setLocalMd(null)
  }

  return (
    <Tabs defaultValue="ui" onValueChange={handleTabChange}>
      <TabsList className="h-8">
        <TabsTrigger value="ui" className="text-xs">可视化</TabsTrigger>
        <TabsTrigger value="text" className="text-xs">Markdown</TabsTrigger>
      </TabsList>
      <TabsContent value="ui" className="mt-3 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Select value={data.style} onValueChange={(v) => onChange({ style: v as PaginationConfigData["style"] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="offset">Offset</SelectItem>
              <SelectItem value="cursor">Cursor</SelectItem>
              <SelectItem value="page">Page Number</SelectItem>
              <SelectItem value="none">None</SelectItem>
            </SelectContent>
          </Select>
          <Input value={data.description} onChange={(e) => onChange({ description: e.target.value })} placeholder="Pagination description" readOnly={readOnly} />
        </div>
        <Label className="text-xs font-medium text-muted-foreground">Parameters</Label>
        {data.parameters.map((param, idx) => (
          <div key={idx} className="grid grid-cols-5 gap-2 items-center">
            <Input value={param.name} onChange={(e) => { const p = [...data.parameters]; p[idx] = { ...p[idx], name: e.target.value }; onChange({ parameters: p }) }} placeholder="Name" className="font-mono text-sm" readOnly={readOnly} />
            <Input value={param.type} onChange={(e) => { const p = [...data.parameters]; p[idx] = { ...p[idx], type: e.target.value }; onChange({ parameters: p }) }} placeholder="Type" readOnly={readOnly} />
            <Input value={param.default} onChange={(e) => { const p = [...data.parameters]; p[idx] = { ...p[idx], default: e.target.value }; onChange({ parameters: p }) }} placeholder="Default" readOnly={readOnly} />
            <Input value={param.description} onChange={(e) => { const p = [...data.parameters]; p[idx] = { ...p[idx], description: e.target.value }; onChange({ parameters: p }) }} placeholder="Description" readOnly={readOnly} />
            <div className="flex items-center gap-1">
              <Switch checked={param.required} onCheckedChange={(v) => { const p = [...data.parameters]; p[idx] = { ...p[idx], required: v }; onChange({ parameters: p }) }} />
              {!readOnly && <Button variant="ghost" size="icon" onClick={() => onChange({ parameters: data.parameters.filter((_, i) => i !== idx) })}><X className="h-3.5 w-3.5" /></Button>}
            </div>
          </div>
        ))}
        {!readOnly && (
          <Button variant="ghost" size="sm" onClick={() => onChange({ parameters: [...data.parameters, { name: "", type: "integer", required: false, default: "", description: "" }] })}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Parameter
          </Button>
        )}
      </TabsContent>
      <TabsContent value="text" className="mt-3">
        <MarkdownEditor value={displayMd} onChange={handleMdChange} readOnly={readOnly} minHeight="200px" />
      </TabsContent>
    </Tabs>
  )
}

function ResponseHeadersBlockEditor({ data, onChange, readOnly }: { data: ResponseHeadersData; onChange: (d: Partial<ResponseHeadersData>) => void; readOnly?: boolean }) {
  const [localMd, setLocalMd] = useState<string | null>(null)
  const serializedMd = serializeEditorBlock("response_headers", data)
  const displayMd = localMd ?? serializedMd

  function handleMdChange(md: string) {
    setLocalMd(md)
    const parsed = parseBlockFromMarkdown("response_headers", md)
    if (parsed) onChange(parsed)
  }

  function handleTabChange(value: string) {
    if (value === "ui") setLocalMd(null)
  }

  return (
    <Tabs defaultValue="ui" onValueChange={handleTabChange}>
      <TabsList className="h-8">
        <TabsTrigger value="ui" className="text-xs">可视化</TabsTrigger>
        <TabsTrigger value="text" className="text-xs">Markdown</TabsTrigger>
      </TabsList>
      <TabsContent value="ui" className="mt-3 space-y-3">
        {data.headers.map((header, idx) => (
          <div key={idx} className="grid grid-cols-5 gap-2 items-center">
            <Input value={header.name} onChange={(e) => { const h = [...data.headers]; h[idx] = { ...h[idx], name: e.target.value }; onChange({ headers: h }) }} placeholder="Header name" className="font-mono text-sm" readOnly={readOnly} />
            <Select value={header.type} onValueChange={(v) => { const h = [...data.headers]; h[idx] = { ...h[idx], type: v }; onChange({ headers: h }) }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["string","number","integer","boolean"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
            <Input value={header.description} onChange={(e) => { const h = [...data.headers]; h[idx] = { ...h[idx], description: e.target.value }; onChange({ headers: h }) }} placeholder="Description" readOnly={readOnly} />
            <Input value={header.example} onChange={(e) => { const h = [...data.headers]; h[idx] = { ...h[idx], example: e.target.value }; onChange({ headers: h }) }} placeholder="Example" readOnly={readOnly} />
            <div className="flex items-center gap-1">
              <Switch checked={header.required} onCheckedChange={(v) => { const h = [...data.headers]; h[idx] = { ...h[idx], required: v }; onChange({ headers: h }) }} />
              {!readOnly && <Button variant="ghost" size="icon" onClick={() => onChange({ headers: data.headers.filter((_, i) => i !== idx) })}><X className="h-3.5 w-3.5" /></Button>}
            </div>
          </div>
        ))}
        {!readOnly && (
          <Button variant="ghost" size="sm" onClick={() => onChange({ headers: [...data.headers, { name: "", type: "string", required: false, description: "", example: "" }] })}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Header
          </Button>
        )}
      </TabsContent>
      <TabsContent value="text" className="mt-3">
        <MarkdownEditor value={displayMd} onChange={handleMdChange} readOnly={readOnly} minHeight="200px" />
      </TabsContent>
    </Tabs>
  )
}

function SecuritySchemeBlockEditor({ data, onChange, readOnly }: { data: SecuritySchemeData; onChange: (d: Partial<SecuritySchemeData>) => void; readOnly?: boolean }) {
  const [localMd, setLocalMd] = useState<string | null>(null)
  const serializedMd = serializeEditorBlock("security_scheme", data)
  const displayMd = localMd ?? serializedMd

  function handleMdChange(md: string) {
    setLocalMd(md)
    const parsed = parseBlockFromMarkdown("security_scheme", md)
    if (parsed) onChange(parsed)
  }

  function handleTabChange(value: string) {
    if (value === "ui") setLocalMd(null)
  }

  return (
    <Tabs defaultValue="ui" onValueChange={handleTabChange}>
      <TabsList className="h-8">
        <TabsTrigger value="ui" className="text-xs">可视化</TabsTrigger>
        <TabsTrigger value="text" className="text-xs">Markdown</TabsTrigger>
      </TabsList>
      <TabsContent value="ui" className="mt-3 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Input value={data.name} onChange={(e) => onChange({ name: e.target.value })} placeholder="Scheme name" className="font-semibold" readOnly={readOnly} />
          <Select value={data.type} onValueChange={(v) => onChange({ type: v as SecuritySchemeData["type"] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="apiKey">API Key</SelectItem>
              <SelectItem value="http">HTTP</SelectItem>
              <SelectItem value="oauth2">OAuth2</SelectItem>
              <SelectItem value="openIdConnect">OpenID Connect</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Textarea value={data.description} onChange={(e) => onChange({ description: e.target.value })} placeholder="Description..." className="min-h-16" readOnly={readOnly} />
        {data.type === "apiKey" && (
          <div className="grid grid-cols-2 gap-2">
            <Input value={data.apiKeyName || ""} onChange={(e) => onChange({ apiKeyName: e.target.value })} placeholder="Key name (e.g. X-API-Key)" className="font-mono text-sm" readOnly={readOnly} />
            <Select value={data.apiKeyIn || "header"} onValueChange={(v) => onChange({ apiKeyIn: v as "header" | "query" | "cookie" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="header">Header</SelectItem>
                <SelectItem value="query">Query</SelectItem>
                <SelectItem value="cookie">Cookie</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        {data.type === "http" && (
          <div className="grid grid-cols-2 gap-2">
            <Input value={data.scheme || ""} onChange={(e) => onChange({ scheme: e.target.value })} placeholder="Scheme (bearer, basic)" readOnly={readOnly} />
            <Input value={data.bearerFormat || ""} onChange={(e) => onChange({ bearerFormat: e.target.value })} placeholder="Bearer format (JWT)" readOnly={readOnly} />
          </div>
        )}
        {data.type === "openIdConnect" && (
          <Input value={data.openIdConnectUrl || ""} onChange={(e) => onChange({ openIdConnectUrl: e.target.value })} placeholder="OpenID Connect URL" className="font-mono text-sm" readOnly={readOnly} />
        )}
        {data.type === "oauth2" && (
          <CodeEditor
            value={data.oauth2Flows || "{}"}
            onChange={(v) => onChange({ oauth2Flows: v })}
            language="json"
            readOnly={readOnly}
            minHeight="120px"
          />
        )}
      </TabsContent>
      <TabsContent value="text" className="mt-3">
        <MarkdownEditor value={displayMd} onChange={handleMdChange} readOnly={readOnly} minHeight="200px" />
      </TabsContent>
    </Tabs>
  )
}
