import { Card } from "@/components/ui/card"

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">About NoteGPT</h1>
          <p className="text-muted-foreground">Learn about our AI-powered writing assistant</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-foreground mb-3">What is NoteGPT?</h2>
            <p className="text-muted-foreground">
              NoteGPT is a modern web application that leverages Chrome's built-in AI capabilities (Gemini Nano) to help
              you write better. All processing happens on-device, ensuring your data stays private.
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold text-foreground mb-3">Privacy First</h2>
            <p className="text-muted-foreground">
              Your text never leaves your device. All AI processing happens locally using Chrome's built-in Gemini Nano
              model, ensuring complete privacy and security.
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold text-foreground mb-3">Key Features</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Summarize long texts instantly</li>
              <li>• Rewrite content in different styles</li>
              <li>• Proofread and improve your writing</li>
              <li>• All processing on-device</li>
            </ul>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold text-foreground mb-3">Browser Support</h2>
            <p className="text-muted-foreground">
              NoteGPT requires Chrome with built-in AI features enabled. Check the home page to see if your browser
              supports these features.
            </p>
          </Card>
        </div>

        <Card className="p-6 bg-primary/5 border-primary/20">
          <h2 className="text-xl font-semibold text-foreground mb-3">Technology Stack</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
            <div>Next.js 15</div>
            <div>React 19</div>
            <div>TypeScript</div>
            <div>Tailwind CSS</div>
            <div>Chrome AI APIs</div>
            <div>Gemini Nano</div>
          </div>
        </Card>
      </div>
    </div>
  )
}
