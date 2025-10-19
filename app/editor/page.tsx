"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { AIToolbar } from "@/components/ai-toolbar"
import { useChromeAI } from "@/hooks/use-chrome-ai"

export default function EditorPage() {
  const { hasBuiltInAI, isLoading } = useChromeAI()
  const [text, setText] = useState("")
  const [selectedText, setSelectedText] = useState("")
  const [result, setResult] = useState<{ text: string; type: string } | null>(null)

  const handleTextSelect = () => {
    const selection = window.getSelection()
    if (selection) {
      setSelectedText(selection.toString())
    }
  }

  const handleResult = (resultText: string, type: string) => {
    setResult({ text: resultText, type })
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">AI Editor</h1>
          <p className="text-muted-foreground">Select text and use the AI tools to summarize, rewrite, or proofread</p>
        </div>

        {!hasBuiltInAI && (
          <Card className="p-4 bg-yellow-50 border-yellow-200 text-yellow-900">
            <p className="text-sm font-medium">
              Your browser doesn't support on-device Gemini Nano yet. Please enable the Chrome AI features or use a
              compatible browser.
            </p>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Editor */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-6">
              <label className="block text-sm font-medium text-foreground mb-3">Your Text</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onMouseUp={handleTextSelect}
                onKeyUp={handleTextSelect}
                placeholder="Paste or type your text here. Select text to use AI tools..."
                className="w-full h-96 p-4 border border-input rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </Card>

            {/* Toolbar */}
            <Card className="p-4">
              <AIToolbar selectedText={selectedText} onResult={handleResult} isDisabled={!hasBuiltInAI} />
            </Card>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                {result ? `${result.type} Result` : "Results"}
              </h2>
              {result ? (
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-foreground whitespace-pre-wrap">{result.text}</p>
                  </div>
                  <button
                    onClick={() => {
                      setText(result.text)
                      setResult(null)
                    }}
                    className="w-full px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Use This Text
                  </button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Select text and click an AI tool to see results here</p>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
