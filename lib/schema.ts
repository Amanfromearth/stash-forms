import {
  pgTable,
  uuid,
  jsonb,
  timestamp,
  varchar,
  index,
} from "drizzle-orm/pg-core"

export const submissions = pgTable(
  "submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
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
  (table) => [index("submissions_submitted_at_idx").on(table.submittedAt)]
)

export type Submission = typeof submissions.$inferSelect
export type NewSubmission = typeof submissions.$inferInsert
