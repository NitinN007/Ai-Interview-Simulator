import { Button } from "@/components/ui/button";
// app/page.js
import Link from 'next/link';
import { Brain, ArrowRight } from 'lucide-react';
export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center px-6">
      <div className="max-w-2xl mx-auto text-center">
        {/* Logo */}
        <div className="flex items-center justify-center space-x-3 mb-12">
          <Brain className="h-12 w-12 text-blue-600" />
          <span className="text-3xl font-bold text-slate-900">InterviewAI</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
          Practice Interviews
          <span className="text-blue-600 block">Get AI Feedback</span>
        </h1>

        {/* Subtitle */}
        <p className="text-xl text-slate-600 mb-12 max-w-xl mx-auto leading-relaxed">
          Master your interview skills with AI-powered practice sessions and instant feedback
        </p>

        {/* Single CTA Button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center px-10 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          Get Started
          <ArrowRight className="ml-3 h-5 w-5" />
        </Link>

        {/* Simple Footer */}
        <div className="mt-20 text-sm text-slate-500">
          Ready to ace your next interview?
        </div>
      </div>
    </div>
  );
}
