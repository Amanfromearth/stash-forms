import type { Metadata } from "next"
import { requireAdmin } from "@/lib/admin-auth"
import Link from "next/link"
import type { VersionedFormConfig } from "@/lib/form-config"
import type { Submission } from "@/lib/schema"
import { Suspense } from "react"
import dynamic from "next/dynamic"
import { db } from "@/lib/db"
import { submissions } from "@/lib/schema"
import { notFound } from "next/navigation"
import { VersionSelector } from "@/components/version-selector"
import { getFormConfig, getFormVersions } from "@/lib/config-loader"
import { desc, count, sql, and, eq, gte, lte } from "drizzle-orm"
import { SubmissionDetail } from "./submission-detail"
import { AdminFilters } from "./admin-filters"
import { DownloadCSV } from "./download-csv"
import { getAnalytics } from "@/lib/analytics"
import { TimeAgo } from "@/components/time-ago"

const AnalyticsCharts = dynamic(
  () =>
    import("./analytics-charts").then((m) => ({ default: m.AnalyticsCharts })),
  {
    loading: () => (
      <div className="h-[600px] animate-pulse rounded-xl bg-muted/30" />
    ),
  }
)

export const metadata: Metadata = {
  title: "Survey Admin",
}

const PAGE_SIZE = 25

function AdminSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="space-y-2 rounded-xl border border-border p-6"
          >
            <div className="h-3 w-24 rounded bg-muted" />
            <div className="h-8 w-16 rounded bg-muted" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="h-64 rounded-xl border border-border p-6" />
        <div className="h-64 rounded-xl border border-border p-6" />
      </div>
      <div className="h-9 w-full rounded-md bg-muted" />
      <div className="rounded-lg border border-border">
        <div className="bg-muted/50 px-4 py-3">
          <div className="flex gap-16">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-4 w-20 rounded bg-muted" />
            ))}
          </div>
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="border-t border-border px-4 py-3">
            <div className="flex gap-16">
              <div className="h-4 w-32 rounded bg-muted" />
              <div className="h-4 w-36 rounded bg-muted" />
              <div className="h-4 w-12 rounded bg-muted" />
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="h-4 w-10 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{
    version?: string
    page?: string
    q?: string
    age?: string
    occupation?: string
    invested?: string
    from?: string
    to?: string
    status?: string
  }>
}) {
  return (
    <div className="space-y-6">
      <Suspense fallback={<AdminSkeleton />}>
        <AdminContent searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

async function AdminContent({
  searchParams,
}: {
  searchParams: Promise<{
    version?: string
    page?: string
    q?: string
    age?: string
    occupation?: string
    invested?: string
    from?: string
    to?: string
    status?: string
  }>
}) {
  const {
    versions,
    formConfig,
    analytics,
    filteredTotal,
    rows,
    page,
    totalPages,
    profileFields,
    questionLabels,
    buildPageUrl,
  } = await loadAdminData(await searchParams)

  return (
    <>
      <VersionSelector
        versions={versions}
        selectedVersion={formConfig.version}
        path="/admin"
      />
      <AnalyticsCharts {...analytics} />

      <Suspense fallback={<div className="h-20" />}>
        <AdminFilters key={formConfig.version} config={formConfig} />
      </Suspense>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredTotal === analytics.total
            ? `${analytics.total} total submission${analytics.total !== 1 ? "s" : ""}`
            : `${filteredTotal} of ${analytics.total} submissions`}
        </p>
        <Suspense fallback={null}>
          <DownloadCSV version={formConfig.version} />
        </Suspense>
      </div>

      <SubmissionsTable
        rows={rows}
        profileFields={profileFields}
        questionLabels={questionLabels}
      />

      <Pagination
        page={page}
        totalPages={totalPages}
        buildPageUrl={buildPageUrl}
      />
    </>
  )
}

interface AdminParams {
  version?: string
  page?: string
  q?: string
  age?: string
  occupation?: string
  invested?: string
  from?: string
  to?: string
  status?: string
}

async function loadAdminData(params: AdminParams) {
  await requireAdmin()
  const page = Math.max(0, Math.min(parseInt(params.page ?? "0") || 0, 1000))

  const versions = await getFormVersions()
  const selected =
    params.version === undefined ? versions[0]?.version : Number(params.version)
  if (!versions.some((v) => v.version === selected)) notFound()
  const formConfig = await getFormConfig(selected)
  const conditions = [eq(submissions.formVersion, formConfig.version)]

  if (params.q) {
    const q = params.q.slice(0, 200)
    conditions.push(
      sql`${submissions.answers}->>${formConfig.questions.some((q) => q.id === "email") ? "email" : "country"} ILIKE ${"%" + q + "%"}`
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

  if (params.status === "complete") {
    conditions.push(sql`${submissions.isPartial} = false`)
  }
  if (params.status === "partial") {
    conditions.push(sql`${submissions.isPartial} = true`)
  }

  const whereClause = and(...conditions)

  const [analytics, [{ filteredTotal }], rows] = await Promise.all([
    getAnalytics(formConfig),
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
  const profileFields = formConfig.questions.filter(
    (q) => q.id === "email" || q.id === "country"
  )

  const questionLabels = formConfig.questions
    .filter((q) => q.type !== "section_header")
    .map((q) => ({ id: q.id, label: q.label, type: q.type }))

  const paginationParams = new URLSearchParams({
    version: String(formConfig.version),
  })
  if (params.q) paginationParams.set("q", params.q)
  if (params.age) paginationParams.set("age", params.age)
  if (params.occupation) paginationParams.set("occupation", params.occupation)
  if (params.invested) paginationParams.set("invested", params.invested)
  if (params.from) paginationParams.set("from", params.from)
  if (params.to) paginationParams.set("to", params.to)
  if (params.status) paginationParams.set("status", params.status)

  const buildPageUrl = (p: number) => {
    const u = new URLSearchParams(paginationParams)
    if (p > 0) u.set("page", String(p))
    const qs = u.toString()
    return qs ? `?${qs}` : "/admin"
  }

  return {
    versions,
    formConfig,
    analytics,
    filteredTotal,
    rows,
    page,
    totalPages,
    profileFields,
    questionLabels,
    buildPageUrl,
  }
}

function SubmissionsTable({
  rows,
  profileFields,
  questionLabels,
}: {
  rows: Submission[]
  profileFields: VersionedFormConfig["questions"]
  questionLabels: { id: string; label: string; type: string }[]
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
              Submitted
            </th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
              Status
            </th>
            {profileFields.map((question) => (
              <th
                key={question.id}
                className="px-4 py-3 text-left font-medium text-muted-foreground"
              >
                {question.id === "email" ? "Email" : "Country"}
              </th>
            ))}
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
                  <TimeAgo date={submission.submittedAt} />
                </td>
                <td className="px-4 py-3">
                  {submission.isPartial ? (
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                      Partial
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      Complete
                    </span>
                  )}
                </td>
                {profileFields.map((question) => (
                  <td
                    key={question.id}
                    className="px-4 py-3 text-muted-foreground"
                  >
                    {String(answers[question.id] ?? "Not provided")}
                  </td>
                ))}
                <td className="px-4 py-3">
                  {String(answers.age_range ?? "Not provided")}
                </td>
                <td className="px-4 py-3">
                  {String(answers.occupation ?? "Not provided")}
                </td>
                <td className="px-4 py-3">
                  <SubmissionDetail
                    submission={submission}
                    questions={questionLabels}
                  />
                </td>
              </tr>
            )
          })}
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={5 + profileFields.length}
                className="px-4 py-8 text-center text-muted-foreground"
              >
                No submissions found
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  )
}

function Pagination({
  page,
  totalPages,
  buildPageUrl,
}: {
  page: number
  totalPages: number
  buildPageUrl: (page: number) => string
}) {
  return totalPages > 1 ? (
    <div className="flex items-center justify-between">
      <Link
        href={page > 0 ? buildPageUrl(page - 1) : "#"}
        aria-disabled={page === 0}
        tabIndex={page === 0 ? -1 : 0}
        className={`rounded-md border border-border px-4 py-2 text-sm hover:bg-muted ${page === 0 ? "pointer-events-none opacity-50" : ""}`}
      >
        Previous
      </Link>
      <p className="text-sm text-muted-foreground">
        Page {page + 1} of {totalPages}
      </p>
      <Link
        href={page < totalPages - 1 ? buildPageUrl(page + 1) : "#"}
        aria-disabled={page >= totalPages - 1}
        tabIndex={page >= totalPages - 1 ? -1 : 0}
        className={`rounded-md border border-border px-4 py-2 text-sm hover:bg-muted ${page >= totalPages - 1 ? "pointer-events-none opacity-50" : ""}`}
      >
        Next
      </Link>
    </div>
  ) : null
}
