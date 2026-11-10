import { sql, type SQL } from "drizzle-orm"

export type RateLimitPolicy = { limit: number; windowSeconds: number }
export type RateLimitResult = { allowed: boolean; retryAfterSeconds: number }
type Execute = (query: SQL) => Promise<unknown>

export const REQUEST_LIMITS = {
  login: { limit: 5, windowSeconds: 15 * 60 },
  partial: { limit: 120, windowSeconds: 60 },
  submit: { limit: 10, windowSeconds: 60 },
  newResponse: { limit: 30, windowSeconds: 60 * 60 },
  newResponseNetwork: { limit: 1000, windowSeconds: 60 * 60 },
} satisfies Record<string, RateLimitPolicy>

/** A single atomic upsert prevents concurrent requests and instances evading limits. */
export async function consumeRateLimit(
  execute: Execute,
  key: string,
  policy: RateLimitPolicy
): Promise<RateLimitResult> {
  const result = (await execute(sql`
    WITH expired AS (
      DELETE FROM security_rate_limits
      WHERE key IN (
        SELECT key FROM security_rate_limits
        WHERE reset_at <= CURRENT_TIMESTAMP AND key <> ${key}
        ORDER BY reset_at LIMIT 100
      ) AND reset_at <= CURRENT_TIMESTAMP
    )
    INSERT INTO security_rate_limits (key, attempts, reset_at)
    VALUES (${key}, 1, CURRENT_TIMESTAMP + ${policy.windowSeconds} * INTERVAL '1 second')
    ON CONFLICT (key) DO UPDATE SET
      attempts = CASE WHEN security_rate_limits.reset_at <= CURRENT_TIMESTAMP
        THEN 1 ELSE LEAST(security_rate_limits.attempts + 1, ${policy.limit + 1}) END,
      reset_at = CASE WHEN security_rate_limits.reset_at <= CURRENT_TIMESTAMP
        THEN CURRENT_TIMESTAMP + ${policy.windowSeconds} * INTERVAL '1 second'
        ELSE security_rate_limits.reset_at END
    RETURNING attempts <= ${policy.limit} AS allowed,
      CEIL(EXTRACT(EPOCH FROM reset_at - CURRENT_TIMESTAMP))::integer AS retry_after
  `)) as { rows: { allowed: boolean; retry_after: number }[] }
  const row = result.rows[0]
  if (!row) throw new Error("Rate limit storage unavailable")
  return {
    allowed: row.allowed,
    retryAfterSeconds: Math.max(1, row.retry_after),
  }
}
