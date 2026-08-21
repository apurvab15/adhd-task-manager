"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-indigo-100">
      <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-6 py-12">
        <div className="w-full space-y-10 text-center">
          <div className="space-y-4">
            <h1 className="text-6xl font-bold text-indigo-900">ADHD Task Manager</h1>
            <p className="mx-auto max-w-xl text-lg text-indigo-700">
              A task manager that matches how your brain works — take the quiz, or jump in and try a type.
            </p>
          </div>

          <div className="mx-auto grid w-full max-w-3xl gap-6 sm:grid-cols-2">
            <Link
              href="/assessment"
              className="group flex min-h-44 flex-col items-center justify-center rounded-3xl bg-indigo-600 px-8 py-10 text-white shadow-lg shadow-indigo-500/40 transition-all duration-300 hover:scale-105 hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-600/50"
            >
              <span className="text-2xl font-semibold leading-snug">
                Find what ADHD type you are
              </span>
              <span className="mt-3 text-sm font-medium text-indigo-100">
                Short quiz, then a matching UI
              </span>
            </Link>

            <Link
              href="/experiment"
              className="group flex min-h-44 flex-col items-center justify-center rounded-3xl border-2 border-indigo-600 bg-white px-8 py-10 text-indigo-900 shadow-lg shadow-indigo-200/60 transition-all duration-300 hover:scale-105 hover:bg-indigo-50 hover:shadow-xl"
            >
              <span className="text-2xl font-semibold leading-snug">Experiment</span>
              <span className="mt-3 text-sm font-medium text-indigo-600">
                Skip the quiz and hop between types
              </span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
