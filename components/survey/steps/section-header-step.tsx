"use client"

import { useEffect } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import type { SectionHeaderQuestion } from "@/lib/form-config"

interface SectionHeaderStepProps {
  question: SectionHeaderQuestion
  onContinue: () => void
}

export function SectionHeaderStep({
  question,
  onContinue,
}: SectionHeaderStepProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault()
        onContinue()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onContinue])

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <div
        className="flex animate-in flex-col gap-3 duration-300 fade-in slide-in-from-bottom-4"
        style={{ animationTimingFunction: "var(--ease-out-quint)" }}
      >
        <h2 className="font-heading text-2xl font-light tracking-tight text-balance italic md:text-3xl">
          {question.label}
        </h2>
        {question.description && (
          <p className="text-base text-pretty text-muted-foreground">
            {question.description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-4">
        <Button
          onClick={onContinue}
          size="default"
          className="gap-2 active:scale-[0.97]"
        >
          Continue
          <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
        </Button>
        <p className="hidden text-sm text-muted-foreground/60 md:block">
          Press{" "}
          <kbd className="rounded border border-border px-1.5 py-0.5 font-mono text-xs">
            Enter ↵
          </kbd>
        </p>
      </div>
    </div>
  )
}
