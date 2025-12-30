"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddNewInterview() {
  const [topic, setTopic] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [experience, setExperience] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, jobDescription, experience }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to generate questions");
      }

      const questions = await res.json();
      const encodedData = encodeURIComponent(JSON.stringify(questions));
      router.push(`/dashboard/questions?data=${encodedData}`);
    } catch (err) {
      console.error("Error:", err);
      alert("Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-blue-50 flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl p-8 transition-transform hover:scale-[1.01]">
        <h2 className="text-3xl font-extrabold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
          Create a New Interview
        </h2>
        <p className="text-gray-600 text-center mb-8">
          Generate AI-based interview questions tailored to your topic, job description, and experience level.
        </p>

        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          {/* Topic Input */}
          <div>
            <label className="block font-semibold text-gray-700 mb-2">Topic</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter topic (e.g., React, DSA, Java)"
              className="w-full border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-lg p-3 transition-all"
              required
            />
          </div>

          {/* Job Description Input */}
          <div>
            <label className="block font-semibold text-gray-700 mb-2">Job Description</label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Enter job description (optional but recommended)"
              className="w-full border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-lg p-3 h-28 resize-none transition-all"
            />
          </div>

          {/* Experience Input */}
          <div>
            <label className="block font-semibold text-gray-700 mb-2">Years of Experience</label>
            <input
              type="number"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="e.g., 2"
              className="w-full border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-lg p-3 transition-all"
              min="0"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className={`py-3 rounded-lg font-semibold text-white transition-all duration-200 ${
              loading
                ? "bg-indigo-400 cursor-not-allowed animate-pulse"
                : "bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg"
            }`}
            disabled={loading}
          >
            {loading ? "Generating..." : "🚀 Start Interview"}
          </button>
        </form>
      </div>
    </div>
  );
}
