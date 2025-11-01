"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, Copy, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";

import {
  getWriter,
  writerWriteStreaming,
  isWriterSupported,
  destroyWriter,
} from "@/lib/writer";

// ========================================
// Prompt Template
// ========================================
const PromptTemplates = {
  articleDraft: (topic: string, keywords: string, notes: string, tone: string, length: string): string => `
You are a professional news writer drafting an article for a major international publication.
Use Associated Press (AP) style, maintain ${tone} tone, and structure in inverted pyramid.

Topic: ${topic.trim()}
Keywords: ${keywords.trim()}
Length: ${length === "short" ? "300–500 words" : length === "medium" ? "600–1000 words" : "1200–2000 words"}
${notes.trim() ? `Outline/Notes: ${notes.trim()}` : ""}

Guidelines:
- Use [SOURCE], [DATE], [LOCATION] for unverifiable facts.
- Add quotes: "QUOTE" — [NAME], [TITLE].
- Include bullet timeline of key events.
- End with SEO summary + 3–5 tags.
- Output clean markdown.
`.trim(),
};

// ========================================
// WriterTab Component
// ========================================
export default function WriterTab() {
  const [isWriterAvailable, setIsWriterAvailable] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [topic, setTopic] = useState("");
  const [keywords, setKeywords] = useState("");
  const [notes, setNotes] = useState("");
  const [tone, setTone] = useState("neutral");
  const [length, setLength] = useState("medium");
  const [output, setOutput] = useState("");

  // Initialize Chrome AI Writer
  const initializeWriter = useCallback(async () => {
    setIsInitializing(true);
    setError("");
    setDownloadProgress(0);
    try {
      if (!isWriterSupported()) {
        setError("Chrome AI Writer not supported. Use Chrome 137+ with origin trial.");
        setIsWriterAvailable(false);
        return;
      }

      await getWriter({
        tone: "neutral",
        format: "markdown",
        length: "long",
        expectedInputLanguages: ["en"],
        expectedContextLanguages: ["en"],
        outputLanguage: "en",
        sharedContext: "AP-style news article, inverted pyramid, SEO, placeholders.",
        onDownloadProgress: (p) => setDownloadProgress(p),
      });

      setIsWriterAvailable(true);
    } catch (err: any) {
      setError(err.message || "Failed to initialize Writer API");
      setIsWriterAvailable(false);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    initializeWriter();
    return () => {
      try { destroyWriter(); } catch {}
    };
  }, [initializeWriter]);

  const handleGenerate = async () => {
    setError("");
    setOutput("");

    if (!topic.trim()) return setError("Please enter a topic.");
    if (!keywords.trim()) return setError("Please enter keywords.");

    const prompt = PromptTemplates.articleDraft(topic, keywords, notes, tone, length);
    setIsGenerating(true);

    try {
      let acc = "";
      const stream = await writerWriteStreaming(prompt, { context: "Smart Article Writer" });
      for await (const chunk of stream) {
        acc += chunk;
        setOutput(acc.replace(/\n\s*\n\s*\n/g, "\n\n").trim());
      }
      if (!acc.trim()) setError("No content generated. Try different input.");
    } catch (err: any) {
      setError(err.message || "Generation failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
    } catch {}
  };

  const wordCount = output ? output.trim().split(/\s+/).length : 0;

  // ========================================
  // UI: Initializing / Error
  // ========================================
  if (isInitializing) {
    return (
      <div className="glass-lg p-8 rounded-3xl flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-400" />
        <p className="text-sm font-medium">Initializing Chrome AI Writer...</p>
        {downloadProgress > 0 && (
          <div className="w-full max-w-xs">
            <div className="bg-white/10 rounded-full h-2 overflow-hidden">
              <div
                className="bg-indigo-500 h-2 transition-all duration-300"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
            <p className="text-xs text-center mt-2">{downloadProgress}%</p>
          </div>
        )}
      </div>
    );
  }

  if (!isWriterAvailable) {
    return (
      <div className="glass-lg p-6 rounded-3xl space-y-4">
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
        <Button onClick={initializeWriter} variant="outline" className="w-full">
          Retry Initialization
        </Button>
      </div>
    );
  }

  // ========================================
  // Main Layout: Input Panel + Output
  // ========================================
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* ========== INPUT PANEL (Right-side) ========== */}
      <div className="lg:col-span-1 glass-lg p-6 rounded-3xl space-y-5">
        <h3 className="font-semibold text-indigo-400 flex items-center gap-2">
          Writer Settings
        </h3>

        <div>
          <label className="block text-sm font-medium mb-1.5">Topic</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. EU AI Act enforcement"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={isGenerating}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Keywords (comma-separated)</label>
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="fines, compliance, regulation"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={isGenerating}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">Tone</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={isGenerating}
            >
              <option value="neutral">Neutral</option>
              <option value="formal">Formal</option>
              <option value="conversational">Conversational</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Length</label>
            <select
              value={length}
              onChange={(e) => setLength(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={isGenerating}
            >
              <option value="short">Short (~300w)</option>
              <option value="medium">Medium (~800w)</option>
              <option value="long">Long (~1500w)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="50–100 word outline..."
            rows={4}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={isGenerating}
          />
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !topic.trim() || !keywords.trim()}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            "Generate Article"
          )}
        </Button>

        {output && (
          <Button onClick={handleCopy} variant="outline" className="w-full">
            <Copy className="h-4 w-4 mr-2" />
            Copy Output
          </Button>
        )}
      </div>

      {/* ========== OUTPUT PANEL ========== */}
      <div className="lg:col-span-2 glass-lg p-6 rounded-3xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {isGenerating ? (
              <Loader2 className="h-5 w-5 text-indigo-400 animate-spin" />
            ) : output ? (
              <CheckCircle className="h-5 w-5 text-green-400" />
            ) : null}
            <h3 className="font-semibold text-indigo-400">Generated Article</h3>
          </div>
          {output && (
            <span className="text-xs text-muted-foreground">{wordCount} words</span>
          )}
        </div>

        <div className="prose prose-invert max-w-none text-sm leading-relaxed min-h-[500px] bg-white/5 rounded-lg p-4 border border-white/10">
          {output ? (
            <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{output}</ReactMarkdown>
          ) : (
            <p className="text-muted-foreground italic">
              Your AI-generated article will appear here...
            </p>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-400 mt-0.5" />
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}
      </div>
    </div>
)}