"use client"

import { useState } from "react"
import { SurveyForm } from "@/components/survey/survey-form"
import { submitSurvey } from "@/app/actions/submit"
import type { FormConfig } from "@/lib/form-config"

export function SurveyFormWrapper({ config }: { config: FormConfig }) {
  const [sessionId] = useState(() => crypto.randomUUID())

  return (
    <SurveyForm
      config={config}
      sessionId={sessionId}
      onSubmit={async (answers) => submitSurvey({ answers, sessionId })}
    />
  )
}
