import { NextRequest, NextResponse } from "next/server"

const SESSION_COOKIE = "admin_session"

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only protect /admin routes (not /admin/login itself)
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const sessionCookie = request.cookies.get(SESSION_COOKIE)

    if (!sessionCookie?.value) {
      const loginUrl = new URL("/admin/login", request.url)
      return NextResponse.redirect(loginUrl)
    }

    const isValid = await validateSession(sessionCookie.value)
    if (!isValid) {
      const loginUrl = new URL("/admin/login", request.url)
      const response = NextResponse.redirect(loginUrl)
      response.cookies.delete(SESSION_COOKIE)
      return response
    }
  }

  return NextResponse.next()
}

async function validateSession(token: string): Promise<boolean> {
  const secret = process.env.SESSION_SECRET
  if (!secret) return false
  // Token format: "timestamp.hmac"
  const [timestamp, hmac] = token.split(".")
  if (!timestamp || !hmac) return false

  // Check token age (24 hours)
  const tokenAge = Date.now() - parseInt(timestamp)
  if (tokenAge > 24 * 60 * 60 * 1000) return false

  // Verify HMAC (constant-time comparison)
  const { createHmac, timingSafeEqual } = await import("crypto")
  const expectedHmac = createHmac("sha256", secret)
    .update(timestamp)
    .digest("hex")

  if (hmac.length !== expectedHmac.length) return false
  return timingSafeEqual(Buffer.from(hmac), Buffer.from(expectedHmac))
}

export const config = {
  matcher: ["/admin/:path*"],
}
