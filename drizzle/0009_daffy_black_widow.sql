ALTER TABLE "apis" ADD COLUMN "operation_id" text;--> statement-breakpoint
ALTER TABLE "apis" ADD COLUMN "summary" text;--> statement-breakpoint
ALTER TABLE "apis" ADD COLUMN "servers" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "apis" ADD COLUMN "info" jsonb;--> statement-breakpoint
ALTER TABLE "apis" ADD COLUMN "response_headers" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "apis" ADD COLUMN "security_schemes" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "apis" ADD COLUMN "schemas" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "apis" ADD COLUMN "rate_limiting" jsonb;--> statement-breakpoint
ALTER TABLE "apis" ADD COLUMN "pagination" jsonb;--> statement-breakpoint
ALTER TABLE "apis" ADD COLUMN "links" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "apis" ADD COLUMN "callbacks" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "apis" ADD COLUMN "tags_meta" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "apis" ADD COLUMN "external_docs" jsonb;