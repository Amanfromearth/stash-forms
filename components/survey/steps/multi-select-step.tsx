"use client"

import { useEffect, useCallback, useMemo } from "react"
import type { MultiSelectQuestion } from "@/lib/form-config"
import { InteriorChoice } from "@/components/interior/choice"
import { QuestionHeading } from "../question-heading"

export function MultiSelectStep({
  question,
  value,
  onChange,
}: {
  question: MultiSelectQuestion
  value: string[]
  onChange: (value: string[]) => void
}) {
  const selectedValues = useMemo(() => new Set(value), [value])
  const toggle = useCallback(
    (option: string) => {
      if (value.includes(option)) onChange(value.filter((v) => v !== option))
      else if (!question.maxSelections || value.length < question.maxSelections)
        onChange([...value, option])
    },
    [value, onChange, question.maxSelections]
  )
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        event.isComposing ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      )
        return
      const number = Number(event.key)
      if (/^[1-9]$/.test(event.key) && number <= question.options.length) {
        event.preventDefault()
        toggle(question.options[number - 1])
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [question.options, toggle])
  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <QuestionHeading question={question} />
      <div
        role="group"
        aria-labelledby={`${question.id}-heading`}
        className="flex flex-col gap-2.5"
      >
        {question.options.map((option, index) => (
          <InteriorChoice
            key={option}
            role="checkbox"
            aria-checked={selectedValues.has(option)}
            selected={selectedValues.has(option)}
            multiple
            letter={"ABCDEFGHIJKLMNOPQRSTUVWXYZ"[index] ?? String(index + 1)}
            disabled={
              !selectedValues.has(option) &&
              !!question.maxSelections &&
              value.length >= question.maxSelections
            }
            onClick={() => toggle(option)}
          >
            {option}
          </InteriorChoice>
        ))}
      </div>
      <p className="min-h-5 text-sm text-muted-foreground" aria-live="polite">
        {value.length > 0
          ? `${value.length}${question.maxSelections ? ` / ${question.maxSelections}` : ""} selected`
          : question.maxSelections
            ? `Choose up to ${question.maxSelections} options`
            : "Choose all that apply"}
      </p>
    </div>
  )
}
