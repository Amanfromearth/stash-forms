"use client"

import { useCallback, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { StarIcon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"

interface StarRatingProps {
  value: number | null
  onChange: (value: number) => void
  min?: number
  max?: number
  disabled?: boolean
}

function StarRating({
  value,
  onChange,
  min = 1,
  max = 5,
  disabled = false,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null)
  const groupRef = useRef<HTMLDivElement>(null)

  const displayValue = hoverValue ?? value ?? 0

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, position: number) => {
      let nextValue: number | undefined

      switch (event.key) {
        case "ArrowRight":
        case "ArrowUp": {
          event.preventDefault()
          nextValue = Math.min(position + 1, max)
          break
        }
        case "ArrowLeft":
        case "ArrowDown": {
          event.preventDefault()
          nextValue = Math.max(position - 1, min)
          break
        }
        case "Home": {
          event.preventDefault()
          nextValue = min
          break
        }
        case "End": {
          event.preventDefault()
          nextValue = max
          break
        }
      }

      if (nextValue !== undefined) {
        onChange(nextValue)
        // Move focus to the newly selected star
        const group = groupRef.current
        if (group) {
          const nextButton = group.querySelector<HTMLButtonElement>(
            `[data-star-position="${nextValue}"]`
          )
          nextButton?.focus()
        }
      }
    },
    [max, min, onChange]
  )

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label={`Rating from ${min} to ${max} stars`}
      className={cn(
        "inline-flex gap-1",
        disabled && "pointer-events-none opacity-50"
      )}
    >
      {Array.from({ length: max }, (_, index) => {
        const position = index + 1
        const isFilled = position <= displayValue
        const isSelected = value === position

        return (
          <button
            key={position}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={`Rate ${position} out of ${max}`}
            data-star-position={position}
            disabled={disabled}
            tabIndex={isSelected || (!value && position === 1) ? 0 : -1}
            className={cn(
              "inline-flex cursor-pointer items-center justify-center rounded-md p-1 transition-all duration-150 will-change-transform outline-none active:scale-90",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isFilled
                ? "text-primary"
                : "text-muted-foreground hover:text-primary/60"
            )}
            onClick={() => onChange(position)}
            onMouseEnter={() => setHoverValue(position)}
            onMouseLeave={() => setHoverValue(null)}
            onKeyDown={(e) => handleKeyDown(e, position)}
          >
            <HugeiconsIcon
              icon={StarIcon}
              size={40}
              fill={isFilled ? "currentColor" : "none"}
              strokeWidth={1.5}
            />
          </button>
        )
      })}
    </div>
  )
}

export { StarRating }
export type { StarRatingProps }
