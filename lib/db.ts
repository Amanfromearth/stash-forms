import { drizzle } from "drizzle-orm/neon-http"
import { neon } from "@neondatabase/serverless"
import * as schema from "./schema"

const globalForDb = globalThis as unknown as {
  db: ReturnType<typeof drizzle> | undefined
}

function createDb() {
  const sql = neon(process.env.DATABASE_URL!)
  return drizzle(sql, { schema })
}

export const db = globalForDb.db ?? createDb()

if (process.env.NODE_ENV !== "production") {
  globalForDb.db = db
}
