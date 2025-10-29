// src/lib/summarizer.ts
let summarizerSession: any = null;

export const isSummarizerSupported = () => typeof window !== "undefined" && !!window.ai?.summarizer;

export const getSummarizer = async ({ onDownloadProgress }: { onDownloadProgress?: (p: number) => void }) => {
  if (summarizerSession) return summarizerSession;
  if (!isSummarizerSupported()) throw new Error("Summarizer not supported");

  const session = await window.ai.summarizer.createSession();
  session.onDownloadProgress = (p: number) => onDownloadProgress?.(p * 100);
  summarizerSession = session;
  return session;
};

export const summarizerStream = async function* (text: string): AsyncGenerator<string> {
  const session = await getSummarizer({});
  const result = await session.complete({ text });

  yield `## Summary\n${result.summary}\n\n`;
  if (result.keyPoints?.length) {
    yield `## Key Points\n`;
    for (const p of result.keyPoints) yield `• ${p}\n`;
  }
};