"use client"

import { useState, useEffect } from "react"
import { type ChromeAICapabilities, checkChromeAICapabilities } from "@/lib/chrome-ai"

export function useChromeAI() {
  const [capabilities, setCapabilities] = useState<ChromeAICapabilities>({
    hasBuiltInAI: false,
    hasSummarizer: false,
    hasRewriter: false,
    hasProofreader: false,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkCapabilities = async () => {
      const caps = await checkChromeAICapabilities()
      setCapabilities(caps)
      setIsLoading(false)
    }

    checkCapabilities()
  }, [])

  return { ...capabilities, isLoading }
}
