"use client"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Home, Zap, RefreshCw, CheckCircle, Sparkles, BarChart3, Settings } from "lucide-react"

interface SidebarProps {
  activeModule: string
  onModuleChange: (module: string) => void
}

const modules = [
  { id: "home", label: "Home", icon: Home },
  { id: "writer", label: "Writer API", icon: Zap },
  { id: "rewriter", label: "Rewriter API", icon: RefreshCw },
  { id: "proofreader", label: "Proofreader API", icon: CheckCircle },
  { id: "summarizer", label: "Summarizer API", icon: Sparkles },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
]

export function Sidebar({ activeModule, onModuleChange }: SidebarProps) {
  return (
    <motion.aside
      className="fixed left-0 top-0 w-56 sm:w-64 h-screen glass-news border-r border-white/10 p-4 sm:p-6 flex flex-col pt-16 sm:pt-20 md:pt-24 overflow-y-auto"
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold gradient-text typewriter-headline">Newsroom Forge</h1>
        <p className="text-xs text-muted-foreground mt-1">Your Desk</p>
      </div>

      <nav className="flex-1 space-y-1 sm:space-y-2">
        {modules.map((module) => {
          const Icon = module.icon
          const isActive = activeModule === module.id

          return (
            <motion.button
              key={module.id}
              onClick={() => onModuleChange(module.id)}
              className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-all text-xs sm:text-sm ${
                isActive
                  ? "bg-indigo-500/20 text-indigo-400 border-b-2 border-indigo-400 shadow-lg"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon className="h-4 sm:h-5 w-4 sm:w-5 flex-shrink-0" />
              <span className="font-medium hidden sm:inline">{module.label}</span>
              <span className="font-medium sm:hidden">{module.label.split(" ")[0]}</span>
            </motion.button>
          )
        })}
      </nav>

      <div className="pt-4 border-t border-white/10">
        <Button
          variant="outline"
          className="w-full glass-sm border-white/20 hover:bg-white/10 bg-transparent text-xs sm:text-sm py-2 sm:py-3"
        >
          <Settings className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Settings</span>
        </Button>
      </div>
    </motion.aside>
  )
}
