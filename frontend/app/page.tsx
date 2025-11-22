"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-slate-100">
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center gap-8 px-6 py-12">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-zinc-900 mb-4">ADHD Task Manager</h1>
          <p className="text-xl text-zinc-600">Choose your mode to get started</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
          {/* Inattentive Card */}
          <Link
            href="/inattentive"
            className="group relative overflow-hidden rounded-3xl border-2 border-sky-200 bg-gradient-to-br from-sky-50 via-white to-blue-50 p-8 shadow-lg shadow-sky-100/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-sky-200/50"
          >
            <div className="relative z-10">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-xl bg-sky-500 p-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-8 w-8 text-white"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM9.555 7.168A1 1 0 0 0 8 8v4a1 1 0 0 0 1.555.832l3-2a1 1 0 0 0 0-1.664l-3-2Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-sky-900">Inattentive</h2>
              </div>
              <p className="text-zinc-700 leading-relaxed">
                Focus on one task at a time with a simplified, distraction-free interface designed for better concentration.
              </p>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-sky-400/0 to-blue-400/0 group-hover:from-sky-400/10 group-hover:to-blue-400/10 transition-all duration-300" />
          </Link>

          {/* Hyperactive Card */}
          <Link
            href="/hyperactive"
            className="group relative overflow-hidden rounded-3xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 via-white to-rose-50 p-8 shadow-lg shadow-violet-100/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-violet-200/50"
          >
            <div className="relative z-10">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-xl bg-violet-500 p-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-8 w-8 text-white"
                  >
                    <path d="M10.75 16.82A7.462 7.462 0 0 1 15 15.5c.71 0 1.396.098 2.046.282A.75.75 0 0 0 18 15.06v-11a.75.75 0 0 0-.546-.721A9.006 9.006 0 0 0 15 3a8.963 8.963 0 0 0-4.25 1.065V16.82ZM9.25 4.065A8.963 8.963 0 0 0 5 3c-.85 0-1.673.118-2.454.339A.75.75 0 0 0 2 4.06v11a.75.75 0 0 0 .954.721A7.506 7.506 0 0 1 5 15.5c1.579 0 3.042.487 4.25 1.32V4.065Z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-violet-900">Hyperactive</h2>
              </div>
              <p className="text-zinc-700 leading-relaxed">
                Manage multiple tasks with dynamic views, progress tracking, and engaging gamification features.
              </p>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-violet-400/0 to-rose-400/0 group-hover:from-violet-400/10 group-hover:to-rose-400/10 transition-all duration-300" />
          </Link>

          {/* Combined Card */}
          <Link
            href="/combined"
            className="group relative overflow-hidden rounded-3xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-8 shadow-lg shadow-orange-100/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-orange-200/50"
          >
            <div className="relative z-10">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-xl bg-orange-500 p-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-8 w-8 text-white"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9.293 2.293a1 1 0 0 1 1.414 0l7 7A1 1 0 0 1 17 11h-1v6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6H3a1 1 0 0 1-.707-1.707l7-7Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-orange-900">Combined</h2>
              </div>
              <p className="text-zinc-700 leading-relaxed">
                Switch between modes seamlessly with a flexible interface that adapts to your needs throughout the day.
              </p>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-orange-400/0 to-amber-400/0 group-hover:from-orange-400/10 group-hover:to-amber-400/10 transition-all duration-300" />
          </Link>
        </div>
      </main>
    </div>
  );
}
