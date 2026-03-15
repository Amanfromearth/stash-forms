import type { Metadata } from "next"
import { Suspense } from "react"
import dynamic from "next/dynamic"
import { db } from "@/lib/db"
import { submissions } from "@/lib/schema"
import { SURVEY_CONFIG } from "@/lib/form-config"
import { desc, count, sql, and, gte, lte } from "drizzle-orm"
import { SubmissionDetail } from "./submission-detail"
import { AdminFilters } from "./admin-filters"
import { getAnalytics } from "@/lib/analytics"

const AnalyticsCharts = dynamic(
  () =>
    import("./analytics-charts").then((m) => ({ default: m.AnalyticsCharts })),
  { loading: () => <div className="h-[600px]" /> }
)

export const metadata: Metadata = {
  title: "Survey Admin",
}

const PAGE_SIZE = 25

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string
    q?: string
    age?: string
    occupation?: string
    invested?: string
    from?: string
    to?: string
  }>
}) {
  return (
    <div className="space-y-6">
      <Suspense
        fallback={
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="h-24 rounded-xl border border-border" />
            <div className="h-24 rounded-xl border border-border" />
            <div className="h-24 rounded-xl border border-border" />
          </div>
        }
      >
        <AdminContent searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

async function AdminContent({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string
    q?: string
    age?: string
    occupation?: string
    invested?: string
    from?: string
    to?: string
  }>
}) {
  const params = await searchParams
  const page = Math.max(0, parseInt(params.page ?? "0"))

  const conditions = []

  if (params.q) {
    conditions.push(
      sql`${submissions.answers}->>'email' ILIKE ${"%" + params.q + "%"}`
    )
  }

  if (params.age) {
    conditions.push(sql`${submissions.answers}->>'age_range' = ${params.age}`)
  }

  if (params.occupation) {
    conditions.push(
      sql`${submissions.answers}->>'occupation' = ${params.occupation}`
    )
  }

  if (params.invested) {
    conditions.push(
      sql`${submissions.answers}->>'invested_foreign' = ${params.invested}`
    )
  }

  if (params.from) {
    conditions.push(gte(submissions.submittedAt, new Date(params.from)))
  }

  if (params.to) {
    const toDate = new Date(params.to)
    toDate.setDate(toDate.getDate() + 1)
    conditions.push(lte(submissions.submittedAt, toDate))
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const [analytics, [{ filteredTotal }], rows] = await Promise.all([
    getAnalytics(),
    db.select({ filteredTotal: count() }).from(submissions).where(whereClause),
    db
      .select()
      .from(submissions)
      .where(whereClause)
      .orderBy(desc(submissions.submittedAt))
      .limit(PAGE_SIZE)
      .offset(page * PAGE_SIZE),
  ])

  const totalPages = Math.ceil(filteredTotal / PAGE_SIZE)

  const paginationParams = new URLSearchParams()
  if (params.q) paginationParams.set("q", params.q)
  if (params.age) paginationParams.set("age", params.age)
  if (params.occupation) paginationParams.set("occupation", params.occupation)
  if (params.invested) paginationParams.set("invested", params.invested)
  if (params.from) paginationParams.set("from", params.from)
  if (params.to) paginationParams.set("to", params.to)

  const buildPageUrl = (p: number) => {
    const u = new URLSearchParams(paginationParams)
    if (p > 0) u.set("page", String(p))
    const qs = u.toString()
    return qs ? `?${qs}` : "/admin"
  }

  return (
    <>
      <AnalyticsCharts {...analytics} />

      <Suspense fallback={<div className="h-20" />}>
        <AdminFilters />
      </Suspense>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredTotal === analytics.total
            ? `${analytics.total} total submission${analytics.total !== 1 ? "s" : ""}`
            : `${filteredTotal} of ${analytics.total} submissions`}
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Submitted
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Email
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Age
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Occupation
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((submission) => {
              const answers = submission.answers as Record<string, unknown>
              return (
                <tr
                  key={submission.id}
                  className="transition-colors hover:bg-muted/30"
                >
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {new Date(submission.submittedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {String(answers.email ?? "—")}
                  </td>
                  <td className="px-4 py-3">
                    {String(answers.age_range ?? "—")}
                  </td>
                  <td className="px-4 py-3">
                    {String(answers.occupation ?? "—")}
                  </td>
                  <td className="px-4 py-3">
                    <SubmissionDetail
                      submission={submission}
                      config={SURVEY_CONFIG}
                    />
                  </td>
                </tr>
              )
            })}
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  {whereClause ? "No submissions found" : "No submissions yet"}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-between">
          <a
            href={page > 0 ? buildPageUrl(page - 1) : "#"}
            className={page === 0 ? "pointer-events-none opacity-50" : ""}
          >
            <button
              className="rounded-md border border-border px-4 py-2 text-sm transition-colors hover:bg-muted"
              disabled={page === 0}
            >
              Previous
            </button>
          </a>
          <p className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </p>
          <a
            href={page < totalPages - 1 ? buildPageUrl(page + 1) : "#"}
            className={
              page >= totalPages - 1 ? "pointer-events-none opacity-50" : ""
            }
          >
            <button
              className="rounded-md border border-border px-4 py-2 text-sm transition-colors hover:bg-muted"
              disabled={page >= totalPages - 1}
            >
              Next
            </button>
          </a>
        </div>
      ) : null}
    </>
  )
}
