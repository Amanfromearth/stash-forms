// Isolated process: Next request mocks never affect the app or other tests.
import { mock } from "bun:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { PGlite } from "@electric-sql/pglite"
import { drizzle } from "drizzle-orm/pglite"
import * as schema from "../lib/schema"
import { createAdminSession } from "../lib/admin-session"
import { createSurveySession } from "../lib/survey-session"
import { SURVEY_V2_CONFIG } from "../lib/form-config-v2"

process.env.SESSION_SECRET = "security-test-only-secret"
process.env.ADMIN_PASSWORD = "security-test-only-password"
process.env.IP_HASH_SALT = "security-test-only-ip-salt"
process.env.TRUSTED_PROXY_IP_HEADER = "x-real-ip"
const engine = new PGlite()
const database = drizzle(engine, { schema })
let blockDatabase = false
let requestHeaders = new Headers({ "x-real-ip": "8.8.8.8" })
const cookieValues = new Map<string, string>()
const cookieOptions = new Map<string, Record<string, unknown>>()
const cookieStore = {
  get: (name: string) =>
    cookieValues.has(name) ? { value: cookieValues.get(name)! } : undefined,
  set: (name: string, value: string, options: Record<string, unknown>) => {
    cookieValues.set(name, value)
    cookieOptions.set(name, options)
  },
  delete: (name: string) => cookieValues.delete(name),
}
mock.module("next/headers", () => ({
  cookies: async () => cookieStore,
  headers: async () => requestHeaders,
}))
mock.module("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`redirect:${path}`)
  },
}))
mock.module("next/cache", () => ({ revalidatePath: () => {} }))
mock.module("../lib/db", () => ({
  db: new Proxy(database, {
    get(target, property) {
      if (blockDatabase) throw new Error("Unauthorized database access")
      return Reflect.get(target, property)
    },
  }),
}))

try {
  const journal = JSON.parse(
    await readFile(
      new URL("../drizzle/meta/_journal.json", import.meta.url),
      "utf8"
    )
  )
  for (const { tag } of journal.entries) {
    await engine.exec(
      await readFile(new URL(`../drizzle/${tag}.sql`, import.meta.url), "utf8")
    )
  }
  const { GET } = await import("../app/api/admin/export/route")
  const { loginAction } = await import("../app/actions/auth")
  const { updateFormConfigAction } = await import("../app/actions/config")
  const { upsertPartial, submitSurvey } = await import("../app/actions/submit")
  const { requireAdmin } = await import("../lib/admin-auth")
  const { getAnalytics } = await import("../lib/analytics")
  const { getFormConfig } = await import("../lib/config-loader")
  const { resumeSurveySession } = await import("../app/actions/survey-session")

  blockDatabase = true
  assert.deepEqual(
    await resumeSurveySession({
      ...createSurveySession(2),
      sessionToken: "forged",
    }),
    { valid: false }
  )
  assert.equal(
    (await GET(new Request("http://test/api/admin/export"))).status,
    401
  )
  assert.equal(
    (await updateFormConfigAction(SURVEY_V2_CONFIG)).error,
    "Unauthorized"
  )
  await assert.rejects(requireAdmin(), /redirect:\/admin\/login/)
  blockDatabase = false
  console.log(
    "PASS: handler authorization works without the proxy and before any database access"
  )

  const password = new FormData()
  password.set("password", "incorrect-password")
  const attempts = await Promise.all(
    Array.from({ length: 12 }, () => loginAction(password))
  )
  assert.equal(
    attempts.filter((result) => result.error === "Invalid password").length,
    5
  )
  assert.equal(
    attempts.filter((result) => result.error?.startsWith("Too many")).length,
    7
  )
  password.set("password", process.env.ADMIN_PASSWORD)
  assert.match((await loginAction(password)).error!, /Too many/)
  requestHeaders = new Headers({ "x-real-ip": "9.9.9.9" })
  await assert.rejects(loginAction(password), /redirect:\/admin/)
  assert.equal(cookieOptions.get("admin_session")?.httpOnly, true)
  assert.equal(cookieOptions.get("admin_session")?.sameSite, "lax")
  console.log(
    "PASS: concurrent login attempts are throttled; another visitor can still sign in"
  )

  await engine.exec(`INSERT INTO submissions (session_id, form_version, answers, is_partial)
    VALUES ('00000000-0000-4000-8000-000000000001', 1, '{"email":"legacy@example.com"}', false),
    ('00000000-0000-4000-8000-000000000002', 1, '{"email":"legacy-partial@example.com"}', true),
    ('00000000-0000-4000-8000-000000000003', 2, '{"email":"current@example.com","adoption_hesitation":"=1+1"}', false)`)
  const oldRows = (
    await engine.query<{ id: string }>("SELECT * FROM submissions ORDER BY id")
  ).rows
  const oldIds = oldRows.map((row) => row.id)
  const oldVersions = (
    await engine.query("SELECT * FROM form_versions ORDER BY version")
  ).rows
  const beforeAnalytics = await Promise.all(
    [1, 2].map(async (version) => getAnalytics(await getFormConfig(version)))
  )
  // A session issued using the previous admin token format remains accepted.
  cookieValues.set(
    "admin_session",
    createAdminSession(process.env.SESSION_SECRET)
  )
  for (const version of [1, 2]) {
    const response = await GET(
      new Request(`http://test/api/admin/export?version=${version}`)
    )
    assert.equal(response.status, 200)
    assert.equal(response.headers.get("cache-control"), "private, no-store")
    const csv = await response.text()
    assert.ok(
      csv.includes(version === 1 ? "legacy@example.com" : "current@example.com")
    )
    assert.equal(
      csv.includes(
        version === 1 ? "current@example.com" : "legacy@example.com"
      ),
      false
    )
    if (version === 2) assert.ok(csv.includes("'=1+1"))
  }
  assert.deepEqual(
    await Promise.all(
      [1, 2].map(async (version) => getAnalytics(await getFormConfig(version)))
    ),
    beforeAnalytics
  )
  console.log(
    "PASS: v1/v2 exports and actual analytics stay separate; formula escaping does not mutate answers"
  )

  requestHeaders = new Headers({ "x-real-ip": "1.1.1.1" })
  await upsertPartial({ ...createSurveySession(2), answers: {} })
  assert.equal(
    (
      await engine.query<{ n: number }>(
        "SELECT count(*)::int AS n FROM submissions"
      )
    ).rows[0].n,
    3
  )
  const sessions = Array.from({ length: 31 }, () => createSurveySession(2))
  for (const session of sessions)
    await upsertPartial({ ...session, answers: { email: "new@example.com" } })
  assert.equal(
    (
      await engine.query<{ n: number }>(
        "SELECT count(*)::int AS n FROM submissions"
      )
    ).rows[0].n,
    33
  )
  const answers: Record<string, unknown> = {}
  for (const question of SURVEY_V2_CONFIG.questions) {
    if (question.type === "section_header") continue
    answers[question.id] =
      "options" in question
        ? question.type === "multi_select"
          ? [question.options[0]]
          : question.options[0]
        : question.type === "email"
          ? "complete@example.com"
          : "Test answer"
  }
  assert.equal((await submitSurvey({ ...sessions[0], answers })).success, true)
  console.log(
    "PASS: empty partials are ignored, rotating session IDs hits the quota, and existing responses can still complete"
  )

  await engine.exec(
    "UPDATE security_rate_limits SET attempts = 120 WHERE key LIKE 'partial:%'"
  )
  await upsertPartial({
    ...sessions[1],
    answers: { email: "should-not-be-saved@example.com" },
  })
  const partial = (
    await engine.query<{ answers: Record<string, unknown> }>(
      "SELECT answers FROM submissions WHERE session_id = $1",
      [sessions[1].sessionId]
    )
  ).rows[0]
  assert.deepEqual(partial.answers, { email: "new@example.com" })
  await upsertPartial({
    ...sessions[0],
    answers: { email: "should-not-overwrite@example.com" },
  })
  assert.equal((await submitSurvey({ ...sessions[0], answers })).success, true)
  assert.equal(
    (
      await submitSurvey({
        ...sessions[0],
        answers: { ...answers, adoption_hesitation: "Different answer" },
      })
    ).success,
    false
  )
  assert.deepEqual(
    (
      await engine.query<{ answers: Record<string, unknown> }>(
        "SELECT answers FROM submissions WHERE session_id = $1",
        [sessions[0].sessionId]
      )
    ).rows[0].answers,
    answers
  )
  assert.deepEqual(
    (
      await engine.query(
        "SELECT * FROM submissions WHERE id = ANY($1::uuid[]) ORDER BY id",
        [oldIds]
      )
    ).rows,
    oldRows
  )
  assert.deepEqual(
    (await engine.query("SELECT * FROM form_versions ORDER BY version")).rows,
    oldVersions
  )
  console.log(
    "PASS: partial-save limits, completed response guards, all old rows, and version snapshots are preserved"
  )

  const completedBefore = (
    await engine.query("SELECT * FROM submissions WHERE session_id = $1", [
      sessions[0].sessionId,
    ])
  ).rows
  for (let retry = 0; retry < 12; retry++) {
    assert.equal(
      (await submitSurvey({ ...sessions[0], answers })).success,
      true
    )
  }
  assert.deepEqual(
    (
      await engine.query("SELECT * FROM submissions WHERE session_id = $1", [
        sessions[0].sessionId,
      ])
    ).rows,
    completedBefore
  )
  console.log(
    "PASS: repeated completion retries succeed without duplicate records or changed timestamps"
  )

  // Different browsers on the same office Wi-Fi must never pool their save quotas.
  requestHeaders = new Headers({ "x-real-ip": "4.2.2.2" })
  const responseCount = async () =>
    (
      await engine.query<{ n: number }>(
        "SELECT count(*)::int AS n FROM submissions"
      )
    ).rows[0].n
  const beforeCrowd = await responseCount()
  for (let person = 0; person < 60; person++) {
    cookieValues.clear()
    const session = createSurveySession(2)
    const personalAnswers = {
      ...answers,
      email: `person-${person}@example.com`,
    }
    for (const count of [3, 6, 9, 12, 15, 17]) {
      await upsertPartial({
        ...session,
        answers: Object.fromEntries(
          Object.entries(personalAnswers).slice(0, count)
        ),
      })
    }
    assert.equal(
      (await submitSurvey({ ...session, answers: personalAnswers })).success,
      true
    )
    // The network may change between autosave and the final response retry.
    requestHeaders = new Headers({ "x-real-ip": "4.2.2.3" })
    assert.equal(
      (await submitSurvey({ ...session, answers: personalAnswers })).success,
      true
    )
    requestHeaders = new Headers({ "x-real-ip": "4.2.2.2" })
  }
  assert.equal(await responseCount(), beforeCrowd + 60)
  console.log(
    "PASS: 60 people on the same IP can autosave, finish and retry without interfering with one another"
  )

  // Missing trusted proxy configuration must not impose one global visitor quota.
  delete process.env.TRUSTED_PROXY_IP_HEADER
  process.env.VERCEL = "0"
  const beforeUnknownIP = await responseCount()
  for (let person = 0; person < 35; person++) {
    cookieValues.clear()
    const session = createSurveySession(2)
    await upsertPartial({
      ...session,
      answers: { email: `unknown-${person}@example.com` },
    })
    assert.equal((await submitSurvey({ ...session, answers })).success, true)
  }
  assert.equal(await responseCount(), beforeUnknownIP + 35)
  console.log(
    "PASS: unrelated browsers still finish normally when a trusted visitor IP is unavailable"
  )

  // Exhaust one response's save budget; the final submit and another response remain independent.
  cookieValues.clear()
  const busySession = createSurveySession(2)
  for (let edit = 0; edit < 120; edit++) {
    await upsertPartial({
      ...busySession,
      answers: { email: `edit-${edit}@example.com` },
    })
  }
  await upsertPartial({
    ...busySession,
    answers: { email: "blocked-edit@example.com" },
  })
  assert.deepEqual(
    (
      await engine.query<{ answers: Record<string, unknown> }>(
        "SELECT answers FROM submissions WHERE session_id = $1",
        [busySession.sessionId]
      )
    ).rows[0].answers,
    { email: "edit-119@example.com" }
  )
  const freshSession = createSurveySession(2)
  await upsertPartial({
    ...freshSession,
    answers: { email: "another-person@example.com" },
  })
  assert.equal((await submitSurvey({ ...freshSession, answers })).success, true)
  assert.equal((await submitSurvey({ ...busySession, answers })).success, true)
  console.log(
    "PASS: even an exhausted autosave quota cannot block final submission or another response"
  )

  process.env.TRUSTED_PROXY_IP_HEADER = "x-real-ip"
  requestHeaders = new Headers({ "x-real-ip": "5.5.5.5" })
  cookieValues.clear()
  const startedBeforeFlood = createSurveySession(2)
  await upsertPartial({
    ...startedBeforeFlood,
    answers: { email: "already-started@example.com" },
  })
  await engine.exec(
    "UPDATE security_rate_limits SET attempts = 1000 WHERE key LIKE 'newResponseNetwork:%'"
  )
  const beforeFlood = await responseCount()
  cookieValues.clear()
  await upsertPartial({
    ...createSurveySession(2),
    answers: { email: "new-during-flood@example.com" },
  })
  assert.equal(await responseCount(), beforeFlood)
  assert.equal(
    (await submitSurvey({ ...startedBeforeFlood, answers })).success,
    true
  )
  console.log(
    "PASS: network flood protection still blocks new response spam while an already-started response can finish"
  )

  requestHeaders = new Headers({ "x-real-ip": "6.6.6.6" })
  cookieValues.clear()
  const concurrentSession = createSurveySession(2)
  const beforeConcurrent = await responseCount()
  const concurrentResults = await Promise.all(
    Array.from({ length: 3 }, () =>
      submitSurvey({ ...concurrentSession, answers })
    )
  )
  assert.ok(concurrentResults.every((result) => result.success))
  assert.equal(await responseCount(), beforeConcurrent + 1)
  const reordered = Object.fromEntries(Object.entries(answers).reverse())
  assert.equal(
    (await submitSurvey({ ...concurrentSession, answers: reordered })).success,
    true
  )
  assert.deepEqual(
    (
      await engine.query(
        "SELECT * FROM submissions WHERE id = ANY($1::uuid[]) ORDER BY id",
        [oldIds]
      )
    ).rows,
    oldRows
  )
  console.log(
    "PASS: concurrent retries and reordered answer keys save exactly once, with historical data intact"
  )

  const oldSession = createSurveySession(1, Date.now() - 25 * 60 * 60 * 1000)
  await engine.query(
    "INSERT INTO submissions (session_id, form_version, answers, is_partial) VALUES ($1, 1, $2, true)",
    [oldSession.sessionId, { email: "returning-v1@example.com" }]
  )
  const recoveryRows = async () =>
    (
      await engine.query("SELECT * FROM submissions WHERE session_id = $1", [
        oldSession.sessionId,
      ])
    ).rows
  const beforeRecovery = await recoveryRows()
  const resumed = await resumeSurveySession(oldSession)
  assert.equal(resumed.valid, true)
  if (!resumed.valid) throw new Error("Recovery failed")
  assert.equal(resumed.config.version, 1)
  assert.equal(resumed.session.sessionId, oldSession.sessionId)
  assert.equal(resumed.completed, false)
  assert.notEqual(resumed.session.sessionToken, oldSession.sessionToken)
  assert.deepEqual(await recoveryRows(), beforeRecovery)
  const receipt = await resumeSurveySession(concurrentSession)
  assert.equal(receipt.valid && receipt.completed, true)
  console.log(
    "PASS: expired returning sessions retain their ID and original v1 questions; receipt recovery never modifies data"
  )

  await engine.exec("DROP TABLE security_rate_limits")
  const originalError = console.error
  console.error = () => {}
  try {
    assert.match(
      (await loginAction(password)).error!,
      /temporarily unavailable/
    )
    assert.equal(
      (await submitSurvey({ ...createSurveySession(2), answers })).success,
      false
    )
  } finally {
    console.error = originalError
  }
  console.log("PASS: unavailable security storage cannot bypass the limits")
} finally {
  await engine.close()
}
