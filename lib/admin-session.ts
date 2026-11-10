import { createHmac, timingSafeEqual } from "node:crypto"

export const ADMIN_SESSION_COOKIE = "admin_session"
export const ADMIN_SESSION_MAX_AGE = 24 * 60 * 60

export function createAdminSession(secret: string, now = Date.now()): string {
  const timestamp = String(now)
  const signature = createHmac("sha256", secret).update(timestamp).digest("hex")
  return `${timestamp}.${signature}`
}

// Keep the existing token format so valid admin sessions survive this update.
export function validateAdminSession(
  token: string | undefined,
  secret: string | undefined,
  now = Date.now()
): boolean {
  if (!token || !secret) return false
  const match = /^(\d{13})\.([a-f0-9]{64})$/.exec(token)
  if (!match) return false
  const age = now - Number(match[1])
  if (age < 0 || age >= ADMIN_SESSION_MAX_AGE * 1000) return false
  const expected = createHmac("sha256", secret).update(match[1]).digest()
  return timingSafeEqual(Buffer.from(match[2], "hex"), expected)
}
