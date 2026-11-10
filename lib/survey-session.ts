import { createHmac, randomUUID, timingSafeEqual } from "node:crypto"

const SESSION_LIFETIME = 24 * 60 * 60 * 1000
export const SURVEY_RECOVERY_LIFETIME = 30 * SESSION_LIFETIME

export interface SurveySession {
  sessionId: string
  formVersion: number
  sessionToken: string
}

function signature(payload: string, secret: string) {
  return createHmac("sha256", secret)
    .update(`survey-session:${payload}`)
    .digest("hex")
}

function sessionSecret() {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error("SESSION_SECRET is required")
  return secret
}

export function createSurveySession(
  formVersion: number,
  now = Date.now()
): SurveySession {
  return signSession(randomUUID(), formVersion, now)
}

function signSession(
  sessionId: string,
  formVersion: number,
  now: number
): SurveySession {
  const payload = `${sessionId}.${formVersion}.${now}`
  return {
    sessionId,
    formVersion,
    sessionToken: `${payload}.${signature(payload, sessionSecret())}`,
  }
}

/** A public respondent can save only the session and version issued by the server. */
export function requireSurveySession(
  input: { sessionId?: string; formVersion?: number; sessionToken?: string },
  now = Date.now(),
  maxAge = SESSION_LIFETIME
): void {
  const token = input.sessionToken
  if (typeof token !== "string" || token.length > 256)
    throw new Error("Invalid survey session")
  const [sessionId, version, timestamp, mac, ...extra] = token.split(".")
  const issuedAt = Number(timestamp)
  if (
    extra.length ||
    !/^[a-f0-9]{64}$/.test(mac ?? "") ||
    !Number.isSafeInteger(issuedAt) ||
    issuedAt > now ||
    now - issuedAt > maxAge ||
    sessionId !== input.sessionId ||
    version !== String(input.formVersion)
  ) {
    throw new Error("Invalid or expired survey session")
  }
  const expected = signature(
    `${sessionId}.${version}.${timestamp}`,
    sessionSecret()
  )
  if (!timingSafeEqual(Buffer.from(mac, "hex"), Buffer.from(expected, "hex")))
    throw new Error("Invalid survey session signature")
}

export function refreshSurveySession(
  previous: SurveySession,
  now = Date.now()
): SurveySession {
  requireSurveySession(previous, now, SURVEY_RECOVERY_LIFETIME)
  return signSession(previous.sessionId, previous.formVersion, now)
}
