import { SurveyForm } from "@/components/survey/survey-form"
import { getFormConfig } from "@/lib/config-loader"
import { submitSurvey } from "@/app/actions/submit"

export default async function Page() {
  const config = await getFormConfig()

  async function handleSubmit(answers: Record<string, unknown>) {
    "use server"
    return submitSurvey({ answers })
  }

  return <SurveyForm config={config} onSubmit={handleSubmit} />
}
