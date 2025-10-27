/** Writer API wrapper and types. */

export type WriterAvailability = 'unavailable' | 'available' | 'downloadable';

export type WriterLength = 'short' | 'medium' | 'long';
export type WriterTone = 'formal' | 'neutral' | 'casual';
export type WriterFormat = 'markdown' | 'plain-text';

export interface CreateWriterOptions {
  tone?: WriterTone;
  format?: WriterFormat;
  length?: WriterLength;
  expectedInputLanguages?: string[];
  expectedContextLanguages?: string[];
  outputLanguage?: string;
  sharedContext?: string;
  signal?: AbortSignal;
  onDownloadProgress?: (percent: number) => void; // 0..100 (only used when availability==='downloadable')
}

export interface WriteOptions {
  context?: string;
  signal?: AbortSignal;
}

type InternalWriterInstance = {
  write(prompt: string, opts?: WriteOptions): Promise<string>;
  writeStreaming(prompt: string, opts?: WriteOptions): AsyncIterable<string>;
  destroy(): void;
};

declare global {
  // Ambient types so TS doesn't yell if you don't have your own d.ts
  // If you already added a chrome-ai.d.ts, this will be merged.
  // (Safe in Next.js since it's module-scoped.)
  // eslint-disable-next-line no-var
  var Writer: {
    availability(): Promise<WriterAvailability>;
    create(options?: {
      tone?: WriterTone;
      format?: WriterFormat;
      length?: WriterLength;
      expectedInputLanguages?: string[];
      expectedContextLanguages?: string[];
      outputLanguage?: string;
      sharedContext?: string;
      signal?: AbortSignal;
      monitor?: (m: EventTarget) => void;
    }): Promise<InternalWriterInstance>;
  } | undefined;
}

let _writer: InternalWriterInstance | null = null;
let _creating: Promise<InternalWriterInstance> | null = null;

/** Quick check: is the API exposed in this context? */
export function isWriterSupported(): boolean {
  return typeof window !== 'undefined' && 'Writer' in window;
}

/** Read the token for sanity checks. (Must be present in <head> at load time!) */
export function getWriterOriginTrialToken(): string | undefined {
  return process.env.NEXT_PUBLIC_WRITER_API_KEY || undefined;
}

/**
 * Create (or return) a singleton Writer instance with sensible defaults.
 * You can call this multiple times; it will reuse the same instance.
 */
export async function getWriter(options: CreateWriterOptions = {}): Promise<InternalWriterInstance> {
  if (!isWriterSupported()) {
    throw new Error(
      'Chrome AI Writer API not available. Use Chrome 137+ desktop. Ensure origin trial is set and flags are enabled for localhost.'
    );
  }

  if (_writer) return _writer;
  if (_creating) return _creating;

  const {
    tone = 'neutral',
    format = 'markdown',
    length = 'medium',
    expectedInputLanguages = ['en'],
    expectedContextLanguages = ['en'],
    outputLanguage = 'en',
    sharedContext,
    signal,
    onDownloadProgress,
  } = options;

  _creating = (async () => {
    const availability = await window.Writer!.availability();

    // Helpful dev sanity: warn if token missing (most common setup issue)
    if (typeof document !== 'undefined') {
      const hasMeta =
        !!document.querySelector('meta[http-equiv="origin-trial"]') ||
        !!document.querySelector('meta[http-equiv="Origin-Trial"]');
      if (!hasMeta) {
        const tok = getWriterOriginTrialToken();
        if (!tok) {
          // eslint-disable-next-line no-console
          console.warn(
            '[Writer] No origin-trial meta tag and NEXT_PUBLIC_WRITER_API_KEY not set. ' +
              'The API may be unavailable on this origin.'
          );
        }
      }
    }

    if (availability === 'unavailable') {
      throw new Error(
        'Writer API unavailable on this origin. Check: Chrome version, OS/hardware/storage, and that the Origin Trial token is present in <head>.'
      );
    }

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
      _writer = await window.Writer!.create(baseOptions);
      return _writer!;
    }

    // availability === 'downloadable' — attach monitor for progress
    _writer = await window.Writer!.create({
      ...baseOptions,
      monitor(m: EventTarget) {
        if (!onDownloadProgress) return;
        m.addEventListener('downloadprogress', (e: any) => {
          // Some builds only expose e.loaded in 0..1; others also include e.total.
          const loaded = typeof e.loaded === 'number' ? e.loaded : 0;
          const total = typeof e.total === 'number' ? e.total : 1;
          const pct = total > 0 ? Math.round((loaded / total) * 100) : Math.round(loaded * 100);
          onDownloadProgress(pct);
        });
      },
    });
    return _writer!;
  })();

  try {
    return await _creating;
  } finally {
    _creating = null;
  }
}

/** Convenience: write once (non-streaming). */
export async function writerWrite(prompt: string, opts: WriteOptions = {}): Promise<string> {
  const writer = await getWriter();
  return writer.write(prompt, opts);
}

/** Convenience: write and stream chunks. */
export async function writerWriteStreaming(
  prompt: string,
  opts: WriteOptions = {}
): Promise<AsyncIterable<string>> {
  const writer = await getWriter();
  return writer.writeStreaming(prompt, opts);
}

/** Cleanup (usually not needed; component unmounts may call this). */
export function destroyWriter(): void {
  if (_writer) {
    try {
      _writer.destroy();
    } catch {
      // ignore
    }
  }
  _writer = null;
}
