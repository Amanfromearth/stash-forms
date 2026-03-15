"use server"

import { revalidatePath } from "next/cache"
import { saveFormConfig } from "@/lib/config-loader"
import type { FormConfig } from "@/lib/form-config"

export async function updateFormConfigAction(
  config: FormConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    await saveFormConfig(config)
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("[updateFormConfig]", error)
    return { success: false, error: "Failed to save settings" }
  }
}
