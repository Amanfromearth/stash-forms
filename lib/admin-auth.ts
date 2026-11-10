import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { ADMIN_SESSION_COOKIE, validateAdminSession } from "./admin-session"

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  return validateAdminSession(
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value,
    process.env.SESSION_SECRET
  )
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdminAuthenticated())) redirect("/admin/login")
}
