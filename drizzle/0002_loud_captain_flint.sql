ALTER TABLE "apis" ADD COLUMN "request_fields" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "apis" ADD COLUMN "response_fields" jsonb DEFAULT '[]'::jsonb NOT NULL;