"use client"

import { useEffect } from "react"
import type { Question } from "@/lib/form-config"

export function useSurveyKeyboard(
  step: number,
  questions: Question[],
  goNext: () => Promise<void>,
  goBack: () => Promise<void>
) {
  const totalQuestions = questions.length
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        step < 1 ||
        step > totalQuestions ||
        e.defaultPrevented ||
        e.isComposing
      )
        return
      if (
        e.target instanceof Element &&
        e.target.closest("[data-survey-control]")
      )
        return

      const isSectionHeader = questions[step - 1]?.type === "section_header"

      if (e.key === "Enter" && !isSectionHeader) {
        if (
          e.target instanceof Element &&
          e.target.closest("button, [role=button]")
        )
          return
        if (e.target instanceof HTMLSelectElement) return
        if (e.target instanceof HTMLTextAreaElement) {
          const isTouchDevice =
            "ontouchstart" in window || navigator.maxTouchPoints > 0
          if (isTouchDevice || e.shiftKey) return
        }
        e.preventDefault()
        goNext()
      }

      if (e.key === "ArrowLeft") {
        if (
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement
        )
          return
        e.preventDefault()
        goBack()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [step, totalQuestions, goNext, goBack, questions])
}
