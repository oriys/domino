ALTER TABLE "doc_pages" DROP COLUMN IF EXISTS "api_id";--> statement-breakpoint
ALTER TABLE "reusable_snippets" DROP COLUMN IF EXISTS "api_id";--> statement-breakpoint
ALTER TABLE "review_requests" DROP COLUMN IF EXISTS "bundle_id";--> statement-breakpoint

ALTER TABLE "example_sets" ADD COLUMN IF NOT EXISTS "variants" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "example_sets" DROP COLUMN IF EXISTS "api_id";--> statement-breakpoint
ALTER TABLE "example_sets" DROP COLUMN IF EXISTS "request_body_override";--> statement-breakpoint
ALTER TABLE "example_sets" DROP COLUMN IF EXISTS "response_body_override";--> statement-breakpoint

ALTER TABLE "reusable_snippets" ALTER COLUMN "scope" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "reusable_snippets" ALTER COLUMN "scope" TYPE text;--> statement-breakpoint
UPDATE "reusable_snippets" SET "scope" = 'global' WHERE "scope" = 'api';--> statement-breakpoint
DROP TYPE IF EXISTS "public"."snippet_scope";--> statement-breakpoint
CREATE TYPE "public"."snippet_scope" AS ENUM('global', 'product');--> statement-breakpoint
ALTER TABLE "reusable_snippets" ALTER COLUMN "scope" TYPE "public"."snippet_scope" USING "scope"::"public"."snippet_scope";--> statement-breakpoint
ALTER TABLE "reusable_snippets" ALTER COLUMN "scope" SET DEFAULT 'global';--> statement-breakpoint

DROP TABLE IF EXISTS "release_bundle_docs";--> statement-breakpoint
DROP TABLE IF EXISTS "doc_drift_alerts";--> statement-breakpoint
DROP TABLE IF EXISTS "release_bundles";--> statement-breakpoint
DROP TABLE IF EXISTS "api_releases";--> statement-breakpoint
DROP TABLE IF EXISTS "apis";--> statement-breakpoint

DROP TYPE IF EXISTS "public"."release_bundle_status";--> statement-breakpoint
DROP TYPE IF EXISTS "public"."drift_status";--> statement-breakpoint
DROP TYPE IF EXISTS "public"."api_status";--> statement-breakpoint
DROP TYPE IF EXISTS "public"."http_method";--> statement-breakpoint
