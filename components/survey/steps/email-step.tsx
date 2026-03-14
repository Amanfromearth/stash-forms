"use client"

import { useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import type { EmailQuestion } from "@/lib/form-config"

interface EmailStepProps {
  question: EmailQuestion
  value: string
  onChange: (value: string) => void
}

export function EmailStep({ question, value, onChange }: EmailStepProps) {
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
          type="email"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder ?? "your@email.com"}
          className="h-12 rounded-none border-0 border-b-2 border-border bg-transparent px-0 text-lg shadow-none transition-colors focus-visible:border-primary focus-visible:ring-0"
          autoComplete="email"
          inputMode="email"
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
