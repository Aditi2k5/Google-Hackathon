"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Download, Loader2 } from "lucide-react";
import { onAuthChange, signOutUser } from "@/lib/firebase";

import PromptApiTab from "@/components/tabs/prompt-tab";
import WriterTab from "@/components/tabs/writer-tab";
import RewriterTab from "@/components/tabs/rewriter-tab";
import TranslatorTab from "@/components/tabs/translator-tab";
import { useRef } from "react";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeModule, setActiveModule] = useState<
    "prompt-api" | "writer" | "rewriter" | "translator"
  >("prompt-api");
  const [showRightPanel, setShowRightPanel] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthChange((currentUser) => {
      setUser(currentUser);
      setLoading(false);

      // Redirect to auth if not logged in
      if (!currentUser) {
        router.replace("/auth");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleExport = (format: 'txt' | 'docx') => {
    // Get the content from the current active tab
    const content = contentRef.current?.innerText || '';
    
    if (!content || content.trim() === '' || content.includes('will appear here')) {
      alert('No content to export. Please generate some content first.');
      return;
    }

    if (format === 'txt') {
      // Export as TXT
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeModule}-export-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (format === 'docx') {
      alert('DOCX export will be implemented with a document generation library. For now, please use TXT export.');
    }
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if no user (will redirect)
  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background">
      <Header showUserMenu={true} />

      <div className="flex">
        <Sidebar activeModule={activeModule} onModuleChange={setActiveModule} />

        {/* Increased top padding to prevent header overlap */}
        <div className="ml-56 sm:ml-64 flex-1 p-4 sm:p-6 md:p-8 pt-20 sm:pt-24 md:pt-28">
          <motion.div 
            className="max-w-7xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* Page title + controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold gradient-text">
                  {activeModule.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase())}
                </h1>
                <p className="text-sm text-muted-foreground">AI-powered {activeModule}</p>
              </div>

              <div className="flex gap-2">
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" /> Export
                    </Button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content className="glass-news rounded-md p-2 shadow-lg text-sm min-w-[160px] z-[100]">
                      <DropdownMenu.Item 
                        onSelect={() => handleExport('txt')}
                        className="cursor-pointer px-3 py-2 rounded hover:bg-white/10"
                      >
                        Export as TXT
                      </DropdownMenu.Item>
                      <DropdownMenu.Item 
                        onSelect={() => handleExport('docx')}
                        className="cursor-pointer px-3 py-2 rounded hover:bg-white/10"
                      >
                        Export as DOCX
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
              {/* ---------- MAIN CONTENT ---------- */}
              <div 
                ref={contentRef}
                className={showRightPanel ? "lg:col-span-3 w-full" : "lg:col-span-4 w-full"}
              >
                {activeModule === "prompt-api" ? (
                  <PromptApiTab />
                ) : activeModule === "writer" ? (
                  <WriterTab />
                ) : activeModule === "rewriter" ? (
                  <RewriterTab />
                ) : (
                  <TranslatorTab />
                )}
              </div>

              {/* ---------- RIGHT PANEL (controls) ---------- */}
              {showRightPanel && (
                <motion.div
                  className="lg:col-span-1 space-y-4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}