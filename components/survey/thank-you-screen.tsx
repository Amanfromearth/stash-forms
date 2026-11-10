"use client"

import { m, useReducedMotion } from "motion/react"
import { InteriorButton } from "@/components/interior/button"
import { useCopyToClipboard } from "@/components/interior/use-copy-to-clipboard"
import { CROSSFADE, INSTANT, PRESS } from "@/components/interior/motion"

export function ThankYouScreen({ onReset }: { onReset?: () => void }) {
  const reduced = useReducedMotion()
  const { copy, status } = useCopyToClipboard()
  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-8 text-center">
      <m.div
        initial={reduced ? false : { opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={reduced ? INSTANT : PRESS}
        className="overflow-hidden rounded-2xl"
      >
        {/* Preserve the original animated celebration. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExbHdhdWowdWNhczY1eW9jZTRmNHNkdWZpdGZpZzZreGMwdmo4NGR1byZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/blSTtZehjAZ8I/giphy.gif"
          alt="Thank you celebration"
          className="h-48 w-auto max-w-full object-cover"
        />
      </m.div>
      <div className="flex flex-col gap-3">
        <h1
          tabIndex={-1}
          className="font-heading text-4xl leading-tight font-light tracking-tight text-balance md:text-5xl"
        >
          You&apos;re awesome!
        </h1>
        <p className="max-w-lg text-lg leading-relaxed text-pretty text-muted-foreground">
          Your response has been recorded. Thanks for helping us build something
          better.
        </p>
      </div>
      <div className="flex flex-col items-center gap-2">
        <InteriorButton
          variant="secondary"
          aria-label="Share this survey"
          onClick={() => void copy(new URL("/", window.location.href).href)}
        >
          <span className="relative grid items-center">
            {[
              ["idle", "Share this survey"],
              ["copied", "Link copied"],
              ["error", "Try copying again"],
            ].map(([key, text]) => (
              <m.span
                key={key}
                aria-hidden={status !== key}
                initial={false}
                animate={{
                  opacity: status === key ? 1 : 0,
                  y: !reduced && status !== key ? 3 : 0,
                }}
                transition={reduced ? INSTANT : CROSSFADE}
                className="col-start-1 row-start-1"
              >
                {text}
              </m.span>
            ))}
          </span>
          <svg
            aria-hidden="true"
            className="size-4"
            viewBox="0 0 16 16"
            fill="none"
          >
            {status === "copied" ? (
              <path
                d="m3 8 3 3 7-7"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : (
              <>
                <rect
                  x="6"
                  y="6"
                  width="7"
                  height="7"
                  rx="1.5"
                  stroke="currentColor"
                  strokeWidth="1.4"
                />
                <path
                  d="M10 6V4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h2"
                  stroke="currentColor"
                  strokeWidth="1.4"
                />
              </>
            )}
          </svg>
        </InteriorButton>
        <p role="status" className="min-h-5 text-xs text-muted-foreground">
          {status === "copied"
            ? "Survey link copied to your clipboard."
            : status === "error"
              ? "Could not copy the link. You can share the address from your browser."
              : ""}
        </p>
        {onReset && (
          <InteriorButton onClick={onReset} variant="ghost">
            Submit another response
          </InteriorButton>
        )}
      </div>
    </div>
  )
}
