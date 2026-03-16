"use client"

import { useState, useEffect } from "react"
import type { Submission } from "@/lib/schema"
import type { FormConfig } from "@/lib/form-config"

interface SubmissionDetailProps {
  submission: Submission
  config: FormConfig
}

export function SubmissionDetail({
  submission,
  config,
}: SubmissionDetailProps) {
  const [isOpen, setIsOpen] = useState(false)

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
  const answeredCount = config.questions.filter((q) => {
    const a = answers[q.id]
    return (
      a !== undefined &&
      a !== null &&
      a !== "" &&
      !(Array.isArray(a) && a.length === 0)
    )
  }).length

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
                  {date} · {answeredCount} of {config.questions.length} answered
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

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="space-y-4">
                {config.questions.map((question) => {
                  if (question.type === "section_header") return null
                  const answer = answers[question.id]
                  const hasAnswer =
                    answer !== undefined &&
                    answer !== null &&
                    answer !== "" &&
                    !(Array.isArray(answer) && answer.length === 0)

                  return (
                    <div key={question.id} className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        {question.label}
                      </p>
                      {hasAnswer ? (
                        <p className="text-sm">
                          {Array.isArray(answer)
                            ? answer.join(", ")
                            : String(answer)}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground/50 italic">
                          Not answered
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="mt-6 border-t border-border pt-3">
                <p className="text-[11px] text-muted-foreground/50">
                  IP: {submission.ipHash?.slice(0, 12)}… · ID:{" "}
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
