"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import type { VersionedFormConfig } from "@/lib/form-config"

export function useSurveyAnswers(
  config: VersionedFormConfig,
  initialCountry?: string,
  initialAnswers: Record<string, unknown> = {},
  onSave?: (answers: Record<string, unknown>) => Promise<void>
) {
  const [userAnswers, setAnswers] = useState(initialAnswers)
  const answers = useMemo(() => {
    const country = config.questions.find(
      (question) => question.id === "country"
    )
    const canPrefill =
      initialCountry &&
      country?.type === "dropdown" &&
      country.options.includes(initialCountry)
    // A late detection result must never overwrite the user's own choice.
    return canPrefill && !Object.hasOwn(userAnswers, "country")
      ? { ...userAnswers, country: initialCountry }
      : userAnswers
  }, [userAnswers, initialCountry, config.questions])
  const filledCount = Object.values(answers).filter(
    (v) =>
      v !== null &&
      v !== undefined &&
      v !== "" &&
      !(Array.isArray(v) && v.length === 0)
  ).length

  useEffect(() => {
    if (filledCount < 3 || !onSave) return
    const timer = setTimeout(() => {
      void onSave(answers).catch(() => {
        /* The local draft keeps offline edits. */
      })
    }, 1000)
    return () => clearTimeout(timer)
  }, [answers, filledCount, onSave])

  const setAnswer = useCallback((questionId: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }, [])

  return { answers, setAnswers, setAnswer }
}
