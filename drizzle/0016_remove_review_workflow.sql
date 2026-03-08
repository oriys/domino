DELETE FROM "audit_logs"
WHERE "action" IN ('submit_review', 'approve', 'reject');--> statement-breakpoint

DROP TABLE IF EXISTS "review_comments";--> statement-breakpoint
DROP TABLE IF EXISTS "review_requests";--> statement-breakpoint
DROP TABLE IF EXISTS "review_rules";--> statement-breakpoint

UPDATE "doc_pages"
SET "status" = 'draft'
WHERE "status" IN ('in_review', 'approved');--> statement-breakpoint

UPDATE "users"
SET "role" = 'author'
WHERE "role" = 'reviewer';--> statement-breakpoint

ALTER TABLE "doc_pages" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "doc_pages" ALTER COLUMN "status" TYPE text USING "status"::text;--> statement-breakpoint
CREATE TYPE "public"."page_status_new" AS ENUM('draft', 'published');--> statement-breakpoint
ALTER TABLE "doc_pages" ALTER COLUMN "status" TYPE "public"."page_status_new" USING "status"::"public"."page_status_new";--> statement-breakpoint
DROP TYPE "public"."page_status";--> statement-breakpoint
ALTER TYPE "public"."page_status_new" RENAME TO "page_status";--> statement-breakpoint
ALTER TABLE "doc_pages" ALTER COLUMN "status" SET DEFAULT 'draft';--> statement-breakpoint

ALTER TABLE "audit_logs" ALTER COLUMN "action" TYPE text USING "action"::text;--> statement-breakpoint
CREATE TYPE "public"."audit_action_new" AS ENUM('create', 'update', 'delete', 'publish', 'unpublish', 'import', 'schedule', 'rollback');--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "action" TYPE "public"."audit_action_new" USING "action"::"public"."audit_action_new";--> statement-breakpoint
DROP TYPE "public"."audit_action";--> statement-breakpoint
ALTER TYPE "public"."audit_action_new" RENAME TO "audit_action";--> statement-breakpoint

ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" TYPE text USING "role"::text;--> statement-breakpoint
CREATE TYPE "public"."user_role_new" AS ENUM('author', 'publisher', 'admin');--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."user_role_new" USING "role"::"public"."user_role_new";--> statement-breakpoint
DROP TYPE "public"."user_role";--> statement-breakpoint
ALTER TYPE "public"."user_role_new" RENAME TO "user_role";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'author';--> statement-breakpoint

DROP TYPE IF EXISTS "public"."review_status";--> statement-breakpoint
DROP TYPE IF EXISTS "public"."review_stage";--> statement-breakpoint
DROP TYPE IF EXISTS "public"."rule_severity";
