import { db } from "@/lib/db"
import { submissions } from "@/lib/schema"
import { getFormConfig, getFormVersions } from "@/lib/config-loader"
import { desc, and, eq, gte, lte, sql } from "drizzle-orm"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { escapeCSV } from "@/lib/csv"

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return ""
  if (Array.isArray(value)) return value.join("; ")
  return String(value)
}

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { searchParams } = new URL(request.url)

  const versions = await getFormVersions()
  const requested = searchParams.get("version")
  const selected = requested === null ? versions[0]?.version : Number(requested)
  if (!versions.some((v) => v.version === selected))
    return new Response("Unknown form version", { status: 404 })
  const formConfig = await getFormConfig(selected)
  const conditions = [eq(submissions.formVersion, formConfig.version)]

  const q = searchParams.get("q")
  if (q) {
    conditions.push(
      sql`${submissions.answers}->>${formConfig.questions.some((q) => q.id === "email") ? "email" : "country"} ILIKE ${"%" + q.slice(0, 200) + "%"}`
    )
  }

  const age = searchParams.get("age")
  if (age) {
    conditions.push(sql`${submissions.answers}->>'age_range' = ${age}`)
  }

  const occupation = searchParams.get("occupation")
  if (occupation) {
    conditions.push(sql`${submissions.answers}->>'occupation' = ${occupation}`)
  }

  const invested = searchParams.get("invested")
  if (invested) {
    conditions.push(
      sql`${submissions.answers}->>'invested_foreign' = ${invested}`
    )
  }

  const from = searchParams.get("from")
  if (from) {
    conditions.push(gte(submissions.submittedAt, new Date(from)))
  }

  const to = searchParams.get("to")
  if (to) {
    const toDate = new Date(to)
    toDate.setDate(toDate.getDate() + 1)
    conditions.push(lte(submissions.submittedAt, toDate))
  }

  const status = searchParams.get("status")
  if (status === "complete") {
    conditions.push(sql`${submissions.isPartial} = false`)
  }
  if (status === "partial") {
    conditions.push(sql`${submissions.isPartial} = true`)
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const rows = await db
    .select({
      id: submissions.id,
      formVersion: submissions.formVersion,
      isPartial: submissions.isPartial,
      answers: submissions.answers,
      submittedAt: submissions.submittedAt,
    })
    .from(submissions)
    .where(whereClause)
    .orderBy(desc(submissions.submittedAt))

  const questions = formConfig.questions.filter(
    (q) => q.type !== "section_header"
  )

  const headers = [
    "ID",
    "Form Version",
    "Submitted At",
    "Status",
    ...questions.map((q) => q.label),
  ]

  const csvLines: string[] = [headers.map(escapeCSV).join(",")]

  for (const row of rows) {
    const answers = row.answers as Record<string, unknown>
    const line = [
      row.id,
      `v${row.formVersion}`,
      row.submittedAt.toISOString(),
      row.isPartial ? "Partial" : "Complete",
      ...questions.map((q) => escapeCSV(formatValue(answers[q.id]))),
    ]
    csvLines.push(line.join(","))
  }

  const csv = csvLines.join("\n")
  const date = new Date().toISOString().slice(0, 10)

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": `attachment; filename="submissions-v${formConfig.version}-${date}.csv"`,
    },
  })
}
