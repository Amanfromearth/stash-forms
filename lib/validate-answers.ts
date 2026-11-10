import type { FormConfig } from "./form-config"

/** Validate against the exact published snapshot, including partial saves. */
export function validateAnswers(
  config: FormConfig,
  answers: Record<string, unknown>,
  partial = false
): string | null {
  const questions = new Map(config.questions.map((q) => [q.id, q]))
  for (const id of Object.keys(answers)) {
    if (!questions.has(id) || questions.get(id)?.type === "section_header")
      return "Unknown question. Please reload the form."
  }
  for (const q of config.questions) {
    if (q.type === "section_header") continue
    if (q.condition && answers[q.condition.questionId] !== q.condition.equals)
      continue
    const value = answers[q.id]
    const empty =
      value == null ||
      (typeof value === "string" && !value.trim()) ||
      (Array.isArray(value) && value.length === 0)
    if (empty) {
      if (!partial && q.required) return `Please answer: ${q.label}`
      continue
    }
    if (q.type === "multi_select") {
      if (
        !Array.isArray(value) ||
        value.some((v) => !q.options.includes(v)) ||
        new Set(value).size !== value.length
      )
        return `Invalid selection: ${q.label}`
      if (q.maxSelections && value.length > q.maxSelections)
        return `Select up to ${q.maxSelections}: ${q.label}`
    } else if (q.type === "multiple_choice" || q.type === "dropdown") {
      if (typeof value !== "string" || !q.options.includes(value))
        return `Invalid selection: ${q.label}`
    } else if (q.type === "rating") {
      if (
        typeof value !== "number" ||
        !Number.isInteger(value) ||
        value < q.min ||
        value > q.max
      )
        return `Invalid rating: ${q.label}`
    } else {
      if (typeof value !== "string") return `Invalid answer: ${q.label}`
      if (q.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
        return "Please enter a valid email address."
      if (q.type === "long_text" && q.maxLength && value.length > q.maxLength)
        return `Answer too long: ${q.label}`
    }
  }
  return null
}
