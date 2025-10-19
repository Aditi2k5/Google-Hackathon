export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30 mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">© 2025 NoteGPT. All rights reserved.</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Powered by</span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
              Chrome Built-in AI
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
