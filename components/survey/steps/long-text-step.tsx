"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import type { LongTextQuestion } from "@/lib/form-config"

interface LongTextStepProps {
  question: LongTextQuestion
  value: string
  onChange: (value: string) => void
}

export function LongTextStep({ question, value, onChange }: LongTextStepProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [value])

  const charCount = value.length
  const maxLength = question.maxLength

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
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

      <div className="flex flex-col gap-3">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder ?? "Type your answer here..."}
          rows={4}
          maxLength={maxLength}
          className={cn(
            "w-full resize-none overflow-hidden bg-transparent text-xl outline-none md:text-2xl",
            "border-0 border-b-2 border-border px-3 py-3",
            "placeholder:text-muted-foreground/50",
            "transition-colors focus:border-primary",
            "min-h-[100px]"
          )}
          style={{ height: "auto" }}
        />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <p className="text-sm text-muted-foreground/60">
            <kbd className="rounded border border-border px-1.5 py-0.5 font-mono text-xs">
              Shift + Enter
            </kbd>{" "}
            new line ·{" "}
            <kbd className="rounded border border-border px-1.5 py-0.5 font-mono text-xs">
              Enter ↵
            </kbd>{" "}
            continue
          </p>
          {maxLength && (
            <p
              className={cn(
                "ml-auto text-sm tabular-nums",
                charCount > maxLength * 0.9
                  ? "text-destructive"
                  : "text-muted-foreground/60"
              )}
            >
              {charCount} / {maxLength}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
