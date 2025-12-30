"use client";

export default function HowItWorksPage() {
  const steps = [
    {
      title: "1️⃣ Add Your Job Info",
      description:
        "Start by entering your job role, description, and years of experience. This helps the AI generate relevant questions.",
    },
    {
      title: "2️⃣ Get AI-Generated Questions",
      description:
        "Our AI instantly creates 5 smart interview questions tailored to your role and skill level.",
    },
    {
      title: "3️⃣ Practice Your Answers",
      description:
        "Go through each question and prepare your responses confidently. Use them for real interviews or mock sessions.",
    },
    {
      title: "4️⃣ Track Your Progress",
      description:
        "Monitor your improvement and review previous sessions in the dashboard anytime.",
    },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">How It Works</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {steps.map((step, index) => (
          <div
            key={index}
            className="bg-white border rounded-2xl shadow-md p-6 hover:shadow-lg transition-all"
          >
            <h2 className="text-xl font-semibold mb-2">{step.title}</h2>
            <p className="text-gray-700 leading-relaxed">{step.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 text-center">
        <p className="text-gray-600 mb-4">
          Ready to start your AI-powered interview prep journey?
        </p>
        <button className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2 px-6 rounded-lg">
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
