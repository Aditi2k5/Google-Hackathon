"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { summarizeText, rewriteText, proofreadText } from "@/lib/chrome-ai"

interface AIToolbarProps {
  selectedText: string
  onResult: (result: string, type: string) => void
  isDisabled: boolean
}

export function AIToolbar({ selectedText, onResult, isDisabled }: AIToolbarProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSummarize = async () => {
    if (!selectedText.trim()) return
    setIsProcessing(true)
    try {
      const result = await summarizeText(selectedText)
      onResult(result, "Summarize")
    } catch (error) {
      console.error("Summarization error:", error)
      onResult("Error: Could not summarize text", "Summarize")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRewrite = async () => {
    if (!selectedText.trim()) return
    setIsProcessing(true)
    try {
      const result = await rewriteText(selectedText, "academic")
      onResult(result, "Rewrite")
    } catch (error) {
      console.error("Rewrite error:", error)
      onResult("Error: Could not rewrite text", "Rewrite")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleProofread = async () => {
    if (!selectedText.trim()) return
    setIsProcessing(true)
    try {
      const result = await proofreadText(selectedText)
      onResult(result, "Proofread")
    } catch (error) {
      console.error("Proofreading error:", error)
      onResult("Error: Could not proofread text", "Proofread")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex gap-2 flex-wrap">
      <Button
        onClick={handleSummarize}
        disabled={isDisabled || !selectedText.trim() || isProcessing}
        variant="outline"
        size="sm"
      >
        {isProcessing ? "Processing..." : "🧠 Summarize"}
      </Button>
      <Button
        onClick={handleRewrite}
        disabled={isDisabled || !selectedText.trim() || isProcessing}
        variant="outline"
        size="sm"
      >
        {isProcessing ? "Processing..." : "✍️ Rewrite"}
      </Button>
      <Button
        onClick={handleProofread}
        disabled={isDisabled || !selectedText.trim() || isProcessing}
        variant="outline"
        size="sm"
      >
        {isProcessing ? "Processing..." : "✅ Proofread"}
      </Button>
    </div>
  )
}
