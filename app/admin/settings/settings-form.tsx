"use client"

import { useRouter } from "next/navigation"
import { useId, useState, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { updateFormConfigAction } from "@/app/actions/config"
import type { VersionedFormConfig, Question } from "@/lib/form-config"

export function SettingsForm({
  initialConfig,
}: {
  initialConfig: VersionedFormConfig
}) {
  const router = useRouter()
  const [config, setConfig] = useState<VersionedFormConfig>(() =>
    structuredClone(initialConfig)
  )
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<{
    type: "idle" | "success" | "error"
    message?: string
  }>({ type: "idle" })

  function updateQuestion(index: number, patch: Partial<Question>) {
    setConfig((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === index ? ({ ...q, ...patch } as Question) : q
      ),
    }))
  }

  function updateOption(qIndex: number, oIndex: number, value: string) {
    setConfig((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) => {
        if (i !== qIndex || !("options" in q)) return q
        const options = [...q.options]
        options[oIndex] = value
        return { ...q, options } as Question
      }),
    }))
  }

  function addOption(qIndex: number) {
    setConfig((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) => {
        if (i !== qIndex || !("options" in q)) return q
        return { ...q, options: [...q.options, ""] } as Question
      }),
    }))
  }

  function removeOption(qIndex: number, oIndex: number) {
    setConfig((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) => {
        if (i !== qIndex || !("options" in q) || q.options.length <= 1) return q
        return {
          ...q,
          options: q.options.filter((_, j) => j !== oIndex),
        } as Question
      }),
    }))
  }

  function handleSave() {
    setStatus({ type: "idle" })
    startTransition(async () => {
      const result = await updateFormConfigAction(config)
      if (result.success) {
        setStatus({ type: "success", message: `Published v${result.version}` })
        router.push(`/admin/settings?version=${result.version}`)
        router.refresh()
      } else {
        setStatus({
          type: "error",
          message: result.error ?? "Failed to save",
        })
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Form Settings</h2>
          <p className="text-xs text-muted-foreground">
            Editing v{config.version}. Saving publishes a new version and
            preserves this question set and its responses.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {status.type === "success" && (
            <span className="text-xs text-emerald-600">{status.message}</span>
          )}
          {status.type === "error" && (
            <span className="text-xs text-destructive">{status.message}</span>
          )}
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving…" : "Publish New Version"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Survey Metadata</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="survey-title">Title</Label>
            <Input
              id="survey-title"
              value={config.title}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, title: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="survey-description">Description</Label>
            <textarea
              id="survey-description"
              className="flex min-h-16 w-full resize-none rounded-md border border-input bg-input/20 px-2 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 md:text-xs/relaxed dark:bg-input/30"
              value={config.description}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {config.questions.map((q, qi) => (
          <QuestionEditor
            key={q.id}
            q={q}
            number={
              config.questions
                .slice(0, qi + 1)
                .filter((question) => question.type !== "section_header").length
            }
            onUpdate={(patch) => updateQuestion(qi, patch)}
            onOptionChange={(oi, value) => updateOption(qi, oi, value)}
            onAddOption={() => addOption(qi)}
            onRemoveOption={(oi) => removeOption(qi, oi)}
          />
        ))}
      </div>

      <div className="flex items-center gap-3 border-t border-border pt-6">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving..." : "Publish New Version"}
        </Button>
        {status.type === "success" ? (
          <p className="text-sm text-green-600">{status.message}</p>
        ) : status.type === "error" ? (
          <p className="text-sm text-destructive">{status.message}</p>
        ) : null}
      </div>
    </div>
  )
}

interface QuestionEditorProps {
  q: Question
  number: number
  onUpdate: (patch: Partial<Question>) => void
  onOptionChange: (index: number, value: string) => void
  onAddOption: () => void
  onRemoveOption: (index: number) => void
}

function QuestionEditor({
  q,
  number,
  onUpdate,
  onOptionChange,
  onAddOption,
  onRemoveOption,
}: QuestionEditorProps) {
  function getAdvancedFields(q: Question) {
    const fields: Record<string, unknown> = {}
    if ("condition" in q && q.condition) fields.condition = q.condition
    if ("skipIf" in q && q.skipIf) fields.skipIf = q.skipIf
    if ("autoFill" in q && q.autoFill) fields.autoFill = q.autoFill
    return Object.keys(fields).length > 0 ? fields : null
  }

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-muted-foreground">
            {q.type === "section_header" ? "Section" : `Q${number}`}
          </span>
          <span className="font-mono text-xs text-muted-foreground">
            {q.id}
          </span>
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {q.type}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor={`question-${q.id}-field-1`}>Label</Label>
          <Input
            id={`question-${q.id}-field-1`}
            value={q.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor={`question-${q.id}-field-2`}>Description</Label>
          <Input
            id={`question-${q.id}-field-2`}
            value={q.description ?? ""}
            onChange={(e) =>
              onUpdate({
                description: e.target.value || undefined,
              })
            }
          />
        </div>

        {q.type !== "section_header" && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`required-${q.id}`}
              checked={q.required}
              onChange={(e) => onUpdate({ required: e.target.checked })}
              className="size-3.5 rounded border-input accent-primary"
            />
            <Label htmlFor={`required-${q.id}`}>Required</Label>
          </div>
        )}

        <QuestionTypeSettings q={q} onUpdate={onUpdate} />

        {"options" in q && (
          <QuestionOptions
            q={q}
            onOptionChange={onOptionChange}
            onAddOption={onAddOption}
            onRemoveOption={onRemoveOption}
          />
        )}

        {(() => {
          const advanced = getAdvancedFields(q)
          if (!advanced) return null
          return (
            <details className="rounded-md border border-border">
              <summary className="cursor-pointer px-2 py-1.5 text-[10px] font-medium text-muted-foreground select-none">
                Advanced (read-only)
              </summary>
              <pre className="overflow-x-auto px-2 pb-2 text-[10px] leading-relaxed text-muted-foreground">
                {JSON.stringify(advanced, null, 2)}
              </pre>
            </details>
          )
        })()}
      </CardContent>
    </Card>
  )
}

function QuestionOptions({
  q,
  onOptionChange,
  onAddOption,
  onRemoveOption,
}: Pick<
  QuestionEditorProps,
  "onOptionChange" | "onAddOption" | "onRemoveOption"
> & {
  q: Extract<
    Question,
    { type: "dropdown" | "multi_select" | "multiple_choice" }
  >
}) {
  const optionsId = useId()
  const [optionIds, setOptionIds] = useState(() =>
    q.options.map((_, index) => `${optionsId}-${index}`)
  )
  const addOptionId = () => setOptionIds((ids) => [...ids, crypto.randomUUID()])
  const removeOptionId = (index: number) =>
    setOptionIds((ids) => ids.filter((_, i) => i !== index))

  return (
    <fieldset className="space-y-1.5">
      <legend className="text-sm font-medium">Options</legend>
      {q.options.map((opt, oi) => (
        <div key={optionIds[oi]} className="flex items-center gap-1.5">
          <span className="w-5 text-right text-[10px] text-muted-foreground">
            {oi + 1}.
          </span>
          <Input
            id={`question-${q.id}-option-${optionIds[oi]}`}
            aria-label={`Option ${oi + 1} for ${q.label}`}
            value={opt}
            onChange={(e) => onOptionChange(oi, e.target.value)}
            className="flex-1"
          />
          <button
            type="button"
            aria-label={`Remove option ${oi + 1}`}
            onClick={() => {
              removeOptionId(oi)
              onRemoveOption(oi)
            }}
            disabled={q.options.length <= 1}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
          >
            ×
          </button>
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          addOptionId()
          onAddOption()
        }}
      >
        + Add option
      </Button>
    </fieldset>
  )
}

function QuestionTypeSettings({
  q,
  onUpdate,
}: Pick<QuestionEditorProps, "q" | "onUpdate">) {
  if (q.type === "multi_select")
    return <MultiSelectSettings q={q} onUpdate={onUpdate} />
  if (q.type === "rating") return <RatingSettings q={q} onUpdate={onUpdate} />
  return <TextQuestionSettings q={q} onUpdate={onUpdate} />
}
function TextQuestionSettings({
  q,
  onUpdate,
}: Pick<QuestionEditorProps, "q" | "onUpdate">) {
  return (
    <>
      {" "}
      {(q.type === "short_text" || q.type === "email") && (
        <div className="space-y-1">
          <Label htmlFor={`question-${q.id}-field-3`}>Placeholder</Label>
          <Input
            id={`question-${q.id}-field-3`}
            value={q.placeholder ?? ""}
            onChange={(e) =>
              onUpdate({
                placeholder: e.target.value || undefined,
              } as Partial<Question>)
            }
          />
        </div>
      )}
      {q.type === "long_text" && (
        <>
          <div className="space-y-1">
            <Label htmlFor={`question-${q.id}-field-4`}>Placeholder</Label>
            <Input
              id={`question-${q.id}-field-4`}
              value={q.placeholder ?? ""}
              onChange={(e) =>
                onUpdate({
                  placeholder: e.target.value || undefined,
                } as Partial<Question>)
              }
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`question-${q.id}-field-5`}>Max Length</Label>
            <Input
              id={`question-${q.id}-field-5`}
              type="number"
              value={q.maxLength ?? ""}
              onChange={(e) =>
                onUpdate({
                  maxLength: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                } as Partial<Question>)
              }
            />
          </div>
        </>
      )}
    </>
  )
}
function MultiSelectSettings({
  q,
  onUpdate,
}: {
  q: Extract<Question, { type: "multi_select" }>
  onUpdate: QuestionEditorProps["onUpdate"]
}) {
  return (
    <>
      {" "}
      {q.type === "multi_select" && (
        <div className="space-y-1">
          <Label htmlFor={`question-${q.id}-field-6`}>
            Maximum selections (leave blank for unlimited)
          </Label>
          <Input
            id={`question-${q.id}-field-6`}
            type="number"
            min={1}
            max={q.options.length}
            value={q.maxSelections ?? ""}
            onChange={(e) =>
              onUpdate({
                maxSelections: e.target.value
                  ? Number(e.target.value)
                  : undefined,
              })
            }
          />
        </div>
      )}
    </>
  )
}
function RatingSettings({
  q,
  onUpdate,
}: {
  q: Extract<Question, { type: "rating" }>
  onUpdate: QuestionEditorProps["onUpdate"]
}) {
  return (
    <>
      {" "}
      {q.type === "rating" && (
        <div className="flex gap-3">
          <div className="flex-1 space-y-1">
            <Label htmlFor={`question-${q.id}-field-7`}>Min</Label>
            <Input
              id={`question-${q.id}-field-7`}
              type="number"
              value={q.min}
              onChange={(e) =>
                onUpdate({
                  min: Number(e.target.value),
                } as Partial<Question>)
              }
            />
          </div>
          <div className="flex-1 space-y-1">
            <Label htmlFor={`question-${q.id}-field-8`}>Max</Label>
            <Input
              id={`question-${q.id}-field-8`}
              type="number"
              value={q.max}
              onChange={(e) =>
                onUpdate({
                  max: Number(e.target.value),
                } as Partial<Question>)
              }
            />
          </div>
        </div>
      )}
    </>
  )
}
