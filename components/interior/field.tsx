"use client"

// Floating labels and settled feedback adapted from Interior's floating-label.
import { m, useReducedMotion } from "motion/react"
import { useContext, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { InteriorValidationContext } from "./validation-context"
import { INSTANT } from "./motion"

export function InteriorField({
  id,
  label,
  value,
  onChange,
  multiline = false,
  type = "text",
  required,
  placeholder,
  maxLength,
  autoComplete,
  showFloatingLabel = true,
  labelledBy,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  multiline?: boolean
  type?: "text" | "email"
  required?: boolean
  placeholder?: string
  maxLength?: number
  autoComplete?: string
  showFloatingLabel?: boolean
  labelledBy?: string
}) {
  const validationError = useContext(InteriorValidationContext)
  const [focused, setFocused] = useState(false)
  const raised = focused || value.length > 0
  const inputRef = useRef<HTMLInputElement>(null)
  const textRef = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    ;(multiline ? textRef.current : inputRef.current)?.focus({
      preventScroll: true,
    })
  }, [multiline])
  const hint = placeholder || defaultHint(multiline, type)
  const fieldProps = getFieldProps({
    id,
    value,
    required,
    maxLength,
    hint,
    autoComplete,
    showFloatingLabel,
    raised,
    labelledBy,
    label,
    validationError,
    onChange,
    setFocused,
    multiline,
  })

  return (
    <div>
      <div
        className={cn(
          "relative rounded-xl border bg-card shadow-[inset_0_1px_2px_#00000008] transition-[border-color,box-shadow]",
          validationError
            ? "border-destructive ring-2 ring-destructive/20"
            : focused
              ? "border-primary ring-2 ring-ring/20"
              : "border-border"
        )}
      >
        {multiline ? (
          <textarea {...fieldProps} rows={4} ref={textRef} />
        ) : (
          <input
            {...fieldProps}
            type={type}
            inputMode={type === "email" ? "email" : "text"}
            ref={inputRef}
          />
        )}
        {showFloatingLabel && (
          <FloatingLabel
            id={id}
            raised={raised}
            focused={focused}
            required={required}
            type={type}
            multiline={multiline}
          />
        )}
      </div>
      <div className="mt-2 flex min-h-5 items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>
          {multiline ? "Shift + Enter for a new line" : "Enter to continue"}
        </span>
        {maxLength !== undefined && (
          <span className="tabular-nums">
            {value.length} / {maxLength}
          </span>
        )}
      </div>
    </div>
  )
}

function FloatingLabel({
  id,
  raised,
  focused,
  required,
  type,
  multiline,
}: {
  id: string
  raised: boolean
  focused: boolean
  required?: boolean
  type: string
  multiline: boolean
}) {
  const reduced = useReducedMotion()
  return (
    <m.label
      htmlFor={id}
      initial={false}
      animate={{ y: raised ? 0 : 12, scale: raised ? 0.78 : 1 }}
      transition={
        reduced
          ? INSTANT
          : { type: "spring", stiffness: 760, damping: 46, mass: 0.5 }
      }
      style={{ originX: 0 }}
      className={cn(
        "absolute top-2 left-4 cursor-text text-base leading-6",
        focused ? "text-primary" : "text-muted-foreground"
      )}
    >
      {multiline
        ? "Your answer"
        : type === "email"
          ? "Email address"
          : "Your answer"}
      {required && <span aria-hidden="true"> *</span>}
    </m.label>
  )
}

function defaultHint(multiline: boolean, type: string) {
  if (multiline) return "Share your thoughts"
  return type === "email" ? "you@example.com" : "Your answer"
}

function getFieldProps({
  id,
  value,
  required,
  maxLength,
  hint,
  autoComplete,
  showFloatingLabel,
  raised,
  labelledBy,
  label,
  validationError,
  onChange,
  setFocused,
  multiline,
}: {
  id: string
  value: string
  required?: boolean
  maxLength?: number
  hint: string
  autoComplete?: string
  showFloatingLabel: boolean
  raised: boolean
  labelledBy?: string
  label: string
  validationError: string | null
  onChange: (value: string) => void
  setFocused: (value: boolean) => void
  multiline: boolean
}) {
  return {
    id,
    value,
    required,
    maxLength,
    placeholder: !showFloatingLabel || raised ? hint : "",
    autoComplete,
    "aria-label": labelledBy ? undefined : label,
    "aria-labelledby": labelledBy,
    "aria-invalid": !!validationError,
    "aria-describedby": validationError ? "survey-field-error" : undefined,
    onChange: (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => onChange(event.target.value),
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    className: cn(
      "w-full rounded-xl bg-transparent px-4 text-base leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/60",
      showFloatingLabel ? "pt-7 pb-3" : "py-4",
      multiline ? "min-h-40 resize-y" : "min-h-16"
    ),
  }
}
