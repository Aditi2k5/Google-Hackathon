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

import {
  FileText,
  Download,
  ChevronDown,
  CheckCircle,
  LogOut,
  Loader2,
} from "lucide-react";

import { onAuthChange, signOutUser } from "@/lib/firebase";

// ✅ Writer API (unchanged)
import { getWriter, writerWriteStreaming } from "@/lib/writer";

// ✅ Rewriter UI (self-contained: uses /lib/rewriter internally)
import RewriterTab from "@/components/tabs/rewriter-tab";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  // which tool is active in the sidebar
  const [activeModule, setActiveModule] = useState<"writer" | "rewriter" | "proofreader" | "summarizer">("writer");

  // writer/other modules state (rewriter has its own internal state)
  const [editorContent, setEditorContent] = useState("Start writing your news story here...");
  const [loading, setLoading] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [versions, setVersions] = useState<string[]>(["v1.0"]);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  // auth
  useEffect(() => {
    const unsub = onAuthChange((u) => {
      setUser(u);
      if (!u) router.push("/auth");
    });
    return () => unsub();
  }, [router]);

  // ─────────────────────────────────────────────────────────
  // Invoke (Writer + mock modules). Rewriter is NOT handled here.
  // ─────────────────────────────────────────────────────────
  const handleInvoke = async () => {
    setLoading(true);
    setError("");
    setOutput("");

    try {
      const inputText = editorContent.trim();
      if (!inputText) {
        setOutput("Please add some text in the editor before invoking.");
        setLoading(false);
        return;
      }

      // 1) Writer: real on-device API
      if (activeModule === "writer") {
        await getWriter({
          tone: "neutral",
          format: "markdown",
          length: "long",
          expectedInputLanguages: ["en"],
          expectedContextLanguages: ["en"],
          outputLanguage: "en",
          sharedContext:
            "News article generation (AP style), factual placeholders, SEO tags, inverted pyramid.",
        });

        const prompt = `
You are a professional news writer drafting an article for a major publication.
Use Associated Press (AP) style and the inverted pyramid: lede, nut graf, body, sidebar.

Notes/Outline:
${inputText}

Rules:
- Use placeholders for uncertain facts: [SOURCE], [DATE], [LOCATION].
- Add quote slots: "QUOTE" — [OFFICIAL NAME], [POSITION].
- Include a bullet timeline of key events.
- End with a one-line SEO summary and 3–5 SEO tags.
- Output clean markdown, 300–2000 words.
        `.trim();

        let acc = "";
        const stream = await writerWriteStreaming(prompt, { context: "Smart Article Writer" });
        for await (const chunk of stream) {
          acc += chunk;
          setOutput(acc.replace(/\n\s*\n\s*\n/g, "\n\n").trim());
        }
        setLoading(false);
        return;
      }

      // 2) Mock modules (proofreader/summarizer)
      await new Promise((r) => setTimeout(r, 2000));

      const mockOutputs: Record<string, string> = {
        proofreader:
          "✓ Grammar: Excellent\n✓ Tone: Professional\n✓ Clarity: High\n✓ Engagement: Strong",
        summarizer:
          "• Key Point 1: Main development\n• Key Point 2: Secondary impact\n• Key Point 3: Future implications",
      };

      setOutput(mockOutputs[activeModule] || "Processing complete.");
      const newVersion = `v${versions.length + 1}.0`;
      setVersions((prev) => [...prev, newVersion]);
    } catch (e: any) {
      setError(e?.message || "Generation failed.");
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────
  // Exports (TXT / PDF / DOCX)
  // ─────────────────────────────────────────────────────────
  const handleExportTXT = () => {
    const content = `${editorContent}\n\n---\n\n${output}`;
    const a = document.createElement("a");
    a.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(content));
    a.setAttribute("download", "newsroom-forge-export.txt");
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // dynamic import for SSR safety
  const handleExportPDF = async () => {
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const el = document.createElement("div");
      el.innerHTML = `
        <h1 style="font-family:sans-serif;">Newsroom Forge Export</h1>
        <h3>Editor Content:</h3>
        <p>${editorContent.replace(/\n/g, "<br/>")}</p>
        <hr/>
        <h3>Generated Output:</h3>
        <div>${output.replace(/\n/g, "<br/>")}</div>
      `;
      html2pdf().set({
        margin: 10,
        filename: "newsroom-forge-export.pdf",
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      }).from(el).save();
    } catch (e) {
      console.warn("PDF export not available:", e);
    }
  };

  const handleExportDOCX = async () => {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Newsroom Forge Export", bold: true, size: 32 })],
            }),
            new Paragraph({ text: "\nEditor Content:\n" }),
            new Paragraph({ text: editorContent }),
            new Paragraph({ text: "\nGenerated Output:\n" }),
            new Paragraph({ text: output }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, "newsroom-forge-export.docx");
  };

  // sign out
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
        <Sidebar
          activeModule={activeModule}
          onModuleChange={(mod) => {
            if (!loading) setActiveModule(mod as any); // block switching while generating
          }}
        />

        <div className="ml-56 sm:ml-64 flex-1 p-4 sm:p-6 md:p-8 pt-20 sm:pt-24 md:pt-28">
          <motion.div
            className="max-w-7xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Header row */}
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

                    {/* 👇 Portal to body so it can't be clipped by siblings */}
  <DropdownMenu.Portal>
    <DropdownMenu.Content
      sideOffset={6}
      align="end"
      collisionPadding={8}
      className="glass-news rounded-md p-2 shadow-lg text-xs sm:text-sm min-w-[170px] z-[100]"
    >
      <DropdownMenu.Item
        onSelect={handleExportTXT}
        className="cursor-pointer px-3 py-2 rounded hover:bg-white/10 transition"
      >
        Export as TXT
      </DropdownMenu.Item>

      <DropdownMenu.Item
        // onSelect={handleExportPDF} // if/when you re-enable PDF
        className="cursor-pointer px-3 py-2 rounded hover:bg-white/10 transition"
      >
        Export as PDF
      </DropdownMenu.Item>

      <DropdownMenu.Item
        onSelect={handleExportDOCX}
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
  </DropdownMenu.Portal>
</DropdownMenu.Root>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Main column */}
              <div className="lg:col-span-3 space-y-4">
                {activeModule === "rewriter" ? (
                  // 🔹 ONLY the Rewriter UI when module is "rewriter"
                  <RewriterTab />
                ) : (
                  // 🔸 Writer + other modules UI (unchanged)
                  <>
                    <EditorToolbar
                      onBold={() => console.log("Bold")}
                      onItalic={() => console.log("Italic")}
                      onHeading={() => console.log("Heading")}
                      onQuote={() => console.log("Quote")}
                      onLink={() => console.log("Link")}
                      onExport={handleExportTXT}
                      onSave={() => console.log("Save")}
                      onUndo={() => console.log("Undo")}
                    />

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

                    <motion.div
                      className="glass-lg p-4 sm:p-6 rounded-2xl sm:rounded-3xl"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="flex items-center gap-2 mb-4">
                        {loading ? (
                          <Loader2 className="h-4 sm:h-5 w-4 sm:w-5 text-indigo-400 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 sm:h-5 w-4 sm:w-5 text-green-400" />
                        )}
                        <h3 className="font-semibold text-sm sm:text-base">Output</h3>
                      </div>

                      <div className="prose prose-invert max-w-none text-sm sm:text-base leading-relaxed">
                        {output ? (
                          <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
                            {output}
                          </ReactMarkdown>
                        ) : (
                          <span className="text-muted-foreground italic">
                            Your result will appear here…
                          </span>
                        )}
                        {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
                      </div>
                    </motion.div>
                  </>
                )}
              </div>

              {/* Right panel */}
              {showRightPanel && (
                <motion.div
                  className="lg:col-span-1 space-y-4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Keep Invoke button for everything EXCEPT rewriter */}
                  {activeModule !== "rewriter" && (
                    <APIControls
                      module={activeModule}
                      loading={loading}
                      onInvoke={handleInvoke}
                    />
                  )}

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
