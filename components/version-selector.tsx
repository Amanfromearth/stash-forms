"use client"

import { useRouter } from "next/navigation"

export function VersionSelector({
  versions,
  selectedVersion,
  path,
}: {
  versions: { version: number; title: string }[]
  selectedVersion: number
  path: string
}) {
  const router = useRouter()
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label htmlFor="form-version" className="text-sm font-medium">
        Form version
      </label>
      <select
        id="form-version"
        value={selectedVersion}
        onChange={(event) =>
          router.push(`${path}?version=${event.target.value}`)
        }
        className="h-9 max-w-full rounded-md border border-border bg-background px-3 text-sm"
      >
        {versions.map(({ version, title }) => (
          <option key={version} value={version}>
            v{version}: {title}
          </option>
        ))}
      </select>
      <a
        href="/"
        target="_blank"
        rel="noreferrer"
        className="text-sm text-primary hover:underline"
      >
        Open current form ↗
      </a>
    </div>
  )
}
