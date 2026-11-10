"use client"

import type { DropdownQuestion } from "@/lib/form-config"
import { InteriorSelect } from "@/components/interior/select"
import { CountryFlag } from "../country-flag"
import { QuestionHeading } from "../question-heading"

export function DropdownStep({
  question,
  value,
  onChange,
}: {
  question: DropdownQuestion
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <QuestionHeading question={question} />
      <InteriorSelect
        id={question.id}
        label={question.label}
        options={question.options}
        value={value}
        onChange={onChange}
        required={question.required}
        renderOptionIcon={
          question.id === "country"
            ? (country) => <CountryFlag country={country} />
            : undefined
        }
      />
    </div>
  )
}
