import { test } from "bun:test"
import assert from "node:assert/strict"
import { parseSurveyDraft, DRAFT_LIFETIME } from "../lib/survey-draft"
import { SURVEY_V1_CONFIG } from "../lib/form-config-v1"
import { SURVEY_V2_CONFIG } from "../lib/form-config-v2"

const now = Date.now()
function draft(version = 2) {
  return {
    session: {
      sessionId: "00000000-0000-4000-8000-000000000001",
      formVersion: version,
      sessionToken: "opaque-signed-token",
    },
    config: {
      ...(version === 1 ? SURVEY_V1_CONFIG : SURVEY_V2_CONFIG),
      version,
    },
    // Intermediate, not-yet-valid input must survive reload, too.
    answers:
      version === 1
        ? { email: "unfinished@" }
        : { email: "unfinished@", country: "India" },
    step: 2,
    updatedAt: now,
  }
}

test("draft recovery preserves partial input, progress and the original published version", () => {
  for (const version of [1, 2]) {
    const value = draft(version)
    assert.deepEqual(parseSurveyDraft(JSON.stringify(value), now), value)
  }
  const receipt = {
    ...draft(),
    answers: {},
    step: SURVEY_V2_CONFIG.questions.length + 1,
  }
  assert.deepEqual(parseSurveyDraft(JSON.stringify(receipt), now), receipt)
})

test("corrupt, expired, mixed-version and unknown-question drafts cannot break startup", () => {
  for (const value of [
    null,
    "",
    "not json",
    "null",
    "[]",
    "x".repeat(1_000_001),
  ]) {
    assert.equal(parseSurveyDraft(value, now), null)
  }
  for (const value of [
    { ...draft(), updatedAt: now - DRAFT_LIFETIME - 1 },
    { ...draft(), step: 999 },
    { ...draft(), answers: { unknown_question: "answer" } },
    { ...draft(), session: { ...draft().session, formVersion: 1 } },
  ])
    assert.equal(parseSurveyDraft(JSON.stringify(value), now), null)
})
