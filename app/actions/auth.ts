"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createHmac } from "crypto"

const SESSION_COOKIE = "admin_session"

function generateSessionToken(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error("SESSION_SECRET env var is required")
  const timestamp = Date.now().toString()
  const hmac = createHmac("sha256", secret).update(timestamp).digest("hex")
  return `${timestamp}.${hmac}`
}

export async function loginAction(
  formData: FormData
): Promise<{ error?: string }> {
  const password = formData.get("password") as string

  if (!password) {
    return { error: "Password is required" }
  }

  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) {
    console.error("[loginAction] ADMIN_PASSWORD env var not set")
    return { error: "Server configuration error" }
  }

  if (password !== adminPassword) {
    // Artificial delay to mitigate brute force
    await new Promise((resolve) => setTimeout(resolve, 500))
    return { error: "Invalid password" }
  }

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, generateSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  })

  redirect("/admin")
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
  redirect("/admin/login")
}
