"use client"

// Interior's inline-validation crossfade with reserved space for error feedback.
import { m, useReducedMotion } from "motion/react"
import { CROSSFADE, INSTANT } from "./motion"

export function InteriorFeedback({
  message,
  id,
}: {
  message: string | null
  id?: string
}) {
  const reduced = useReducedMotion()
  return (
    <div className="mt-3 min-h-6" aria-live="polite" aria-atomic="true" id={id}>
      <m.p
        initial={false}
        animate={{ opacity: message ? 1 : 0, y: !reduced && message ? 0 : 2 }}
        transition={reduced ? INSTANT : CROSSFADE}
        className="flex items-center gap-2 text-sm text-destructive"
      >
        {message && (
          <>
            <span
              aria-hidden="true"
              className="grid size-4 shrink-0 place-items-center rounded-full border border-current text-[10px]"
            >
              !
            </span>
            <span>{message}</span>
          </>
        )}
      </m.p>
    </div>
  )
}
