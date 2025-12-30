import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req) {
  try {
    const { topic = "", jobDescription = "", experience = "" } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return new NextResponse("Missing GEMINI_API_KEY in environment", { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are an interview question generator. Return a JSON array of 5 concise technical interview questions (strings) for the topic: "${topic}". Consider the job description: "${jobDescription}" and experience: ${experience}. Respond ONLY with a JSON array of strings, like ["Question 1?", "Question 2?", ...].`;

    const result = await model.generateContent(prompt);
    const text = await result.response.text();

    let questions = [];
    try {
      const parsed = JSON.parse(text.trim());
      if (Array.isArray(parsed)) questions = parsed;
    } catch (e) {
      questions = text
        .split("\n")
        .map((s) => s.replace(/^\d+\.\s*/, "").trim())
        .filter(Boolean);
    }

    return NextResponse.json(questions);
  } catch (err) {
    console.error("/api/generate-questions error:", err);
    return new NextResponse(String(err?.message || "Server error"), { status: 500 });
  }
}
