"use client"

// Adapted from Interior's press-depth and loading-button components (MIT).
import type { ComponentProps } from "react"
import { m, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"
import { usePressDepth } from "./use-press-depth"
import { CROSSFADE, INSTANT, PRESS } from "./motion"

const variantClasses = {
  primary:
    "border-primary bg-primary text-primary-foreground shadow-[inset_0_1px_0_#ffffff26,0_2px_4px_#00000014] hover:bg-primary-hover",
  secondary:
    "border-border bg-card text-foreground shadow-[inset_0_1px_0_#ffffff0a,0_1px_3px_#00000014] hover:bg-muted",
  ghost:
    "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
}

type InteriorButtonProps = Omit<ComponentProps<typeof m.button>, "children"> & {
  children: React.ReactNode
  busy?: boolean
  busyLabel?: string
  variant?: "primary" | "secondary" | "ghost"
}

export function InteriorButton({
  children,
  busy = false,
  busyLabel = "",
  variant = "primary",
  disabled,
  className,
  onKeyDown,
  onKeyUp,
  onPointerDown,
  onBlur,
  ...props
}: InteriorButtonProps) {
  const reduced = useReducedMotion()
  const { pressed, ref, bind } = usePressDepth({ disabled: disabled || busy })
  return (
    <m.button
      {...props}
      ref={ref}
      type={props.type ?? "button"}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      onPointerDown={(event) => {
        bind.onPointerDown(event)
        onPointerDown?.(event)
      }}
      onKeyDown={(event) => {
        bind.onKeyDown(event)
        onKeyDown?.(event)
      }}
      onKeyUp={(event) => {
        bind.onKeyUp(event)
        onKeyUp?.(event)
      }}
      onBlur={(event) => {
        bind.onBlur()
        onBlur?.(event)
      }}
      initial={false}
      animate={{
        y: !reduced && pressed ? 1.5 : 0,
        scale: !reduced && pressed ? 0.985 : 1,
      }}
      transition={reduced ? INSTANT : PRESS}
      className={cn(
        "relative inline-flex min-h-12 cursor-pointer items-center justify-center rounded-xl border px-5 py-3 text-sm font-medium outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        variantClasses[variant],
        className
      )}
    >
      <ButtonContents busy={busy} busyLabel={busyLabel} reduced={!!reduced}>
        {children}
      </ButtonContents>
    </m.button>
  )
}

function ButtonContents({
  busy,
  busyLabel,
  reduced,
  children,
}: {
  busy: boolean
  busyLabel: string
  reduced: boolean
  children: React.ReactNode
}) {
  return (
    <span className="grid items-center justify-items-center">
      <m.span
        aria-hidden={busy || undefined}
        initial={false}
        animate={{ opacity: busy ? 0 : 1, y: busy ? -3 : 0 }}
        transition={reduced ? INSTANT : CROSSFADE}
        className="col-start-1 row-start-1 inline-flex items-center justify-center gap-2"
      >
        {children}
      </m.span>
      <m.span
        aria-hidden={!busy}
        initial={false}
        animate={{ opacity: busy ? 1 : 0, y: !busy ? 3 : 0 }}
        transition={reduced ? INSTANT : CROSSFADE}
        className={cn(
          "col-start-1 row-start-1 inline-flex items-center justify-center gap-2",
          !busyLabel && "hidden"
        )}
      >
        <m.svg
          aria-hidden="true"
          className="size-4"
          viewBox="0 0 16 16"
          fill="none"
          animate={busy && !reduced ? { rotate: 360 } : { rotate: 0 }}
          transition={
            busy && !reduced
              ? { duration: 0.85, repeat: Infinity, ease: "linear" }
              : INSTANT
          }
        >
          <circle
            cx="8"
            cy="8"
            r="6"
            stroke="currentColor"
            strokeWidth="1.6"
            opacity=".25"
          />
          <path
            d="M14 8a6 6 0 0 0-6-6"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </m.svg>
        {busyLabel}
      </m.span>
    </span>
  )
}
