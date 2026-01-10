import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

async function callGeminiWithRetry(model, content, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await model.generateContent(content);
    } catch (err) {
      const isRateLimited = err?.status === 429 || err?.statusCode === 429 || err?.message?.includes('429');
      if (isRateLimited && attempt < maxRetries) {
        const delay = Math.pow(2, attempt - 1) * 1000; // Exponential backoff
        console.log(`Rate limited. Retrying in ${delay}ms... (attempt ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw err;
      }
    }
  }
}

export async function POST(req) {
  try {
    const { topic = "", jobDescription = "", experience = "" } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return new NextResponse("Missing GEMINI_API_KEY in environment", { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are an interview question generator. Return a JSON array of 5 concise technical interview questions (strings) for the topic: "${topic}". Consider the job description: "${jobDescription}" and experience: ${experience}. Respond ONLY with a JSON array of strings, like ["Question 1?", "Question 2?", ...].`;

    const result = await callGeminiWithRetry(model, prompt);
    let text = await result.response.text();

    // Remove markdown code blocks if present
    text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let questions = [];
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        questions = parsed.filter(q => typeof q === 'string' && q.trim());
      }
    } catch (e) {
      // Fallback: parse as numbered list
      questions = text
        .split("\n")
        .map((s) => s.replace(/^[\d]+\.\s*/, "").trim())
        .filter(q => q.length > 0);
    }

    return NextResponse.json(questions);
  } catch (err) {
    console.error("/api/generate-questions error:", err);
    return new NextResponse(String(err?.message || "Server error"), { status: 500 });
  }
}
