-- Restore the initial migration referenced by the existing migration journal.
CREATE TABLE IF NOT EXISTS "form_config" (
  "id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
  "config" jsonb NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "submissions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "session_id" varchar(36),
  "is_partial" boolean DEFAULT false NOT NULL,
  "answers" jsonb NOT NULL,
  "submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
  "ip_hash" varchar(64),
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  CONSTRAINT "submissions_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "submissions_session_id_idx" ON "submissions" USING btree ("session_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "submissions_submitted_at_idx" ON "submissions" USING btree ("submitted_at");
