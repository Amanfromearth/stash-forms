import type { Question } from "@/lib/form-config"

export function QuestionHeading({ question }: { question: Question }) {
  return (
    <div className="flex flex-col gap-3">
      <h2
        id={`${question.id}-heading`}
        tabIndex={-1}
        className="font-heading text-2xl leading-tight font-light tracking-tight outline-none md:text-3xl"
      >
        {question.label}
        {question.required && (
          <span className="ml-1 text-primary" aria-hidden="true">
            *
          </span>
        )}
      </h2>
      {question.description && (
        <p className="text-base leading-relaxed whitespace-pre-line text-muted-foreground">
          {question.description}
        </p>
      )}
    </div>
  )
}
