import { getFormConfig } from "@/lib/config-loader"
import { SurveyFormWrapper } from "./survey-form-wrapper"

export default async function Page() {
  const config = await getFormConfig()
  return <SurveyFormWrapper config={config} />
}
