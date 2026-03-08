import { z } from "zod"

export const httpMethods = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"] as const
export const apiStatuses = ["draft", "published"] as const
export const viewModes = [
  "content-library",
  "settings",
  "docs-manage",
  "doc-editor",
  "doc-portal",
  "audit-log",
  "glossary",
] as const
export const apiFieldTypes = [
  "string",
  "number",
  "integer",
  "float",
  "boolean",
  "object",
  "array",
  "null",
  "date",
  "datetime",
  "email",
  "uuid",
  "url",
  "enum",
  "file",
  "binary",
] as const
export const contentTypes = [
  "application/json",
  "multipart/form-data",
  "application/x-www-form-urlencoded",
  "application/xml",
  "text/plain",
  "application/octet-stream",
] as const
export const authTypes = ["none", "api-key", "bearer", "basic", "oauth2", "openid-connect"] as const
export const semanticVersionPattern = /^v?(\d+)\.(\d+)\.(\d+)$/
export const slugPattern = /^[a-z0-9-]+$/

export type HttpMethod = (typeof httpMethods)[number]
export type ApiStatus = (typeof apiStatuses)[number]
export type ViewMode = (typeof viewModes)[number]
export type ApiFieldType = (typeof apiFieldTypes)[number]
export type ContentType = (typeof contentTypes)[number]
export type AuthType = (typeof authTypes)[number]

export function isDetailView(view: ViewMode) {
  return view === "doc-editor" || view === "doc-portal"
}

export interface ApiHeader {
  key: string
  value: string
}

export interface ApiQueryParam {
  key: string
  type: string
  required: boolean
  description: string
}

export interface ApiPathParam {
  key: string
  type: string
  required: boolean
  description: string
}

export interface ApiCookie {
  key: string
  value: string
  description: string
}

export interface ApiAuth {
  type: AuthType
  apiKeyName?: string
  apiKeyIn?: "header" | "query"
  bearerFormat?: string
  oauth2Flow?: "client_credentials" | "authorization_code" | "implicit"
  oauth2TokenUrl?: string
  oauth2AuthUrl?: string
  oauth2Scopes?: string[]
  openIdConnectUrl?: string
}

// ── Server & Environment ─────────────────────────────────────────────────────

export interface ServerVariable {
  default: string
  enum?: string[]
  description: string
}

export interface ApiServer {
  url: string
  description: string
  variables: Record<string, ServerVariable>
}

// ── API Info / Metadata ──────────────────────────────────────────────────────

export interface ApiContact {
  name: string
  url: string
  email: string
}

export interface ApiLicense {
  name: string
  identifier: string
  url: string
}

export interface ApiExternalDoc {
  url: string
  description: string
}

export interface ApiInfo {
  summary: string
  termsOfService: string
  contact: ApiContact
  license: ApiLicense
  externalDocs: ApiExternalDoc
}

// ── Field Validation Constraints ─────────────────────────────────────────────

export interface FieldConstraints {
  format?: string
  default?: string
  enumValues?: string[]
  minimum?: number
  maximum?: number
  minLength?: number
  maxLength?: number
  pattern?: string
  minItems?: number
  maxItems?: number
  uniqueItems?: boolean
  nullable?: boolean
}

// ── Response Headers ─────────────────────────────────────────────────────────

export interface ApiResponseHeader {
  id: string
  name: string
  type: ApiFieldType
  required: boolean
  description: string
  example?: string
}

// ── Reusable Schema / Model ──────────────────────────────────────────────────

export interface ApiSchemaProperty {
  name: string
  type: ApiFieldType
  required: boolean
  description: string
  example?: string
  constraints?: FieldConstraints
  ref?: string
}

export interface ApiSchema {
  id: string
  name: string
  description: string
  properties: ApiSchemaProperty[]
  composition?: {
    type: "allOf" | "oneOf" | "anyOf"
    refs: string[]
  }
  discriminator?: {
    propertyName: string
    mapping: Record<string, string>
  }
}

// ── Security Scheme ──────────────────────────────────────────────────────────

export interface SecurityScheme {
  id: string
  name: string
  type: "apiKey" | "http" | "oauth2" | "openIdConnect"
  description: string
  // apiKey
  apiKeyIn?: "header" | "query" | "cookie"
  apiKeyName?: string
  // http
  scheme?: string
  bearerFormat?: string
  // oauth2
  oauth2Flows?: {
    implicit?: { authorizationUrl: string; scopes: Record<string, string> }
    authorizationCode?: { authorizationUrl: string; tokenUrl: string; scopes: Record<string, string> }
    clientCredentials?: { tokenUrl: string; scopes: Record<string, string> }
    password?: { tokenUrl: string; scopes: Record<string, string> }
  }
  // openIdConnect
  openIdConnectUrl?: string
}

// ── Rate Limiting ────────────────────────────────────────────────────────────

export interface RateLimitConfig {
  enabled: boolean
  description: string
  limits: {
    id: string
    name: string
    limit: number
    window: string
    description: string
  }[]
  headers: {
    limit: string
    remaining: string
    reset: string
  }
}

// ── Pagination ───────────────────────────────────────────────────────────────

export interface PaginationConfig {
  style: "offset" | "cursor" | "page" | "none"
  description: string
  parameters: {
    name: string
    type: string
    required: boolean
    default?: string
    description: string
  }[]
  responseFields: {
    name: string
    type: string
    description: string
  }[]
}

// ── Links & Callbacks ────────────────────────────────────────────────────────

export interface ApiLink {
  id: string
  name: string
  operationId: string
  description: string
  parameters: Record<string, string>
}

export interface ApiCallback {
  id: string
  name: string
  url: string
  method: HttpMethod
  description: string
  requestBody?: string
  responseBody?: string
}

// ── Tag with metadata ────────────────────────────────────────────────────────

export interface ApiTagMeta {
  name: string
  description: string
  externalDocs?: ApiExternalDoc
}

export interface ApiFieldDescription {
  id: string
  path: string
  type: ApiFieldType
  required: boolean
  description: string
  example?: string
  deprecated?: boolean
  constraints?: FieldConstraints
  ref?: string
}

export interface ApiErrorResponse {
  id: string
  statusCode: number
  description: string
  body?: string
  fields: ApiFieldDescription[]
}

export interface ApiReleaseSnapshot {
  name: string
  version: string
  status: ApiStatus
  method: HttpMethod
  path: string
  description: string
  contentType: ContentType
  operationId?: string
  summary?: string
  servers: ApiServer[]
  info?: ApiInfo
  requestBody?: string
  requestFields: ApiFieldDescription[]
  responseBody?: string
  responseFields: ApiFieldDescription[]
  responseHeaders: ApiResponseHeader[]
  errorResponses: ApiErrorResponse[]
  headers: ApiHeader[]
  queryParams: ApiQueryParam[]
  pathParams: ApiPathParam[]
  cookies: ApiCookie[]
  auth: ApiAuth
  securitySchemes: SecurityScheme[]
  schemas: ApiSchema[]
  rateLimiting?: RateLimitConfig
  pagination?: PaginationConfig
  links: ApiLink[]
  callbacks: ApiCallback[]
  tags: string[]
  tagsMeta: ApiTagMeta[]
  deprecatedAt?: string
  sunsetDate?: string
  replacementApiPath?: string
  externalDocs?: ApiExternalDoc
}

export interface ApiRelease {
  id: string
  apiId: string
  version: string
  changelog: string
  notifySubscribers: boolean
  apiSnapshot?: ApiReleaseSnapshot
  publishedAt: string
}

export const releaseBundleStatuses = ["draft", "scheduled", "published", "rolled_back", "cancelled"] as const
export const snippetScopes = ["global", "product"] as const

export type ReleaseBundleStatus = (typeof releaseBundleStatuses)[number]
export type SnippetScope = (typeof snippetScopes)[number]

export interface ApiItem {
  id: string
  name: string
  version: string
  status: ApiStatus
  method: HttpMethod
  path: string
  description: string
  contentType: ContentType
  // Operation metadata
  operationId?: string
  summary?: string
  // Server configuration
  servers: ApiServer[]
  // API Info / metadata
  info?: ApiInfo
  // Request / Response
  requestBody?: string
  requestFields: ApiFieldDescription[]
  responseBody?: string
  responseFields: ApiFieldDescription[]
  responseHeaders: ApiResponseHeader[]
  errorResponses: ApiErrorResponse[]
  // Parameters
  headers: ApiHeader[]
  queryParams: ApiQueryParam[]
  pathParams: ApiPathParam[]
  cookies: ApiCookie[]
  // Auth
  auth: ApiAuth
  securitySchemes: SecurityScheme[]
  // Schemas / Models
  schemas: ApiSchema[]
  // Rate limiting & pagination
  rateLimiting?: RateLimitConfig
  pagination?: PaginationConfig
  // Links & Callbacks
  links: ApiLink[]
  callbacks: ApiCallback[]
  // Tags
  tags: string[]
  tagsMeta: ApiTagMeta[]
  // Deprecation
  deprecatedAt?: string
  sunsetDate?: string
  replacementApiPath?: string
  // External docs
  externalDocs?: ApiExternalDoc
  // Release
  releaseHistory: ApiRelease[]
}

const requiredText = z.string().trim().min(1)
const optionalText = z
  .string()
  .optional()
  .nullable()
  .transform((value) => {
    const normalized = value?.trim()
    return normalized && normalized.length > 0 ? normalized : undefined
  })
const versionText = z
  .string()
  .trim()
  .regex(semanticVersionPattern, "Version must use semantic versioning like v1.0.0.")
const pathText = z
  .string()
  .trim()
  .min(1)
  .startsWith("/", { message: "Path must start with /." })
const publishNoteText = z.string().trim().min(1, "Add release notes before publishing.")
const optionalDateTimeText = optionalText.superRefine((value, ctx) => {
  if (!value) {
    return
  }

  const timestamp = Date.parse(value)
  if (Number.isNaN(timestamp)) {
    ctx.addIssue({
      code: "custom",
      message: "Enter a valid schedule time.",
    })
  }
})

function optionalJsonExample(label: string) {
  return optionalText.superRefine((value, ctx) => {
    if (!value) {
      return
    }

    try {
      JSON.parse(value)
    } catch {
      ctx.addIssue({
        code: "custom",
        message: `${label} must be valid JSON.`,
      })
    }
  })
}

export const apiHeaderSchema = z.object({
  key: requiredText,
  value: requiredText,
})

export const apiQueryParamSchema = z.object({
  key: requiredText,
  type: requiredText,
  required: z.boolean(),
  description: z.string().trim().default(""),
})

export const apiPathParamSchema = z.object({
  key: requiredText,
  type: z.string().trim().default("string"),
  required: z.boolean().default(true),
  description: z.string().trim().default(""),
})

export const apiCookieSchema = z.object({
  key: requiredText,
  value: requiredText,
  description: z.string().trim().default(""),
})

export const apiAuthSchema = z.object({
  type: z.enum(authTypes).default("none"),
  apiKeyName: optionalText,
  apiKeyIn: z.enum(["header", "query"]).optional(),
  bearerFormat: optionalText,
  oauth2Flow: z.enum(["client_credentials", "authorization_code", "implicit"]).optional(),
  oauth2TokenUrl: optionalText,
  oauth2AuthUrl: optionalText,
  oauth2Scopes: z.array(z.string()).optional(),
  openIdConnectUrl: optionalText,
})

export const fieldConstraintsSchema = z.object({
  format: optionalText,
  default: optionalText,
  enumValues: z.array(z.string()).optional(),
  minimum: z.number().optional(),
  maximum: z.number().optional(),
  minLength: z.number().int().optional(),
  maxLength: z.number().int().optional(),
  pattern: optionalText,
  minItems: z.number().int().optional(),
  maxItems: z.number().int().optional(),
  uniqueItems: z.boolean().optional(),
  nullable: z.boolean().optional(),
}).optional()

export const apiFieldDescriptionSchema = z
  .object({
    id: requiredText,
    path: requiredText,
    type: z.enum(apiFieldTypes),
    required: z.boolean(),
    description: z.string().trim().default(""),
    example: optionalText,
    deprecated: z.boolean().optional(),
    constraints: fieldConstraintsSchema,
    ref: optionalText,
  })
  .transform((field) => ({
    ...field,
    id: field.id.trim(),
    path: field.path.trim(),
    description: field.description.trim(),
  }))

export const apiErrorResponseSchema = z.object({
  id: requiredText,
  statusCode: z.number().int().min(100).max(599),
  description: z.string().trim().default(""),
  body: optionalJsonExample("Error response body"),
  fields: z.array(apiFieldDescriptionSchema).default([]),
})

export const apiWriteSchema = z
  .object({
    name: requiredText,
    version: versionText,
    status: z.enum(apiStatuses),
    method: z.enum(httpMethods),
    path: pathText,
    description: requiredText,
    contentType: z.enum(contentTypes).default("application/json"),
    operationId: optionalText,
    summary: optionalText,
    servers: z.array(z.object({
      url: z.string().trim(),
      description: z.string().trim().default(""),
      variables: z.record(z.object({
        default: z.string(),
        enum: z.array(z.string()).optional(),
        description: z.string().default(""),
      })).default({}),
    })).default([]),
    info: z.object({
      summary: z.string().trim().default(""),
      termsOfService: z.string().trim().default(""),
      contact: z.object({
        name: z.string().trim().default(""),
        url: z.string().trim().default(""),
        email: z.string().trim().default(""),
      }).default({ name: "", url: "", email: "" }),
      license: z.object({
        name: z.string().trim().default(""),
        identifier: z.string().trim().default(""),
        url: z.string().trim().default(""),
      }).default({ name: "", identifier: "", url: "" }),
      externalDocs: z.object({
        url: z.string().trim().default(""),
        description: z.string().trim().default(""),
      }).default({ url: "", description: "" }),
    }).optional(),
    requestBody: optionalJsonExample("Request body"),
    requestFields: z.array(apiFieldDescriptionSchema).default([]),
    responseBody: optionalJsonExample("Response body"),
    responseFields: z.array(apiFieldDescriptionSchema).default([]),
    responseHeaders: z.array(z.object({
      id: requiredText,
      name: requiredText,
      type: z.enum(apiFieldTypes).default("string"),
      required: z.boolean().default(false),
      description: z.string().trim().default(""),
      example: optionalText,
    })).default([]),
    errorResponses: z.array(apiErrorResponseSchema).default([]),
    headers: z.array(apiHeaderSchema).default([]),
    queryParams: z.array(apiQueryParamSchema).default([]),
    pathParams: z.array(apiPathParamSchema).default([]),
    cookies: z.array(apiCookieSchema).default([]),
    auth: apiAuthSchema.default({ type: "none" }),
    securitySchemes: z.array(z.any()).default([]),
    schemas: z.array(z.any()).default([]),
    rateLimiting: z.any().optional(),
    pagination: z.any().optional(),
    links: z.array(z.any()).default([]),
    callbacks: z.array(z.any()).default([]),
    tags: z.array(z.string().trim()).default([]),
    tagsMeta: z.array(z.any()).default([]),
    externalDocs: z.object({
      url: z.string().trim().default(""),
      description: z.string().trim().default(""),
    }).optional(),
    deprecatedAt: optionalText,
    sunsetDate: optionalText,
    replacementApiPath: optionalText,
  })
  .transform((input) => ({
    ...input,
    requestFields: input.requestFields.map((field) => ({
      ...field,
      path: field.path.trim(),
      description: field.description.trim(),
    })),
    responseFields: input.responseFields.map((field) => ({
      ...field,
      path: field.path.trim(),
      description: field.description.trim(),
    })),
    headers: input.headers.map((header) => ({
      key: header.key.trim(),
      value: header.value.trim(),
    })),
    queryParams: input.queryParams.map((param) => ({
      ...param,
      key: param.key.trim(),
      type: param.type.trim(),
      description: param.description.trim(),
    })),
    pathParams: input.pathParams.map((param) => ({
      ...param,
      key: param.key.trim(),
      type: param.type.trim(),
      description: param.description.trim(),
    })),
    cookies: input.cookies.map((cookie) => ({
      ...cookie,
      key: cookie.key.trim(),
      value: cookie.value.trim(),
      description: cookie.description.trim(),
    })),
    tags: input.tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0),
  }))

export const apiPublishSchema = z.object({
  version: versionText,
  changelog: publishNoteText,
  notifySubscribers: z.boolean().default(true),
  scheduledFor: optionalDateTimeText,
})

export type ApiWriteInput = z.output<typeof apiWriteSchema>
export type ApiPublishInput = z.output<typeof apiPublishSchema>

export function toApiWriteInput(api: ApiItem): ApiWriteInput {
  return apiWriteSchema.parse({
    name: api.name,
    version: api.version,
    status: api.status,
    method: api.method,
    path: api.path,
    description: api.description,
    contentType: api.contentType,
    operationId: api.operationId,
    summary: api.summary,
    servers: api.servers,
    info: api.info,
    requestBody: api.requestBody,
    requestFields: api.requestFields,
    responseBody: api.responseBody,
    responseFields: api.responseFields,
    responseHeaders: api.responseHeaders,
    errorResponses: api.errorResponses,
    headers: api.headers,
    queryParams: api.queryParams,
    pathParams: api.pathParams,
    cookies: api.cookies,
    auth: api.auth,
    securitySchemes: api.securitySchemes,
    schemas: api.schemas,
    rateLimiting: api.rateLimiting,
    pagination: api.pagination,
    links: api.links,
    callbacks: api.callbacks,
    tags: api.tags,
    tagsMeta: api.tagsMeta,
    externalDocs: api.externalDocs,
    deprecatedAt: api.deprecatedAt,
    sunsetDate: api.sunsetDate,
    replacementApiPath: api.replacementApiPath,
  })
}

// ── Product & Category & DocPage Types ───────────────────────────────────────

export const visibilities = ["public", "private", "partner", "internal"] as const
export const docTypes = ["rest_api", "graphql_api", "webhook", "collection", "guideline"] as const
export const pageTypes = ["overview", "guide", "api_reference", "changelog", "custom"] as const
export const pageStatuses = ["draft", "published"] as const
export const auditActions = ["create", "update", "delete", "publish", "unpublish", "import", "schedule", "rollback"] as const

export type Visibility = (typeof visibilities)[number]
export type DocType = (typeof docTypes)[number]
export type PageType = (typeof pageTypes)[number]
export type PageStatus = (typeof pageStatuses)[number]
export type AuditAction = (typeof auditActions)[number]

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  docType: DocType
  collectionId: string | null
  collectionName: string | null
  visibility: Visibility
  icon: string | null
  orderNo: number
  currentVersion: string
  createdAt: string
  updatedAt: string
}

export interface DocCollection {
  id: string
  name: string
  slug: string
  description: string
  orderNo: number
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  productId: string
  parentId: string | null
  name: string
  slug: string
  description: string
  orderNo: number
  createdAt: string
  updatedAt: string
}

export interface DocPage {
  id: string
  categoryId: string
  title: string
  slug: string
  pageType: PageType
  content: string
  publishedContent: string | null
  status: PageStatus
  orderNo: number
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface DocPageVersion {
  id: string
  pageId: string
  version: string
  title: string
  content: string
  publishedBy: string
  changelog: string
  createdAt: string
}

export interface ReleaseBundleDoc {
  id: string
  bundleId: string
  docPageId: string
  docPageVersionId: string | null
  title: string
  slug: string
  pageType: PageType
  status: PageStatus
  content: string
  createdAt: string
}

export interface ReleaseBundle {
  id: string
  apiId: string
  apiReleaseId: string | null
  version: string
  releaseNotes: string
  notifySubscribers: boolean
  status: ReleaseBundleStatus
  createdBy: string
  scheduledFor: string | null
  publishedAt: string | null
  rolledBackFromBundleId: string | null
  apiSnapshot?: ApiReleaseSnapshot
  docs: ReleaseBundleDoc[]
  createdAt: string
  updatedAt: string
}

export interface ApiPublishResult {
  api: ApiItem
  bundle: ReleaseBundle
  scheduled: boolean
}

export interface ReusableSnippet {
  id: string
  slug: string
  name: string
  description: string
  scope: SnippetScope
  productId: string | null
  content: string
  tags: string[]
  usageCount: number
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface ExampleVariant {
  language: "bash" | "javascript" | "python" | "go"
  label: string
  code: string
}

export interface ExampleSet {
  id: string
  slug: string
  title: string
  description: string
  variants: ExampleVariant[]
  usageCount: number
  createdBy: string
  createdAt: string
  updatedAt: string
}

export type ExampleSetResolved = ExampleSet

export interface AuditLogEntry {
  id: string
  actor: string
  action: AuditAction
  resourceType: string
  resourceId: string | null
  summary: string
  beforeSnapshot: unknown
  afterSnapshot: unknown
  createdAt: string
}

// ── Users & Roles ────────────────────────────────────────────────────────────

export const userRoles = ["author", "publisher", "admin"] as const
export type UserRole = (typeof userRoles)[number]

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatarUrl: string | null
  createdAt: string
}

export const rolePermissions: Record<UserRole, {
  canCreate: boolean
  canEdit: boolean
  canPublish: boolean
  canDelete: boolean
  canManageUsers: boolean
}> = {
  author:    { canCreate: true,  canEdit: true,  canPublish: false, canDelete: false, canManageUsers: false },
  publisher: { canCreate: true,  canEdit: true,  canPublish: true,  canDelete: true,  canManageUsers: false },
  admin:     { canCreate: true,  canEdit: true,  canPublish: true,  canDelete: true,  canManageUsers: true  },
}

export function hasPermission(role: UserRole, permission: keyof typeof rolePermissions.admin): boolean {
  return rolePermissions[role][permission]
}

// Tree structure for sidebar navigation
export interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[]
  pages: DocPage[]
}

export interface ProductTree extends Product {
  categories: CategoryTreeNode[]
}

export const productWriteSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  slug: z.string().trim().min(1).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens."),
  description: z.string().trim().default(""),
  docType: z.enum(docTypes).default("collection"),
  collectionId: z.string().uuid().nullable().optional(),
  visibility: z.enum(visibilities).default("public"),
  icon: z.string().nullable().optional(),
  currentVersion: z.string().trim().default("v1.0.0"),
})

export type ProductWriteInput = z.infer<typeof productWriteSchema>

export const collectionWriteSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  slug: z.string().trim().min(1).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens."),
  description: z.string().trim().default(""),
})

export type CollectionWriteInput = z.infer<typeof collectionWriteSchema>

export const categoryWriteSchema = z.object({
  productId: z.string().uuid(),
  parentId: z.string().uuid().nullable().optional(),
  name: z.string().trim().min(1, "Name is required."),
  slug: z.string().trim().min(1).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens."),
  description: z.string().trim().default(""),
})

export type CategoryWriteInput = z.infer<typeof categoryWriteSchema>

export const docPageWriteSchema = z.object({
  categoryId: z.string().uuid(),
  title: z.string().trim().min(1, "Title is required."),
  slug: z.string().trim().min(1).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens."),
  pageType: z.enum(pageTypes).default("custom"),
  content: z.string().default(""),
})

export type DocPageWriteInput = z.infer<typeof docPageWriteSchema>

export const reusableSnippetWriteSchema = z.object({
  slug: z.string().trim().min(1).regex(slugPattern, "Slug must be lowercase alphanumeric with hyphens."),
  name: z.string().trim().min(1, "Name is required."),
  description: z.string().trim().default(""),
  scope: z.enum(snippetScopes).default("global"),
  productId: z.string().uuid().nullable().optional(),
  content: z.string().default(""),
  tags: z.array(z.string().trim()).default([]),
})

export type ReusableSnippetWriteInput = z.output<typeof reusableSnippetWriteSchema>

export const exampleSetWriteSchema = z.object({
  slug: z.string().trim().min(1).regex(slugPattern, "Slug must be lowercase alphanumeric with hyphens."),
  title: z.string().trim().min(1, "Title is required."),
  description: z.string().trim().default(""),
  variants: z.array(z.object({
    language: z.enum(["bash", "javascript", "python", "go"]),
    label: z.string().trim().min(1, "Label is required."),
    code: z.string().default(""),
  })).default([]),
})

export type ExampleSetWriteInput = z.output<typeof exampleSetWriteSchema>
