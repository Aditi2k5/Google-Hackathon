"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, AlertCircle } from "lucide-react"

import {
  getWriter,
  writerWriteStreaming,
  isWriterSupported,
  destroyWriter,
} from "@/lib/writer"

// ========================================
// Smart Article Prompt Template
// ========================================
const PromptTemplates = {
  articleDraft: (topic: string, keywords: string, notes: string): string => `
You are a professional news writer drafting an article for a major international publication.
Use Associated Press (AP) style, maintain an objective tone, and structure the piece in the inverted pyramid:
- Lede (what happened)
- Nut graf (why it matters)
- Body (context, quotes, background)
- Sidebar or analysis (implications, what’s next)

Write a factual placeholder-based draft (300–2000 words).

Topic: ${topic.trim()}
Keywords: ${keywords.trim()}
Outline/Notes (optional): ${notes.trim()}

Guidelines:
- Replace unverifiable facts with [SOURCE], [DATE], [LOCATION].
- Add quote placeholders like: "QUOTE" — [OFFICIAL NAME], [POSITION].
- Include a bullet timeline of key events.
- End with a one-line SEO summary and 3–5 SEO tags.
- Output in clean markdown.
`,
}

// ========================================
// Component
// ========================================
function WriterTab() {
  const [isWriterAvailable, setIsWriterAvailable] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [downloadProgress, setDownloadProgress] = useState(0)

  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState("")
  const [topic, setTopic] = useState("")
  const [keywords, setKeywords] = useState("")
  const [notes, setNotes] = useState("")
  const [output, setOutput] = useState("")

  // Initialize Chrome Writer API
  const initializeWriter = useCallback(async () => {
    setIsInitializing(true)
    setError("")
    setDownloadProgress(0)
    try {
      if (!isWriterSupported()) {
        setError("Writer API not available. Use Chrome 137+ with origin trial enabled.")
        setIsWriterAvailable(false)
        setIsInitializing(false)
        return
      }

      await getWriter({
        tone: "neutral",
        format: "markdown",
        length: "long",
        expectedInputLanguages: ["en"],
        expectedContextLanguages: ["en"],
        outputLanguage: "en",
        sharedContext:
          "News article generation for digital publications, AP style, factual placeholders, SEO optimization, and inverted pyramid writing.",
        onDownloadProgress: (p) => setDownloadProgress(p),
      })

      setIsWriterAvailable(true)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to initialize Writer API"
      setError(msg)
      setIsWriterAvailable(false)
      console.error("Writer init error:", err)
    } finally {
      setIsInitializing(false)
    }
  }, [])

  useEffect(() => {
    initializeWriter()
    return () => {
      try { destroyWriter() } catch {}
    }
  }, [initializeWriter])

  // Validate input
  const validateInput = useCallback(() => {
    if (!topic.trim()) return "Please enter a topic (e.g., 'EU AI Act enforcement')."
    if (!keywords.trim()) return "Please enter a few keywords."
    return null
  }, [topic, keywords])

  // Generate article
  const handleGenerate = async () => {
    setError("")
    setOutput("")

    const validationError = validateInput()
    if (validationError) {
      setError(validationError)
      return
    }

    const prompt = PromptTemplates.articleDraft(topic, keywords, notes)
    setIsGenerating(true)

    try {
      let acc = ""
      const stream = await writerWriteStreaming(prompt, { context: "Smart Article Writer" })
      for await (const chunk of stream) {
        acc += chunk
        // collapse accidental triple blank lines as we stream
        setOutput(acc.replace(/\n\s*\n\s*\n/g, "\n\n").trim())
      }
      if (!acc.trim()) setError("No content generated. Try different input.")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Generation failed."
      setError(msg)
      console.error("Generation error:", err)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleClear = () => {
    setTopic("")
    setKeywords("")
    setNotes("")
    setOutput("")
    setError("")
  }

  const handleCopy = async () => {
    if (!output) return
    try { await navigator.clipboard.writeText(output) } catch {}
  }

  // ========================================
  // UI Rendering
  // ========================================

  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
        <p className="text-gray-300 font-medium">Initializing Chrome AI Writer...</p>
        {downloadProgress > 0 && (
          <div className="w-full max-w-md">
            <div className="bg-gray-700/50 rounded-full h-3 overflow-hidden">
              <div
                className="bg-purple-600 h-3 transition-all duration-300 ease-out"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-400 text-center mt-2">
              Downloading model: {downloadProgress}%
            </p>
          </div>
        )}
      </div>
    )
  }

  if (!isWriterAvailable) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-red-500/10 border border-red-400/40 rounded-md text-red-200 flex gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
        <Button onClick={initializeWriter} variant="outline">Retry Initialization</Button>
      </div>
    )
  }

  const wordCount = output ? output.trim().split(/\s+/).length : 0

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h2 className="text-xl font-semibold text-purple-400">📰 Smart Article Writer</h2>

      <div className="space-y-4">
        <div>
          <label htmlFor="topic" className="block text-sm font-medium mb-1">Topic</label>
          <input
            id="topic"
            type="text"
            placeholder="e.g., EU AI Act enforcement"
            className="w-full border rounded p-2.5 bg-transparent focus:ring-2 focus:ring-purple-500"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={isGenerating}
          />
        </div>

        <div>
          <label htmlFor="keywords" className="block text-sm font-medium mb-1">Keywords</label>
          <input
            id="keywords"
            type="text"
            placeholder="e.g., fines, compliance, AI regulation"
            className="w-full border rounded p-2.5 bg-transparent focus:ring-2 focus:ring-purple-500"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            disabled={isGenerating}
          />
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium mb-1">Brief Outline / Notes (optional)</label>
          <Textarea
            id="notes"
            rows={8}
            placeholder="Enter a short 50–100 word outline or context..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isGenerating}
            className="w-full resize-none focus:ring-2 focus:ring-purple-500 text-base leading-relaxed bg-transparent"
          />
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !topic.trim() || !keywords.trim()}
          className="bg-purple-600 text-white px-6 py-2 disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Writing draft...
            </>
          ) : (
            "Generate Article"
          )}
        </Button>

        {output && (
          <Button onClick={handleCopy} variant="outline" className="border-purple-600 text-purple-300">
            Copy Output
          </Button>
        )}

        <Button onClick={handleClear} variant="outline" disabled={isGenerating}>Clear</Button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-400/40 rounded-md text-red-200 flex items-start gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div>
        <div className="flex justify-between items-center mb-2">
          <label htmlFor="output" className="block text-sm font-medium">Output</label>
          {output && <span className="text-xs text-gray-400">{wordCount} words</span>}
        </div>
        <div
          id="output"
          role="region"
          aria-live="polite"
          className="whitespace-pre-wrap p-4 border rounded bg-purple-900/10 overflow-auto h-[70vh] prose prose-invert max-w-none"
        >
          {output || (
            <span className="text-gray-500 italic">
              Your generated article will appear here...
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default WriterTab
