"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"

export function AdminFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete("page")
      router.push(`/admin?${params.toString()}`)
    },
    [router, searchParams]
  )

  const clearAll = useCallback(() => {
    router.push("/admin")
  }, [router])

  const hasFilters =
    searchParams.toString().length > 0 &&
    [...searchParams.keys()].some((k) => k !== "page")

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <input
          type="text"
          placeholder="Search email..."
          defaultValue={searchParams.get("q") ?? ""}
          onChange={(e) => {
            clearTimeout((window as any).__filterTimeout)
            ;(window as any).__filterTimeout = setTimeout(() => {
              updateFilter("q", e.target.value)
            }, 300)
          }}
          className="col-span-2 h-9 rounded-md border border-border bg-transparent px-3 text-sm transition-colors outline-none focus:border-primary md:col-span-1"
        />

        <select
          value={searchParams.get("age") ?? ""}
          onChange={(e) => updateFilter("age", e.target.value)}
          className={`h-9 cursor-pointer appearance-none rounded-md border bg-transparent px-2 text-sm transition-colors outline-none focus:border-primary ${searchParams.get("age") ? "border-indigo-400" : "border-border"}`}
        >
          <option value="">All ages</option>
          <option value="18–24">18–24</option>
          <option value="25–30">25–30</option>
          <option value="30–40">30–40</option>
          <option value="40+">40+</option>
        </select>

        <select
          value={searchParams.get("occupation") ?? ""}
          onChange={(e) => updateFilter("occupation", e.target.value)}
          className={`h-9 cursor-pointer appearance-none rounded-md border bg-transparent px-2 text-sm transition-colors outline-none focus:border-primary ${searchParams.get("occupation") ? "border-indigo-400" : "border-border"}`}
        >
          <option value="">All occupations</option>
          <option value="Student">Student</option>
          <option value="Salaried employee">Salaried employee</option>
          <option value="Freelancer / remote worker">Freelancer</option>
          <option value="Business owner">Business owner</option>
          <option value="Others">Others</option>
        </select>

        <select
          value={searchParams.get("invested") ?? ""}
          onChange={(e) => updateFilter("invested", e.target.value)}
          className={`h-9 cursor-pointer appearance-none rounded-md border bg-transparent px-2 text-sm transition-colors outline-none focus:border-primary ${searchParams.get("invested") ? "border-indigo-400" : "border-border"}`}
        >
          <option value="">All investors</option>
          <option value="Yes">Invested abroad</option>
          <option value="No">Not invested</option>
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
            value={searchParams.get("from") ?? ""}
            onChange={(e) => updateFilter("from", e.target.value)}
            className="h-8 rounded-md border border-border bg-transparent px-2 text-sm outline-none focus:border-primary"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>To</span>
          <input
            type="date"
            value={searchParams.get("to") ?? ""}
            onChange={(e) => updateFilter("to", e.target.value)}
            className="h-8 rounded-md border border-border bg-transparent px-2 text-sm outline-none focus:border-primary"
          />
        </div>
      </div>
    </div>
  )
}
