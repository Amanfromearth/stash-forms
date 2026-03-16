"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import type { Submission } from "@/lib/schema"

interface SubmissionDetailProps {
  submission: Submission
  questions: { id: string; label: string; type: string }[]
}

function hasValue(v: unknown): boolean {
  if (v === undefined || v === null || v === "") return false
  if (Array.isArray(v) && v.length === 0) return false
  return true
}

function AnswerDisplay({
  question,
  value,
}: {
  question: { id: string; label: string; type: string }
  value: unknown
}) {
  if (!hasValue(value)) {
    return <p className="text-sm text-muted-foreground/40 italic">—</p>
  }

  if (Array.isArray(value)) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {value.map((item: string) => (
          <span
            key={item}
            className="inline-flex rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
          >
            {item}
          </span>
        ))}
      </div>
    )
  }

  if (question.type === "multiple_choice") {
    return (
      <span className="inline-flex rounded-md bg-muted px-2.5 py-1 text-sm font-medium">
        {String(value)}
      </span>
    )
  }

  if (question.type === "long_text") {
    return (
      <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm leading-relaxed text-pretty whitespace-pre-wrap">
        {String(value)}
      </p>
    )
  }

  return <p className="text-sm">{String(value)}</p>
}

export function SubmissionDetail({
  submission,
  questions,
}: SubmissionDetailProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showUnanswered, setShowUnanswered] = useState(false)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false)
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [isOpen])

  const answers = submission.answers as Record<string, unknown>
  const email = typeof answers.email === "string" ? answers.email : "—"
  const date = new Date(submission.submittedAt).toLocaleString()

  const answered: typeof questions = []
  const unanswered: typeof questions = []
  for (const q of questions) {
    if (hasValue(answers[q.id])) {
      answered.push(q)
    } else {
      unanswered.push(q)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-sm text-primary hover:underline"
      >
        View
      </button>

      {isOpen ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-2xl border-t border-border bg-background shadow-lg">
            <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
              <div>
                <p className="text-sm font-semibold">{email}</p>
                <p className="text-xs text-muted-foreground">
                  {date} ·{" "}
                  <span className="tabular-nums">
                    {answered.length}/{questions.length}
                  </span>{" "}
                  answered
                  {submission.isPartial ? (
                    <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                      Partial
                    </span>
                  ) : null}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="flex size-8 items-center justify-center rounded-full text-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="divide-y divide-border">
                {answered.map((question) => (
                  <div key={question.id} className="px-5 py-3.5">
                    <p className="mb-1.5 line-clamp-1 text-xs font-medium text-muted-foreground">
                      {question.label}
                    </p>
                    <AnswerDisplay
                      question={question}
                      value={answers[question.id]}
                    />
                  </div>
                ))}
              </div>

              {unanswered.length > 0 ? (
                <div className="border-t border-border px-5 py-3">
                  <button
                    onClick={() => setShowUnanswered(!showUnanswered)}
                    className={cn(
                      "text-xs text-muted-foreground/60 transition-colors hover:text-muted-foreground"
                    )}
                  >
                    {showUnanswered ? "Hide" : "Show"}{" "}
                    <span className="tabular-nums">{unanswered.length}</span>{" "}
                    unanswered
                  </button>
                  {showUnanswered ? (
                    <div className="mt-2 space-y-2">
                      {unanswered.map((q) => (
                        <p
                          key={q.id}
                          className="line-clamp-1 text-xs text-muted-foreground/40"
                        >
                          {q.label}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="border-t border-border px-5 py-3">
                <p className="text-[11px] text-muted-foreground/40 tabular-nums">
                  {submission.ipHash?.slice(0, 12)}… ·{" "}
                  {submission.id.slice(0, 8)}
                </p>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </>
  )
}
