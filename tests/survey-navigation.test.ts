import { test } from "node:test"
import assert from "node:assert/strict"
import {
  nextVisibleStep,
  previousVisibleStep,
  getAutoFill,
} from "../components/survey/survey-navigation"
import { SURVEY_V1_CONFIG } from "../lib/form-config-v1"
import { SURVEY_V2_CONFIG } from "../lib/form-config-v2"
import type { Question } from "../lib/form-config"

// Compare against the original navigation algorithm on both immutable snapshots.
function originalVisible(q: Question, answers: Record<string, unknown>) {
  if (q.type === "section_header") return true
  if (q.skipIf) {
    const source = answers[q.skipIf.questionId]
    if (
      Array.isArray(source) &&
      q.skipIf.containsAny.some((value) => source.includes(value))
    )
      return false
  }
  return !q.condition || answers[q.condition.questionId] === q.condition.equals
}

test("both versions retain every forward/backward branch and skip value", () => {
  for (const config of [SURVEY_V1_CONFIG, SURVEY_V2_CONFIG]) {
    for (const sourceQuestion of config.questions) {
      const candidates =
        "options" in sourceQuestion ? sourceQuestion.options : ["", "answer"]
      for (const answer of candidates) {
        const answers = {
          [sourceQuestion.id]:
            sourceQuestion.type === "multi_select" ? [answer] : answer,
        }
        for (let step = 0; step <= config.questions.length; step++) {
          const autoValues: Record<string, string> = {}
          let next = step + 1
          while (next <= config.questions.length) {
            const q = config.questions[next - 1]
            if (originalVisible(q, { ...answers, ...autoValues })) break
            if ("skipIf" in q && q.skipIf) autoValues[q.id] = q.skipIf.autoValue
            next++
          }
          assert.deepEqual(nextVisibleStep(config.questions, answers, step), {
            step: next,
            autoValues,
          })
          let previous = step - 1
          while (
            previous >= 1 &&
            !originalVisible(config.questions[previous - 1], answers)
          )
            previous--
          assert.equal(
            previousVisibleStep(config.questions, answers, step),
            previous
          )
        }
      }
    }
  }
})

test("autofill applies only to matching arrays and preserves existing answers", () => {
  const question: Question = {
    id: "autofilled",
    type: "short_text",
    label: "Test autofill",
    required: false,
    autoFill: {
      questionId: "source",
      ifContains: ["match"],
      value: "suggested",
    },
  }
  const questions = [question]
  const { questionId, ifContains, value } = question.autoFill!
  const step = 1
  assert.deepEqual(getAutoFill(questions, { [questionId]: ifContains }, step), {
    [question.id]: value,
  })
  assert.deepEqual(
    getAutoFill(
      questions,
      { [questionId]: ifContains, [question.id]: "manual" },
      step
    ),
    {}
  )
  assert.deepEqual(
    getAutoFill(questions, { [questionId]: "not an array" }, step),
    {}
  )
  assert.deepEqual(getAutoFill(questions, {}, 0), {})
})
