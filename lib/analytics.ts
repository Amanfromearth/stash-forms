import { db } from "./db"
import { submissions } from "./schema"
import { count, sql, desc } from "drizzle-orm"

export async function getAnalytics() {
  const [[{ total }], [{ todayCount }], dailyTrend, allAnswers] =
    await Promise.all([
      db.select({ total: count() }).from(submissions),
      db
        .select({ todayCount: count() })
        .from(submissions)
        .where(sql`${submissions.submittedAt} >= CURRENT_DATE`),
      db
        .select({
          date: sql<string>`TO_CHAR(${submissions.submittedAt}, 'Mon DD')`,
          count: count(),
        })
        .from(submissions)
        .where(sql`${submissions.submittedAt} >= NOW() - INTERVAL '30 days'`)
        .groupBy(
          sql`TO_CHAR(${submissions.submittedAt}, 'Mon DD'), DATE(${submissions.submittedAt})`
        )
        .orderBy(sql`DATE(${submissions.submittedAt}) ASC`)
        .limit(30),
      db
        .select({ answers: submissions.answers })
        .from(submissions)
        .orderBy(desc(submissions.submittedAt))
        .limit(500),
    ])

  const ageData = aggregateField(allAnswers, "age_range", [
    "18–24",
    "25–30",
    "30–40",
    "40+",
  ])
  const occupationData = aggregateField(allAnswers, "occupation", [
    "Student",
    "Salaried employee",
    "Freelancer / remote worker",
    "Business owner",
    "Others",
  ])
  const foreignInvestData = aggregateField(allAnswers, "invested_foreign", [
    "Yes",
    "No",
  ])
  const savingsData = aggregateField(allAnswers, "monthly_savings", [
    "Less than ₹5k",
    "₹5k–₹20k",
    "₹20k–₹50k",
    "₹50k+",
  ])

  return {
    total,
    todayCount,
    dailyTrend,
    ageData,
    occupationData,
    foreignInvestData,
    savingsData,
  }
}

function aggregateField(
  rows: { answers: Record<string, unknown> }[],
  fieldId: string,
  options: string[]
): { name: string; value: number }[] {
  const counts = new Map<string, number>()
  for (const opt of options) counts.set(opt, 0)
  for (const row of rows) {
    const val = row.answers[fieldId]
    if (typeof val === "string" && counts.has(val)) {
      counts.set(val, counts.get(val)! + 1)
    }
  }
  return options.map((name) => ({ name, value: counts.get(name) ?? 0 }))
}

export type Analytics = Awaited<ReturnType<typeof getAnalytics>>
