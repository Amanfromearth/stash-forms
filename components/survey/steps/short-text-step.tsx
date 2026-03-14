"use client"

import { useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import type { ShortTextQuestion } from "@/lib/form-config"

interface ShortTextStepProps {
  question: ShortTextQuestion
  value: string
  onChange: (value: string) => void
}

export function ShortTextStep({
  question,
  value,
  onChange,
}: ShortTextStepProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
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

      <div className="flex flex-col gap-3">
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder ?? "Type your answer here..."}
          className="h-12 rounded-none border-0 border-b-2 border-border bg-transparent px-0 text-lg shadow-none transition-colors focus-visible:border-primary focus-visible:ring-0"
          autoComplete="off"
        />
        <p className="text-sm text-muted-foreground/60">
          Press{" "}
          <kbd className="rounded border border-border px-1.5 py-0.5 font-mono text-xs">
            Enter ↵
          </kbd>{" "}
          to continue
        </p>
      </div>
    </div>
  )
}
