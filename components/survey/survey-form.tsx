"use client"

import { useState, useEffect, useCallback } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon } from "@hugeicons/core-free-icons"
import type {
  FormConfig,
  Question,
  MultiSelectQuestion,
  SectionHeaderQuestion,
} from "@/lib/form-config"
import { upsertPartial } from "@/app/actions/submit"
import { ProgressBar } from "./progress-bar"
import { QuestionWrapper } from "./question-wrapper"
import { WelcomeScreen } from "./welcome-screen"
import { ThankYouScreen } from "./thank-you-screen"
import { ShortTextStep } from "./steps/short-text-step"
import { EmailStep } from "./steps/email-step"
import { LongTextStep } from "./steps/long-text-step"
import { MultipleChoiceStep } from "./steps/multiple-choice-step"
import { MultiSelectStep } from "./steps/multi-select-step"
import { RatingStep } from "./steps/rating-step"
import { SectionHeaderStep } from "./steps/section-header-step"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isQuestionVisible(
  question: Question,
  answers: Record<string, unknown>
): boolean {
  if (question.type === "section_header") return true
  if ("skipIf" in question && question.skipIf) {
    const source = answers[question.skipIf.questionId]
    if (Array.isArray(source)) {
      const shouldSkip = question.skipIf.containsAny.some((v) =>
        source.includes(v)
      )
      if (shouldSkip) return false
    }
  }
  if (!("condition" in question) || !question.condition) return true
  const { questionId, equals } = question.condition
  const answer = answers[questionId]
  return answer === equals
}

interface SurveyFormProps {
  config: FormConfig
  sessionId: string
  onSubmit: (
    answers: Record<string, unknown>
  ) => Promise<{ success: boolean; error?: string }>
}

export function SurveyForm({ config, sessionId, onSubmit }: SurveyFormProps) {
  const totalQuestions = config.questions.length

  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [direction, setDirection] = useState<"forward" | "backward">("forward")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)

  const filledCount = Object.values(answers).filter(
    (v) =>
      v !== null &&
      v !== undefined &&
      v !== "" &&
      !(Array.isArray(v) && v.length === 0)
  ).length

  useEffect(() => {
    if (filledCount < 3) return
    const timer = setTimeout(() => {
      upsertPartial({ sessionId, answers })
    }, 1000)
    return () => clearTimeout(timer)
  }, [answers, filledCount, sessionId])

  const currentQuestion: Question | undefined =
    step >= 1 && step <= totalQuestions ? config.questions[step - 1] : undefined

  const setAnswer = useCallback((questionId: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
    setFieldError(null)
  }, [])

  const findNextVisibleStep = useCallback(
    (
      fromStep: number
    ): { step: number; autoValues: Record<string, string> } => {
      const autoValues: Record<string, string> = {}
      let next = fromStep + 1
      while (next <= totalQuestions) {
        const q = config.questions[next - 1]
        const merged = { ...answers, ...autoValues }
        if (isQuestionVisible(q, merged)) break
        if ("skipIf" in q && q.skipIf) {
          autoValues[q.id] = q.skipIf.autoValue
        }
        next++
      }
      return { step: next, autoValues }
    },
    [config.questions, totalQuestions, answers]
  )

  const findPrevVisibleStep = useCallback(
    (fromStep: number): number => {
      let prev = fromStep - 1
      while (prev >= 1) {
        const q = config.questions[prev - 1]
        if (isQuestionVisible(q, answers)) return prev
        prev--
      }
      return prev
    },
    [config.questions, answers]
  )

  const applyAutoFill = useCallback(
    (targetStep: number) => {
      if (targetStep < 1 || targetStep > totalQuestions) return
      const q = config.questions[targetStep - 1]
      if (
        !q ||
        q.type === "section_header" ||
        !("autoFill" in q) ||
        !q.autoFill
      )
        return
      const { questionId, ifContains, value } = q.autoFill
      const sourceAnswer = answers[questionId]
      if (Array.isArray(sourceAnswer)) {
        const hasMatch = ifContains.some((v) => sourceAnswer.includes(v))
        if (hasMatch && answers[q.id] === undefined) {
          setAnswers((prev) => ({ ...prev, [q.id]: value }))
        }
      }
    },
    [config.questions, totalQuestions, answers]
  )

  const goNext = useCallback(async () => {
    if (
      currentQuestion &&
      currentQuestion.type !== "section_header" &&
      currentQuestion.required
    ) {
      const answer = answers[currentQuestion.id]
      const isEmpty =
        answer === "" ||
        answer === null ||
        answer === undefined ||
        (Array.isArray(answer) && answer.length === 0)
      if (isEmpty) {
        setFieldError("This field is required")
        return
      }

      if (currentQuestion.type === "email" && typeof answer === "string") {
        if (!EMAIL_REGEX.test(answer)) {
          setFieldError("Please enter a valid email address")
          return
        }
      }
    }

    setFieldError(null)

    const { step: nextStep, autoValues } = findNextVisibleStep(step)

    if (Object.keys(autoValues).length > 0) {
      setAnswers((prev) => ({ ...prev, ...autoValues }))
    }

    if (nextStep > totalQuestions) {
      setIsSubmitting(true)
      setError(null)
      try {
        const result = await onSubmit({ ...answers, ...autoValues })
        if (result.success) {
          setStep(totalQuestions + 1)
          setDirection("forward")
        } else {
          setError(result.error ?? "Something went wrong. Please try again.")
        }
      } catch {
        setError("Something went wrong. Please try again.")
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    applyAutoFill(nextStep)
    setStep(nextStep)
    setDirection("forward")
  }, [
    step,
    totalQuestions,
    currentQuestion,
    answers,
    onSubmit,
    findNextVisibleStep,
    applyAutoFill,
  ])

  const goBack = useCallback(() => {
    if (step > 0) {
      const prevStep = findPrevVisibleStep(step)
      setStep(prevStep)
      setDirection("backward")
      setFieldError(null)
    }
  }, [step, findPrevVisibleStep])

  const handleReset = useCallback(() => {
    setStep(0)
    setAnswers({})
    setDirection("forward")
    setIsSubmitting(false)
    setError(null)
    setFieldError(null)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (step < 1 || step > totalQuestions) return

      const isSectionHeader =
        config.questions[step - 1]?.type === "section_header"

      if (e.key === "Enter" && !isSectionHeader) {
        if (e.target instanceof HTMLTextAreaElement) {
          const isTouchDevice =
            "ontouchstart" in window || navigator.maxTouchPoints > 0
          if (isTouchDevice || e.shiftKey) return
        }
        e.preventDefault()
        goNext()
      }

      if (e.key === "ArrowLeft") {
        if (
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement
        )
          return
        e.preventDefault()
        goBack()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [step, totalQuestions, goNext, goBack, config.questions])

  const isSectionHeader = currentQuestion?.type === "section_header"
  const showProgressBar =
    step >= 1 && step <= totalQuestions && !isSectionHeader
  const isTextStep =
    currentQuestion?.type === "short_text" ||
    currentQuestion?.type === "email" ||
    currentQuestion?.type === "long_text"
  const isMultiSelect = currentQuestion?.type === "multi_select"
  const showNextButton = step >= 1 && step <= totalQuestions && !isSectionHeader

  const isLastVisibleStep =
    step >= 1 && findNextVisibleStep(step).step > totalQuestions

  function renderStep() {
    if (step === 0) {
      return <WelcomeScreen config={config} onStart={goNext} />
    }

    if (step === totalQuestions + 1) {
      return <ThankYouScreen onReset={handleReset} />
    }

    const question = config.questions[step - 1]

    if (question.type === "section_header") {
      return (
        <SectionHeaderStep
          question={question as SectionHeaderQuestion}
          onContinue={goNext}
        />
      )
    }

    switch (question.type) {
      case "short_text":
        return (
          <ShortTextStep
            question={question}
            value={(answers[question.id] as string) ?? ""}
            onChange={(v) => setAnswer(question.id, v)}
          />
        )
      case "email":
        return (
          <EmailStep
            question={question}
            value={(answers[question.id] as string) ?? ""}
            onChange={(v) => setAnswer(question.id, v)}
          />
        )
      case "long_text":
        return (
          <LongTextStep
            question={question}
            value={(answers[question.id] as string) ?? ""}
            onChange={(v) => setAnswer(question.id, v)}
          />
        )
      case "multiple_choice":
        return (
          <MultipleChoiceStep
            question={question}
            value={(answers[question.id] as string | null) ?? null}
            onChange={(v) => setAnswer(question.id, v)}
            onAdvance={goNext}
          />
        )
      case "multi_select":
        return (
          <MultiSelectStep
            question={question as MultiSelectQuestion}
            value={(answers[question.id] as string[]) ?? []}
            onChange={(v) => setAnswer(question.id, v)}
          />
        )
      case "rating":
        return (
          <RatingStep
            question={question}
            value={(answers[question.id] as number | null) ?? null}
            onChange={(v) => setAnswer(question.id, v)}
            onAdvance={goNext}
          />
        )
    }
  }

  return (
    <div
      className={`relative flex min-h-dvh flex-col items-center justify-center p-6 md:p-12 ${step === 0 ? "landing-gradient" : ""}`}
    >
      {showProgressBar ? (
        <ProgressBar current={step} total={totalQuestions} />
      ) : null}

      <div className="w-full max-w-2xl">
        <QuestionWrapper key={step} direction={direction}>
          {renderStep()}
        </QuestionWrapper>

        {fieldError && !isSectionHeader && (
          <p className="mt-3 text-sm text-destructive">{fieldError}</p>
        )}

        {showNextButton && (
          <button
            type="button"
            onClick={goNext}
            disabled={isSubmitting}
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors duration-150 hover:bg-accent active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50"
          >
            {isSubmitting
              ? "Submitting..."
              : isLastVisibleStep
                ? "Submit"
                : "Next"}
            {!isSubmitting && (
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
            )}
          </button>
        )}

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
      </div>

      {step >= 1 && step <= totalQuestions ? (
        <button
          onClick={goBack}
          className="mt-12 cursor-pointer rounded-md px-3 py-2 text-sm text-muted-foreground/50 transition-colors hover:text-muted-foreground active:bg-muted"
        >
          <span className="hidden md:inline">
            <kbd className="rounded border border-border px-1.5 py-0.5 font-mono text-xs">
              ←
            </kbd>{" "}
          </span>
          <span className="md:hidden">← </span>
          Back
        </button>
      ) : null}
    </div>
  )
}
