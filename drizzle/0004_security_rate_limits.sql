CREATE TABLE "security_rate_limits" (
	"key" varchar(96) PRIMARY KEY NOT NULL,
	"attempts" integer NOT NULL,
	"reset_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX "security_rate_limits_reset_at_idx" ON "security_rate_limits" USING btree ("reset_at");