"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-6xl font-bold gradient-text mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-8">Page not found. Let's get you back on track.</p>
        <Link href="/">
          <Button className="glass-sm bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-6 shadow-xl">
            Return Home
          </Button>
        </Link>
      </motion.div>
    </main>
  )
}
