"use client"

import { useEffect, useCallback, useRef, useState } from "react"
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
  const initialValueRef = useRef(value)
  const userSelected = useRef(false)

  useEffect(() => {
    if (userSelected.current && value !== null && onAdvance) {
      const timer = setTimeout(onAdvance, 500)
      return () => clearTimeout(timer)
    }
  }, [value, onAdvance])

  const handleSelect = useCallback(
    (option: string) => {
      userSelected.current = true
      onChange(option)
    },
    [onChange]
  )

  const [focusedIndex, setFocusedIndex] = useState(0)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const num = parseInt(e.key)
      if (!isNaN(num) && num >= 1 && num <= question.options.length) {
        e.preventDefault()
        e.stopImmediatePropagation()
        handleSelect(question.options[num - 1])
        return
      }
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setFocusedIndex((prev) =>
          prev < question.options.length - 1 ? prev + 1 : 0
        )
        return
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setFocusedIndex((prev) =>
          prev > 0 ? prev - 1 : question.options.length - 1
        )
        return
      }
      if (e.key === "Enter") {
        e.preventDefault()
        e.stopImmediatePropagation()
        handleSelect(question.options[focusedIndex])
      }
    }
    window.addEventListener("keydown", handleKeyDown, true)
    return () => window.removeEventListener("keydown", handleKeyDown, true)
  }, [question.options, handleSelect, focusedIndex])

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      {/* Question label */}
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-2xl leading-tight font-light tracking-tight md:text-3xl">
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
          const isFocused = focusedIndex === index
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
                "cursor-pointer transition-all duration-200 will-change-transform",
                "hover:border-primary/50 hover:bg-primary/5 active:scale-[0.98]",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
                isSelected
                  ? "border-primary bg-primary/10 text-foreground"
                  : isFocused
                    ? "border-primary/50 bg-primary/5 text-foreground"
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
