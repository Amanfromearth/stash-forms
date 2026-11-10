"use client"

import { useSearchParams } from "next/navigation"
import { useCallback, useTransition, useRef } from "react"

export function DownloadCSV({ version }: { version: number }) {
  const searchParams = useSearchParams()
  const [loading, startTransition] = useTransition()

  const pending = useRef<symbol | null>(null)

  const download = useCallback(() => {
    if (pending.current) return
    pending.current = Symbol("csv-export")
    startTransition(async () => {
      try {
        const params = new URLSearchParams()
        for (const [key, value] of searchParams.entries()) {
          if (key !== "page") params.set(key, value)
        }
        params.set("version", String(version))
        const qs = params.toString()
        const url = `/api/admin/export${qs ? `?${qs}` : ""}`

        const res = await fetch(url)
        if (!res.ok) throw new Error("Export failed")

        const blob = await res.blob()
        downloadBlob(
          blob,
          res.headers
            .get("Content-Disposition")
            ?.match(/filename="(.+)"/)?.[1] ?? "submissions.csv"
        )
      } finally {
        pending.current = null
      }
    })
  }, [searchParams, version])

  return (
    <button
      onClick={download}
      disabled={loading}
      className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
    >
      {loading ? (
        <>
          <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Exporting…
        </>
      ) : (
        <>
          <svg
            className="size-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download CSV
        </>
      )}
    </button>
  )
}

function downloadBlob(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  try {
    anchor.href = objectUrl
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
  } finally {
    anchor.remove()
    URL.revokeObjectURL(objectUrl)
  }
}
