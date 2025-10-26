"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { EditorToolbar } from "@/components/editor-toolbar";
import { APIControls } from "@/components/api-controls";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  FileText,
  Download,
  ChevronDown,
  CheckCircle,
  LogOut,
} from "lucide-react";
import {
  auth,
  onAuthChange,
  signOutUser,
} from "@/lib/firebase";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeModule, setActiveModule] = useState("writer");
  const [editorContent, setEditorContent] = useState(
    "Start writing your news story here..."
  );
  const [loading, setLoading] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [versions, setVersions] = useState<string[]>(["v1.0"]);
  const [output, setOutput] = useState("");

  // ✅ Listen for Firebase Auth changes
  useEffect(() => {
    const unsubscribe = onAuthChange((u) => {
      setUser(u);
      if (!u) router.push("/auth");
    });
    return () => unsubscribe();
  }, [router]);

  // ✅ Generate mock AI output
  const handleInvoke = async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const mockOutputs: Record<string, string> = {
      writer:
        "Breaking News: New developments in the story. This is a compelling narrative that captures the essence of the event.",
      rewriter:
        "In a significant turn of events, new information has emerged regarding the ongoing situation. The implications are substantial.",
      proofreader:
        "✓ Grammar: Excellent\n✓ Tone: Professional\n✓ Clarity: High\n✓ Engagement: Strong",
      summarizer:
        "• Key Point 1: Main development\n• Key Point 2: Secondary impact\n• Key Point 3: Future implications",
    };

    setOutput(mockOutputs[activeModule] || "Processing complete.");
    setLoading(false);

    const newVersion = `v${versions.length + 1}.0`;
    setVersions((prev) => [...prev, newVersion]);
  };

  // ✅ Export as TXT
  const handleExport = () => {
    const content = `${editorContent}\n\n---\n\n${output}`;
    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/plain;charset=utf-8," + encodeURIComponent(content)
    );
    element.setAttribute("download", "newsroom-forge-export.txt");
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // ✅ Sign out
  const handleLogout = async () => {
    await signOutUser();
    router.push("/auth");
  };

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading dashboard...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Header showUserMenu={true} />

      <div className="flex">
        <Sidebar activeModule={activeModule} onModuleChange={setActiveModule} />

        <div className="ml-56 sm:ml-64 flex-1 p-4 sm:p-6 md:p-8 pt-20 sm:pt-24 md:pt-28">
          <motion.div
            className="max-w-7xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold gradient-text typewriter-headline">
                  {activeModule.charAt(0).toUpperCase() + activeModule.slice(1)}
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  AI-powered content {activeModule}
                </p>
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRightPanel(!showRightPanel)}
                  className="glass-sm border-white/20 text-xs sm:text-sm py-2 sm:py-3"
                >
                  {showRightPanel ? "Hide" : "Show"} Controls
                </Button>

                {/* ✅ Fixed Dropdown Menu */}
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="glass-sm border-white/20 bg-transparent text-xs sm:text-sm py-2 sm:py-3 flex items-center"
                    >
                      <Download className="h-3 sm:h-4 w-3 sm:w-4 mr-2" />
                      Export
                      <ChevronDown className="h-3 sm:h-4 w-3 sm:w-4 ml-2" />
                    </Button>
                  </DropdownMenu.Trigger>

                  <DropdownMenu.Content
                    sideOffset={6}
                    className="glass-news rounded-md p-2 shadow-lg text-xs sm:text-sm min-w-[150px]"
                  >
                    <DropdownMenu.Item
                      onSelect={handleExport}
                      className="cursor-pointer px-3 py-2 rounded hover:bg-white/10 transition"
                    >
                      Export as TXT
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      className="cursor-pointer px-3 py-2 rounded hover:bg-white/10 transition"
                    >
                      Export as PDF
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      className="cursor-pointer px-3 py-2 rounded hover:bg-white/10 transition"
                    >
                      Export as DOCX
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator className="h-px my-2 bg-white/10" />
                    <DropdownMenu.Item
                      onSelect={handleLogout}
                      className="cursor-pointer px-3 py-2 rounded text-red-400 hover:bg-red-500/10 transition flex items-center gap-2"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign Out
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Root>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Main Editor */}
              <div className="lg:col-span-3 space-y-4">
                <EditorToolbar
                  onBold={() => console.log("Bold")}
                  onItalic={() => console.log("Italic")}
                  onHeading={() => console.log("Heading")}
                  onQuote={() => console.log("Quote")}
                  onLink={() => console.log("Link")}
                  onExport={handleExport}
                  onSave={() => console.log("Save")}
                  onUndo={() => console.log("Undo")}
                />

                {/* Editor Canvas */}
                <motion.div
                  className="glass-lg p-4 sm:p-6 md:p-8 min-h-[400px] sm:min-h-[500px] md:min-h-[calc(100vh-300px)] rounded-2xl sm:rounded-3xl"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <textarea
                    value={editorContent}
                    onChange={(e) => setEditorContent(e.target.value)}
                    className="w-full h-full bg-transparent text-foreground placeholder-muted-foreground focus:outline-none resize-none text-sm sm:text-base"
                    placeholder="Start writing your news story here..."
                  />
                </motion.div>

                {/* Output Section */}
                {output && (
                  <motion.div
                    className="glass-lg p-4 sm:p-6 rounded-2xl sm:rounded-3xl"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle className="h-4 sm:h-5 w-4 sm:w-5 text-green-400 flex-shrink-0" />
                      <h3 className="font-semibold text-sm sm:text-base">
                        Output
                      </h3>
                    </div>
                    <p className="text-foreground whitespace-pre-wrap text-xs sm:text-sm">
                      {output}
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Right Panel */}
              {showRightPanel && (
                <motion.div
                  className="lg:col-span-1 space-y-4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <APIControls
                    module={activeModule}
                    loading={loading}
                    onInvoke={handleInvoke}
                  />

                  {/* Versions */}
                  <Card className="glass-news p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                      Versions
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {versions.map((version) => (
                        <button
                          key={version}
                          className="w-full text-left px-3 py-2 rounded-lg text-xs sm:text-sm hover:bg-white/10 transition-colors"
                        >
                          {version}
                        </button>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
