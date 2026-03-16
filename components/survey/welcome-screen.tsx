"use client"

import { useEffect } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import type { FormConfig } from "@/lib/form-config"

interface WelcomeScreenProps {
  config: FormConfig
  onStart: () => void
}

export function WelcomeScreen({ config, onStart }: WelcomeScreenProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault()
        onStart()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onStart])

  return (
    <div className="flex w-full max-w-2xl flex-col gap-8">
      <div
        className="flex animate-in flex-col gap-4 duration-500 fade-in slide-in-from-bottom-4"
        style={{ animationTimingFunction: "var(--ease-out-quint)" }}
      >
        <h1 className="font-heading text-3xl leading-tight font-light tracking-tight text-balance md:text-5xl">
          🌍 {config.title}
        </h1>
        <p className="text-base md:text-lg leading-relaxed text-pretty whitespace-pre-line text-muted-foreground">
          {config.description}
        </p>
        <p className="text-sm text-muted-foreground/70">
          ⏱️ Estimated time: 3 minutes
        </p>
      </div>

      <div className="flex items-center gap-4">
        <Button
          onClick={onStart}
          size="lg"
          className="h-auto gap-2 px-5 py-2.5 text-sm"
        >
          Start
          <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
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
