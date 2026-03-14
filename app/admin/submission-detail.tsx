"use client"

import { useState } from "react"
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

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-sm text-primary hover:underline"
      >
        {isOpen ? "Hide" : "View"}
      </button>

      {isOpen && (
        <div className="mt-3 space-y-3 rounded-lg border border-border bg-muted/30 p-4">
          {config.questions.map((question) => {
            const answer = submission.answers[question.id]
            return (
              <div key={question.id} className="space-y-1">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {question.label}
                </p>
                <p className="text-sm">
                  {answer !== undefined && answer !== null && answer !== "" ? (
                    String(answer)
                  ) : (
                    <span className="text-muted-foreground italic">N/A</span>
                  )}
                </p>
              </div>
            )
          })}
          <div className="space-y-1 border-t border-border pt-2">
            <p className="text-xs text-muted-foreground">
              IP Hash: {submission.ipHash?.slice(0, 16)}...
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
