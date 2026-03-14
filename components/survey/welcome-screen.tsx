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
    <div className="flex w-full max-w-2xl animate-in flex-col gap-8 duration-500 fade-in slide-in-from-bottom-4">
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl leading-tight font-bold tracking-tight text-balance md:text-5xl">
          {config.title}
        </h1>
        <p className="text-xl leading-relaxed text-pretty text-muted-foreground">
          {config.description}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <Button
          onClick={onStart}
          size="lg"
          className="h-auto gap-2 px-8 py-6 text-base"
        >
          Start
          <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
        </Button>
        <p className="text-sm text-muted-foreground/60">
          Press{" "}
          <kbd className="rounded border border-border px-1.5 py-0.5 font-mono text-xs">
            Enter ↵
          </kbd>
        </p>
      </div>
    </div>
  )
}
