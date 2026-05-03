import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/sonner"
import { SiteHeader } from "@/components/site-header"
import "./globals.css"

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  title: "SovereignGraph — Privacy-First Social Data Layer",
  description:
    "A decentralized identity & social graph powered by Zero-Knowledge Proofs. Own your data, share verifiable proofs — never the data itself.",
  generator: "v0.app",
  keywords: [
    "Zero-Knowledge Proofs",
    "Self-Sovereign Identity",
    "Decentralized Identity",
    "Web3",
    "Privacy",
    "ZKP",
    "SSI",
  ],
}

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`dark bg-background ${geistSans.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased min-h-screen bg-background text-foreground">
        <SiteHeader />
        <main className="min-h-[calc(100vh-64px)]">{children}</main>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#0b1424",
              color: "#e2e8f0",
              border: "1px solid rgba(148, 163, 184, 0.14)",
            },
          }}
        />
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
