"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"

export default function Home() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 bg-gradient-to-br from-[#3d1a5c] via-[#5a2d7f] to-white flex items-center justify-center px-4">
        <div className="max-w-3xl text-center space-y-8">
          {/* Hero Section */}
          <div className="space-y-4">
            <h1 className="text-6xl sm:text-7xl font-bold text-black text-balance">Research Assistant</h1>
            <p className="text-2xl text-black font-semibold">Draft, Polish & Summarize Academic Papers</p>
          </div>

          {/* Tagline */}
          <p className="text-lg text-black/80 text-balance max-w-2xl mx-auto">
            Streamline your academic writing process with AI-powered tools for drafting, rewriting, proofreading, and
            summarizing research papers directly in your browser.
          </p>

          {/* Features Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8">
            <div className="p-6 rounded-lg bg-white/90 backdrop-blur-sm border border-white/20">
              <div className="text-3xl mb-3">✍️</div>
              <h3 className="font-semibold text-black mb-2">Writer</h3>
              <p className="text-sm text-black/70">Generate initial drafts or expand on research notes</p>
            </div>
            <div className="p-6 rounded-lg bg-white/90 backdrop-blur-sm border border-white/20">
              <div className="text-3xl mb-3">🔄</div>
              <h3 className="font-semibold text-black mb-2">Proofreader</h3>
              <p className="text-sm text-black/70">Detect and correct grammar, spelling, and style issues</p>
            </div>
            <div className="p-6 rounded-lg bg-white/90 backdrop-blur-sm border border-white/20">
              <div className="text-3xl mb-3">📋</div>
              <h3 className="font-semibold text-black mb-2">Summarizer</h3>
              <p className="text-sm text-black/70">Condense lengthy papers into concise summaries</p>
            </div>
          </div>

          {/* CTA Button */}
          <div className="pt-8">
            {user ? (
              <Link href="/dashboard">
                <Button size="lg" className="text-base px-8 bg-black text-white hover:bg-black/90">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/signin">
                <Button size="lg" className="text-base px-8 bg-black text-white hover:bg-black/90">
                  Sign In to Get Started
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
