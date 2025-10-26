"use client"

import { useState } from "react"
import { signOutUser } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from '@radix-ui/react-avatar';
import { motion } from "framer-motion"

interface HeaderProps {
  showUserMenu?: boolean
}

export function Header({ showUserMenu = false }: HeaderProps) {
  const router = useRouter()
  const [email] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("userEmail") || "User"
    }
    return "User"
  })

  const handleLogout = () => {
    signOutUser
    router.push("/")
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-12 sm:h-14 md:h-16 glass-news border-b border-white/10 flex items-center justify-between px-4 sm:px-6 md:px-8">
      <motion.div
        className="flex items-center gap-2 sm:gap-3"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-lg sm:text-xl md:text-2xl font-bold gradient-text typewriter">Newsroom Forge</div>
      </motion.div>

      <div className="hidden sm:flex flex-1 mx-4 md:mx-8 overflow-hidden">
        <motion.div
          className="whitespace-nowrap text-xs md:text-sm text-muted-foreground typewriter"
          animate={{ x: ["100%", "-100%"] }}
          transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        >
          Forge Your Wire • API Ready • Deadline: Now • Breaking Drafts • Forge Your Wire • API Ready • Deadline: Now
        </motion.div>
      </div>

      {showUserMenu && (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 sm:h-10 sm:w-10">
              <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                <AvatarFallback className="bg-indigo-500 text-white text-xs sm:text-sm">
                  {email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="end" className="glass-news">
            <DropdownMenu.Item disabled className="text-xs text-muted-foreground">
              {email}
            </DropdownMenu.Item>
            <DropdownMenu.Item onSelect={handleLogout} className="text-xs sm:text-sm">
              Logout
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      )}
    </header>
  )
}
