"use client"
import type { ShortTextQuestion } from "@/lib/form-config"
import { InteriorField } from "@/components/interior/field"
import { QuestionHeading } from "../question-heading"

export function ShortTextStep({
  question,
  value,
  onChange,
}: {
  question: ShortTextQuestion
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <QuestionHeading question={question} />
      <InteriorField
        id={question.id}
        label={question.label}
        value={value}
        onChange={onChange}
        placeholder={question.placeholder}
        required={question.required}
        autoComplete="off"
      />
    </div>
  )
}
