export default function SettingsLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="h-4 w-28 rounded bg-muted" />
          <div className="h-3 w-64 rounded bg-muted" />
        </div>
        <div className="h-9 w-32 rounded-md bg-muted" />
      </div>
      <div className="space-y-3 rounded-xl border border-border p-6">
        <div className="h-4 w-32 rounded bg-muted" />
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="h-3 w-10 rounded bg-muted" />
            <div className="h-9 w-full rounded-md bg-muted" />
          </div>
          <div className="space-y-1">
            <div className="h-3 w-20 rounded bg-muted" />
            <div className="h-16 w-full rounded-md bg-muted" />
          </div>
        </div>
      </div>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="space-y-3 rounded-xl border border-border p-5">
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-8 rounded bg-muted" />
            <div className="h-3 w-24 rounded bg-muted" />
            <div className="h-4 w-16 rounded bg-muted" />
          </div>
          <div className="space-y-1">
            <div className="h-3 w-10 rounded bg-muted" />
            <div className="h-9 w-full rounded-md bg-muted" />
          </div>
          <div className="space-y-1">
            <div className="h-3 w-20 rounded bg-muted" />
            <div className="h-9 w-full rounded-md bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}
