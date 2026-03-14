// Question type definitions
export type QuestionType =
  | "short_text"
  | "email"
  | "long_text"
  | "multiple_choice"
  | "rating"

interface BaseQuestion {
  id: string
  label: string
  description?: string
  required: boolean
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

export interface RatingQuestion extends BaseQuestion {
  type: "rating"
  min: number
  max: number
}

export type Question =
  | ShortTextQuestion
  | EmailQuestion
  | LongTextQuestion
  | MultipleChoiceQuestion
  | RatingQuestion

export interface FormConfig {
  title: string
  description: string
  questions: Question[]
}

// Demo: Customer Feedback Survey
export const SURVEY_CONFIG: FormConfig = {
  title: "Customer Feedback Survey",
  description:
    "Help us improve by sharing your experience. It only takes 2 minutes.",
  questions: [
    {
      id: "name",
      type: "short_text",
      label: "What's your name?",
      required: true,
      placeholder: "Jane Smith",
    },
    {
      id: "email",
      type: "email",
      label: "What's your email address?",
      required: true,
      placeholder: "jane@example.com",
    },
    {
      id: "heard_from",
      type: "multiple_choice",
      label: "How did you hear about us?",
      required: true,
      options: [
        "Social Media",
        "Friend or Colleague",
        "Search Engine",
        "Blog Post",
        "Other",
      ],
    },
    {
      id: "rating",
      type: "rating",
      label: "How would you rate your experience?",
      required: true,
      min: 1,
      max: 5,
    },
    {
      id: "feedback",
      type: "long_text",
      label: "Any additional feedback?",
      description: "Share anything that would help us improve.",
      required: false,
      maxLength: 5000,
    },
  ],
}
