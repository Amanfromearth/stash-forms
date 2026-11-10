import { createHmac, randomUUID, timingSafeEqual } from "node:crypto"

export const VISITOR_COOKIE = "survey_visitor"
export const VISITOR_COOKIE_MAX_AGE = 30 * 24 * 60 * 60

function signature(id: string, secret: string) {
  return createHmac("sha256", secret).update(`survey-visitor:${id}`).digest()
}

// This identity only separates rate-limit buckets. It grants no access to data.
export function createVisitorIdentity(secret: string) {
  const id = randomUUID()
  return { id, token: `${id}.${signature(id, secret).toString("hex")}` }
}

export function readVisitorIdentity(token: string | undefined, secret: string) {
  const match =
    /^([a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12})\.([a-f0-9]{64})$/.exec(
      token ?? ""
    )
  if (!match) return undefined
  return timingSafeEqual(
    Buffer.from(match[2], "hex"),
    signature(match[1], secret)
  )
    ? match[1]
    : undefined
}
