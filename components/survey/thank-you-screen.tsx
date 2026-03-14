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
    <div className="flex w-full max-w-2xl flex-col items-center gap-8 text-center">
      <div
        className="animate-in overflow-hidden rounded-2xl duration-500 zoom-in-50 fade-in"
        style={{ animationTimingFunction: "var(--ease-out-quint)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExbHdhdWowdWNhczY1eW9jZTRmNHNkdWZpdGZpZzZreGMwdmo4NGR1byZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/blSTtZehjAZ8I/giphy.gif"
          alt="Thank you celebration"
          className="h-48 w-auto object-cover"
        />
      </div>

      <div className="flex flex-col gap-3">
        <h1
          className="animate-in font-heading text-4xl leading-tight font-light tracking-tight text-balance delay-150 duration-500 fill-mode-both fade-in slide-in-from-bottom-4 md:text-5xl"
          style={{ animationTimingFunction: "var(--ease-out-quint)" }}
        >
          You're awesome! 🎉
        </h1>
        <p
          className="animate-in text-lg text-pretty text-muted-foreground delay-300 duration-500 fill-mode-both fade-in slide-in-from-bottom-4"
          style={{ animationTimingFunction: "var(--ease-out-quint)" }}
        >
          Your response has been recorded. Thanks for helping us build something
          better.
        </p>
      </div>

      {onReset && (
        <button
          onClick={onReset}
          className="w-fit animate-in text-sm text-muted-foreground underline underline-offset-4 transition-colors delay-500 duration-500 fill-mode-both fade-in hover:text-foreground"
          style={{ animationTimingFunction: "var(--ease-out-quint)" }}
        >
          Submit another response
        </button>
      )}
    </div>
  )
}
