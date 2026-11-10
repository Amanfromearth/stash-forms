"use client"

// Interior's press-depth and poll-results feedback, adapted for survey choices.
import { m, useReducedMotion } from "motion/react"
import type { ComponentProps, ReactNode } from "react"
import { cn } from "@/lib/utils"
import { usePressDepth } from "./use-press-depth"
import { INSTANT, PRESS } from "./motion"

export function InteriorChoice({
  selected,
  letter,
  multiple = false,
  focused = false,
  children,
  disabled,
  className,
  ...props
}: Omit<ComponentProps<typeof m.button>, "children"> & {
  children: ReactNode
  selected: boolean
  letter: string
  multiple?: boolean
  focused?: boolean
}) {
  const reduced = useReducedMotion()
  const { pressed, ref, bind } = usePressDepth({ disabled })
  return (
    <m.button
      {...props}
      ref={ref}
      type="button"
      disabled={disabled}
      onPointerDown={bind.onPointerDown}
      onKeyDown={bind.onKeyDown}
      onKeyUp={bind.onKeyUp}
      onBlur={bind.onBlur}
      initial={false}
      animate={{
        scale: !reduced && pressed ? 0.992 : 1,
        y: !reduced && pressed ? 1 : 0,
      }}
      transition={reduced ? INSTANT : PRESS}
      className={cn(
        "group relative flex min-h-16 w-full cursor-pointer items-center gap-4 rounded-xl border p-4 text-left text-foreground shadow-[inset_0_1px_0_#ffffff05,0_1px_2px_#00000008] transition-[border-color,background-color,box-shadow] duration-150 outline-none hover:border-primary/60 hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-40 md:px-5",
        selected
          ? "border-primary bg-primary/10 shadow-[inset_0_0_0_1px_var(--primary)]"
          : focused
            ? "border-primary/50 bg-primary/5"
            : "border-border bg-card",
        className
      )}
    >
      <span
        aria-hidden="true"
        className="flex size-6 shrink-0 items-center justify-center rounded-md border border-border bg-background font-mono text-[11px] text-muted-foreground"
      >
        {letter}
      </span>
      <span className="min-w-0 flex-1 text-base leading-relaxed">
        {children}
      </span>
      <ChoiceIndicator
        multiple={multiple}
        selected={selected}
        reduced={!!reduced}
      />
    </m.button>
  )
}

function ChoiceIndicator({
  multiple,
  selected,
  reduced,
}: {
  multiple: boolean
  selected: boolean
  reduced: boolean
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative grid size-5 shrink-0 place-items-center border transition-colors",
        multiple ? "rounded-md" : "rounded-full",
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background"
      )}
    >
      {multiple ? (
        <svg className="size-3" viewBox="0 0 14 14" fill="none">
          <m.path
            d="M2.5 7 5.5 10 11.5 3.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={false}
            animate={{
              pathLength: selected ? 1 : 0,
              opacity: selected ? 1 : 0,
            }}
            transition={reduced ? INSTANT : { duration: 0.18 }}
          />
        </svg>
      ) : (
        <m.span
          className="size-2 rounded-full bg-primary-foreground"
          initial={false}
          animate={{ scale: selected ? 1 : 0.3, opacity: selected ? 1 : 0 }}
          transition={reduced ? INSTANT : PRESS}
        />
      )}
    </span>
  )
}
