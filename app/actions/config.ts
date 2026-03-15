"use server"

import { cookies } from "next/headers"
import { createHmac } from "crypto"
import { revalidatePath } from "next/cache"
import { saveFormConfig } from "@/lib/config-loader"
import type { FormConfig } from "@/lib/form-config"

async function verifyAdmin(): Promise<boolean> {
  const secret = process.env.SESSION_SECRET
  if (!secret) return false
  const cookieStore = await cookies()
  const token = cookieStore.get("admin_session")?.value
  if (!token) return false
  const [timestamp, hmac] = token.split(".")
  if (!timestamp || !hmac) return false
  const age = Date.now() - parseInt(timestamp)
  if (age > 24 * 60 * 60 * 1000) return false
  const expected = createHmac("sha256", secret).update(timestamp).digest("hex")
  return hmac === expected
}

export async function updateFormConfigAction(
  config: FormConfig
): Promise<{ success: boolean; error?: string }> {
  const isAuthed = await verifyAdmin()
  if (!isAuthed) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    await saveFormConfig(config)
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("[updateFormConfig]", error)
    return { success: false, error: "Failed to save settings" }
  }
}
