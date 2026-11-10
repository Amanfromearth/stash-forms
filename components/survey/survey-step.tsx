"use client"

import type {
  VersionedFormConfig,
  Question,
  MultiSelectQuestion,
  SectionHeaderQuestion,
} from "@/lib/form-config"
import { DropdownStep } from "./steps/dropdown-step"
import { WelcomeScreen } from "./welcome-screen"
import { ThankYouScreen } from "./thank-you-screen"
import { ShortTextStep } from "./steps/short-text-step"
import { EmailStep } from "./steps/email-step"
import { LongTextStep } from "./steps/long-text-step"
import { MultipleChoiceStep } from "./steps/multiple-choice-step"
import { MultiSelectStep } from "./steps/multi-select-step"
import { RatingStep } from "./steps/rating-step"
import { SectionHeaderStep } from "./steps/section-header-step"

interface SurveyStepProps {
  config: VersionedFormConfig
  step: number
  answers: Record<string, unknown>
  setAnswer: (id: string, value: unknown) => void
  goNext: () => Promise<void>
  onReset: () => void
}

export function SurveyStep({
  config,
  step,
  answers,
  setAnswer,
  goNext,
  onReset,
}: SurveyStepProps) {
  const totalQuestions = config.questions.length
  if (step === 0) {
    return <WelcomeScreen config={config} onStart={goNext} />
  }

  if (step === totalQuestions + 1) {
    return <ThankYouScreen onReset={onReset} />
  }

  const question = config.questions[step - 1]

  return (
    <QuestionInput
      question={question}
      answer={answers[question.id]}
      onChange={(value) => setAnswer(question.id, value)}
      goNext={goNext}
    />
  )
}

function QuestionInput({
  question,
  answer,
  onChange,
  goNext,
}: {
  question: Question
  answer: unknown
  onChange: (value: unknown) => void
  goNext: () => Promise<void>
}) {
  const text = (answer as string) ?? ""
  const selected = answer ?? null
  const multiple = (answer as string[]) ?? []
  if (question.type === "section_header") {
    return (
      <SectionHeaderStep
        question={question as SectionHeaderQuestion}
        onContinue={goNext}
      />
    )
  }

  switch (question.type) {
    case "dropdown":
      return (
        <DropdownStep question={question} value={text} onChange={onChange} />
      )
    case "short_text":
      return (
        <ShortTextStep question={question} value={text} onChange={onChange} />
      )
    case "email":
      return <EmailStep question={question} value={text} onChange={onChange} />
    case "long_text":
      return (
        <LongTextStep question={question} value={text} onChange={onChange} />
      )
    case "multiple_choice":
      return (
        <MultipleChoiceStep
          question={question}
          value={selected as string | null}
          onChange={onChange}
          onAdvance={goNext}
        />
      )
    case "multi_select":
      return (
        <MultiSelectStep
          question={question as MultiSelectQuestion}
          value={multiple}
          onChange={onChange}
        />
      )
    case "rating":
      return (
        <RatingStep
          question={question}
          value={selected as number | null}
          onChange={onChange}
          onAdvance={goNext}
        />
      )
  }
}
