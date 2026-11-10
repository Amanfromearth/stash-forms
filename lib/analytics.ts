import { db } from "./db"
import { submissions } from "./schema"
import type { VersionedFormConfig } from "./form-config"
import { count, sql, desc, eq, and } from "drizzle-orm"

export async function getAnalytics(config: VersionedFormConfig) {
  const versionCondition = eq(submissions.formVersion, config.version)
  const [[{ total }], [{ todayCount }], dailyTrend, allAnswers] =
    await Promise.all([
      db
        .select({ total: count() })
        .from(submissions)
        .where(and(versionCondition, eq(submissions.isPartial, false))),
      db
        .select({ todayCount: count() })
        .from(submissions)
        .where(
          and(
            versionCondition,
            sql`${submissions.submittedAt} >= CURRENT_DATE AND ${submissions.isPartial} = false`
          )
        ),
      db
        .select({
          date: sql<string>`TO_CHAR(${submissions.submittedAt}, 'Mon DD')`,
          count: count(),
        })
        .from(submissions)
        .where(
          and(
            versionCondition,
            sql`${submissions.submittedAt} >= NOW() - INTERVAL '30 days' AND ${submissions.isPartial} = false`
          )
        )
        .groupBy(
          sql`TO_CHAR(${submissions.submittedAt}, 'Mon DD'), DATE(${submissions.submittedAt})`
        )
        .orderBy(sql`DATE(${submissions.submittedAt}) ASC`)
        .limit(30),
      db
        .select({ answers: submissions.answers })
        .from(submissions)
        .where(and(versionCondition, eq(submissions.isPartial, false)))
        .orderBy(desc(submissions.submittedAt)),
    ])

  const aggregate = (id: string) => {
    const question = config.questions.find((q) => q.id === id)
    return aggregateField(
      allAnswers,
      id,
      question && "options" in question ? question.options : []
    )
  }
  const ageData = aggregate("age_range")
  const occupationData = aggregate("occupation")
  const foreignInvestData = aggregate("invested_foreign")
  const savingsData = aggregate("monthly_savings")

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
