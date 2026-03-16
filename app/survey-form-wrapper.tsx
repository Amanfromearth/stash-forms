"use client"

import { useCallback, useState } from "react"
import { SurveyForm } from "@/components/survey/survey-form"
import { submitSurvey } from "@/app/actions/submit"
import type { FormConfig } from "@/lib/form-config"

export function SurveyFormWrapper({ config }: { config: FormConfig }) {
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID())

  const handleReset = useCallback(() => {
    setSessionId(crypto.randomUUID())
  }, [])

  return (
    <SurveyForm
      key={sessionId}
      config={config}
      sessionId={sessionId}
      onSubmit={async (answers) => submitSurvey({ answers, sessionId })}
      onReset={handleReset}
    />
  )
}
