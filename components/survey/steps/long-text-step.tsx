"use client"
import type { LongTextQuestion } from "@/lib/form-config"
import { InteriorField } from "@/components/interior/field"
import { QuestionHeading } from "../question-heading"

export function LongTextStep({
  question,
  value,
  onChange,
}: {
  question: LongTextQuestion
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
        multiline
        placeholder={question.placeholder}
        maxLength={question.maxLength}
        required={question.required}
      />
    </div>
  )
}
