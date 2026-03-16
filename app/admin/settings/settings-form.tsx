"use client"

import { useState, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { updateFormConfigAction } from "@/app/actions/config"
import type { FormConfig, Question } from "@/lib/form-config"

export function SettingsForm({ initialConfig }: { initialConfig: FormConfig }) {
  const [config, setConfig] = useState<FormConfig>(
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
        setStatus({ type: "success", message: "Settings saved" })
      } else {
        setStatus({
          type: "error",
          message: result.error ?? "Failed to save",
        })
      }
    })
  }

  function getAdvancedFields(q: Question) {
    const fields: Record<string, unknown> = {}
    if ("condition" in q && q.condition) fields.condition = q.condition
    if ("skipIf" in q && q.skipIf) fields.skipIf = q.skipIf
    if ("autoFill" in q && q.autoFill) fields.autoFill = q.autoFill
    return Object.keys(fields).length > 0 ? fields : null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Form Settings</h2>
          <p className="text-xs text-muted-foreground">
            Edit question labels, descriptions, options, and placeholders.
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
            {isPending ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Survey Metadata</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Title</Label>
            <Input
              value={config.title}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, title: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <textarea
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
          <Card key={q.id} size="sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-muted-foreground">Q{qi + 1}</span>
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
                <Label>Label</Label>
                <Input
                  value={q.label}
                  onChange={(e) =>
                    updateQuestion(qi, { label: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1">
                <Label>Description</Label>
                <Input
                  value={q.description ?? ""}
                  onChange={(e) =>
                    updateQuestion(qi, {
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
                    onChange={(e) =>
                      updateQuestion(qi, { required: e.target.checked })
                    }
                    className="size-3.5 rounded border-input accent-primary"
                  />
                  <Label htmlFor={`required-${q.id}`}>Required</Label>
                </div>
              )}

              {(q.type === "short_text" || q.type === "email") && (
                <div className="space-y-1">
                  <Label>Placeholder</Label>
                  <Input
                    value={q.placeholder ?? ""}
                    onChange={(e) =>
                      updateQuestion(qi, {
                        placeholder: e.target.value || undefined,
                      } as Partial<Question>)
                    }
                  />
                </div>
              )}

              {q.type === "long_text" && (
                <>
                  <div className="space-y-1">
                    <Label>Placeholder</Label>
                    <Input
                      value={q.placeholder ?? ""}
                      onChange={(e) =>
                        updateQuestion(qi, {
                          placeholder: e.target.value || undefined,
                        } as Partial<Question>)
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Max Length</Label>
                    <Input
                      type="number"
                      value={q.maxLength ?? ""}
                      onChange={(e) =>
                        updateQuestion(qi, {
                          maxLength: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        } as Partial<Question>)
                      }
                    />
                  </div>
                </>
              )}

              {q.type === "rating" && (
                <div className="flex gap-3">
                  <div className="flex-1 space-y-1">
                    <Label>Min</Label>
                    <Input
                      type="number"
                      value={q.min}
                      onChange={(e) =>
                        updateQuestion(qi, {
                          min: Number(e.target.value),
                        } as Partial<Question>)
                      }
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label>Max</Label>
                    <Input
                      type="number"
                      value={q.max}
                      onChange={(e) =>
                        updateQuestion(qi, {
                          max: Number(e.target.value),
                        } as Partial<Question>)
                      }
                    />
                  </div>
                </div>
              )}

              {(q.type === "multiple_choice" || q.type === "multi_select") && (
                <div className="space-y-1.5">
                  <Label>Options</Label>
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-1.5">
                      <span className="w-5 text-right text-[10px] text-muted-foreground">
                        {oi + 1}.
                      </span>
                      <Input
                        value={opt}
                        onChange={(e) => updateOption(qi, oi, e.target.value)}
                        className="flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => removeOption(qi, oi)}
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
                    onClick={() => addOption(qi)}
                  >
                    + Add option
                  </Button>
                </div>
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
        ))}
      </div>

      <div className="flex items-center gap-3 border-t border-border pt-6">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving..." : "Save Changes"}
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
