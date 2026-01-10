import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const MAX_BASE64_MB = 8; // ✅ increase/decrease based on Vercel limits
const MAX_RETRIES = 3;

// ✅ retry wrapper
async function callGeminiWithRetry(fn, maxRetries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const msg = String(err?.message || "");
      const isRateLimited =
        err?.status === 429 ||
        err?.statusCode === 429 ||
        msg.includes("429") ||
        msg.toLowerCase().includes("rate");

      if (isRateLimited && attempt < maxRetries) {
        const delay = Math.pow(2, attempt - 1) * 1000;
        console.log(
          `Rate limited. Retrying in ${delay}ms... (${attempt}/${maxRetries})`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw err;
      }
    }
  }
}

// ✅ extract JSON even if Gemini returns ```json ... ```
function extractJson(text) {
  if (!text) return null;

  let cleaned = text.trim();
  cleaned = cleaned.replace(/```json/gi, "");
  cleaned = cleaned.replace(/```/g, "");
  cleaned = cleaned.trim();

  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;

  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

// ✅ estimate base64 size
function estimateBase64SizeMB(base64) {
  // base64 size ≈ (length * 3/4) bytes
  const bytes = Math.floor((base64.length * 3) / 4);
  return bytes / (1024 * 1024);
}

export async function POST(req) {
  try {
    const { base64Video = "" } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing GEMINI_API_KEY in environment" },
        { status: 400 }
      );
    }

    if (!base64Video) {
      return NextResponse.json(
        { error: "base64Video is required" },
        { status: 400 }
      );
    }

    // ✅ remove "data:video/webm;base64," if present
    const cleanedBase64 = base64Video.includes("base64,")
      ? base64Video.split("base64,")[1]
      : base64Video;

    // ✅ reject big payload early (prevents Vercel crash)
    const sizeMB = estimateBase64SizeMB(cleanedBase64);
    if (sizeMB > MAX_BASE64_MB) {
      return NextResponse.json(
        {
          error: "Video too large",
          message: `Your video is ~${sizeMB.toFixed(
            2
          )} MB. Please record a shorter / lower quality video (max ${MAX_BASE64_MB} MB).`,
        },
        { status: 413 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
You are an interview evaluator.
Analyze the provided video and return ONLY raw JSON.
Do NOT use markdown.
Do NOT wrap in triple backticks.

Return format:
{"score":0,"feedback":"short constructive feedback"}

Score should reflect correct answers and speaking confidence, clarity, and relevance.
`.trim();

    const result = await callGeminiWithRetry(() =>
      model.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: "video/webm",
                  data: cleanedBase64,
                },
              },
            ],
          },
        ],
      })
    );

    const raw = result.response.text();

    const parsed = extractJson(raw);
    if (parsed && typeof parsed.score !== "undefined") {
      return NextResponse.json({
        score: Math.min(100, Math.max(0, Number(parsed.score) || 0)),
        feedback: String(parsed.feedback || "").trim(),
      });
    }

    // fallback if JSON not returned
    const numMatch = raw.match(/(\d{1,3})/);
    const score = numMatch ? Math.min(100, parseInt(numMatch[1], 10)) : 0;
    const feedback = raw.replace(/\r?\n/g, " ").trim();

    return NextResponse.json({ score, feedback });
  } catch (err) {
    console.error("/api/analyze-video error:", err);

    // ✅ return clean JSON error always
    return NextResponse.json(
      {
        error: "AI analysis failed",
        message: String(err?.message || "Server error"),
      },
      { status: 500 }
    );
  }
}
