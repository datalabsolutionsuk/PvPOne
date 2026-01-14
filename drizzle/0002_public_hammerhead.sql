CREATE TYPE "public"."dus_status" AS ENUM('Waiting', 'Approved');--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"query_id" uuid NOT NULL,
	"content" text NOT NULL,
	"sender_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "queries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"title" text NOT NULL,
	"status" text DEFAULT 'Open' NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "dus_expected_receipt_date" date;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "dus_status" "dus_status" DEFAULT 'Waiting';--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "task_id" uuid;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "updated_by" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "owner" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "owner" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_query_id_queries_id_fk" FOREIGN KEY ("query_id") REFERENCES "public"."queries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_user_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "queries" ADD CONSTRAINT "queries_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "queries" ADD CONSTRAINT "queries_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;