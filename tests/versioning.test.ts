import { test } from "node:test"
import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { SURVEY_V1_CONFIG } from "../lib/form-config-v1"
import { SURVEY_V2_CONFIG } from "../lib/form-config-v2"
import { validateAnswers } from "../lib/validate-answers"
import { submissionSchema, partialSubmissionSchema } from "../lib/validations"
import { formConfigSchema } from "../lib/form-config-validation"
import type { FormConfig } from "../lib/form-config"

function validAnswers(config: FormConfig): Record<string, unknown> {
  const answers: Record<string, unknown> = {}
  for (const q of config.questions) {
    if (q.type === "section_header") continue
    if (q.condition && answers[q.condition.questionId] !== q.condition.equals)
      continue
    answers[q.id] =
      "options" in q
        ? q.type === "multi_select"
          ? [q.options[0]]
          : q.options[0]
        : q.type === "email"
          ? "test@example.com"
          : q.type === "rating"
            ? q.min
            : "Test answer"
  }
  return answers
}

test("v1 retains every original question, option and branch", () => {
  assert.equal(
    createHash("sha256").update(JSON.stringify(SURVEY_V1_CONFIG)).digest("hex"),
    "eaf7973e755ddd321ff58880fff33187f8ea36f079e08ab0feccbd445ce14f38"
  )
})

test("v2 has 17 questions with no section pages or em dashes", () => {
  assert.equal(
    SURVEY_V2_CONFIG.questions.filter((q) => q.type !== "section_header")
      .length,
    17
  )
  assert.equal(
    SURVEY_V2_CONFIG.questions.filter((q) => q.type === "section_header")
      .length,
    0
  )
  assert.deepEqual(SURVEY_V2_CONFIG.questions[0], SURVEY_V1_CONFIG.questions[0])
  assert.equal(JSON.stringify(SURVEY_V2_CONFIG).includes("\u2014"), false)
  const country = SURVEY_V2_CONFIG.questions.find((q) => q.id === "country")!
  assert.equal(country.type, "dropdown")
  assert.ok(
    "options" in country &&
      country.options.length === 249 &&
      country.options.includes("India")
  )
  assert.equal(
    SURVEY_V2_CONFIG.questions.find((q) => q.id === "interest_area")?.type,
    "multiple_choice"
  )
  assert.ok(
    SURVEY_V2_CONFIG.questions
      .find((q) => q.id === "interest_area")
      ?.description?.includes("AI wealth manager")
  )
})

test("both snapshots accept complete answers; v1 answers do not satisfy v2", () => {
  for (const config of [SURVEY_V1_CONFIG, SURVEY_V2_CONFIG]) {
    assert.equal(formConfigSchema.safeParse(config).success, true)
    assert.equal(validateAnswers(config, validAnswers(config)), null)
  }
  assert.ok(validateAnswers(SURVEY_V2_CONFIG, validAnswers(SURVEY_V1_CONFIG)))
})

test("every up-to-two question enforces the limit on full and partial submissions", () => {
  const limited = SURVEY_V2_CONFIG.questions.filter(
    (q) => q.type === "multi_select" && q.maxSelections === 2
  )
  assert.equal(limited.length, 5)
  for (const q of limited) {
    if (q.type !== "multi_select") continue
    const answers = validAnswers(SURVEY_V2_CONFIG)
    answers[q.id] = q.options.slice(0, 2)
    assert.equal(validateAnswers(SURVEY_V2_CONFIG, answers), null)
    answers[q.id] = q.options.slice(0, 3)
    assert.match(validateAnswers(SURVEY_V2_CONFIG, answers)!, /Select up to 2/)
    assert.match(
      validateAnswers(
        SURVEY_V2_CONFIG,
        { [q.id]: q.options.slice(0, 3) },
        true
      )!,
      /Select up to 2/
    )
  }
})

test("required answers, country choices and duplicate selections are validated", () => {
  assert.ok(validateAnswers(SURVEY_V2_CONFIG, {}))
  assert.equal(validateAnswers(SURVEY_V2_CONFIG, {}, true), null)
  assert.ok(
    validateAnswers(SURVEY_V2_CONFIG, { country: "Invalid country" }, true)
  )
  assert.ok(
    validateAnswers(
      SURVEY_V2_CONFIG,
      { where_invest: ["Foreign stocks", "Foreign stocks"] },
      true
    )
  )
  assert.ok(validateAnswers(SURVEY_V2_CONFIG, { unknown_id: "answer" }, true))
  const answers = validAnswers(SURVEY_V2_CONFIG)
  answers.email = "invalid-email"
  assert.equal(
    validateAnswers(SURVEY_V2_CONFIG, answers),
    "Please enter a valid email address."
  )
  answers.email = "test@example.com"
  answers.adoption_hesitation = "  "
  assert.ok(validateAnswers(SURVEY_V2_CONFIG, answers))
})

test("legacy sessions default to v1 while new sessions retain their explicit version", () => {
  assert.equal(submissionSchema.parse({ answers: {} }).formVersion, 1)
  assert.equal(
    submissionSchema.parse({ answers: {}, formVersion: 2 }).formVersion,
    2
  )
  assert.equal(
    submissionSchema.safeParse({ answers: {}, formVersion: -1 }).success,
    false
  )
  assert.equal(
    partialSubmissionSchema.safeParse({ answers: {} }).success,
    false
  )
})

test("invalid editor changes cannot publish broken options or limits", () => {
  const config = structuredClone(SURVEY_V2_CONFIG)
  const q = config.questions.find((q) => q.type === "multi_select")!
  if (q.type !== "multi_select") throw new Error("Missing multi-select")
  q.maxSelections = 100
  assert.equal(formConfigSchema.safeParse(config).success, false)
  q.maxSelections = 2
  q.options[1] = q.options[0]
  assert.equal(formConfigSchema.safeParse(config).success, false)
})
