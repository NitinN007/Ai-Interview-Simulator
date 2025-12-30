"use client";
import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { GoogleGenerativeAI } from "@google/generative-ai";

export default function QuestionsPage() {
  const searchParams = useSearchParams();
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [score, setScore] = useState(null);
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  // --- 1️⃣ Load Questions ---
 useEffect(() => {
  const dataParam = searchParams.get("data");
  if (dataParam) {
    try {
      const parsed = JSON.parse(decodeURIComponent(dataParam));
      setQuestions(parsed);
      startRecording();
    } catch (err) {
      console.error("Error parsing data:", err);
    }
  }
}, [searchParams]);

  // --- 2️⃣ Start Webcam Recording ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      videoRef.current.srcObject = stream;
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        chunksRef.current = [];
        await evaluateInterview(blob);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      console.error("Camera error:", err);
    }
  };

  // --- 3️⃣ Stop Recording & Evaluate ---
  const finishInterview = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // --- 4️⃣ Gemini Evaluation ---
  const evaluateInterview = async (videoBlob) => {
    const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Evaluate this mock interview recording. Give a score out of 100 based on confidence, tone, and relevance. Respond only with a number.`;

    try {
      const result = await model.generateContent([
        prompt,
        { inlineData: { mimeType: "video/webm", data: await blobToBase64(videoBlob) } },
      ]);

      const text = result.response.text();
      setScore(text);
    } catch (err) {
      console.error("Evaluation error:", err);
      setScore("Error evaluating.");
    }
  };

  // --- 5️⃣ Utility: Convert Blob to Base64 ---
  const blobToBase64 = (blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Interview Session</h1>

      <video ref={videoRef} autoPlay muted className="w-80 rounded-md shadow mb-4" />

      {questions.length > 0 && currentQ < questions.length ? (
        <div>
          <p className="text-lg mb-4">{currentQ + 1}. {questions[currentQ]}</p>
          <button
            onClick={() => setCurrentQ((prev) => prev + 1)}
            className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
          >
            Next Question
          </button>
          {currentQ === questions.length - 1 && (
            <button
              onClick={finishInterview}
              className="ml-4 bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
            >
              Finish Interview
            </button>
          )}
        </div>
      ) : (
        score && (
          <div className="mt-6 text-center">
            <h2 className="text-xl font-semibold">Your Interview Score:</h2>
            <p className="text-4xl font-bold mt-2">{score}/100</p>
          </div>
        )
      )}
    </div>
  );
}
