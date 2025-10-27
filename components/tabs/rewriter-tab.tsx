"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, RefreshCw, Sparkles, Download } from "lucide-react";
import {
  getRewriter,
  rewriterRewriteStreaming,
  RewriterTone,
  RewriterLength,
} from "@/lib/rewriter";

// ✅ for DOCX export
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";

type Variant = "A" | "B";
const TONES: RewriterTone[] = ["more-formal", "as-is", "more-casual"];
const LENGTHS: RewriterLength[] = ["shorter", "as-is", "longer"];

type VariantSettings = {
  tone: RewriterTone;
  length: RewriterLength;   // steers target word window via guidance
  directive: string;        // extra instruction shown only to the model
};

function wordRange(len: RewriterLength): [number, number] {
  if (len === "shorter") return [100, 300];
  if (len === "as-is") return [400, 800];
  return [1000, 1200];
}

export default function RewriterTab() {
  // Source + global sliders
  const [source, setSource] = useState("Paste or type your draft here…");
  const [readability, setReadability] = useState(0);   // -50…+50
  const [localization, setLocalization] = useState(0); // -50…+50

  // Per-variant controls
  const [a, setA] = useState<VariantSettings>({
    tone: "as-is",
    length: "as-is",
    directive: "Variant A: concise, straightforward.",
  });
  const [b, setB] = useState<VariantSettings>({
    tone: "as-is",
    length: "as-is",
    directive: "Variant B: slightly more narrative.",
  });

  // Runtime/UI
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [outA, setOutA] = useState("");
  const [outB, setOutB] = useState("");
  const [neutralityNote, setNeutralityNote] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const globalContext = useMemo(() => {
    const readDir =
      readability > 10 ? "Make sentences simpler and shorter."
      : readability < -10 ? "Use more technical/longer sentences when needed."
      : "Keep sentence complexity natural.";
    const locDir =
      localization > 10 ? "Prefer localized phrasing and examples where appropriate."
      : localization < -10 ? "Prefer globally neutral wording and spellings."
      : "Keep references globally understandable.";
    return `Preserve key facts, named entities, dates, numbers, and quotes.
Avoid new claims; avoid opinion creep; maintain neutrality.
${readDir} ${locDir}`;
  }, [readability, localization]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setLoading(false);
  }, []);

  async function runOne(variant: Variant, cfg: VariantSettings, setOut: (s: string) => void) {
    setOut("");
    const controller = new AbortController();
    abortRef.current = controller;

    await getRewriter({
      // session-level defaults
      tone: cfg.tone,
      format: "markdown",
      length: "as-is",
      expectedInputLanguages: ["en"],
      expectedContextLanguages: ["en"],
      outputLanguage: "en",
      sharedContext:
        "Professional news rewrites for multiple outlets; preserve facts; AP-style neutrality when formal.",
      onDownloadProgress: (p) => setProgress(p),
    });

    const [minW, maxW] = wordRange(cfg.length);
    const guidance =
      `${globalContext}
Tone: ${cfg.tone}
Target length: ${minW}–${maxW} words.
${cfg.directive || (variant === "A" ? "Concise, straightforward." : "Slightly more narrative.")}
Produce clean markdown only (no front-matter).`;

    let acc = "";
    const stream = await rewriterRewriteStreaming(source.trim(), {
      context: guidance,
      tone: cfg.tone,
      signal: controller.signal,
    });

    for await (const chunk of stream) {
      acc += chunk;
      setOut(acc.replace(/\n\s*\n\s*\n/g, "\n\n").trim());
    }
  }

  const runBoth = useCallback(async () => {
    if (!source.trim()) return;
    setLoading(true);
    setNeutralityNote("");
    setOutA("");
    setOutB("");
    try {
      await Promise.all([runOne("A", a, setOutA), runOne("B", b, setOutB)]);
      const biasy = /\b(i think|clearly|obviously|it seems|we believe|should|must)\b/i;
      if (biasy.test(outA) || biasy.test(outB)) {
        setNeutralityNote(
          "Neutrality check: subjective phrasing detected. Consider removing opinionated words."
        );
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }, [source, a, b, outA, outB]);

  // ─────────────────────────────
  // EXPORT HELPERS (A/B aware)
  // ─────────────────────────────
  function exportTXT(filename: string, text: string) {
    const blob = new Blob([text || ""], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const aEl = document.createElement("a");
    aEl.href = url;
    aEl.download = filename;
    document.body.appendChild(aEl);
    aEl.click();
    aEl.remove();
    URL.revokeObjectURL(url);
  }

  function toDocxParagraphs(label: string, text: string) {
    const paras: Paragraph[] = [];
    paras.push(new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 28 })] }));
    paras.push(new Paragraph({}));
    (text || "").split(/\r?\n/).forEach((line) => {
      paras.push(new Paragraph({ children: [new TextRun({ text: line })] }));
    });
    paras.push(new Paragraph({}));
    return paras;
  }

  async function exportAandBtoDOCX() {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Rewriter Variants", bold: true, size: 32 })],
            }),
            new Paragraph({}),
            ...toDocxParagraphs("Variant A", outA),
            ...toDocxParagraphs("Variant B", outB),
          ],
        },
      ],
    });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, "rewriter-variants.docx");
  }

  return (
    <div className="space-y-6">
      {/* Header / progress */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-400" />
          Intelligent Rewriter
        </h2>
        {progress > 0 && progress < 100 && (
          <div className="text-xs text-muted-foreground">
            Downloading on-device model… {progress}%
          </div>
        )}
      </div>

      {/* Variant controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4 space-y-3">
          <div className="font-semibold">Variant A settings</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1 block">Tone</label>
              <select
                className="w-full border rounded p-2 bg-transparent"
                value={a.tone}
                onChange={(e) => setA((s) => ({ ...s, tone: e.target.value as RewriterTone }))}
                disabled={loading}
              >
                {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Length target</label>
              <select
                className="w-full border rounded p-2 bg-transparent"
                value={a.length}
                onChange={(e) => setA((s) => ({ ...s, length: e.target.value as RewriterLength }))}
                disabled={loading}
              >
                {LENGTHS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium mb-1 block">Directive</label>
              <input
                className="w-full border rounded p-2 bg-transparent"
                value={a.directive}
                onChange={(e) => setA((s) => ({ ...s, directive: e.target.value }))}
                placeholder="e.g., Concise, straightforward."
                disabled={loading}
              />
            </div>
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <div className="font-semibold">Variant B settings</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1 block">Tone</label>
              <select
                className="w-full border rounded p-2 bg-transparent"
                value={b.tone}
                onChange={(e) => setB((s) => ({ ...s, tone: e.target.value as RewriterTone }))}
                disabled={loading}
              >
                {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Length target</label>
              <select
                className="w-full border rounded p-2 bg-transparent"
                value={b.length}
                onChange={(e) => setB((s) => ({ ...s, length: e.target.value as RewriterLength }))}
                disabled={loading}
              >
                {LENGTHS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium mb-1 block">Directive</label>
              <input
                className="w-full border rounded p-2 bg-transparent"
                value={b.directive}
                onChange={(e) => setB((s) => ({ ...s, directive: e.target.value }))}
                placeholder="e.g., Slightly more narrative."
                disabled={loading}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Global sliders */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-medium mb-1">
              Readability (technical ↔ simple)
            </label>
            <input
              type="range"
              min={-50}
              max={50}
              value={readability}
              onChange={(e) => setReadability(parseInt(e.target.value))}
              className="w-full"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">
              Localization (global ↔ local)
            </label>
            <input
              type="range"
              min={-50}
              max={50}
              value={localization}
              onChange={(e) => setLocalization(parseInt(e.target.value))}
              className="w-full"
              disabled={loading}
            />
          </div>
        </div>
      </Card>

      {/* Source */}
      <Card className="p-4">
        <label className="block text-sm font-medium mb-2">Source Draft</label>
        <textarea
          value={source}
          onChange={(e) => setSource(e.target.value)}
          rows={10}
          className="w-full bg-transparent border rounded p-3 resize-y"
          disabled={loading}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={runBoth} disabled={loading || !source.trim()} className="bg-indigo-600 text-white">
            {loading ? (<><Loader2 className="h-4 w-4 animate-spin mr-2" />Rewriting…</>) : (<><Sparkles className="h-4 w-4 mr-2" />Rewrite (A/B)</>)}
          </Button>
          {loading && (
            <Button variant="outline" onClick={stop}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Stop
            </Button>
          )}

          {/* 🔽 Local Export buttons (A/B aware) */}
          <Button
            variant="outline"
            onClick={() => exportTXT("variant-a.txt", outA)}
            disabled={!outA}
            className="ml-auto"
            title="Export Variant A as .txt"
          >
            <Download className="h-4 w-4 mr-2" />
            Export A (TXT)
          </Button>
          <Button
            variant="outline"
            onClick={() => exportTXT("variant-b.txt", outB)}
            disabled={!outB}
            title="Export Variant B as .txt"
          >
            <Download className="h-4 w-4 mr-2" />
            Export B (TXT)
          </Button>
          <Button
            variant="outline"
            onClick={exportAandBtoDOCX}
            disabled={!outA && !outB}
            title="Export both variants into one .docx"
          >
            <Download className="h-4 w-4 mr-2" />
            Export A+B (DOCX)
          </Button>
        </div>
      </Card>

      {/* Outputs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="glass-lg p-4">
          <div className="mb-2 font-semibold">Variant A</div>
          <div className="prose prose-invert max-w-none whitespace-pre-wrap text-sm">
            {outA || <span className="text-muted-foreground italic">No output yet…</span>}
          </div>
        </Card>
        <Card className="glass-lg p-4">
          <div className="mb-2 font-semibold">Variant B</div>
          <div className="prose prose-invert max-w-none whitespace-pre-wrap text-sm">
            {outB || <span className="text-muted-foreground italic">No output yet…</span>}
          </div>
        </Card>
      </div>

      {!!neutralityNote && (
        <Card className="glass-news p-3 text-amber-300 text-sm">
          {neutralityNote}
        </Card>
      )}
    </div>
  );
}
