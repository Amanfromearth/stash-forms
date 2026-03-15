import { getFormConfig } from "@/lib/config-loader"
import { SettingsForm } from "./settings-form"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Settings" }

export default async function SettingsPage() {
  const config = await getFormConfig()
  return <SettingsForm initialConfig={config} />
}
