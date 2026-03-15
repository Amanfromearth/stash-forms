"use client"

import { useState } from "react"

interface ThankYouScreenProps {
  onReset?: () => void
}

export function ThankYouScreen({
  onReset,
}: ThankYouScreenProps) {
  const [showDialog, setShowDialog] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setShowDialog(true)
  }

  return (
    <>
      <div className="flex w-full max-w-2xl flex-col items-center gap-8 text-center">
        <div
          className="animate-in overflow-hidden rounded-2xl duration-500 zoom-in-50 fade-in"
          style={{ animationTimingFunction: "var(--ease-out-quint)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExbHdhdWowdWNhczY1eW9jZTRmNHNkdWZpdGZpZzZreGMwdmo4NGR1byZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/blSTtZehjAZ8I/giphy.gif"
            alt="Thank you celebration"
            className="h-48 w-auto object-cover"
          />
        </div>

        <div className="flex flex-col gap-3">
          <h1
            className="animate-in font-heading text-4xl leading-tight font-light tracking-tight text-balance delay-150 duration-500 fill-mode-both fade-in slide-in-from-bottom-4 md:text-5xl"
            style={{ animationTimingFunction: "var(--ease-out-quint)" }}
          >
            You&apos;re awesome! 🎉
          </h1>
          <p
            className="animate-in text-lg text-pretty text-muted-foreground delay-300 duration-500 fill-mode-both fade-in slide-in-from-bottom-4"
            style={{ animationTimingFunction: "var(--ease-out-quint)" }}
          >
            Your response has been recorded. Thanks for helping us build
            something better.
          </p>
        </div>

        <div
          className="flex animate-in flex-col items-center gap-3 delay-500 duration-500 fill-mode-both fade-in"
          style={{ animationTimingFunction: "var(--ease-out-quint)" }}
        >
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-accent"
          >
            🔗 Help us reach more people — share this survey
          </button>

          {onReset ? (
            <button
              onClick={onReset}
              className="w-fit text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
            >
              Submit another response
            </button>
          ) : null}
        </div>
      </div>

      {showDialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex w-full max-w-sm flex-col items-center gap-5 rounded-xl border border-border bg-background p-6 text-center shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3N2Y0OXFoOHh3dXZrNXJnOWVpbmJqeWx4NTNlZWdvaDh2cm5sbXF4YyZlcD12MV9naWZzX3RyZW5kaW5nJmN0PWc/MDJ9IbxxvDUQM/giphy.gif"
              alt="Thanks for sharing"
              className="h-40 w-auto rounded-lg object-cover"
            />
            <div className="flex flex-col gap-1">
              <p className="text-lg font-semibold">Thanks for sharing! 🙌</p>
              <p className="text-sm text-muted-foreground">
                Link copied to clipboard
              </p>
            </div>
            <button
              onClick={() => setShowDialog(false)}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-accent"
            >
              Done
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
