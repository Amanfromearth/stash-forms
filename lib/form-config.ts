export type QuestionType =
  | "short_text"
  | "email"
  | "long_text"
  | "multiple_choice"
  | "multi_select"
  | "dropdown"
  | "rating"
  | "section_header"

interface BaseQuestion {
  id: string
  label: string
  description?: string
  required: boolean
  condition?: {
    questionId: string
    equals: string
  }
  autoFill?: {
    questionId: string
    ifContains: string[]
    value: string
  }
  skipIf?: {
    questionId: string
    containsAny: string[]
    autoValue: string
  }
}

export interface ShortTextQuestion extends BaseQuestion {
  type: "short_text"
  placeholder?: string
}

export interface EmailQuestion extends BaseQuestion {
  type: "email"
  placeholder?: string
}

export interface LongTextQuestion extends BaseQuestion {
  type: "long_text"
  placeholder?: string
  maxLength?: number
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: "multiple_choice"
  options: string[]
}

export interface MultiSelectQuestion extends BaseQuestion {
  type: "multi_select"
  options: string[]
  maxSelections?: number
}

export interface DropdownQuestion extends BaseQuestion {
  type: "dropdown"
  options: string[]
}

export interface RatingQuestion extends BaseQuestion {
  type: "rating"
  min: number
  max: number
}

export interface SectionHeaderQuestion {
  type: "section_header"
  id: string
  label: string
  description?: string
  required: false
}

export type Question =
  | ShortTextQuestion
  | EmailQuestion
  | LongTextQuestion
  | MultipleChoiceQuestion
  | MultiSelectQuestion
  | DropdownQuestion
  | RatingQuestion
  | SectionHeaderQuestion

export interface FormConfig {
  title: string
  description: string
  questions: Question[]
}

export interface VersionedFormConfig extends FormConfig {
  version: number
}

export { SURVEY_V2_CONFIG as SURVEY_CONFIG } from "./form-config-v2"
