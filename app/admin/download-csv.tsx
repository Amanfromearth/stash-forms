"use client"

import { useSearchParams } from "next/navigation"
import { useCallback, useState } from "react"

export function DownloadCSV() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)

  const download = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      for (const [key, value] of searchParams.entries()) {
        if (key !== "page") params.set(key, value)
      }
      const qs = params.toString()
      const url = `/api/admin/export${qs ? `?${qs}` : ""}`

      const res = await fetch(url)
      if (!res.ok) throw new Error("Export failed")

      const blob = await res.blob()
      const a = document.createElement("a")
      a.href = URL.createObjectURL(blob)
      a.download =
        res.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] ??
        "submissions.csv"
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(a.href)
    } finally {
      setLoading(false)
    }
  }, [searchParams])

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
