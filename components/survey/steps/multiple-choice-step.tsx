"use client"

import { useEffect, useCallback, useRef, useState } from "react"
import type { MultipleChoiceQuestion } from "@/lib/form-config"
import { InteriorChoice } from "@/components/interior/choice"
import { QuestionHeading } from "../question-heading"

export function MultipleChoiceStep({
  question,
  value,
  onChange,
  onAdvance,
}: {
  question: MultipleChoiceQuestion
  value: string | null
  onChange: (value: string) => void
  onAdvance?: () => void
}) {
  const userSelected = useRef(false)
  const listRef = useRef<HTMLDivElement>(null)
  const [focusedIndex, setFocusedIndex] = useState(0)
  useEffect(() => {
    if (!userSelected.current || value === null || !onAdvance) return
    const timer = setTimeout(onAdvance, 500)
    return () => clearTimeout(timer)
  }, [value, onAdvance])
  const choose = useCallback(
    (option: string) => {
      userSelected.current = true
      onChange(option)
    },
    [onChange]
  )
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        event.isComposing ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      )
        return
      const number = Number(event.key)
      if (/^[1-9]$/.test(event.key) && number <= question.options.length) {
        event.preventDefault()
        choose(question.options[number - 1])
        return
      }
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return
      event.preventDefault()
      const next =
        (focusedIndex +
          (event.key === "ArrowDown" ? 1 : -1) +
          question.options.length) %
        question.options.length
      setFocusedIndex(next)
      listRef.current
        ?.querySelectorAll<HTMLButtonElement>('[role="radio"]')
        [next]?.focus()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [choose, focusedIndex, question.options])
  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <QuestionHeading question={question} />
      <div
        ref={listRef}
        role="radiogroup"
        aria-labelledby={`${question.id}-heading`}
        className="flex flex-col gap-2.5"
      >
        {question.options.map((option, index) => (
          <InteriorChoice
            key={option}
            role="radio"
            aria-checked={value === option}
            selected={value === option}
            focused={false}
            letter={"ABCDEFGHIJKLMNOPQRSTUVWXYZ"[index] ?? String(index + 1)}
            tabIndex={index === focusedIndex ? 0 : -1}
            onFocus={() => setFocusedIndex(index)}
            onClick={() => choose(option)}
          >
            {option}
          </InteriorChoice>
        ))}
      </div>
    </div>
  )
}
