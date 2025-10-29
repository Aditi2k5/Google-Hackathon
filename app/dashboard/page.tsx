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
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import TextareaAutosize from "react-textarea-autosize";
import {
  FileText,
  Download,
  ChevronDown,
  CheckCircle,
  LogOut,
  Loader2,
} from "lucide-react";

import { onAuthChange, signOutUser } from "@/lib/firebase";

// === REAL APIs ===
import { getWriter, writerWriteStreaming } from "@/lib/writer";
import { getProofreader, proofreaderStream } from "@/lib/proofreader";
import { getSummarizer, summarizerStream } from "@/lib/summarizer";

// === Rewriter (self-contained) ===
import RewriterTab from "@/components/tabs/rewriter-tab";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeModule, setActiveModule] = useState<"writer" | "rewriter" | "proofreader" | "summarizer">("writer");
  const [editorContent, setEditorContent] = useState("Start writing your news story here...");
  const [loading, setLoading] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [versions, setVersions] = useState<string[]>(["v1.0"]);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Auth
  useEffect(() => {
    const unsub = onAuthChange((u) => {
      setUser(u);
      if (!u) router.push("/auth");
    });
    return () => unsub();
  }, [router]);

  // === INVOKE ALL MODULES ===
  const handleInvoke = async () => {
    setLoading(true);
    setError("");
    setOutput("");
    setDownloadProgress(0);

    const input = editorContent.trim();
    if (!input) {
      setError("Please enter text in the editor.");
      setLoading(false);
      return;
    }

    try {
      // === 1. WRITER ===
      if (activeModule === "writer") {
        await getWriter({
          tone: "neutral",
          format: "markdown",
          length: "long",
          expectedInputLanguages: ["en"],
          expectedContextLanguages: ["en"],
          outputLanguage: "en",
          sharedContext: "AP-style news article, inverted pyramid, SEO, placeholders.",
          onDownloadProgress: (p) => setDownloadProgress(p),
        });

        const prompt = `
You are a professional news writer. Use AP style and inverted pyramid.
Outline:
${input}

- Use [SOURCE], [DATE], [LOCATION] for facts.
- Add quotes: "QUOTE" — [NAME], [TITLE].
- End with SEO summary + 3–5 tags.
- Output clean markdown.
        `.trim();

        let acc = "";
        const stream = await writerWriteStreaming(prompt, { context: "Article Writer" });
        for await (const chunk of stream) {
          acc += chunk;
          setOutput(acc.replace(/\n\s*\n\s*\n/g, "\n\n").trim());
        }
      }

      // === 2. PROOFREADER ===
      else if (activeModule === "proofreader") {
        await getProofreader({
          onDownloadProgress: (p) => setDownloadProgress(p),
        });

        let acc = "";
        for await (const chunk of proofreaderStream(input)) {
          acc += chunk;
          setOutput(acc);
        }
      }

      // === 3. SUMMARIZER ===
      else if (activeModule === "summarizer") {
        await getSummarizer({
          onDownloadProgress: (p: number) => setDownloadProgress(p),
        });

        let acc = "";
        for await (const chunk of summarizerStream(input)) {
          acc += chunk;
          setOutput(acc);
        }
      }

      // === 4. REWRITER: handled inside RewriterTab ===

      // Save version
      const newVersion = `v${versions.length + 1}.0`;
      setVersions((prev) => [...prev, newVersion]);
    } catch (e: any) {
      setError(e?.message || "AI failed. Check Chrome AI flags.");
    } finally {
      setLoading(false);
    }
  };

  // === EXPORTS ===
  const handleExportTXT = () => {
    const blob = new Blob([`${editorContent}\n\n---\n\n${output}`], { type: "text/plain" });
    saveAs(blob, "newsroom-forge.txt");
  };

  const handleExportDOCX = async () => {
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ children: [new TextRun({ text: "Newsroom Forge", bold: true, size: 32 })] }),
          new Paragraph({ text: "\nEditor Content:\n" }),
          new Paragraph({ text: editorContent }),
          new Paragraph({ text: "\nGenerated Output:\n" }),
          new Paragraph({ text: output }),
        ],
      }],
    });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, "newsroom-forge.docx");
  };

  const handleLogout = async () => {
    await signOutUser();
    router.push("/auth");
  };

  if (!user) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <main className="min-h-screen bg-background">
      <Header showUserMenu={true} />

      <div className="flex">
        <Sidebar
          activeModule={activeModule}
          onModuleChange={(mod) => !loading && setActiveModule(mod as any)}
        />

        <div className="ml-56 sm:ml-64 flex-1 p-4 sm:p-6 md:p-8 pt-20">
          <motion.div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold gradient-text">
                  {activeModule.charAt(0).toUpperCase() + activeModule.slice(1)}
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  AI-powered {activeModule}
                </p>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRightPanel(!showRightPanel)}
                >
                  {showRightPanel ? "Hide" : "Show"} Controls
                </Button>

                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" /> Export <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content className="glass-news rounded-md p-2 shadow-lg text-sm min-w-[160px] z-[100]">
                      <DropdownMenu.Item onSelect={handleExportTXT} className="cursor-pointer px-3 py-2 rounded hover:bg-white/10">
                        TXT
                      </DropdownMenu.Item>
                      <DropdownMenu.Item onSelect={handleExportDOCX} className="cursor-pointer px-3 py-2 rounded hover:bg-white/10">
                        DOCX
                      </DropdownMenu.Item>
                      <DropdownMenu.Separator className="h-px my-2 bg-white/10" />
                      <DropdownMenu.Item onSelect={handleLogout} className="text-red-400 cursor-pointer px-3 py-2 rounded hover:bg-red-500/10">
                        <LogOut className="h-3.5 w-3.5 mr-2" /> Sign Out
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Main Editor */}
              <div className="lg:col-span-3 space-y-4">
                {activeModule === "rewriter" ? (
                  <RewriterTab />
                ) : (
                  <>
                    <EditorToolbar
                      onBold={() => {}}
                      onItalic={() => {}}
                      onHeading={() => {}}
                      onQuote={() => {}}
                      onLink={() => {}}
                      onExport={handleExportTXT}
                      onSave={() => {}}
                      onUndo={() => {}}
                    />

                    <motion.div className="glass-lg p-6 rounded-3xl min-h-[500px]">
                      <TextareaAutosize
                        value={editorContent}
                        onChange={(e) => setEditorContent(e.target.value)}
                        className="w-full bg-transparent text-base resize-none outline-none"
                        minRows={12}
                        placeholder="Enter your text..."
                      />
                    </motion.div>

                    <motion.div className="glass-lg p-6 rounded-3xl">
                      <div className="flex items-center gap-2 mb-4">
                        {loading ? (
                          <Loader2 className="h-5 w-5 text-indigo-400 animate-spin" />
                        ) : (
                          <CheckCircle className="h-5 w-5 text-green-400" />
                        )}
                        <h3 className="font-semibold">Output</h3>
                        {downloadProgress > 0 && downloadProgress < 100 && (
                          <span className="text-xs text-gray-400">({downloadProgress}%)</span>
                        )}
                      </div>

                      <div className="prose prose-invert max-w-none">
                        {output ? (
                          <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
                            {output}
                          </ReactMarkdown>
                        ) : (
                          <span className="text-muted-foreground italic">
                            Result will appear here...
                          </span>
                        )}
                        {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
                      </div>
                    </motion.div>
                  </>
                )}
              </div>

              {/* Right Panel */}
              {showRightPanel && (
                <motion.div className="lg:col-span-1 space-y-4">
                  {activeModule !== "rewriter" && (
                    <APIControls
                      module={activeModule}
                      loading={loading}
                      onInvoke={handleInvoke}
                    />
                  )}

                  <Card className="glass-news p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-indigo-400" />
                      Versions
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {versions.map((v) => (
                        <button key={v} className="w-full text-left px-3 py-2 rounded text-sm hover:bg-white/10">
                          {v}
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