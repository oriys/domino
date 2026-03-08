CREATE TABLE "doc_collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"order_no" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "doc_collections_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "collection_id" uuid;--> statement-breakpoint
INSERT INTO "doc_collections" ("name", "slug", "description", "order_no")
SELECT
	seed."name",
	seed."slug",
	'',
	ROW_NUMBER() OVER (ORDER BY seed."slug") - 1
FROM (
	SELECT DISTINCT
		CASE
			WHEN "doc_type" = 'rest_api' THEN 'REST API'
			WHEN "doc_type" = 'graphql_api' THEN 'GraphQL'
			WHEN "doc_type" = 'webhook' THEN 'Webhook'
			WHEN "doc_type" = 'collection' THEN 'Collection'
			ELSE 'Guideline'
		END AS "name",
		CASE
			WHEN "doc_type" = 'rest_api' THEN 'rest-api'
			WHEN "doc_type" = 'graphql_api' THEN 'graphql'
			WHEN "doc_type" = 'webhook' THEN 'webhook'
			WHEN "doc_type" = 'collection' THEN 'collection'
			ELSE 'guideline'
		END AS "slug"
	FROM "products"
) AS seed;--> statement-breakpoint
UPDATE "products"
SET "collection_id" = "doc_collections"."id"
FROM "doc_collections"
WHERE "doc_collections"."slug" = CASE
	WHEN "products"."doc_type" = 'rest_api' THEN 'rest-api'
	WHEN "products"."doc_type" = 'graphql_api' THEN 'graphql'
	WHEN "products"."doc_type" = 'webhook' THEN 'webhook'
	WHEN "products"."doc_type" = 'collection' THEN 'collection'
	ELSE 'guideline'
END;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_collection_id_doc_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."doc_collections"("id") ON DELETE set null ON UPDATE no action;
