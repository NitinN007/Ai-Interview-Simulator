// file: gemini-example.js

import { GoogleGenerativeAI } from "@google/generative-ai";

async function run() {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    console.error("Please set the environment variable NEXT_PUBLIC_GEMINI_API_KEY");
    process.exit(1);
  }

  // Initialize Gemini client
  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    // Select the model (use gemini-1.5-flash or gemini-1.5-pro)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Generate content
    const result = await model.generateContent("Explain how recursion works in simple terms.");

    // Log the text response
    console.log(result.response.text());
  } catch (err) {
    console.error("Error calling Gemini API:", err);
  }
}

run();
