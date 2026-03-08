CREATE EXTENSION IF NOT EXISTS "pgcrypto";--> statement-breakpoint
CREATE TYPE "public"."api_status" AS ENUM('draft', 'review', 'published');--> statement-breakpoint
CREATE TYPE "public"."http_method" AS ENUM('GET', 'POST', 'PUT', 'DELETE', 'PATCH');--> statement-breakpoint
CREATE TABLE "apis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"version" text NOT NULL,
	"status" "api_status" DEFAULT 'draft' NOT NULL,
	"method" "http_method" DEFAULT 'GET' NOT NULL,
	"path" text NOT NULL,
	"description" text NOT NULL,
	"request_body" text,
	"response_body" text,
	"headers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"query_params" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
