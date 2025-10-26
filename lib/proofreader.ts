// lib/api-client.ts
type Highlight = {
    start: number;
    end: number;
    original: string;
    suggestion: string;
    reason?: string;
    category?: string;
  };
  
  function safeGet(obj: any, path: string[], defaultVal: any = undefined) {
    try {
      return path.reduce((acc, p) => (acc && acc[p] !== undefined ? acc[p] : undefined), obj) ?? defaultVal;
    } catch {
      return defaultVal;
    }
  }
  
  /**
   * Runs the Chrome Built-in Proofreader API and returns a structured result.
   * If corrections are missing or too shallow, it will attempt a rewrite pass
   * using ai.writer (if available) to produce an academic-tone rewrite.
   */
  export async function callProofreaderAPI({
    text,
    preferAcademicRewrite = true,
  }: {
    text: string;
    preferAcademicRewrite?: boolean;
  }) {
    if (typeof window === "undefined") throw new Error("Proofreader can only run in browser.");
  
    // Basic support check
    const aiGlobal = (window as any).ai ?? null;
    if (!aiGlobal || !aiGlobal.proofreader) {
      throw new Error(
        "Proofreader API not available. Use Chrome with Built-in AI enabled (or the Early Preview build)."
      );
    }
  
    // Create proofreader with auth token (env var)
    const token = process.env.NEXT_PUBLIC_PROOFREADER_TOKEN;
    if (!token) throw new Error("Missing NEXT_PUBLIC_PROOFREADER_TOKEN.");
  
    // Try to request a detailed response (if the API accepts these params)
    const createOptions = {
      authToken: token,
      expectedInputLanguages: ["en"],
      // Best-effort options — if the API ignores them, that's OK.
      verbosity: "detailed", // best-effort
      explain: true,         // best-effort
      suggestImprovements: true, // best-effort
      tone: "academic",      // best-effort hint
    };
  
    const proofreader = await aiGlobal.proofreader.create(createOptions);
  
    // Attempt to run the proofreader
    // Some APIs return .proofread(), .correct(), or .analyze(); handle likely names
    let raw: any = null;
    try {
      if (typeof proofreader.proofread === "function") {
        raw = await proofreader.proofread(text);
      } else if (typeof proofreader.correct === "function") {
        raw = await proofreader.correct(text);
      } else if (typeof proofreader.analyze === "function") {
        raw = await proofreader.analyze(text);
      } else {
        throw new Error("Proofreader instance has no known method to run.");
      }
    } catch (err) {
      console.error("Proofreader.run error:", err);
      throw err;
    }
  
    // Normalized outputs we expect (defensive)
    const correctedText = safeGet(raw, ["text"], safeGet(raw, ["corrected"], text));
    const corrections = safeGet(raw, ["corrections"], safeGet(raw, ["edits"], []));
  
    // If corrections is an object or a string, normalize to array
    const correctionsArray: any[] = Array.isArray(corrections)
      ? corrections
      : corrections
      ? [corrections]
      : [];
  
    // Try to transform corrections items into {start,end,original,suggestion,reason}
    const highlights: Highlight[] = [];
  
    for (const c of correctionsArray) {
      // The structure is implementation-dependent. Try common shapes:
      // { start, end, original, suggestion, reason, category }
      // OR { span: { start, end }, original, suggestion, explanation }
      const start = safeGet(c, ["start"], safeGet(c, ["span", "start"], undefined));
      const end = safeGet(c, ["end"], safeGet(c, ["span", "end"], undefined));
      const original = safeGet(c, ["original"], safeGet(c, ["textBefore"], undefined));
      const suggestion = safeGet(c, ["suggestion"], safeGet(c, ["replacement"], safeGet(c, ["suggestions", "0"], undefined)));
      const reason = safeGet(c, ["reason"], safeGet(c, ["explanation"], undefined));
      const category = safeGet(c, ["category"], safeGet(c, ["type"], undefined));
  
      // If start/end unavailable, try to find original in text
      let s = start;
      let e = end;
      if ((s === undefined || e === undefined) && original) {
        const idx = text.indexOf(original);
        if (idx >= 0) {
          s = idx;
          e = idx + original.length;
        }
      }
  
      // Skip empty suggestions
      if (!suggestion && !s && !e) continue;
  
      highlights.push({
        start: typeof s === "number" ? s : 0,
        end: typeof e === "number" ? e : (original ? original.length : 0),
        original: original ?? (text.slice(s ?? 0, e ?? 0) || ""),
        suggestion: suggestion ?? "",
        reason,
        category,
      });
    }
  
    // If the Proofreader returned no useful highlights or they are too shallow,
    // optionally run a "rewrite in academic tone" step using the local writer API (if available)
    let academicRewrite: string | null = null;
    const needRewrite =
      preferAcademicRewrite && (highlights.length === 0 || highlights.every((h) => !h.suggestion || h.suggestion.trim().length === 0));
  
    if (needRewrite && aiGlobal.writer) {
      try {
        const writer = await aiGlobal.writer.create?.({
          authToken: token,
          model: "best", // best-effort hint
          // additional hints if supported
          tone: "academic",
          style: "formal",
        });
  
        if (writer && typeof writer.rewrite === "function") {
          // Many writer APIs accept instructions + text and return rewritten text
          const rewriteResult = await writer.rewrite({
            instructions:
              "Rewrite the following paragraph into clear, concise academic English. Preserve meaning. Show the improved version only.",
            input: text,
          });
          academicRewrite = safeGet(rewriteResult, ["text"], safeGet(rewriteResult, ["rewritten"], null));
        } else if (writer && typeof writer.generate === "function") {
          const rewriteResult = await writer.generate({
            prompt: `Rewrite the text below into a concise academic style. Preserve facts and meaning.\n\n${text}`,
            maxTokens: 800,
          });
          academicRewrite = safeGet(rewriteResult, ["text"], null) ?? safeGet(rewriteResult, ["output", "0", "text"], null);
        }
      } catch (err) {
        // Non-fatal — we'll just return what we have
        console.warn("Writer rewrite fallback failed:", err);
      }
    }
  
    // Build a friendly "diff style" output: mark changed spans using highlights
    const diffed = buildHighlightedDiff(text, highlights);
  
    // Also produce a suggestions list human-readable
    const suggestionsList = highlights.map((h, i) => {
      return `(${i + 1}) ${h.original || text.slice(h.start, h.end)} → ${h.suggestion || "(no explicit suggestion)"}${
        h.reason ? ` — ${h.reason}` : ""
      }${h.category ? ` [${h.category}]` : ""}`;
    });
  
    return {
      original: text,
      correctedText,
      highlights,
      diffed, // string with <<suggestion>> markers or plain HTML
      suggestionsText: suggestionsList.join("\n"),
      academicRewrite, // null if not generated
      raw, // include raw API response for debugging
    };
  }
  
  /**
   * Build a simple highlighted text that injects markers around suggestions.
   * This returns a plain string with brackets indicating the suggestion:
   * e.g. "The result of the experiment [shows -> show] that..."
   * You can replace with HTML if you prefer.
   */
  function buildHighlightedDiff(orig: string, highlights: Highlight[]) {
    if (!highlights || highlights.length === 0) return orig;
  
    // Sort highlights by start (ascending)
    const h = [...highlights].sort((a, b) => a.start - b.start);
  
    let out = "";
    let ptr = 0;
  
    for (const hi of h) {
      const s = Math.max(0, Math.min(orig.length, hi.start));
      const e = Math.max(0, Math.min(orig.length, hi.end));
      if (ptr < s) out += orig.slice(ptr, s);
      const originalSpan = orig.slice(s, e) || hi.original || "";
      // show `original [→ suggestion (reason)]`
      out += `${originalSpan} [→ ${hi.suggestion || "(no suggestion)"}${hi.reason ? `; ${hi.reason}` : ""}]`;
      ptr = e;
    }
    if (ptr < orig.length) out += orig.slice(ptr);
    return out;
  }
  