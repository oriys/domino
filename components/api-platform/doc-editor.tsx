"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowLeft,
  ArrowRightLeft,
  AlertTriangle,
  Bold,
  Braces,
  Code,
  Database,
  Eye,
  FileJson,
  FileText,
  Heading1,
  Heading2,
  Heading3,
  History,
  Info,
  Italic,
  LayoutGrid,
  Lightbulb,
  Link,
  List,
  ListChecks,
  ListOrdered,
  MoreHorizontal,
  PanelLeft,
  Quote,
  Redo2,
  Replace,
  Route,
  Save,
  Search,
  Server,
  ShieldCheck,
  Split,
  Table,
  Terminal,
  Undo2,
  Upload,
  Webhook,
  X,
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"
import { toast } from "sonner"

import { VisualDocEditor } from "@/components/api-platform/visual-doc-editor"
import { DocumentRenderer } from "@/components/api-platform/document-renderer"
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
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { MarkdownEditor, insertAtCursor } from "@/components/ui/code-editor"
import { useAutosave } from "@/hooks/use-autosave"
import { useCurrentUser } from "@/hooks/use-current-user"
import { EditorView } from "@codemirror/view"
import {
  analyzeVisualEditingSupport,
  type VisualEditingSupportReport,
} from "@/lib/api-platform/doc-blocks"
import {
  getContentLibrarySnapshot,
  getDocPage,
  listDocPageVersions,
  publishDocPage,
  unpublishDocPage,
  updateDocPageContent,
} from "@/lib/api-platform/docs-client"
import type {
  DocPage,
  DocPageVersion,
  ExampleSetResolved,
  ReusableSnippet,
} from "@/lib/api-platform/types"
import { cn } from "@/lib/utils"

interface DocEditorProps {
  pageId: string
  onBack: () => void
}

type EditorMode = "visual" | "edit" | "preview"

interface QuickInsert {
  label: string
  icon: typeof Code
  action: (insert: (prefix: string, suffix: string) => void) => void
}

type PublishAction = "publish" | "unpublish"

// ── Notification type ────────────────────────────────────────────────────────
interface EditorNotification {
  id: string
  message: string
  timestamp: number
  read: boolean
}

// ── Outline heading type ─────────────────────────────────────────────────────
interface OutlineHeading {
  id: string
  level: 2 | 3
  text: string
}

// ── Diff line type ───────────────────────────────────────────────────────────
interface DiffLine {
  type: "added" | "removed" | "unchanged"
  text: string
}

function computeDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split("\n")
  const newLines = newText.split("\n")
  const result: DiffLine[] = []

  const maxLen = Math.max(oldLines.length, newLines.length)
  // Simple line-by-line comparison for previewing content changes.
  let oi = 0
  let ni = 0

  while (oi < oldLines.length || ni < newLines.length) {
    if (oi >= oldLines.length) {
      result.push({ type: "added", text: newLines[ni] })
      ni++
    } else if (ni >= newLines.length) {
      result.push({ type: "removed", text: oldLines[oi] })
      oi++
    } else if (oldLines[oi] === newLines[ni]) {
      result.push({ type: "unchanged", text: oldLines[oi] })
      oi++
      ni++
    } else {
      // Look ahead in new lines to see if old line appears later (was removed)
      let foundInNew = -1
      for (let j = ni + 1; j < Math.min(ni + 5, newLines.length); j++) {
        if (newLines[j] === oldLines[oi]) {
          foundInNew = j
          break
        }
      }
      // Look ahead in old lines to see if new line appears later (was added)
      let foundInOld = -1
      for (let j = oi + 1; j < Math.min(oi + 5, oldLines.length); j++) {
        if (oldLines[j] === newLines[ni]) {
          foundInOld = j
          break
        }
      }

      if (foundInNew !== -1 && (foundInOld === -1 || foundInNew - ni <= foundInOld - oi)) {
        // Lines were added before the current old line
        for (let j = ni; j < foundInNew; j++) {
          result.push({ type: "added", text: newLines[j] })
        }
        ni = foundInNew
      } else if (foundInOld !== -1) {
        // Lines were removed before the current new line
        for (let j = oi; j < foundInOld; j++) {
          result.push({ type: "removed", text: oldLines[j] })
        }
        oi = foundInOld
      } else {
        // Lines differ — show as removal + addition
        result.push({ type: "removed", text: oldLines[oi] })
        result.push({ type: "added", text: newLines[ni] })
        oi++
        ni++
      }
    }
  }

  return result
}

// ── Extract headings from markdown content ───────────────────────────────────
function extractHeadings(content: string): OutlineHeading[] {
  const headings: OutlineHeading[] = []
  const regex = /^(#{2,3})\s+(.+)$/gm
  let match: RegExpExecArray | null
  let index = 0
  while ((match = regex.exec(content)) !== null) {
    const level = match[1].length as 2 | 3
    const text = match[2].replace(/[`*_~]/g, "").trim()
    headings.push({
      id: `heading-${index++}`,
      level,
      text,
    })
  }
  return headings
}

const allQuickInserts: QuickInsert[] = [
  // REST
  {
    label: "Endpoint",
    icon: Route,
    action: (insert) => insert(
`### \`POST\` /v1/resource

**Description:** Create a new resource.

**Headers:**
| Header | Value |
|--------|-------|
| Authorization | Bearer {token} |
| Content-Type | application/json |

**Request Body:**
\`\`\`json
{
  "name": "example",
  "value": 100
}
\`\`\`

**Response** \`201 Created\`:
\`\`\`json
{
  "id": "res_abc123",
  "name": "example",
  "value": 100,
  "created_at": "2024-01-15T09:30:00Z"
}
\`\`\`

`, "")
  },
  {
    label: "Status Codes",
    icon: ListChecks,
    action: (insert) => insert(
`### Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request — invalid parameters |
| 401 | Unauthorized — invalid or missing token |
| 404 | Not Found — resource does not exist |
| 429 | Too Many Requests — rate limit exceeded |
| 500 | Internal Server Error |

`, "")
  },
  {
    label: "Auth",
    icon: ShieldCheck,
    action: (insert) => insert(
`### Authentication

All requests must include a valid API key in the \`Authorization\` header:

\`\`\`
Authorization: Bearer YOUR_API_KEY
\`\`\`

> **Note:** API keys can be generated from the [Developer Dashboard](https://dashboard.example.com). Keep your keys secure and never expose them in client-side code.

`, "")
  },
  {
    label: "cURL",
    icon: Terminal,
    action: (insert) => insert(
`\`\`\`bash
curl -X POST https://api.example.com/v1/resource \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "example",
    "value": 100
  }'
\`\`\`

`, "")
  },
  // GraphQL
  {
    label: "Type",
    icon: Braces,
    action: (insert) => insert(
`### Type Definition

\`\`\`graphql
type Resource {
  id: ID!
  name: String!
  description: String
  status: Status!
  createdAt: DateTime!
  updatedAt: DateTime!
}

enum Status {
  ACTIVE
  INACTIVE
  ARCHIVED
}
\`\`\`

`, "")
  },
  {
    label: "Query",
    icon: Database,
    action: (insert) => insert(
`### Query

\`\`\`graphql
query GetResources($first: Int, $after: String) {
  resources(first: $first, after: $after) {
    edges {
      node {
        id
        name
        status
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
\`\`\`

**Variables:**
\`\`\`json
{
  "first": 10,
  "after": null
}
\`\`\`

`, "")
  },
  {
    label: "Mutation",
    icon: ArrowRightLeft,
    action: (insert) => insert(
`### Mutation

\`\`\`graphql
mutation CreateResource($input: CreateResourceInput!) {
  createResource(input: $input) {
    resource {
      id
      name
      status
    }
    errors {
      field
      message
    }
  }
}
\`\`\`

**Variables:**
\`\`\`json
{
  "input": {
    "name": "New Resource",
    "description": "A sample resource"
  }
}
\`\`\`

`, "")
  },
  {
    label: "Schema",
    icon: FileJson,
    action: (insert) => insert(
`### Schema

\`\`\`graphql
input CreateResourceInput {
  name: String!
  description: String
  tags: [String!]
}

input UpdateResourceInput {
  name: String
  description: String
  status: Status
}

type Query {
  resource(id: ID!): Resource
  resources(first: Int, after: String, filter: ResourceFilter): ResourceConnection!
}

type Mutation {
  createResource(input: CreateResourceInput!): CreateResourcePayload!
  updateResource(id: ID!, input: UpdateResourceInput!): UpdateResourcePayload!
  deleteResource(id: ID!): DeleteResourcePayload!
}
\`\`\`

`, "")
  },
  // Webhook
  {
    label: "Event",
    icon: Webhook,
    action: (insert) => insert(
`### \`resource.created\`

Triggered when a new resource is created.

**Payload:**
\`\`\`json
{
  "event": "resource.created",
  "timestamp": "2024-01-15T09:30:00Z",
  "data": {
    "id": "res_abc123",
    "name": "Example Resource",
    "status": "active",
    "created_at": "2024-01-15T09:30:00Z"
  }
}
\`\`\`

`, "")
  },
  {
    label: "Payload",
    icon: FileJson,
    action: (insert) => insert(
`**Payload Schema:**

| Field | Type | Description |
|-------|------|-------------|
| \`event\` | string | Event type identifier |
| \`timestamp\` | string | ISO 8601 timestamp |
| \`data\` | object | Event-specific data |
| \`data.id\` | string | Resource identifier |

\`\`\`json
{
  "event": "event.type",
  "timestamp": "2024-01-15T09:30:00Z",
  "data": {}
}
\`\`\`

`, "")
  },
  {
    label: "Verify",
    icon: ShieldCheck,
    action: (insert) => insert(
`### Signature Verification

All webhook payloads include an \`X-Signature-256\` header containing an HMAC-SHA256 signature.

**Verification example (Node.js):**
\`\`\`javascript
const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(\`sha256=\${expected}\`)
  );
}
\`\`\`

> **Important:** Always verify webhook signatures before processing events to prevent spoofing.

`, "")
  },
  {
    label: "Retry",
    icon: Server,
    action: (insert) => insert(
`### Retry Policy

Failed deliveries (non-2xx response) are retried with exponential backoff:

| Attempt | Delay |
|---------|-------|
| 1st retry | 1 minute |
| 2nd retry | 5 minutes |
| 3rd retry | 30 minutes |
| 4th retry | 2 hours |
| 5th retry | 24 hours |

After 5 failed attempts, the webhook is marked as **failing** and an email notification is sent.

> **Tip:** Return a \`200 OK\` response quickly, then process the event asynchronously to avoid timeouts.

`, "")
  },
  // Guideline
  {
    label: "Tip",
    icon: Lightbulb,
    action: (insert) => insert(
`> **💡 Tip:** `, "\n\n")
  },
  {
    label: "Warning",
    icon: AlertTriangle,
    action: (insert) => insert(
`> **⚠️ Warning:** `, "\n\n")
  },
  {
    label: "Info",
    icon: Info,
    action: (insert) => insert(
`> **ℹ️ Note:** `, "\n\n")
  },
  {
    label: "Steps",
    icon: ListChecks,
    action: (insert) => insert(
`### Steps

1. **Step one** — Description of the first step.
2. **Step two** — Description of the second step.
3. **Step three** — Description of the third step.

`, "")
  },
  {
    label: "Do / Don't",
    icon: ListChecks,
    action: (insert) => insert(
`### ✅ Do

- Use descriptive, meaningful names
- Keep it simple and consistent
- Document edge cases

### ❌ Don't

- Don't use abbreviations without context
- Don't mix naming conventions
- Don't skip error handling

`, "")
  },
]

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return "Unable to process the page request."
}

export function DocEditor({ pageId, onBack }: DocEditorProps) {
  const { user, can } = useCurrentUser()
  const [page, setPage] = useState<DocPage | null>(null)
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [mode, setMode] = useState<EditorMode>("visual")
  const [splitView, setSplitView] = useState(false)
  const [showPublishDialog, setShowPublishDialog] = useState(false)
  const [publishChangelog, setPublishChangelog] = useState("")
  const [publishAction, setPublishAction] = useState<PublishAction | null>(null)
  const [versions, setVersions] = useState<DocPageVersion[]>([])
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [previewingVersion, setPreviewingVersion] = useState<DocPageVersion | null>(null)
  const [snippets, setSnippets] = useState<ReusableSnippet[]>([])
  const [examples, setExamples] = useState<ExampleSetResolved[]>([])
  const [selectedSnippetToken, setSelectedSnippetToken] = useState<string>("none")
  const [selectedExampleToken, setSelectedExampleToken] = useState<string>("none")
  const editorViewRef = useRef<EditorView | null>(null)

  // ── Feature 1: Autosave state ──────────────────────────────────────────────
  const [draftRecoveryContent, setDraftRecoveryContent] = useState<string | null>(null)

  // ── Feature 2: Unsaved confirm dialog state ────────────────────────────────
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false)
  const [showVisualModeConfirm, setShowVisualModeConfirm] = useState(false)
  const [pendingModeSelection, setPendingModeSelection] = useState<EditorMode | null>(null)

  // ── Feature 3: Outline panel state ─────────────────────────────────────────
  const [showOutline, setShowOutline] = useState(false)

  // ── Feature 4: Diff view state ─────────────────────────────────────────────
  const [showDiff, setShowDiff] = useState(false)

  // ── Feature 5: Undo/Redo state ─────────────────────────────────────────────
  const undoStackRef = useRef<string[]>([])
  const redoStackRef = useRef<string[]>([])
  const lastContentRef = useRef<string>("")

  // ── Feature 7: Search & Replace state ──────────────────────────────────────
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchReplace, setSearchReplace] = useState("")

  // ── Feature 10: Notifications state ────────────────────────────────────────
  const [notifications, setNotifications] = useState<EditorNotification[]>([])

  // ── Feature 1: Autosave hook ───────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!dirty) return page
    setSaving(true)
    try {
      const updated = await updateDocPageContent(pageId, content)
      setPage(updated)
      setDirty(false)
      if (page?.status === "published" && updated.status === "draft") {
        toast.success("Page moved to draft", { description: "The live page stays published until you publish this updated draft." })
      }
      return updated
    } catch (err) {
      console.error("Save failed:", err)
      toast.error("Save failed", { description: getErrorMessage(err) })
      throw err
    } finally {
      setSaving(false)
    }
  }, [content, dirty, page, pageId])

  const isEditorReadOnly = !!previewingVersion
  const activeContent = previewingVersion ? previewingVersion.content : content
  const visualSupportReport = useMemo<VisualEditingSupportReport>(
    () => analyzeVisualEditingSupport(activeContent),
    [activeContent],
  )

  const { recoverDraft, clearDraft } = useAutosave({
    pageId,
    content,
    dirty,
    saving,
    readOnly: isEditorReadOnly,
    onSave: handleSave,
  })

  // ── Feature 3: Outline headings memo ───────────────────────────────────────
  const outlineHeadings = useMemo(() => extractHeadings(content), [content])

  // ── Feature 10: Add notification helper ────────────────────────────────────
  const addNotification = useCallback((message: string) => {
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        message,
        timestamp: Date.now(),
        read: false,
      },
      ...prev,
    ])
  }, [])

  const unreadNotificationCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications])

  function markAllNotificationsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  // ── Load page data ─────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const data = await getDocPage(pageId)
        setPage(data)
        setContent(data.content)
        lastContentRef.current = data.content
      } catch (err) {
        console.error("Failed to load page:", err)
        toast.error("Load failed", { description: getErrorMessage(err) })
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [pageId])

  // ── Feature 1: Draft recovery on load ──────────────────────────────────────
  useEffect(() => {
    if (!page) return
    const draft = recoverDraft(page.content)
    if (draft) {
      setDraftRecoveryContent(draft)
      toast("Draft recovered", {
        description: "You have unsaved changes from a previous session.",
        action: {
          label: "Restore",
          onClick: () => {
            setContent(draft)
            setDirty(true)
            setDraftRecoveryContent(null)
          },
        },
        cancel: {
          label: "Discard",
          onClick: () => {
            clearDraft()
            setDraftRecoveryContent(null)
          },
        },
        duration: 10000,
      })
    }
    // Only run once when page is first loaded
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page?.id])

  // ── Feature 2: URL sync (pushState) ────────────────────────────────────────
  useEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.set("doc", pageId)
    window.history.pushState({}, "", url.toString())

    function handlePopState() {
      const currentUrl = new URL(window.location.href)
      if (!currentUrl.searchParams.has("doc")) {
        onBack()
      }
    }

    window.addEventListener("popstate", handlePopState)
    return () => {
      window.removeEventListener("popstate", handlePopState)
    }
  }, [pageId, onBack])

  // Load versions separately (non-blocking)
  useEffect(() => {
    if (!pageId) return
    listDocPageVersions(pageId)
      .then(setVersions)
      .catch((err) => console.error("Failed to load versions:", err))
  }, [pageId])

  useEffect(() => {
    getContentLibrarySnapshot()
      .then((assets) => {
        setSnippets(assets.snippets)
        setExamples(assets.examples)
      })
      .catch((err) => console.error("Failed to load editor assets:", err))
  }, [pageId])

  // ── Feature 5: Track undo/redo on content changes ──────────────────────────
  function handleContentChange(value: string) {
    // Push previous state to undo stack
    if (lastContentRef.current !== value) {
      undoStackRef.current.push(lastContentRef.current)
      // Limit undo stack size
      if (undoStackRef.current.length > 100) {
        undoStackRef.current = undoStackRef.current.slice(-100)
      }
      redoStackRef.current = []
      lastContentRef.current = value
    }
    setContent(value)
    setDirty(true)
  }

  const commitModeSelection = useCallback((nextMode: EditorMode) => {
    setMode(nextMode)
    if (nextMode === "preview") {
      setSplitView(false)
    }
  }, [])

  const handleModeSelect = useCallback((nextMode: EditorMode) => {
    if (
      nextMode === "visual" &&
      mode !== "visual" &&
      !isEditorReadOnly &&
      visualSupportReport.fidelity === "warning"
    ) {
      setPendingModeSelection(nextMode)
      setShowVisualModeConfirm(true)
      return
    }

    commitModeSelection(nextMode)
  }, [commitModeSelection, isEditorReadOnly, mode, visualSupportReport.fidelity])

  const confirmVisualModeSelection = useCallback(() => {
    if (pendingModeSelection) {
      commitModeSelection(pendingModeSelection)
    }
    setPendingModeSelection(null)
    setShowVisualModeConfirm(false)
  }, [commitModeSelection, pendingModeSelection])

  const dismissVisualModeConfirm = useCallback(() => {
    setPendingModeSelection(null)
    setShowVisualModeConfirm(false)
  }, [])

  // ── Feature 5: Undo / Redo handlers ────────────────────────────────────────
  const handleUndo = useCallback(() => {
    if (undoStackRef.current.length === 0) return
    const prev = undoStackRef.current.pop()!
    redoStackRef.current.push(content)
    lastContentRef.current = prev
    setContent(prev)
    setDirty(true)
  }, [content])

  const handleRedo = useCallback(() => {
    if (redoStackRef.current.length === 0) return
    const next = redoStackRef.current.pop()!
    undoStackRef.current.push(content)
    lastContentRef.current = next
    setContent(next)
    setDirty(true)
  }, [content])

  // ── Feature 2: Handle back with unsaved check ─────────────────────────────
  const handleBack = useCallback(() => {
    if (dirty) {
      setShowUnsavedConfirm(true)
    } else {
      const url = new URL(window.location.href)
      url.searchParams.delete("doc")
      window.history.pushState({}, "", url.toString())
      onBack()
    }
  }, [dirty, onBack])

  const confirmLeave = useCallback(() => {
    setShowUnsavedConfirm(false)
    const url = new URL(window.location.href)
    url.searchParams.delete("doc")
    window.history.pushState({}, "", url.toString())
    onBack()
  }, [onBack])

  // ── Feature 6 + existing: Keyboard shortcuts ──────────────────────────────
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey

      // Cmd+S — save
      if (meta && e.key === "s" && !e.shiftKey) {
        e.preventDefault()
        void handleSave()
        return
      }

      // Cmd+Shift+S — publish
      if (meta && e.shiftKey && e.key === "s") {
        e.preventDefault()
        if (page?.status !== "published" && can("canPublish")) {
          setShowPublishDialog(true)
        }
        return
      }

      // Cmd+1/2/3/4 — switch modes
      if (meta && !e.shiftKey) {
        if (e.key === "1") {
          e.preventDefault()
          handleModeSelect("visual")
          return
        }
        if (e.key === "2") {
          e.preventDefault()
          handleModeSelect("edit")
          return
        }
        if (e.key === "3") {
          e.preventDefault()
          setSplitView((v) => !v)
          return
        }
        if (e.key === "4") {
          e.preventDefault()
          handleModeSelect("preview")
          return
        }
      }

      // Cmd+Z — undo (visual mode)
      if (meta && e.key === "z" && !e.shiftKey && mode === "visual") {
        e.preventDefault()
        handleUndo()
        return
      }

      // Cmd+Shift+Z — redo (visual mode)
      if (meta && e.shiftKey && (e.key === "z" || e.key === "Z") && mode === "visual") {
        e.preventDefault()
        handleRedo()
        return
      }

      // Cmd+F — search (visual mode)
      if (meta && e.key === "f" && mode === "visual") {
        e.preventDefault()
        setShowSearch((v) => !v)
        return
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [handleModeSelect, handleSave, handleUndo, handleRedo, mode, page?.status, can])

  async function handlePublish() {
    if (!page) return
    if (page.status === "published") {
      return
    }

    setPublishAction("publish")
    try {
      const savedPage = dirty ? await handleSave() : page
      if (!savedPage) {
        return
      }

      const updated = await publishDocPage(savedPage.id, publishChangelog, user?.id)
      setPage(updated)
      const v = await listDocPageVersions(pageId)
      setVersions(v)
      setShowPublishDialog(false)
      setPublishChangelog("")
      toast.success("Page published", { description: `"${page.title}" is now live.` })
      addNotification(`Published "${page.title}" as ${`v${v.length}`}.`)
    } catch (err) {
      console.error("Publish failed:", err)
      toast.error("Publish failed", { description: getErrorMessage(err) })
    } finally {
      setPublishAction(null)
    }
  }

  async function handleUnpublish() {
    if (!page) return
    setPublishAction("unpublish")
    try {
      const updated = await unpublishDocPage(page.id, user?.id)
      setPage(updated)
      toast.success("Page unpublished", { description: `"${page.title}" is back in draft.` })
      addNotification(`Unpublished "${page.title}".`)
    } catch (err) {
      console.error("Unpublish failed:", err)
      toast.error("Unpublish failed", { description: getErrorMessage(err) })
    } finally {
      setPublishAction(null)
    }
  }

  function handleRestoreVersion(version: DocPageVersion) {
    setContent(version.content)
    setDirty(true)
    setPreviewingVersion(null)
    setShowVersionHistory(false)
    setShowDiff(false)
  }

  function insertMarkdown(prefix: string, suffix: string = "") {
    if (editorViewRef.current) {
      insertAtCursor(editorViewRef.current, prefix, suffix)
    }
  }

  function insertSnippetToken() {
    if (selectedSnippetToken === "none") return
    insertMarkdown(`\n{{snippet:${selectedSnippetToken}}}\n`)
    setSelectedSnippetToken("none")
  }

  function insertExampleToken() {
    if (selectedExampleToken === "none") return
    insertMarkdown(`\n{{example:${selectedExampleToken}}}\n`)
    setSelectedExampleToken("none")
  }

  // ── Feature 7: Search replace handler ──────────────────────────────────────
  function handleSearchReplace() {
    if (!searchQuery) return
    const updated = content.replaceAll(searchQuery, searchReplace)
    if (updated !== content) {
      handleContentChange(updated)
      toast.success("Replaced all", { description: `Replaced all occurrences of "${searchQuery}".` })
    }
  }

  // ── Feature 3: Scroll to heading ───────────────────────────────────────────
  function scrollToHeading(headingId: string) {
    const el = document.querySelector(`[data-heading-id="${headingId}"]`)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  // ── Feature 4: Compute diff lines when previewing a version ────────────────
  const diffLines = useMemo(() => {
    if (!showDiff || !previewingVersion) return null
    return computeDiff(content, previewingVersion.content)
  }, [showDiff, previewingVersion, content])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading page...
      </div>
    )
  }

  if (!page) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Page not found
      </div>
    )
  }

  const showVisualEditor = mode === "visual"
  const showMarkdownEditor = mode === "edit"
  const showPreviewPane = mode === "preview" || splitView
  const nextVersion = `v${versions.length + 1}`
  const isWorkflowBusy = publishAction !== null
  const actionDisabled = isWorkflowBusy || saving || !!previewingVersion
  const publishActionDisabled = actionDisabled || page.status === "published" || !can("canPublish")
  const unpublishActionDisabled = actionDisabled || page.status !== "published" || !can("canPublish")

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" aria-label="Back" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">{page.title}</h2>
              <Badge variant={page.status === "published" ? "default" : "secondary"} className="text-[10px]">
                {page.status}
              </Badge>
              {dirty && <Badge variant="outline" className="text-[10px] text-warning">Unsaved</Badge>}
              {previewingVersion && <Badge variant="outline" className="text-[10px]">Previewing {previewingVersion.version}</Badge>}
            </div>
            <p className="text-xs text-muted-foreground">
              Documentation page · {page.pageType} · {page.slug}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Feature 3: Outline toggle */}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle outline"
            aria-pressed={showOutline}
            onClick={() => setShowOutline((v) => !v)}
            className={cn("h-8 w-8", showOutline && "bg-accent")}
          >
            <PanelLeft className="h-3.5 w-3.5" />
          </Button>

          {/* Feature 5: Undo/Redo (visual mode) */}
          {mode === "visual" && (
            <>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Undo"
                onClick={handleUndo}
                disabled={undoStackRef.current.length === 0}
                className="h-8 w-8"
              >
                <Undo2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Redo"
                onClick={handleRedo}
                disabled={redoStackRef.current.length === 0}
                className="h-8 w-8"
              >
                <Redo2 className="h-3.5 w-3.5" />
              </Button>
              <div className="mx-0.5 h-4 w-px bg-border" />
            </>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Editor tools" className="relative h-8 w-8">
                <MoreHorizontal className="h-3.5 w-3.5" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-1 text-[9px] text-primary-foreground">
                    {unreadNotificationCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel className="text-xs text-muted-foreground">Editor tools</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => setShowOutline((value) => !value)}>
                <PanelLeft className="h-3.5 w-3.5" />
                {showOutline ? "Hide outline" : "Show outline"}
              </DropdownMenuItem>
              {mode === "visual" && (
                <DropdownMenuItem onSelect={() => setShowSearch((value) => !value)}>
                  <Search className="h-3.5 w-3.5" />
                  {showSearch ? "Hide search & replace" : "Show search & replace"}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="flex items-center justify-between text-xs">
                <span>Editor notifications</span>
                {unreadNotificationCount > 0 && (
                  <button
                    className="text-[10px] text-muted-foreground hover:text-foreground"
                    onClick={markAllNotificationsRead}
                  >
                    Mark all read
                  </button>
                )}
              </DropdownMenuLabel>
              {notifications.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                  No notifications yet.
                </div>
              ) : (
                notifications.slice(0, 6).map((notif) => (
                  <DropdownMenuItem key={notif.id} className="flex flex-col items-start gap-0.5 py-2">
                    <span className={cn("text-xs", !notif.read && "font-medium")}>{notif.message}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(notif.timestamp).toLocaleTimeString()}
                    </span>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="mx-0.5 h-4 w-px bg-border" />

          <div className="flex items-center gap-1 rounded-xl border bg-muted/40 p-1">
            <Button
              variant="ghost"
              size="sm"
              aria-pressed={mode === "visual"}
              className={cn(
                "h-8 gap-1.5 rounded-lg px-3 text-xs transition-all",
                mode === "visual"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => handleModeSelect("visual")}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              可视化
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-pressed={mode === "edit"}
              className={cn(
                "h-8 gap-1.5 rounded-lg px-3 text-xs transition-all",
                mode === "edit"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => handleModeSelect("edit")}
            >
              <FileText className="h-3.5 w-3.5" />
              纯文本
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-pressed={splitView}
              disabled={mode === "preview"}
              className={cn(
                "h-8 gap-1.5 rounded-lg px-3 text-xs transition-all",
                splitView
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
                mode === "preview" && "cursor-not-allowed opacity-40",
              )}
              onClick={() => setSplitView((current) => !current)}
            >
              <Split className="h-3.5 w-3.5" />
              分栏
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-pressed={mode === "preview"}
              className={cn(
                "h-8 gap-1.5 rounded-lg px-3 text-xs transition-all",
                mode === "preview"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => handleModeSelect("preview")}
            >
              <Eye className="h-3.5 w-3.5" />
              预览
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={handleSave} disabled={!dirty || saving || isEditorReadOnly}>
            <Save className="mr-1.5 h-3.5 w-3.5" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowVersionHistory(!showVersionHistory)}>
            <History className="mr-1.5 h-3.5 w-3.5" />
            {versions.length > 0 ? `v${versions.length}` : "History"}
          </Button>
          {page.status !== "published" && (
            <Button size="sm" onClick={() => setShowPublishDialog(true)} disabled={publishActionDisabled}>
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              Publish
            </Button>
          )}
          {page.status === "published" && (
            <Button size="sm" variant="outline" onClick={() => void handleUnpublish()} disabled={unpublishActionDisabled}>
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              {publishAction === "unpublish" ? "Unpublishing..." : "Unpublish"}
            </Button>
          )}
        </div>
      </div>

      {/* Feature 7: Search & Replace bar (visual mode) */}
      {showSearch && mode === "visual" && (
        <div className="flex items-center gap-2 border-b bg-muted/20 px-4 py-2">
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="h-7 w-48 text-xs"
            autoFocus
          />
          <Replace className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <Input
            value={searchReplace}
            onChange={(e) => setSearchReplace(e.target.value)}
            placeholder="Replace..."
            className="h-7 w-48 text-xs"
          />
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleSearchReplace} disabled={!searchQuery}>
            Replace All
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label="Close search"
            onClick={() => {
              setShowSearch(false)
              setSearchQuery("")
              setSearchReplace("")
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Formatting toolbar */}
      {showMarkdownEditor && !isEditorReadOnly && (
        <div className="flex items-center gap-0.5 border-b px-4 py-1.5 bg-muted/30">
          <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Heading 1" onClick={() => insertMarkdown("# ", "\n")}>
            <Heading1 className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Heading 2" onClick={() => insertMarkdown("## ", "\n")}>
            <Heading2 className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Heading 3" onClick={() => insertMarkdown("### ", "\n")}>
            <Heading3 className="h-3.5 w-3.5" />
          </Button>
          <div className="mx-1 h-4 w-px bg-border" />
          <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Bold" onClick={() => insertMarkdown("**", "**")}>
            <Bold className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Italic" onClick={() => insertMarkdown("*", "*")}>
            <Italic className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Inline code" onClick={() => insertMarkdown("`", "`")}>
            <Code className="h-3.5 w-3.5" />
          </Button>
          <div className="mx-1 h-4 w-px bg-border" />
          <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Insert link" onClick={() => insertMarkdown("[", "](url)")}>
            <Link className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Block quote" onClick={() => insertMarkdown("> ", "\n")}>
            <Quote className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Bullet list" onClick={() => insertMarkdown("- ", "\n")}>
            <List className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Numbered list" onClick={() => insertMarkdown("1. ", "\n")}>
            <ListOrdered className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Code block" onClick={() => insertMarkdown("```\n", "\n```\n")}>
            <Braces className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Quick-insert toolbar */}
      {showMarkdownEditor && !isEditorReadOnly && (
        <div className="flex items-center gap-1 border-b px-4 py-1.5 bg-muted/10 overflow-x-auto">
          <span className="text-[10px] font-medium uppercase tracking-wider mr-2 text-muted-foreground shrink-0">
            Quick Insert
          </span>
          {allQuickInserts.map((qi) => (
            <Button
              key={qi.label}
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs shrink-0"
              onClick={() => qi.action(insertMarkdown)}
            >
              <qi.icon className="h-3 w-3" />
              {qi.label}
            </Button>
          ))}
          {snippets.length > 0 && (
            <>
              <div className="mx-2 h-4 w-px bg-border shrink-0" />
              <Select value={selectedSnippetToken} onValueChange={setSelectedSnippetToken}>
                <SelectTrigger className="h-7 w-[170px] text-xs">
                  <SelectValue placeholder="Insert snippet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select snippet</SelectItem>
                  {snippets.map((snippet) => (
                    <SelectItem key={snippet.id} value={snippet.slug}>
                      {snippet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="h-7 text-xs shrink-0" onClick={insertSnippetToken} disabled={selectedSnippetToken === "none"}>
                Insert snippet
              </Button>
            </>
          )}
          {examples.length > 0 && (
            <>
              <Select value={selectedExampleToken} onValueChange={setSelectedExampleToken}>
                <SelectTrigger className="h-7 w-[170px] text-xs">
                  <SelectValue placeholder="Insert example" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select example</SelectItem>
                  {examples.map((example) => (
                    <SelectItem key={example.id} value={example.slug}>
                      {example.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="h-7 text-xs shrink-0" onClick={insertExampleToken} disabled={selectedExampleToken === "none"}>
                Insert example
              </Button>
            </>
          )}
        </div>
      )}

      {/* Editor + Preview + Version History + Outline */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Feature 3: Outline/TOC sidebar */}
        {showOutline && (
          <div className="w-56 border-r bg-muted/10 flex flex-col">
            <div className="flex items-center justify-between border-b px-3 py-2">
              <span className="text-xs font-medium">Outline</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" aria-label="Close outline" onClick={() => setShowOutline(false)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
            <ScrollArea className="flex-1">
              {outlineHeadings.length === 0 ? (
                <p className="px-3 py-4 text-xs text-muted-foreground">No headings found. Add ## or ### headings to your content.</p>
              ) : (
                <div className="p-2 space-y-0.5">
                  {outlineHeadings.map((heading) => (
                    <button
                      key={heading.id}
                      className={cn(
                        "w-full text-left rounded-md px-2 py-1.5 text-xs hover:bg-accent transition-colors truncate",
                        heading.level === 3 && "pl-5",
                      )}
                      onClick={() => scrollToHeading(heading.id)}
                    >
                      {heading.text}
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        )}

        {showVisualEditor && (
          <div className={cn("min-h-0 flex-1 overflow-hidden", splitView && "border-r")}>
            <VisualDocEditor
              content={activeContent}
              onChange={handleContentChange}
              readOnly={isEditorReadOnly}
              supportReport={visualSupportReport}
            />
          </div>
        )}
        {showMarkdownEditor && (
          <div className={cn("min-h-0 flex-1 overflow-hidden", splitView && "border-r")}>
            <MarkdownEditor
              value={activeContent}
              onChange={handleContentChange}
              placeholder="Start writing in Markdown..."
              readOnly={isEditorReadOnly}
              editorRef={editorViewRef}
              className="h-full rounded-none border-0 [&_.cm-editor]:rounded-none"
            />
          </div>
        )}
        {showPreviewPane && (
          <ScrollArea className="flex-1">
            <div className="prose dark:prose-invert max-w-none p-8">
              <DocumentRenderer
                content={activeContent}
                snippets={snippets}
                examples={examples}
              />
            </div>
          </ScrollArea>
        )}

        {/* Feature 4: Diff view when previewing a version */}
        {previewingVersion && showDiff && diffLines && (
          <div className="flex-1 overflow-hidden border-l">
            <div className="flex items-center justify-between border-b px-3 py-2 bg-muted/20">
              <span className="text-xs font-medium">Diff: current vs {previewingVersion.version}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" aria-label="Close diff" onClick={() => setShowDiff(false)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
            <ScrollArea className="h-full">
              <div className="p-4 font-mono text-xs leading-6">
                {diffLines.map((line, i) => (
                  <div
                    key={i}
                    className={cn(
                      "px-2 whitespace-pre-wrap",
                      line.type === "added" && "bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-200",
                      line.type === "removed" && "bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-200",
                    )}
                  >
                    <span className="inline-block w-4 shrink-0 select-none text-muted-foreground">
                      {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
                    </span>
                    {line.text}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Version History Panel */}
        {showVersionHistory && (
          <div className="w-64 border-l bg-muted/20 flex flex-col">
            <div className="flex items-center justify-between border-b px-3 py-2">
              <span className="text-xs font-medium">Version History</span>
              <Button variant="ghost" size="icon" aria-label="Close version history" onClick={() => { setShowVersionHistory(false); setPreviewingVersion(null); setShowDiff(false) }}>
                ✕
              </Button>
            </div>
            <ScrollArea className="flex-1">
              {versions.length === 0 ? (
                <p className="px-3 py-4 text-xs text-muted-foreground">No versions yet. Publish to create the first version.</p>
              ) : (
                <div className="p-2 space-y-1">
                  {previewingVersion && (
                    <div className="px-2 py-1.5 mb-2 bg-yellow-100 dark:bg-yellow-900/30 rounded text-[10px]">
                      Previewing {previewingVersion.version} ·{" "}
                      <button className="underline" onClick={() => handleRestoreVersion(previewingVersion)}>
                        Restore this version
                      </button>
                      {" · "}
                      <button className="underline" onClick={() => setPreviewingVersion(null)}>
                        Cancel
                      </button>
                      {" · "}
                      {/* Feature 4: Show diff toggle */}
                      <button className="underline" onClick={() => setShowDiff((v) => !v)}>
                        {showDiff ? "Hide diff" : "Show diff"}
                      </button>
                    </div>
                  )}
                  {versions.map((v) => (
                    <button
                      key={v.id}
                      className={cn(
                        "w-full text-left rounded-md px-2 py-2 text-xs hover:bg-accent transition-colors",
                        previewingVersion?.id === v.id && "bg-accent ring-1 ring-primary"
                      )}
                      onClick={() => setPreviewingVersion(v)}
                    >
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[9px] px-1">{v.version}</Badge>
                        <span className="text-muted-foreground truncate">{v.publishedBy}</span>
                      </div>
                      {v.changelog && (
                        <p className="mt-1 text-[10px] text-muted-foreground line-clamp-2">{v.changelog}</p>
                      )}
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {new Date(v.createdAt).toLocaleString()}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        )}

      </div>

      {/* Publish Dialog */}
      <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Publish Page</DialogTitle>
            <DialogDescription>
              This will create version {nextVersion} and make the current draft live.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="changelog" className="text-xs">Changelog (optional)</Label>
              <Input
                id="changelog"
                value={publishChangelog}
                onChange={(e) => setPublishChangelog(e.target.value)}
                placeholder="What changed in this version?"
                className="text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowPublishDialog(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handlePublish} disabled={publishAction === "publish"}>
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              {publishAction === "publish" ? "Publishing..." : "Publish Page"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Feature 2: Unsaved changes confirmation dialog */}
      <Dialog open={showUnsavedConfirm} onOpenChange={setShowUnsavedConfirm}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Unsaved changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowUnsavedConfirm(false)}>
              Stay
            </Button>
            <Button variant="destructive" size="sm" onClick={confirmLeave}>
              Leave without saving
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showVisualModeConfirm}
        onOpenChange={(open) => {
          if (!open) {
            dismissVisualModeConfirm()
            return
          }
          setShowVisualModeConfirm(open)
        }}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Visual mode will normalize this Markdown
            </DialogTitle>
            <DialogDescription>
              Domino can open this page in visual mode, but saving from the visual editor may rewrite some source formatting into structured blocks.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="rounded-xl border border-warning/20 bg-warning/[0.08] p-3">
              <ul className="space-y-2 text-sm text-foreground">
                {visualSupportReport.details.map((detail) => (
                  <li key={detail} className="leading-6">
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              Stay in Markdown mode if you need exact control over the source. Open visual mode when you want structure, templates, and inspector-based editing.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={dismissVisualModeConfirm}>
              Stay in Markdown
            </Button>
            <Button size="sm" onClick={confirmVisualModeSelection}>
              Open visual mode
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
