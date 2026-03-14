"use client"

import { cn } from "@/lib/utils"

interface QuestionWrapperProps {
  children: React.ReactNode
  direction: "forward" | "backward"
}

export function QuestionWrapper({ children, direction }: QuestionWrapperProps) {
  return (
    <div
      className={cn(
        "animate-in duration-300 fade-in",
        direction === "forward"
          ? "slide-in-from-bottom-4"
          : "slide-in-from-top-4"
      )}
      style={{ animationTimingFunction: "var(--ease-out-quint)" }}
    >
      {children}
    </div>
  )
}
