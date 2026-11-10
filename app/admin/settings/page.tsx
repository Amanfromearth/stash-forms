import { notFound } from "next/navigation"
import { requireAdmin } from "@/lib/admin-auth"
import { VersionSelector } from "@/components/version-selector"
import { getFormConfig, getFormVersions } from "@/lib/config-loader"
import { SettingsForm } from "./settings-form"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Settings" }
export const dynamic = "force-dynamic"

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ version?: string }>
}) {
  await requireAdmin()
  const [{ version }, versions] = await Promise.all([
    searchParams,
    getFormVersions(),
  ])
  const selected =
    version === undefined ? versions[0]?.version : Number(version)
  if (!versions.some((v) => v.version === selected)) notFound()
  const config = await getFormConfig(selected)
  return (
    <div className="space-y-6">
      <VersionSelector
        versions={versions}
        selectedVersion={config.version}
        path="/admin/settings"
      />
      <SettingsForm key={config.version} initialConfig={config} />
    </div>
  )
}
