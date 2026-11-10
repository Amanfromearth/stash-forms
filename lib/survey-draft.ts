import { z } from "zod"
import { formConfigSchema } from "./form-config-validation"
import { submissionSchema } from "./validations"
import type { VersionedFormConfig } from "./form-config"
import type { SurveySession } from "./survey-session"

export const DRAFT_PREFIX = "survey-draft:1:"
const TAB_DRAFT = "survey-current-draft:1"
export const DRAFT_LIFETIME = 30 * 24 * 60 * 60 * 1000
export type SurveyDraft = {
  session: SurveySession
  config: VersionedFormConfig
  answers: Record<string, unknown>
  step: number
  updatedAt: number
}
const draftSchema = z.object({
  session: z.object({
    sessionId: z.string().uuid(),
    formVersion: z.number().int().positive(),
    sessionToken: z.string().max(256),
  }),
  config: formConfigSchema.safeExtend({ version: z.number().int().positive() }),
  answers: submissionSchema.shape.answers,
  step: z.number().int().nonnegative(),
  updatedAt: z.number().finite(),
})

export function parseSurveyDraft(
  raw: string | null,
  now = Date.now()
): SurveyDraft | null {
  if (!raw || raw.length > 1_000_000) return null
  try {
    const parsed = draftSchema.safeParse(JSON.parse(raw))
    if (!parsed.success) return null
    const draft = parsed.data
    if (
      draft.config.version !== draft.session.formVersion ||
      draft.updatedAt > now ||
      now - draft.updatedAt > DRAFT_LIFETIME ||
      draft.step > draft.config.questions.length + 1
    )
      return null
    const ids = new Set(draft.config.questions.map((question) => question.id))
    if (Object.keys(draft.answers).some((id) => !ids.has(id))) return null
    return draft
  } catch {
    return null
  }
}

export function saveSurveyDraft(draft: SurveyDraft) {
  // Write on every edit locally, independently of the network autosave debounce.
  const raw = JSON.stringify(draft)
  try {
    window.sessionStorage.setItem(TAB_DRAFT, raw)
  } catch {}
  try {
    window.localStorage.setItem(
      `${DRAFT_PREFIX}${draft.session.sessionId}`,
      raw
    )
  } catch {}
}

export function getSurveyDrafts(): SurveyDraft[] {
  const drafts = new Map<string, SurveyDraft>()
  let tab: SurveyDraft | null = null
  try {
    tab = parseSurveyDraft(window.sessionStorage.getItem(TAB_DRAFT))
  } catch {}
  if (tab) drafts.set(tab.session.sessionId, tab)
  // Without cross-tab locks, restore only this tab's draft to avoid another tab's work.
  if (navigator.locks) {
    try {
      for (let i = window.localStorage.length - 1; i >= 0; i--) {
        const key = window.localStorage.key(i)
        if (!key?.startsWith(DRAFT_PREFIX)) continue
        const draft = parseSurveyDraft(window.localStorage.getItem(key))
        if (!draft) {
          window.localStorage.removeItem(key)
          continue
        }
        if (draft.step === 0) continue
        const existing = drafts.get(draft.session.sessionId)
        if (!existing || existing.updatedAt < draft.updatedAt)
          drafts.set(draft.session.sessionId, draft)
      }
    } catch {}
  }
  return [...drafts.values()].sort((a, b) => {
    if (a.session.sessionId === tab?.session.sessionId) return -1
    if (b.session.sessionId === tab?.session.sessionId) return 1
    return b.updatedAt - a.updatedAt
  })
}

export function claimSurveyDraft(
  sessionId: string
): Promise<(() => void) | null> {
  if (!navigator.locks) return Promise.resolve(() => {})
  return new Promise((resolve) => {
    void navigator.locks
      .request(
        `survey-draft:${sessionId}`,
        { ifAvailable: true },
        async (lock) => {
          if (!lock) {
            resolve(null)
            return
          }
          await new Promise<void>((release) => resolve(release))
        }
      )
      .catch(() => resolve(null))
  })
}
