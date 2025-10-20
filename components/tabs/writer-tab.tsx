// components/tabs/writer-tab.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"

export function WriterTab() {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [error, setError] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Chrome AI Writer states
  const [isWriterAvailable, setIsWriterAvailable] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [writer, setWriter] = useState<any>(null)
  const [downloadProgress, setDownloadProgress] = useState(0)

  useEffect(() => {
    initializeWriter()
    return () => {
      if (writer) {
        writer.destroy()
      }
    }
  }, [])

  const initializeWriter = async () => {
    setIsInitializing(true)
    setError("")

    // Feature detection for the global Writer API
    if (!("Writer" in window)) {
      setError(
        "Chrome AI Writer is not available. Please use Chrome 137+ and enable the Writer API flag at chrome://flags/#writer-api-for-gemini-nano"
      )
      setIsWriterAvailable(false)
      setIsInitializing(false)
      return
    }

    try {
      // @ts-ignore
      const availability = await Writer.availability()

      if (availability === "unavailable") {
        setError("Writer API is not available. Check chrome://on-device-internals for model status.")
        setIsWriterAvailable(false)
        setIsInitializing(false)
        return
      }

      // @ts-ignore
      const writerInstance = await Writer.create({
        tone: "formal",
        format: "markdown",
        length: "long",
        sharedContext: "Academic research paper writing and scholarly communication",
        monitor(m: any) {
          m.addEventListener("downloadprogress", (e: any) => {
            const progress = Math.round((e.loaded / e.total) * 100)
            setDownloadProgress(progress)
          })
        },
      })

      setWriter(writerInstance)
      setIsWriterAvailable(true)
      setError("")
    } catch (err) {
      console.error("Error initializing Writer API:", err)
      setError(err instanceof Error ? err.message : "Failed to initialize Chrome AI Writer")
      setIsWriterAvailable(false)
    } finally {
      setIsInitializing(false)
    }
  }

  const handleGenerate = async () => {
    if (!input.trim() || !writer) return

    setIsGenerating(true)
    setError("")
    setOutput("")

    const prompt = [
      "Transform the following research notes into a well-structured academic draft with proper introduction, body paragraphs, and conclusion:",
      "",
      input,
    ].join("\n")

    try {
      // Use streaming for real-time output
      // @ts-ignore
      const stream = writer.writeStreaming(prompt, {
        context: "Writing an academic research paper section",
      })

      for await (const chunk of stream) {
        setOutput((prev) => prev + chunk)
      }
    } catch (err) {
      console.error("Error generating draft:", err)
      setError("Failed to generate draft. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  // Loading state during initialization
  if (isInitializing) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mb-4" />
          <p className="text-lg text-gray-600">Initializing Chrome AI Writer...</p>
          {downloadProgress > 0 && downloadProgress < 100 && (
            <div className="mt-6 w-full max-w-md">
              <div className="bg-gray-200 rounded-full h-3">
                <div
                  className="bg-purple-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2 text-center">
                Downloading model: {downloadProgress}%
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Error / unavailable state
  if (!isWriterAvailable) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-semibold text-red-800 mb-2">Chrome AI Writer Not Available</h3>
          <p className="text-red-700 text-sm mb-3">{error}</p>
          <div className="text-sm text-red-600 space-y-2">
            <p className="font-medium">Requirements:</p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>Chrome 137+ (Canary/Dev channel)</li>
              <li>Enable flag: <code className="bg-red-100 px-1 rounded">chrome://flags/#writer-api-for-gemini-nano</code></li>
              <li>Enable flag: <code className="bg-red-100 px-1 rounded">chrome://flags/#optimization-guide-on-device-model</code></li>
              <li>22GB+ free storage for Gemini Nano model</li>
              <li>Check status: <code className="bg-red-100 px-1 rounded">chrome://on-device-internals</code></li>
            </ul>
          </div>
        </div>

        {/* Disabled fallback UI */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 opacity-50">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-black">Your Research Notes</label>
            <Textarea disabled placeholder="Unavailable" className="min-h-64" />
            <Button disabled className="w-full bg-purple-600 text-white">
              Generate Draft
            </Button>
          </div>
          <div className="space-y-3">
            <label className="block text-sm font-medium text-black">Generated Draft</label>
            <div className="min-h-64 p-4 bg-purple-50 border border-purple-200 rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  // Main UI when Writer is available
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span>Chrome AI Writer is ready (running locally on your device)</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-black">Your Research Notes</label>
          <Textarea
            placeholder="Enter your research notes or outline here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-64 bg-white border-black/20"
            disabled={isGenerating}
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !input.trim()}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isGenerating ? "Generating..." : "Generate Draft"}
          </Button>
        </div>

        {/* Output */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-black">Generated Draft</label>
          <div className="min-h-64 p-4 bg-purple-50 border border-purple-200 rounded-lg whitespace-pre-wrap overflow-auto max-h-96">
            {output || "Your generated draft will appear here..."}
          </div>
          {output && (
            <Button
              variant="outline"
              className="w-full border-black/20 text-black hover:bg-black/5 bg-transparent"
              onClick={() => navigator.clipboard.writeText(output)}
            >
              Copy to Clipboard
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
