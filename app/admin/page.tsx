import type { Metadata } from "next"
import { db } from "@/lib/db"
import { submissions } from "@/lib/schema"
import { SURVEY_CONFIG } from "@/lib/form-config"
import { desc, count } from "drizzle-orm"
import { SubmissionDetail } from "./submission-detail"

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

  const [rows, [{ total }]] = await Promise.all([
    db
      .select()
      .from(submissions)
      .orderBy(desc(submissions.submittedAt))
      .limit(PAGE_SIZE)
      .offset(page * PAGE_SIZE),
    db.select({ total: count() }).from(submissions),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  if (rows.length === 0 && page === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-2xl font-semibold">No submissions yet</p>
        <p className="mt-2 text-muted-foreground">
          Responses will appear here once people fill out the survey.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {total} total submission{total !== 1 ? "s" : ""}
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
                Name
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Email
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Rating
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
                  <td className="px-4 py-3">{String(answers.name ?? "—")}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {String(answers.email ?? "—")}
                  </td>
                  <td className="px-4 py-3">
                    {answers.rating ? `${answers.rating} / 5` : "—"}
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
