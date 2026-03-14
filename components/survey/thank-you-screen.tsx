"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons"
import type { FormConfig } from "@/lib/form-config"

interface ThankYouScreenProps {
  config: FormConfig
  onReset?: () => void
}

export function ThankYouScreen({
  config: _config,
  onReset,
}: ThankYouScreenProps) {
  return (
    <div className="flex w-full max-w-2xl flex-col gap-8">
      <div className="animate-in duration-500 zoom-in-50 fade-in">
        <HugeiconsIcon
          icon={CheckmarkCircle02Icon}
          size={64}
          className="text-primary"
        />
      </div>

      <div className="flex flex-col gap-3">
        <h1 className="animate-in text-4xl leading-tight font-bold tracking-tight text-balance delay-150 duration-500 fill-mode-both fade-in slide-in-from-bottom-4 md:text-5xl">
          Thank you!
        </h1>
        <p className="animate-in text-xl text-pretty text-muted-foreground delay-300 duration-500 fill-mode-both fade-in slide-in-from-bottom-4">
          Your response has been recorded.
        </p>
      </div>

      {onReset && (
        <button
          onClick={onReset}
          className="w-fit animate-in text-sm text-muted-foreground underline underline-offset-4 transition-colors delay-500 duration-500 fill-mode-both fade-in hover:text-foreground"
        >
          Submit another response
        </button>
      )}
    </div>
  )
}
