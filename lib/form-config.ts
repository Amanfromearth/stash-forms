export type QuestionType =
  | "short_text"
  | "email"
  | "long_text"
  | "multiple_choice"
  | "multi_select"
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
  | RatingQuestion
  | SectionHeaderQuestion

export interface FormConfig {
  title: string
  description: string
  questions: Question[]
}

export const SURVEY_CONFIG: FormConfig = {
  title: "Help Us Understand How India Thinks About Global Investing",
  description:
    "We're running a short survey to learn how people in India save, invest, and think about owning global assets like US stocks or foreign currencies.\n\nIt takes under 3 minutes, and your input will help us design better tools for global investing.",
  questions: [
    // ── Section 1 — Basic Profile ──
    {
      id: "email",
      type: "email",
      label: "What's your email address?",
      placeholder: "you@example.com",
      required: true,
    },
    {
      id: "age_range",
      type: "multiple_choice",
      label: "What's your age range?",
      required: true,
      options: ["18–24", "25–34", "35–44", "45+"],
    },
    {
      id: "occupation",
      type: "short_text",
      label: "What best describes your occupation?",
      placeholder: "e.g. Software engineer, Student, Business owner…",
      required: true,
    },
    {
      id: "monthly_savings",
      type: "multiple_choice",
      label: "How much do you save per month, roughly?",
      required: true,
      options: ["Less than ₹5k", "₹5k–₹20k", "₹20k–₹50k", "₹50k+"],
    },
    {
      id: "savings_share",
      type: "multiple_choice",
      label:
        "Roughly what share of your income goes toward saving or investing each month?",
      required: true,
      options: ["Less than 10%", "10–20%", "20–30%", "30%+"],
    },
    {
      id: "where_invest",
      type: "multi_select",
      label: "Where do you currently save or invest?",
      description: "Select all that apply",
      required: true,
      options: [
        "Bank savings account",
        "Fixed deposits",
        "Mutual funds / SIPs",
        "Stocks (direct equity)",
        "Gold / Digital gold",
        "Real estate",
        "Crypto",
        "PPF / NPS / EPF",
        "Other",
      ],
    },

    // ── Section 2 — Awareness of Global Investing ──
    {
      id: "invested_foreign",
      type: "multiple_choice",
      label: "Have you ever invested in foreign stocks or assets?",
      required: true,
      options: ["Yes", "No"],
    },
    {
      id: "foreign_platform",
      type: "short_text",
      label: "Which platform did you use?",
      placeholder: "e.g. Vested, INDmoney, Interactive Brokers…",
      required: false,
      condition: { questionId: "invested_foreign", equals: "Yes" },
    },
    {
      id: "foreign_what",
      type: "short_text",
      label: "What did you invest in?",
      placeholder: "e.g. US stocks, ETFs, bonds…",
      required: false,
      condition: { questionId: "invested_foreign", equals: "Yes" },
    },
    {
      id: "foreign_frequency",
      type: "short_text",
      label: "How often do you invest in foreign assets?",
      placeholder: "e.g. Monthly, One-time, Quarterly…",
      required: false,
      condition: { questionId: "invested_foreign", equals: "Yes" },
    },
    {
      id: "foreign_why",
      type: "long_text",
      label: "What drew you to investing internationally?",
      required: false,
      condition: { questionId: "invested_foreign", equals: "Yes" },
    },
    {
      id: "foreign_considered",
      type: "long_text",
      label:
        "Think back to the last time you considered putting money outside India — what happened?",
      required: false,
      condition: { questionId: "invested_foreign", equals: "No" },
    },
    {
      id: "thought_global",
      type: "multiple_choice",
      label:
        "Have you ever thought about investing in global companies — like Apple, Nvidia, or Netflix?",
      required: true,
      options: ["Yes", "No"],
    },
    {
      id: "held_back",
      type: "multi_select",
      label: "If you haven't invested internationally, what's held you back?",
      description: "Select all that apply",
      required: false,
      options: [
        "Too complicated",
        "Minimum investment too high",
        "Didn't know how",
        "Confusion around currency conversion",
        "Regulatory concerns",
        "Trust issues",
        "Never really thought about it",
      ],
    },

    // ── Section 3 — Currency Awareness ──
    // ── Section 3 — Currency Awareness ──
    {
      id: "rupee_losing_value",
      type: "multiple_choice",
      label:
        "Do you feel the Indian Rupee has been losing value against the USD over time?",
      required: true,
      options: ["Yes", "No", "Not sure"],
    },
    {
      id: "concern_level",
      type: "multiple_choice",
      label: "Does that concern you personally?",
      required: true,
      options: ["Yes, quite a bit", "Somewhat", "Not really"],
    },
    {
      id: "changed_saving",
      type: "multiple_choice",
      label: "Has that concern ever changed how or where you save your money?",
      required: true,
      options: [
        "No, I haven't changed anything",
        "Yes — please explain",
        "Not yet, but I've been thinking about it",
      ],
    },
    {
      id: "changed_saving_explain",
      type: "long_text",
      label: "Please explain how it's changed your saving behavior.",
      required: false,
      condition: {
        questionId: "changed_saving",
        equals: "Yes — please explain",
      },
    },
    {
      id: "save_in_usd",
      type: "multiple_choice",
      label:
        "If saving a portion of your money in USD or another foreign currency were genuinely easy, would you want to?",
      required: true,
      options: ["Yes", "Maybe", "No"],
    },
    {
      id: "usd_reasoning",
      type: "long_text",
      label: "What's your reasoning?",
      required: false,
    },

    // ── Section 4 — Micro-Investing Behaviour ──
    {
      id: "recurring_investments",
      type: "multi_select",
      label: "Do you have any recurring investments set up right now?",
      required: true,
      options: [
        "SIP",
        "Recurring deposit",
        "Jar or digital gold",
        "No, I don't",
      ],
    },
    {
      id: "auto_invest_app",
      type: "multiple_choice",
      label:
        "Would you use an app that automatically invests ₹10–₹100 daily or weekly into global assets on your behalf?",
      required: true,
      options: ["Definitely", "Maybe", "No"],
    },
    {
      id: "interest_area",
      type: "multi_select",
      label: "Which of these would interest you most?",
      required: true,
      options: [
        "Saving in USD",
        "Saving in another foreign currency (EUR, etc.)",
        "Investing in global companies like Apple, Nvidia, or Tesla",
        "Investing in global index or hybrid funds",
        "All of the above",
        "None of these",
      ],
    },

    // ── Section 5 — Trust & Pricing ──
    {
      id: "trust_factors",
      type: "multi_select",
      label:
        "What would make you feel comfortable enough to trust a product like this?",
      description: "Select all that apply",
      required: true,
      options: [
        "Partnership with a known bank",
        "RBI-regulated",
        "Regulated entity (SEBI, IFSCA, etc.)",
        "Recognised brand name",
        "Funds insured or protected",
        "Clear, transparent fees",
      ],
    },
    {
      id: "min_starting_amount",
      type: "multiple_choice",
      label: "What's the smallest amount you'd feel comfortable starting with?",
      required: true,
      options: ["₹10", "₹50", "₹100", "₹500+"],
    },
    {
      id: "foreign_allocation",
      type: "multiple_choice",
      label:
        "What share of your monthly investments would you be comfortable putting into foreign assets?",
      required: true,
      options: ["Less than 5%", "Around 10%", "Around 20%", "30% or more"],
    },

    // ── Section 6 — Habit Formation ──
    {
      id: "engaging_feature",
      type: "multiple_choice",
      label:
        "Which feature would most likely keep you coming back to this product?",
      required: true,
      options: [
        "Automatic daily saving",
        "Round-ups on your spending",
        "Weekly scheduled investing",
        "Investing in brands you already know",
        "Watching your balance grow in USD",
        "Not sure",
      ],
    },
    {
      id: "usage_frequency",
      type: "multiple_choice",
      label:
        "How often do you realistically think you'd use something like this?",
      required: true,
      options: ["Daily", "Weekly", "Monthly", "Honestly, probably wouldn't"],
    },

    // ── Final ──
    {
      id: "what_would_it_take",
      type: "long_text",
      label: "What would it take for you to put ₹500 into it right now?",
      required: true,
    },
    {
      id: "follow_up",
      type: "multiple_choice",
      label: "Would you be open to a follow-up conversation?",
      required: true,
      options: ["Yes", "Maybe", "No"],
    },
  ],
}
