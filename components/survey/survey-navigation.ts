import type { Question } from "@/lib/form-config"

function isQuestionVisible(
  question: Question,
  answers: Record<string, unknown>
): boolean {
  if (question.type === "section_header") return true
  if ("skipIf" in question && question.skipIf) {
    const source = answers[question.skipIf.questionId]
    if (Array.isArray(source)) {
      const sourceValues = new Set(source)
      const shouldSkip = question.skipIf.containsAny.some((v) =>
        sourceValues.has(v)
      )
      if (shouldSkip) return false
    }
  }
  if (!("condition" in question) || !question.condition) return true
  const { questionId, equals } = question.condition
  const answer = answers[questionId]
  return answer === equals
}

export function nextVisibleStep(
  questions: Question[],
  answers: Record<string, unknown>,
  fromStep: number
) {
  const autoValues: Record<string, string> = {}
  let next = fromStep + 1
  while (next <= questions.length) {
    const q = questions[next - 1]
    if (isQuestionVisible(q, { ...answers, ...autoValues })) break
    if ("skipIf" in q && q.skipIf) autoValues[q.id] = q.skipIf.autoValue
    next++
  }
  return { step: next, autoValues }
}

export function previousVisibleStep(
  questions: Question[],
  answers: Record<string, unknown>,
  fromStep: number
) {
  let previous = fromStep - 1
  while (previous >= 1) {
    if (isQuestionVisible(questions[previous - 1], answers)) return previous
    previous--
  }
  return previous
}

export function getAutoFill(
  questions: Question[],
  answers: Record<string, unknown>,
  step: number
) {
  const q = questions[step - 1]
  if (!q || !("autoFill" in q) || !q.autoFill || answers[q.id] !== undefined)
    return {}
  const { questionId, ifContains, value } = q.autoFill
  const source = answers[questionId]
  if (!Array.isArray(source)) return {}
  const values = new Set(source)
  return ifContains.some((v) => values.has(v)) ? { [q.id]: value } : {}
}
