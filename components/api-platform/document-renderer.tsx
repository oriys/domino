"use client"

import type { ReactNode } from "react"
import ReactMarkdown from "react-markdown"
import rehypeHighlight from "rehype-highlight"
import remarkGfm from "remark-gfm"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HighlightedCode } from "@/components/ui/highlighted-code"
import { getBlockAppearanceClasses } from "@/lib/api-platform/block-appearance"
import {
  blockLabels,
  hasSerializedBlockMetadata,
  parseMarkdownToBlocks,
  type AuthConfigData,
  type CalloutData,
  type CodeData,
  type ContentBlock,
  type DosDontsData,
  type ErrorResponsesData,
  type FieldTableData,
  type GraphqlOperationData,
  type GraphqlSchemaData,
  type HeadingData,
  type ImageData,
  type PaginationConfigData,
  type ParamTableData,
  type RateLimitData,
  type ResponseHeadersData,
  type RestEndpointData,
  type SchemaModelData,
  type SecuritySchemeData,
  type ServerConfigData,
  type StepsData,
  type TableData,
  type TextData,
  type WebhookEventData,
  type WebhookRetryData,
  type WebhookVerifyData,
} from "@/lib/api-platform/doc-blocks"
import { resolveSnippetContent } from "@/lib/api-platform/document-tokens"
import { MethodBadge } from "@/lib/api-platform/status-styles"
import type { ExampleSetResolved, ReusableSnippet } from "@/lib/api-platform/types"
import { cn } from "@/lib/utils"

interface DocumentRendererProps {
  content: string
  snippets?: ReusableSnippet[]
  examples?: ExampleSetResolved[]
  className?: string
}

type Segment =
  | { kind: "markdown"; content: string }
  | { kind: "example"; slug: string }

const examplePattern = /\{\{example:([a-z0-9-]+)\}\}/g

function splitIntoSegments(content: string): Segment[] {
  const segments: Segment[] = []
  let lastIndex = 0

  for (const match of content.matchAll(examplePattern)) {
    const start = match.index ?? 0
    if (start > lastIndex) {
      segments.push({ kind: "markdown", content: content.slice(lastIndex, start) })
    }
    segments.push({ kind: "example", slug: match[1] })
    lastIndex = start + match[0].length
  }

  if (lastIndex < content.length) {
    segments.push({ kind: "markdown", content: content.slice(lastIndex) })
  }

  if (segments.length === 0) {
    segments.push({ kind: "markdown", content })
  }

  return segments
}

function renderMarkdown(content: string, key: string) {
  if (!content.trim()) return null
  return (
    <ReactMarkdown key={key} remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
      {content}
    </ReactMarkdown>
  )
}

function ExampleTabs({ example }: { example: ExampleSetResolved }) {
  if (example.variants.length === 0) {
    return (
      <Card className="my-6 border-dashed">
        <CardHeader>
          <CardTitle className="text-base">{example.title}</CardTitle>
          <CardDescription>{example.description || "Link this example set to an API before using it."}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="my-6 overflow-hidden">
      <CardHeader className="border-b bg-muted/20">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base">{example.title}</CardTitle>
            <CardDescription>{example.description || "Synchronized multi-language example set."}</CardDescription>
          </div>
          <Badge variant="secondary" className="text-[11px]">
            Linked example
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue={example.variants[0]?.label} className="gap-0">
          <div className="border-b px-4 py-3">
            <TabsList className="h-auto flex-wrap">
              {example.variants.map((variant) => (
                <TabsTrigger key={variant.label} value={variant.label} className="text-xs">
                  {variant.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          {example.variants.map((variant) => (
            <TabsContent key={variant.label} value={variant.label} className="m-0">
              <div className="px-4 py-4">
                <HighlightedCode code={variant.code} language={variant.language} />
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}

function renderExample(slug: string, exampleMap: Map<string, ExampleSetResolved>, key: string) {
  const example = exampleMap.get(slug)
  if (!example) {
    return (
      <Card key={key} className="my-6 border-dashed">
        <CardHeader>
          <CardTitle className="text-base">Missing example</CardTitle>
          <CardDescription>{`Create an example set with slug "${slug}" to resolve this token.`}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return <ExampleTabs key={key} example={example} />
}

function renderSegmentContent(
  content: string,
  exampleMap: Map<string, ExampleSetResolved>,
  keyPrefix: string,
) {
  return splitIntoSegments(content).map((segment, index) => {
    if (segment.kind === "markdown") {
      return renderMarkdown(segment.content, `${keyPrefix}-markdown-${index}`)
    }
    return renderExample(segment.slug, exampleMap, `${keyPrefix}-example-${index}`)
  })
}

function ComponentFrame({
  block,
  title,
  subtitle,
  trailing,
  children,
}: {
  block: ContentBlock
  title: string
  subtitle?: string
  trailing?: ReactNode
  children: ReactNode
}) {
  const classes = getBlockAppearanceClasses(block.appearance)

  return (
    <section className={cn("not-prose my-6", classes.shell)}>
      <div className={cn(classes.header, "justify-between gap-4")}>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={cn("px-2 py-0.5", classes.badge)}>
              {blockLabels[block.type]}
            </Badge>
            {subtitle ? <span className="text-xs text-muted-foreground">{subtitle}</span> : null}
          </div>
          <h3 className="mt-2 text-lg font-semibold tracking-tight">{title}</h3>
        </div>
        {trailing ? <div className="shrink-0">{trailing}</div> : null}
      </div>
      <div className={classes.body}>{children}</div>
    </section>
  )
}

function CodePanel({
  label,
  code,
  language,
  className,
}: {
  label: string
  code: string
  language?: string
  className?: string
}) {
  if (!code.trim()) return null

  return (
    <div className={cn("overflow-hidden rounded-2xl border border-border/60 bg-muted/10", className)}>
      <div className="border-b px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
      <HighlightedCode
        code={code}
        language={language}
        className="m-0 overflow-x-auto px-4 py-4 text-sm leading-6"
      />
    </div>
  )
}

function DataTable({
  headers,
  rows,
}: {
  headers: string[]
  rows: ReactNode[][]
}) {
  if (headers.length === 0) return null

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-background">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-muted/45">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-t border-border/60 align-top">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-3 text-sm leading-6">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function renderStructuredBlock(
  block: ContentBlock,
  exampleMap: Map<string, ExampleSetResolved>,
) {
  switch (block.type) {
    case "heading": {
      const data = block.data as HeadingData
      const Tag = data.level === 2 ? "h2" : "h3"
      return (
        <div key={block.id} className="not-prose my-8">
          <Tag className={cn("scroll-m-20 tracking-tight", data.level === 2 ? "text-3xl font-semibold" : "text-2xl font-semibold")}>
            {data.text}
          </Tag>
          {data.description.trim() ? (
            <div className="mt-3 text-sm leading-7 text-muted-foreground">
              {renderMarkdown(data.description, `${block.id}-description`)}
            </div>
          ) : null}
        </div>
      )
    }
    case "text": {
      const data = block.data as TextData
      return <div key={block.id}>{renderSegmentContent(data.content, exampleMap, block.id)}</div>
    }
    case "code": {
      const data = block.data as CodeData
      return (
        <div key={block.id} className="not-prose my-6">
          {data.caption.trim() ? (
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              {data.caption}
            </p>
          ) : null}
          <CodePanel label={data.language || "code"} code={data.code} language={data.language} />
        </div>
      )
    }
    case "table": {
      const data = block.data as TableData
      return (
        <div key={block.id} className="not-prose my-6">
          <DataTable headers={data.headers} rows={data.rows} />
        </div>
      )
    }
    case "callout": {
      const data = block.data as CalloutData
      const toneClasses = {
        tip: "border-success/30 bg-success/[0.08] text-success",
        warning: "border-warning/30 bg-warning/[0.08] text-warning",
        info: "border-primary/25 bg-primary/[0.06] text-primary",
      }[data.variant]
      const label = {
        tip: "Tip",
        warning: "Warning",
        info: "Note",
      }[data.variant]

      return (
        <div key={block.id} className={cn("not-prose my-6 rounded-2xl border p-5", toneClasses)}>
          <div className="text-xs font-semibold uppercase tracking-[0.18em]">{label}</div>
          <p className="mt-3 text-sm leading-6">{data.text}</p>
        </div>
      )
    }
    case "image": {
      const data = block.data as ImageData
      if (!data.src) return null
      return (
        <figure key={block.id} className="not-prose my-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.src}
            alt={data.alt || data.caption || "Illustration"}
            className="w-full rounded-3xl border border-border/60 bg-muted/20 object-cover"
            style={data.width ? { maxWidth: `${data.width}px` } : undefined}
          />
          {data.caption.trim() ? (
            <figcaption className="mt-3 text-sm text-muted-foreground">{data.caption}</figcaption>
          ) : null}
        </figure>
      )
    }
    case "rest_endpoint": {
      const data = block.data as RestEndpointData
      return (
        <ComponentFrame
          key={block.id}
          block={block}
          title={data.path}
          subtitle="Endpoint contract"
          trailing={<MethodBadge method={data.method} />}
        >
          {data.description.trim() ? (
            <p className="text-sm leading-6 text-muted-foreground">{data.description}</p>
          ) : null}
          {data.headers.length > 0 ? (
            <DataTable
              headers={["Header", "Value"]}
              rows={data.headers.map((header) => [<code key={`${header.key}-name`}>{header.key}</code>, header.value])}
            />
          ) : null}
          <div className="grid gap-4 lg:grid-cols-2">
            <CodePanel label="Request Body" code={data.requestBody} language="json" />
            <CodePanel label={`Response ${data.responseStatus}`} code={data.responseBody} language="json" />
          </div>
        </ComponentFrame>
      )
    }
    case "graphql_operation": {
      const data = block.data as GraphqlOperationData
      return (
        <ComponentFrame
          key={block.id}
          block={block}
          title={data.name || (data.operationType === "query" ? "Query" : "Mutation")}
          subtitle="GraphQL operation"
          trailing={<Badge variant="outline">{data.operationType}</Badge>}
        >
          {data.description.trim() ? (
            <p className="text-sm leading-6 text-muted-foreground">{data.description}</p>
          ) : null}
          <div className="grid gap-4 lg:grid-cols-[1.35fr_minmax(0,0.9fr)]">
            <CodePanel label="Operation" code={data.code} language="graphql" />
            <CodePanel label="Variables" code={data.variables} language="json" />
          </div>
        </ComponentFrame>
      )
    }
    case "graphql_schema": {
      const data = block.data as GraphqlSchemaData
      return (
        <ComponentFrame key={block.id} block={block} title="Schema" subtitle="GraphQL SDL">
          <CodePanel label="Schema Definition" code={data.code} language="graphql" />
        </ComponentFrame>
      )
    }
    case "webhook_event": {
      const data = block.data as WebhookEventData
      return (
        <ComponentFrame
          key={block.id}
          block={block}
          title={data.eventName}
          subtitle="Webhook event"
          trailing={<Badge variant="outline">{data.eventName}</Badge>}
        >
          {data.description.trim() ? (
            <p className="text-sm leading-6 text-muted-foreground">{data.description}</p>
          ) : null}
          <CodePanel label="Payload" code={data.payload} language="json" />
        </ComponentFrame>
      )
    }
    case "webhook_verify": {
      const data = block.data as WebhookVerifyData
      return (
        <ComponentFrame key={block.id} block={block} title="Signature Verification" subtitle="Webhook security">
          {data.description.trim() ? (
            <p className="text-sm leading-6 text-muted-foreground">{data.description}</p>
          ) : null}
          <CodePanel label={data.language || "Code"} code={data.code} language={data.language} />
        </ComponentFrame>
      )
    }
    case "webhook_retry": {
      const data = block.data as WebhookRetryData
      return (
        <ComponentFrame key={block.id} block={block} title="Retry Policy" subtitle="Delivery behavior">
          {data.description.trim() ? (
            <p className="text-sm leading-6 text-muted-foreground">{data.description}</p>
          ) : null}
          <DataTable headers={["Attempt", "Delay"]} rows={data.rows.map((row) => [row.attempt, row.delay])} />
        </ComponentFrame>
      )
    }
    case "steps": {
      const data = block.data as StepsData
      return (
        <ComponentFrame key={block.id} block={block} title={data.title || "步骤"} subtitle="Workflow">
          <div className="space-y-3">
            {data.steps.map((step, index) => (
              <div key={`${step.label}-${index}`} className="rounded-2xl border border-border/60 bg-background px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60 text-xs font-semibold">
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium">{step.label}</p>
                    {step.description.trim() ? (
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ComponentFrame>
      )
    }
    case "dos_donts": {
      const data = block.data as DosDontsData
      return (
        <ComponentFrame key={block.id} block={block} title="Recommendations" subtitle="Do / Don&apos;t">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-success/20 bg-success/[0.05] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-success">Do</p>
              <ul className="mt-3 space-y-2 text-sm leading-6">
                {data.dos.map((item, index) => (
                  <li key={`${item}-${index}`}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-destructive/20 bg-destructive/[0.05] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-destructive">Don&apos;t</p>
              <ul className="mt-3 space-y-2 text-sm leading-6">
                {data.donts.map((item, index) => (
                  <li key={`${item}-${index}`}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </ComponentFrame>
      )
    }
    case "param_table": {
      const data = block.data as ParamTableData
      return (
        <ComponentFrame
          key={block.id}
          block={block}
          title="Parameters"
          subtitle="Request contract"
          trailing={<Badge variant="outline">{data.variant}</Badge>}
        >
          <DataTable
            headers={["Name", "Type", "Required", "Description"]}
            rows={data.params.map((param) => [
              <code key={`${param.name}-name`}>{param.name}</code>,
              param.type,
              param.required ? "Yes" : "No",
              param.description,
            ])}
          />
        </ComponentFrame>
      )
    }
    case "auth_config": {
      const data = block.data as AuthConfigData
      const details = [
        data.apiKeyName ? ["Key name", data.apiKeyName] : null,
        data.apiKeyIn ? ["Location", data.apiKeyIn] : null,
        data.bearerFormat ? ["Format", data.bearerFormat] : null,
        data.oauth2Flow ? ["Flow", data.oauth2Flow] : null,
        data.oauth2TokenUrl ? ["Token URL", data.oauth2TokenUrl] : null,
        data.oauth2AuthUrl ? ["Authorization URL", data.oauth2AuthUrl] : null,
        data.oauth2Scopes?.length ? ["Scopes", data.oauth2Scopes.join(", ")] : null,
      ].filter((item): item is [string, string] => Boolean(item))

      return (
        <ComponentFrame
          key={block.id}
          block={block}
          title="Authentication"
          subtitle="Access requirements"
          trailing={<Badge variant="outline">{data.authType}</Badge>}
        >
          {data.description?.trim() ? (
            <p className="text-sm leading-6 text-muted-foreground">{data.description}</p>
          ) : null}
          {details.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {details.map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-border/60 bg-background px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
                  <p className="mt-2 text-sm leading-6">{value}</p>
                </div>
              ))}
            </div>
          ) : null}
        </ComponentFrame>
      )
    }
    case "error_responses": {
      const data = block.data as ErrorResponsesData
      return (
        <ComponentFrame key={block.id} block={block} title="Error Responses" subtitle="Failure modes">
          <div className="space-y-4">
            {data.responses.map((response) => (
              <div key={response.statusCode} className="rounded-2xl border border-border/60 bg-background p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="outline">{response.statusCode}</Badge>
                  <p className="text-sm font-medium">{response.description}</p>
                </div>
                {response.body?.trim() ? (
                  <div className="mt-4">
                    <CodePanel label="Example Body" code={response.body} language="json" />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </ComponentFrame>
      )
    }
    case "field_table": {
      const data = block.data as FieldTableData
      return (
        <ComponentFrame key={block.id} block={block} title={data.title || "Field Table"} subtitle="Field reference">
          <DataTable
            headers={["Path", "Type", "Required", "Description", "Example"]}
            rows={data.fields.map((field) => [
              <code key={`${field.path}-path`}>{field.path}</code>,
              field.type,
              field.required ? "Yes" : "No",
              field.description,
              field.example || "—",
            ])}
          />
          <CodePanel label="Example JSON" code={data.exampleJson ?? ""} language="json" />
        </ComponentFrame>
      )
    }
    case "server_config": {
      const data = block.data as ServerConfigData
      return (
        <ComponentFrame key={block.id} block={block} title="Servers" subtitle="Environment configuration">
          <div className="space-y-4">
            {data.servers.map((server, index) => (
              <div key={`${server.url}-${index}`} className="rounded-2xl border border-border/60 bg-background p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="outline">{server.description || `Server ${index + 1}`}</Badge>
                  <code className="text-sm">{server.url}</code>
                </div>
                {server.variables.length > 0 ? (
                  <div className="mt-4">
                    <DataTable
                      headers={["Variable", "Default", "Options", "Description"]}
                      rows={server.variables.map((variable) => [
                        <code key={`${server.url}-${variable.name}`}>{variable.name}</code>,
                        variable.default,
                        variable.enum.join(", ") || "—",
                        variable.description || "—",
                      ])}
                    />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </ComponentFrame>
      )
    }
    case "schema_model": {
      const data = block.data as SchemaModelData
      return (
        <ComponentFrame key={block.id} block={block} title={data.name} subtitle="Schema model">
          {data.description.trim() ? (
            <p className="text-sm leading-6 text-muted-foreground">{data.description}</p>
          ) : null}
          {data.composition ? (
            <div className="rounded-2xl border border-border/60 bg-background px-4 py-3 text-sm">
              <span className="text-muted-foreground">Composition:</span>{" "}
              <strong>{data.composition.type}</strong>{" "}
              {data.composition.refs.map((ref) => `#/${ref}`).join(", ")}
            </div>
          ) : null}
          <DataTable
            headers={["Property", "Type", "Required", "Example", "Description"]}
            rows={data.properties.map((property) => [
              <code key={`${property.name}-prop`}>{property.name}</code>,
              property.type,
              property.required ? "Yes" : "No",
              property.example || "—",
              property.description,
            ])}
          />
        </ComponentFrame>
      )
    }
    case "rate_limit": {
      const data = block.data as RateLimitData
      return (
        <ComponentFrame key={block.id} block={block} title="Rate Limits" subtitle="Traffic control">
          {data.description.trim() ? (
            <p className="text-sm leading-6 text-muted-foreground">{data.description}</p>
          ) : null}
          <DataTable
            headers={["Tier", "Limit", "Window", "Description"]}
            rows={data.limits.map((limit) => [limit.name, String(limit.limit), limit.window, limit.description])}
          />
          <div className="grid gap-3 md:grid-cols-3">
            {[
              ["Limit", data.headers.limit],
              ["Remaining", data.headers.remaining],
              ["Reset", data.headers.reset],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-border/60 bg-background px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
                <code className="mt-2 block text-sm">{value}</code>
              </div>
            ))}
          </div>
        </ComponentFrame>
      )
    }
    case "pagination_config": {
      const data = block.data as PaginationConfigData
      return (
        <ComponentFrame
          key={block.id}
          block={block}
          title="Pagination"
          subtitle="Collection traversal"
          trailing={<Badge variant="outline">{data.style}</Badge>}
        >
          {data.description.trim() ? (
            <p className="text-sm leading-6 text-muted-foreground">{data.description}</p>
          ) : null}
          {data.parameters.length > 0 ? (
            <DataTable
              headers={["Parameter", "Type", "Required", "Default", "Description"]}
              rows={data.parameters.map((parameter) => [
                <code key={`${parameter.name}-pagination`}>{parameter.name}</code>,
                parameter.type,
                parameter.required ? "Yes" : "No",
                parameter.default || "—",
                parameter.description,
              ])}
            />
          ) : null}
          {data.responseFields.length > 0 ? (
            <DataTable
              headers={["Response Field", "Type", "Description"]}
              rows={data.responseFields.map((field) => [
                <code key={`${field.name}-response`}>{field.name}</code>,
                field.type,
                field.description,
              ])}
            />
          ) : null}
        </ComponentFrame>
      )
    }
    case "response_headers": {
      const data = block.data as ResponseHeadersData
      return (
        <ComponentFrame key={block.id} block={block} title="Response Headers" subtitle="HTTP metadata">
          <DataTable
            headers={["Header", "Type", "Required", "Example", "Description"]}
            rows={data.headers.map((header) => [
              <code key={`${header.name}-header`}>{header.name}</code>,
              header.type,
              header.required ? "Yes" : "No",
              header.example || "—",
              header.description,
            ])}
          />
        </ComponentFrame>
      )
    }
    case "security_scheme": {
      const data = block.data as SecuritySchemeData
      return (
        <ComponentFrame
          key={block.id}
          block={block}
          title={data.name}
          subtitle="Security scheme"
          trailing={<Badge variant="outline">{data.type}</Badge>}
        >
          {data.description.trim() ? (
            <p className="text-sm leading-6 text-muted-foreground">{data.description}</p>
          ) : null}
          <div className="grid gap-3 md:grid-cols-2">
            {[
              ["Type", data.type],
              data.apiKeyName ? ["Key Name", data.apiKeyName] : null,
              data.apiKeyIn ? ["Location", data.apiKeyIn] : null,
              data.scheme ? ["Scheme", data.scheme] : null,
              data.bearerFormat ? ["Bearer Format", data.bearerFormat] : null,
              data.openIdConnectUrl ? ["OpenID URL", data.openIdConnectUrl] : null,
            ]
              .filter((item): item is [string, string] => Boolean(item))
              .map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-border/60 bg-background px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
                  <p className="mt-2 text-sm leading-6">{value}</p>
                </div>
              ))}
          </div>
          {data.oauth2Flows?.trim() ? (
            <CodePanel label="OAuth 2.0 Flows" code={data.oauth2Flows} language="json" />
          ) : null}
        </ComponentFrame>
      )
    }
    default:
      return null
  }
}

export function DocumentRenderer({
  content,
  snippets = [],
  examples = [],
  className,
}: DocumentRendererProps) {
  const resolved = resolveSnippetContent(content, snippets)
  const exampleMap = new Map(examples.map((example) => [example.slug, example]))

  if (hasSerializedBlockMetadata(resolved)) {
    const blocks = parseMarkdownToBlocks(resolved)
    return <div className={className}>{blocks.map((block) => renderStructuredBlock(block, exampleMap))}</div>
  }

  const segments = splitIntoSegments(resolved)

  return (
    <div className={className}>
      {segments.map((segment, index) => {
        if (segment.kind === "markdown") {
          return renderMarkdown(segment.content, `markdown-${index}`)
        }

        return renderExample(segment.slug, exampleMap, `example-${index}`)
      })}
    </div>
  )
}
