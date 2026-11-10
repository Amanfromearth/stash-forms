"use client"

import { useEffect } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { InteriorButton } from "@/components/interior/button"
import type { VersionedFormConfig } from "@/lib/form-config"

interface WelcomeScreenProps {
  config: VersionedFormConfig
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
      <div className="flex flex-col gap-4">
        <h1 className="font-heading text-4xl leading-tight font-light tracking-tight text-balance md:text-5xl">
          🌍 {config.title}
        </h1>
        <p className="text-lg leading-relaxed text-pretty whitespace-pre-line text-muted-foreground">
          {config.description}
        </p>
        <p className="text-sm text-muted-foreground/70">
          ⏱️ Estimated time: 3 minutes
        </p>
      </div>

      <div className="flex items-center gap-4">
        <InteriorButton
          onClick={onStart}
          className="h-auto gap-2 px-5 py-2.5 text-sm"
        >
          Start
          <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
        </InteriorButton>
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
