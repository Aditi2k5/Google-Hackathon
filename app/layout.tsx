// app/layout.tsx (Next.js App Router)
import type React from "react"
import type { Metadata } from "next"
import { Inter, Courier_Prime } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })
const courierPrime = Courier_Prime({ weight: ["400", "700"], subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Newsroom Forge - AI-Powered News Drafting",
  description: "AI-Powered Wire Stories for Deadline Warriors",
  generator: "v0.app",
  icons: {
    icon:
      "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='75' fontSize='75' fill='%234f46e5'>✎</text></svg>",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Read both tokens from env (public)
  const writerToken = process.env.NEXT_PUBLIC_WRITER_API_KEY
  const proofreaderToken = process.env.NEXT_PUBLIC_PROOFREADER_API_KEY

  return (
    <html lang="en" className="dark">
      <head>
        {/* IMPORTANT: use httpEquiv + content */}
        {writerToken ? (
          <meta httpEquiv="origin-trial" content={writerToken} />
        ) : null}
        {proofreaderToken ? (
          <meta httpEquiv="origin-trial" content={proofreaderToken} />
        ) : null}
        {process.env.NEXT_PUBLIC_REWRITER_API_KEY && (
  <meta httpEquiv="origin-trial" content={process.env.NEXT_PUBLIC_REWRITER_API_KEY} />
)}
      </head>
      <body className={`${inter.className} font-sans antialiased bg-background text-foreground`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
