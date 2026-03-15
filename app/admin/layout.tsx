import { logoutAction } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-semibold">Survey Admin</h1>
            <nav className="flex gap-4 text-sm">
              <a
                href="/admin"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Dashboard
              </a>
              <a
                href="/admin/settings"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Settings
              </a>
            </nav>
          </div>
          <form action={logoutAction}>
            <Button type="submit" variant="ghost" size="sm">
              Logout
            </Button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  )
}
