import {
  defaultBlockAppearance,
  isDefaultBlockAppearance,
  normalizeBlockAppearance,
  type BlockAppearance,
} from "@/lib/api-platform/block-appearance"

// ── Block Type Definitions ───────────────────────────────────────────────────

export type CommonBlockType = "heading" | "text" | "code" | "table" | "callout" | "image"
export type RestBlockType = "rest_endpoint"
export type GraphqlBlockType = "graphql_operation" | "graphql_schema"
export type WebhookBlockType = "webhook_event" | "webhook_verify" | "webhook_retry"
export type GuidelineBlockType = "steps" | "dos_donts"
export type ApiComponentBlockType = "param_table" | "auth_config" | "error_responses" | "field_table"
export type OpenApiBlockType = "server_config" | "schema_model" | "rate_limit" | "pagination_config" | "response_headers" | "security_scheme"

export type BlockType =
  | CommonBlockType
  | RestBlockType
  | GraphqlBlockType
  | WebhookBlockType
  | GuidelineBlockType
  | ApiComponentBlockType
  | OpenApiBlockType

export interface HeadingData { level: 2 | 3; text: string; description: string }
export interface TextData { content: string }
export interface CodeData { language: string; code: string; caption: string }
export interface TableData { headers: string[]; rows: string[][] }
export interface CalloutData { variant: "tip" | "warning" | "info"; text: string }

export interface ImageData { src: string; alt: string; caption: string; width?: number }

export interface RestEndpointData {
  method: string
  path: string
  description: string
  headers: { key: string; value: string }[]
  requestBody: string
  responseStatus: string
  responseBody: string
}

export interface GraphqlOperationData {
  operationType: "query" | "mutation"
  name: string
  description: string
  code: string
  variables: string
}

export interface GraphqlSchemaData { code: string }

export interface WebhookEventData { eventName: string; description: string; payload: string }
export interface WebhookVerifyData { description: string; language: string; code: string }
export interface WebhookRetryData { description: string; rows: { attempt: string; delay: string }[] }

export interface StepsData { title: string; steps: { label: string; description: string }[] }
export interface DosDontsData { dos: string[]; donts: string[] }

export interface ParamTableData {
  variant: "query" | "path" | "header" | "cookie"
  params: { name: string; type: string; required: boolean; description: string }[]
}

export interface AuthConfigData {
  authType: "none" | "api-key" | "bearer" | "basic" | "oauth2"
  apiKeyName?: string
  apiKeyIn?: "header" | "query"
  bearerFormat?: string
  oauth2Flow?: "client_credentials" | "authorization_code" | "implicit"
  oauth2TokenUrl?: string
  oauth2AuthUrl?: string
  oauth2Scopes?: string[]
  description?: string
}

export interface ErrorResponsesData {
  responses: { statusCode: number; description: string; body?: string }[]
}

export interface FieldTableData {
  title: string
  fields: { path: string; type: string; required: boolean; description: string; example?: string }[]
  exampleJson?: string
}

export interface ServerConfigData {
  servers: { url: string; description: string; variables: { name: string; default: string; enum: string[]; description: string }[] }[]
}

export interface SchemaModelData {
  name: string
  description: string
  properties: { name: string; type: string; required: boolean; description: string; example: string }[]
  composition?: { type: "allOf" | "oneOf" | "anyOf"; refs: string[] }
}

export interface RateLimitData {
  description: string
  limits: { name: string; limit: number; window: string; description: string }[]
  headers: { limit: string; remaining: string; reset: string }
}

export interface PaginationConfigData {
  style: "offset" | "cursor" | "page" | "none"
  description: string
  parameters: { name: string; type: string; required: boolean; default: string; description: string }[]
  responseFields: { name: string; type: string; description: string }[]
}

export interface ResponseHeadersData {
  headers: { name: string; type: string; required: boolean; description: string; example: string }[]
}

export interface SecuritySchemeData {
  name: string
  type: "apiKey" | "http" | "oauth2" | "openIdConnect"
  description: string
  apiKeyIn?: "header" | "query" | "cookie"
  apiKeyName?: string
  scheme?: string
  bearerFormat?: string
  openIdConnectUrl?: string
  oauth2Flows?: string
}

export type BlockDataMap = {
  heading: HeadingData
  text: TextData
  code: CodeData
  table: TableData
  callout: CalloutData
  image: ImageData
  rest_endpoint: RestEndpointData
  graphql_operation: GraphqlOperationData
  graphql_schema: GraphqlSchemaData
  webhook_event: WebhookEventData
  webhook_verify: WebhookVerifyData
  webhook_retry: WebhookRetryData
  steps: StepsData
  dos_donts: DosDontsData
  param_table: ParamTableData
  auth_config: AuthConfigData
  error_responses: ErrorResponsesData
  field_table: FieldTableData
  server_config: ServerConfigData
  schema_model: SchemaModelData
  rate_limit: RateLimitData
  pagination_config: PaginationConfigData
  response_headers: ResponseHeadersData
  security_scheme: SecuritySchemeData
}

export interface ContentBlock<T extends BlockType = BlockType> {
  id: string
  type: T
  data: BlockDataMap[T]
  appearance: BlockAppearance
}

interface SerializedBlockMeta {
  id: string
  type: BlockType
  appearance?: BlockAppearance
}

export interface VisualEditingSupportReport {
  fidelity: "structured" | "compatible" | "warning"
  hasSerializedMetadata: boolean
  roundTripSafe: boolean
  rawMarkdownBlockCount: number
  details: string[]
}

const serializedBlocksPrefix = "<!-- domino:blocks "
const serializedBlockDivider = "<!-- domino:block -->"

function normalizeContentBlock<T extends BlockType>(block: ContentBlock<T>): ContentBlock<T> {
  return {
    ...block,
    appearance: normalizeBlockAppearance(block.appearance),
  }
}

// ── Block Labels & Availability ──────────────────────────────────────────────

export const blockLabels: Record<BlockType, string> = {
  heading: "标题",
  text: "文本",
  code: "代码块",
  table: "表格",
  callout: "提示框",
  image: "图片",
  rest_endpoint: "REST 端点",
  graphql_operation: "GraphQL 操作",
  graphql_schema: "GraphQL Schema",
  webhook_event: "Webhook 事件",
  webhook_verify: "签名验证",
  webhook_retry: "重试策略",
  steps: "步骤",
  dos_donts: "推荐 / 避免",
  param_table: "参数表",
  auth_config: "认证配置",
  error_responses: "错误响应",
  field_table: "字段描述",
  server_config: "服务器配置",
  schema_model: "数据模型",
  rate_limit: "速率限制",
  pagination_config: "分页配置",
  response_headers: "响应头",
  security_scheme: "安全方案",
}

export const commonBlocks: CommonBlockType[] = ["heading", "text", "code", "table", "callout", "image"]
const apiComponentBlocks: ApiComponentBlockType[] = ["param_table", "auth_config", "error_responses", "field_table"]

const allBlocks: BlockType[] = [
  ...commonBlocks,
  "rest_endpoint",
  "graphql_operation", "graphql_schema",
  "webhook_event", "webhook_verify", "webhook_retry",
  "steps", "dos_donts",
  ...apiComponentBlocks,
  "server_config", "schema_model", "rate_limit", "pagination_config", "response_headers", "security_scheme",
]

export const availableBlocks: BlockType[] = allBlocks

export type ComponentPageTemplate = Exclude<BlockType, CommonBlockType>

// ── Default Block Data ───────────────────────────────────────────────────────

export function createBlockId(): string {
  return `blk-${crypto.randomUUID().slice(0, 8)}`
}

export function createDefaultBlock<T extends BlockType>(type: T): ContentBlock<T> {
  const id = createBlockId()
  const data = defaultBlockData[type] as BlockDataMap[T]
  return normalizeContentBlock({
    id,
    type,
    data: structuredClone(data),
    appearance: structuredClone(defaultBlockAppearance),
  })
}

const defaultBlockData: { [K in BlockType]: BlockDataMap[K] } = {
  heading: { level: 2, text: "Section Title", description: "" },
  text: { content: "" },
  code: { language: "json", code: "", caption: "" },
  table: { headers: ["Column 1", "Column 2", "Column 3"], rows: [["", "", ""]] },
  callout: { variant: "tip", text: "" },
  image: { src: "", alt: "", caption: "" },
  rest_endpoint: {
    method: "POST",
    path: "/v1/resource",
    description: "Description of this endpoint.",
    headers: [
      { key: "Authorization", value: "Bearer {token}" },
      { key: "Content-Type", value: "application/json" },
    ],
    requestBody: '{\n  "name": "example",\n  "value": 100\n}',
    responseStatus: "201 Created",
    responseBody: '{\n  "id": "res_abc123",\n  "name": "example",\n  "value": 100,\n  "created_at": "2024-01-15T09:30:00Z"\n}',
  },
  graphql_operation: {
    operationType: "query",
    name: "GetResources",
    description: "",
    code: `query GetResources($first: Int, $after: String) {\n  resources(first: $first, after: $after) {\n    edges {\n      node {\n        id\n        name\n        status\n      }\n    }\n    pageInfo {\n      hasNextPage\n      endCursor\n    }\n  }\n}`,
    variables: '{\n  "first": 10,\n  "after": null\n}',
  },
  graphql_schema: {
    code: `type Resource {\n  id: ID!\n  name: String!\n  description: String\n  status: Status!\n  createdAt: DateTime!\n}\n\nenum Status {\n  ACTIVE\n  INACTIVE\n  ARCHIVED\n}`,
  },
  webhook_event: {
    eventName: "resource.created",
    description: "Triggered when a new resource is created.",
    payload: '{\n  "event": "resource.created",\n  "timestamp": "2024-01-15T09:30:00Z",\n  "data": {\n    "id": "res_abc123",\n    "name": "Example Resource",\n    "status": "active"\n  }\n}',
  },
  webhook_verify: {
    description: "All webhook payloads include an `X-Signature-256` header containing an HMAC-SHA256 signature.",
    language: "javascript",
    code: `const crypto = require('crypto');\n\nfunction verifySignature(payload, signature, secret) {\n  const expected = crypto\n    .createHmac('sha256', secret)\n    .update(payload, 'utf8')\n    .digest('hex');\n  return crypto.timingSafeEqual(\n    Buffer.from(signature),\n    Buffer.from(\`sha256=\${expected}\`)\n  );\n}`,
  },
  webhook_retry: {
    description: "Failed deliveries (non-2xx response) are retried with exponential backoff:",
    rows: [
      { attempt: "1st retry", delay: "1 minute" },
      { attempt: "2nd retry", delay: "5 minutes" },
      { attempt: "3rd retry", delay: "30 minutes" },
      { attempt: "4th retry", delay: "2 hours" },
      { attempt: "5th retry", delay: "24 hours" },
    ],
  },
  steps: {
    title: "Steps",
    steps: [
      { label: "Step one", description: "Description of the first step." },
      { label: "Step two", description: "Description of the second step." },
      { label: "Step three", description: "Description of the third step." },
    ],
  },
  dos_donts: {
    dos: ["Use descriptive, meaningful names", "Keep it simple and consistent", "Document edge cases"],
    donts: ["Don't use abbreviations without context", "Don't mix naming conventions", "Don't skip error handling"],
  },
  param_table: {
    variant: "query",
    params: [
      { name: "page", type: "integer", required: false, description: "Page number for pagination" },
      { name: "limit", type: "integer", required: false, description: "Number of items per page (max 100)" },
      { name: "sort", type: "string", required: false, description: "Sort field (e.g. created_at, name)" },
    ],
  },
  auth_config: {
    authType: "bearer",
    bearerFormat: "JWT",
    description: "Include a valid access token in the Authorization header.",
  },
  error_responses: {
    responses: [
      { statusCode: 400, description: "Bad Request — Invalid input parameters", body: '{\n  "error": "validation_error",\n  "message": "Invalid email format"\n}' },
      { statusCode: 401, description: "Unauthorized — Missing or invalid credentials" },
      { statusCode: 404, description: "Not Found — Resource does not exist" },
      { statusCode: 429, description: "Too Many Requests — Rate limit exceeded" },
      { statusCode: 500, description: "Internal Server Error" },
    ],
  },
  field_table: {
    title: "Request Body",
    fields: [
      { path: "name", type: "string", required: true, description: "Display name of the resource", example: "\"My Resource\"" },
      { path: "email", type: "email", required: true, description: "Contact email address", example: "\"user@example.com\"" },
      { path: "metadata", type: "object", required: false, description: "Arbitrary key-value metadata" },
      { path: "metadata.tags", type: "array", required: false, description: "List of tags", example: "[\"beta\", \"v2\"]" },
    ],
    exampleJson: '{\n  "name": "My Resource",\n  "email": "user@example.com",\n  "metadata": {\n    "tags": ["beta", "v2"]\n  }\n}',
  },
  server_config: { servers: [{ url: "https://api.example.com", description: "Production", variables: [] }] },
  schema_model: { name: "Model", description: "", properties: [{ name: "id", type: "string", required: true, description: "Unique identifier", example: "abc-123" }], composition: undefined },
  rate_limit: { description: "", limits: [{ name: "Standard", limit: 100, window: "1 minute", description: "Standard rate limit" }], headers: { limit: "X-RateLimit-Limit", remaining: "X-RateLimit-Remaining", reset: "X-RateLimit-Reset" } },
  pagination_config: { style: "offset", description: "", parameters: [{ name: "offset", type: "integer", required: false, default: "0", description: "Number of items to skip" }, { name: "limit", type: "integer", required: false, default: "20", description: "Maximum items to return" }], responseFields: [{ name: "total", type: "integer", description: "Total number of items" }, { name: "hasMore", type: "boolean", description: "Whether more items exist" }] },
  response_headers: { headers: [{ name: "X-Request-Id", type: "string", required: false, description: "Unique request identifier", example: "req-abc-123" }] },
  security_scheme: { name: "BearerAuth", type: "http" as const, description: "JWT Bearer token authentication", scheme: "bearer", bearerFormat: "JWT" },
}

function createHeadingBlock(text: string, description: string): ContentBlock<"heading"> {
  return normalizeContentBlock({
    id: createBlockId(),
    type: "heading",
    data: {
      level: 2,
      text,
      description,
    },
    appearance: structuredClone(defaultBlockAppearance),
  })
}

function createTemplateBlock<T extends BlockType>(
  type: T,
  patch?: Partial<BlockDataMap[T]>,
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
    } as BlockDataMap[T],
  }
}

export function createComponentPageTemplate(
  template: ComponentPageTemplate,
  name: string,
): string {
  const blocks: ContentBlock[] = []

  switch (template) {
    case "rest_endpoint":
      blocks.push(
        createHeadingBlock(name, "Document the endpoint contract, parameters, authentication requirements, and failure modes in one place."),
        createTemplateBlock("rest_endpoint"),
        createTemplateBlock("param_table"),
        createTemplateBlock("auth_config"),
        createTemplateBlock("field_table"),
        createTemplateBlock("error_responses"),
      )
      break
    case "graphql_operation":
      blocks.push(
        createHeadingBlock(name, "Capture the operation shape, variables, auth expectations, and common failures for this GraphQL interaction."),
        createTemplateBlock("graphql_operation"),
        createTemplateBlock("auth_config"),
        createTemplateBlock("error_responses"),
      )
      break
    case "graphql_schema":
      blocks.push(
        createHeadingBlock(name, "Use this page to manage the GraphQL schema definition or a focused SDL excerpt."),
        createTemplateBlock("graphql_schema"),
      )
      break
    case "webhook_event":
      blocks.push(
        createHeadingBlock(name, "Track the event payload, signature handling, and retry behavior that clients need to implement."),
        createTemplateBlock("webhook_event"),
        createTemplateBlock("webhook_verify"),
        createTemplateBlock("webhook_retry"),
      )
      break
    case "webhook_verify":
      blocks.push(
        createHeadingBlock(name, "Describe how webhook signatures are generated, transmitted, and verified by consumers."),
        createTemplateBlock("webhook_verify"),
      )
      break
    case "webhook_retry":
      blocks.push(
        createHeadingBlock(name, "Summarize delivery guarantees, retry timing, and backoff expectations for failed webhook calls."),
        createTemplateBlock("webhook_retry"),
      )
      break
    case "steps":
      blocks.push(
        createHeadingBlock(name, "Break the workflow into a clear sequence that authors can keep up to date."),
        createTemplateBlock("steps", { title: name }),
      )
      break
    case "dos_donts":
      blocks.push(
        createHeadingBlock(name, "Capture the recommended patterns and the anti-patterns readers should avoid."),
        createTemplateBlock("dos_donts"),
      )
      break
    case "param_table":
      blocks.push(
        createHeadingBlock(name, "List supported parameters, types, defaults, and validation requirements."),
        createTemplateBlock("param_table"),
      )
      break
    case "auth_config":
      blocks.push(
        createHeadingBlock(name, "Describe how clients authenticate and what credentials or flows they need."),
        createTemplateBlock("auth_config"),
        createTemplateBlock("security_scheme"),
      )
      break
    case "error_responses":
      blocks.push(
        createHeadingBlock(name, "Standardize error status codes, explanations, and example payloads for this surface."),
        createTemplateBlock("error_responses"),
      )
      break
    case "field_table":
      blocks.push(
        createHeadingBlock(name, "Document the field-level contract, including required flags, descriptions, and examples."),
        createTemplateBlock("field_table", { title: name }),
      )
      break
    case "server_config":
      blocks.push(
        createHeadingBlock(name, "Capture environments, base URLs, and any server variables authors need to maintain."),
        createTemplateBlock("server_config"),
      )
      break
    case "schema_model":
      blocks.push(
        createHeadingBlock(name, "Document a reusable schema model and the composition rules that shape it."),
        createTemplateBlock("schema_model", { name }),
      )
      break
    case "rate_limit":
      blocks.push(
        createHeadingBlock(name, "Track rate-limit policies, tiers, and the response headers clients should monitor."),
        createTemplateBlock("rate_limit"),
      )
      break
    case "pagination_config":
      blocks.push(
        createHeadingBlock(name, "Describe how pagination works, which parameters are accepted, and which response fields clients should expect."),
        createTemplateBlock("pagination_config"),
      )
      break
    case "response_headers":
      blocks.push(
        createHeadingBlock(name, "List the headers this surface returns and explain how integrators should interpret them."),
        createTemplateBlock("response_headers"),
      )
      break
    case "security_scheme":
      blocks.push(
        createHeadingBlock(name, "Describe the shared security scheme details that apply across this product or workflow."),
        createTemplateBlock("security_scheme", { name: `${name.replace(/\s+/g, "") || "SecurityScheme"}Auth` }),
      )
      break
  }

  return serializeBlocks(blocks)
}

// ── Serialize Blocks → Markdown ──────────────────────────────────────────────

export function serializeBlocks(blocks: ContentBlock[]): string {
  const normalizedBlocks = blocks.map(normalizeContentBlock)
  const metadata = normalizedBlocks.map<SerializedBlockMeta>((block) => ({
    id: block.id,
    type: block.type,
    appearance: isDefaultBlockAppearance(block.appearance) ? undefined : block.appearance,
  }))
  const body = normalizedBlocks
    .map((block) => `${serializedBlockDivider}\n${serializeBlock(block).trimEnd()}`)
    .join("\n\n")

  return `${serializedBlocksPrefix}${JSON.stringify(metadata)} -->\n\n${body}\n`
}

export function serializeBlock(block: ContentBlock): string {
  switch (block.type) {
    case "heading": {
      const d = block.data as HeadingData
      const prefix = "#".repeat(d.level)
      let md = `${prefix} ${d.text}\n`
      if (d.description.trim()) md += `\n${d.description.trim()}\n`
      return md + "\n"
    }
    case "text": {
      const d = block.data as TextData
      return d.content.trim() ? `${d.content.trim()}\n\n` : ""
    }
    case "code": {
      const d = block.data as CodeData
      let md = ""
      if (d.caption.trim()) md += `${d.caption.trim()}\n\n`
      md += `\`\`\`${d.language}\n${d.code}\n\`\`\`\n\n`
      return md
    }
    case "table": {
      const d = block.data as TableData
      if (d.headers.length === 0) return ""
      const header = `| ${d.headers.join(" | ")} |`
      const separator = `| ${d.headers.map(() => "---").join(" | ")} |`
      const rows = d.rows.map((row) => `| ${row.join(" | ")} |`).join("\n")
      return `${header}\n${separator}\n${rows}\n\n`
    }
    case "callout": {
      const d = block.data as CalloutData
      const icons = { tip: "💡 Tip", warning: "⚠️ Warning", info: "ℹ️ Note" }
      return `> **${icons[d.variant]}:** ${d.text}\n\n`
    }
    case "image": {
      const d = block.data as ImageData
      if (!d.src) return ""
      let md = `![${d.alt}](${d.src})\n`
      if (d.caption.trim()) md += `\n*${d.caption.trim()}*\n`
      return md + "\n"
    }
    case "rest_endpoint": {
      const d = block.data as RestEndpointData
      let md = `### \`${d.method}\` ${d.path}\n\n`
      if (d.description.trim()) md += `**Description:** ${d.description.trim()}\n\n`
      if (d.headers.length > 0) {
        md += "**Headers:**\n| Header | Value |\n|--------|-------|\n"
        for (const h of d.headers) md += `| ${h.key} | ${h.value} |\n`
        md += "\n"
      }
      if (d.requestBody.trim()) {
        md += `**Request Body:**\n\`\`\`json\n${d.requestBody.trim()}\n\`\`\`\n\n`
      }
      if (d.responseBody.trim()) {
        md += `**Response** \`${d.responseStatus}\`:\n\`\`\`json\n${d.responseBody.trim()}\n\`\`\`\n\n`
      }
      return md
    }
    case "graphql_operation": {
      const d = block.data as GraphqlOperationData
      const label = d.operationType === "query" ? "Query" : "Mutation"
      let md = `### ${label}${d.name ? ` — ${d.name}` : ""}\n\n`
      if (d.description.trim()) md += `${d.description.trim()}\n\n`
      md += `\`\`\`graphql\n${d.code.trim()}\n\`\`\`\n\n`
      if (d.variables.trim()) {
        md += `**Variables:**\n\`\`\`json\n${d.variables.trim()}\n\`\`\`\n\n`
      }
      return md
    }
    case "graphql_schema": {
      const d = block.data as GraphqlSchemaData
      return `### Schema\n\n\`\`\`graphql\n${d.code.trim()}\n\`\`\`\n\n`
    }
    case "webhook_event": {
      const d = block.data as WebhookEventData
      let md = `### \`${d.eventName}\`\n\n`
      if (d.description.trim()) md += `${d.description.trim()}\n\n`
      if (d.payload.trim()) md += `**Payload:**\n\`\`\`json\n${d.payload.trim()}\n\`\`\`\n\n`
      return md
    }
    case "webhook_verify": {
      const d = block.data as WebhookVerifyData
      let md = "### Signature Verification\n\n"
      if (d.description.trim()) md += `${d.description.trim()}\n\n`
      md += `\`\`\`${d.language}\n${d.code.trim()}\n\`\`\`\n\n`
      return md
    }
    case "webhook_retry": {
      const d = block.data as WebhookRetryData
      let md = "### Retry Policy\n\n"
      if (d.description.trim()) md += `${d.description.trim()}\n\n`
      md += "| Attempt | Delay |\n|---------|-------|\n"
      for (const r of d.rows) md += `| ${r.attempt} | ${r.delay} |\n`
      return md + "\n"
    }
    case "steps": {
      const d = block.data as StepsData
      let md = d.title.trim() ? `### ${d.title.trim()}\n\n` : ""
      d.steps.forEach((s, i) => {
        md += `${i + 1}. **${s.label}** — ${s.description}\n`
      })
      return md + "\n"
    }
    case "dos_donts": {
      const d = block.data as DosDontsData
      let md = "### ✅ Do\n\n"
      for (const item of d.dos) md += `- ${item}\n`
      md += "\n### ❌ Don't\n\n"
      for (const item of d.donts) md += `- ${item}\n`
      return md + "\n"
    }
    case "param_table": {
      const d = block.data as ParamTableData
      const variantLabels: Record<string, string> = { query: "Query Parameters", path: "Path Parameters", header: "Headers", cookie: "Cookies" }
      let md = `### ${variantLabels[d.variant] ?? "Parameters"}\n\n`
      md += "| Name | Type | Required | Description |\n|------|------|----------|-------------|\n"
      for (const p of d.params) md += `| \`${p.name}\` | ${p.type} | ${p.required ? "✅" : "—"} | ${p.description} |\n`
      return md + "\n"
    }
    case "auth_config": {
      const d = block.data as AuthConfigData
      const typeLabels: Record<string, string> = { none: "None", "api-key": "API Key", bearer: "Bearer Token", basic: "Basic Auth", oauth2: "OAuth 2.0" }
      let md = `### Authentication — ${typeLabels[d.authType] ?? d.authType}\n\n`
      if (d.description?.trim()) md += `${d.description.trim()}\n\n`
      if (d.authType === "api-key") {
        md += `- **Key Name:** \`${d.apiKeyName ?? ""}\`\n`
        md += `- **Location:** ${d.apiKeyIn === "query" ? "Query Parameter" : "Header"}\n\n`
      } else if (d.authType === "bearer") {
        if (d.bearerFormat) md += `- **Format:** ${d.bearerFormat}\n\n`
      } else if (d.authType === "oauth2") {
        const flowLabels: Record<string, string> = { client_credentials: "Client Credentials", authorization_code: "Authorization Code", implicit: "Implicit" }
        md += `- **Flow:** ${flowLabels[d.oauth2Flow ?? ""] ?? d.oauth2Flow ?? ""}\n`
        if (d.oauth2TokenUrl) md += `- **Token URL:** \`${d.oauth2TokenUrl}\`\n`
        if (d.oauth2AuthUrl) md += `- **Authorization URL:** \`${d.oauth2AuthUrl}\`\n`
        if (d.oauth2Scopes?.length) md += `- **Scopes:** ${d.oauth2Scopes.map((s) => `\`${s}\``).join(", ")}\n`
        md += "\n"
      }
      return md
    }
    case "error_responses": {
      const d = block.data as ErrorResponsesData
      let md = "### Error Responses\n\n"
      for (const r of d.responses) {
        md += `#### \`${r.statusCode}\` ${r.description}\n\n`
        if (r.body?.trim()) md += `\`\`\`json\n${r.body.trim()}\n\`\`\`\n\n`
      }
      return md
    }
    case "field_table": {
      const d = block.data as FieldTableData
      let md = d.title.trim() ? `### ${d.title.trim()}\n\n` : ""
      if (d.fields.length > 0) {
        md += "| Path | Type | Required | Description | Example |\n|------|------|----------|-------------|----------|\n"
        for (const f of d.fields) md += `| \`${f.path}\` | ${f.type} | ${f.required ? "✅" : "—"} | ${f.description} | ${f.example ?? "—"} |\n`
        md += "\n"
      }
      if (d.exampleJson?.trim()) {
        md += `**Example:**\n\`\`\`json\n${d.exampleJson.trim()}\n\`\`\`\n\n`
      }
      return md
    }
    case "server_config": {
      const d = block.data as ServerConfigData
      const lines = ["## 🖥️ 服务器配置\n"]
      for (const s of d.servers) {
        lines.push(`### ${s.description || "Server"}`)
        lines.push(`\`${s.url}\`\n`)
        if (s.variables.length > 0) {
          lines.push("| Variable | Default | Options | Description |")
          lines.push("| --- | --- | --- | --- |")
          for (const v of s.variables) {
            lines.push(`| \`${v.name}\` | ${v.default} | ${v.enum.join(", ") || "—"} | ${v.description} |`)
          }
          lines.push("")
        }
      }
      return lines.join("\n")
    }
    case "schema_model": {
      const d = block.data as SchemaModelData
      const lines = [`## 📦 ${d.name}\n`]
      if (d.description) lines.push(d.description + "\n")
      if (d.composition) {
        lines.push(`> Composition: **${d.composition.type}** — ${d.composition.refs.map(r => `\`${r}\``).join(", ")}\n`)
      }
      if (d.properties.length > 0) {
        lines.push("| Property | Type | Required | Example | Description |")
        lines.push("| --- | --- | --- | --- | --- |")
        for (const p of d.properties) {
          lines.push(`| \`${p.name}\` | ${p.type} | ${p.required ? "✅" : "—"} | ${p.example || "—"} | ${p.description} |`)
        }
      }
      return lines.join("\n")
    }
    case "rate_limit": {
      const d = block.data as RateLimitData
      const lines = ["## ⏱️ 速率限制\n"]
      if (d.description) lines.push(d.description + "\n")
      if (d.limits.length > 0) {
        lines.push("| Name | Limit | Window | Description |")
        lines.push("| --- | --- | --- | --- |")
        for (const l of d.limits) {
          lines.push(`| ${l.name} | ${l.limit} | ${l.window} | ${l.description} |`)
        }
        lines.push("")
      }
      lines.push("**Response Headers:**\n")
      lines.push(`- Limit: \`${d.headers.limit}\``)
      lines.push(`- Remaining: \`${d.headers.remaining}\``)
      lines.push(`- Reset: \`${d.headers.reset}\``)
      return lines.join("\n")
    }
    case "pagination_config": {
      const d = block.data as PaginationConfigData
      const lines = [`## 📄 分页 (${d.style})\n`]
      if (d.description) lines.push(d.description + "\n")
      if (d.parameters.length > 0) {
        lines.push("**Parameters:**\n")
        lines.push("| Name | Type | Required | Default | Description |")
        lines.push("| --- | --- | --- | --- | --- |")
        for (const p of d.parameters) {
          lines.push(`| \`${p.name}\` | ${p.type} | ${p.required ? "✅" : "—"} | ${p.default || "—"} | ${p.description} |`)
        }
        lines.push("")
      }
      if (d.responseFields.length > 0) {
        lines.push("**Response Fields:**\n")
        lines.push("| Name | Type | Description |")
        lines.push("| --- | --- | --- |")
        for (const f of d.responseFields) {
          lines.push(`| \`${f.name}\` | ${f.type} | ${f.description} |`)
        }
      }
      return lines.join("\n")
    }
    case "response_headers": {
      const d = block.data as ResponseHeadersData
      const lines = ["## 📋 响应头\n"]
      if (d.headers.length > 0) {
        lines.push("| Header | Type | Required | Example | Description |")
        lines.push("| --- | --- | --- | --- | --- |")
        for (const h of d.headers) {
          lines.push(`| \`${h.name}\` | ${h.type} | ${h.required ? "✅" : "—"} | ${h.example || "—"} | ${h.description} |`)
        }
      }
      return lines.join("\n")
    }
    case "security_scheme": {
      const d = block.data as SecuritySchemeData
      const lines = [`## 🔐 ${d.name}\n`]
      lines.push(`**Type:** ${d.type}\n`)
      if (d.description) lines.push(d.description + "\n")
      if (d.type === "apiKey") {
        lines.push(`- Name: \`${d.apiKeyName || ""}\``)
        lines.push(`- In: ${d.apiKeyIn || "header"}`)
      } else if (d.type === "http") {
        lines.push(`- Scheme: ${d.scheme || "bearer"}`)
        if (d.bearerFormat) lines.push(`- Bearer Format: ${d.bearerFormat}`)
      } else if (d.type === "openIdConnect") {
        lines.push(`- URL: ${d.openIdConnectUrl || ""}`)
      } else if (d.type === "oauth2" && d.oauth2Flows) {
        lines.push("```json")
        lines.push(d.oauth2Flows)
        lines.push("```")
      }
      return lines.join("\n")
    }
    default:
      return ""
  }
}

export function hasSerializedBlockMetadata(markdown: string): boolean {
  return markdown.trimStart().startsWith(serializedBlocksPrefix)
}

function normalizeMarkdownForComparison(markdown: string): string {
  return stripSerializedBlockComments(markdown)
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\s+$/g, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function hasAdvancedMarkdownSyntax(content: string): boolean {
  return /(^|\n)\s*(?:[-*+]\s+|\d+\.\s+|>\s+|!\[.+\]\(.+\)|\[[^\]]+\]\([^)]+\)|#{1,6}\s+|\|.+\||```|<\w+)/m.test(content)
}

export function analyzeVisualEditingSupport(markdown: string): VisualEditingSupportReport {
  const trimmed = markdown.trim()
  if (!trimmed) {
    return {
      fidelity: "compatible",
      hasSerializedMetadata: false,
      roundTripSafe: true,
      rawMarkdownBlockCount: 0,
      details: ["This draft is empty. Add a template or start typing in Markdown."],
    }
  }

  if (hasSerializedBlockMetadata(trimmed)) {
    return {
      fidelity: "structured",
      hasSerializedMetadata: true,
      roundTripSafe: true,
      rawMarkdownBlockCount: 0,
      details: [
        "This page is already stored as structured blocks.",
        "Switching between visual, split, and preview modes will preserve the current layout.",
      ],
    }
  }

  const parsedBlocks = parseMarkdownToBlocks(trimmed)
  const rawMarkdownBlockCount = parsedBlocks.filter((block) => {
    if (block.type !== "text") return false
    return hasAdvancedMarkdownSyntax((block.data as TextData).content)
  }).length

  const roundTripSafe =
    normalizeMarkdownForComparison(trimmed) ===
    normalizeMarkdownForComparison(serializeBlocks(parsedBlocks))

  const details = roundTripSafe
    ? rawMarkdownBlockCount > 0
      ? [
          `Visual mode can open this page, but ${rawMarkdownBlockCount} freeform Markdown section${rawMarkdownBlockCount === 1 ? "" : "s"} will stay as raw content.`,
          "Use text-mode editing inside those sections when you need formatting the visual blocks do not model yet.",
        ]
      : [
          "Current Markdown maps cleanly to Domino blocks.",
          "Visual mode will keep the document structure intact on the next save.",
        ]
    : [
        "Visual mode can open this page, but it will normalize some Markdown into Domino blocks on save.",
        rawMarkdownBlockCount > 0
          ? `${rawMarkdownBlockCount} section${rawMarkdownBlockCount === 1 ? "" : "s"} will remain raw Markdown because they use patterns the structured blocks do not cover yet.`
          : "If you need exact source formatting, stay in Markdown mode for this edit.",
      ]

  return {
    fidelity: roundTripSafe ? "compatible" : "warning",
    hasSerializedMetadata: false,
    roundTripSafe,
    rawMarkdownBlockCount,
    details,
  }
}

export function stripSerializedBlockComments(markdown: string): string {
  return markdown
    .replace(/^\s*<!-- domino:blocks[\s\S]*?-->\s*/i, "")
    .replace(/\s*<!-- domino:block -->\s*/gi, "\n\n")
    .trim()
}

function extractSerializedBlocks(
  markdown: string,
): { metadata: SerializedBlockMeta[]; segments: string[] } | null {
  const trimmed = markdown.trim()
  if (!trimmed.startsWith(serializedBlocksPrefix)) {
    return null
  }

  const commentEnd = trimmed.indexOf("-->")
  if (commentEnd === -1) {
    return null
  }

  const rawMeta = trimmed.slice(serializedBlocksPrefix.length, commentEnd).trim()
  const body = trimmed.slice(commentEnd + 3).trim()
  if (!rawMeta || !body) {
    return null
  }

  try {
    const metadata = JSON.parse(rawMeta) as SerializedBlockMeta[]
    if (!Array.isArray(metadata) || metadata.length === 0) {
      return null
    }

    const segments = body
      .split(serializedBlockDivider)
      .map((segment) => segment.trim())
      .filter(Boolean)

    if (segments.length !== metadata.length) {
      return null
    }

    return { metadata, segments }
  } catch {
    return null
  }
}

// ── Parse Markdown → Blocks (best-effort) ────────────────────────────────────

export function parseMarkdownToBlocks(markdown: string): ContentBlock[] {
  const trimmed = markdown.trim()
  if (!trimmed) return []

  const serialized = extractSerializedBlocks(trimmed)
  if (serialized) {
    const blocks = serialized.metadata.map((meta, index) => {
      const fallback = createDefaultBlock(meta.type)
      const parsedData = parseBlockFromMarkdown(meta.type, serialized.segments[index]) ?? fallback.data
      return normalizeContentBlock({
        id: meta.id || fallback.id,
        type: meta.type,
        data: parsedData,
        appearance: meta.appearance ?? defaultBlockAppearance,
      })
    })

    if (blocks.length > 0) {
      return blocks
    }
  }

  const blocks: ContentBlock[] = []
  const sections = splitIntoSections(stripSerializedBlockComments(trimmed))

  for (let index = 0; index < sections.length; index++) {
    const section = sections[index]
    const nextSection = sections[index + 1]

    if (section.headingText.startsWith("✅") && nextSection?.headingText.startsWith("❌")) {
      const serializedDosDonts = [
        `### ${section.headingText}`,
        section.body.trim(),
        `### ${nextSection.headingText}`,
        nextSection.body.trim(),
      ].filter(Boolean).join("\n\n")
      const fallback = createDefaultBlock("dos_donts")
      blocks.push(
        normalizeContentBlock({
          ...fallback,
          data: parseBlockFromMarkdown("dos_donts", serializedDosDonts) ?? fallback.data,
        }),
      )
      index++
      continue
    }

    const parsed = parseSection(section)
    blocks.push(...parsed)
  }

  return blocks.length > 0 ? blocks.map(normalizeContentBlock) : [createTextContentBlock(trimmed)]
}

interface RawSection {
  headingLevel: number | null
  headingText: string
  body: string
}

function createTextContentBlock(content: string): ContentBlock<"text"> {
  return normalizeContentBlock({
    id: createBlockId(),
    type: "text",
    data: { content },
    appearance: structuredClone(defaultBlockAppearance),
  })
}

function createCodeContentBlock(data: CodeData): ContentBlock<"code"> {
  return normalizeContentBlock({
    id: createBlockId(),
    type: "code",
    data,
    appearance: structuredClone(defaultBlockAppearance),
  })
}

function splitBodyIntoBlocks(body: string): ContentBlock[] {
  const trimmed = body.trim()
  if (!trimmed) return []

  const blocks: ContentBlock[] = []
  const codeBlocks = [...trimmed.matchAll(/```([^\n`]*)\n([\s\S]*?)```/g)]

  if (codeBlocks.length === 0) {
    return [createTextContentBlock(trimmed)]
  }

  let lastIndex = 0
  for (const match of codeBlocks) {
    const start = match.index ?? 0
    const before = trimmed.slice(lastIndex, start).trim()
    if (before) {
      blocks.push(createTextContentBlock(before))
    }

    blocks.push(createCodeContentBlock({
      language: match[1]?.trim() ?? "",
      code: match[2]?.trimEnd() ?? "",
      caption: "",
    }))

    lastIndex = start + match[0].length
  }

  const after = trimmed.slice(lastIndex).trim()
  if (after) {
    blocks.push(createTextContentBlock(after))
  }

  return blocks.length > 0 ? blocks : [createTextContentBlock(trimmed)]
}

export function extractStandaloneCodeBlockData(text: string): CodeData | null {
  const trimmed = text.trim()
  if (!trimmed) return null

  const codeBlocks = [...trimmed.matchAll(/```([^\n`]*)\n([\s\S]*?)```/g)]
  if (codeBlocks.length !== 1) return null

  const match = codeBlocks[0]
  const start = match.index ?? 0
  const prefix = trimmed.slice(0, start).trim()
  const suffix = trimmed.slice(start + match[0].length).trim()

  if (suffix) return null
  if (prefix.includes("\n")) return null

  return {
    language: match[1]?.trim() ?? "",
    code: match[2]?.trimEnd() ?? "",
    caption: prefix,
  }
}

function splitIntoSections(md: string): RawSection[] {
  const lines = md.split("\n")
  const sections: RawSection[] = []
  let current: RawSection = { headingLevel: null, headingText: "", body: "" }

  for (const line of lines) {
    const headingMatch = line.match(/^(#{2,3})\s+(.+)$/)
    if (headingMatch) {
      if (current.headingText || current.body.trim()) {
        sections.push(current)
      }
      current = {
        headingLevel: headingMatch[1].length,
        headingText: headingMatch[2],
        body: "",
      }
    } else {
      current.body += line + "\n"
    }
  }

  if (current.headingText || current.body.trim()) {
    sections.push(current)
  }

  return sections
}

function parseSection(section: RawSection): ContentBlock[] {
  const body = section.body.trim()
  const heading = section.headingText

  // Try REST endpoint: heading like `POST` /v1/path
  if (heading.match(/^`(GET|POST|PUT|DELETE|PATCH)`\s+\S/)) {
    return [parseRestEndpoint(heading, body)]
  }

  // Try GraphQL operation
  if (heading.startsWith("Query") || heading.startsWith("Mutation")) {
    return [parseGraphqlOperation(heading, body)]
  }

  // Try GraphQL schema
  if (heading === "Schema") {
    const codeBlock = extractFirstCodeBlock(body)
    return [normalizeContentBlock({
      id: createBlockId(), type: "graphql_schema",
      data: { code: codeBlock?.code ?? body } as GraphqlSchemaData,
      appearance: structuredClone(defaultBlockAppearance),
    })]
  }

  // Try webhook event: heading like `resource.created`
  if (heading.match(/^`[\w.]+`$/)) {
    return [parseWebhookEvent(heading, body)]
  }

  // Signature Verification
  if (heading.toLowerCase().includes("signature verification")) {
    return [parseWebhookVerify(body)]
  }

  // Retry Policy
  if (heading.toLowerCase().includes("retry")) {
    return [parseWebhookRetry(body)]
  }

  // Guideline steps
  if (heading.toLowerCase().includes("step")) {
    return [parseSteps(heading, body)]
  }

  // Do/Don't
  if (heading.startsWith("✅")) {
    return [parseDosDonts(body, heading)]
  }

  // Callout blockquotes
  if (!heading && body.startsWith(">")) {
    const callout = parseCallout(body)
    if (callout) return [callout]
  }

  // Table
  if (!heading && body.includes("|") && body.includes("---")) {
    const table = parseTable(body)
    if (table) return [table]
  }

  if (!heading) {
    const standaloneCode = extractStandaloneCodeBlockData(body)
    if (standaloneCode) {
      return [createCodeContentBlock(standaloneCode)]
    }
  }

  // Heading + body → heading block + text block
  const result: ContentBlock[] = []
  if (heading && section.headingLevel) {
    // Check if the body is a simple description or complex content
    const hasCodeBlock = body.includes("```")
    const hasTable = body.includes("|") && body.includes("---")

    if (!hasCodeBlock && !hasTable) {
      result.push(normalizeContentBlock({
        id: createBlockId(), type: "heading",
        data: { level: section.headingLevel as 2 | 3, text: heading, description: body } as HeadingData,
        appearance: structuredClone(defaultBlockAppearance),
      }))
    } else {
      result.push(normalizeContentBlock({
        id: createBlockId(), type: "heading",
        data: { level: section.headingLevel as 2 | 3, text: heading, description: "" } as HeadingData,
        appearance: structuredClone(defaultBlockAppearance),
      }))
      result.push(...splitBodyIntoBlocks(body))
    }
  } else if (body) {
    result.push(...splitBodyIntoBlocks(body))
  }

  return result
}

function extractFirstCodeBlock(text: string): { language: string; code: string } | null {
  const match = text.match(/```([^\n`]*)\n([\s\S]*?)```/)
  if (!match) return null
  return { language: match[1].trim(), code: match[2].trimEnd() }
}

function parseRestEndpoint(heading: string, body: string): ContentBlock {
  const methodMatch = heading.match(/^`(\w+)`\s+(.+)$/)
  const method = methodMatch?.[1] ?? "GET"
  const path = methodMatch?.[2] ?? "/"

  let description = ""
  const descMatch = body.match(/\*\*Description:\*\*\s*(.+)/)
  if (descMatch) description = descMatch[1].trim()

  const headers: { key: string; value: string }[] = []
  const headerTableMatch = body.match(/\*\*Headers:\*\*\n\|[^\n]+\n\|[^\n]+\n([\s\S]*?)(?=\n\n|\*\*|$)/)
  if (headerTableMatch) {
    const rows = headerTableMatch[1].trim().split("\n")
    for (const row of rows) {
      const cells = row.split("|").map((c) => c.trim()).filter(Boolean)
      if (cells.length >= 2) headers.push({ key: cells[0], value: cells[1] })
    }
  }

  const codeBlocks = [...body.matchAll(/```([^\n`]*)\n([\s\S]*?)```/g)]
  const requestBody = codeBlocks[0]?.[ 2]?.trimEnd() ?? ""
  const responseBody = codeBlocks[1]?.[ 2]?.trimEnd() ?? ""

  const statusMatch = body.match(/\*\*Response\*\*\s*`([^`]+)`/)
  const responseStatus = statusMatch?.[1] ?? "200 OK"

  return normalizeContentBlock({
    id: createBlockId(), type: "rest_endpoint",
    data: { method, path, description, headers, requestBody, responseBody, responseStatus } as RestEndpointData,
    appearance: structuredClone(defaultBlockAppearance),
  })
}

function parseGraphqlOperation(heading: string, body: string): ContentBlock {
  const isQuery = heading.toLowerCase().startsWith("query")
  const nameParts = heading.split("—").map((s) => s.trim())
  const name = nameParts[1] ?? ""

  const codeBlocks = [...body.matchAll(/```([^\n`]*)\n([\s\S]*?)```/g)]
  const gqlBlock = codeBlocks.find((m) => m[1] === "graphql" || m[1] === "gql")
  const varsBlock = codeBlocks.find((m) => m[1] === "json")

  const descLines = body.split("\n").filter((l) => !l.startsWith("```") && !l.startsWith("**") && l.trim())
  const description = descLines[0] ?? ""

  return normalizeContentBlock({
    id: createBlockId(), type: "graphql_operation",
    data: {
      operationType: isQuery ? "query" : "mutation",
      name,
      description,
      code: gqlBlock?.[2]?.trimEnd() ?? "",
      variables: varsBlock?.[2]?.trimEnd() ?? "",
    } as GraphqlOperationData,
    appearance: structuredClone(defaultBlockAppearance),
  })
}

function parseWebhookEvent(heading: string, body: string): ContentBlock {
  const eventName = heading.replace(/`/g, "")
  const lines = body.split("\n")
  const descLine = lines.find((l) => l.trim() && !l.startsWith("```") && !l.startsWith("**"))
  const cb = extractFirstCodeBlock(body)

  return normalizeContentBlock({
    id: createBlockId(), type: "webhook_event",
    data: {
      eventName,
      description: descLine?.trim() ?? "",
      payload: cb?.code ?? "",
    } as WebhookEventData,
    appearance: structuredClone(defaultBlockAppearance),
  })
}

function parseWebhookVerify(body: string): ContentBlock {
  const cb = extractFirstCodeBlock(body)
  const descLines = body.split("```")[0].trim()

  return normalizeContentBlock({
    id: createBlockId(), type: "webhook_verify",
    data: {
      description: descLines,
      language: cb?.language ?? "javascript",
      code: cb?.code ?? "",
    } as WebhookVerifyData,
    appearance: structuredClone(defaultBlockAppearance),
  })
}

function parseWebhookRetry(body: string): ContentBlock {
  const rows: { attempt: string; delay: string }[] = []
  const tableMatch = body.match(/\|[^\n]+\n\|[^\n]+\n([\s\S]*?)(?=\n\n|$)/)
  if (tableMatch) {
    for (const line of tableMatch[1].trim().split("\n")) {
      const cells = line.split("|").map((c) => c.trim()).filter(Boolean)
      if (cells.length >= 2) rows.push({ attempt: cells[0], delay: cells[1] })
    }
  }

  const desc = body.split("|")[0].trim()

  return normalizeContentBlock({
    id: createBlockId(), type: "webhook_retry",
    data: { description: desc, rows } as WebhookRetryData,
    appearance: structuredClone(defaultBlockAppearance),
  })
}

function parseSteps(heading: string, body: string): ContentBlock {
  const steps: { label: string; description: string }[] = []
  const stepMatches = [...body.matchAll(/\d+\.\s+\*\*(.+?)\*\*\s*[—–-]\s*(.+)/g)]

  if (stepMatches.length > 0) {
    for (const m of stepMatches) steps.push({ label: m[1], description: m[2] })
  } else {
    const numbered = [...body.matchAll(/\d+\.\s+(.+)/g)]
    for (const m of numbered) steps.push({ label: m[1], description: "" })
  }

  return normalizeContentBlock({
    id: createBlockId(), type: "steps",
    data: { title: heading, steps } as StepsData,
    appearance: structuredClone(defaultBlockAppearance),
  })
}

function parseDosDonts(body: string, heading: string): ContentBlock {
  const dos: string[] = []
  const donts: string[] = []

  const fullText = `${heading}\n\n${body}`
  const dontSection = fullText.split(/###\s*❌/)[1]
  const doSection = fullText.split(/###\s*❌/)[0]

  if (doSection) {
    for (const m of doSection.matchAll(/^-\s+(.+)$/gm)) dos.push(m[1])
  }
  if (dontSection) {
    for (const m of dontSection.matchAll(/^-\s+(.+)$/gm)) donts.push(m[1])
  }

  return normalizeContentBlock({
    id: createBlockId(), type: "dos_donts",
    data: { dos, donts } as DosDontsData,
    appearance: structuredClone(defaultBlockAppearance),
  })
}

function parseCallout(body: string): ContentBlock | null {
  const match = body.match(/>\s*\*\*([💡⚠️ℹ️]+)\s*(Tip|Warning|Note):\*\*\s*(.+)/)
  if (!match) return null

  const variantMap: Record<string, "tip" | "warning" | "info"> = {
    Tip: "tip", Warning: "warning", Note: "info",
  }

  return normalizeContentBlock({
    id: createBlockId(), type: "callout",
    data: { variant: variantMap[match[2]] ?? "info", text: match[3].trim() } as CalloutData,
    appearance: structuredClone(defaultBlockAppearance),
  })
}

function parseTable(body: string): ContentBlock | null {
  const lines = body.trim().split("\n").filter((l) => l.includes("|"))
  if (lines.length < 2) return null

  const parseRow = (line: string) => line.split("|").map((c) => c.trim()).filter(Boolean)

  const headers = parseRow(lines[0])
  const rows = lines.slice(2).map(parseRow)

  return normalizeContentBlock({
    id: createBlockId(), type: "table",
    data: { headers, rows } as TableData,
    appearance: structuredClone(defaultBlockAppearance),
  })
}

// ── Parse single block from markdown text ────────────────────────────────────

export function parseBlockFromMarkdown<T extends BlockType>(
  type: T,
  markdown: string,
): BlockDataMap[T] | null {
  const trimmed = markdown.trim()
  if (!trimmed) return null

  try {
    switch (type) {
      case "heading": {
        const headingMatch = trimmed.match(/^(#{2,3})\s+(.+?)(?:\n+([\s\S]*))?$/)
        if (!headingMatch) return null
        return {
          level: headingMatch[1].length as 2 | 3,
          text: headingMatch[2].trim(),
          description: headingMatch[3]?.trim() ?? "",
        } as BlockDataMap[T]
      }
      case "text":
        return { content: trimmed } as BlockDataMap[T]
      case "code": {
        const standalone = extractStandaloneCodeBlockData(trimmed)
        if (standalone) {
          return standalone as BlockDataMap[T]
        }
        const codeBlock = extractFirstCodeBlock(trimmed)
        return {
          language: codeBlock?.language ?? "",
          code: codeBlock?.code ?? trimmed,
          caption: "",
        } as BlockDataMap[T]
      }
      case "table": {
        const table = parseTable(trimmed)
        return (table?.data as BlockDataMap[T]) ?? null
      }
      case "callout": {
        const callout = parseCallout(trimmed)
        return (callout?.data as BlockDataMap[T]) ?? null
      }
      case "image": {
        const imageMatch = trimmed.match(/!\[(.*?)\]\((.*?)\)/)
        if (!imageMatch) return null
        const captionMatch = trimmed.match(/\n\s*\*(.+)\*\s*$/)
        return {
          alt: imageMatch[1],
          src: imageMatch[2],
          caption: captionMatch?.[1] ?? "",
        } as BlockDataMap[T]
      }
      case "rest_endpoint": {
        const lines = trimmed.split("\n")
        const headingLine = lines.find((l) => l.match(/^#{2,3}\s+`(GET|POST|PUT|DELETE|PATCH)`/))
        const heading = headingLine?.replace(/^#{2,3}\s+/, "") ?? ""
        const body = headingLine
          ? trimmed.slice(trimmed.indexOf("\n", trimmed.indexOf(headingLine)) + 1)
          : trimmed
        return parseRestEndpoint(heading, body).data as BlockDataMap[T]
      }
      case "graphql_operation": {
        const lines = trimmed.split("\n")
        const headingLine = lines.find((l) => l.match(/^#{2,3}\s+(Query|Mutation)/))
        const heading = headingLine?.replace(/^#{2,3}\s+/, "") ?? "Query"
        const body = headingLine
          ? trimmed.slice(trimmed.indexOf("\n", trimmed.indexOf(headingLine)) + 1)
          : trimmed
        return parseGraphqlOperation(heading, body).data as BlockDataMap[T]
      }
      case "graphql_schema": {
        const cb = extractFirstCodeBlock(trimmed)
        return { code: cb?.code ?? trimmed } as BlockDataMap[T]
      }
      case "webhook_event": {
        const lines = trimmed.split("\n")
        const headingLine = lines.find((l) => l.match(/^#{2,3}\s+`[\w.]+`/))
        const heading = headingLine?.replace(/^#{2,3}\s+/, "") ?? "`event`"
        const body = headingLine
          ? trimmed.slice(trimmed.indexOf("\n", trimmed.indexOf(headingLine)) + 1)
          : trimmed
        return parseWebhookEvent(heading, body).data as BlockDataMap[T]
      }
      case "webhook_verify": {
        const body = trimmed.replace(/^#{2,3}\s+.*\n/, "")
        return parseWebhookVerify(body).data as BlockDataMap[T]
      }
      case "webhook_retry": {
        const body = trimmed.replace(/^#{2,3}\s+.*\n/, "")
        return parseWebhookRetry(body).data as BlockDataMap[T]
      }
      case "steps": {
        const lines = trimmed.split("\n")
        const headingLine = lines.find((line) => line.match(/^#{2,3}\s+/))
        const heading = headingLine?.replace(/^#{2,3}\s+/, "") ?? "Steps"
        const body = headingLine
          ? trimmed.slice(trimmed.indexOf("\n", trimmed.indexOf(headingLine)) + 1)
          : trimmed
        return parseSteps(heading, body).data as BlockDataMap[T]
      }
      case "dos_donts": {
        const splitIndex = trimmed.search(/^###\s*❌/m)
        const dos = [...trimmed.matchAll(/^-\s+(.+)$/gm)]
          .map((match) => {
            const startIndex = match.index ?? 0
            return splitIndex === -1 || startIndex < splitIndex ? match[1] : null
          })
          .filter((item): item is string => Boolean(item))
        const dontSection = trimmed.split(/^###\s*❌.*$/m)[1] ?? ""
        const donts = [...dontSection.matchAll(/^-\s+(.+)$/gm)].map((match) => match[1])
        return { dos, donts } as BlockDataMap[T]
      }
      case "param_table": {
        const headingMatch = trimmed.match(/^#{2,3}\s+(.+)$/m)
        const variantMap: Record<string, ParamTableData["variant"]> = {
          "Query Parameters": "query",
          "Path Parameters": "path",
          Headers: "header",
          Cookies: "cookie",
        }
        const variant = variantMap[headingMatch?.[1] ?? ""] ?? "query"
        const params: ParamTableData["params"] = []
        const tableLines = trimmed
          .split("\n")
          .filter((line) => line.startsWith("|") && !line.includes("---") && !line.includes("Name | Type"))
        for (const line of tableLines) {
          const cols = line.split("|").map((col) => col.trim()).filter(Boolean)
          if (cols.length >= 4) {
            params.push({
              name: cols[0].replace(/`/g, ""),
              type: cols[1],
              required: cols[2] === "✅",
              description: cols[3],
            })
          }
        }
        return { variant, params } as BlockDataMap[T]
      }
      case "auth_config": {
        const typeMatch = trimmed.match(/^###\s+Authentication\s+—\s+(.+)$/m)
        const typeMap: Record<string, AuthConfigData["authType"]> = {
          None: "none",
          "API Key": "api-key",
          "Bearer Token": "bearer",
          "Basic Auth": "basic",
          "OAuth 2.0": "oauth2",
        }
        const authType = typeMap[typeMatch?.[1]?.trim() ?? ""] ?? "none"
        const locationMatch = trimmed.match(/\*\*Location:\*\*\s+(Query Parameter|Header)/)?.[1]
        const description = trimmed
          .split("\n")
          .filter((line) => line.trim() && !line.startsWith("#") && !line.startsWith("- **"))
          .join("\n")
          .trim()
        const scopesMatch = trimmed.match(/\*\*Scopes:\*\*\s+(.+)/)
        return {
          authType,
          description,
          apiKeyName: trimmed.match(/\*\*Key Name:\*\*\s+`([^`]+)`/)?.[1],
          apiKeyIn: locationMatch ? (locationMatch === "Query Parameter" ? "query" : "header") : undefined,
          bearerFormat: trimmed.match(/\*\*Format:\*\*\s+(.+)/)?.[1]?.trim(),
          oauth2Flow: (() => {
            const flow = trimmed.match(/\*\*Flow:\*\*\s+(.+)/)?.[1]?.trim()
            if (flow === "Client Credentials") return "client_credentials"
            if (flow === "Authorization Code") return "authorization_code"
            if (flow === "Implicit") return "implicit"
            return undefined
          })(),
          oauth2TokenUrl: trimmed.match(/\*\*Token URL:\*\*\s+`([^`]+)`/)?.[1],
          oauth2AuthUrl: trimmed.match(/\*\*Authorization URL:\*\*\s+`([^`]+)`/)?.[1],
          oauth2Scopes: scopesMatch?.[1]
            ?.split(",")
            .map((scope) => scope.replace(/`/g, "").trim())
            .filter(Boolean),
        } as BlockDataMap[T]
      }
      case "error_responses": {
        const responses: ErrorResponsesData["responses"] = []
        const regex = /####\s+`(\d+)`\s+(.+?)(?:\n+```json\n([\s\S]*?)```)?(?=\n####|\s*$)/g
        for (const match of trimmed.matchAll(regex)) {
          responses.push({
            statusCode: Number(match[1]),
            description: match[2].trim(),
            body: match[3]?.trim(),
          })
        }
        return { responses } as BlockDataMap[T]
      }
      case "field_table": {
        const headingMatch = trimmed.match(/^#{2,3}\s+(.+)$/m)
        const fields: FieldTableData["fields"] = []
        const tableLines = trimmed
          .split("\n")
          .filter((line) => line.startsWith("|") && !line.includes("---") && !line.includes("Path | Type"))
        for (const line of tableLines) {
          const cols = line.split("|").map((col) => col.trim()).filter(Boolean)
          if (cols.length >= 5) {
            fields.push({
              path: cols[0].replace(/`/g, ""),
              type: cols[1],
              required: cols[2] === "✅",
              description: cols[3],
              example: cols[4] === "—" ? "" : cols[4],
            })
          }
        }
        return {
          title: headingMatch?.[1] ?? "",
          fields,
          exampleJson: extractFirstCodeBlock(trimmed)?.code ?? "",
        } as BlockDataMap[T]
      }
      case "server_config": {
        const servers: ServerConfigData["servers"] = []
        const serverBlocks = trimmed.split(/^###\s+/m).filter(Boolean)
        for (const sb of serverBlocks) {
          const urlMatch = sb.match(/`(https?:\/\/[^`]+)`/)
          const descLine = sb.split("\n")[0]?.trim() || ""
          if (urlMatch) {
            servers.push({ url: urlMatch[1], description: descLine.replace(/^#+\s*/, ""), variables: [] })
          }
        }
        if (servers.length === 0) servers.push({ url: "https://api.example.com", description: "Server", variables: [] })
        return { servers } as BlockDataMap[T]
      }
      case "schema_model": {
        const nameMatch = trimmed.match(/^##\s+📦\s+(.+)/m)
        const name = nameMatch?.[1] || "Model"
        const properties: SchemaModelData["properties"] = []
        const tableLines = trimmed.split("\n").filter(l => l.startsWith("|") && !l.includes("---") && !l.includes("Property"))
        for (const line of tableLines) {
          const cols = line.split("|").map(c => c.trim()).filter(Boolean)
          if (cols.length >= 5) {
            properties.push({
              name: cols[0].replace(/`/g, ""),
              type: cols[1],
              required: cols[2] === "✅",
              example: cols[3] === "—" ? "" : cols[3],
              description: cols[4],
            })
          }
        }
        return { name, description: "", properties } as BlockDataMap[T]
      }
      case "rate_limit": {
        const limits: RateLimitData["limits"] = []
        const tableLines = trimmed.split("\n").filter(l => l.startsWith("|") && !l.includes("---") && !l.includes("Name"))
        for (const line of tableLines) {
          const cols = line.split("|").map(c => c.trim()).filter(Boolean)
          if (cols.length >= 4 && !cols[0].startsWith("Header")) {
            limits.push({ name: cols[0], limit: parseInt(cols[1]) || 100, window: cols[2], description: cols[3] })
          }
        }
        return { description: "", limits, headers: { limit: "X-RateLimit-Limit", remaining: "X-RateLimit-Remaining", reset: "X-RateLimit-Reset" } } as BlockDataMap[T]
      }
      case "pagination_config": {
        const styleMatch = trimmed.match(/分页\s*\((\w+)\)/)
        const style = (styleMatch?.[1] as PaginationConfigData["style"]) || "offset"
        return { style, description: "", parameters: [], responseFields: [] } as unknown as BlockDataMap[T]
      }
      case "response_headers": {
        const headers: ResponseHeadersData["headers"] = []
        const tableLines = trimmed.split("\n").filter(l => l.startsWith("|") && !l.includes("---") && !l.includes("Header"))
        for (const line of tableLines) {
          const cols = line.split("|").map(c => c.trim()).filter(Boolean)
          if (cols.length >= 5) {
            headers.push({
              name: cols[0].replace(/`/g, ""),
              type: cols[1],
              required: cols[2] === "✅",
              example: cols[3] === "—" ? "" : cols[3],
              description: cols[4],
            })
          }
        }
        return { headers } as BlockDataMap[T]
      }
      case "security_scheme": {
        const nameMatch = trimmed.match(/^##\s+🔐\s+(.+)/m)
        const typeMatch = trimmed.match(/\*\*Type:\*\*\s+(\w+)/)
        return {
          name: nameMatch?.[1] || "Auth",
          type: (typeMatch?.[1] as SecuritySchemeData["type"]) || "http",
          description: "",
          scheme: "bearer",
          bearerFormat: "JWT",
        } as BlockDataMap[T]
      }
      default:
        return null
    }
  } catch {
    return null
  }
}
