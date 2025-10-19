"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { summarizeText } from "@/lib/chrome-ai"
import { useChromeAI } from "@/hooks/use-chrome-ai"

export default function SummarizePage() {
  const { hasBuiltInAI, isLoading } = useChromeAI()
  const [input, setInput] = useState("")
  const [result, setResult] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSummarize = async () => {
    if (!input.trim()) return
    setIsProcessing(true)
    try {
      const summary = await summarizeText(input)
      setResult(summary)
    } catch (error) {
      console.error("Summarization error:", error)
      setResult("Error: Could not summarize text. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Summarizer</h1>
          <p className="text-muted-foreground">
            Paste any article or paragraph to get an instant summary powered by Gemini Nano
          </p>
        </div>

        {!hasBuiltInAI && (
          <Card className="p-4 bg-yellow-50 border-yellow-200 text-yellow-900">
            <p className="text-sm font-medium">
              Your browser doesn't support on-device Gemini Nano yet. Please enable the Chrome AI features or use a
              compatible browser.
            </p>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input */}
          <Card className="p-6">
            <label className="block text-sm font-medium text-foreground mb-3">Text to Summarize</label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste your article, paragraph, or any text here..."
              className="w-full h-64 p-4 border border-input rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
            <Button
              onClick={handleSummarize}
              disabled={!hasBuiltInAI || !input.trim() || isProcessing}
              className="w-full mt-4"
            >
              {isProcessing ? "Summarizing..." : "Summarize with Gemini Nano"}
            </Button>
          </Card>

          {/* Output */}
          <Card className="p-6">
            <label className="block text-sm font-medium text-foreground mb-3">Summary</label>
            {result ? (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg min-h-64">
                  <p className="text-sm text-foreground whitespace-pre-wrap">{result}</p>
                </div>
                <Button
                  onClick={() => {
                    setInput(result)
                    setResult(null)
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Use as Input
                </Button>
              </div>
            ) : (
              <div className="p-4 bg-muted rounded-lg min-h-64 flex items-center justify-center">
                <p className="text-sm text-muted-foreground text-center">Your summary will appear here</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
