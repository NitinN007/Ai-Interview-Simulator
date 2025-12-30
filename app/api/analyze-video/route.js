import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req) {
  try {
    const { base64Video = "" } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return new NextResponse("Missing GEMINI_API_KEY in environment", { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `You are an interview evaluator. Analyze the provided video and return a JSON object: {"score": <0-100>, "feedback": "short constructive feedback text"}. Score should reflect speaking confidence, clarity, and relevance. Respond ONLY with valid JSON.`;

    const result = await model.generateContent([
      { text: prompt },
      {
        inlineData: {
          mimeType: "video/webm",
          data: base64Video,
        },
      },
    ]);

    const raw = await result.response.text();
    try {
      const parsed = JSON.parse(raw.trim());
      return NextResponse.json(parsed);
    } catch (err) {
      const numMatch = raw.match(/(\d{1,3})/);
      const score = numMatch ? parseInt(numMatch[1], 10) : 0;
      const feedback = raw.replace(/\r?\n/g, " ").trim();
      return NextResponse.json({ score, feedback });
    }
  } catch (err) {
    console.error("/api/analyze-video error:", err);
    return new NextResponse(String(err?.message || "Server error"), { status: 500 });
  }
}
