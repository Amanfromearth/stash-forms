import { createHmac } from "node:crypto"
import { getRateLimitIdentity } from "./request-identity"
import { cookies, headers } from "next/headers"
import { db } from "./db"
import { submissions } from "./schema"
import { eq } from "drizzle-orm"
import { consumeRateLimit, REQUEST_LIMITS } from "./rate-limit"
import {
  VISITOR_COOKIE,
  VISITOR_COOKIE_MAX_AGE,
  createVisitorIdentity,
  readVisitorIdentity,
} from "./visitor-identity"

async function getVisitorIdentity() {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error("SESSION_SECRET env var is required")
  const store = await cookies()
  const existing = readVisitorIdentity(store.get(VISITOR_COOKIE)?.value, secret)
  if (existing) return existing
  const visitor = createVisitorIdentity(secret)
  store.set(VISITOR_COOKIE, visitor.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: VISITOR_COOKIE_MAX_AGE,
    path: "/",
  })
  return visitor.id
}

async function getTrustedIP() {
  const trustedHeader =
    process.env.TRUSTED_PROXY_IP_HEADER ||
    (process.env.VERCEL === "1" ? "x-real-ip" : undefined)
  return getRateLimitIdentity(await headers(), trustedHeader)
}

async function takeLimit(scope: keyof typeof REQUEST_LIMITS, identity: string) {
  const secret = process.env.IP_HASH_SALT
  if (!secret) throw new Error("IP_HASH_SALT env var is required")
  const hash = createHmac("sha256", secret).update(identity).digest("hex")
  return consumeRateLimit(
    (query) => db.execute(query),
    `${scope}:${hash}`,
    REQUEST_LIMITS[scope]
  )
}

export async function checkRequestLimit(scope: "login") {
  const ip = await getTrustedIP()
  return takeLimit(
    scope,
    ip ? `ip:${ip}` : `visitor:${await getVisitorIdentity()}`
  )
}

export async function checkSubmissionLimits(
  scope: "partial" | "submit",
  sessionId: string
): Promise<boolean> {
  // The action validates the signed survey session before reaching this helper.
  // Autosaves and final submissions have independent allowances per response.
  if (!(await takeLimit(scope, `session:${sessionId}`)).allowed) return false
  const [existing] = await db
    .select({ id: submissions.id })
    .from(submissions)
    .where(eq(submissions.sessionId, sessionId))
    .limit(1)
  if (existing) return true

  // A shared office, mobile carrier or VPN should not share a small user quota.
  if (
    !(await takeLimit("newResponse", `visitor:${await getVisitorIdentity()}`))
      .allowed
  )
    return false
  const ip = await getTrustedIP()
  return !ip || (await takeLimit("newResponseNetwork", `ip:${ip}`)).allowed
}
