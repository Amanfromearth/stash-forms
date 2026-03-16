"use client"

import { cn } from "@/lib/utils"

interface QuestionWrapperProps {
  children: React.ReactNode
  direction: "forward" | "backward"
  isExiting?: boolean
}

export function QuestionWrapper({
  children,
  direction,
  isExiting = false,
}: QuestionWrapperProps) {
  return (
    <div
      className={cn(
        isExiting
          ? "animate-out duration-150 fill-mode-forwards fade-out"
          : cn(
              "animate-in duration-300 fade-in",
              direction === "forward"
                ? "slide-in-from-bottom-4"
                : "slide-in-from-top-4"
            )
      )}
      style={{ animationTimingFunction: "var(--ease-out-quint)" }}
    >
      {children}
    </div>
  )
}
