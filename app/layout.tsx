// app/layout.tsx
import type React from "react"
import type { Metadata } from "next"
import { Inter, Courier_Prime } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })
const courierPrime = Courier_Prime({ weight: ["400", "700"], subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Newsroom Forge - AI-Powered News Drafting",
  description: "AI-Powered Wire Stories with Smart Translation",
  generator: "v0.app",
  icons: {
    icon:
      "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='75' fontSize='75' fill='%234f46e5'>📰</text></svg>",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // PUBLIC env vars — get these from Chrome Origin Trials
  const writerToken = process.env.NEXT_PUBLIC_WRITER_API_KEY
  const rewriterToken = process.env.NEXT_PUBLIC_REWRITER_API_KEY

  return (
    <html lang="en" className="dark">
      <head>
        {/* === Origin-Trial Tokens === */}
        {writerToken && (
          <meta httpEquiv="origin-trial" content={writerToken} />
        )}
        {rewriterToken && (
          <meta httpEquiv="origin-trial" content={rewriterToken} />
        )}

        {/* === Enable AI Flags on First Load === */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window === 'undefined') return;
                // Force-enable AI flags (only needed once per session)
                const flags = [
                  '#built-in-ai',
                  '#translation-api',
                  '#language-detection-api',
                  '#enable-experimental-webassembly-features'
                ];
                flags.forEach(flag => {
                  if (window.location.href.includes(flag)) return;
                  const url = new URL(window.location);
                  url.hash = flag;
                  if (!localStorage.getItem('ai-flags-set')) {
                    localStorage.setItem('ai-flags-set', 'true');
                    window.location.href = url.toString();
                  }
                });
              })();
            `,
          }}
        />
      </head>

      <body
        className={`${inter.className} font-sans antialiased bg-background text-foreground`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  )
}