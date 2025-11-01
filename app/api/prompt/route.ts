// app/api/prompt/route.ts
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export async function POST(req: Request) {
  try {
    const { seed } = await req.json();

    if (!seed?.trim()) {
      return NextResponse.json(
        { error: "Seed is required" },
        { status: 400 }
      );
    }

    const prompt = `
You are a senior news editor. Generate **5 original, timely, and newsworthy article topics** based on the seed below.

Seed: "${seed.trim()}"

Requirements:
- Each topic must be **fresh and relevant to 2025**.
- Include: 
  - **title** (punchy headline)
  - **hook** (1-sentence teaser)
  - **keywords** (3–5 SEO tags)
  - **timeliness** (why now? e.g. "EU vote tomorrow")
- Output **valid JSON array** only.
- No markdown, no explanations.

Example:
[
  {
    "title": "EU AI Act Phase 2: €50M Fines Begin Next Week",
    "hook": "Starting Monday, AI firms face automatic audits and multimillion-euro penalties.",
    "keywords": ["EU AI Act", "fines", "compliance", "regulation"],
    "timeliness": "Phase 2 enforcement begins November 3, 2025"
  }
]
`.trim();

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Extract JSON array
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON array in response");

    const topics = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(topics) || topics.length === 0) {
      throw new Error("Invalid topics generated");
    }

    return NextResponse.json(topics);
  } catch (error: any) {
    console.error("[Prompt API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate topics" },
      { status: 500 }
    );
  }
}