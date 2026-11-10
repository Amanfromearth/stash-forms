"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { SurveyStep } from "./survey-step"
import { useSurveyAnswers } from "./use-survey-answers"
import { useSurveyKeyboard } from "./use-survey-keyboard"
import {
  nextVisibleStep,
  previousVisibleStep,
  getAutoFill,
} from "./survey-navigation"
import { useReducedMotion } from "motion/react"
import { InteriorButton } from "@/components/interior/button"
import { InteriorFeedback } from "@/components/interior/feedback"
import { InteriorValidationContext } from "@/components/interior/validation-context"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon } from "@hugeicons/core-free-icons"
import type { VersionedFormConfig, Question } from "@/lib/form-config"
import { validateAnswers } from "@/lib/validate-answers"
import { ProgressBar } from "./progress-bar"
import { QuestionWrapper } from "./question-wrapper"

interface SurveyFormProps {
  config: VersionedFormConfig
  initialAnswers?: Record<string, unknown>
  initialStep?: number
  onSave?: (answers: Record<string, unknown>) => Promise<void>
  onProgress?: (answers: Record<string, unknown>, step: number) => void
  initialCountry?: string
  onSubmit: (
    answers: Record<string, unknown>
  ) => Promise<{ success: boolean; error?: string }>
  onReset?: () => void
}

export function SurveyForm({
  config,
  initialAnswers,
  initialStep = 0,
  onSave,
  onProgress,
  initialCountry,
  onSubmit,
  onReset,
}: SurveyFormProps) {
  const reducedMotion = useReducedMotion()
  const totalQuestions = config.questions.length

  const [step, setStep] = useState(initialStep)
  const {
    answers,
    setAnswers,
    setAnswer: updateAnswer,
  } = useSurveyAnswers(config, initialCountry, initialAnswers, onSave)
  const [direction, setDirection] = useState<"forward" | "backward">("forward")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [isExiting, setIsExiting] = useState(false)
  const isAnimatingRef = useRef(false)
  const isSubmittingRef = useRef(false)

  const currentQuestion: Question | undefined = config.questions[step - 1]

  useEffect(() => {
    onProgress?.(answers, step)
  }, [answers, step, onProgress])

  useEffect(() => {
    if (step < 1 || step > config.questions.length) return
    const question = config.questions[step - 1]
    window.scrollTo({ top: 0, behavior: "instant" })
    if (["short_text", "email", "long_text"].includes(question.type)) return
    const target = document.getElementById(
      question.type === "dropdown" ? question.id : `${question.id}-heading`
    )
    target?.focus({ preventScroll: true })
  }, [step, config.questions])

  const setAnswer = useCallback(
    (id: string, value: unknown) => {
      updateAnswer(id, value)
      setFieldError(null)
    },
    [updateAnswer]
  )

  const findNextVisibleStep = useCallback(
    (fromStep: number) => nextVisibleStep(config.questions, answers, fromStep),
    [config.questions, answers]
  )
  const findPrevVisibleStep = useCallback(
    (fromStep: number) =>
      previousVisibleStep(config.questions, answers, fromStep),
    [config.questions, answers]
  )
  const applyAutoFill = useCallback(
    (targetStep: number) => {
      const values = getAutoFill(config.questions, answers, targetStep)
      if (Object.keys(values).length === 0) return
      setAnswers((previous) => ({ ...previous, ...values }))
    },
    [config.questions, answers, setAnswers]
  )

  const animateExit = useCallback((): Promise<void> => {
    isAnimatingRef.current = true
    setIsExiting(true)
    return new Promise((resolve) => {
      setTimeout(resolve, reducedMotion ? 0 : 150)
    })
  }, [reducedMotion])

  const goNext = useCallback(async () => {
    if (isAnimatingRef.current || isSubmittingRef.current) return

    if (currentQuestion && currentQuestion.type !== "section_header") {
      const validationError = validateAnswers(
        {
          ...config,
          questions: [{ ...currentQuestion, condition: undefined }],
        },
        { [currentQuestion.id]: answers[currentQuestion.id] }
      )
      if (validationError) {
        setFieldError(validationError)
        return
      }
    }
    setFieldError(null)
    setDirection("forward")

    const { step: nextStep, autoValues } = findNextVisibleStep(step)

    if (Object.keys(autoValues).length > 0) {
      setAnswers((prev) => ({ ...prev, ...autoValues }))
    }

    if (nextStep > totalQuestions) {
      isSubmittingRef.current = true
      setIsSubmitting(true)
      setError(null)
      try {
        const result = await onSubmit({ ...answers, ...autoValues })
        if (result.success) {
          await animateExit()
          isAnimatingRef.current = false
          setIsExiting(false)
          setStep(totalQuestions + 1)
          setDirection("forward")
        } else {
          setError(result.error ?? "Something went wrong. Please try again.")
        }
      } catch {
        setError("Something went wrong. Please try again.")
      } finally {
        isSubmittingRef.current = false
        setIsSubmitting(false)
      }
      return
    }

    await animateExit()
    isAnimatingRef.current = false
    setIsExiting(false)
    applyAutoFill(nextStep)
    setStep(nextStep)
    setDirection("forward")
  }, [
    step,
    totalQuestions,
    currentQuestion,
    config,
    answers,
    onSubmit,
    findNextVisibleStep,
    applyAutoFill,
    animateExit,
    setAnswers,
  ])

  const goBack = useCallback(async () => {
    if (isAnimatingRef.current || isSubmittingRef.current) return
    if (step > 0) {
      setDirection("backward")
      await animateExit()
      isAnimatingRef.current = false
      setIsExiting(false)
      const prevStep = findPrevVisibleStep(step)
      setStep(prevStep)
      setDirection("backward")
      setFieldError(null)
    }
  }, [step, findPrevVisibleStep, animateExit])

  const handleReset = useCallback(() => {
    setStep(0)
    setAnswers({})
    setDirection("forward")
    setIsSubmitting(false)
    setError(null)
    setFieldError(null)
  }, [setAnswers])

  useSurveyKeyboard(step, config.questions, goNext, goBack)

  const {
    questionCount,
    questionNumber,
    showProgressBar,
    showNextButton,
    isLastVisibleStep,
    isQuestionStep,
  } = surveyProgress(config, answers, step, currentQuestion)

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-6 py-20 md:px-12 md:py-24">
      {step === 0 ? (
        <div className="survey-welcome-background absolute top-0 z-0 h-full w-full bg-background" />
      ) : null}

      {showProgressBar ? (
        <ProgressBar current={questionNumber} total={questionCount} />
      ) : null}

      <div className="relative z-20 w-full max-w-2xl">
        <InteriorValidationContext.Provider value={fieldError}>
          <QuestionWrapper
            key={step}
            direction={direction}
            isExiting={isExiting}
            axis={step === 0 ? "vertical" : "horizontal"}
          >
            <SurveyStep
              config={config}
              step={step}
              answers={answers}
              setAnswer={setAnswer}
              goNext={goNext}
              onReset={onReset ?? handleReset}
            />
          </QuestionWrapper>
        </InteriorValidationContext.Provider>

        {showNextButton && (
          <InteriorFeedback id="survey-field-error" message={fieldError} />
        )}

        {showNextButton && (
          <InteriorButton
            data-survey-nav
            onClick={goNext}
            busy={isSubmitting}
            busyLabel={isLastVisibleStep ? "Submitting" : ""}
            className="mt-3"
          >
            {isLastVisibleStep ? "Submit" : "Next"}
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
          </InteriorButton>
        )}

        {error && <InteriorFeedback message={error} />}
      </div>

      {isQuestionStep ? (
        <InteriorButton
          data-survey-nav
          onClick={goBack}
          variant="ghost"
          className="relative z-10 mt-6 min-h-10 px-3 py-2"
        >
          <span aria-hidden="true">←</span> Back
        </InteriorButton>
      ) : null}
    </div>
  )
}

function surveyProgress(
  config: VersionedFormConfig,
  answers: Record<string, unknown>,
  step: number,
  currentQuestion: Question | undefined
) {
  const totalQuestions = config.questions.length
  const findNextVisibleStep = (step: number) =>
    nextVisibleStep(config.questions, answers, step)
  const questionCount = config.questions.filter(
    (q) => q.type !== "section_header"
  ).length
  const questionNumber = config.questions
    .slice(0, step)
    .filter((q) => q.type !== "section_header").length
  const isSectionHeader = currentQuestion?.type === "section_header"
  const showProgressBar =
    step >= 1 && step <= totalQuestions && !isSectionHeader
  const showNextButton = step >= 1 && step <= totalQuestions && !isSectionHeader

  const isLastVisibleStep =
    step >= 1 && findNextVisibleStep(step).step > totalQuestions

  return {
    questionCount,
    questionNumber,
    showProgressBar,
    showNextButton,
    isLastVisibleStep,
    isQuestionStep: step >= 1 && step <= totalQuestions,
  }
}
