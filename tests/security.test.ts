import { test } from "bun:test"
import assert from "node:assert/strict"
import { createHmac } from "node:crypto"
import { readFile } from "node:fs/promises"
import { PGlite } from "@electric-sql/pglite"
import { drizzle } from "drizzle-orm/pglite"
import { sql } from "drizzle-orm"
import {
  createAdminSession,
  validateAdminSession,
  ADMIN_SESSION_MAX_AGE,
} from "../lib/admin-session"
import { escapeCSV } from "../lib/csv"
import { consumeRateLimit, REQUEST_LIMITS } from "../lib/rate-limit"
import { getRateLimitIdentity } from "../lib/request-identity"
import {
  createVisitorIdentity,
  readVisitorIdentity,
} from "../lib/visitor-identity"

test("existing signed admin sessions remain valid; forged, expired and malformed tokens fail closed", () => {
  const now = 1794300000000
  const secret = "test-secret"
  const legacyToken = `${now}.${createHmac("sha256", secret).update(String(now)).digest("hex")}`
  assert.equal(validateAdminSession(legacyToken, secret, now + 1), true)
  assert.equal(createAdminSession(secret, now), legacyToken)
  assert.equal(
    validateAdminSession(
      legacyToken,
      secret,
      now + ADMIN_SESSION_MAX_AGE * 1000
    ),
    false
  )
  assert.equal(validateAdminSession(legacyToken, "wrong-secret", now), false)
  assert.equal(
    validateAdminSession(createAdminSession(secret, now + 1), secret, now),
    false
  )
  for (const token of [
    undefined,
    "",
    "bad",
    `NaN.${"a".repeat(64)}`,
    `${now}.${"é".repeat(64)}`,
    `${legacyToken}.extra`,
  ]) {
    assert.equal(validateAdminSession(token, secret, now), false)
  }
})

test("CSV neutralizes formulas and control prefixes, preserving normal values and CSV structure", () => {
  for (const value of [
    "=1+1",
    "+SUM(A1:A2)",
    "-1+2",
    "@SUM(A1)",
    "  =1+1",
    "\t=1+1",
    "\r=1+1",
    "\n=1+1",
    "＝1+1",
    "＋1",
    "－1",
    "＠x",
  ]) {
    const output = escapeCSV(value)
    assert.ok(
      output.startsWith("'") || output.startsWith("\"'"),
      JSON.stringify(value)
    )
  }
  assert.equal(escapeCSV("normal answer"), "normal answer")
  assert.equal(escapeCSV("test@example.com"), "test@example.com")
  assert.equal(escapeCSV('one,"two"\rthree'), '"one,""two""\rthree"')
  assert.equal(escapeCSV('=1,"two"'), '"\'=1,""two"""')
})

test("untrusted forwarded headers cannot rotate the rate-limit identity", () => {
  const headers = new Headers({
    "x-forwarded-for": "8.8.8.8",
    "cf-connecting-ip": "1.1.1.1",
    "x-real-ip": "9.9.9.9",
  })
  assert.equal(getRateLimitIdentity(headers, undefined), undefined)
  assert.equal(getRateLimitIdentity(headers, "x-real-ip"), "9.9.9.9")
  headers.set("x-real-ip", "8.8.8.8, 9.9.9.9")
  assert.equal(getRateLimitIdentity(headers, "x-real-ip"), undefined)
  headers.set("x-real-ip", "anything")
  assert.equal(getRateLimitIdentity(headers, "x-real-ip"), undefined)
})

test("browser identities are independent, signed, and cannot be chosen by clients", () => {
  const first = createVisitorIdentity("secret")
  const second = createVisitorIdentity("secret")
  assert.notEqual(first.id, second.id)
  assert.equal(readVisitorIdentity(first.token, "secret"), first.id)
  assert.equal(readVisitorIdentity(first.token, "wrong-secret"), undefined)
  assert.equal(
    readVisitorIdentity(`${second.id}.${first.token.split(".")[1]}`, "secret"),
    undefined
  )
  assert.equal(readVisitorIdentity(undefined, "secret"), undefined)
  assert.equal(readVisitorIdentity("forged", "secret"), undefined)
})

test("security migration and concurrent limits preserve v1/v2 records, snapshots and analytics", async () => {
  const engine = new PGlite()
  const database = drizzle(engine)
  const execute = (query: Parameters<typeof database.execute>[0]) =>
    database.execute(query)
  try {
    const journal = JSON.parse(
      await readFile(
        new URL("../drizzle/meta/_journal.json", import.meta.url),
        "utf8"
      )
    )
    const entries = journal.entries as { tag: string }[]
    for (const entry of entries.filter(
      (entry) => entry.tag !== "0004_security_rate_limits"
    )) {
      await engine.exec(
        await readFile(
          new URL(`../drizzle/${entry.tag}.sql`, import.meta.url),
          "utf8"
        )
      )
    }
    await engine.exec(`INSERT INTO submissions (session_id, form_version, is_partial, answers, submitted_at, ip_hash, metadata)
      VALUES ('00000000-0000-4000-8000-000000000001', 1, false, '{"email":"old@example.com","age_range":"25–30"}', '2026-10-01T12:00:00Z', 'old-hash', '{"userAgent":"legacy"}'),
      ('00000000-0000-4000-8000-000000000002', 1, true, '{"email":"partial@example.com"}', '2026-10-02T12:00:00Z', NULL, '{}'),
      ('00000000-0000-4000-8000-000000000003', 2, false, '{"email":"new@example.com","adoption_hesitation":"=1+1"}', '2026-11-01T12:00:00Z', 'new-hash', '{}')`)
    const snapshot = async () => ({
      responses: (await engine.query("SELECT * FROM submissions ORDER BY id"))
        .rows,
      versions: (
        await engine.query("SELECT * FROM form_versions ORDER BY version")
      ).rows,
      legacyConfig: (
        await engine.query("SELECT * FROM form_config ORDER BY id")
      ).rows,
      analytics: (
        await engine.query(
          "SELECT form_version, is_partial, count(*), jsonb_agg(answers ORDER BY id) AS answers FROM submissions GROUP BY form_version, is_partial ORDER BY form_version, is_partial"
        )
      ).rows,
    })
    const before = await snapshot()
    await engine.exec(
      await readFile(
        new URL("../drizzle/0004_security_rate_limits.sql", import.meta.url),
        "utf8"
      )
    )

    const results = await Promise.all(
      Array.from({ length: 20 }, () =>
        consumeRateLimit(execute, "login:test-ip", REQUEST_LIMITS.login)
      )
    )
    assert.equal(results.filter((result) => result.allowed).length, 5)
    assert.ok(results.every((result) => result.retryAfterSeconds > 0))
    const secondInstance = drizzle(engine)
    assert.equal(
      (
        await consumeRateLimit(
          (query) => secondInstance.execute(query),
          "login:test-ip",
          REQUEST_LIMITS.login
        )
      ).allowed,
      false
    )
    assert.equal(
      (await consumeRateLimit(execute, "login:other-ip", REQUEST_LIMITS.login))
        .allowed,
      true
    )
    assert.equal(
      (
        await consumeRateLimit(
          execute,
          "partial:test-ip",
          REQUEST_LIMITS.partial
        )
      ).allowed,
      true
    )

    await database.execute(
      sql`UPDATE security_rate_limits SET reset_at = CURRENT_TIMESTAMP - INTERVAL '1 second' WHERE key = 'login:test-ip'`
    )
    assert.equal(
      (await consumeRateLimit(execute, "login:test-ip", REQUEST_LIMITS.login))
        .allowed,
      true
    )
    assert.deepEqual(await snapshot(), before)
    await assert.rejects(
      consumeRateLimit(
        async () => {
          throw new Error("offline")
        },
        "login:test",
        REQUEST_LIMITS.login
      )
    )
  } finally {
    await engine.close()
  }
}, 20000)
