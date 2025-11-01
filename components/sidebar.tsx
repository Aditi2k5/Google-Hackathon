"use client"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Home, Zap, RefreshCw, Globe, BarChart3, Settings, ChevronLeft, ChevronRight } from "lucide-react"
import { useState, useEffect } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
interface SidebarProps {
  activeModule: string
  onModuleChange: (module: string) => void
}

const modules = [
  { id: "prompt-api", label: "Prompt API", icon: Home },
  { id: "writer",    label: "Writer API", icon: Zap },
  { id: "rewriter",  label: "Rewriter API", icon: RefreshCw },
  { id: "translator",label: "Translator API", icon: Globe },
]

export function Sidebar({ activeModule, onModuleChange }: SidebarProps) {
  return (
    <motion.aside
      className="fixed left-0 top-0 w-56 sm:w-64 h-screen glass-news border-r border-white/10 p-4 sm:p-6 flex flex-col pt-20 sm:pt-24 md:pt-28"
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <nav className="flex-1 space-y-2">
        {modules.map((m) => {
          const Icon = m.icon
          const active = activeModule === m.id
          return (
            <motion.button
              key={m.id}
              onClick={() => onModuleChange(m.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all ${
                active
                  ? "bg-indigo-500/20 text-indigo-400 border-b-2 border-indigo-400"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="font-medium">{m.label}</span>
            </motion.button>
          )
        })}
      </nav>

      <div className="pt-4 border-t border-white/10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
                className="w-full glass-sm border-white/20 hover:bg-white/10 bg-transparent text-xs sm:text-sm py-2 sm:py-3"
              >
                <Settings className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Settings</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuPortal>
              <DropdownMenuContent className="glass-news rounded-md p-2 shadow-lg text-sm min-w-[180px] z-[100]">
                {/* Profile */}
                <DropdownMenuItem className="px-3 py-2 rounded hover:bg-white/10 cursor-default">
                  Profile: {localStorage.getItem('userEmail') || "User"}
                </DropdownMenuItem>

                {/* Theme Toggle */}
                <DropdownMenuItem
                  onSelect={() => {
                    const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
                    if (currentTheme === 'dark') {
                      document.documentElement.classList.remove('dark');
                      localStorage.setItem('theme', 'light');
                    } else {
                      document.documentElement.classList.add('dark');
                      localStorage.setItem('theme', 'dark');
                    }
                  }}
                  className="px-3 py-2 rounded hover:bg-white/10 cursor-pointer"
                >
                  Theme: {typeof window !== "undefined" && document.documentElement.classList.contains('dark') ? 'Switch to Light' : 'Switch to Dark'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenuPortal>
        </DropdownMenu>
      </div>
    </motion.aside>
  )
}