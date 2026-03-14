"use client"

import { useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import type { MultipleChoiceQuestion } from "@/lib/form-config"

const LETTER_LABELS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

interface MultipleChoiceStepProps {
  question: MultipleChoiceQuestion
  value: string | null
  onChange: (value: string) => void
  onAdvance?: () => void
}

export function MultipleChoiceStep({
  question,
  value,
  onChange,
  onAdvance,
}: MultipleChoiceStepProps) {
  // Auto-advance after selection
  useEffect(() => {
    if (value !== null && onAdvance) {
      const timer = setTimeout(onAdvance, 500)
      return () => clearTimeout(timer)
    }
  }, [value, onAdvance])

  const handleSelect = useCallback(
    (option: string) => {
      onChange(option)
    },
    [onChange]
  )

  // Keyboard: number keys 1-9 select options
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const num = parseInt(e.key)
      if (!isNaN(num) && num >= 1 && num <= question.options.length) {
        e.preventDefault()
        handleSelect(question.options[num - 1])
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [question.options, handleSelect])

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      {/* Question label */}
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl leading-tight font-medium tracking-tight md:text-3xl">
          {question.label}
          {question.required && (
            <span className="ml-1 text-primary" aria-hidden="true">
              *
            </span>
          )}
        </h2>
        {question.description && (
          <p className="text-base text-muted-foreground">
            {question.description}
          </p>
        )}
      </div>

      {/* Option cards */}
      <div
        role="radiogroup"
        aria-label={question.label}
        className="flex flex-col gap-2"
      >
        {question.options.map((option, index) => {
          const isSelected = value === option
          const letter = LETTER_LABELS[index] ?? String(index + 1)

          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => handleSelect(option)}
              className={cn(
                "flex w-full items-center gap-4 rounded-lg border-2 px-5 py-4 text-left",
                "cursor-pointer transition-all duration-150",
                "hover:border-primary/50 hover:bg-primary/5",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
                isSelected
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-transparent text-foreground"
              )}
            >
              {/* Letter badge */}
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-md border font-mono text-xs font-semibold",
                  "transition-colors duration-150",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-muted text-muted-foreground"
                )}
              >
                {letter}
              </span>
              <span className="text-base font-medium">{option}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
