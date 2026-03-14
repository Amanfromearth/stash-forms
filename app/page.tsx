"use client"

import { SurveyForm } from "@/components/survey/survey-form"
import { SURVEY_CONFIG } from "@/lib/form-config"
import { submitSurvey } from "@/app/actions/submit"

export default function Page() {
  return (
    <SurveyForm
      config={SURVEY_CONFIG}
      onSubmit={async (answers) => {
        return await submitSurvey({ answers })
      }}
    />
  )
}
