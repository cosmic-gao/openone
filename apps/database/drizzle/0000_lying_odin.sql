CREATE SCHEMA "1000_platform";
--> statement-breakpoint
CREATE TABLE "1000_platform"."migration_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"app_id" text NOT NULL,
	"filename" text NOT NULL,
	"executed_at" timestamp DEFAULT now() NOT NULL,
	"success" boolean DEFAULT true NOT NULL,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "1000_platform"."schema_registry" (
	"id" serial PRIMARY KEY NOT NULL,
	"app_id" text NOT NULL,
	"schema_name" text NOT NULL,
	"status" text DEFAULT 'creating' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "schema_registry_app_id_unique" UNIQUE("app_id"),
	CONSTRAINT "schema_registry_schema_name_unique" UNIQUE("schema_name")
);
