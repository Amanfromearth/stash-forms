import { db } from "./db"
import { formConfig } from "./schema"
import { SURVEY_CONFIG, type FormConfig } from "./form-config"
import { eq } from "drizzle-orm"

export async function getFormConfig(): Promise<FormConfig> {
  const rows = await db
    .select()
    .from(formConfig)
    .where(eq(formConfig.id, "default"))
    .limit(1)

  if (rows.length > 0) {
    return rows[0].config as FormConfig
  }

  // Seed default config on first load
  await db
    .insert(formConfig)
    .values({ id: "default", config: SURVEY_CONFIG })
    .onConflictDoNothing()

  return SURVEY_CONFIG
}

export async function saveFormConfig(config: FormConfig): Promise<void> {
  await db
    .insert(formConfig)
    .values({ id: "default", config, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: formConfig.id,
      set: { config, updatedAt: new Date() },
    })
}
