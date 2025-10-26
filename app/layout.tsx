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
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='75' fontSize='75' fill='%234f46e5'>✎</text></svg>",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <head>
      <meta name="origin-trial" content="A3eTmc9dyfMp/DLSjnbCuEj/ZsMNhMRsGXzzEz0B9ZMmoxPYmKnbyavTRpKQNPcOMKGBO3+1dAK3qNKt6Swn/wMAAABneyJvcmlnaW4iOiJodHRwOi8vbG9jYWxob3N0OjMwMDAiLCJmZWF0dXJlIjoiQUlQcm9vZnJlYWRlckFQSSIsImV4cGlyeSI6MTc3OTE0ODgwMCwiaXNUaGlyZFBhcnR5Ijp0cnVlfQ==" />
      </head>
      <body className={`${inter.className} font-sans antialiased bg-background text-foreground`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
