"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { SurveyForm } from "@/components/survey/survey-form"
import { InteriorFeedback } from "@/components/interior/feedback"
import { detectVisitorCountry } from "@/app/actions/country"
import {
  renewSurveySession,
  resumeSurveySession,
} from "@/app/actions/survey-session"
import type { SurveySession } from "@/lib/survey-session"
import { submitSurvey, upsertPartial } from "@/app/actions/submit"
import type { VersionedFormConfig } from "@/lib/form-config"
import {
  claimSurveyDraft,
  getSurveyDrafts,
  saveSurveyDraft,
  type SurveyDraft,
} from "@/lib/survey-draft"
import Loading from "./loading"

type LoadedDraft = {
  draft: SurveyDraft
  release: () => void
  verified: boolean
}

async function resumeWithoutBlocking(previous: SurveySession) {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      resumeSurveySession(previous),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("Resume temporarily unavailable")),
          3000
        )
      }),
    ])
  } finally {
    clearTimeout(timer)
  }
}

async function restoreDraft(
  config: VersionedFormConfig,
  initialSession: SurveySession
): Promise<LoadedDraft> {
  for (const saved of getSurveyDrafts().slice(0, 1)) {
    let release = await claimSurveyDraft(saved.session.sessionId)
    if (!release) {
      // Allow a previous render/document in this tab to finish releasing its lock.
      await new Promise((resolve) => setTimeout(resolve, 50))
      release = await claimSurveyDraft(saved.session.sessionId)
    }
    if (!release) continue
    try {
      const restored = await resumeWithoutBlocking(saved.session)
      if (restored.valid) {
        const draft = {
          ...saved,
          session: restored.session,
          config: restored.config,
          answers: restored.completed ? {} : saved.answers,
          step: restored.completed
            ? restored.config.questions.length + 1
            : Math.min(saved.step, restored.config.questions.length),
        }
        if (restored.completed) release()
        return {
          draft,
          release: restored.completed ? () => {} : release,
          verified: true,
        }
      }
      // A signing-key change must not discard locally saved answers for the same questions.
      release()
      if (
        saved.config.version === config.version &&
        saved.step <= config.questions.length
      ) {
        return {
          draft: { ...saved, config, session: initialSession },
          release:
            (await claimSurveyDraft(initialSession.sessionId)) ?? (() => {}),
          verified: true,
        }
      }
    } catch {
      // A temporary network failure keeps the local version and edits available.
      return { draft: saved, release, verified: false }
    }
  }
  return {
    draft: {
      session: initialSession,
      config,
      answers: {},
      step: 0,
      updatedAt: Date.now(),
    },
    release: (await claimSurveyDraft(initialSession.sessionId)) ?? (() => {}),
    verified: true,
  }
}

export function SurveyFormWrapper({
  config,
  initialSession,
}: {
  config: VersionedFormConfig
  initialSession: SurveySession
}) {
  const [initialCountry, setInitialCountry] = useState<string>()
  const detection = useRef<Promise<string | undefined> | null>(null)
  useEffect(() => {
    let active = true
    detection.current ??= detectVisitorCountry()
    void detection.current
      .then((country) => {
        if (active) setInitialCountry(country)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  const [loaded, setLoaded] = useState<SurveyDraft | null>(null)
  const entry = useRef({ config, initialSession })
  const currentDraft = useRef<SurveyDraft | null>(null)
  const [resetError, setResetError] = useState<string>()
  const initialization = useRef<Promise<LoadedDraft> | null>(null)
  const cleanupTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  )
  const releaseLock = useRef<() => void>(() => {})
  const session = useRef(initialSession)
  const completed = useRef(false)
  const verified = useRef(true)
  const refresh = useRef<Promise<SurveySession> | null>(null)

  useEffect(() => {
    let active = true
    clearTimeout(cleanupTimer.current)
    const initial = entry.current
    initialization.current ??= restoreDraft(
      initial.config,
      initial.initialSession
    )
    void initialization.current.then(
      ({ draft, release, verified: checked }) => {
        if (!active) return
        session.current = draft.session
        verified.current = checked
        currentDraft.current = draft
        completed.current = draft.step > draft.config.questions.length
        releaseLock.current = release
        setLoaded(draft)
      }
    )
    return () => {
      active = false
      // Strict Mode replays reuse the same restoration and lock.
      cleanupTimer.current = setTimeout(() => {
        void initialization.current?.then(({ release }) => {
          release()
          releaseLock.current()
        })
      }, 0)
    }
  }, [])

  const ensureSession = useCallback(async () => {
    const issuedAt = Number(session.current.sessionToken.split(".")[2])
    if (
      verified.current &&
      Number.isFinite(issuedAt) &&
      Date.now() - issuedAt < 20 * 60 * 60 * 1000
    )
      return session.current
    refresh.current ??= resumeSurveySession(session.current)
      .then((result) => {
        if (!result.valid)
          throw new Error(
            "Could not resume this session. Your answers remain saved on this device."
          )
        session.current = result.session
        verified.current = true
        if (currentDraft.current) {
          currentDraft.current = {
            ...currentDraft.current,
            session: result.session,
          }
          saveSurveyDraft(currentDraft.current)
        }
        return result.session
      })
      .finally(() => {
        refresh.current = null
      })
    return refresh.current
  }, [])

  const persist = useCallback(
    (answers: Record<string, unknown>, step: number) => {
      if (
        !loaded ||
        (completed.current && step <= loaded.config.questions.length)
      )
        return
      const draft = {
        session: session.current,
        config: loaded.config,
        answers: completed.current ? {} : answers,
        step,
        updatedAt: Date.now(),
      }
      currentDraft.current = draft
      saveSurveyDraft(draft)
    },
    [loaded]
  )

  const onSave = useCallback(
    async (answers: Record<string, unknown>) => {
      if (completed.current) return
      await upsertPartial({ ...(await ensureSession()), answers })
    },
    [ensureSession]
  )

  const onSubmit = useCallback(
    async (answers: Record<string, unknown>) => {
      const result = await submitSurvey({ ...(await ensureSession()), answers })
      if (result.success && loaded) {
        completed.current = true
        persist({}, loaded.config.questions.length + 1)
        releaseLock.current()
        releaseLock.current = () => {}
      }
      return result
    },
    [ensureSession, loaded, persist]
  )

  const handleReset = useCallback(async () => {
    if (!loaded) return
    try {
      const next = await renewSurveySession(await ensureSession())
      const release = (await claimSurveyDraft(next.sessionId)) ?? (() => {})
      releaseLock.current()
      releaseLock.current = release
      session.current = next
      completed.current = false
      setResetError(undefined)
      const draft = {
        session: next,
        config: loaded.config,
        answers: {},
        step: 0,
        updatedAt: Date.now(),
      }
      saveSurveyDraft(draft)
      currentDraft.current = draft
      setLoaded(draft)
    } catch {
      setResetError("Could not start a new response. Please try again.")
    }
  }, [ensureSession, loaded])

  if (!loaded) return <Loading />
  return (
    <>
      <SurveyForm
        key={loaded.session.sessionId}
        config={loaded.config}
        initialAnswers={loaded.answers}
        initialStep={loaded.step}
        initialCountry={initialCountry}
        onProgress={persist}
        onSave={onSave}
        onSubmit={onSubmit}
        onReset={() => void handleReset()}
      />
      {resetError ? <InteriorFeedback message={resetError} /> : null}
    </>
  )
}
