/** Rewriter API wrapper — modeled after lib/writer.ts */

export type RewriterAvailability = 'unavailable' | 'available' | 'downloadable';
export type RewriterTone = 'more-formal' | 'as-is' | 'more-casual';
export type RewriterFormat = 'as-is' | 'markdown' | 'plain-text';
export type RewriterLength = 'shorter' | 'as-is' | 'longer';

export interface CreateRewriterOptions {
  tone?: RewriterTone;
  format?: RewriterFormat;
  length?: RewriterLength;
  expectedInputLanguages?: string[];
  expectedContextLanguages?: string[];
  outputLanguage?: string;
  sharedContext?: string;
  signal?: AbortSignal;
  onDownloadProgress?: (percent: number) => void;
}

export interface RewriteOptions {
  context?: string;
  signal?: AbortSignal;
  tone?: RewriterTone;
}

type InternalRewriterInstance = {
  rewrite(input: string, opts?: RewriteOptions): Promise<string>;
  rewriteStreaming(input: string, opts?: RewriteOptions): AsyncIterable<string>;
  destroy(): void;
};

declare global {
  var Rewriter:
    | {
        availability(): Promise<RewriterAvailability>;
        create(options?: any): Promise<InternalRewriterInstance>;
      }
    | undefined;
}

let _rewriter: InternalRewriterInstance | null = null;
let _creating: Promise<InternalRewriterInstance> | null = null;

export function isRewriterSupported(): boolean {
  return typeof window !== 'undefined' && 'Rewriter' in window;
}

export async function getRewriter(options: CreateRewriterOptions = {}): Promise<InternalRewriterInstance> {
  if (!isRewriterSupported())
    throw new Error('Chrome AI Rewriter API not available. Enable the flag and token.');

  if (_rewriter) return _rewriter;
  if (_creating) return _creating;

  const {
    tone = 'as-is',
    format = 'markdown',
    length = 'as-is',
    expectedInputLanguages = ['en'],
    expectedContextLanguages = ['en'],
    outputLanguage = 'en',
    sharedContext,
    signal,
    onDownloadProgress,
  } = options;

  _creating = (async () => {
    const availability = await window.Rewriter!.availability();

    if (availability === 'unavailable')
      throw new Error('Rewriter API unavailable on this origin. Check Chrome version and token.');

    const baseOptions = {
      tone,
      format,
      length,
      expectedInputLanguages,
      expectedContextLanguages,
      outputLanguage,
      sharedContext,
      signal,
    };

    if (availability === 'available') {
      _rewriter = await window.Rewriter!.create(baseOptions);
      return _rewriter!;
    }

    _rewriter = await window.Rewriter!.create({
      ...baseOptions,
      monitor(m: EventTarget) {
        if (!onDownloadProgress) return;
        m.addEventListener('downloadprogress', (e: any) => {
          const pct = Math.round((e.loaded / (e.total || 1)) * 100);
          onDownloadProgress(pct);
        });
      },
    });
    return _rewriter!;
  })();

  try {
    return await _creating;
  } finally {
    _creating = null;
  }
}

export async function rewriterRewrite(text: string, opts: RewriteOptions = {}): Promise<string> {
  const rewriter = await getRewriter();
  return rewriter.rewrite(text, opts);
}

export async function rewriterRewriteStreaming(
  text: string,
  opts: RewriteOptions = {},
): Promise<AsyncIterable<string>> {
  const rewriter = await getRewriter();
  return rewriter.rewriteStreaming(text, opts);
}

export function destroyRewriter(): void {
  if (_rewriter) {
    try {
      _rewriter.destroy();
    } catch {}
  }
  _rewriter = null;
}
