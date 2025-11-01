"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, Copy, AlertCircle, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export interface TopicIdea {
  title: string;
  hook: string;
  keywords: string[];
  timeliness: string;
}

export default function PromptTab() {
  const [seed, setSeed] = useState("");
  const [loading, setLoading] = useState(false);
  const [topics, setTopics] = useState<TopicIdea[]>([]);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!seed.trim()) {
      setError("Please enter a seed idea");
      return;
    }

    setLoading(true);
    setError("");
    setTopics([]);
    setCopied(false);

    try {
      const res = await fetch("/api/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seed }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Failed to generate topics");
      }

      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("Invalid response");

      setTopics(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!topics.length) return;
    const text = topics
      .map((t, i) => `${i + 1}. **${t.title}**\n   > ${t.hook}\n   _Keywords:_ ${t.keywords.join(", ")}\n   _Timeliness:_ ${t.timeliness}`)
      .join("\n\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
      {/* ========== INPUT PANEL ========== */}
      <div className="glass-lg p-6 rounded-3xl w-full space-y-5">
        <h3 className="font-semibold text-indigo-400 flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          AI Topic Generator
        </h3>

        <div>
          <label className="block text-sm font-medium mb-1.5">Seed Idea</label>
          <input
            type="text"
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && generate()}
            placeholder="e.g. AI regulation, climate tech, quantum computing"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-muted-foreground"
            disabled={loading}
          />
        </div>

        <Button
          onClick={generate}
          disabled={loading || !seed.trim()}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            "Generate 5 Topics"
          )}
        </Button>

        {topics.length > 0 && (
          <Button onClick={handleCopy} variant="outline" className="w-full">
            {copied ? "Copied!" : <Copy className="h-4 w-4 mr-2" />}
            {copied ? "Copied!" : "Copy All"}
          </Button>
        )}

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-400 mt-0.5" />
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}
      </div>

      {/* ========== OUTPUT PANEL ========== */}
      <div className="lg:col-span-2 glass-lg p-6 rounded-3xl w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {loading ? (
              <Loader2 className="h-5 w-5 text-indigo-400 animate-spin" />
            ) : topics.length > 0 ? (
              <CheckCircle className="h-5 w-5 text-green-400" />
            ) : null}
            <h3 className="font-semibold text-indigo-400">Generated Topics</h3>
          </div>
          {topics.length > 0 && (
            <span className="text-xs text-muted-foreground">{topics.length} topics</span>
          )}
        </div>

        <div className="space-y-4 min-h-[500px] bg-white/5 rounded-lg p-4 border border-white/10">
          {topics.length === 0 ? (
            <p className="text-muted-foreground italic">Topics will appear here...</p>
          ) : (
            topics.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-4 bg-white/5 border border-white/10 rounded-lg space-y-2"
              >
                <h4 className="font-medium text-sm text-indigo-300">{t.title}</h4>
                <p className="text-xs italic text-foreground">"{t.hook}"</p>
                <div className="flex flex-wrap gap-1.5">
                  {t.keywords.map((k, ki) => (
                    <span
                      key={ki}
                      className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full"
                    >
                      {k}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-yellow-400 flex items-center gap-1">
                  {t.timeliness}
                </p>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}