"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useRef } from "react"

import type { VersionedFormConfig } from "@/lib/form-config"

export function AdminFilters({ config }: { config: VersionedFormConfig }) {
  const optionsFor = (id: string) => {
    const q = config.questions.find((q) => q.id === id)
    return q && "options" in q ? q.options : []
  }
  const router = useRouter()
  const searchParams = useSearchParams()
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set("version", String(config.version))
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete("page")
      router.push(`/admin?${params.toString()}`)
    },
    [router, searchParams, config.version]
  )

  const clearAll = useCallback(() => {
    router.push(`/admin?version=${config.version}`)
  }, [router, config.version])

  const hasFilters =
    searchParams.toString().length > 0 &&
    [...searchParams.keys()].some((k) => k !== "page" && k !== "version")

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        <input
          type="text"
          placeholder={
            config.questions.some((q) => q.id === "email")
              ? "Search email..."
              : "Search country..."
          }
          defaultValue={searchParams.get("q") ?? ""}
          onChange={(e) => {
            clearTimeout(debounceRef.current)
            debounceRef.current = setTimeout(() => {
              updateFilter("q", e.target.value)
            }, 300)
          }}
          className="col-span-2 h-9 rounded-md border border-border bg-transparent px-3 text-sm transition-colors outline-none focus:border-primary md:col-span-1"
        />

        <select
          aria-label="Filter by age"
          value={searchParams.get("age") ?? ""}
          onChange={(e) => updateFilter("age", e.target.value)}
          className={`h-9 cursor-pointer appearance-none rounded-md border bg-transparent px-2 text-sm transition-colors outline-none focus:border-primary ${searchParams.get("age") ? "border-primary" : "border-border"}`}
        >
          <option value="">All ages</option>
          {optionsFor("age_range").map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by occupation"
          value={searchParams.get("occupation") ?? ""}
          onChange={(e) => updateFilter("occupation", e.target.value)}
          className={`h-9 cursor-pointer appearance-none rounded-md border bg-transparent px-2 text-sm transition-colors outline-none focus:border-primary ${searchParams.get("occupation") ? "border-primary" : "border-border"}`}
        >
          <option value="">All occupations</option>
          {optionsFor("occupation").map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by investing experience"
          value={searchParams.get("invested") ?? ""}
          onChange={(e) => updateFilter("invested", e.target.value)}
          className={`h-9 cursor-pointer appearance-none rounded-md border bg-transparent px-2 text-sm transition-colors outline-none focus:border-primary ${searchParams.get("invested") ? "border-primary" : "border-border"}`}
        >
          <option value="">All investors</option>
          {optionsFor("invested_foreign").map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by completion status"
          value={searchParams.get("status") ?? ""}
          onChange={(e) => updateFilter("status", e.target.value)}
          className="h-9 rounded-md border border-border bg-transparent px-2 text-sm transition-colors outline-none focus:border-primary"
        >
          <option value="">All status</option>
          <option value="complete">Complete</option>
          <option value="partial">Partial</option>
        </select>

        {hasFilters ? (
          <button
            onClick={clearAll}
            className="h-9 rounded-md border border-border px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Clear filters
          </button>
        ) : null}
      </div>

      <div className="flex gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>From</span>
          <input
            type="date"
            aria-label="Submitted from"
            value={searchParams.get("from") ?? ""}
            onChange={(e) => updateFilter("from", e.target.value)}
            className="h-8 rounded-md border border-border bg-transparent px-2 text-sm outline-none focus:border-primary"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>To</span>
          <input
            type="date"
            aria-label="Submitted through"
            value={searchParams.get("to") ?? ""}
            onChange={(e) => updateFilter("to", e.target.value)}
            className="h-8 rounded-md border border-border bg-transparent px-2 text-sm outline-none focus:border-primary"
          />
        </div>
      </div>
    </div>
  )
}
