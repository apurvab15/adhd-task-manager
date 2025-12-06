"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const motivationalQuotes = [
    "The journey of a thousand miles begins with a single step.",
    "Every expert was once a beginner. Every pro was once an amateur. Start where you are.",
    "Progress, not perfection. Take that first step today.",
    "You don't have to be great to start, but you have to start to be great.",
    "The best time to start was yesterday. The second best time is now.",
    "Small steps every day lead to big achievements over time.",
    "Your potential is limitless when you take that first step forward.",
  ];

  const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-indigo-100">
      <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center gap-12 px-6 py-12">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-6xl font-bold text-indigo-900 mb-6">ADHD Task Manager</h1>
            <div className="max-w-2xl mx-auto">
              <blockquote className="text-2xl md:text-3xl font-light text-indigo-800 italic leading-relaxed">
                "{randomQuote}"
              </blockquote>
            </div>
          </div>
          
          <p className="text-lg text-indigo-700 max-w-xl mx-auto">
            Discover your personalized ADHD profile and unlock tools designed to help you thrive. 
            Let's begin your journey to better task management.
          </p>
          
          <div className="pt-4">
            <button
              onClick={() => router.push("/assessment")}
              className="group relative overflow-hidden rounded-full bg-indigo-600 px-12 py-4 text-xl font-semibold text-white shadow-lg shadow-indigo-500/50 transition-all duration-300 hover:scale-105 hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-600/60"
            >
              <span className="relative z-10">Let's Get Started</span>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-indigo-600">
            Already know your type?{" "}
            <Link href="/combined" className="inline-flex items-center justify-center rounded-lg p-2 bg-white border-2 border-indigo-600 text-indigo-600 transition-colors hover:bg-indigo-50" title="Task Manager">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" className="h-4 w-4">
                <path d="M152.1 38.2c9.9 8.9 10.7 24 1.8 33.9l-72 80c-4.4 4.9-10.6 7.8-17.2 7.9s-12.9-2.4-17.6-7L7 113C-2.3 103.6-2.3 88.4 7 79s24.6-9.4 33.9 0l22.1 22.1 55.1-61.2c8.9-9.9 24-10.7 33.9-1.8zm0 160c9.9 8.9 10.7 24 1.8 33.9l-72 80c-4.4 4.9-10.6 7.8-17.2 7.9s-12.9-2.4-17.6-7L7 273c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l22.1 22.1 55.1-61.2c8.9-9.9 24-10.7 33.9-1.8zM224 96c0-17.7 14.3-32 32-32H480c17.7 0 32 14.3 32 32s-14.3 32-32 32H256c-17.7 0-32-14.3-32-32zm0 160c0-17.7 14.3-32 32-32H480c17.7 0 32 14.3 32 32s-14.3 32-32 32H256c-17.7 0-32-14.3-32-32zM160 416c0-17.7 14.3-32 32-32H480c17.7 0 32 14.3 32 32s-14.3 32-32 32H192c-17.7 0-32-14.3-32-32zM48 368a48 48 0 1 1 0 96 48 48 0 1 1 0-96z"/>
              </svg>
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
