"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { WriterTab } from "@/components/tabs/writer-tab"
import { ProofreaderTab } from "@/components/tabs/proofreader-tab"
import { SummarizerTab } from "@/components/tabs/summarizer-tab"

export default function Dashboard() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [activeTab, setActiveTab] = useState<"writer" | "proofreader" | "summarizer">("writer")

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-black/60">Loading...</p>
      </div>
    )
  }

  if (!user) {
    router.push("/signin")
    return null
  }

  const tabs = [
    { id: "writer", label: "Writer", icon: "✍️" },
    { id: "proofreader", label: "Proofreader", icon: "🔄" },
    { id: "summarizer", label: "Summarizer", icon: "📋" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">Welcome, {user.name}</h1>
          <p className="text-black/60">Choose a tool to get started with your research</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 border-b border-black/10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 border-b-2 ${
                activeTab === tab.id
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-black/60 hover:text-black"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg border border-black/10 p-8">
          {activeTab === "writer" && <WriterTab />}
          {activeTab === "proofreader" && <ProofreaderTab />}
          {activeTab === "summarizer" && <SummarizerTab />}
        </div>
      </div>
    </div>
  )
}
