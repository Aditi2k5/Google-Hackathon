// app/api/translate/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { text, sourceLang = "auto", targetLang } = await req.json();

    if (!text?.trim() || !targetLang) {
      return NextResponse.json({ error: "Missing text or targetLang" }, { status: 400 });
    }

    // ---------- AUTO DETECT ----------
    let finalSource = sourceLang;
    if (sourceLang === "auto") {
      const detectModel = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash"  // Updated to stable 2.0, removed invalid apiVersion
      });
      const detectPrompt = `Return ONLY the 2-letter ISO language code (e.g. en, es, fr) of this text:\n"${text}"`;
      const detectResult = await detectModel.generateContent(detectPrompt);
      finalSource = detectResult.response.text().trim().toLowerCase();
    }

    // ---------- TRANSLATE ----------
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash"  // Updated to stable 2.0, removed invalid apiVersion
    });
    const translatePrompt = `Translate the following text from ${finalSource} to ${targetLang}. Return ONLY the translated text, keep formatting:\n\n"${text}"`;
    const result = await model.generateContent(translatePrompt);
    const translated = result.response.text().trim();

    return NextResponse.json({
      translated,
      detectedLang: finalSource,
      targetLang,
    });
  } catch (e: any) {
    console.error("Gemini error:", e);
    return NextResponse.json({ error: e.message || "Translation failed" }, { status: 500 });
  }
}