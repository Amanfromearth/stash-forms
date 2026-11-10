import { getFormConfig } from "@/lib/config-loader"
import { createSurveySession } from "@/lib/survey-session"
import { SurveyFormWrapper } from "./survey-form-wrapper"

export const dynamic = "force-dynamic"

export default async function Page() {
  const config = await getFormConfig()
  return (
    <SurveyFormWrapper
      key={config.version}
      config={config}
      initialSession={createSurveySession(config.version)}
    />
  )
}
