"use client";
import React, { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";

export default function QuestionsPage() {
  const searchParams = useSearchParams();
  const [questions, setQuestions] = useState([]);
  const [videoURL, setVideoURL] = useState(null);
  const [score, setScore] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const mediaRecorderRef = useRef(null);
  const videoRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    const dataParam = searchParams.get("data");
    if (dataParam) {
      const data = JSON.parse(decodeURIComponent(dataParam));
      setQuestions(data);
    }
  }, [searchParams]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      videoRef.current.srcObject = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const videoURL = URL.createObjectURL(blob);
        setVideoURL(videoURL);
        analyzeVideoWithAI(blob);
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Unable to access camera or microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const analyzeVideoWithAI = async (blob) => {
    setLoading(true);
    setScore(null);
    setFeedback(null);
    try {
      const base64Video = await blobToBase64(blob);
      const res = await fetch("/api/analyze-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64Video }),
      });

      if (!res.ok) {
        throw new Error("AI analysis failed");
      }

      const data = await res.json();
      setScore(data.score || 0);
      setFeedback(data.feedback || null);
    } catch (error) {
      console.error("AI analysis error:", error);
      setScore(Math.floor(Math.random() * 41) + 60);
      setFeedback("AI analysis failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const blobToBase64 = (blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-8 flex flex-col items-center">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg p-8 transition-all">
        <h2 className="text-3xl font-extrabold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
          Interview Questions
        </h2>

        <ul className="mb-8 space-y-3">
          {questions.map((q, idx) => (
            <li
              key={idx}
              className="border border-gray-200 p-4 rounded-lg shadow-sm bg-gray-50 hover:bg-gray-100 transition-all"
            >
              <span className="font-semibold text-indigo-700">{idx + 1}.</span>{" "}
              {q}
            </li>
          ))}
        </ul>

        {/* Hidden video (records but not visible) */}
        <video ref={videoRef} autoPlay muted className="hidden" />

        <div className="flex justify-center gap-6 mt-6">
          {!recording ? (
            <button
              onClick={startRecording}
              className="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:bg-green-600 transition-all"
            >
              🎥 Start Interview
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="bg-red-500 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:bg-red-600 transition-all"
            >
              ⏹ Submit Interview
            </button>
          )}
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="flex flex-col items-center mt-10">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600 font-medium">
              Analyzing your responses with AI...
            </p>
          </div>
        )}

        {/* AI Score Result */}
        {!loading && score !== null && (
          <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-100 border border-indigo-200 p-6 rounded-xl shadow-inner text-center transition-all">
            <h3 className="text-2xl font-semibold text-gray-800 mb-2">
              Your AI Evaluation Score
            </h3>
            <p className="text-4xl font-extrabold text-indigo-600">
              {score}/100
            </p>
            <p className="text-gray-600 mt-2">
              {feedback
                ? feedback
                : score > 85
                ? "🌟 Excellent! You spoke confidently and clearly."
                : score > 70
                ? "👍 Good effort! Keep improving your clarity and tone."
                : "💡 Keep practicing — try to answer all questions next time."}
            </p>

            {feedback && (
              <div className="mt-4 text-left bg-white/60 p-3 rounded-lg border border-indigo-100">
                <strong className="text-gray-800">Detailed Feedback:</strong>
                <p className="text-sm text-gray-700 mt-1">{feedback}</p>
              </div>
            )}
          </div>
        )}

        {/* Show small recorded video preview */}
        {videoURL && (
          <div className="flex justify-center mt-8">
            <video
              controls
              src={videoURL}
              className="rounded-lg shadow-lg border border-gray-200"
              style={{ width: "240px", borderRadius: "12px" }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
