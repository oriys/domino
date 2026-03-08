ALTER TYPE "public"."http_method" ADD VALUE 'HEAD';--> statement-breakpoint
ALTER TYPE "public"."http_method" ADD VALUE 'OPTIONS';--> statement-breakpoint
ALTER TABLE "apis" ADD COLUMN "content_type" text DEFAULT 'application/json' NOT NULL;--> statement-breakpoint
ALTER TABLE "apis" ADD COLUMN "path_params" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "apis" ADD COLUMN "cookies" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "apis" ADD COLUMN "auth" jsonb DEFAULT '{"type":"none"}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "apis" ADD COLUMN "error_responses" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "apis" ADD COLUMN "tags" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "apis" ADD COLUMN "deprecated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "apis" ADD COLUMN "sunset_date" text;--> statement-breakpoint
ALTER TABLE "apis" ADD COLUMN "replacement_api_path" text;