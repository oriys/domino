import { createProduct, createCategory, createDocPage } from "./docs-server"

// ── Helpers ──────────────────────────────────────────────────────────────────

async function seedCategory(productId: string, name: string, slug: string, description: string) {
  return createCategory({ productId, name, slug, description })
}

async function seedPage(
  categoryId: string,
  title: string,
  slug: string,
  pageType: string,
  content: string,
) {
  return createDocPage({ categoryId, title, slug, pageType, content })
}

// ── Product 1 — Payment Service API (REST) ───────────────────────────────────

async function seedPaymentServiceApi() {
  const product = await createProduct({
    name: "Payment Service API",
    slug: "payment-service-api",
    description: "RESTful API for processing payments, refunds, and transaction management.",
    docType: "rest_api",
    visibility: "public",
    currentVersion: "v2.4.0",
  })

  // Category: Getting Started
  const gettingStarted = await seedCategory(
    product.id,
    "Getting Started",
    "getting-started",
    "Quick-start guides for the Payment API.",
  )

  await seedPage(gettingStarted.id, "Introduction", "introduction", "overview", `# Payment Service API

Welcome to the **Payment Service API** documentation. This API provides a complete
set of RESTful endpoints for processing payments, managing refunds, and querying
transaction history.

## Base URL

All API requests are made to the following base URL:

\`\`\`
https://api.example.com/v1
\`\`\`

## Supported Operations

| Operation        | Endpoint                       | Method |
| ---------------- | ------------------------------ | ------ |
| Create payment   | \`/v1/payments\`                 | POST   |
| List payments    | \`/v1/payments\`                 | GET    |
| Get payment      | \`/v1/payments/{id}\`            | GET    |
| Refund payment   | \`/v1/payments/{id}/refund\`     | POST   |
| List refunds     | \`/v1/refunds\`                  | GET    |

## Authentication

Every request must include a **Bearer token** in the \`Authorization\` header.
See the [Authentication](/docs/payment-service-api/getting-started/authentication)
page for details on obtaining and rotating tokens.

## Quick Example

\`\`\`bash
curl -X POST https://api.example.com/v1/payments \\
  -H "Authorization: Bearer sk_live_abc123" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 5000,
    "currency": "usd",
    "description": "Order #1234",
    "customer_id": "cus_9876"
  }'
\`\`\`

The API returns standard HTTP status codes and JSON-encoded response bodies.
All monetary amounts are expressed in the **smallest currency unit** (e.g. cents
for USD).

## SDKs & Libraries

Official client libraries are available for:

- **Node.js** — \`npm install @example/payments\`
- **Python** — \`pip install example-payments\`
- **Go** — \`go get github.com/example/payments-go\`

## Rate Limits

The API enforces a default rate limit of **1 000 requests per minute** per
API key. If you exceed this limit you will receive a \`429 Too Many Requests\`
response with a \`Retry-After\` header.
`)

  await seedPage(gettingStarted.id, "Authentication", "authentication", "guide", `# Authentication

The Payment Service API uses **Bearer token** authentication. Every request must
include a valid API key in the \`Authorization\` header.

## Obtaining API Keys

1. Sign in to the [Developer Dashboard](https://dashboard.example.com).
2. Navigate to **Settings → API Keys**.
3. Click **Create Key** and choose the environment:
   - **Test** — keys prefixed with \`sk_test_\`
   - **Live** — keys prefixed with \`sk_live_\`

> **Warning:** Treat your secret keys like passwords. Never commit them to version
> control or expose them in client-side code.

## Using the Bearer Token

Include the token in the \`Authorization\` header of every request:

\`\`\`http
GET /v1/payments HTTP/1.1
Host: api.example.com
Authorization: Bearer sk_live_abc123
Content-Type: application/json
\`\`\`

### Example with cURL

\`\`\`bash
curl https://api.example.com/v1/payments \\
  -H "Authorization: Bearer sk_live_abc123"
\`\`\`

### Example with JavaScript

\`\`\`javascript
const response = await fetch("https://api.example.com/v1/payments", {
  headers: {
    Authorization: "Bearer sk_live_abc123",
    "Content-Type": "application/json",
  },
});
\`\`\`

## Key Rotation

You can rotate keys without downtime:

1. Create a new key in the Dashboard.
2. Update your application to use the new key.
3. Revoke the old key once the deployment is complete.

Both keys remain valid simultaneously during the rotation window.

## Rate Limiting

| Plan       | Requests / min | Burst limit |
| ---------- | -------------- | ----------- |
| Free       | 100            | 20          |
| Pro        | 1 000          | 200         |
| Enterprise | 10 000         | 2 000       |

When rate-limited you will receive:

\`\`\`json
{
  "error": {
    "code": "rate_limit_exceeded",
    "message": "Too many requests. Retry after 12 seconds.",
    "retry_after": 12
  }
}
\`\`\`

## IP Allow-listing

Enterprise plans support restricting API key usage to a set of allowed IP
addresses. Configure this under **Settings → Security → IP Allow List**.
`)

  // Category: Endpoints
  const endpoints = await seedCategory(
    product.id,
    "Endpoints",
    "endpoints",
    "Reference documentation for all payment endpoints.",
  )

  await seedPage(endpoints.id, "Create Payment", "create-payment", "api_reference", `# Create Payment

Creates a new payment intent.

\`\`\`
POST /v1/payments
\`\`\`

## Request Body

| Field          | Type     | Required | Description                                        |
| -------------- | -------- | -------- | -------------------------------------------------- |
| \`amount\`       | integer  | ✅       | Amount in smallest currency unit (e.g. cents).     |
| \`currency\`     | string   | ✅       | Three-letter ISO 4217 currency code.               |
| \`description\`  | string   | —        | Internal description for the payment.              |
| \`customer_id\`  | string   | —        | ID of the customer to associate the payment with.  |
| \`metadata\`     | object   | —        | Arbitrary key-value pairs for your own use.        |

### Example Request

\`\`\`bash
curl -X POST https://api.example.com/v1/payments \\
  -H "Authorization: Bearer sk_live_abc123" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 5000,
    "currency": "usd",
    "description": "Order #1234",
    "customer_id": "cus_9876",
    "metadata": {
      "order_ref": "ORD-1234"
    }
  }'
\`\`\`

## Response

\`\`\`json
{
  "id": "pay_a1b2c3d4",
  "object": "payment",
  "amount": 5000,
  "currency": "usd",
  "status": "pending",
  "description": "Order #1234",
  "customer_id": "cus_9876",
  "metadata": {
    "order_ref": "ORD-1234"
  },
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z"
}
\`\`\`

## Status Codes

| Code | Description                                          |
| ---- | ---------------------------------------------------- |
| 201  | Payment created successfully.                        |
| 400  | Invalid request — check the \`errors\` array.          |
| 401  | Missing or invalid authentication token.             |
| 422  | Unprocessable — e.g. unsupported currency.           |
| 429  | Rate limit exceeded.                                 |
| 500  | Internal server error — contact support.             |

## Payment Statuses

A payment transitions through the following states:

\`\`\`
pending → processing → succeeded
                    ↘ failed
\`\`\`

- **pending** — Payment created, awaiting processing.
- **processing** — Payment is being processed by the provider.
- **succeeded** — Payment captured successfully.
- **failed** — Payment could not be processed.
`)

  await seedPage(endpoints.id, "List Payments", "list-payments", "api_reference", `# List Payments

Returns a paginated list of payments.

\`\`\`
GET /v1/payments
\`\`\`

## Query Parameters

| Parameter  | Type    | Default | Description                                      |
| ---------- | ------- | ------- | ------------------------------------------------ |
| \`limit\`    | integer | 20      | Number of results per page (1–100).              |
| \`offset\`   | integer | 0       | Number of records to skip.                       |
| \`status\`   | string  | —       | Filter by status: \`pending\`, \`succeeded\`, etc.  |
| \`currency\` | string  | —       | Filter by ISO 4217 currency code.                |
| \`created_after\`  | string | —  | ISO 8601 timestamp lower bound.                  |
| \`created_before\` | string | —  | ISO 8601 timestamp upper bound.                  |

### Example Request

\`\`\`bash
curl "https://api.example.com/v1/payments?limit=10&status=succeeded" \\
  -H "Authorization: Bearer sk_live_abc123"
\`\`\`

## Response

\`\`\`json
{
  "object": "list",
  "data": [
    {
      "id": "pay_a1b2c3d4",
      "object": "payment",
      "amount": 5000,
      "currency": "usd",
      "status": "succeeded",
      "description": "Order #1234",
      "customer_id": "cus_9876",
      "created_at": "2025-01-15T10:30:00Z"
    },
    {
      "id": "pay_e5f6g7h8",
      "object": "payment",
      "amount": 2500,
      "currency": "usd",
      "status": "succeeded",
      "description": "Order #1235",
      "customer_id": "cus_5432",
      "created_at": "2025-01-14T09:15:00Z"
    }
  ],
  "has_more": true,
  "total_count": 142,
  "limit": 10,
  "offset": 0
}
\`\`\`

## Pagination

Use \`limit\` and \`offset\` to paginate through results:

\`\`\`bash
# Page 1
curl "https://api.example.com/v1/payments?limit=20&offset=0" ...

# Page 2
curl "https://api.example.com/v1/payments?limit=20&offset=20" ...
\`\`\`

The \`has_more\` field indicates whether additional pages exist. The
\`total_count\` field returns the total number of matching payments.

## Status Codes

| Code | Description                              |
| ---- | ---------------------------------------- |
| 200  | Success.                                 |
| 401  | Missing or invalid authentication token. |
| 429  | Rate limit exceeded.                     |
`)

  await seedPage(endpoints.id, "Refund Payment", "refund-payment", "api_reference", `# Refund Payment

Creates a full or partial refund for an existing payment.

\`\`\`
POST /v1/payments/{id}/refund
\`\`\`

## Path Parameters

| Parameter | Type   | Description                   |
| --------- | ------ | ----------------------------- |
| \`id\`      | string | The ID of the payment to refund. |

## Request Body

| Field    | Type    | Required | Description                                          |
| -------- | ------- | -------- | ---------------------------------------------------- |
| \`amount\` | integer | —        | Amount to refund in smallest unit. Defaults to full. |
| \`reason\` | string  | —        | One of: \`duplicate\`, \`fraudulent\`, \`requested_by_customer\`. |

### Example — Full Refund

\`\`\`bash
curl -X POST https://api.example.com/v1/payments/pay_a1b2c3d4/refund \\
  -H "Authorization: Bearer sk_live_abc123" \\
  -H "Content-Type: application/json" \\
  -d '{
    "reason": "requested_by_customer"
  }'
\`\`\`

### Example — Partial Refund

\`\`\`bash
curl -X POST https://api.example.com/v1/payments/pay_a1b2c3d4/refund \\
  -H "Authorization: Bearer sk_live_abc123" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 2000,
    "reason": "requested_by_customer"
  }'
\`\`\`

## Response

\`\`\`json
{
  "id": "ref_x1y2z3",
  "object": "refund",
  "payment_id": "pay_a1b2c3d4",
  "amount": 2000,
  "currency": "usd",
  "status": "pending",
  "reason": "requested_by_customer",
  "created_at": "2025-01-16T14:20:00Z"
}
\`\`\`

## Refund Statuses

| Status      | Description                                  |
| ----------- | -------------------------------------------- |
| \`pending\`   | Refund initiated, awaiting processing.       |
| \`succeeded\` | Funds returned to the customer.              |
| \`failed\`    | Refund could not be processed by the bank.   |

## Status Codes

| Code | Description                                          |
| ---- | ---------------------------------------------------- |
| 201  | Refund created successfully.                         |
| 400  | Invalid request — e.g. refund exceeds payment amount.|
| 404  | Payment not found.                                   |
| 409  | Payment is not in a refundable state.                |
| 429  | Rate limit exceeded.                                 |

## Notes

- A payment can only be refunded if its status is \`succeeded\`.
- Multiple partial refunds are allowed as long as the total does not exceed the
  original payment amount.
- Refunds typically take **5–10 business days** to appear on the customer's
  statement.
`)
}

// ── Product 2 — Content Management API (GraphQL) ─────────────────────────────

async function seedContentManagementApi() {
  const product = await createProduct({
    name: "Content Management API",
    slug: "content-management-api",
    description: "GraphQL API for managing articles, authors, and content categories.",
    docType: "graphql_api",
    visibility: "public",
    currentVersion: "v1.2.0",
  })

  // Category: Overview
  const overview = await seedCategory(
    product.id,
    "Overview",
    "overview",
    "Introduction and authentication for the Content Management API.",
  )

  await seedPage(overview.id, "Introduction", "introduction", "overview", `# Content Management API

The Content Management API is a **GraphQL** interface for managing articles,
authors, and categories in your content platform. It offers a single flexible
endpoint that lets you request exactly the data you need.

## Endpoint

All queries and mutations are sent to:

\`\`\`
POST https://cms.example.com/graphql
\`\`\`

## API Explorer

An interactive **GraphiQL** playground is available at:

\`\`\`
https://cms.example.com/playground
\`\`\`

Use it to explore the schema, run queries, and test mutations with autocomplete.

## Schema Overview

The schema is organized around three primary types:

| Type       | Description                                        |
| ---------- | -------------------------------------------------- |
| \`Article\`  | A published or draft content piece.                |
| \`Author\`   | A content creator linked to one or more articles.  |
| \`Category\` | A grouping mechanism for organizing articles.      |

### Relationships

\`\`\`
Author ──1:N──▶ Article ◀──N:M── Category
\`\`\`

- An **Author** can write many articles.
- An **Article** can belong to many categories.
- A **Category** can contain many articles.

## Quick Example

\`\`\`graphql
query {
  articles(limit: 5) {
    id
    title
    status
    author {
      name
    }
    categories {
      name
    }
  }
}
\`\`\`

### Response

\`\`\`json
{
  "data": {
    "articles": [
      {
        "id": "art_001",
        "title": "Getting Started with GraphQL",
        "status": "published",
        "author": { "name": "Jane Doe" },
        "categories": [{ "name": "Tutorials" }]
      }
    ]
  }
}
\`\`\`

## Error Format

Errors follow the standard GraphQL error shape:

\`\`\`json
{
  "errors": [
    {
      "message": "Article not found",
      "extensions": {
        "code": "NOT_FOUND",
        "path": ["article"]
      }
    }
  ]
}
\`\`\`
`)

  await seedPage(overview.id, "Authentication", "authentication", "guide", `# Authentication

All requests to the Content Management API require authentication via an
**API key** passed in the request headers.

## Creating an API Key

1. Open the [CMS Admin Panel](https://cms.example.com/admin).
2. Navigate to **Settings → API Access**.
3. Click **Generate Key** and assign the desired permissions.
4. Copy the key — it will not be shown again.

## Passing the API Key

Include the key in the \`X-API-Key\` header:

\`\`\`http
POST /graphql HTTP/1.1
Host: cms.example.com
Content-Type: application/json
X-API-Key: cms_key_abc123def456
\`\`\`

### cURL Example

\`\`\`bash
curl -X POST https://cms.example.com/graphql \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: cms_key_abc123def456" \\
  -d '{ "query": "{ articles { id title } }" }'
\`\`\`

## Permission Model

API keys are scoped to one or more permission levels:

| Permission         | Access                                       |
| ------------------ | -------------------------------------------- |
| \`content:read\`     | Query articles, authors, and categories.     |
| \`content:write\`    | Create and update articles.                  |
| \`content:delete\`   | Delete articles.                             |
| \`admin:manage\`     | Manage authors, categories, and API keys.    |

A key can hold multiple permissions. Attempting an operation without the
required permission returns:

\`\`\`json
{
  "errors": [
    {
      "message": "Insufficient permissions",
      "extensions": { "code": "FORBIDDEN" }
    }
  ]
}
\`\`\`

## Rate Limits

| Tier       | Queries / min |
| ---------- | ------------- |
| Free       | 60            |
| Pro        | 600           |
| Enterprise | 6 000         |

Rate-limited responses return HTTP 429 with the standard \`Retry-After\` header.

## Key Rotation

To rotate a key safely:

1. Generate a new key in the admin panel.
2. Deploy the new key to your application.
3. Revoke the old key.

Both keys are valid concurrently during the rotation window.
`)

  // Category: Schema Reference
  const schemaRef = await seedCategory(
    product.id,
    "Schema Reference",
    "schema-reference",
    "Detailed reference for types, queries, and mutations.",
  )

  await seedPage(schemaRef.id, "Types", "types", "api_reference", `# Types

The Content Management API schema is built around three core object types.

## Article

\`\`\`graphql
type Article {
  id: ID!
  title: String!
  slug: String!
  body: String!
  excerpt: String
  status: ArticleStatus!
  author: Author!
  categories: [Category!]!
  featuredImage: String
  publishedAt: DateTime
  createdAt: DateTime!
  updatedAt: DateTime!
}

enum ArticleStatus {
  DRAFT
  REVIEW
  PUBLISHED
  ARCHIVED
}
\`\`\`

| Field           | Type            | Description                                 |
| --------------- | --------------- | ------------------------------------------- |
| \`id\`            | \`ID!\`           | Unique identifier.                          |
| \`title\`         | \`String!\`       | Article title.                              |
| \`slug\`          | \`String!\`       | URL-safe slug derived from the title.       |
| \`body\`          | \`String!\`       | Full Markdown content.                      |
| \`excerpt\`       | \`String\`        | Optional short summary.                     |
| \`status\`        | \`ArticleStatus!\`| Current publication status.                |
| \`author\`        | \`Author!\`       | The author who created this article.        |
| \`categories\`    | \`[Category!]!\`  | Categories the article belongs to.          |
| \`featuredImage\` | \`String\`        | URL to the featured image.                  |
| \`publishedAt\`   | \`DateTime\`      | When the article was published.             |

## Author

\`\`\`graphql
type Author {
  id: ID!
  name: String!
  email: String!
  bio: String
  avatarUrl: String
  articles: [Article!]!
  createdAt: DateTime!
}
\`\`\`

## Category

\`\`\`graphql
type Category {
  id: ID!
  name: String!
  slug: String!
  description: String
  articles: [Article!]!
  parentCategory: Category
  childCategories: [Category!]!
}
\`\`\`

Categories support **nesting** — a category may have a \`parentCategory\` and
zero or more \`childCategories\`, enabling a hierarchical taxonomy.
`)

  await seedPage(schemaRef.id, "Queries", "queries", "api_reference", `# Queries

## articles

Fetch a paginated list of articles with optional filters.

\`\`\`graphql
query Articles(
  $limit: Int = 20
  $offset: Int = 0
  $status: ArticleStatus
  $categoryId: ID
) {
  articles(
    limit: $limit
    offset: $offset
    status: $status
    categoryId: $categoryId
  ) {
    id
    title
    slug
    status
    excerpt
    author { name }
    categories { name }
    publishedAt
  }
}
\`\`\`

### Example Response

\`\`\`json
{
  "data": {
    "articles": [
      {
        "id": "art_001",
        "title": "Getting Started with GraphQL",
        "slug": "getting-started-with-graphql",
        "status": "PUBLISHED",
        "excerpt": "A beginner-friendly guide...",
        "author": { "name": "Jane Doe" },
        "categories": [{ "name": "Tutorials" }],
        "publishedAt": "2025-01-10T08:00:00Z"
      }
    ]
  }
}
\`\`\`

## article

Fetch a single article by ID.

\`\`\`graphql
query Article($id: ID!) {
  article(id: $id) {
    id
    title
    body
    status
    author {
      name
      email
    }
    categories { name }
    featuredImage
    publishedAt
    createdAt
    updatedAt
  }
}
\`\`\`

## authors

Fetch a list of all authors.

\`\`\`graphql
query Authors($limit: Int = 50) {
  authors(limit: $limit) {
    id
    name
    email
    bio
    articles {
      id
      title
    }
  }
}
\`\`\`

## categories

Fetch the category tree.

\`\`\`graphql
query Categories {
  categories {
    id
    name
    slug
    description
    childCategories {
      id
      name
    }
    articles {
      id
      title
    }
  }
}
\`\`\`

All list queries support \`limit\` and \`offset\` arguments for pagination.
The maximum page size is **100**.
`)

  await seedPage(schemaRef.id, "Mutations", "mutations", "api_reference", `# Mutations

## createArticle

Creates a new article in **draft** status.

\`\`\`graphql
mutation CreateArticle($input: CreateArticleInput!) {
  createArticle(input: $input) {
    id
    title
    slug
    status
    createdAt
  }
}
\`\`\`

### Input Type

\`\`\`graphql
input CreateArticleInput {
  title: String!
  body: String!
  excerpt: String
  categoryIds: [ID!]
  featuredImage: String
}
\`\`\`

### Example Variables

\`\`\`json
{
  "input": {
    "title": "Introduction to WebSockets",
    "body": "# WebSockets\\n\\nWebSockets provide full-duplex communication...",
    "excerpt": "Learn the basics of WebSocket connections.",
    "categoryIds": ["cat_tutorials", "cat_networking"]
  }
}
\`\`\`

## updateArticle

Updates an existing article.

\`\`\`graphql
mutation UpdateArticle($id: ID!, $input: UpdateArticleInput!) {
  updateArticle(id: $id, input: $input) {
    id
    title
    status
    updatedAt
  }
}
\`\`\`

### Input Type

\`\`\`graphql
input UpdateArticleInput {
  title: String
  body: String
  excerpt: String
  status: ArticleStatus
  categoryIds: [ID!]
  featuredImage: String
}
\`\`\`

### Example — Publish an Article

\`\`\`json
{
  "id": "art_001",
  "input": {
    "status": "PUBLISHED"
  }
}
\`\`\`

## deleteArticle

Permanently deletes an article. This action **cannot be undone**.

\`\`\`graphql
mutation DeleteArticle($id: ID!) {
  deleteArticle(id: $id) {
    id
    title
  }
}
\`\`\`

### Example Variables

\`\`\`json
{
  "id": "art_042"
}
\`\`\`

### Response

\`\`\`json
{
  "data": {
    "deleteArticle": {
      "id": "art_042",
      "title": "Deprecated: Old Migration Guide"
    }
  }
}
\`\`\`

> **Note:** Deleting an article removes it from all associated categories. Author
> records are not affected.
`)
}

// ── Product 3 — Event Notifications (Webhook) ───────────────────────────────

async function seedEventNotifications() {
  const product = await createProduct({
    name: "Event Notifications",
    slug: "event-notifications",
    description: "Webhook-based event delivery for payment and order lifecycle events.",
    docType: "webhook",
    visibility: "public",
    currentVersion: "v1.1.0",
  })

  // Category: Getting Started
  const gettingStarted = await seedCategory(
    product.id,
    "Getting Started",
    "getting-started",
    "Learn how webhooks work and how to set them up.",
  )

  await seedPage(gettingStarted.id, "Introduction", "introduction", "overview", `# Event Notifications

**Webhooks** allow your application to receive real-time notifications when
events occur in the platform. Instead of polling the API, you register a URL
and we push event payloads to it as they happen.

## How Webhooks Work

1. You **register** a webhook endpoint URL in the Dashboard.
2. When an event occurs, we send an HTTP **POST** request to your URL.
3. Your server processes the payload and responds with a **2xx** status code.
4. If delivery fails, we **retry** with exponential backoff.

\`\`\`
┌──────────┐    POST /webhooks     ┌──────────────┐
│ Platform │ ──────────────────▶  │ Your Server  │
│          │ ◀────── 200 OK ───── │              │
└──────────┘                       └──────────────┘
\`\`\`

## Supported Events

| Event                  | Description                              |
| ---------------------- | ---------------------------------------- |
| \`payment.created\`      | A new payment was initiated.             |
| \`payment.completed\`    | A payment was successfully captured.     |
| \`payment.failed\`       | A payment attempt failed.                |
| \`order.created\`        | A new order was placed.                  |
| \`order.shipped\`        | An order has been shipped.               |
| \`order.delivered\`      | An order was delivered to the customer.  |

## Payload Format

All webhook payloads follow a consistent envelope:

\`\`\`json
{
  "id": "evt_abc123",
  "type": "payment.completed",
  "created_at": "2025-01-15T10:30:00Z",
  "data": {
    "id": "pay_a1b2c3d4",
    "amount": 5000,
    "currency": "usd",
    "status": "succeeded"
  }
}
\`\`\`

## Idempotency

Each event has a unique \`id\`. Your endpoint may receive the same event more
than once during retries. Use the event \`id\` to **deduplicate** and ensure
idempotent processing.

## Getting Started

1. Read the [Setup Guide](/docs/event-notifications/getting-started/setup-guide)
   to register your first endpoint.
2. Browse the [Event Reference](/docs/event-notifications/event-reference) for
   payload details.
`)

  await seedPage(gettingStarted.id, "Setup Guide", "setup-guide", "guide", `# Setup Guide

This guide walks you through registering a webhook endpoint, verifying
signatures, and handling retries.

## Registering a Webhook URL

1. Go to [Dashboard → Webhooks](https://dashboard.example.com/webhooks).
2. Click **Add Endpoint**.
3. Enter your HTTPS URL (e.g. \`https://yourapp.com/webhooks\`).
4. Select the events you want to subscribe to.
5. Click **Create**.

> **Note:** Webhook endpoints must use **HTTPS**. Plain HTTP URLs are rejected.

## Signature Verification

Every webhook request includes an \`X-Signature-256\` header containing an
**HMAC-SHA256** signature of the raw request body, using your webhook secret
as the key.

### Verifying the Signature

\`\`\`javascript
import crypto from "crypto";

function verifyWebhook(payload, signature, secret) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload, "utf-8")
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
\`\`\`

### Python Example

\`\`\`python
import hmac
import hashlib

def verify_webhook(payload: bytes, signature: str, secret: str) -> bool:
    expected = hmac.new(
        secret.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(signature, expected)
\`\`\`

> **Important:** Always use a **timing-safe comparison** function to prevent
> timing attacks.

## Retry Policy

If your endpoint returns a non-2xx status code or times out (> 30 seconds),
we retry the delivery using **exponential backoff**:

| Attempt | Delay         |
| ------- | ------------- |
| 1       | Immediate     |
| 2       | 1 minute      |
| 3       | 10 minutes    |
| 4       | 1 hour        |

After **3 failed retries**, the event is marked as failed. You can view
failed deliveries and manually retry them from the Dashboard.

## Best Practices

- **Respond quickly** — return a 200 status code as soon as you receive the
  payload, then process it asynchronously.
- **Deduplicate** — use the event \`id\` to ensure you don't process the same
  event twice.
- **Log everything** — store the raw payload for debugging and audit purposes.
- **Monitor failures** — set up alerts for repeated delivery failures.
`)

  // Category: Event Reference
  const eventRef = await seedCategory(
    product.id,
    "Event Reference",
    "event-reference",
    "Detailed payload documentation for each event type.",
  )

  await seedPage(eventRef.id, "Payment Events", "payment-events", "api_reference", `# Payment Events

## payment.created

Fired when a new payment intent is created.

\`\`\`json
{
  "id": "evt_pay_cr_001",
  "type": "payment.created",
  "created_at": "2025-01-15T10:30:00Z",
  "data": {
    "id": "pay_a1b2c3d4",
    "object": "payment",
    "amount": 5000,
    "currency": "usd",
    "status": "pending",
    "description": "Order #1234",
    "customer_id": "cus_9876",
    "metadata": {},
    "created_at": "2025-01-15T10:30:00Z"
  }
}
\`\`\`

### Fields

| Field              | Type    | Description                              |
| ------------------ | ------- | ---------------------------------------- |
| \`data.id\`          | string  | Unique payment identifier.               |
| \`data.amount\`      | integer | Amount in smallest currency unit.        |
| \`data.currency\`    | string  | ISO 4217 currency code.                  |
| \`data.status\`      | string  | Always \`pending\` for this event.         |
| \`data.customer_id\` | string  | Associated customer, if provided.        |

---

## payment.completed

Fired when a payment is successfully captured.

\`\`\`json
{
  "id": "evt_pay_co_002",
  "type": "payment.completed",
  "created_at": "2025-01-15T10:31:00Z",
  "data": {
    "id": "pay_a1b2c3d4",
    "object": "payment",
    "amount": 5000,
    "currency": "usd",
    "status": "succeeded",
    "description": "Order #1234",
    "customer_id": "cus_9876",
    "payment_method": "card",
    "receipt_url": "https://receipts.example.com/pay_a1b2c3d4",
    "created_at": "2025-01-15T10:30:00Z",
    "completed_at": "2025-01-15T10:31:00Z"
  }
}
\`\`\`

### Additional Fields

| Field                | Type   | Description                         |
| -------------------- | ------ | ----------------------------------- |
| \`data.payment_method\`| string | Payment method used (e.g. \`card\`). |
| \`data.receipt_url\`   | string | URL to the payment receipt.         |
| \`data.completed_at\`  | string | ISO 8601 completion timestamp.      |

---

## payment.failed

Fired when a payment attempt fails.

\`\`\`json
{
  "id": "evt_pay_fa_003",
  "type": "payment.failed",
  "created_at": "2025-01-15T10:31:30Z",
  "data": {
    "id": "pay_x9y8z7",
    "object": "payment",
    "amount": 12000,
    "currency": "eur",
    "status": "failed",
    "failure_code": "card_declined",
    "failure_message": "The card was declined by the issuing bank.",
    "customer_id": "cus_5432",
    "created_at": "2025-01-15T10:30:00Z",
    "failed_at": "2025-01-15T10:31:30Z"
  }
}
\`\`\`

### Failure Fields

| Field                  | Type   | Description                          |
| ---------------------- | ------ | ------------------------------------ |
| \`data.failure_code\`    | string | Machine-readable failure code.       |
| \`data.failure_message\` | string | Human-readable failure description.  |
| \`data.failed_at\`       | string | ISO 8601 failure timestamp.          |

Common failure codes: \`card_declined\`, \`insufficient_funds\`,
\`expired_card\`, \`processing_error\`.
`)

  await seedPage(eventRef.id, "Order Events", "order-events", "api_reference", `# Order Events

## order.created

Fired when a new order is placed.

\`\`\`json
{
  "id": "evt_ord_cr_001",
  "type": "order.created",
  "created_at": "2025-01-15T11:00:00Z",
  "data": {
    "id": "ord_m1n2o3",
    "object": "order",
    "status": "pending",
    "customer_id": "cus_9876",
    "total_amount": 7500,
    "currency": "usd",
    "items": [
      {
        "product_id": "prod_abc",
        "name": "Widget Pro",
        "quantity": 3,
        "unit_price": 2500
      }
    ],
    "shipping_address": {
      "line1": "123 Main St",
      "city": "San Francisco",
      "state": "CA",
      "postal_code": "94105",
      "country": "US"
    },
    "created_at": "2025-01-15T11:00:00Z"
  }
}
\`\`\`

### Fields

| Field                  | Type   | Description                              |
| ---------------------- | ------ | ---------------------------------------- |
| \`data.id\`              | string | Unique order identifier.                 |
| \`data.total_amount\`    | integer| Total in smallest currency unit.         |
| \`data.items\`           | array  | Line items in the order.                 |
| \`data.shipping_address\`| object | Delivery address.                        |

---

## order.shipped

Fired when an order is handed off to the carrier.

\`\`\`json
{
  "id": "evt_ord_sh_002",
  "type": "order.shipped",
  "created_at": "2025-01-16T09:00:00Z",
  "data": {
    "id": "ord_m1n2o3",
    "object": "order",
    "status": "shipped",
    "customer_id": "cus_9876",
    "tracking_number": "1Z999AA10123456784",
    "carrier": "ups",
    "estimated_delivery": "2025-01-20",
    "shipped_at": "2025-01-16T09:00:00Z"
  }
}
\`\`\`

### Shipping Fields

| Field                      | Type   | Description                        |
| -------------------------- | ------ | ---------------------------------- |
| \`data.tracking_number\`     | string | Carrier tracking number.           |
| \`data.carrier\`             | string | Shipping carrier identifier.       |
| \`data.estimated_delivery\`  | string | Estimated delivery date.           |
| \`data.shipped_at\`          | string | ISO 8601 ship timestamp.           |

---

## order.delivered

Fired when a delivery is confirmed.

\`\`\`json
{
  "id": "evt_ord_de_003",
  "type": "order.delivered",
  "created_at": "2025-01-19T14:30:00Z",
  "data": {
    "id": "ord_m1n2o3",
    "object": "order",
    "status": "delivered",
    "customer_id": "cus_9876",
    "tracking_number": "1Z999AA10123456784",
    "carrier": "ups",
    "delivered_at": "2025-01-19T14:30:00Z",
    "signed_by": "J. Smith"
  }
}
\`\`\`

### Delivery Fields

| Field              | Type   | Description                              |
| ------------------ | ------ | ---------------------------------------- |
| \`data.delivered_at\` | string | ISO 8601 confirmed delivery timestamp.  |
| \`data.signed_by\`    | string | Name of the person who signed, if any.  |

> **Tip:** Use the \`order.delivered\` event to trigger post-delivery flows such
> as feedback campaigns or loyalty point awards.
`)
}

// ── Product 4 — API Design Guidelines ────────────────────────────────────────

async function seedApiDesignGuidelines() {
  const product = await createProduct({
    name: "API Design Guidelines",
    slug: "api-design-guidelines",
    description: "Internal standards for designing consistent, developer-friendly APIs.",
    docType: "guideline",
    visibility: "internal",
    currentVersion: "v1.0.0",
  })

  // Category: Design Principles
  const principles = await seedCategory(
    product.id,
    "Design Principles",
    "design-principles",
    "Core principles for RESTful API design.",
  )

  await seedPage(principles.id, "RESTful Design", "restful-design", "guide", `# RESTful Design

These guidelines establish the conventions for designing consistent, intuitive
RESTful APIs across all services.

## Resource Naming

Resources are the fundamental concept in REST. Follow these rules:

- Use **nouns** for resource names, not verbs.
- Use **plural** forms for collection endpoints.
- Use **lowercase** with **hyphens** for multi-word resources.

### Examples

| ✅ Good                     | ❌ Bad                        |
| --------------------------- | ----------------------------- |
| \`GET /v1/payments\`          | \`GET /v1/getPayments\`        |
| \`GET /v1/payment-methods\`   | \`GET /v1/paymentMethods\`     |
| \`POST /v1/orders\`           | \`POST /v1/create-order\`      |

## HTTP Methods

Use HTTP methods according to their standard semantics:

| Method   | Usage                                   | Idempotent |
| -------- | --------------------------------------- | ---------- |
| \`GET\`    | Retrieve a resource or collection.      | ✅         |
| \`POST\`   | Create a new resource.                  | ❌         |
| \`PUT\`    | Replace an entire resource.             | ✅         |
| \`PATCH\`  | Partially update a resource.            | ❌         |
| \`DELETE\` | Remove a resource.                      | ✅         |

## Status Codes

Use meaningful HTTP status codes:

| Code | When to Use                                      |
| ---- | ------------------------------------------------ |
| 200  | Successful read or update.                       |
| 201  | Resource created successfully.                   |
| 204  | Successful delete with no response body.         |
| 400  | Client sent an invalid request.                  |
| 401  | Authentication required or failed.               |
| 403  | Authenticated but insufficient permissions.      |
| 404  | Resource not found.                              |
| 409  | Conflict (e.g. duplicate resource).              |
| 422  | Request understood but semantically invalid.     |
| 429  | Rate limit exceeded.                             |
| 500  | Unexpected server error.                         |

## Resource Relationships

For nested resources, use sub-resource paths:

\`\`\`
GET  /v1/orders/{orderId}/items
POST /v1/orders/{orderId}/items
GET  /v1/orders/{orderId}/items/{itemId}
\`\`\`

Limit nesting to **two levels maximum**. For deeper relationships, use
query parameters or links.

## HATEOAS

Where practical, include \`_links\` in responses to help clients discover
related resources:

\`\`\`json
{
  "id": "pay_abc",
  "status": "succeeded",
  "_links": {
    "self": { "href": "/v1/payments/pay_abc" },
    "refund": { "href": "/v1/payments/pay_abc/refund" },
    "customer": { "href": "/v1/customers/cus_123" }
  }
}
\`\`\`

This is recommended but not mandatory for all endpoints.
`)

  await seedPage(principles.id, "Naming Conventions", "naming-conventions", "guide", `# Naming Conventions

Consistent naming reduces cognitive load and makes APIs predictable. These
conventions apply to all public and internal APIs.

## URL Structure

- Use **lowercase** letters only.
- Separate words with **hyphens** (\`-\`), not underscores or camelCase.
- Use **plural nouns** for collections.

\`\`\`
✅  /v1/payment-methods
✅  /v1/shipping-addresses
❌  /v1/paymentMethods
❌  /v1/shipping_addresses
\`\`\`

## Path Parameters

Use descriptive names in **camelCase** within curly braces:

\`\`\`
/v1/orders/{orderId}/items/{itemId}
\`\`\`

## Query Parameters

Use **camelCase** for query parameter names:

\`\`\`
GET /v1/payments?createdAfter=2025-01-01&sortBy=amount&sortOrder=desc
\`\`\`

## JSON Field Names

All JSON request and response bodies must use **camelCase**:

\`\`\`json
{
  "id": "pay_abc",
  "totalAmount": 5000,
  "createdAt": "2025-01-15T10:30:00Z",
  "customerEmail": "jane@example.com"
}
\`\`\`

### Do Not

- Use \`snake_case\` — it is common in other ecosystems but we standardize on
  camelCase for consistency.
- Use abbreviations — prefer \`customerId\` over \`custId\`.
- Use generic names — prefer \`paymentStatus\` over \`status\` in nested objects.

## Versioning

### URL Versioning (Preferred)

Include the major version in the URL path:

\`\`\`
/v1/payments
/v2/payments
\`\`\`

### Header Versioning (Alternative)

For cases where URL versioning is impractical, use the \`API-Version\` header:

\`\`\`http
GET /payments HTTP/1.1
API-Version: 2025-01-15
\`\`\`

### Version Policy

- **Major** version changes (v1 → v2) indicate breaking changes.
- **Minor** and **patch** changes are backward-compatible and do not require a
  new URL version.
- Deprecated versions are supported for **12 months** after the successor is
  released.

## Enum Values

Use **UPPER_SNAKE_CASE** for enum values in responses:

\`\`\`json
{
  "status": "IN_PROGRESS",
  "paymentMethod": "CREDIT_CARD"
}
\`\`\`

This makes enum values visually distinct from regular string fields.
`)

  // Category: Best Practices
  const bestPractices = await seedCategory(
    product.id,
    "Best Practices",
    "best-practices",
    "Practical patterns for error handling, pagination, and filtering.",
  )

  await seedPage(bestPractices.id, "Error Handling", "error-handling", "guide", `# Error Handling

A consistent error format across all APIs makes it easier for consumers to
build robust integrations. Every error response must follow this structure.

## Standard Error Response

\`\`\`json
{
  "error": {
    "code": "validation_failed",
    "message": "The request body contains invalid fields.",
    "details": [
      {
        "field": "amount",
        "issue": "Must be a positive integer.",
        "value": -100
      },
      {
        "field": "currency",
        "issue": "Unsupported currency code.",
        "value": "xyz"
      }
    ],
    "request_id": "req_abc123",
    "documentation_url": "https://docs.example.com/errors/validation_failed"
  }
}
\`\`\`

## Error Fields

| Field              | Type   | Required | Description                                |
| ------------------ | ------ | -------- | ------------------------------------------ |
| \`code\`             | string | ✅       | Machine-readable error code.               |
| \`message\`          | string | ✅       | Human-readable summary.                    |
| \`details\`          | array  | —        | Field-level validation errors.             |
| \`request_id\`       | string | ✅       | Unique ID for tracing in logs.             |
| \`documentation_url\`| string | —        | Link to error documentation.               |

## Common Error Codes

| Code                   | HTTP Status | Description                          |
| ---------------------- | ----------- | ------------------------------------ |
| \`validation_failed\`    | 400         | One or more fields are invalid.      |
| \`authentication_required\`| 401       | No valid credentials provided.       |
| \`forbidden\`            | 403         | Insufficient permissions.            |
| \`not_found\`            | 404         | The requested resource doesn't exist.|
| \`conflict\`             | 409         | Resource already exists or conflict. |
| \`rate_limit_exceeded\`  | 429         | Too many requests.                   |
| \`internal_error\`       | 500         | An unexpected server error occurred. |

## Guidelines

### Always Include \`request_id\`

Every response — success or error — should include a \`request_id\`. This makes
it possible to correlate client reports with server-side logs.

### Use Specific Error Codes

Prefer specific codes over generic ones:

| ✅ Good                      | ❌ Bad              |
| ---------------------------- | ------------------- |
| \`payment_already_refunded\`   | \`bad_request\`      |
| \`insufficient_funds\`         | \`error\`            |
| \`email_already_registered\`   | \`conflict\`         |

### Validation Error Details

When returning a 400 for validation failures, include the \`details\` array
with one entry per invalid field. Each entry must specify:

- \`field\` — the JSON path to the invalid field.
- \`issue\` — what is wrong.
- \`value\` — the value that was submitted (omit for sensitive fields like
  passwords).

### Do Not Expose Internal Details

Never include stack traces, database errors, or internal file paths in error
responses. Log them server-side and reference the \`request_id\` instead.
`)

  await seedPage(bestPractices.id, "Pagination & Filtering", "pagination-and-filtering", "guide", `# Pagination & Filtering

All list endpoints must support pagination. This page covers the two supported
pagination strategies and the conventions for filtering and sorting.

## Offset Pagination

Use **offset-based** pagination for simple use cases where clients need to
jump to arbitrary pages.

### Parameters

| Parameter | Type    | Default | Description                      |
| --------- | ------- | ------- | -------------------------------- |
| \`limit\`   | integer | 20      | Results per page (max 100).      |
| \`offset\`  | integer | 0       | Number of records to skip.       |

### Example

\`\`\`bash
GET /v1/payments?limit=20&offset=40
\`\`\`

### Response Envelope

\`\`\`json
{
  "data": [...],
  "pagination": {
    "total_count": 142,
    "limit": 20,
    "offset": 40,
    "has_more": true
  }
}
\`\`\`

## Cursor Pagination

Use **cursor-based** pagination for large datasets or real-time feeds where
consistent ordering is critical.

### Parameters

| Parameter | Type   | Description                                  |
| --------- | ------ | -------------------------------------------- |
| \`limit\`   | integer| Results per page (max 100).                  |
| \`cursor\`  | string | Opaque cursor from the previous response.    |

### Example

\`\`\`bash
GET /v1/events?limit=50&cursor=eyJpZCI6ImV2dF8xMjM0In0
\`\`\`

### Response Envelope

\`\`\`json
{
  "data": [...],
  "pagination": {
    "next_cursor": "eyJpZCI6ImV2dF81Njc4In0",
    "has_more": true
  }
}
\`\`\`

> **When to use which:** Prefer cursor pagination for events, audit logs, and
> any dataset that changes frequently. Use offset pagination for stable lists
> like products or categories.

## Filtering

Use query parameters to filter list results. Follow these conventions:

\`\`\`bash
# Exact match
GET /v1/payments?status=succeeded&currency=usd

# Date ranges (inclusive)
GET /v1/payments?createdAfter=2025-01-01T00:00:00Z&createdBefore=2025-02-01T00:00:00Z

# Search (partial match)
GET /v1/customers?search=jane
\`\`\`

### Filter Naming

- Use the **field name** directly: \`?status=active\`.
- For range filters, suffix with \`After\` / \`Before\`: \`?createdAfter=...\`.
- For search, use \`search\` as the parameter name.

## Sorting

Support sorting with \`sortBy\` and \`sortOrder\` parameters:

\`\`\`bash
GET /v1/payments?sortBy=createdAt&sortOrder=desc
\`\`\`

| Parameter   | Values                       | Default     |
| ----------- | ---------------------------- | ----------- |
| \`sortBy\`    | Any sortable field name.     | \`createdAt\` |
| \`sortOrder\` | \`asc\` or \`desc\`.              | \`desc\`      |

## Example: Full Query

\`\`\`bash
GET /v1/payments?status=succeeded&currency=usd&createdAfter=2025-01-01T00:00:00Z&sortBy=amount&sortOrder=desc&limit=25&offset=0
\`\`\`

This returns the first 25 succeeded USD payments created after January 1st,
sorted by amount descending.
`)
}

// ── Public Bootstrap Function ────────────────────────────────────────────────

export async function bootstrapSampleProducts(): Promise<void> {
  await seedPaymentServiceApi()
  await seedContentManagementApi()
  await seedEventNotifications()
  await seedApiDesignGuidelines()
}
