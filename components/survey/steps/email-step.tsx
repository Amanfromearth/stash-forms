"use client"
import type { EmailQuestion } from "@/lib/form-config"
import { InteriorField } from "@/components/interior/field"
import { QuestionHeading } from "../question-heading"

export function EmailStep({
  question,
  value,
  onChange,
}: {
  question: EmailQuestion
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <QuestionHeading question={question} />
      <InteriorField
        id={question.id}
        label={question.label}
        labelledBy={`${question.id}-heading`}
        showFloatingLabel={false}
        value={value}
        onChange={onChange}
        type="email"
        placeholder={question.placeholder}
        required={question.required}
        autoComplete="email"
      />
    </div>
  )
}
