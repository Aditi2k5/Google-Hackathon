"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { callProofreaderAPI } from "@/lib/proofreader";

export function ProofreaderTab() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleProofread = async () => {
    if (!input.trim()) return;

    setIsLoading(true);
    setError("");
    setOutput("");

    try {
      const res = await callProofreaderAPI({
        text: input,
        preferAcademicRewrite: true,
      });

      const { diffed, suggestionsText, correctedText, academicRewrite } = res;

      let combined = `🔍 Annotated version (inline suggestions):\n\n${diffed}\n\n`;
      combined += `💡 Suggestions:\n${suggestionsText || "No specific suggestions"}\n\n`;
      combined += `✅ Corrected Text:\n${correctedText}\n\n`;

      if (academicRewrite) {
        combined += `🎓 Academic Rewrite (improved):\n${academicRewrite}\n`;
      } else {
        combined += `🎓 Academic Rewrite: not available.\n`;
      }

      setOutput(combined);
    } catch (err: any) {
      console.error("Proofreader API error:", err);
      if (err.message?.includes("not available")) {
        setError(
          "Your browser doesn’t support the Chrome AI Proofreader yet. Please use the latest Chrome Early Preview with Built-in AI enabled."
        );
      } else {
        setError("Failed to proofread. Please try again.");
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
          <Textarea
            placeholder="Paste your academic text here for proofreading..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-64 bg-white border-black/20 text-black placeholder:text-black/40"
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <Button
            onClick={handleProofread}
            disabled={isLoading || !input.trim()}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isLoading ? "Proofreading..." : "Proofread"}
          </Button>
        </div>

        {/* Output Section */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-black">Feedback & Corrections</label>
          <div className="min-h-64 p-4 bg-purple-50 border border-purple-200 rounded-lg text-black whitespace-pre-wrap font-mono overflow-y-auto">
            {isLoading
              ? "Analyzing your text..."
              : output || "Proofreading feedback will appear here..."}
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
