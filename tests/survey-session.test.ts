import { after, test } from "node:test"
import assert from "node:assert/strict"
import {
  createSurveySession,
  requireSurveySession,
  refreshSurveySession,
  SURVEY_RECOVERY_LIFETIME,
} from "../lib/survey-session"

const previousSecret = process.env.SESSION_SECRET
process.env.SESSION_SECRET = "react-doctor-test-secret-with-adequate-length"
after(() => {
  if (previousSecret === undefined) delete process.env.SESSION_SECRET
  else process.env.SESSION_SECRET = previousSecret
})

const now = 1_800_000_000_000

test("server-issued survey sessions authorize only their own response and version", () => {
  const session = createSurveySession(2, now)
  assert.doesNotThrow(() => requireSurveySession(session, now + 1000))
  assert.throws(() =>
    requireSurveySession(
      { ...session, sessionId: createSurveySession(2, now).sessionId },
      now
    )
  )
  assert.throws(() => requireSurveySession({ ...session, formVersion: 1 }, now))
  assert.throws(() =>
    requireSurveySession(
      { ...session, sessionToken: session.sessionToken.replace(".2.", ".1.") },
      now
    )
  )
  assert.throws(() =>
    requireSurveySession({ sessionId: session.sessionId, formVersion: 2 }, now)
  )
})

test("survey sessions reject expired, future, truncated and malformed tokens", () => {
  const session = createSurveySession(2, now)
  assert.doesNotThrow(() =>
    requireSurveySession(session, now + 24 * 60 * 60 * 1000)
  )
  assert.throws(() =>
    requireSurveySession(session, now + 24 * 60 * 60 * 1000 + 1)
  )
  assert.throws(() => requireSurveySession(session, now - 1))
  for (const token of [
    "",
    "bad",
    session.sessionToken.slice(0, -1),
    `${session.sessionToken}.extra`,
    session.sessionToken.slice(0, -64) + "z".repeat(64),
    "x".repeat(300),
  ]) {
    assert.throws(() =>
      requireSurveySession({ ...session, sessionToken: token }, now)
    )
  }
})

test("sessions have independent identities and fail closed without a signing secret", () => {
  assert.notEqual(
    createSurveySession(2, now).sessionId,
    createSurveySession(2, now).sessionId
  )
  const secret = process.env.SESSION_SECRET
  delete process.env.SESSION_SECRET
  try {
    assert.throws(() => createSurveySession(2, now), /SESSION_SECRET/)
  } finally {
    process.env.SESSION_SECRET = secret
  }
})

test("returning users refresh expired sessions without changing response identity or form version", () => {
  const old = createSurveySession(1, now)
  const later = now + 25 * 60 * 60 * 1000
  assert.throws(() => requireSurveySession(old, later))
  const refreshed = refreshSurveySession(old, later)
  assert.equal(refreshed.sessionId, old.sessionId)
  assert.equal(refreshed.formVersion, 1)
  assert.notEqual(refreshed.sessionToken, old.sessionToken)
  assert.doesNotThrow(() => requireSurveySession(refreshed, later))
  assert.throws(() =>
    refreshSurveySession(
      { ...old, sessionId: createSurveySession(1, now).sessionId },
      later
    )
  )
  assert.throws(() =>
    refreshSurveySession(old, now + SURVEY_RECOVERY_LIFETIME + 1)
  )
})
