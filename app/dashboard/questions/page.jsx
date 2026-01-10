"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";

/* ---------------- SAFE PARSER ---------------- */
const parseQuestionsSafely = (raw) => {
  if (!raw) return [];

  let cleaned = raw;

  // Remove markdown code blocks
  cleaned = cleaned.replace(/```json/gi, "");
  cleaned = cleaned.replace(/```/g, "");

  // Remove numbered lines like "1. "
  cleaned = cleaned.replace(/^\d+\.\s*/gm, "");

  cleaned = cleaned.trim();

  try {
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Question parsing failed:", e);
    return [];
  }
};

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
  const streamRef = useRef(null);

  /* ---------------- LOAD QUESTIONS ---------------- */
  useEffect(() => {
    const dataParam = searchParams.get("data");
    if (!dataParam) return;

    const decoded = decodeURIComponent(dataParam);
    const parsedQuestions = parseQuestionsSafely(decoded);

    setQuestions(parsedQuestions);
  }, [searchParams]);

  /* ---------------- CLEANUP ---------------- */
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (videoURL) URL.revokeObjectURL(videoURL);
    };
  }, [videoURL]);

  /* ---------------- RECORDING ---------------- */
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      streamRef.current = stream;
      videoRef.current.srcObject = stream;

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("video/webm")
          ? "video/webm"
          : "",
      });

      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = handleStop;

      recorder.start();
      setRecording(true);
    } catch (err) {
      alert("Camera or microphone permission denied.");
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
    setRecording(false);
  };

  const handleStop = async () => {
    const blob = new Blob(chunksRef.current, { type: "video/webm" });

    if (videoURL) URL.revokeObjectURL(videoURL);
    const url = URL.createObjectURL(blob);
    setVideoURL(url);

    analyzeVideo(blob);
  };

  /* ---------------- AI ANALYSIS ---------------- */
  const analyzeVideo = async (blob) => {
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

      const data = await res.json();
      setScore(data.score ?? 0);
      setFeedback(data.feedback ?? "Good attempt. Keep practicing.");
    } catch {
      setScore(0);
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

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 p-8 flex justify-center">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg p-8">

        <h2 className="text-3xl font-bold text-center mb-6 text-indigo-600">
          AI Mock Interview
        </h2>

        <ul className="space-y-3 mb-6">
          {questions.map((q, i) => (
            <li key={i} className="bg-gray-50 p-4 rounded-lg border">
              <span className="font-semibold text-indigo-600">{i + 1}.</span>{" "}
              {q}
            </li>
          ))}
        </ul>

        <video ref={videoRef} autoPlay muted className="hidden" />

        <div className="flex justify-center gap-6">
          {!recording ? (
            <button
              onClick={startRecording}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold"
            >
              🎥 Start Interview
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold"
            >
              ⏹ Submit Interview
            </button>
          )}
        </div>

        {loading && (
          <div className="text-center mt-6">
            <div className="w-8 h-8 mx-auto border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-gray-600">Analyzing with AI…</p>
          </div>
        )}

        {!loading && score !== null && (
          <div className="mt-8 bg-indigo-50 p-6 rounded-xl text-center">
            <h3 className="text-xl font-semibold">AI Score</h3>
            <p className="text-4xl font-bold text-indigo-600">{score}/100</p>
            <p className="mt-2 text-gray-700">{feedback}</p>
          </div>
        )}

        {videoURL && (
          <div className="flex justify-center mt-6">
            <video src={videoURL} controls className="rounded-lg w-60" />
          </div>
        )}
      </div>
    </div>
  );
}
