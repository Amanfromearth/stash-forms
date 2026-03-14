import type { Metadata } from "next"
import { Geist_Mono, DM_Sans } from "next/font/google"
import localFont from "next/font/local"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: {
    default: "Global Investing Survey — How India Thinks About Global Assets",
    template: "%s | Global Investing Survey",
  },
  description:
    "A short survey to learn how people in India save, invest, and think about owning global assets like US stocks or foreign currencies.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌍</text></svg>",
  },
}

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

const cooperLight = localFont({
  src: "../public/fonts/cooper-light.otf",
  variable: "--font-heading",
  weight: "300",
  display: "swap",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        cooperLight.variable,
        "font-sans",
        dmSans.variable
      )}
    >
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
