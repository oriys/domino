import { sql } from "drizzle-orm"
import { boolean, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

import type { ExampleVariant } from "@/lib/api-platform/types"

// ── Enums ────────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", ["author", "publisher", "admin"])
export const visibilityEnum = pgEnum("visibility", ["public", "private", "partner", "internal"])
export const pageTypeEnum = pgEnum("page_type", ["overview", "guide", "api_reference", "changelog", "custom"])
export const pageStatusEnum = pgEnum("page_status", ["draft", "published"])
export const docTypeEnum = pgEnum("doc_type", ["rest_api", "graphql_api", "webhook", "collection", "guideline"])
export const auditActionEnum = pgEnum("audit_action", ["create", "update", "delete", "publish", "unpublish", "import", "schedule", "rollback"])
export const snippetScopeEnum = pgEnum("snippet_scope", ["global", "product"])

// ── Users ────────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: userRoleEnum("role").notNull().default("author"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

// ── Collections / Products / Categories ─────────────────────────────────────

export const docCollections = pgTable("doc_collections", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull().default(""),
  orderNo: integer("order_no").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull().default(""),
  docType: docTypeEnum("doc_type").notNull().default("guideline"),
  collectionId: uuid("collection_id").references(() => docCollections.id, { onDelete: "set null" }),
  visibility: visibilityEnum("visibility").notNull().default("public"),
  icon: text("icon"),
  orderNo: integer("order_no").notNull().default(0),
  currentVersion: text("current_version").notNull().default("v1.0.0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  parentId: uuid("parent_id"),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description").notNull().default(""),
  orderNo: integer("order_no").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

// ── Document Pages ───────────────────────────────────────────────────────────

export const docPages = pgTable("doc_pages", {
  id: uuid("id").defaultRandom().primaryKey(),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  pageType: pageTypeEnum("page_type").notNull().default("custom"),
  content: text("content").notNull().default(""),
  publishedContent: text("published_content"),
  status: pageStatusEnum("status").notNull().default("draft"),
  orderNo: integer("order_no").notNull().default(0),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const docPageVersions = pgTable("doc_page_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  pageId: uuid("page_id")
    .notNull()
    .references(() => docPages.id, { onDelete: "cascade" }),
  version: text("version").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  publishedBy: text("published_by").notNull().default("system"),
  changelog: text("changelog").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

// ── Audit ────────────────────────────────────────────────────────────────────

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  actor: text("actor").notNull().default("system"),
  action: auditActionEnum("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: uuid("resource_id"),
  summary: text("summary").notNull().default(""),
  beforeSnapshot: jsonb("before_snapshot"),
  afterSnapshot: jsonb("after_snapshot"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

// ── Reusable Content ─────────────────────────────────────────────────────────

export const reusableSnippets = pgTable("reusable_snippets", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  scope: snippetScopeEnum("scope").notNull().default("global"),
  productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
  content: text("content").notNull().default(""),
  tags: jsonb("tags").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  createdBy: text("created_by").notNull().default("system"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const exampleSets = pgTable("example_sets", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  variants: jsonb("variants").$type<ExampleVariant[]>().notNull().default(sql`'[]'::jsonb`),
  createdBy: text("created_by").notNull().default("system"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

// ── Glossary ─────────────────────────────────────────────────────────────────

export const glossaryTerms = pgTable("glossary_terms", {
  id: uuid("id").defaultRandom().primaryKey(),
  term: text("term").notNull(),
  definition: text("definition").notNull().default(""),
  category: text("category").notNull().default(""),
  aliases: jsonb("aliases").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  createdBy: text("created_by").notNull().default("system"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})
