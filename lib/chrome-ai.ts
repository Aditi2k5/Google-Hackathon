// Chrome Built-in AI API utilities and types

export interface ChromeAICapabilities {
  hasBuiltInAI: boolean
  hasSummarizer: boolean
  hasRewriter: boolean
  hasProofreader: boolean
}

export async function checkChromeAICapabilities(): Promise<ChromeAICapabilities> {
  if (typeof window === "undefined") {
    return {
      hasBuiltInAI: false,
      hasSummarizer: false,
      hasRewriter: false,
      hasProofreader: false,
    }
  }

  const hasBuiltInAI = !!(window.ai?.summarizer || window.ai?.rewriter || window.ai?.proofreader)

  return {
    hasBuiltInAI,
    hasSummarizer: !!window.ai?.summarizer,
    hasRewriter: !!window.ai?.rewriter,
    hasProofreader: !!window.ai?.proofreader,
  }
}

export async function summarizeText(text: string): Promise<string> {
  if (!window.ai?.summarizer) {
    throw new Error("Summarizer API not available")
  }

  const summarizer = await window.ai.summarizer.create()
  const result = await summarizer.summarize(text)
  return result
}

export async function rewriteText(
  text: string,
  style: "academic" | "casual" | "professional" = "academic",
): Promise<string> {
  if (!window.ai?.rewriter) {
    throw new Error("Rewriter API not available")
  }

  const rewriter = await window.ai.rewriter.create()
  const result = await rewriter.rewrite(text, { style })
  return result
}

export async function proofreadText(text: string): Promise<string> {
  if (!window.ai?.proofreader) {
    throw new Error("Proofreader API not available")
  }

  const proofreader = await window.ai.proofreader.create()
  const result = await proofreader.proofread(text, { explain: true })
  return result
}

// Type augmentation for window.ai
declare global {
  interface Window {
    ai?: {
      summarizer?: {
        create: () => Promise<{ summarize: (text: string) => Promise<string> }>
      }
      rewriter?: {
        create: () => Promise<{ rewrite: (text: string, options: { style: string }) => Promise<string> }>
      }
      proofreader?: {
        create: () => Promise<{ proofread: (text: string, options: { explain: boolean }) => Promise<string> }>
      }
    }
  }
}

export default {
  checkChromeAICapabilities,
  summarizeText,
  rewriteText,
  proofreadText,
}
