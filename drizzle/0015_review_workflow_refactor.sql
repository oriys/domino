DO $$ BEGIN
 CREATE TYPE "public"."review_stage" AS ENUM('editorial', 'technical', 'style', 'compliance');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

ALTER TABLE "review_requests" ADD COLUMN IF NOT EXISTS "workflow_id" uuid;--> statement-breakpoint
ALTER TABLE "review_requests" ADD COLUMN IF NOT EXISTS "stage" "public"."review_stage";--> statement-breakpoint
ALTER TABLE "review_requests" ADD COLUMN IF NOT EXISTS "required" boolean;--> statement-breakpoint
ALTER TABLE "review_requests" ADD COLUMN IF NOT EXISTS "order_no" integer;--> statement-breakpoint
ALTER TABLE "review_requests" ADD COLUMN IF NOT EXISTS "submission_meta" jsonb;--> statement-breakpoint

UPDATE "review_requests"
SET
  "workflow_id" = COALESCE("workflow_id", "id"),
  "stage" = COALESCE("stage", 'technical'::"public"."review_stage"),
  "required" = COALESCE("required", true),
  "order_no" = COALESCE("order_no", 0),
  "submission_meta" = COALESCE(
    "submission_meta",
    jsonb_build_object(
      'documentKind', 'tutorial',
      'primaryAudience', 'internal',
      'changeType', 'update',
      'riskLevel', 'standard',
      'relatedArtifacts', '[]'::jsonb,
      'summary', CASE
        WHEN "submission_note" IS NULL OR btrim("submission_note") = '' THEN 'Legacy review submission.'
        ELSE "submission_note"
      END,
      'checklist', jsonb_build_object(
        'contentComplete', true,
        'factsChecked', true,
        'structureChecked', true,
        'examplesUpdated', true,
        'constraintsDocumented', true,
        'styleChecked', true,
        'linksChecked', true,
        'sensitiveInfoRemoved', true
      )
    )
  );--> statement-breakpoint

ALTER TABLE "review_requests" ALTER COLUMN "workflow_id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "review_requests" ALTER COLUMN "workflow_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "review_requests" ALTER COLUMN "stage" SET DEFAULT 'technical';--> statement-breakpoint
ALTER TABLE "review_requests" ALTER COLUMN "stage" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "review_requests" ALTER COLUMN "required" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "review_requests" ALTER COLUMN "required" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "review_requests" ALTER COLUMN "order_no" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "review_requests" ALTER COLUMN "order_no" SET NOT NULL;--> statement-breakpoint
