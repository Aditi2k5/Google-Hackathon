"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface APIControlsProps {
  module: string;
  loading: boolean;
  onInvoke: (args?: any) => void;
}

export function APIControls({ module, loading, onInvoke }: APIControlsProps) {
  // Writer-specific fields
  const [topic, setTopic] = useState("");
  const [keywords, setKeywords] = useState("");
  const [tone, setTone] = useState("neutral");
  const [length, setLength] = useState("medium");

  // For non-writer modules, keep placeholder
  if (module !== "writer") {
    return (
      <div className="rounded-xl border bg-card p-4 space-y-4">
        <h3 className="font-semibold capitalize">{module} API</h3>
        <p className="text-sm text-muted-foreground">
          Adjust inputs or press Invoke.
        </p>
        <Button
          onClick={() => onInvoke()}
          disabled={loading}
          className="w-full bg-indigo-600 text-white"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Processing...
            </>
          ) : (
            `Invoke ${module.charAt(0).toUpperCase() + module.slice(1)} API`
          )}
        </Button>
      </div>
    );
  }

  // For Writer module
  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      <h3 className="font-semibold">⚡ Writer API</h3>

      <div className="space-y-2">
        <label className="text-sm">Topic</label>
        <input
          className="w-full rounded border bg-transparent p-2"
          placeholder="e.g., EU AI Act enforcement"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm">Keywords</label>
        <input
          className="w-full rounded border bg-transparent p-2"
          placeholder="e.g., fines, compliance, regulation"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          disabled={loading}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="text-sm">Tone</label>
          <select
            className="w-full rounded border bg-transparent p-2"
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            disabled={loading}
          >
            <option value="neutral">Neutral</option>
            <option value="formal">Formal</option>
            <option value="casual">Casual</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm">Length</label>
          <select
            className="w-full rounded border bg-transparent p-2"
            value={length}
            onChange={(e) => setLength(e.target.value)}
            disabled={loading}
          >
            <option value="short">Short</option>
            <option value="medium">Medium</option>
            <option value="long">Long</option>
          </select>
        </div>
      </div>

      <Button
        onClick={() => onInvoke({ topic, keywords, tone, length })}
        disabled={loading}
        className="w-full bg-indigo-600 text-white"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Generating...
          </>
        ) : (
          "Invoke Writer API"
        )}
      </Button>
    </div>
  );
}
