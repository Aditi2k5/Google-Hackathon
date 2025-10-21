"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, AlertCircle } from "lucide-react"

// ========================================
// Type Definitions
// ========================================
type Mode = "outline" | "section" | "expand" | "polish"

interface WriterInstance {
  writeStreaming: (prompt: string, options?: { context?: string }) => AsyncIterable<string>
  destroy: () => void
}

interface DownloadProgressEvent {
  loaded: number
  total: number
}

interface WriterMonitor {
  addEventListener: (event: string, handler: (e: DownloadProgressEvent) => void) => void
}

interface WriterCreateOptions {
  tone: string
  format: string
  length: string
  sharedContext: string
  monitor?: (m: WriterMonitor) => void
}

interface WindowWithWriter extends Window {
  Writer?: {
    availability: () => Promise<string>
    create: (options: WriterCreateOptions) => Promise<WriterInstance>
  }
}

// ========================================
// Prompt Generation Utilities
// ========================================
const PromptTemplates = {
  createOutline: (notes: string): string => `
You are an expert academic writer. Create a detailed and logical outline based on the following research notes:

Research Notes:
${notes.trim()}

Structure the outline with clear headings and subheadings that cover all key points.`,
  createSection: (heading: string, notes: string): string => `
You are an expert academic writer. Write a clear and coherent academic section for the following outline heading based on the notes provided.

Heading:
${heading.trim()}

Notes:
${notes.trim()}

Ensure the section is well structured and uses formal academic language.`,
  expandParagraph: (sectionText: string): string => `
You are an expert academic writer. Expand the following academic section by adding details, explanations, and relevant examples without changing its meaning:

Section Text:
${sectionText.trim()}

Make the writing fluent, professional, and suitable for scholarly publication.`,
  polishDraft: (draftText: string): string => `
You are an expert academic writer. Please polish and improve the following draft for clarity, grammar, sophistication, and flow while maintaining the original meaning:

Draft:
${draftText.trim()}`,
}

// ========================================
// Constants
// ========================================
const MODE_LABELS = {
  outline: "Generate Outline from Notes",
  section: "Generate Section from Heading & Notes",
  expand: "Expand Text",
  polish: "Polish Draft",
} as const

const INPUT_PLACEHOLDERS = {
  outline: "Enter your research notes...",
  expand: "Enter text to expand...",
  polish: "Enter draft text to polish...",
  sectionHeading: "e.g., Introduction, Literature Review, Methodology",
  sectionNotes: "Enter notes for this section...",
} as const

// ========================================
// Main Component
// ========================================
export function WriterTab() {
  // Writer state
  const [writer, setWriter] = useState<WriterInstance | null>(null)
  const [isWriterAvailable, setIsWriterAvailable] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [downloadProgress, setDownloadProgress] = useState(0)

  // UI state
  const [mode, setMode] = useState<Mode>("outline")
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState("")

  // Input state
  const [notesInput, setNotesInput] = useState("")
  const [sectionHeading, setSectionHeading] = useState("")
  const [sectionNotes, setSectionNotes] = useState("")
  const [output, setOutput] = useState("")

  // Writer Initialization
  const initializeWriter = useCallback(async () => {
    setIsInitializing(true)
    setError("")
    setDownloadProgress(0)

    const windowWithWriter = window as WindowWithWriter
    if (!windowWithWriter.Writer) {
      setError("Chrome AI Writer not available. Use Chrome 137+ with flags enabled.")
      setIsWriterAvailable(false)
      setIsInitializing(false)
      return
    }

    try {
      const availability = await windowWithWriter.Writer.availability()
      if (availability === "unavailable") {
        setError("Writer API unavailable. Check chrome://on-device-internals.")
        setIsWriterAvailable(false)
        setIsInitializing(false)
        return
      }

      const writerInstance = await windowWithWriter.Writer.create({
        tone: "formal",
        format: "markdown",
        length: "long",
        sharedContext: "Academic research paper writing and scholarly communication",
        monitor(m: WriterMonitor) {
          m.addEventListener("downloadprogress", (e: DownloadProgressEvent) => {
            const pct = Math.round((e.loaded / e.total) * 100)
            setDownloadProgress(pct)
          })
        },
      })

      setWriter(writerInstance)
      setIsWriterAvailable(true)
      setError("")
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
      if (writer) {
        try { writer.destroy() } catch { /* ignore */ }
      }
    }
  }, [initializeWriter])

  // Prompt builder & validation
  const buildPrompt = useCallback(() => {
    switch (mode) {
      case "outline":
        return notesInput.trim() ? PromptTemplates.createOutline(notesInput) : null
      case "section":
        return sectionHeading.trim() && sectionNotes.trim()
          ? PromptTemplates.createSection(sectionHeading, sectionNotes)
          : null
      case "expand":
        return notesInput.trim() ? PromptTemplates.expandParagraph(notesInput) : null
      case "polish":
        return notesInput.trim() ? PromptTemplates.polishDraft(notesInput) : null
      default:
        return null
    }
  }, [mode, notesInput, sectionHeading, sectionNotes])

  const validateInput = useCallback(() => {
    if (mode === "section") {
      if (!sectionHeading.trim()) return "Please enter a section heading"
      if (!sectionNotes.trim()) return "Please enter section notes"
    } else {
      if (!notesInput.trim()) {
        const field = mode === "outline" ? "research notes" : mode === "expand" ? "text to expand" : "draft"
        return `Please enter ${field}`
      }
    }
    return null
  }, [mode, notesInput, sectionHeading, sectionNotes])

  // Generate content
  const handleGenerate = async () => {
    setError("")
    setOutput("")

    if (!writer) {
      setError("Writer not initialized. Refresh the page.")
      return
    }
    const validationError = validateInput()
    if (validationError) {
      setError(validationError)
      return
    }
    const prompt = buildPrompt()
    if (!prompt) {
      setError("Failed to build prompt")
      return
    }

    setIsGenerating(true)
    try {
      let acc = ""
      const stream = writer.writeStreaming(prompt, { context: `Mode: ${mode}` })
      for await (const chunk of stream) {
        acc += chunk
        setOutput(acc.replace(/\n\s*\n\s*\n/g, "\n\n").trim())
      }
      if (!acc.trim()) setError("No content generated. Try different input.")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to generate content."
      setError(msg)
      console.error("Generation error:", err)
    } finally {
      setIsGenerating(false)
    }
  }

  // Handlers
  const handleModeChange = (newMode: string) => {
    setMode(newMode as Mode)
    setError("")
    setOutput("")
  }
  const handleCopy = async () => {
    if (!output) return
    try { await navigator.clipboard.writeText(output) } catch {}
  }
  const handleClear = () => {
    setNotesInput("")
    setSectionHeading("")
    setSectionNotes("")
    setOutput("")
    setError("")
  }

  const isDisabled =
    isGenerating ||
    (mode === "section" ? !sectionHeading.trim() || !sectionNotes.trim() : !notesInput.trim())

  // Render
  if (isInitializing) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mb-4" />
          <p className="text-lg font-medium text-gray-700">Initializing Chrome AI Writer...</p>
          {downloadProgress > 0 && downloadProgress < 100 && (
            <div className="mt-6 w-full max-w-md space-y-2">
              <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-purple-600 h-3 transition-all duration-300 ease-out"
                  style={{ width: `${downloadProgress}%` }}
                  role="progressbar"
                  aria-valuenow={downloadProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
              <p className="text-sm text-gray-600 text-center">
                Downloading model: {downloadProgress}%
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!isWriterAvailable) {
    return (
      <div className="space-y-6">
        <div className="p-4 bg-red-100 border border-red-300 rounded-md text-red-700 flex items-start gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
        <Button onClick={initializeWriter} variant="outline">
          Retry Initialization
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Mode Selector */}
      <div>
        <label htmlFor="mode-select" className="block text-sm font-medium mb-2">
          Select Mode
        </label>
        <select
          id="mode-select"
          className="w-full border rounded p-2.5 focus:ring-2 focus:ring-purple-500"
          value={mode}
          onChange={(e) => handleModeChange(e.target.value)}
          disabled={isGenerating}
        >
          {(Object.keys(MODE_LABELS) as Mode[]).map((key) => (
            <option key={key} value={key}>
              {MODE_LABELS[key]}
            </option>
          ))}
        </select>
      </div>

      {/* Inputs */}
      {mode === "section" ? (
        <>
          <div>
            <label htmlFor="section-heading" className="block text-sm font-medium mb-2">
              Section Heading
            </label>
            <input
              id="section-heading"
              type="text"
              className="w-full border rounded p-2.5 focus:ring-2 focus:ring-purple-500"
              placeholder={INPUT_PLACEHOLDERS.sectionHeading}
              value={sectionHeading}
              onChange={(e) => setSectionHeading(e.target.value)}
              disabled={isGenerating}
            />
          </div>
          <div>
            <label htmlFor="section-notes" className="block text-sm font-medium mb-2">
              Section Notes
            </label>
            <Textarea
              id="section-notes"
              rows={6}
              placeholder={INPUT_PLACEHOLDERS.sectionNotes}
              value={sectionNotes}
              onChange={(e) => setSectionNotes(e.target.value)}
              disabled={isGenerating}
              className="w-full resize-y focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </>
      ) : (
        <div>
          <label htmlFor="main-input" className="block text-sm font-medium mb-2">
            {mode === "outline" && "Research Notes"}
            {mode === "expand" && "Text to Expand"}
            {mode === "polish" && "Draft to Polish"}
          </label>
          <Textarea
            id="main-input"
            rows={8}
            placeholder={INPUT_PLACEHOLDERS[mode]}
            value={notesInput}
            onChange={(e) => setNotesInput(e.target.value)}
            disabled={isGenerating}
            className="w-full resize-y focus:ring-2 focus:ring-purple-500"
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 flex-wrap">
        <Button
          onClick={handleGenerate}
          disabled={isDisabled}
          className="bg-purple-600 text-white px-6 py-2 disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Generating...
            </>
          ) : (
            "Generate"
          )}
        </Button>

        {output && (
          <Button onClick={handleCopy} variant="outline" className="border-purple-600 text-purple-600">
            Copy Output
          </Button>
        )}

        <Button onClick={handleClear} variant="outline" disabled={isGenerating}>
          Clear All
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-100 border border-red-300 rounded-md text-red-700 flex items-start gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Output */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label htmlFor="output" className="block text-sm font-medium">
            Output
          </label>
          {output && <span className="text-xs text-gray-500">{output.split(/\s+/).length} words</span>}
        </div>
        <div
          id="output"
          role="region"
          aria-live="polite"
          className="whitespace-pre-wrap p-4 border rounded min-h-[150px] bg-purple-50 overflow-auto max-h-[500px]"
        >
          {output || <span className="text-gray-400 italic">Your generated content will appear here...</span>}
        </div>
      </div>
    </div>
  )
}
