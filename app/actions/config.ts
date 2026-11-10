"use server"

import { isAdminAuthenticated } from "@/lib/admin-auth"
import { revalidatePath } from "next/cache"
import { formConfigSchema } from "@/lib/form-config-validation"
import { saveFormConfig } from "@/lib/config-loader"
import type { FormConfig } from "@/lib/form-config"

export async function updateFormConfigAction(
  config: FormConfig
): Promise<{ success: boolean; error?: string; version?: number }> {
  const isAuthed = await isAdminAuthenticated()
  if (!isAuthed) {
    return { success: false, error: "Unauthorized" }
  }

  const parsed = formConfigSchema.safeParse(config)
  if (!parsed.success)
    return { success: false, error: parsed.error.issues[0].message }

  try {
    const version = await saveFormConfig(parsed.data)
    revalidatePath("/", "layout")
    return { success: true, version }
  } catch (error) {
    console.error("[updateFormConfig]", error)
    return { success: false, error: "Failed to save settings" }
  }
}
