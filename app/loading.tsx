export default function Loading() {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center p-6 md:p-12">
      <div className="absolute top-0 z-0 h-full w-full bg-background bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.45),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.25),rgba(0,0,0,0))]" />
      <div className="relative z-10 flex w-full max-w-2xl animate-pulse flex-col gap-8">
        <div className="flex flex-col gap-4">
          <div className="h-12 w-3/4 rounded-lg bg-muted" />
          <div className="space-y-2">
            <div className="h-5 w-full rounded bg-muted" />
            <div className="h-5 w-5/6 rounded bg-muted" />
            <div className="h-5 w-2/3 rounded bg-muted" />
          </div>
          <div className="h-4 w-48 rounded bg-muted" />
        </div>
        <div className="h-11 w-28 rounded-md bg-muted" />
      </div>
    </div>
  )
}
