import type { Metadata } from "next"
import { db } from "@/lib/db"
import { submissions } from "@/lib/schema"
import { SURVEY_CONFIG } from "@/lib/form-config"
import { desc } from "drizzle-orm"
import { SubmissionDetail } from "./submission-detail"
import { getAnalytics } from "@/lib/analytics"
import { AnalyticsCharts } from "./analytics-charts"

export const metadata: Metadata = {
  title: "Survey Admin",
}

const PAGE_SIZE = 25

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const params = await searchParams
  const page = Math.max(0, parseInt(params.page ?? "0"))

  const [analytics, rows] = await Promise.all([
    getAnalytics(),
    db
      .select()
      .from(submissions)
      .orderBy(desc(submissions.submittedAt))
      .limit(PAGE_SIZE)
      .offset(page * PAGE_SIZE),
  ])

  const totalPages = Math.ceil(analytics.total / PAGE_SIZE)

  return (
    <div className="space-y-6">
      <AnalyticsCharts {...analytics} />

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {analytics.total} total submission{analytics.total !== 1 ? "s" : ""}
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
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No submissions yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <a
            href={page > 0 ? `?page=${page - 1}` : "#"}
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
            href={page < totalPages - 1 ? `?page=${page + 1}` : "#"}
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
      )}
    </div>
  )
}
