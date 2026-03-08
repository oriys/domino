CREATE TYPE "public"."drift_status" AS ENUM('open', 'resolved', 'ignored');--> statement-breakpoint
CREATE TYPE "public"."release_bundle_status" AS ENUM('draft', 'scheduled', 'published', 'rolled_back', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."snippet_scope" AS ENUM('global', 'product', 'api');--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'schedule';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'rollback';--> statement-breakpoint
CREATE TABLE "doc_drift_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"api_id" uuid NOT NULL,
	"doc_page_id" uuid NOT NULL,
	"bundle_id" uuid,
	"review_request_id" uuid,
	"status" "drift_status" DEFAULT 'open' NOT NULL,
	"severity" text DEFAULT 'warning' NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"reasons" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"impacted_blocks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "example_sets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"api_id" uuid,
	"request_body_override" text,
	"response_body_override" text,
	"created_by" text DEFAULT 'system' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "example_sets_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "release_bundle_docs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bundle_id" uuid NOT NULL,
	"doc_page_id" uuid NOT NULL,
	"doc_page_version_id" uuid,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"page_type" "page_type" DEFAULT 'custom' NOT NULL,
	"status" "page_status" DEFAULT 'draft' NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "release_bundles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"api_id" uuid NOT NULL,
	"api_release_id" uuid,
	"version" text NOT NULL,
	"release_notes" text DEFAULT '' NOT NULL,
	"notify_subscribers" boolean DEFAULT true NOT NULL,
	"status" "release_bundle_status" DEFAULT 'draft' NOT NULL,
	"created_by" text DEFAULT 'system' NOT NULL,
	"scheduled_for" timestamp with time zone,
	"published_at" timestamp with time zone,
	"rolled_back_from_bundle_id" uuid,
	"api_snapshot" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reusable_snippets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"scope" "snippet_scope" DEFAULT 'global' NOT NULL,
	"product_id" uuid,
	"api_id" uuid,
	"content" text DEFAULT '' NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_by" text DEFAULT 'system' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reusable_snippets_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "review_requests" ADD COLUMN "assigned_by" text;--> statement-breakpoint
ALTER TABLE "review_requests" ADD COLUMN "due_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "review_requests" ADD COLUMN "reminder_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "review_requests" ADD COLUMN "escalates_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "review_requests" ADD COLUMN "escalated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "review_requests" ADD COLUMN "bundle_id" uuid;--> statement-breakpoint
ALTER TABLE "doc_drift_alerts" ADD CONSTRAINT "doc_drift_alerts_api_id_apis_id_fk" FOREIGN KEY ("api_id") REFERENCES "public"."apis"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doc_drift_alerts" ADD CONSTRAINT "doc_drift_alerts_doc_page_id_doc_pages_id_fk" FOREIGN KEY ("doc_page_id") REFERENCES "public"."doc_pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doc_drift_alerts" ADD CONSTRAINT "doc_drift_alerts_bundle_id_release_bundles_id_fk" FOREIGN KEY ("bundle_id") REFERENCES "public"."release_bundles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doc_drift_alerts" ADD CONSTRAINT "doc_drift_alerts_review_request_id_review_requests_id_fk" FOREIGN KEY ("review_request_id") REFERENCES "public"."review_requests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "example_sets" ADD CONSTRAINT "example_sets_api_id_apis_id_fk" FOREIGN KEY ("api_id") REFERENCES "public"."apis"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "release_bundle_docs" ADD CONSTRAINT "release_bundle_docs_bundle_id_release_bundles_id_fk" FOREIGN KEY ("bundle_id") REFERENCES "public"."release_bundles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "release_bundle_docs" ADD CONSTRAINT "release_bundle_docs_doc_page_id_doc_pages_id_fk" FOREIGN KEY ("doc_page_id") REFERENCES "public"."doc_pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "release_bundle_docs" ADD CONSTRAINT "release_bundle_docs_doc_page_version_id_doc_page_versions_id_fk" FOREIGN KEY ("doc_page_version_id") REFERENCES "public"."doc_page_versions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "release_bundles" ADD CONSTRAINT "release_bundles_api_id_apis_id_fk" FOREIGN KEY ("api_id") REFERENCES "public"."apis"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "release_bundles" ADD CONSTRAINT "release_bundles_api_release_id_api_releases_id_fk" FOREIGN KEY ("api_release_id") REFERENCES "public"."api_releases"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reusable_snippets" ADD CONSTRAINT "reusable_snippets_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reusable_snippets" ADD CONSTRAINT "reusable_snippets_api_id_apis_id_fk" FOREIGN KEY ("api_id") REFERENCES "public"."apis"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_requests" ADD CONSTRAINT "review_requests_bundle_id_release_bundles_id_fk" FOREIGN KEY ("bundle_id") REFERENCES "public"."release_bundles"("id") ON DELETE set null ON UPDATE no action;