import {
  pgTable,
  uuid,
  jsonb,
  timestamp,
  varchar,
  text,
  index,
  boolean,
  integer,
} from "drizzle-orm/pg-core"

// Published question sets are immutable. Edits create another version.
export const formVersions = pgTable("form_versions", {
  version: integer("version")
    .primaryKey()
    .generatedByDefaultAsIdentity({ startWith: 3 }),
  config: jsonb("config").$type<import("./form-config").FormConfig>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
})

export const submissions = pgTable(
  "submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: varchar("session_id", { length: 36 }).unique(),
    formVersion: integer("form_version")
      .default(1)
      .notNull()
      .references(() => formVersions.version),
    isPartial: boolean("is_partial").default(false).notNull(),
    answers: jsonb("answers").$type<Record<string, unknown>>().notNull(),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    ipHash: varchar("ip_hash", { length: 64 }),
    metadata: jsonb("metadata")
      .$type<{ userAgent?: string }>()
      .default({})
      .notNull(),
  },
  (table) => [
    index("submissions_session_id_idx").on(table.sessionId),
    index("submissions_submitted_at_idx").on(table.submittedAt),
    index("submissions_form_version_idx").on(table.formVersion),
  ]
)

export type Submission = typeof submissions.$inferSelect
export type NewSubmission = typeof submissions.$inferInsert

// Security counters are isolated from survey responses and historical analytics.
export const securityRateLimits = pgTable(
  "security_rate_limits",
  {
    key: varchar("key", { length: 96 }).primaryKey(),
    attempts: integer("attempts").notNull(),
    resetAt: timestamp("reset_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("security_rate_limits_reset_at_idx").on(table.resetAt)]
)

export const formConfig = pgTable("form_config", {
  id: text("id").primaryKey().default("default"),
  config: jsonb("config").$type<import("./form-config").FormConfig>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
})
