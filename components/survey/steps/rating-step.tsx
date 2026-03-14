"use client"

import { useEffect, useRef } from "react"
import { StarRating } from "@/components/survey/star-rating"
import type { RatingQuestion } from "@/lib/form-config"

interface RatingStepProps {
  question: RatingQuestion
  value: number | null
  onChange: (value: number) => void
  onAdvance?: () => void
}

export function RatingStep({
  question,
  value,
  onChange,
  onAdvance,
}: RatingStepProps) {
  const userSelected = useRef(false)

  const handleChange = (v: number) => {
    userSelected.current = true
    onChange(v)
  }

  useEffect(() => {
    if (userSelected.current && value !== null && onAdvance) {
      const timer = setTimeout(onAdvance, 500)
      return () => clearTimeout(timer)
    }
  }, [value, onAdvance])

  return (
    <div className="flex w-full max-w-2xl flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-2xl leading-tight font-light tracking-tight md:text-3xl">
          {question.label}
          {question.required && (
            <span className="ml-1 text-primary" aria-hidden="true">
              *
            </span>
          )}
        </h2>
        {question.description && (
          <p className="text-base text-muted-foreground">
            {question.description}
          </p>
        )}
      </div>

      <div className="flex flex-col items-start gap-3">
        <StarRating
          value={value}
          onChange={handleChange}
          min={question.min}
          max={question.max}
        />
        <div className="flex w-full max-w-[240px] items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {question.min} — Poor
          </span>
          <span className="text-xs text-muted-foreground">
            Excellent — {question.max}
          </span>
        </div>
      </div>
    </div>
  )
}
