"use server"

import { headers } from "next/headers"
import { db } from "@/lib/db"
import { submissions } from "@/lib/schema"
import { submissionSchema } from "@/lib/validations"
import { hashIP } from "@/lib/ip"

export async function submitSurvey(input: {
  answers: Record<string, unknown>
  sessionId?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const parsed = submissionSchema.safeParse({ answers: input.answers })
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid form data. Please check your answers and try again.",
      }
    }

    const headersList = await headers()
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headersList.get("x-real-ip") ??
      "unknown"
    const userAgent = headersList.get("user-agent") ?? undefined
    const ipHash = hashIP(ip)

    if (input.sessionId) {
      await db
        .insert(submissions)
        .values({
          sessionId: input.sessionId,
          answers: parsed.data.answers,
          isPartial: false,
          ipHash,
          metadata: { userAgent },
        })
        .onConflictDoUpdate({
          target: submissions.sessionId,
          set: {
            answers: parsed.data.answers,
            isPartial: false,
            ipHash,
            metadata: { userAgent },
            submittedAt: new Date(),
          },
        })
    } else {
      await db.insert(submissions).values({
        answers: parsed.data.answers,
        isPartial: false,
        ipHash,
        metadata: { userAgent },
      })
    }

    return { success: true }
  } catch (error) {
    console.error("[submitSurvey] Database error:", error)
    return { success: false, error: "Failed to submit. Please try again." }
  }
}

export async function upsertPartial(input: {
  sessionId: string
  answers: Record<string, unknown>
}): Promise<void> {
  try {
    const headersList = await headers()
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headersList.get("x-real-ip") ??
      "unknown"
    const ipHash = hashIP(ip)
    const userAgent = headersList.get("user-agent") ?? undefined

    await db
      .insert(submissions)
      .values({
        sessionId: input.sessionId,
        answers: input.answers,
        isPartial: true,
        ipHash,
        metadata: { userAgent },
      })
      .onConflictDoUpdate({
        target: submissions.sessionId,
        set: {
          answers: input.answers,
          submittedAt: new Date(),
        },
      })
  } catch (error) {
    console.error("[upsertPartial]", error)
  }
}
