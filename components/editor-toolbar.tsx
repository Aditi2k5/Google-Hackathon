"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Bold, Italic, Heading2, Quote, LinkIcon, Download, Save, Undo2 } from "lucide-react"

interface EditorToolbarProps {
  onBold?: () => void
  onItalic?: () => void
  onHeading?: () => void
  onQuote?: () => void
  onLink?: () => void
  onExport?: () => void
  onSave?: () => void
  onUndo?: () => void
}

export function EditorToolbar({
  onBold,
  onItalic,
  onHeading,
  onQuote,
  onLink,
  onExport,
  onSave,
  onUndo,
}: EditorToolbarProps) {
  return (
    <motion.div
      className="glass-sm rounded-full py-2 px-4 flex items-center gap-2 overflow-x-auto"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Button size="sm" variant="ghost" onClick={onBold} className="hover:bg-white/10" title="Bold">
        <Bold className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="ghost" onClick={onItalic} className="hover:bg-white/10" title="Italic">
        <Italic className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="ghost" onClick={onHeading} className="hover:bg-white/10" title="Heading">
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="ghost" onClick={onQuote} className="hover:bg-white/10" title="Quote">
        <Quote className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="ghost" onClick={onLink} className="hover:bg-white/10" title="Link">
        <LinkIcon className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-white/10 mx-2" />

      <Button size="sm" variant="ghost" onClick={onUndo} className="hover:bg-white/10" title="Undo">
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="ghost" onClick={onSave} className="hover:bg-white/10" title="Save">
        <Save className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="ghost" onClick={onExport} className="hover:bg-white/10" title="Export">
        <Download className="h-4 w-4" />
      </Button>
    </motion.div>
  )
}
