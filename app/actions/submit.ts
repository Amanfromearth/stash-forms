"use server"

import { headers } from "next/headers"
import { db } from "@/lib/db"
import { submissions } from "@/lib/schema"
import { submissionSchema } from "@/lib/validations"
import { hashIP } from "@/lib/ip"

export async function submitSurvey(input: unknown): Promise<{
  success: boolean
  error?: string
}> {
  try {
    // 1. Validate input with Zod
    const parsed = submissionSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid form data. Please check your answers and try again.",
      }
    }

    // 2. Get request headers (MUST await in Next.js 16)
    const headersList = await headers()
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headersList.get("x-real-ip") ??
      "unknown"
    const userAgent = headersList.get("user-agent") ?? undefined

    // 3. Hash IP (never store raw IP — GDPR compliance)
    const ipHash = hashIP(ip)

    // 4. Insert into database (Drizzle auto-parameterizes — SQL injection safe)
    await db.insert(submissions).values({
      answers: parsed.data.answers,
      ipHash,
      metadata: { userAgent },
    })

    return { success: true }
  } catch (error) {
    // Log server-side but NEVER expose raw error to client
    console.error("[submitSurvey] Database error:", error)
    return {
      success: false,
      error: "Failed to submit. Please try again.",
    }
  }
}
