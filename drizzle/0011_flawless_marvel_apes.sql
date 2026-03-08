CREATE TYPE "public"."review_status" AS ENUM('pending', 'approved', 'rejected', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('author', 'reviewer', 'publisher', 'admin');--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'submit_review';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'approve';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'reject';--> statement-breakpoint
ALTER TYPE "public"."page_status" ADD VALUE 'in_review' BEFORE 'published';--> statement-breakpoint
ALTER TYPE "public"."page_status" ADD VALUE 'approved' BEFORE 'published';--> statement-breakpoint
CREATE TABLE "review_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_id" uuid NOT NULL,
	"author" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" uuid NOT NULL,
	"resource_name" text NOT NULL,
	"submitted_by" text NOT NULL,
	"assigned_to" text,
	"status" "review_status" DEFAULT 'pending' NOT NULL,
	"snapshot" jsonb,
	"previous_snapshot" jsonb,
	"submission_note" text DEFAULT '' NOT NULL,
	"resolution_note" text,
	"resolved_by" text,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"role" "user_role" DEFAULT 'author' NOT NULL,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "apis" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "apis" ALTER COLUMN "status" SET DEFAULT 'draft'::text;--> statement-breakpoint
UPDATE "apis" SET "status" = 'in_review' WHERE "status" = 'review';--> statement-breakpoint
DROP TYPE "public"."api_status";--> statement-breakpoint
CREATE TYPE "public"."api_status" AS ENUM('draft', 'in_review', 'approved', 'published');--> statement-breakpoint
ALTER TABLE "apis" ALTER COLUMN "status" SET DEFAULT 'draft'::"public"."api_status";--> statement-breakpoint
ALTER TABLE "apis" ALTER COLUMN "status" SET DATA TYPE "public"."api_status" USING "status"::"public"."api_status";--> statement-breakpoint
ALTER TABLE "review_comments" ADD CONSTRAINT "review_comments_review_id_review_requests_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."review_requests"("id") ON DELETE cascade ON UPDATE no action;
