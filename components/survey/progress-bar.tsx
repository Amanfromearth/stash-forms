"use client"

// Interior's spring fill and reserved progress labels, using the brand palette.
import { m, useReducedMotion } from "motion/react"
import { FILL, INSTANT } from "@/components/interior/motion"

export function ProgressBar({
  current,
  total,
}: {
  current: number
  total: number
}) {
  const reduced = useReducedMotion()
  const fraction = Math.min(1, Math.max(0, current / Math.max(1, total)))
  return (
    <div className="fixed inset-x-0 top-0 z-50 bg-background/90 backdrop-blur-md">
      <div
        className="h-1 bg-muted"
        role="progressbar"
        aria-valuenow={Math.round(fraction * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Question ${current} of ${total}`}
      >
        <m.div
          className="h-full origin-left bg-primary"
          initial={false}
          animate={{ scaleX: fraction }}
          transition={reduced ? INSTANT : FILL}
        />
      </div>
      <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-3 text-xs text-muted-foreground md:px-0">
        <span>Global investing survey</span>
        <span className="font-mono tabular-nums">
          {current} / {total}
        </span>
      </div>
    </div>
  )
}
