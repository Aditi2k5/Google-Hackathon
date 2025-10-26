"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Header } from "@/components/header"
import { Zap, RefreshCw, CheckCircle, Sparkles, ArrowRight, Star } from "lucide-react"

const features = [
  {
    icon: Zap,
    title: "Writer",
    description: "Generate compelling news drafts from raw information",
  },
  {
    icon: RefreshCw,
    title: "Rewriter",
    description: "Refine and restructure existing content",
  },
  {
    icon: CheckCircle,
    title: "Proofreader",
    description: "Polish grammar, style, and tone",
  },
  {
    icon: Sparkles,
    title: "Summarizer",
    description: "Create concise summaries of long-form content",
  },
]

const testimonials = [
  {
    name: "Sarah Chen",
    role: "News Editor",
    quote: "Newsroom Forge cut our drafting time in half.",
  },
  {
    name: "Marcus Johnson",
    role: "Journalist",
    quote: "The AI suggestions are remarkably accurate and helpful.",
  },
  {
    name: "Elena Rodriguez",
    role: "Content Director",
    quote: "Our team productivity increased dramatically.",
  },
]

export default function LandingPage() {
  const [activeTestimonial, setActiveTestimonial] = useState(0)

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <section className="min-h-screen flex items-center justify-center px-responsive py-responsive">
        <motion.div
          className="max-w-5xl mx-auto text-center w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="glass-news p-8 sm:p-12 md:p-16 mb-8">
            <motion.h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 gradient-text typewriter-headline"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              Break Stories, Not Deadlines
            </motion.h1>
            <motion.p
              className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              AI Forged for the Frontlines
            </motion.p>
            <motion.div
              className="flex gap-3 sm:gap-4 justify-center flex-wrap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              <Link href="/auth?tab=signup" className="w-full sm:w-auto">
                <Button className="glass-sm bg-indigo-500 hover:bg-indigo-600 text-white px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg shadow-xl w-full">
                  Join the Desk
                  <ArrowRight className="ml-2 h-4 sm:h-5 w-4 sm:w-5" />
                </Button>
              </Link>
              <Link href="/auth?tab=signin" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  className="glass-sm border-white/20 hover:bg-white/10 px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg bg-transparent w-full"
                >
                  Guest Wire
                </Button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

      <section className="py-responsive px-responsive">
        <motion.div
          className="max-w-6xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-12 md:mb-16 gradient-text"
            variants={itemVariants}
          >
            Powerful AI Modules
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div key={index} variants={itemVariants}>
                  <Card className="glass-news p-6 h-full hover:bg-white/10 transition-colors cursor-pointer">
                    <Icon className="h-10 sm:h-12 w-10 sm:w-12 text-indigo-400 mb-4" />
                    <h3 className="text-base sm:text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">{feature.description}</p>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </section>

      <section className="py-responsive px-responsive">
        <motion.div
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-12 md:mb-16 gradient-text">
            Loved by Newsrooms
          </h2>
          <div className="glass-news p-8 sm:p-12">
            <motion.div
              key={activeTestimonial}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 sm:h-5 w-4 sm:w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-lg sm:text-xl md:text-2xl mb-6 text-foreground">
                "{testimonials[activeTestimonial].quote}"
              </p>
              <p className="font-semibold text-sm sm:text-base">{testimonials[activeTestimonial].name}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">{testimonials[activeTestimonial].role}</p>
            </motion.div>
            <div className="flex gap-2 justify-center mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTestimonial(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === activeTestimonial ? "bg-indigo-500 w-8" : "bg-white/20 w-2"
                  }`}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      <section className="py-responsive px-responsive">
        <motion.div
          className="max-w-2xl mx-auto text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div className="glass-news p-8 sm:p-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your Newsroom?</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-8">
              Join hundreds of newsrooms using Newsroom Forge to accelerate their content creation.
            </p>
            <Link href="/auth?tab=signup" className="w-full sm:w-auto inline-block">
              <Button className="glass-sm bg-indigo-500 hover:bg-indigo-600 text-white px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg shadow-xl w-full">
                Get Started Now
                <ArrowRight className="ml-2 h-4 sm:h-5 w-4 sm:w-5" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </main>
  )
}
