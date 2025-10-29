"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, AlertCircle, Copy, Upload } from "lucide-react";
import { readFileAsText, setupDragAndDrop } from "@/lib/file-utils";
import {
  getProofreader,
  proofreaderStream,
  isProofreaderSupported,
  destroyProofreader,
} from "@/lib/proofreader";

export default function ProofreaderTab() {
  const [isSupported, setIsSupported] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isProofreading, setIsProofreading] = useState(false);
  const [error, setError] = useState("");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialize = useCallback(async () => {
    setIsInitializing(true);
    setError("");
    setDownloadProgress(0);

    if (!isProofreaderSupported()) {
      setError("Proofreader not supported. Use Chrome 141+ with AI flags.");
      setIsSupported(false);
      setIsInitializing(false);
      return;
    }

    try {
      await getProofreader({
        onDownloadProgress: (p) => setDownloadProgress(p),
      });
      setIsSupported(true);
    } catch (err: any) {
      setError(err.message);
      setIsSupported(false);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    initialize();
    return () => destroyProofreader();
  }, [initialize]);

  useEffect(() => {
    if (textareaRef.current) {
      setupDragAndDrop(textareaRef.current, async (files) => {
        try {
          const content = await readFileAsText(files[0]);
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
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleProofread = async () => {
    if (!input.trim()) return;
    setError("");
    setOutput("");
    setIsProofreading(true);

    try {
      let acc = "";
      for await (const chunk of proofreaderStream(input)) {
        acc += chunk;
        setOutput(acc);
      }
      if (!acc.trim()) setError("No feedback generated.");
    } catch (err: any) {
      setError(err.message || "Proofreading failed.");
    } finally {
      setIsProofreading(false);
    }
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
    setError("");
  };

  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
    } catch {}
  };

  const wordCount = output ? output.trim().split(/\s+/).length : 0;

  // === INITIALIZING ===
  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
        <p className="text-gray-300 font-medium">Initializing Proofreader...</p>
        {downloadProgress > 0 && (
          <div className="w-full max-w-md">
            <div className="bg-gray-700/50 rounded-full h-3 overflow-hidden">
              <div
                className="bg-purple-600 h-3 transition-all"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-400 text-center mt-2">
              Model: {downloadProgress}%
            </p>
          </div>
        )}
      </div>
    );
  }

  // === NOT SUPPORTED ===
  if (!isSupported) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-red-500/10 border border-red-400/40 rounded-md text-red-200 flex gap-2">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
        <Button onClick={initialize} variant="outline">Retry</Button>
      </div>
    );
  }

  // === MAIN UI ===
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h2 className="text-xl font-semibold text-purple-400">Proofreader & Editor</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Text to Proofread</label>
          <div className="flex gap-2 mb-2">
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-1" /> Upload
            </Button>
            <Input ref={fileInputRef} type="file" accept=".txt,.doc,.docx" onChange={handleFileUpload} className="hidden" />
          </div>
          <Textarea
            ref={textareaRef}
            placeholder="Paste or upload text with errors..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isProofreading}
            className="min-h-64 resize-none"
          />
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Button
          onClick={handleProofread}
          disabled={isProofreading || !input.trim()}
          className="bg-purple-600 text-white"
        >
          {isProofreading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Proofreading...
            </>
          ) : (
            "Proofread & Edit"
          )}
        </Button>
        {output && (
          <Button onClick={handleCopy} variant="outline" className="border-purple-600 text-purple-300">
            <Copy className="w-4 h-4 mr-1" /> Copy
          </Button>
        )}
        <Button onClick={handleClear} variant="outline" disabled={isProofreading}>
          Clear
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-400/40 rounded-md text-red-200 flex items-start gap-2">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      )}

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium">Output</label>
          {output && <span className="text-xs text-gray-400">{wordCount} words</span>}
        </div>
        <div
          className="whitespace-pre-wrap p-4 border rounded bg-purple-900/10 overflow-auto h-[70vh] prose prose-invert max-w-none"
        >
          {output || (
            <span className="text-gray-500 italic">
              Proofreading results will appear here...
            </span>
          )}
        </div>
      </div>
    </div>
  );
}