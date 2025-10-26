// types/chrome-ai.d.ts

interface AIWriterAPI {
  capabilities(): Promise<{ available: 'readily' | 'after-download' | 'no' }>
  create(options?: AIWriterCreateOptions): Promise<AIWriter>
}

interface AIWriterCreateOptions {
  tone?: 'formal' | 'neutral' | 'casual'
  format?: 'markdown' | 'plain-text'
  length?: 'short' | 'medium' | 'long'
  sharedContext?: string
  signal?: AbortSignal
  monitor?: (monitor: DownloadMonitor) => void
}

interface AIWriter {
  write(prompt: string, options?: WriteOptions): Promise<string>
  writeStreaming(prompt: string, options?: WriteOptions): AsyncIterable<string>
  destroy(): void
}

interface WriteOptions {
  context?: string
  signal?: AbortSignal
}

interface DownloadMonitor {
  addEventListener(event: 'downloadprogress', handler: (e: ProgressEvent) => void): void
}

interface AI {
  writer: AIWriterAPI
}

// Extend the global Window interface
declare global {
  interface Window {
    ai: AI
  }
  
  // For self in workers and main thread
  const ai: AI
}

export {}
