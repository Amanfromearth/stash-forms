"use client"

// Directional panel transitions adapted from Interior's wizard-steps (MIT).
import { m, useReducedMotion } from "motion/react"
import { CROSSFADE, INSTANT } from "@/components/interior/motion"

export function QuestionWrapper({
  children,
  direction,
  isExiting = false,
  axis = "horizontal",
}: {
  children: React.ReactNode
  direction: "forward" | "backward"
  isExiting?: boolean
  axis?: "horizontal" | "vertical"
}) {
  const reduced = useReducedMotion()
  const sign = direction === "forward" ? 1 : -1
  return (
    <m.div
      className="relative z-20"
      initial={{
        opacity: 0,
        x: axis === "horizontal" ? sign * 22 : 0,
        y: axis === "vertical" ? 22 : 0,
      }}
      animate={
        isExiting
          ? {
              opacity: 0,
              x: !reduced && axis === "horizontal" ? sign * -22 : 0,
              y: !reduced && axis === "vertical" ? -22 : 0,
            }
          : { opacity: 1, x: 0, y: 0 }
      }
      transition={
        reduced
          ? INSTANT
          : isExiting
            ? { duration: 0.14, ease: [0.4, 0, 1, 1] }
            : CROSSFADE
      }
    >
      {children}
    </m.div>
  )
}
