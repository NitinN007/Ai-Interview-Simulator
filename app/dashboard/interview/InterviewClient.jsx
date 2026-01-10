"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

const MAX_RECORDING_SECONDS = 15; // ✅ keep small for Vercel/serverless

export default function InterviewClient() {
  const searchParams = useSearchParams();

  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);

  const [isRecording, setIsRecording] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const [score, setScore] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  // --- Load Questions ---
  useEffect(() => {
    const dataParam = searchParams.get("data");
    if (dataParam) {
      try {
        const parsed = JSON.parse(decodeURIComponent(dataParam));
        setQuestions(parsed);

        // ✅ start recording automatically
        startRecording();
      } catch (err) {
        console.error("Error parsing data:", err);
        setError("Invalid questions data.");
      }
    }
    // eslint-disable-next-line
  }, [searchParams]);

  // ✅ stop camera when leaving page
  useEffect(() => {
    return () => stopCamera();
    // eslint-disable-next-line
  }, []);

  // --- Start Webcam Recording (LOW QUALITY) ---
  const startRecording = async () => {
    try {
      setError("");

      // ✅ lower-quality stream (important for base64 size)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 360 },
          frameRate: { ideal: 15, max: 20 },
        },
        audio: true,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // ✅ reduce bitrate to avoid huge video payload
      const recorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp8,opus",
        videoBitsPerSecond: 300_000, // ✅ reduce video quality drastically
        audioBitsPerSecond: 64_000,
      });

      recorder.ondataavailable = (e) => {
        if (e.data?.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        try {
          const blob = new Blob(chunksRef.current, { type: "video/webm" });
          chunksRef.current = [];

          // ✅ stop camera after recording
          stopCamera();

          await evaluateInterview(blob);
        } catch (err) {
          console.error("Stop handler error:", err);
          setError("Failed to process recorded video.");
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);

      // ✅ auto stop after limit
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          finishInterview();
        }
      }, MAX_RECORDING_SECONDS * 1000);
    } catch (err) {
      console.error("Camera error:", err);
      setError("Camera/Microphone permission denied or not available.");
    }
  };

  // --- Stop Recording ---
  const finishInterview = () => {
    try {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } catch (err) {
      console.error("Finish interview error:", err);
      setError("Failed to stop recording.");
    }
  };

  // ✅ Stop camera tracks
  const stopCamera = () => {
    try {
      const stream = streamRef.current;
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      streamRef.current = null;

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    } catch (err) {
      console.error("Stop camera error:", err);
    }
  };

  // --- Send to Backend API for Gemini Evaluation ---
  const evaluateInterview = async (videoBlob) => {
    setIsEvaluating(true);
    setError("");
    setScore(null);
    setFeedback("");

    try {
      const base64 = await blobToBase64(videoBlob);

      const res = await fetch("/api/analyze-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64Video: base64 }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || data?.error || "AI analysis failed");
      }

      setScore(data?.score ?? 0);
      setFeedback(data?.feedback || "");
    } catch (err) {
      console.error("Evaluation error:", err);
      setError(err?.message || "AI analysis failed");
    } finally {
      setIsEvaluating(false);
    }
  };

  // --- Blob to base64 ---
  const blobToBase64 = (blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(",")[1]); // remove prefix
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-3">Interview Session</h1>

      {/* STATUS */}
      <div className="mb-4 flex flex-wrap gap-2 items-center">
        <span
          className={`px-3 py-1 rounded-full text-sm font-semibold ${
            isRecording ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
          }`}
        >
          {isRecording ? "Recording..." : "Not Recording"}
        </span>

        {isEvaluating && (
          <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700">
            Evaluating...
          </span>
        )}

        <span className="text-sm text-gray-500">
          Max recording: {MAX_RECORDING_SECONDS}s
        </span>
      </div>

      {/* CAMERA */}
      <video ref={videoRef} autoPlay muted className="w-80 rounded-md shadow mb-4" />

      {/* ERROR */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
          {error}
        </div>
      )}

      {/* QUESTIONS */}
      {questions.length > 0 && currentQ < questions.length ? (
        <div>
          <p className="text-lg mb-4">
            {currentQ + 1}. {questions[currentQ]}
          </p>

          <button
            onClick={() => setCurrentQ((prev) => prev + 1)}
            className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
          >
            Next Question
          </button>

          {currentQ === questions.length - 1 && (
            <button
              onClick={finishInterview}
              disabled={isEvaluating}
              className="ml-4 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 disabled:opacity-60"
            >
              Finish Interview
            </button>
          )}
        </div>
      ) : (
        <>
          {isEvaluating && (
            <p className="mt-6 text-center text-lg font-semibold text-gray-700">
              AI is analyzing your interview...
            </p>
          )}

          {score !== null && !isEvaluating && (
            <div className="mt-6 text-center">
              <h2 className="text-xl font-semibold">Your Interview Score:</h2>
              <p className="text-4xl font-bold mt-2">{score}/100</p>

              {feedback && (
                <p className="mt-3 text-gray-600 max-w-xl mx-auto">{feedback}</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
