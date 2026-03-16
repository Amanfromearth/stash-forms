"use client"

import { useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import type { MultiSelectQuestion } from "@/lib/form-config"

const LETTER_LABELS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

interface MultiSelectStepProps {
  question: MultiSelectQuestion
  value: string[]
  onChange: (value: string[]) => void
}

export function MultiSelectStep({
  question,
  value,
  onChange,
}: MultiSelectStepProps) {
  const toggleOption = useCallback(
    (option: string) => {
      if (value.includes(option)) {
        onChange(value.filter((v) => v !== option))
      } else {
        onChange([...value, option])
      }
    },
    [value, onChange]
  )

  // Keyboard: number keys 1-9 toggle options
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const num = parseInt(e.key)
      if (!isNaN(num) && num >= 1 && num <= question.options.length) {
        e.preventDefault()
        toggleOption(question.options[num - 1])
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [question.options, toggleOption])

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
        role="group"
        aria-label={question.label}
        className="flex flex-col gap-2"
      >
        {question.options.map((option, index) => {
          const isSelected = value.includes(option)
          const letter = LETTER_LABELS[index] ?? String(index + 1)

          return (
            <button
              key={option}
              type="button"
              role="checkbox"
              aria-checked={isSelected}
              onClick={() => toggleOption(option)}
              className={cn(
                "flex w-full items-center gap-4 rounded-lg border-2 px-5 py-4 text-left",
                "cursor-pointer transition-[transform,border-color,background-color] duration-200",
                "hover:border-primary/50 hover:bg-primary/5 active:scale-[0.98]",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
                isSelected
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-transparent text-foreground"
              )}
            >
              {/* Letter badge with checkbox indicator */}
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-md border font-mono text-xs font-semibold",
                  "transition-colors duration-150",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-muted text-muted-foreground"
                )}
              >
                {isSelected ? (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M11.5 3.5L5.5 10L2.5 7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  letter
                )}
              </span>
              <span className="text-base font-medium">{option}</span>
            </button>
          )
        })}
      </div>

      {/* Selection count */}
      {value.length > 0 && (
        <p className="text-sm text-muted-foreground">{value.length} selected</p>
      )}
    </div>
  )
}
