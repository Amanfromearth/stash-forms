"use server"

import {
  createSurveySession,
  requireSurveySession,
  refreshSurveySession,
  SURVEY_RECOVERY_LIFETIME,
  type SurveySession,
} from "@/lib/survey-session"
import { getFormConfig } from "@/lib/config-loader"
import { db } from "@/lib/db"
import { submissions } from "@/lib/schema"
import { and, eq } from "drizzle-orm"

export async function resumeSurveySession(previous: SurveySession) {
  // Prove ownership before reading a response or its published question version.
  let session: SurveySession
  try {
    session = refreshSurveySession(previous)
  } catch {
    return { valid: false as const }
  }
  const config = await getFormConfig(session.formVersion)
  const [row] = await db
    .select({ isPartial: submissions.isPartial })
    .from(submissions)
    .where(
      and(
        eq(submissions.sessionId, session.sessionId),
        eq(submissions.formVersion, session.formVersion)
      )
    )
    .limit(1)
  return {
    valid: true as const,
    session,
    config,
    completed: row?.isPartial === false,
  }
}

export async function renewSurveySession(
  previous: SurveySession
): Promise<SurveySession> {
  requireSurveySession(previous, Date.now(), SURVEY_RECOVERY_LIFETIME)
  return createSurveySession(previous.formVersion)
}
