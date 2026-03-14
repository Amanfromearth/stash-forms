import { z } from "zod"

export const submissionSchema = z.object({
  answers: z
    .record(
      z.string(),
      z.union([
        z.string().max(10_000, "Answer too long"),
        z.number().finite().min(1).max(10),
        z.null(),
      ])
    )
    .refine((answers) => Object.keys(answers).length <= 50, "Too many answers"),
})

export type SubmissionInput = z.infer<typeof submissionSchema>
