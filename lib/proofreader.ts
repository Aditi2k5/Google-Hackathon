// src/lib/proofreader.ts
let proofreaderSession: any = null;

export const isProofreaderSupported = () =>
  typeof window !== "undefined" && !!window.ai?.proofreader;

export const destroyProofreader = () => {
  if (proofreaderSession) {
    proofreaderSession.destroy?.();
    proofreaderSession = null;
  }
};

export const getProofreader = async ({
  onDownloadProgress,
}: {
  onDownloadProgress?: (progress: number) => void;
}) => {
  if (!isProofreaderSupported()) {
    throw new Error("Proofreader API not available. Use Chrome 141+ with AI enabled.");
  }

  if (proofreaderSession) return proofreaderSession;

  // Defensive: Check 'window', 'ai', and 'proofreader', to avoid runtime errors and linter complaints
  if (
    typeof window === "undefined" ||
    !window.ai ||
    !window.ai.proofreader ||
    typeof window.ai.proofreader.createSession !== "function"
  ) {
    throw new Error("Proofreader API not available. Use Chrome 141+ with AI enabled.");
  }

  const session = await window.ai.proofreader.createSession({
    includeInlineSuggestions: true,
    includeSuggestionsList: true,
    includeRewrite: true,
    rewriteStyle: "academic",
    includeSpelling: true,
    includeGrammar: true,
    includeStyle: true,
    includeClarity: true,
    includeTone: true,
  });

  session.onDownloadProgress = (p: number) => {
    onDownloadProgress?.(p * 100);
  };

  proofreaderSession = session;
  return session;
};

export const proofreaderStream = async function* (
  text: string
): AsyncGenerator<string> {
  const session = await getProofreader({});

  // Run full analysis
  const result = await session.complete({ text });

  // === 1. Annotated Text ===
  if (result.inlineSuggestions?.length) {
    let annotated = text;
    let offset = 0;
    for (const s of result.inlineSuggestions) {
      const start = s.start + offset;
      const end = s.end + offset;
      const original = text.slice(start, end);
      const replacement = s.suggestion;
      const marker = `[${original}→${replacement}]`;
      annotated = annotated.slice(0, start) + marker + annotated.slice(end);
      offset += marker.length - (end - start);
    }
    yield `## Annotated Text\n${annotated}\n\n`;
  }

  // === 2. Detailed Suggestions ===
  if (result.suggestions?.length) {
    yield `## Detailed Suggestions\n`;
    for (const s of result.suggestions) {
      const type = s.type.toUpperCase();
      const expl = s.explanation ? ` (${s.explanation})` : "";
      yield `• **[${type}]** ${s.original} → **${s.suggestion}**${expl}\n`;
    }
    yield `\n`;
  }

  // === 3. Corrected Text ===
  if (result.correctedText) {
    yield `## Corrected Text\n${result.correctedText}\n\n`;
  }

  // === 4. Academic Rewrite ===
  if (result.rewrite) {
    yield `## Academic Rewrite\n${result.rewrite}\n`;
  }
};