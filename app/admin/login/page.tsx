import type { Metadata } from "next"
import { LoginForm } from "./login-form"

export const metadata: Metadata = {
  title: "Admin Login",
}

export default function LoginPage() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <LoginForm />
    </div>
  )
}
