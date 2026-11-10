"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createHash, timingSafeEqual } from "node:crypto"
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  createAdminSession,
} from "@/lib/admin-session"
import { checkRequestLimit } from "@/lib/request-limits"

export async function loginAction(
  formData: FormData
): Promise<{ error?: string }> {
  const password = formData.get("password")

  if (typeof password !== "string" || !password || password.length > 1024) {
    return { error: "Password is required" }
  }

  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) {
    console.error("[loginAction] ADMIN_PASSWORD env var not set")
    return { error: "Server configuration error" }
  }

  try {
    const limit = await checkRequestLimit("login")
    if (!limit.allowed) {
      return {
        error: `Too many sign-in attempts. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minutes.`,
      }
    }
  } catch {
    console.error("[loginAction] Security rate limit unavailable")
    return {
      error: "Sign-in is temporarily unavailable. Please try again shortly.",
    }
  }

  const digest = (value: string) => createHash("sha256").update(value).digest()
  if (!timingSafeEqual(digest(password), digest(adminPassword))) {
    return { error: "Invalid password" }
  }

  const cookieStore = await cookies()
  const secret = process.env.SESSION_SECRET
  if (!secret) return { error: "Server configuration error" }
  cookieStore.set(ADMIN_SESSION_COOKIE, createAdminSession(secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ADMIN_SESSION_MAX_AGE,
    path: "/",
  })

  redirect("/admin")
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(ADMIN_SESSION_COOKIE)
  redirect("/admin/login")
}
