import {
  pgTable,
  uuid,
  jsonb,
  timestamp,
  varchar,
  text,
  index,
  boolean,
} from "drizzle-orm/pg-core"

export const submissions = pgTable(
  "submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: varchar("session_id", { length: 36 }).unique(),
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
  ]
)

export type Submission = typeof submissions.$inferSelect
export type NewSubmission = typeof submissions.$inferInsert

export const formConfig = pgTable("form_config", {
  id: text("id").primaryKey().default("default"),
  config: jsonb("config").$type<import("./form-config").FormConfig>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
})
