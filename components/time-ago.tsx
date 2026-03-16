"use client"

import { useEffect, useState } from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

function getRelativeTime(date: Date): string {
  const now = Date.now()
  const diff = now - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)

  if (seconds < 5) return "just now"
  if (seconds < 60) return `${seconds}s ago`
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 30) return `${days}d ago`
  if (months < 12) return `${months}mo ago`
  return `${years}y ago`
}

const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
}

function formatLocal(date: Date): string {
  return date.toLocaleString("en-US", DATE_OPTIONS)
}

function formatUTC(date: Date): string {
  return date.toLocaleString("en-US", { ...DATE_OPTIONS, timeZone: "UTC" })
}

export function TimeAgo({ date }: { date: Date | string }) {
  const d = date instanceof Date ? date : new Date(date)
  const [relative, setRelative] = useState(() => getRelativeTime(d))
  const [local, setLocal] = useState("")

  useEffect(() => {
    setLocal(formatLocal(d))
    const id = setInterval(() => setRelative(getRelativeTime(d)), 60_000)
    return () => clearInterval(id)
  }, [d])

  return (
    <Tooltip>
      <TooltipTrigger
        className="cursor-default tabular-nums underline decoration-muted-foreground/30 decoration-dashed underline-offset-4"
        render={<span />}
      >
        {local}
      </TooltipTrigger>
      <TooltipContent side="top" className="grid gap-1 text-xs">
        <span>{relative}</span>
        <span className="text-background/60">{formatUTC(d)} UTC</span>
      </TooltipContent>
    </Tooltip>
  )
}
