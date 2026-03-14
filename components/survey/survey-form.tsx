"use client"

import { useState, useEffect, useCallback } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon } from "@hugeicons/core-free-icons"
import type { FormConfig, Question } from "@/lib/form-config"
import { ProgressBar } from "./progress-bar"
import { QuestionWrapper } from "./question-wrapper"
import { WelcomeScreen } from "./welcome-screen"
import { ThankYouScreen } from "./thank-you-screen"
import { ShortTextStep } from "./steps/short-text-step"
import { EmailStep } from "./steps/email-step"
import { LongTextStep } from "./steps/long-text-step"
import { MultipleChoiceStep } from "./steps/multiple-choice-step"
import { RatingStep } from "./steps/rating-step"

interface SurveyFormProps {
  config: FormConfig
  onSubmit: (
    answers: Record<string, unknown>
  ) => Promise<{ success: boolean; error?: string }>
}

export function SurveyForm({ config, onSubmit }: SurveyFormProps) {
  const totalQuestions = config.questions.length

  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [direction, setDirection] = useState<"forward" | "backward">("forward")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)

  const currentQuestion: Question | undefined =
    step >= 1 && step <= totalQuestions ? config.questions[step - 1] : undefined

  const setAnswer = useCallback((questionId: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
    setFieldError(null)
  }, [])

  const goNext = useCallback(async () => {
    if (currentQuestion?.required) {
      const answer = answers[currentQuestion.id]
      if (answer === "" || answer === null || answer === undefined) {
        setFieldError("This field is required")
        return
      }
    }

    setFieldError(null)

    if (step === totalQuestions) {
      setIsSubmitting(true)
      setError(null)
      try {
        const result = await onSubmit(answers)
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

    setStep((s) => s + 1)
    setDirection("forward")
  }, [step, totalQuestions, currentQuestion, answers, onSubmit])

  const goBack = useCallback(() => {
    if (step > 0) {
      setStep((s) => s - 1)
      setDirection("backward")
      setFieldError(null)
    }
  }, [step])

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

      if (e.key === "Enter") {
        if (e.target instanceof HTMLTextAreaElement) return
        e.preventDefault()
        goNext()
      }

      if (e.key === "ArrowUp") {
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
  }, [step, totalQuestions, goNext, goBack])

  const showProgressBar = step >= 1 && step <= totalQuestions
  const isTextStep =
    currentQuestion?.type === "short_text" ||
    currentQuestion?.type === "email" ||
    currentQuestion?.type === "long_text"
  const showNextButton = step >= 1 && step <= totalQuestions && isTextStep
  const isLastQuestion = step === totalQuestions

  function renderStep() {
    if (step === 0) {
      return <WelcomeScreen config={config} onStart={goNext} />
    }

    if (step === totalQuestions + 1) {
      return <ThankYouScreen config={config} onReset={handleReset} />
    }

    const question = config.questions[step - 1]

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
    <div className="relative flex min-h-dvh flex-col items-center justify-center p-6 md:p-12">
      {showProgressBar && <ProgressBar current={step} total={totalQuestions} />}

      <div className="w-full max-w-2xl">
        <QuestionWrapper key={step} direction={direction}>
          {renderStep()}
        </QuestionWrapper>

        {fieldError && (
          <p className="mt-3 text-sm text-destructive">{fieldError}</p>
        )}

        {showNextButton && (
          <button
            type="button"
            onClick={goNext}
            disabled={isSubmitting}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
          >
            {isSubmitting
              ? "Submitting..."
              : isLastQuestion
                ? "Submit"
                : "Next"}
            {!isSubmitting && (
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
            )}
          </button>
        )}

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
      </div>

      {step >= 1 && step <= totalQuestions && (
        <div className="fixed bottom-6 left-6 text-xs text-muted-foreground/50">
          Press{" "}
          <kbd className="rounded border border-border px-1.5 py-0.5 font-mono text-xs">
            ↑
          </kbd>{" "}
          to go back
        </div>
      )}
    </div>
  )
}
