"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { callWriterAPI } from "@/lib/api-client"

export function WriterTab() {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleGenerate = async () => {
    if (!input.trim()) return

    setIsLoading(true)
    setError("")
    try {
      const response = await callWriterAPI({ notes: input })
      setOutput(response.draft)
    } catch (err) {
      setError("Failed to generate draft. Please try again.")
      console.error("[v0] Writer API error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-black">Your Research Notes</label>
          <Textarea
            placeholder="Enter your research notes or outline here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-64 bg-white border-black/20 text-black placeholder:text-black/40"
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <Button
            onClick={handleGenerate}
            disabled={isLoading || !input.trim()}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isLoading ? "Generating..." : "Generate Draft"}
          </Button>
        </div>

        {/* Output */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-black">Generated Draft</label>
          <div className="min-h-64 p-4 bg-purple-50 border border-purple-200 rounded-lg text-black whitespace-pre-wrap">
            {output || "Your generated draft will appear here..."}
          </div>
          {output && (
            <Button
              variant="outline"
              className="w-full border-black/20 text-black hover:bg-black/5 bg-transparent"
              onClick={() => {
                navigator.clipboard.writeText(output)
              }}
            >
              Copy to Clipboard
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
