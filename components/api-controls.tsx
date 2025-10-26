"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Loader2, Zap } from "lucide-react"

interface APIControlsProps {
  module: string
  loading?: boolean
  onInvoke?: () => void
}

const moduleConfigs: Record<string, { label: string; params: string[] }> = {
  writer: {
    label: "Writer API",
    params: ["Topic", "Tone", "Length"],
  },
  rewriter: {
    label: "Rewriter API",
    params: ["Style", "Audience", "Focus"],
  },
  proofreader: {
    label: "Proofreader API",
    params: ["Strictness", "Style Guide"],
  },
  summarizer: {
    label: "Summarizer API",
    params: ["Length", "Focus Points"],
  },
}

export function APIControls({ module, loading = false, onInvoke }: APIControlsProps) {
  const config = moduleConfigs[module]

  if (!config) return null

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="glass p-4">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Zap className="h-4 w-4 text-indigo-400" />
          {config.label}
        </h3>

        <div className="space-y-3">
          {config.params.map((param) => (
            <div key={param}>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">{param}</label>
              <Input placeholder={`Enter ${param.toLowerCase()}`} className="glass-sm py-2" />
            </div>
          ))}
        </div>

        <Button
          onClick={onInvoke}
          disabled={loading}
          className="w-full mt-4 glass-sm bg-indigo-500 hover:bg-indigo-600 text-white shadow-xl"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              Invoke {config.label}
            </>
          )}
        </Button>
      </Card>
    </motion.div>
  )
}
