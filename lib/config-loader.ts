import { cache } from "react"
import { db } from "./db"
import { formVersions } from "./schema"
import type { FormConfig, VersionedFormConfig } from "./form-config"
import { desc, eq } from "drizzle-orm"

export const getFormConfig = cache(
  async (version?: number): Promise<VersionedFormConfig> => {
    const [row] = await db
      .select()
      .from(formVersions)
      .where(
        version === undefined ? undefined : eq(formVersions.version, version)
      )
      .orderBy(desc(formVersions.version))
      .limit(1)

    if (!row)
      throw new Error(
        "Form version not found. Run the database migrations first."
      )
    return { ...row.config, version: row.version }
  }
)

export const getFormVersions = cache(async () => {
  const rows = await db
    .select()
    .from(formVersions)
    .orderBy(desc(formVersions.version))
  return rows.map((row) => ({ version: row.version, title: row.config.title }))
})

export async function saveFormConfig(config: FormConfig): Promise<number> {
  // Deliberately copy only config fields: the client cannot choose a version.
  const [row] = await db
    .insert(formVersions)
    .values({
      config: {
        title: config.title,
        description: config.description,
        questions: config.questions,
      },
    })
    .returning({ version: formVersions.version })
  return row.version
}
