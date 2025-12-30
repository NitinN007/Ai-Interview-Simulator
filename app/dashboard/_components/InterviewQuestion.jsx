// app/dashboard/_components/InterviewQuestions.jsx
"use client";

export default function InterviewQuestions({ questions }) {
  if (!questions?.length) return null;

  return (
    <div className="mt-6 p-4 border rounded-lg bg-secondary/40 shadow-sm">
      <h3 className="font-bold text-xl mb-4">Interview Questions</h3>
      <ol className="list-decimal list-inside space-y-2">
        {questions.map((q, index) => (
          <li key={index} className="text-base text-gray-800">
            {q}
          </li>
        ))}
      </ol>
    </div>
  );
}