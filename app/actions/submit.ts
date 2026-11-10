"use server"

import { headers } from "next/headers"
import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { submissions } from "@/lib/schema"
import { submissionSchema, partialSubmissionSchema } from "@/lib/validations"
import { getFormConfig } from "@/lib/config-loader"
import { validateAnswers } from "@/lib/validate-answers"
import { requireSurveySession } from "@/lib/survey-session"
import { hashIP } from "@/lib/ip"
import { checkSubmissionLimits } from "@/lib/request-limits"

async function alreadySubmitted(
  sessionId: string,
  formVersion: number,
  answers: Record<string, unknown>
): Promise<boolean> {
  const [existing] = await db
    .select({ id: submissions.id })
    .from(submissions)
    .where(
      and(
        eq(submissions.sessionId, sessionId),
        eq(submissions.formVersion, formVersion),
        eq(submissions.isPartial, false),
        eq(submissions.answers, answers)
      )
    )
    .limit(1)
  return !!existing
}

export async function submitSurvey(input: {
  answers: Record<string, unknown>
  sessionToken?: string
  sessionId?: string
  formVersion?: number
}): Promise<{ success: boolean; error?: string }> {
  try {
    requireSurveySession(input)
    const parsed = submissionSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid form data. Please check your answers and try again.",
      }
    }

    const config = await getFormConfig(parsed.data.formVersion)
    const validationError = validateAnswers(config, parsed.data.answers, false)
    if (validationError) return { success: false, error: validationError }

    const sessionId = parsed.data.sessionId
    if (!sessionId)
      return { success: false, error: "Please reload the form and try again." }
    // A lost response or duplicate click must not turn a successful save into an error.
    if (
      await alreadySubmitted(sessionId, config.version, parsed.data.answers)
    ) {
      return { success: true }
    }

    if (!(await checkSubmissionLimits("submit", sessionId))) {
      return {
        success: false,
        error: "Too many requests. Please wait a few minutes and try again.",
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
      const saved = await db
        .insert(submissions)
        .values({
          sessionId: parsed.data.sessionId,
          formVersion: config.version,
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
          setWhere: and(
            eq(submissions.formVersion, config.version),
            eq(submissions.isPartial, true)
          ),
        })
        .returning({ id: submissions.id })
      if (!saved.length) {
        if (
          await alreadySubmitted(sessionId, config.version, parsed.data.answers)
        ) {
          return { success: true }
        }
        return {
          success: false,
          error:
            "This session has already been submitted or belongs to another form version. Please start again.",
        }
      }
    } else {
      await db.insert(submissions).values({
        formVersion: config.version,
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
  sessionToken?: string
  sessionId: string
  formVersion?: number
  answers: Record<string, unknown>
}): Promise<void> {
  try {
    requireSurveySession(input)
    const parsed = partialSubmissionSchema.safeParse(input)
    if (!parsed.success) return

    const config = await getFormConfig(parsed.data.formVersion)
    if (validateAnswers(config, parsed.data.answers, true)) return
    if (
      !Object.values(parsed.data.answers).some((value) =>
        typeof value === "string"
          ? value.trim().length > 0
          : Array.isArray(value)
            ? value.length > 0
            : value != null
      )
    )
      return
    if (!(await checkSubmissionLimits("partial", parsed.data.sessionId))) return

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
        sessionId: parsed.data.sessionId,
        formVersion: config.version,
        answers: parsed.data.answers,
        isPartial: true,
        ipHash,
        metadata: { userAgent },
      })
      .onConflictDoUpdate({
        target: submissions.sessionId,
        set: {
          answers: parsed.data.answers,
          submittedAt: new Date(),
        },
        // Only update if row is still a partial save. Never overwrite a
        // completed submission with stale partial data
        setWhere: and(
          eq(submissions.isPartial, true),
          eq(submissions.formVersion, config.version)
        ),
      })
  } catch (error) {
    console.error("[upsertPartial]", error)
  }
}
