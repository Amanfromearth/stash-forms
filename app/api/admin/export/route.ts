import { db } from "@/lib/db"
import { submissions } from "@/lib/schema"
import { getFormConfig } from "@/lib/config-loader"
import { desc, and, gte, lte, sql } from "drizzle-orm"

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return ""
  if (Array.isArray(value)) return value.join("; ")
  return String(value)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const conditions = []

  const q = searchParams.get("q")
  if (q) {
    conditions.push(
      sql`${submissions.answers}->>'email' ILIKE ${"%" + q.slice(0, 200) + "%"}`
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

  const [rows, formConfig] = await Promise.all([
    db
      .select({
        id: submissions.id,
        isPartial: submissions.isPartial,
        answers: submissions.answers,
        submittedAt: submissions.submittedAt,
      })
      .from(submissions)
      .where(whereClause)
      .orderBy(desc(submissions.submittedAt)),
    getFormConfig(),
  ])

  const questions = formConfig.questions.filter(
    (q) => q.type !== "section_header"
  )

  const headers = [
    "ID",
    "Submitted At",
    "Status",
    ...questions.map((q) => q.label),
  ]

  const csvLines: string[] = [headers.map(escapeCSV).join(",")]

  for (const row of rows) {
    const answers = row.answers as Record<string, unknown>
    const line = [
      row.id,
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
      "Content-Disposition": `attachment; filename="submissions-${date}.csv"`,
    },
  })
}
