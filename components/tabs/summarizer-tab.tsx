"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { callSummarizerAPI } from "@/lib/summarizer";
import { readFileAsText, setupDragAndDrop } from "@/lib/file-utils";
import { FileText, List } from "lucide-react";

export function SummarizerTab() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [maxLength, setMaxLength] = useState(100); // Words
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      setupDragAndDrop(textareaRef.current, async (files) => {
        try {
          const file = files[0];
          if (!file) return;
          const content = await readFileAsText(file);
          setInput(content);
          setError("");
        } catch (err: any) {
          setError(err.message);
        }
      });
    }
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const content = await readFileAsText(file);
      setInput(content);
      setError("");
    } catch (err: any) {
      setError(err.message);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSummarize = async () => {
    if (!input.trim()) return;

    setIsLoading(true);
    setError("");
    setOutput("");

    try {
      const res = await callSummarizerAPI({
        text: input,
        maxLength,
      });

      let combined = `📝 Summary:\n${res.summary}\n\n`;
      combined += `🔑 Key Points:\n${res.keyPoints.map((point: string) => `• ${point}`).join('\n')}\n`;

      setOutput(combined);
    } catch (err: any) {
      console.error("Summarizer API error:", err);
      if (err.message?.includes("not available")) {
        setError(
          "Chrome Summarizer API not supported. Use Chrome 138+ with AI features enabled."
        );
      } else {
        setError("Failed to summarize. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-black">Your Text</label>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full border-black/20 text-black hover:bg-black/5 bg-transparent"
              onClick={() => fileInputRef.current?.click()}
            >
              <List className="w-4 h-4 mr-2" />
              Upload .txt, .doc, or .docx
            </Button>
            <Input
              ref={fileInputRef}
              type="file"
              accept=".txt,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
            />
            <p className="text-xs text-black/50 text-center">Or drag & drop a file here</p>
          </div>
          <Textarea
            ref={textareaRef}
            placeholder="Paste or upload text to summarize (e.g., article or report)..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-64 bg-white border-black/20 text-black placeholder:text-black/40"
          />
          <div className="flex space-x-2">
            <Input
              type="number"
              value={maxLength}
              onChange={(e) => setMaxLength(Number(e.target.value))}
              placeholder="Max summary length (words)"
              className="w-32"
            />
            <Button
              onClick={handleSummarize}
              disabled={isLoading || !input.trim()}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isLoading ? "Summarizing..." : "Summarize"}
            </Button>
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
        </div>

        {/* Output Section */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-black flex items-center">
            <FileText className="w-4 h-4 mr-2" />
            Summary & Key Points
          </label>
          <div className="min-h-64 p-4 bg-purple-50 border border-purple-200 rounded-lg text-black whitespace-pre-wrap font-mono overflow-y-auto">
            {isLoading
              ? "Summarizing your text (model downloading if first use)..."
              : output || "Summary will appear here..."}
          </div>
          {output && (
            <Button
              variant="outline"
              className="w-full border-black/20 text-black hover:bg-black/5 bg-transparent"
              onClick={handleCopy}
            >
              Copy to Clipboard
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}