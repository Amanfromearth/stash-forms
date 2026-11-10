import { NextRequest, NextResponse } from "next/server"
import { ADMIN_SESSION_COOKIE, validateAdminSession } from "@/lib/admin-session"

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Versions identify saved questions and responses, not public form URLs.
  if (pathname === "/" && request.nextUrl.searchParams.has("version")) {
    const url = request.nextUrl.clone()
    url.searchParams.delete("version")
    return NextResponse.redirect(url)
  }

  // Protect both admin pages and their response exports.
  if (
    (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) &&
    pathname !== "/admin/login"
  ) {
    const sessionCookie = request.cookies.get(ADMIN_SESSION_COOKIE)

    if (!sessionCookie?.value) {
      if (pathname.startsWith("/api/admin"))
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      const loginUrl = new URL("/admin/login", request.url)
      return NextResponse.redirect(loginUrl)
    }

    const isValid = validateAdminSession(
      sessionCookie.value,
      process.env.SESSION_SECRET
    )
    if (!isValid) {
      if (pathname.startsWith("/api/admin"))
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      const loginUrl = new URL("/admin/login", request.url)
      const response = NextResponse.redirect(loginUrl)
      response.cookies.delete(ADMIN_SESSION_COOKIE)
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/", "/admin/:path*", "/api/admin/:path*"],
}
