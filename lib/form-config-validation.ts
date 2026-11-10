import { z } from "zod"

const base = {
  id: z.string().min(1).max(100),
  label: z.string().trim().min(1).max(2_000),
  description: z.string().max(10_000).optional(),
  required: z.boolean(),
  condition: z
    .object({ questionId: z.string(), equals: z.string() })
    .optional(),
  autoFill: z
    .object({
      questionId: z.string(),
      ifContains: z.array(z.string()),
      value: z.string(),
    })
    .optional(),
  skipIf: z
    .object({
      questionId: z.string(),
      containsAny: z.array(z.string()),
      autoValue: z.string(),
    })
    .optional(),
}
const options = z
  .array(z.string().trim().min(1).max(500))
  .min(1)
  .max(300)
  .refine(
    (values) => new Set(values).size === values.length,
    "Options must be unique"
  )
const questionSchema = z.discriminatedUnion("type", [
  z.object({
    ...base,
    type: z.literal("short_text"),
    placeholder: z.string().optional(),
  }),
  z.object({
    ...base,
    type: z.literal("email"),
    placeholder: z.string().optional(),
  }),
  z.object({
    ...base,
    type: z.literal("long_text"),
    placeholder: z.string().optional(),
    maxLength: z.number().int().positive().max(10_000).optional(),
  }),
  z.object({ ...base, type: z.literal("multiple_choice"), options }),
  z.object({ ...base, type: z.literal("dropdown"), options }),
  z.object({
    ...base,
    type: z.literal("multi_select"),
    options,
    maxSelections: z.number().int().positive().optional(),
  }),
  z.object({
    ...base,
    type: z.literal("rating"),
    min: z.number().int().min(1),
    max: z.number().int().max(10),
  }),
  z.object({
    id: base.id,
    label: base.label,
    description: base.description,
    required: z.literal(false),
    type: z.literal("section_header"),
  }),
])

export const formConfigSchema = z
  .object({
    title: z.string().trim().min(1).max(500),
    description: z.string().max(10_000),
    questions: z.array(questionSchema).min(1).max(50),
  })
  .superRefine((config, context) => {
    const ids = new Set(config.questions.map((q) => q.id))
    if (ids.size !== config.questions.length)
      context.addIssue({
        code: "custom",
        message: "Question IDs must be unique",
      })
    for (const q of config.questions) {
      if (
        q.type === "multi_select" &&
        q.maxSelections &&
        q.maxSelections > q.options.length
      )
        context.addIssue({
          code: "custom",
          message: "Maximum selections cannot exceed the number of options",
        })
      if (q.type === "rating" && q.min > q.max)
        context.addIssue({
          code: "custom",
          message: "Rating minimum cannot exceed maximum",
        })
    }
  })
